/**
 * Memory monitoring and measurement utilities for performance testing
 */

export interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  timestamp: number;
}

export interface MemoryDelta {
  heapUsedDelta: number;
  heapTotalDelta: number;
  externalDelta: number;
  rssDelta: number;
  timeDelta: number;
}

export interface MemoryStats {
  initial: MemorySnapshot;
  final: MemorySnapshot;
  peak: MemorySnapshot;
  delta: MemoryDelta;
  samples: MemorySnapshot[];
}

/**
 * Get current memory usage snapshot
 */
export function getMemorySnapshot(): MemorySnapshot {
  if (typeof process !== "undefined" && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      timestamp: Date.now(),
    };
  }

  // Browser fallback (limited info)
  if (typeof performance !== "undefined" && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      heapUsed: memory.usedJSHeapSize || 0,
      heapTotal: memory.totalJSHeapSize || 0,
      external: 0,
      rss: 0,
      timestamp: Date.now(),
    };
  }

  // Fallback when memory info is unavailable
  return {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    rss: 0,
    timestamp: Date.now(),
  };
}

/**
 * Calculate memory delta between two snapshots
 */
export function calculateMemoryDelta(
  before: MemorySnapshot,
  after: MemorySnapshot
): MemoryDelta {
  return {
    heapUsedDelta: after.heapUsed - before.heapUsed,
    heapTotalDelta: after.heapTotal - before.heapTotal,
    externalDelta: after.external - before.external,
    rssDelta: after.rss - before.rss,
    timeDelta: after.timestamp - before.timestamp,
  };
}

/**
 * Memory monitor class for tracking memory usage over time
 */
export class MemoryMonitor {
  private samples: MemorySnapshot[] = [];
  private monitoring = false;
  private intervalId?: NodeJS.Timeout;

  constructor(private sampleInterval = 10) {} // Sample every 10ms by default

  start(): void {
    if (this.monitoring) return;

    this.monitoring = true;
    this.samples = [];
    this.samples.push(getMemorySnapshot());

    this.intervalId = setInterval(() => {
      if (this.monitoring) {
        this.samples.push(getMemorySnapshot());
      }
    }, this.sampleInterval);
  }

  stop(): MemoryStats {
    if (!this.monitoring) {
      throw new Error("Monitor is not running");
    }

    this.monitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.samples.push(getMemorySnapshot());

    const initial = this.samples[0];
    const final = this.samples[this.samples.length - 1];
    const peak = this.samples.reduce(
      (max, current) => (current.heapUsed > max.heapUsed ? current : max),
      initial
    );

    return {
      initial,
      final,
      peak,
      delta: calculateMemoryDelta(initial, final),
      samples: [...this.samples],
    };
  }

  getCurrentSample(): MemorySnapshot | null {
    return this.samples.length > 0
      ? this.samples[this.samples.length - 1]
      : null;
  }

  getSampleCount(): number {
    return this.samples.length;
  }
}

/**
 * Format memory size in human-readable format
 */
export function formatMemorySize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Force garbage collection if available (Node.js with --expose-gc flag)
 */
export function forceGC(): boolean {
  if (typeof global !== "undefined" && global.gc) {
    global.gc();
    return true;
  }
  return false;
}

/**
 * Run a function and measure its memory impact
 */
export async function measureMemoryUsage<T>(
  fn: () => T | Promise<T>,
  options: {
    sampleInterval?: number;
    forceGCBefore?: boolean;
    forceGCAfter?: boolean;
  } = {}
): Promise<{ result: T; memoryStats: MemoryStats }> {
  const {
    sampleInterval = 10,
    forceGCBefore = true,
    forceGCAfter = true,
  } = options;

  if (forceGCBefore) {
    forceGC();
    // Wait a bit for GC to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const monitor = new MemoryMonitor(sampleInterval);
  monitor.start();

  try {
    const result = await fn();

    if (forceGCAfter) {
      forceGC();
      // Wait a bit for GC to complete
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const memoryStats = monitor.stop();
    return { result, memoryStats };
  } catch (error) {
    monitor.stop();
    throw error;
  }
}
