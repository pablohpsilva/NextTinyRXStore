import { BehaviorSubject, combineLatest, Subscription } from "rxjs";
import { useSyncExternalStore } from "react";

export type Subscriber<T> = (val: T) => void;

export class FieldStore<T extends Record<string, unknown>> {
  private subjects: { [K in keyof T]: BehaviorSubject<T[K]> };
  public setters: {
    [K in keyof T as `set${Capitalize<string & K>}`]: (val: T[K]) => void;
  };
  private callbacks: Partial<Record<keyof T, Subscriber<T[keyof T]>[]>> = {};

  constructor(initialState: T) {
    this.subjects = {} as { [K in keyof T]: BehaviorSubject<T[K]> };
    this.setters = {} as typeof this.setters;

    // Single loop: initialize subjects + setters
    (Object.keys(initialState) as (keyof T)[]).forEach((key) => {
      const value = initialState[key];
      (
        this.subjects as unknown as Record<keyof T, BehaviorSubject<T[keyof T]>>
      )[key] = new BehaviorSubject(value);

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

  /** Set one or more fields */
  set(partial: Partial<T>) {
    for (const key in partial) {
      if (!(key in this.subjects)) continue;

      const newVal = partial[key]!;
      const oldVal = this.subjects[key].getValue();
      if (oldVal === newVal) continue;

      this.subjects[key].next(newVal);
      this.callbacks[key as keyof T]?.forEach((cb) => cb(newVal));
    }
  }

  /** Subscribe to a single field */
  observable<K extends keyof T>(key: K): BehaviorSubject<T[K]> {
    return this.subjects[key];
  }

  /** Client hook: single field */
  useField<K extends keyof T>(key: K): T[K] {
    return useSyncExternalStore(
      (listener) => {
        const sub = this.subjects[key].subscribe(() => listener());
        return () => sub.unsubscribe();
      },
      () => this.get(key),
      () => this.get(key) // getServerSnapshot for SSR
    );
  }

  /** Client hook: multiple fields */
  useFields<K extends keyof T>(keys: K[]): Pick<T, K> {
    return useSyncExternalStore(
      (listener) => {
        const sub = combineLatest(keys.map((k) => this.subjects[k])).subscribe(
          () => listener()
        );
        return () => sub.unsubscribe();
      },
      () => {
        const val = {} as Pick<T, K>;
        keys.forEach((k) => (val[k] = this.get(k)));
        return val;
      },
      () => {
        const val = {} as Pick<T, K>;
        keys.forEach((k) => (val[k] = this.get(k)));
        return val;
      } // getServerSnapshot for SSR
    );
  }

  /** Client hook: entire store */
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

/** Factory helper */
export function createFieldStore<T extends Record<string, unknown>>(
  initialState: T
) {
  return new FieldStore(initialState);
}
