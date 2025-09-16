/**
 * Comprehensive stress testing for NextTinyRXStore
 */

import { FieldStore } from "../store";
import { measureMemoryUsage, MemoryStats } from "./memory-utils";
import { stressTest, StressTestResult } from "./benchmarks";

export interface StoreStressTestResult {
  name: string;
  stressResult: StressTestResult;
  memoryStats: MemoryStats;
  finalStoreSize: number;
  averageOperationTime: number;
}

export interface DataCapacityResult {
  maxFields: number;
  maxValueSize: number;
  totalMemoryUsed: number;
  timeToFailure?: number;
  errorMessage?: string;
}

/**
 * Test store performance under heavy concurrent load
 */
export async function stressConcurrentOperations(
  store: FieldStore<any>,
  config: {
    concurrent: number;
    duration: number;
    operationType: "read" | "write" | "mixed";
    fieldCount: number;
  }
): Promise<StoreStressTestResult> {
  const { concurrent, duration, operationType, fieldCount } = config;

  // Prepare test data
  const fields = Array.from({ length: fieldCount }, (_, i) => `field${i}`);
  const testData = fields.reduce((acc, field, i) => {
    acc[field] = `value${i}`;
    return acc;
  }, {} as Record<string, string>);

  // Initialize store with test data
  Object.keys(testData).forEach((key) => {
    if (!(key in store.getAll())) {
      store.set({ [key]: testData[key] });
    }
  });

  const operationStartTime = performance.now();
  let operationCount = 0;

  const createOperation = () => {
    return async () => {
      const field = fields[Math.floor(Math.random() * fields.length)];
      operationCount++;

      switch (operationType) {
        case "read":
          store.get(field);
          break;
        case "write":
          store.set({ [field]: `value${operationCount}` });
          break;
        case "mixed":
          if (Math.random() > 0.5) {
            store.get(field);
          } else {
            store.set({ [field]: `value${operationCount}` });
          }
          break;
      }
    };
  };

  const { result: stressResult, memoryStats } = await measureMemoryUsage(
    () => stressTest(createOperation(), { concurrent, duration }),
    { sampleInterval: 50 }
  );

  const operationEndTime = performance.now();
  const averageOperationTime =
    (operationEndTime - operationStartTime) / operationCount;

  return {
    name: `Concurrent ${operationType} operations`,
    stressResult,
    memoryStats,
    finalStoreSize: Object.keys(store.getAll()).length,
    averageOperationTime,
  };
}

/**
 * Test maximum data capacity
 */
export async function testDataCapacity(
  initialStore?: FieldStore<any>
): Promise<DataCapacityResult> {
  const store = initialStore || new FieldStore({});
  let maxFields = 0;
  let totalMemoryUsed = 0;
  const startTime = performance.now();

  try {
    // Test maximum number of fields
    for (let i = 0; i < 1000000; i++) {
      // Max 1M fields
      const fieldName = `field${i}`;
      const value = `value${i}`.repeat(100); // ~600 bytes per value

      const beforeMemory = process.memoryUsage?.()?.heapUsed || 0;
      store.set({ [fieldName]: value });
      const afterMemory = process.memoryUsage?.()?.heapUsed || 0;

      totalMemoryUsed += afterMemory - beforeMemory;
      maxFields = i + 1;

      // Stop if memory usage exceeds 512MB or time exceeds 30 seconds
      if (
        totalMemoryUsed > 512 * 1024 * 1024 ||
        performance.now() - startTime > 30000
      ) {
        break;
      }

      // Progress check every 1000 fields
      if (i % 1000 === 0 && i > 0) {
        console.log(
          `Progress: ${i} fields, Memory: ${(
            totalMemoryUsed /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
      }
    }

    return {
      maxFields,
      maxValueSize: 600, // Approximate size per value
      totalMemoryUsed,
    };
  } catch (error) {
    return {
      maxFields,
      maxValueSize: 600,
      totalMemoryUsed,
      timeToFailure: performance.now() - startTime,
      errorMessage: (error as Error).message,
    };
  }
}

/**
 * Test large individual value storage
 */
export async function testLargeValueCapacity(): Promise<{
  maxValueSize: number;
  memoryUsed: number;
  errorMessage?: string;
}> {
  const store = new FieldStore({ testField: "" });
  let maxValueSize = 0;
  let memoryUsed = 0;

  try {
    // Start with 1KB and double each time
    let size = 1024;
    while (size <= 1024 * 1024 * 100) {
      // Max 100MB per value
      const largeValue = "x".repeat(size);

      const beforeMemory = process.memoryUsage?.()?.heapUsed || 0;
      store.set({ testField: largeValue });
      const afterMemory = process.memoryUsage?.()?.heapUsed || 0;

      memoryUsed = afterMemory - beforeMemory;
      maxValueSize = size;

      size *= 2;
    }

    return { maxValueSize, memoryUsed };
  } catch (error) {
    return {
      maxValueSize,
      memoryUsed,
      errorMessage: (error as Error).message,
    };
  }
}

/**
 * Test memory leak detection
 */
export async function testMemoryLeaks(iterations: number = 1000): Promise<{
  hasMemoryLeak: boolean;
  memoryGrowth: number;
  finalMemoryUsage: number;
  iterationResults: Array<{ iteration: number; memoryUsed: number }>;
}> {
  const iterationResults: Array<{ iteration: number; memoryUsed: number }> = [];
  let initialMemory = 0;

  for (let i = 0; i < iterations; i++) {
    // Create and destroy store instances
    const store = new FieldStore({
      field1: "value1",
      field2: "value2",
      field3: "value3",
    });

    // Perform operations
    store.set({ field1: `updated${i}` });
    store.get("field1");
    store.get("field2"); // Use get instead of useField (React hook)

    // Create derived field
    const derivedStore = store.derived(
      "computed",
      ["field1", "field2"],
      (values) => `${values.field1}-${values.field2}`
    );

    // Measure memory
    const currentMemory = process.memoryUsage?.()?.heapUsed || 0;

    if (i === 0) {
      initialMemory = currentMemory;
    }

    iterationResults.push({
      iteration: i,
      memoryUsed: currentMemory,
    });

    // Force garbage collection every 100 iterations
    if (i % 100 === 0 && global.gc) {
      global.gc();
    }
  }

  const finalMemoryUsage =
    iterationResults[iterationResults.length - 1].memoryUsed;
  const memoryGrowth = finalMemoryUsage - initialMemory;

  // Consider it a memory leak if memory grew more than 50MB for 1000 iterations
  const hasMemoryLeak = memoryGrowth > 50 * 1024 * 1024;

  return {
    hasMemoryLeak,
    memoryGrowth,
    finalMemoryUsage,
    iterationResults,
  };
}

/**
 * Test rapid subscription/unsubscription cycles
 */
export async function testSubscriptionStress(
  store: FieldStore<any>,
  config: {
    subscriptionsPerSecond: number;
    duration: number;
    fieldCount: number;
  }
): Promise<{
  totalSubscriptions: number;
  totalUnsubscriptions: number;
  averageSubscriptionTime: number;
  averageUnsubscriptionTime: number;
  memoryStats: MemoryStats;
}> {
  const { subscriptionsPerSecond, duration, fieldCount } = config;

  // Prepare test fields
  const fields = Array.from({ length: fieldCount }, (_, i) => `field${i}`);
  fields.forEach((field, i) => {
    store.set({ [field]: `value${i}` });
  });

  let totalSubscriptions = 0;
  let totalUnsubscriptions = 0;
  let totalSubscriptionTime = 0;
  let totalUnsubscriptionTime = 0;

  const { memoryStats } = await measureMemoryUsage(async () => {
    const startTime = Date.now();
    const endTime = startTime + duration;
    const subscriptionInterval = 1000 / subscriptionsPerSecond;

    const activeSubscriptions: Array<() => void> = [];

    while (Date.now() < endTime) {
      // Create subscription
      const field = fields[Math.floor(Math.random() * fields.length)];
      const subscriptionStart = performance.now();

      const unsubscribe = store.register(field, (value) => {
        // Simulate some work
        const dummy = value.toString().length;
      });

      const subscriptionEnd = performance.now();
      totalSubscriptionTime += subscriptionEnd - subscriptionStart;
      totalSubscriptions++;

      activeSubscriptions.push(unsubscribe);

      // Randomly unsubscribe some old subscriptions
      if (activeSubscriptions.length > 100 && Math.random() > 0.7) {
        const unsubscribeIndex = Math.floor(
          Math.random() * activeSubscriptions.length
        );
        const unsubscribeStart = performance.now();

        activeSubscriptions[unsubscribeIndex]();

        const unsubscribeEnd = performance.now();
        totalUnsubscriptionTime += unsubscribeEnd - unsubscribeStart;
        totalUnsubscriptions++;

        activeSubscriptions.splice(unsubscribeIndex, 1);
      }

      // Wait for next subscription
      await new Promise((resolve) => setTimeout(resolve, subscriptionInterval));
    }

    // Clean up remaining subscriptions
    for (const unsubscribe of activeSubscriptions) {
      const unsubscribeStart = performance.now();
      unsubscribe();
      const unsubscribeEnd = performance.now();
      totalUnsubscriptionTime += unsubscribeEnd - unsubscribeStart;
      totalUnsubscriptions++;
    }
  });

  return {
    totalSubscriptions,
    totalUnsubscriptions,
    averageSubscriptionTime: totalSubscriptionTime / totalSubscriptions,
    averageUnsubscriptionTime: totalUnsubscriptionTime / totalUnsubscriptions,
    memoryStats,
  };
}

/**
 * Test garbage collection pressure
 */
export async function testGCPressure(operationsCount: number = 10000): Promise<{
  gcEvents: number;
  totalGCTime: number;
  averageGCTime: number;
  memoryBeforeGC: number;
  memoryAfterGC: number;
  operationsCompleted: number;
}> {
  let gcEvents = 0;
  let totalGCTime = 0;
  let memoryBeforeGC = 0;
  let memoryAfterGC = 0;
  let operationsCompleted = 0;

  // Monitor GC if available
  const originalGC = global.gc;
  let gcStart = 0;

  if (originalGC) {
    // Override GC to monitor calls
    global.gc = (() => {
      gcStart = performance.now();
      memoryBeforeGC = process.memoryUsage?.()?.heapUsed || 0;

      originalGC();

      const gcEnd = performance.now();
      memoryAfterGC = process.memoryUsage?.()?.heapUsed || 0;

      gcEvents++;
      totalGCTime += gcEnd - gcStart;
    }) as any;
  }

  try {
    // Create pressure by generating lots of temporary objects
    for (let i = 0; i < operationsCount; i++) {
      const store = new FieldStore({
        temp1: new Array(1000).fill(i).join(""),
        temp2: new Array(1000).fill(i * 2).join(""),
        temp3: new Array(1000).fill(i * 3).join(""),
      });

      // Perform operations that create temporary objects
      store.set({ temp1: new Array(500).fill(`updated${i}`).join("") });
      const derived = store.derived(
        "computed",
        ["temp1", "temp2"],
        (values) => values.temp1 + values.temp2
      );

      // Force occasional GC
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }

      operationsCompleted++;
    }
  } finally {
    // Restore original GC
    if (originalGC) {
      global.gc = originalGC;
    }
  }

  return {
    gcEvents,
    totalGCTime,
    averageGCTime: gcEvents > 0 ? totalGCTime / gcEvents : 0,
    memoryBeforeGC,
    memoryAfterGC,
    operationsCompleted,
  };
}
