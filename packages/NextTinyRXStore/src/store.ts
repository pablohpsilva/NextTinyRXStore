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

  // React-specific resource management
  private _subscriptionCache = new Map<string, () => void>();
  private _activeReactSubscriptions = new WeakMap<object, Set<() => void>>();

  constructor(initialState: T) {
    this.subjects = {} as { [K in keyof T]: BehaviorSubject<T[K]> };
    this.setters = {} as typeof this.setters;

    // Initialize subjects, setters, and versions in single loop
    for (const key in initialState) {
      const value = initialState[key];

      // Create subject
      (this.subjects as unknown as Record<string, BehaviorSubject<unknown>>)[
        `${key}`
      ] = new BehaviorSubject(value) as unknown as BehaviorSubject<unknown>;

      // Initialize field version
      this._fieldVersions[`${key}`] = 0;

      // Create setter
      const setterName = `set${
        `${key}`.charAt(0).toUpperCase() + `${key}`.slice(1)
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
      this._triggerCallbacks(key, newVal);
    }
  }

  /** Subscribe to a single field */
  observable<K extends keyof T>(key: K): BehaviorSubject<T[K]> {
    return this.subjects[key];
  }

  /** Trigger callbacks for a specific key */
  private _triggerCallbacks<K extends keyof T>(key: K, newVal: T[K]): void {
    const callbacks = this.callbacks[key as keyof T];
    if (!callbacks) return;

    for (let i = 0; i < callbacks.length; i++) {
      (callbacks[i] as (val: typeof newVal) => void)(newVal);
    }
  }

  /** Generic method to create and cache subscription functions */
  private _getCachedSubscription(
    cacheKey: string,
    subscriptionFactory: () => (listener: () => void) => () => void
  ): (listener: () => void) => () => void {
    if (!this._subscriptionCache.has(cacheKey)) {
      this._subscriptionCache.set(cacheKey, subscriptionFactory() as any);
    }
    return this._subscriptionCache.get(cacheKey) as any;
  }

  /** Create stable subscription function for React hooks */
  private _getStableSubscription<K extends keyof T>(
    key: K
  ): (listener: () => void) => () => void {
    const cacheKey = `single:${String(key)}`;

    return this._getCachedSubscription(
      cacheKey,
      () => (listener: () => void) => {
        const sub = this.subjects[key]
          .pipe(distinctUntilChanged(Object.is))
          .subscribe(() => listener());
        return () => sub.unsubscribe();
      }
    );
  }

  /** Create stable subscription function for multiple fields */
  private _getStableMultiSubscription<K extends keyof T>(
    keys: K[]
  ): (listener: () => void) => () => void {
    const sortedKeys = keys.slice().sort();
    const cacheKey = `multi:${sortedKeys.map((k) => String(k)).join(",")}`;

    return this._getCachedSubscription(
      cacheKey,
      () => (listener: () => void) => {
        const observables = [];
        for (let i = 0; i < keys.length; i++) {
          observables.push(
            this.subjects[keys[i]].pipe(distinctUntilChanged(Object.is))
          );
        }

        const sub = combineLatest(observables)
          .pipe(
            map(() => this._buildServerSideResult(keys)),
            distinctUntilChanged(shallowEqual)
          )
          .subscribe(() => listener());
        return () => sub.unsubscribe();
      }
    );
  }

  /** Register React component for cleanup tracking */
  private _registerReactComponent(): object {
    const componentRef = {};
    this._activeReactSubscriptions.set(componentRef, new Set());
    return componentRef;
  }

  /** Track subscription for React component cleanup */
  private _trackReactSubscription(
    componentRef: object,
    cleanup: () => void
  ): () => void {
    const subscriptions = this._activeReactSubscriptions.get(componentRef);
    if (subscriptions) {
      subscriptions.add(cleanup);

      return () => {
        cleanup();
        subscriptions.delete(cleanup);
      };
    }
    return cleanup;
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
          const newResult = this._buildServerSideResult(keys);

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

  /** Common React hook logic to eliminate duplication */
  private _useReactHook<TResult>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => TResult
  ): TResult {
    // @ts-ignore - Safe since we check isServer first
    const { useSyncExternalStore, useRef, useEffect } = require("react");

    if (!useSyncExternalStore) {
      throw new Error(
        "React not available. Make sure you're using this in a React component."
      );
    }

    // Create stable component reference for cleanup tracking
    const componentRef = useRef(null);
    if (!componentRef.current) {
      componentRef.current = this._registerReactComponent();
    }

    // Enhanced subscribe function with cleanup tracking
    const subscribeWithTracking = (listener: () => void) => {
      const cleanup = subscribe(listener);
      return this._trackReactSubscription(componentRef.current!, cleanup);
    };

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        const subscriptions = this._activeReactSubscriptions.get(
          componentRef.current!
        );
        if (subscriptions) {
          subscriptions.forEach((cleanup) => cleanup());
          subscriptions.clear();
          this._activeReactSubscriptions.delete(componentRef.current!);
        }
      };
    }, []);

    return useSyncExternalStore(
      subscribeWithTracking,
      getSnapshot,
      getSnapshot
    );
  }

  /** Universal hook: single field (works on both server and client) */
  useField<K extends keyof T>(key: K): T[K] {
    if (isServer) {
      return this.get(key);
    }

    const subscribe = this._getStableSubscription(key);
    const getSnapshot = this.getSnapshotField(key);

    return this._useReactHook(subscribe, getSnapshot);
  }

  /** Build server-side result for multiple fields */
  private _buildServerSideResult<K extends keyof T>(keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (let i = 0; i < keys.length; i++) {
      result[keys[i]] = this.get(keys[i]);
    }
    return result;
  }

  /** Universal hook: multiple fields (works on both server and client) */
  useFields<K extends keyof T>(keys: K[]): Pick<T, K> {
    if (isServer) {
      return this._buildServerSideResult(keys);
    }

    const subscribe = this._getStableMultiSubscription(keys);
    const getSnapshot = this.getSnapshotFields(keys);

    return this._useReactHook(subscribe, getSnapshot);
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

  /** Generic callback removal helper */
  private _removeCallback<K extends keyof T>(
    key: K,
    predicate: (callback: CallbackWithId, index: number) => boolean
  ): boolean {
    const callbacksArray = this.callbacks[key];
    if (!callbacksArray) return false;

    for (let i = 0; i < callbacksArray.length; i++) {
      if (predicate(callbacksArray[i], i)) {
        callbacksArray.splice(i, 1);
        return true;
      }
    }
    return false;
  }

  /** Unregister callback by ID */
  unregisterById<K extends keyof T>(key: K, id: string): boolean {
    return this._removeCallback(
      key,
      (callback) => callback.__callbackId === id
    );
  }

  /** Unregister a specific callback */
  unregister<K extends keyof T>(
    key: K,
    callback: (val: T[K]) => void
  ): boolean {
    const typedCallback = callback as CallbackWithId;
    return this._removeCallback(key, (cb) => cb === typedCallback);
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
      const values = this._buildServerSideResult(deps);
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

  /** Clear subscription cache and React resources (for testing/cleanup) */
  _clearReactResources(): void {
    this._subscriptionCache.clear();

    // Note: WeakMap doesn't support iteration, so we can only clear the reference
    // The garbage collector will handle cleanup when components are destroyed
    this._activeReactSubscriptions = new WeakMap();
  }
}
