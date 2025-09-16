/**
 * Comprehensive performance tests for NextTinyRXStore
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FieldStore } from "./store";
import {
  benchmark,
  compareBenchmarks,
  formatBenchmarkResults,
  stressTest,
} from "./performance/benchmarks";
import {
  testDataCapacity,
  testLargeValueCapacity,
  stressConcurrentOperations,
  testMemoryLeaks,
  testSubscriptionStress,
  testGCPressure,
} from "./performance/stress-tests";
import {
  measureMemoryUsage,
  MemoryMonitor,
  formatMemorySize,
  forceGC,
} from "./performance/memory-utils";

describe("NextTinyRXStore Performance Tests", () => {
  let store: FieldStore<{
    field1: string;
    field2: number;
    field3: boolean;
    field4: object;
  }>;

  beforeEach(() => {
    store = new FieldStore({
      field1: "initial",
      field2: 42,
      field3: true,
      field4: { nested: "value" },
    });

    // Force GC before each test if available
    forceGC();
  });

  afterEach(() => {
    // Force GC after each test if available
    forceGC();
  });

  describe("Data Capacity Tests", () => {
    it("should handle large numbers of fields", async () => {
      const result = await testDataCapacity();

      console.log(`\n=== Data Capacity Test Results ===`);
      console.log(`Max fields: ${result.maxFields.toLocaleString()}`);
      console.log(
        `Total memory used: ${formatMemorySize(result.totalMemoryUsed)}`
      );
      console.log(
        `Memory per field: ${formatMemorySize(
          result.totalMemoryUsed / result.maxFields
        )}`
      );

      if (result.errorMessage) {
        console.log(`Error encountered: ${result.errorMessage}`);
        console.log(`Time to failure: ${result.timeToFailure}ms`);
      }

      // Should handle at least 10,000 fields
      expect(result.maxFields).toBeGreaterThan(10000);
    }, 60000); // 60 second timeout

    it("should handle large individual values", async () => {
      const result = await testLargeValueCapacity();

      console.log(`\n=== Large Value Capacity Test Results ===`);
      console.log(`Max value size: ${formatMemorySize(result.maxValueSize)}`);
      console.log(`Memory used: ${formatMemorySize(result.memoryUsed)}`);

      if (result.errorMessage) {
        console.log(`Error: ${result.errorMessage}`);
      }

      // Should handle at least 1MB values
      expect(result.maxValueSize).toBeGreaterThan(1024 * 1024);
    }, 30000);

    it("should benchmark basic operations", async () => {
      const benchmarks = await compareBenchmarks(
        [
          {
            name: "set single field",
            fn: () => store.set({ field1: `value${Math.random()}` }),
          },
          {
            name: "get single field",
            fn: () => store.get("field1"),
          },
          {
            name: "get all fields",
            fn: () => store.getAll(),
          },
          {
            name: "set multiple fields",
            fn: () =>
              store.set({
                field1: `value${Math.random()}`,
                field2: Math.random() * 100,
              }),
          },
        ],
        { iterations: 10000, minTime: 2000 }
      );

      console.log(formatBenchmarkResults(benchmarks));

      // Basic performance expectations
      expect(benchmarks.results[0].ops).toBeGreaterThan(1000); // At least 1000 ops/sec for set
      expect(benchmarks.results[1].ops).toBeGreaterThan(10000); // At least 10000 ops/sec for get
    }, 30000);
  });

  describe("Memory Consumption Tests", () => {
    it("should track memory usage during operations", async () => {
      const { result, memoryStats } = await measureMemoryUsage(async () => {
        // Create many temporary stores
        const stores = [];
        for (let i = 0; i < 1000; i++) {
          const tempStore = new FieldStore({
            temp1: `value${i}`,
            temp2: i,
            temp3: i % 2 === 0,
          });
          stores.push(tempStore);

          tempStore.set({ temp1: `updated${i}` });
        }
        return stores.length;
      });

      console.log(`\n=== Memory Usage Test Results ===`);
      console.log(`Operations completed: ${result}`);
      console.log(
        `Initial memory: ${formatMemorySize(memoryStats.initial.heapUsed)}`
      );
      console.log(
        `Final memory: ${formatMemorySize(memoryStats.final.heapUsed)}`
      );
      console.log(
        `Peak memory: ${formatMemorySize(memoryStats.peak.heapUsed)}`
      );
      console.log(
        `Memory delta: ${formatMemorySize(memoryStats.delta.heapUsedDelta)}`
      );
      console.log(`Duration: ${memoryStats.delta.timeDelta}ms`);
      console.log(`Samples collected: ${memoryStats.samples.length}`);

      expect(result).toBe(1000);
      expect(memoryStats.samples.length).toBeGreaterThan(0);
    }, 30000);

    it("should detect memory leaks", async () => {
      const result = await testMemoryLeaks(500);

      console.log(`\n=== Memory Leak Test Results ===`);
      console.log(`Has memory leak: ${result.hasMemoryLeak}`);
      console.log(`Memory growth: ${formatMemorySize(result.memoryGrowth)}`);
      console.log(
        `Final memory usage: ${formatMemorySize(result.finalMemoryUsage)}`
      );
      console.log(`Iterations tested: ${result.iterationResults.length}`);

      // Should not have significant memory leaks
      expect(result.hasMemoryLeak).toBe(false);
    }, 60000);

    it("should monitor memory usage with MemoryMonitor", async () => {
      const monitor = new MemoryMonitor(5); // Sample every 5ms

      monitor.start();

      // Perform memory-intensive operations
      for (let i = 0; i < 100; i++) {
        const tempStore = new FieldStore({
          large: new Array(1000).fill(i).join(""),
        });
        tempStore.set({ large: new Array(1000).fill(i * 2).join("") });
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = monitor.stop();

      console.log(`\n=== Memory Monitor Results ===`);
      console.log(`Samples: ${stats.samples.length}`);
      console.log(`Duration: ${stats.delta.timeDelta}ms`);
      console.log(
        `Memory delta: ${formatMemorySize(stats.delta.heapUsedDelta)}`
      );

      expect(stats.samples.length).toBeGreaterThan(5);
      expect(stats.delta.timeDelta).toBeGreaterThan(90);
    });
  });

  describe("Garbage Collection Tests", () => {
    it("should measure GC pressure", async () => {
      const result = await testGCPressure(1000);

      console.log(`\n=== GC Pressure Test Results ===`);
      console.log(`Operations completed: ${result.operationsCompleted}`);
      console.log(`GC events: ${result.gcEvents}`);
      console.log(`Total GC time: ${result.totalGCTime.toFixed(2)}ms`);
      console.log(`Average GC time: ${result.averageGCTime.toFixed(2)}ms`);
      console.log(
        `Memory before GC: ${formatMemorySize(result.memoryBeforeGC)}`
      );
      console.log(`Memory after GC: ${formatMemorySize(result.memoryAfterGC)}`);

      expect(result.operationsCompleted).toBe(1000);
    }, 60000);
  });

  describe("Concurrent Operations Tests", () => {
    it("should handle concurrent read operations", async () => {
      const result = await stressConcurrentOperations(store, {
        concurrent: 10,
        duration: 5000,
        operationType: "read",
        fieldCount: 4,
      });

      console.log(`\n=== Concurrent Read Test Results ===`);
      console.log(`Total operations: ${result.stressResult.totalOperations}`);
      console.log(`Successful: ${result.stressResult.successfulOperations}`);
      console.log(`Failed: ${result.stressResult.failedOperations}`);
      console.log(
        `Avg ops/sec: ${result.stressResult.averageOpsPerSecond.toFixed(0)}`
      );
      console.log(`Peak ops/sec: ${result.stressResult.peakOpsPerSecond}`);
      console.log(
        `Average operation time: ${result.averageOperationTime.toFixed(4)}ms`
      );
      console.log(
        `Memory delta: ${formatMemorySize(
          result.memoryStats.delta.heapUsedDelta
        )}`
      );

      // Some operations may fail under extreme concurrent load
      expect(result.stressResult.failedOperations).toBeLessThan(
        result.stressResult.totalOperations * 0.5
      ); // Less than 50% failure rate
      expect(result.stressResult.successfulOperations).toBeGreaterThan(1000);
    }, 30000);

    it("should handle concurrent write operations", async () => {
      const result = await stressConcurrentOperations(store, {
        concurrent: 5,
        duration: 5000,
        operationType: "write",
        fieldCount: 4,
      });

      console.log(`\n=== Concurrent Write Test Results ===`);
      console.log(`Total operations: ${result.stressResult.totalOperations}`);
      console.log(`Successful: ${result.stressResult.successfulOperations}`);
      console.log(`Failed: ${result.stressResult.failedOperations}`);
      console.log(
        `Avg ops/sec: ${result.stressResult.averageOpsPerSecond.toFixed(0)}`
      );
      console.log(`Peak ops/sec: ${result.stressResult.peakOpsPerSecond}`);
      console.log(
        `Average operation time: ${result.averageOperationTime.toFixed(4)}ms`
      );
      console.log(
        `Memory delta: ${formatMemorySize(
          result.memoryStats.delta.heapUsedDelta
        )}`
      );

      expect(result.stressResult.failedOperations).toBe(0); // Write operations should not fail
      expect(result.stressResult.successfulOperations).toBeGreaterThan(500);
    }, 30000);

    it("should handle mixed read/write operations", async () => {
      const result = await stressConcurrentOperations(store, {
        concurrent: 8,
        duration: 5000,
        operationType: "mixed",
        fieldCount: 4,
      });

      console.log(`\n=== Mixed Operations Test Results ===`);
      console.log(`Total operations: ${result.stressResult.totalOperations}`);
      console.log(`Successful: ${result.stressResult.successfulOperations}`);
      console.log(`Failed: ${result.stressResult.failedOperations}`);
      console.log(
        `Avg ops/sec: ${result.stressResult.averageOpsPerSecond.toFixed(0)}`
      );
      console.log(`Peak ops/sec: ${result.stressResult.peakOpsPerSecond}`);
      console.log(
        `Average operation time: ${result.averageOperationTime.toFixed(4)}ms`
      );
      console.log(
        `Memory delta: ${formatMemorySize(
          result.memoryStats.delta.heapUsedDelta
        )}`
      );

      // Mixed operations may have some failures under extreme concurrent load
      expect(result.stressResult.failedOperations).toBeLessThan(
        result.stressResult.totalOperations * 0.5
      ); // Less than 50% failure rate
      expect(result.stressResult.successfulOperations).toBeGreaterThan(800);
    }, 30000);
  });

  describe("Subscription Stress Tests", () => {
    it("should handle rapid subscription cycles", async () => {
      const result = await testSubscriptionStress(store, {
        subscriptionsPerSecond: 100,
        duration: 5000,
        fieldCount: 4,
      });

      console.log(`\n=== Subscription Stress Test Results ===`);
      console.log(`Total subscriptions: ${result.totalSubscriptions}`);
      console.log(`Total unsubscriptions: ${result.totalUnsubscriptions}`);
      console.log(
        `Avg subscription time: ${result.averageSubscriptionTime.toFixed(4)}ms`
      );
      console.log(
        `Avg unsubscription time: ${result.averageUnsubscriptionTime.toFixed(
          4
        )}ms`
      );
      console.log(
        `Memory delta: ${formatMemorySize(
          result.memoryStats.delta.heapUsedDelta
        )}`
      );

      expect(result.totalSubscriptions).toBeGreaterThan(400);
      expect(result.totalUnsubscriptions).toBeGreaterThan(0);
      expect(result.averageSubscriptionTime).toBeLessThan(1); // Should be very fast
    }, 30000);
  });

  describe("Edge Cases and Limits", () => {
    it("should handle deeply nested objects", async () => {
      const createDeepObject = (depth: number): any => {
        if (depth === 0) return "leaf";
        return { nested: createDeepObject(depth - 1) };
      };

      const { result, memoryStats } = await measureMemoryUsage(async () => {
        const deepStore = new FieldStore({
          shallow: "value",
          deep: createDeepObject(100), // 100 levels deep
          veryDeep: createDeepObject(500), // 500 levels deep
        });

        // Test operations on deep objects
        deepStore.get("deep");
        deepStore.set({ shallow: "updated" });

        return deepStore.getAll();
      });

      console.log(`\n=== Deep Object Test Results ===`);
      console.log(
        `Memory delta: ${formatMemorySize(memoryStats.delta.heapUsedDelta)}`
      );
      console.log(`Fields created: ${Object.keys(result).length}`);

      expect(Object.keys(result)).toContain("deep");
      expect(Object.keys(result)).toContain("veryDeep");
    }, 30000);

    it("should handle rapid field creation and deletion", async () => {
      const { result, memoryStats } = await measureMemoryUsage(async () => {
        let operationCount = 0;
        const tempStore = new FieldStore({});

        for (let i = 0; i < 1000; i++) {
          // Add field
          tempStore.set({ [`temp${i}`]: `value${i}` });
          operationCount++;

          // Remove field (by setting to undefined - simulate deletion)
          if (i >= 100) {
            tempStore.set({ [`temp${i - 100}`]: undefined });
            operationCount++;
          }
        }

        return operationCount;
      });

      console.log(`\n=== Rapid Field Operations Test Results ===`);
      console.log(`Total operations: ${result}`);
      console.log(
        `Memory delta: ${formatMemorySize(memoryStats.delta.heapUsedDelta)}`
      );

      expect(result).toBe(1900); // 1000 adds + 900 updates
    }, 30000);
  });

  describe("Performance Benchmarks vs Expectations", () => {
    it("should meet performance thresholds", async () => {
      const thresholds = {
        setSingleField: 10000, // ops/sec
        getSingleField: 50000, // ops/sec
        getAllFields: 25000, // ops/sec
        memoryPerField: 1024, // bytes
      };

      const benchmarks = await compareBenchmarks(
        [
          {
            name: "set single field",
            fn: () => store.set({ field1: "new value" }),
          },
          {
            name: "get single field",
            fn: () => store.get("field1"),
          },
          {
            name: "get all fields",
            fn: () => store.getAll(),
          },
        ],
        { iterations: 50000, minTime: 3000 }
      );

      console.log(formatBenchmarkResults(benchmarks));

      const setOps =
        benchmarks.results.find((r) => r.name === "set single field")?.ops || 0;
      const getOps =
        benchmarks.results.find((r) => r.name === "get single field")?.ops || 0;
      const getAllOps =
        benchmarks.results.find((r) => r.name === "get all fields")?.ops || 0;

      console.log(`\n=== Performance Threshold Check ===`);
      console.log(
        `Set ops/sec: ${setOps.toFixed(0)} (threshold: ${
          thresholds.setSingleField
        })`
      );
      console.log(
        `Get ops/sec: ${getOps.toFixed(0)} (threshold: ${
          thresholds.getSingleField
        })`
      );
      console.log(
        `GetAll ops/sec: ${getAllOps.toFixed(0)} (threshold: ${
          thresholds.getAllFields
        })`
      );

      // Performance assertions
      expect(setOps).toBeGreaterThan(thresholds.setSingleField);
      expect(getOps).toBeGreaterThan(thresholds.getSingleField);
      expect(getAllOps).toBeGreaterThan(thresholds.getAllFields);
    }, 60000);
  });
});
