import { BehaviorSubject, combineLatest } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";

import type { Subscriber, SnapshotCacheEntry } from "./types";
import { isServer, shallowEqual } from "./utils";

export class FieldStore<T extends Record<string, unknown>> {
  private subjects: { [K in keyof T]: BehaviorSubject<T[K]> };
  public setters: {
    [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
  };
  private callbacks: Partial<Record<keyof T, Subscriber<T[keyof T]>[]>> = {};

  // Optimized caching with per-field tracking
  private fieldVersions: Map<keyof T, number> = new Map();
  private cachedSnapshots: Map<string, SnapshotCacheEntry> = new Map();

  constructor(initialState: T) {
    this.subjects = {} as { [K in keyof T]: BehaviorSubject<T[K]> };
    this.setters = {} as typeof this.setters;

    // Single loop: initialize subjects + setters + versions
    (Object.keys(initialState) as (keyof T)[]).forEach((key) => {
      const value = initialState[key];

      // Create subject with distinctUntilChanged for performance
      (
        this.subjects as unknown as Record<keyof T, BehaviorSubject<T[keyof T]>>
      )[key] = new BehaviorSubject(value);

      // Initialize field version tracking
      this.fieldVersions.set(key, 0);

      const setterName = `set${
        String(key).charAt(0).toUpperCase() + String(key).slice(1)
      }` as keyof typeof this.setters;
      (this.setters as unknown as Record<string, (val: T[keyof T]) => void>)[
        setterName
      ] = (val: T[keyof T]) => this.set({ [key]: val } as Partial<T>);
    });
  }

  /** Get single field */
  get<K extends keyof T>(key: K): T[K] {
    return this.subjects[key].getValue();
  }

  /** Get entire store */
  getAll(): T {
    const result = {} as T;
    for (const key in this.subjects) result[key] = this.get(key);
    return result;
  }

  /** Set one or more fields with optimized change detection */
  set(partial: Partial<T>) {
    const changedKeys: (keyof T)[] = [];

    // First pass: collect actually changed keys
    for (const key in partial) {
      if (!(key in this.subjects)) continue;
      const newVal = partial[key]!;
      const oldVal = this.subjects[key].getValue();

      // Use Object.is for precise equality check
      if (!Object.is(oldVal, newVal)) {
        changedKeys.push(key as keyof T);
      }
    }

    if (changedKeys.length === 0) return; // No changes, early exit

    // Update field versions and invalidate only affected cache entries
    changedKeys.forEach((key) => {
      const currentVersion = this.fieldVersions.get(key) || 0;
      this.fieldVersions.set(key, currentVersion + 1);

      // Invalidate only cache entries that include this field
      const keysToDelete: string[] = [];
      this.cachedSnapshots.forEach((_, cacheKey) => {
        if (cacheKey.includes(String(key))) {
          keysToDelete.push(cacheKey);
        }
      });
      keysToDelete.forEach((key) => this.cachedSnapshots.delete(key));
    });

    // Second pass: actually update the values
    changedKeys.forEach((key) => {
      const newVal = partial[key]!;
      this.subjects[key].next(newVal);
      this.callbacks[key as keyof T]?.forEach((cb) => cb(newVal));
    });
  }

  /** Subscribe to a single field */
  observable<K extends keyof T>(key: K): BehaviorSubject<T[K]> {
    return this.subjects[key];
  }

  /** Serialize current state for SSR */
  serialize(): T {
    return this.getAll();
  }

  /** Hydrate store with state from server */
  hydrate(serverState: Partial<T>): void {
    this.set(serverState);
  }

  /** Optimized snapshot function for single field */
  private getSnapshotField<K extends keyof T>(key: K): () => T[K] {
    if (isServer) {
      // On server, just return the current value directly
      return () => this.get(key);
    }

    const cacheKey = `field:${String(key)}`;
    const currentVersion = this.fieldVersions.get(key) || 0;

    const cached = this.cachedSnapshots.get(cacheKey);
    if (cached && cached.version === currentVersion) {
      return cached.fn;
    }

    // Create optimized snapshot function
    let cachedResult: T[K] = this.get(key);
    let cachedVersion = currentVersion;

    const snapshotFn = () => {
      const fieldVersion = this.fieldVersions.get(key) || 0;
      if (cachedVersion !== fieldVersion) {
        cachedResult = this.get(key);
        cachedVersion = fieldVersion;
      }
      return cachedResult;
    };

    this.cachedSnapshots.set(cacheKey, {
      version: currentVersion,
      result: cachedResult,
      fn: snapshotFn,
    });

    return snapshotFn;
  }

  /** Optimized snapshot function for multiple fields */
  private getSnapshotFields<K extends keyof T>(keys: K[]): () => Pick<T, K> {
    if (isServer) {
      // On server, just return the current value directly
      return () => {
        const val = {} as Pick<T, K>;
        keys.forEach((k) => (val[k] = this.get(k)));
        return val;
      };
    }

    const sortedKeys = [...keys].sort();
    const cacheKey = `fields:${sortedKeys.map((k) => String(k)).join(",")}`;

    // Check if any involved field has changed
    const maxVersion = Math.max(
      ...sortedKeys.map((k) => this.fieldVersions.get(k) || 0)
    );

    const cached = this.cachedSnapshots.get(cacheKey);
    if (cached && cached.version === maxVersion) {
      return cached.fn;
    }

    // Create initial result
    let cachedResult: Pick<T, K> | null = null;
    let cachedVersion = -1;

    const snapshotFn = () => {
      const currentMaxVersion = Math.max(
        ...sortedKeys.map((k) => this.fieldVersions.get(k) || 0)
      );

      if (cachedVersion !== currentMaxVersion || cachedResult === null) {
        const newResult = {} as Pick<T, K>;
        let hasChanges = false;

        sortedKeys.forEach((k) => {
          const newVal = this.get(k);
          newResult[k] = newVal;

          if (cachedResult === null || !Object.is(cachedResult[k], newVal)) {
            hasChanges = true;
          }
        });

        // Only update if there are actual changes
        if (hasChanges || cachedResult === null) {
          cachedResult = newResult;
          cachedVersion = currentMaxVersion;
        }
      }

      return cachedResult!;
    };

    this.cachedSnapshots.set(cacheKey, {
      version: maxVersion,
      result: null,
      fn: snapshotFn,
    });

    return snapshotFn;
  }

  /** Universal hook: single field (works on both server and client) */
  useField<K extends keyof T>(key: K): T[K] {
    if (isServer) {
      // On server: return current value without reactivity
      return this.get(key);
    }

    // On client: full reactive behavior
    // Dynamic import of React hook only when needed
    // @ts-ignore - This is safe since we check isServer first
    const { useSyncExternalStore } = require("react");

    if (!useSyncExternalStore) {
      throw new Error(
        "React not available. Make sure you're using this in a React component."
      );
    }

    const getSnapshot = this.getSnapshotField(key);
    return useSyncExternalStore(
      (listener: () => void) => {
        // Use distinctUntilChanged to prevent unnecessary re-renders
        const sub = this.subjects[key]
          .pipe(distinctUntilChanged(Object.is))
          .subscribe(() => listener());
        return () => sub.unsubscribe();
      },
      getSnapshot, // cached client snapshot
      getSnapshot // same cached function for SSR
    );
  }

  /** Universal hook: multiple fields (works on both server and client) */
  useFields<K extends keyof T>(keys: K[]): Pick<T, K> {
    if (isServer) {
      // On server: return current values without reactivity
      const result = {} as Pick<T, K>;
      keys.forEach((k) => (result[k] = this.get(k)));
      return result;
    }

    // On client: full reactive behavior
    // Dynamic import of React hook only when needed
    // @ts-ignore - This is safe since we check isServer first
    const { useSyncExternalStore } = require("react");

    if (!useSyncExternalStore) {
      throw new Error(
        "React not available. Make sure you're using this in a React component."
      );
    }

    const getSnapshot = this.getSnapshotFields(keys);
    return useSyncExternalStore(
      (listener: () => void) => {
        // Optimize combineLatest with distinctUntilChanged and shallow equality
        const sub = combineLatest(
          keys.map((k) =>
            this.subjects[k].pipe(distinctUntilChanged(Object.is))
          )
        )
          .pipe(
            map(() => {
              const result = {} as Pick<T, K>;
              keys.forEach((k) => (result[k] = this.get(k)));
              return result;
            }),
            distinctUntilChanged(shallowEqual)
          )
          .subscribe(() => listener());
        return () => sub.unsubscribe();
      },
      getSnapshot, // cached client snapshot
      getSnapshot // same cached function for SSR
    );
  }

  /** Universal hook: entire store (works on both server and client) */
  useStore(): T {
    return this.useFields(Object.keys(this.subjects) as (keyof T)[]) as T;
  }

  /** Register callback for side-effects */
  register<K extends keyof T>(key: K, callback: (val: T[K]) => void) {
    if (!this.callbacks[key]) this.callbacks[key] = [];
    this.callbacks[key]!.push(callback as Subscriber<T[keyof T]>);
  }

  /** Derived/computed field */
  derived<K extends string, D>(
    key: K,
    deps: (keyof T)[],
    compute: (values: Pick<T, (typeof deps)[number]>) => D
  ): FieldStore<T & Record<K, D>> {
    type NewStore = FieldStore<T & Record<K, D>>;
    if (
      (this.subjects as Record<string, BehaviorSubject<unknown>>)[key] !==
      undefined
    ) {
      throw new Error(`Key "${key}" already exists`);
    }

    const newStore = this as unknown as NewStore;
    const depSubjects = deps.map((d) => this.subjects[d]);
    const derived$ = new BehaviorSubject<D>(compute(this.getAll()));

    combineLatest(depSubjects).subscribe(() => {
      const values = {} as Pick<T, (typeof deps)[number]>;
      deps.forEach((d) => (values[d] = this.get(d)));
      const newVal = compute(values);
      if (derived$.getValue() !== newVal) derived$.next(newVal);
    });

    (newStore.subjects as unknown as Record<string, BehaviorSubject<D>>)[key] =
      derived$;
    return newStore;
  }
}
