export type Subscriber<T> = (val: T) => void;

export interface SnapshotCacheEntry {
  version: number;
  result: any;
  fn: () => any;
}
