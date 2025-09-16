/**
 * Comprehensive benchmarking utilities for NextTinyRXStore performance testing
 */

export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  ops: number; // Operations per second
  samples: number[];
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  totalDuration: number;
}

/**
 * High-precision timer for accurate measurements
 */
export class Timer {
  private startTime?: [number, number];

  start(): void {
    this.startTime = process.hrtime?.() || [Date.now() / 1000, 0];
  }

  stop(): number {
    if (!this.startTime) {
      throw new Error("Timer was not started");
    }

    if (process.hrtime) {
      const [seconds, nanoseconds] = process.hrtime(this.startTime);
      return seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    } else {
      // Fallback for browser
      return Date.now() - this.startTime[0] * 1000;
    }
  }
}

/**
 * Run a single benchmark
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: {
    iterations?: number;
    minTime?: number; // Minimum time to run in ms
    warmup?: number; // Warmup iterations
  } = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 1000,
    minTime: minTimeOption = 1000,
    warmup = 10,
  } = options;

  // Warmup
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  const samples: number[] = [];
  let totalIterations = 0;
  const startTime = Date.now();

  // Run for at least minTimeOption or iterations, whichever comes first
  while (
    totalIterations < iterations &&
    Date.now() - startTime < minTimeOption
  ) {
    const timer = new Timer();
    timer.start();

    await fn();

    const elapsed = timer.stop();
    samples.push(elapsed);
    totalIterations++;
  }

  const totalDuration = samples.reduce((sum, time) => sum + time, 0);
  const averageTime = totalDuration / totalIterations;
  const minTimeResult = Math.min(...samples);
  const maxTime = Math.max(...samples);
  const ops = 1000 / averageTime; // Operations per second

  return {
    name,
    duration: totalDuration,
    iterations: totalIterations,
    averageTime,
    minTime: minTimeResult,
    maxTime,
    ops,
    samples,
  };
}

/**
 * Compare multiple benchmark functions
 */
export async function compareBenchmarks(
  benchmarks: Array<{ name: string; fn: () => void | Promise<void> }>,
  options?: {
    iterations?: number;
    minTime?: number;
    warmup?: number;
  }
): Promise<BenchmarkSuite> {
  const results: BenchmarkResult[] = [];
  const suiteStart = Date.now();

  for (const { name, fn } of benchmarks) {
    const result = await benchmark(name, fn, options);
    results.push(result);
  }

  const totalDuration = Date.now() - suiteStart;

  return {
    name: "Benchmark Comparison",
    results,
    totalDuration,
  };
}

/**
 * Generate a readable benchmark report
 */
export function formatBenchmarkResults(suite: BenchmarkSuite): string {
  const lines: string[] = [];
  lines.push(`\n=== ${suite.name} ===`);
  lines.push(`Total Suite Duration: ${suite.totalDuration}ms\n`);

  // Sort by ops (fastest first)
  const sortedResults = [...suite.results].sort((a, b) => b.ops - a.ops);
  const fastest = sortedResults[0];

  for (const result of sortedResults) {
    const relativeFactor = fastest.ops / result.ops;
    const relativeText =
      result === fastest
        ? "(fastest)"
        : `(${relativeFactor.toFixed(2)}x slower)`;

    lines.push(`${result.name}:`);
    lines.push(`  Iterations: ${result.iterations}`);
    lines.push(`  Total time: ${result.duration.toFixed(2)}ms`);
    lines.push(`  Average: ${result.averageTime.toFixed(4)}ms/op`);
    lines.push(`  Min: ${result.minTime.toFixed(4)}ms`);
    lines.push(`  Max: ${result.maxTime.toFixed(4)}ms`);
    lines.push(`  Ops/sec: ${result.ops.toFixed(0)} ${relativeText}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Stress test utilities
 */
export interface StressTestConfig {
  concurrent: number;
  duration: number; // in ms
  rampUp?: number; // ramp up time in ms
  onProgress?: (progress: number) => void;
}

export interface StressTestResult {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageOpsPerSecond: number;
  peakOpsPerSecond: number;
  errors: Error[];
  duration: number;
}

/**
 * Run a stress test with concurrent operations
 */
export async function stressTest(
  fn: () => Promise<void> | void,
  config: StressTestConfig
): Promise<StressTestResult> {
  const { concurrent, duration, rampUp = 0, onProgress } = config;
  const errors: Error[] = [];
  let totalOperations = 0;
  let successfulOperations = 0;
  let failedOperations = 0;

  const startTime = Date.now();
  const endTime = startTime + duration;
  let operationCounts: number[] = [];

  // Track operations per second
  const opsInterval = setInterval(() => {
    operationCounts.push(totalOperations);
    if (onProgress) {
      const elapsed = Date.now() - startTime;
      onProgress(Math.min(elapsed / duration, 1));
    }
  }, 1000);

  // Create concurrent workers
  const workers = Array.from({ length: concurrent }, async () => {
    while (Date.now() < endTime) {
      try {
        await fn();
        totalOperations++;
        successfulOperations++;
      } catch (error) {
        totalOperations++;
        failedOperations++;
        errors.push(error as Error);
      }

      // Small delay to prevent overwhelming the system
      if (rampUp > 0) {
        const elapsed = Date.now() - startTime;
        if (elapsed < rampUp) {
          const delay = Math.max(0, rampUp - elapsed) / concurrent;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  });

  await Promise.all(workers);
  clearInterval(opsInterval);

  const actualDuration = Date.now() - startTime;
  const averageOpsPerSecond = totalOperations / (actualDuration / 1000);

  // Calculate peak ops per second
  let peakOpsPerSecond = 0;
  for (let i = 1; i < operationCounts.length; i++) {
    const opsInSecond = operationCounts[i] - operationCounts[i - 1];
    peakOpsPerSecond = Math.max(peakOpsPerSecond, opsInSecond);
  }

  return {
    totalOperations,
    successfulOperations,
    failedOperations,
    averageOpsPerSecond,
    peakOpsPerSecond,
    errors,
    duration: actualDuration,
  };
}
