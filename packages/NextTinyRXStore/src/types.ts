export type Subscriber<T> = (val: T) => void;

export interface SnapshotCacheEntry<TValue = unknown> {
  version: number;
  result: TValue;
  fn: () => TValue;
}

export type CallbackWithId = Function & {
  __callbackId?: string;
};
