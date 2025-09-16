/**
 * Custom reactive primitives for NextTinyRXStore
 * Implements only the specific functionality needed by NextTinyRXStore
 */

export type Observer<T> = (value: T) => void;
export type Unsubscribe = () => void;

export interface Subscription {
  unsubscribe: Unsubscribe;
  closed: boolean;
}

export interface Observable<T> {
  subscribe(observer: Observer<T>): Subscription;
  pipe<R>(...operators: OperatorFunction<any, any>[]): Observable<R>;
}

export interface OperatorFunction<T, R> {
  (source: Observable<T>): Observable<R>;
}

/**
 * Simple subscription implementation
 */
class SimpleSubscription implements Subscription {
  public closed = false;

  constructor(private _unsubscribe: Unsubscribe) {}

  unsubscribe(): void {
    if (!this.closed) {
      this.closed = true;
      this._unsubscribe();
    }
  }
}

/**
 * Basic Observable implementation
 */
export class SimpleObservable<T> implements Observable<T> {
  constructor(private _subscribe: (observer: Observer<T>) => Unsubscribe) {}

  subscribe(observer: Observer<T>): Subscription {
    const unsubscribe = this._subscribe(observer);
    return new SimpleSubscription(unsubscribe);
  }

  pipe<R>(...operators: OperatorFunction<any, any>[]): Observable<R> {
    return operators.reduce(
      (source, operator) => operator(source),
      this as any
    );
  }
}

/**
 * BehaviorSubject implementation - stores current value and emits to new subscribers
 */
export class BehaviorSubject<T> extends SimpleObservable<T> {
  private _observers: Observer<T>[] = [];
  private _hasError = false;
  private _thrownError: any = null;
  private _isStopped = false;

  constructor(private _value: T) {
    super((observer: Observer<T>) => {
      if (this._hasError) {
        throw this._thrownError;
      }

      if (this._isStopped) {
        return () => {};
      }

      // Add observer to the list
      this._observers.push(observer);

      // Emit current value immediately (BehaviorSubject characteristic)
      try {
        observer(this._value);
      } catch (error) {
        // Handle observer errors gracefully
        console.error("Observer error:", error);
      }

      // Return unsubscribe function
      return () => {
        const index = this._observers.indexOf(observer);
        if (index > -1) {
          this._observers.splice(index, 1);
        }
      };
    });
  }

  /**
   * Get current value (throws if subject has errored)
   */
  getValue(): T {
    if (this._hasError) {
      throw this._thrownError;
    }
    if (this._isStopped) {
      throw new Error("Object is closed");
    }
    return this._value;
  }

  /**
   * Get current value as property
   */
  get value(): T {
    return this.getValue();
  }

  /**
   * Emit next value to all observers
   */
  next(value: T): void {
    if (this._isStopped || this._hasError) {
      return;
    }

    this._value = value;

    // Notify all observers (copy array to avoid issues with concurrent modifications)
    const observers = this._observers.slice();
    for (const observer of observers) {
      try {
        observer(value);
      } catch (error) {
        // Handle observer errors gracefully
        console.error("Observer error:", error);
      }
    }
  }

  /**
   * Error the subject
   */
  error(error: any): void {
    if (this._isStopped) {
      return;
    }

    this._hasError = true;
    this._thrownError = error;
    this._isStopped = true;
    this._observers.length = 0; // Clear observers
  }

  /**
   * Complete the subject
   */
  complete(): void {
    if (this._isStopped) {
      return;
    }

    this._isStopped = true;
    this._observers.length = 0; // Clear observers
  }
}

/**
 * Combine latest values from multiple observables
 */
export function combineLatest<T extends readonly unknown[]>(
  sources: readonly [...{ [K in keyof T]: Observable<T[K]> }]
): Observable<T> {
  return new SimpleObservable<T>((observer: Observer<T>) => {
    const length = sources.length;

    if (length === 0) {
      // Empty array - complete immediately
      return () => {};
    }

    const values: unknown[] = new Array(length);
    const hasEmitted = new Array(length).fill(false);
    let hasAllEmitted = false;

    const subscriptions: Subscription[] = [];

    // Subscribe to each source
    sources.forEach((source, index) => {
      const subscription = source.subscribe((value: any) => {
        values[index] = value;

        if (!hasEmitted[index]) {
          hasEmitted[index] = true;
          hasAllEmitted = hasEmitted.every(Boolean);
        }

        // Only emit if all sources have emitted at least once
        if (hasAllEmitted) {
          try {
            observer([...values] as unknown as T);
          } catch (error) {
            console.error("Observer error:", error);
          }
        }
      });

      subscriptions.push(subscription);
    });

    // Return cleanup function
    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
  });
}

/**
 * Only emit when the current value is different from the last
 */
export function distinctUntilChanged<T>(
  compareFn: (previous: T, current: T) => boolean = (a, b) => a === b
): OperatorFunction<T, T> {
  return (source: Observable<T>): Observable<T> => {
    return new SimpleObservable<T>((observer: Observer<T>) => {
      let hasValue = false;
      let lastValue: T;

      const subscription = source.subscribe((value: T) => {
        let shouldEmit = false;

        if (!hasValue) {
          hasValue = true;
          shouldEmit = true;
        } else {
          shouldEmit = !compareFn(lastValue, value);
        }

        if (shouldEmit) {
          lastValue = value;
          try {
            observer(value);
          } catch (error) {
            console.error("Observer error:", error);
          }
        }
      });

      return () => subscription.unsubscribe();
    });
  };
}

/**
 * Transform emitted values
 */
export function map<T, R>(project: (value: T) => R): OperatorFunction<T, R> {
  return (source: Observable<T>): Observable<R> => {
    return new SimpleObservable<R>((observer: Observer<R>) => {
      const subscription = source.subscribe((value: T) => {
        try {
          const result = project(value);
          observer(result);
        } catch (error) {
          console.error("Map projection error:", error);
        }
      });

      return () => subscription.unsubscribe();
    });
  };
}

/**
 * Utility function to check if two objects are shallowly equal
 * This is used internally but exported for testing
 */
export function objectEquals<T>(a: T, b: T): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  const keysA = Object.keys(a as any);
  const keysB = Object.keys(b as any);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if ((a as any)[key] !== (b as any)[key]) return false;
  }

  return true;
}
