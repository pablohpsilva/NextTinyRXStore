import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
} from "./reactive";

import type { CallbackWithId } from "./types";
import { isServer, shallowEqual } from "./utils";
import { hashFunction } from "./hashUtils";

export interface CacheEntry<TValue = unknown> {
  version: number;
  snapshot: () => TValue;
  result?: TValue;
}
export class FieldStore<T extends Record<string, unknown>> {
  private subjects: { [K in keyof T]: BehaviorSubject<T[K]> };
  public setters: {
    [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
  };
  private callbacks: Partial<Record<keyof T, CallbackWithId[]>> = {};

  // Simplified caching system - single cache with version tracking
  private cache: Record<string, CacheEntry> = {};
  private _fieldVersions: Record<string, number> = {};

  constructor(initialState: T) {
    this.subjects = {} as { [K in keyof T]: BehaviorSubject<T[K]> };
    this.setters = {} as typeof this.setters;

    // Initialize subjects, setters, and versions in single loop
    for (const key in initialState) {
      const value = initialState[key];

      // Create subject
      (this.subjects as unknown as Record<string, BehaviorSubject<unknown>>)[
        String(key)
      ] = new BehaviorSubject(value) as unknown as BehaviorSubject<unknown>;

      // Initialize field version
      this._fieldVersions[String(key)] = 0;

      // Create setter
      const setterName = `set${
        String(key).charAt(0).toUpperCase() + String(key).slice(1)
      }` as keyof typeof this.setters;
      (this.setters as unknown as Record<string, (val: T[keyof T]) => void>)[
        setterName
      ] = (val: T[keyof T]) => this.set({ [key]: val } as Partial<T>);
    }
  }

  /** Get single field */
  get<K extends keyof T>(key: K): T[K] {
    return this.subjects[key].getValue();
  }

  /** Get entire store */
  getAll(): T {
    const result = {} as T;
    for (const key in this.subjects) {
      result[key] = this.get(key);
    }
    return result;
  }

  /** Set one or more fields with optimized change detection */
  set(partial: Partial<T>) {
    const changedKeys: (keyof T)[] = [];

    // Collect changed keys
    for (const key in partial) {
      if (!(key in this.subjects)) continue;
      const newVal = partial[key]!;
      const oldVal = this.subjects[key].getValue();

      if (!Object.is(oldVal, newVal)) {
        changedKeys.push(key as keyof T);
      }
    }
    if (changedKeys.length === 0) return;

    // Update versions and invalidate cache for changed fields
    for (let i = 0; i < changedKeys.length; i++) {
      const key = changedKeys[i];
      const keyStr = String(key);
      this._fieldVersions[keyStr] = (this._fieldVersions[keyStr] || 0) + 1;
      this.invalidateCache(keyStr);
    }

    // Update values and trigger callbacks
    for (let i = 0; i < changedKeys.length; i++) {
      const key = changedKeys[i];
      const newVal = partial[key]!;
      this.subjects[key].next(newVal);

      const callbacks = this.callbacks[key as keyof T];
      if (callbacks) {
        for (let j = 0; j < callbacks.length; j++) {
          (callbacks[j] as (val: typeof newVal) => void)(newVal);
        }
      }
    }
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

  /** Simplified cache invalidation */
  private invalidateCache(fieldKey: string): void {
    // Remove cache entries that depend on this field
    for (const cacheKey in this.cache) {
      // Check if cache key depends on this field
      if (cacheKey === `field:${fieldKey}`) {
        delete this.cache[cacheKey];
      } else if (cacheKey.startsWith("fields:")) {
        // For multi-field caches, check if this field is in the list
        const fieldsStr = cacheKey.substring(7); // Remove "fields:" prefix
        const fields = fieldsStr.split(",");
        if (fields.includes(fieldKey)) {
          delete this.cache[cacheKey];
        }
      }
    }
  }

  /** Get or create cached snapshot function for single field */
  getSnapshotField<K extends keyof T>(key: K): () => T[K] {
    const cacheKey = `field:${String(key)}`;

    let entry = this.cache[cacheKey];
    if (!entry) {
      let cachedValue: T[K];
      let hasValue = false;

      entry = {
        version: 0,
        snapshot: () => {
          const currentValue = this.get(key);
          // Only update cached value if it's different
          if (!hasValue || !Object.is(cachedValue, currentValue)) {
            cachedValue = currentValue;
            hasValue = true;
          }
          return cachedValue;
        },
      };
      this.cache[cacheKey] = entry;
    }

    return entry.snapshot as () => T[K];
  }

  /** Get or create cached snapshot function for multiple fields */
  getSnapshotFields<K extends keyof T>(keys: K[]): () => Pick<T, K> {
    const sortedKeys = keys.slice().sort();
    const cacheKey =
      keys.length === 1
        ? `field:${String(keys[0])}`
        : `fields:${sortedKeys.map((k) => String(k)).join(",")}`;

    let entry = this.cache[cacheKey];
    if (!entry) {
      let cachedResult: Pick<T, K> | null = null;

      entry = {
        version: 0,
        snapshot: () => {
          // Create new result and compare with cached
          const newResult = {} as Pick<T, K>;
          for (let i = 0; i < keys.length; i++) {
            newResult[keys[i]] = this.get(keys[i]);
          }

          // Only update cached result if values changed
          if (!cachedResult || !shallowEqual(cachedResult, newResult)) {
            cachedResult = newResult;
          }

          return cachedResult;
        },
      };
      this.cache[cacheKey] = entry;
    }

    return entry.snapshot as () => Pick<T, K>;
  }

  /** Universal hook: single field (works on both server and client) */
  useField<K extends keyof T>(key: K): T[K] {
    if (isServer) {
      return this.get(key);
    }

    // @ts-ignore - Safe since we check isServer first
    const { useSyncExternalStore } = require("react");

    if (!useSyncExternalStore) {
      throw new Error(
        "React not available. Make sure you're using this in a React component."
      );
    }

    const getSnapshot = this.getSnapshotField(key);
    return useSyncExternalStore(
      (listener: () => void) => {
        const sub = this.subjects[key]
          .pipe(distinctUntilChanged(Object.is))
          .subscribe(() => listener());
        return () => sub.unsubscribe();
      },
      getSnapshot,
      getSnapshot
    );
  }

  /** Universal hook: multiple fields (works on both server and client) */
  useFields<K extends keyof T>(keys: K[]): Pick<T, K> {
    if (isServer) {
      const result = {} as Pick<T, K>;
      for (let i = 0; i < keys.length; i++) {
        result[keys[i]] = this.get(keys[i]);
      }
      return result;
    }

    // @ts-ignore - Safe since we check isServer first
    const { useSyncExternalStore } = require("react");

    if (!useSyncExternalStore) {
      throw new Error(
        "React not available. Make sure you're using this in a React component."
      );
    }

    const getSnapshot = this.getSnapshotFields(keys);
    return useSyncExternalStore(
      (listener: () => void) => {
        const observables = [];
        for (let i = 0; i < keys.length; i++) {
          observables.push(
            this.subjects[keys[i]].pipe(distinctUntilChanged(Object.is))
          );
        }

        const sub = combineLatest(observables)
          .pipe(
            map(() => {
              const result = {} as Pick<T, K>;
              for (let i = 0; i < keys.length; i++) {
                result[keys[i]] = this.get(keys[i]);
              }
              return result;
            }),
            distinctUntilChanged(shallowEqual)
          )
          .subscribe(() => listener());
        return () => sub.unsubscribe();
      },
      getSnapshot,
      getSnapshot
    );
  }

  /** Universal hook: entire store (works on both server and client) */
  useStore(): T {
    const keys = Object.keys(this.subjects) as (keyof T)[];
    return this.useFields(keys) as T;
  }

  /** Register callback for side-effects - returns cleanup function */
  register<K extends keyof T>(
    key: K,
    callback: (val: T[K]) => void
  ): () => void {
    const functionHash = hashFunction(callback);
    return this.registerWithId(key, functionHash, callback);
  }

  /** Register callback with unique ID - prevents duplicates based on ID */
  registerWithId<K extends keyof T>(
    key: K,
    id: string,
    callback: (val: T[K]) => void
  ): () => void {
    if (!this.callbacks[key]) this.callbacks[key] = [];

    const callbacksArray = this.callbacks[key]!;

    // Check for existing callback with same ID
    let existingIndex = -1;
    for (let i = 0; i < callbacksArray.length; i++) {
      if (callbacksArray[i].__callbackId === id) {
        existingIndex = i;
        break;
      }
    }

    if (existingIndex !== -1) {
      // Replace existing callback with same ID
      const typedCallback = callback as CallbackWithId;
      typedCallback.__callbackId = id;
      callbacksArray[existingIndex] = typedCallback;

      // Return no-op cleanup function for duplicate registrations
      return () => {}; // no-op
    }

    // Add new callback with ID
    const typedCallback = callback as CallbackWithId;
    typedCallback.__callbackId = id;
    callbacksArray.push(typedCallback);

    return () => this.unregisterById(key, id);
  }

  /** Unregister callback by ID */
  unregisterById<K extends keyof T>(key: K, id: string): boolean {
    const callbacksArray = this.callbacks[key];
    if (!callbacksArray) return false;

    for (let i = 0; i < callbacksArray.length; i++) {
      if (callbacksArray[i].__callbackId === id) {
        callbacksArray.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  /** Unregister a specific callback */
  unregister<K extends keyof T>(
    key: K,
    callback: (val: T[K]) => void
  ): boolean {
    const callbacksArray = this.callbacks[key];
    if (!callbacksArray) return false;

    const typedCallback = callback as CallbackWithId;
    for (let i = 0; i < callbacksArray.length; i++) {
      if (callbacksArray[i] === typedCallback) {
        callbacksArray.splice(i, 1);
        return true;
      }
    }

    return false;
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
    const depSubjects = [];
    for (let i = 0; i < deps.length; i++) {
      depSubjects.push(this.subjects[deps[i]]);
    }

    const derived$ = new BehaviorSubject<D>(compute(this.getAll()));

    // Initialize field version for derived field
    newStore._fieldVersions[key] = 0;

    combineLatest(depSubjects).subscribe(() => {
      const values = {} as Pick<T, (typeof deps)[number]>;
      for (let i = 0; i < deps.length; i++) {
        values[deps[i]] = this.get(deps[i]);
      }

      const newVal = compute(values);
      const currentVal = derived$.getValue();

      if (!Object.is(currentVal, newVal)) {
        derived$.next(newVal);

        // Update field version and invalidate caches for this derived field
        const derivedFieldKey = key as keyof (T & Record<K, D>);
        newStore._fieldVersions[String(derivedFieldKey)] =
          (newStore._fieldVersions[String(derivedFieldKey)] || 0) + 1;

        // Invalidate cache for this derived field
        newStore.invalidateCache(String(derivedFieldKey));
      }
    });

    (newStore.subjects as unknown as Record<string, BehaviorSubject<D>>)[key] =
      derived$;
    return newStore;
  }
}
