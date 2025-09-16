/**
 * Test suite for comparative benchmarks
 */

import { describe, it, expect } from "vitest";
import {
  compareBasicOperations,
  compareSubscriptionPerformance,
  compareMemoryEfficiency,
  compareWithManySubscribers,
  compareDerivedFields,
  runAllComparativeBenchmarks,
} from "./performance/comparative-benchmarks";
import { formatBenchmarkResults } from "./performance/benchmarks";
import { formatMemorySize } from "./performance/memory-utils";

describe("Comparative Benchmarks", () => {
  it("should compare basic operations performance", async () => {
    const results = await compareBasicOperations();

    console.log(formatBenchmarkResults(results));

    // NextTinyRXStore should be competitive
    const fieldStoreSet = results.results.find((r) =>
      r.name.includes("NextTinyRXStore - set")
    );
    const fieldStoreGet = results.results.find((r) =>
      r.name.includes("NextTinyRXStore - get")
    );

    expect(fieldStoreSet).toBeDefined();
    expect(fieldStoreGet).toBeDefined();
    expect(fieldStoreSet!.ops).toBeGreaterThan(1000); // At least 1K ops/sec
    expect(fieldStoreGet!.ops).toBeGreaterThan(10000); // At least 10K ops/sec
  }, 30000);

  it("should compare subscription performance", async () => {
    const { subscriptionBenchmarks, memoryUsage } =
      await compareSubscriptionPerformance();

    console.log(formatBenchmarkResults(subscriptionBenchmarks));
    console.log(
      `\nSubscription Memory Usage: ${formatMemorySize(
        memoryUsage.delta.heapUsedDelta
      )}`
    );

    const fieldStoreSubscribe = subscriptionBenchmarks.results.find((r) =>
      r.name.includes("NextTinyRXStore - subscribe")
    );

    expect(fieldStoreSubscribe).toBeDefined();
    expect(fieldStoreSubscribe!.ops).toBeGreaterThan(1000);
  }, 30000);

  it("should compare memory efficiency", async () => {
    const { stores } = await compareMemoryEfficiency();

    console.log("\n=== Memory Efficiency Comparison ===");
    stores.forEach((store) => {
      console.log(`${store.name}:`);
      console.log(
        `  Memory used: ${formatMemorySize(
          store.memoryUsage.delta.heapUsedDelta
        )}`
      );
      console.log(
        `  Memory per field: ${formatMemorySize(
          store.memoryUsage.delta.heapUsedDelta / store.finalSize
        )}`
      );
      console.log(`  Final size: ${store.finalSize} fields`);
      console.log("");
    });

    const fieldStore = stores.find((s) => s.name === "NextTinyRXStore");
    expect(fieldStore).toBeDefined();
    expect(fieldStore!.finalSize).toBe(1000);

    // Memory usage should be reasonable (less than 100MB for 1000 fields)
    expect(fieldStore!.memoryUsage.delta.heapUsedDelta).toBeLessThan(
      100 * 1024 * 1024
    );
  }, 60000);

  it("should compare performance with many subscribers", async () => {
    const results = await compareWithManySubscribers();

    console.log(formatBenchmarkResults(results));

    const fieldStoreMany = results.results.find((r) =>
      r.name.includes("NextTinyRXStore - update with")
    );

    expect(fieldStoreMany).toBeDefined();
    expect(fieldStoreMany!.ops).toBeGreaterThan(100); // Should handle 100 subscribers efficiently
  }, 30000);

  it("should compare derived fields performance", async () => {
    const results = await compareDerivedFields();

    console.log(formatBenchmarkResults(results));

    const fieldStoreDerived = results.results.find((r) =>
      r.name.includes("NextTinyRXStore - derived")
    );
    const fieldStoreUpdate = results.results.find((r) =>
      r.name.includes("NextTinyRXStore - update triggering")
    );

    expect(fieldStoreDerived).toBeDefined();
    expect(fieldStoreUpdate).toBeDefined();
    expect(fieldStoreDerived!.ops).toBeGreaterThan(1000);
    expect(fieldStoreUpdate!.ops).toBeGreaterThan(500);
  }, 30000);

  it("should run comprehensive benchmark suite", async () => {
    const results = await runAllComparativeBenchmarks();

    console.log("\n=== COMPREHENSIVE BENCHMARK SUMMARY ===\n");

    // Basic Operations Summary
    console.log("📊 BASIC OPERATIONS PERFORMANCE:");
    const fieldStoreSetOps =
      results.basicOperations.results.find((r) =>
        r.name.includes("NextTinyRXStore - set")
      )?.ops || 0;
    const fieldStoreGetOps =
      results.basicOperations.results.find((r) =>
        r.name.includes("NextTinyRXStore - get")
      )?.ops || 0;

    console.log(`  Set operations: ${fieldStoreSetOps.toFixed(0)} ops/sec`);
    console.log(`  Get operations: ${fieldStoreGetOps.toFixed(0)} ops/sec`);

    // Memory Summary
    console.log("\n💾 MEMORY EFFICIENCY:");
    const fieldStoreMemory = results.memoryEfficiency.stores.find(
      (s) => s.name === "NextTinyRXStore"
    );
    if (fieldStoreMemory) {
      console.log(
        `  Memory per 1000 fields: ${formatMemorySize(
          fieldStoreMemory.memoryUsage.delta.heapUsedDelta
        )}`
      );
      console.log(
        `  Memory per field: ${formatMemorySize(
          fieldStoreMemory.memoryUsage.delta.heapUsedDelta / 1000
        )}`
      );
    }

    // Subscription Performance
    console.log("\n🔗 SUBSCRIPTION PERFORMANCE:");
    const subscribeOps =
      results.subscriptions.benchmarks.results.find((r) =>
        r.name.includes("NextTinyRXStore - subscribe")
      )?.ops || 0;
    console.log(`  Subscription ops: ${subscribeOps.toFixed(0)} ops/sec`);
    console.log(
      `  Subscription memory: ${formatMemorySize(
        results.subscriptions.memory.delta.heapUsedDelta
      )}`
    );

    // Multi-subscriber Performance
    console.log("\n👥 MANY SUBSCRIBERS PERFORMANCE:");
    const manySubOps =
      results.manySubscribers.results.find((r) =>
        r.name.includes("NextTinyRXStore")
      )?.ops || 0;
    console.log(
      `  Update with 100 subscribers: ${manySubOps.toFixed(0)} ops/sec`
    );

    // Derived Fields Performance
    console.log("\n🧮 DERIVED FIELDS PERFORMANCE:");
    const derivedAccessOps =
      results.derivedFields.results.find((r) =>
        r.name.includes("NextTinyRXStore - derived field access")
      )?.ops || 0;
    const derivedUpdateOps =
      results.derivedFields.results.find((r) =>
        r.name.includes("NextTinyRXStore - update triggering")
      )?.ops || 0;
    console.log(
      `  Derived field access: ${derivedAccessOps.toFixed(0)} ops/sec`
    );
    console.log(
      `  Update with derived recompute: ${derivedUpdateOps.toFixed(0)} ops/sec`
    );

    console.log("\n✅ PERFORMANCE ANALYSIS COMPLETE\n");

    // Assertions to ensure reasonable performance
    expect(fieldStoreSetOps).toBeGreaterThan(1000);
    expect(fieldStoreGetOps).toBeGreaterThan(10000);
    expect(subscribeOps).toBeGreaterThan(1000);
    expect(manySubOps).toBeGreaterThan(100);
    expect(derivedAccessOps).toBeGreaterThan(1000);
    expect(derivedUpdateOps).toBeGreaterThan(500);

    if (fieldStoreMemory) {
      expect(fieldStoreMemory.memoryUsage.delta.heapUsedDelta).toBeLessThan(
        100 * 1024 * 1024
      );
    }
  }, 120000); // 2 minute timeout for comprehensive test
});
