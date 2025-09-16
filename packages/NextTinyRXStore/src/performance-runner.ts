#!/usr/bin/env node

/**
 * Performance Test Runner for NextTinyRXStore
 * Run with: npm run perf
 */

import {
  testDataCapacity,
  testLargeValueCapacity,
  stressConcurrentOperations,
  testMemoryLeaks,
  testSubscriptionStress,
  testGCPressure,
} from "./performance/stress-tests";
import { runAllComparativeBenchmarks } from "./performance/comparative-benchmarks";
import {
  formatMemorySize,
  forceGC,
  measureMemoryUsage,
} from "./performance/memory-utils";
import {
  benchmark,
  compareBenchmarks,
  formatBenchmarkResults,
} from "./performance/benchmarks";
import { FieldStore } from "./store";

interface PerformanceReport {
  timestamp: string;
  version: string;
  environment: {
    node: string;
    platform: string;
    arch: string;
    memory: {
      total: number;
      free: number;
    };
  };
  results: {
    basicPerformance: any;
    dataCapacity: any;
    memoryEfficiency: any;
    stressTests: any;
    comparativeBenchmarks: any;
  };
}

/**
 * Get system information
 */
function getSystemInfo() {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    memory: {
      total: require("os").totalmem(),
      free: require("os").freemem(),
    },
  };
}

/**
 * Run basic performance tests
 */
async function runBasicPerformanceTests() {
  console.log("\n🔬 Running Basic Performance Tests...\n");

  const store = new FieldStore({
    counter: 0,
    text: "hello",
    list: ["item1", "item2"],
    user: { name: "John", age: 30 },
  });

  const benchmarks = await compareBenchmarks(
    [
      {
        name: "Set single field",
        fn: () => store.set({ counter: Math.random() * 100 }),
      },
      {
        name: "Get single field",
        fn: () => store.get("counter"),
      },
      {
        name: "Set multiple fields",
        fn: () =>
          store.set({
            counter: Math.random() * 100,
            text: `text${Math.random()}`,
          }),
      },
      {
        name: "Get all fields",
        fn: () => store.getAll(),
      },
      {
        name: "Create derived field",
        fn: () => {
          const tempStore = new FieldStore({ a: 1, b: 2 });
          tempStore.derived("sum", ["a", "b"], (values) => values.a + values.b);
        },
      },
      {
        name: "Subscribe/unsubscribe",
        fn: () => {
          const unsubscribe = store.register("counter", () => {});
          unsubscribe();
        },
      },
    ],
    { iterations: 10000, minTime: 3000 }
  );

  console.log(formatBenchmarkResults(benchmarks));
  return benchmarks;
}

/**
 * Run data capacity tests
 */
async function runDataCapacityTests() {
  console.log("\n📊 Running Data Capacity Tests...\n");

  console.log("Testing maximum field count...");
  const fieldCapacity = await testDataCapacity();

  console.log("Testing large value capacity...");
  const valueCapacity = await testLargeValueCapacity();

  console.log(`\n=== Data Capacity Results ===`);
  console.log(`Max fields: ${fieldCapacity.maxFields.toLocaleString()}`);
  console.log(
    `Total memory for fields: ${formatMemorySize(
      fieldCapacity.totalMemoryUsed
    )}`
  );
  console.log(
    `Memory per field: ${formatMemorySize(
      fieldCapacity.totalMemoryUsed / fieldCapacity.maxFields
    )}`
  );
  console.log(
    `Max value size: ${formatMemorySize(valueCapacity.maxValueSize)}`
  );
  console.log(
    `Memory for large value: ${formatMemorySize(valueCapacity.memoryUsed)}`
  );

  return { fieldCapacity, valueCapacity };
}

/**
 * Run memory efficiency tests
 */
async function runMemoryEfficiencyTests() {
  console.log("\n💾 Running Memory Efficiency Tests...\n");

  console.log("Testing memory leaks...");
  const leakTest = await testMemoryLeaks(1000);

  console.log("Testing GC pressure...");
  const gcTest = await testGCPressure(5000);

  console.log(`\n=== Memory Efficiency Results ===`);
  console.log(
    `Memory leak detected: ${leakTest.hasMemoryLeak ? "YES ⚠️" : "NO ✅"}`
  );
  console.log(`Memory growth: ${formatMemorySize(leakTest.memoryGrowth)}`);
  console.log(`GC events: ${gcTest.gcEvents}`);
  console.log(`Total GC time: ${gcTest.totalGCTime.toFixed(2)}ms`);
  console.log(`Average GC time: ${gcTest.averageGCTime.toFixed(2)}ms`);

  return { leakTest, gcTest };
}

/**
 * Run stress tests
 */
async function runStressTests() {
  console.log("\n🚀 Running Stress Tests...\n");

  const store = new FieldStore({
    field1: "value1",
    field2: "value2",
    field3: "value3",
    field4: "value4",
  });

  console.log("Testing concurrent read operations...");
  const readStress = await stressConcurrentOperations(store, {
    concurrent: 10,
    duration: 5000,
    operationType: "read",
    fieldCount: 4,
  });

  console.log("Testing concurrent write operations...");
  const writeStress = await stressConcurrentOperations(store, {
    concurrent: 5,
    duration: 5000,
    operationType: "write",
    fieldCount: 4,
  });

  console.log("Testing subscription stress...");
  const subscriptionStress = await testSubscriptionStress(store, {
    subscriptionsPerSecond: 100,
    duration: 3000,
    fieldCount: 4,
  });

  console.log(`\n=== Stress Test Results ===`);
  console.log(
    `Read operations: ${
      readStress.stressResult.totalOperations
    } (${readStress.stressResult.averageOpsPerSecond.toFixed(0)} ops/sec)`
  );
  console.log(
    `Write operations: ${
      writeStress.stressResult.totalOperations
    } (${writeStress.stressResult.averageOpsPerSecond.toFixed(0)} ops/sec)`
  );
  console.log(
    `Subscriptions: ${subscriptionStress.totalSubscriptions} created, ${subscriptionStress.totalUnsubscriptions} removed`
  );
  console.log(
    `Read memory delta: ${formatMemorySize(
      readStress.memoryStats.delta.heapUsedDelta
    )}`
  );
  console.log(
    `Write memory delta: ${formatMemorySize(
      writeStress.memoryStats.delta.heapUsedDelta
    )}`
  );

  return { readStress, writeStress, subscriptionStress };
}

/**
 * Generate performance report
 */
function generateReport(results: any): PerformanceReport {
  return {
    timestamp: new Date().toISOString(),
    version: require("../package.json").version,
    environment: getSystemInfo(),
    results,
  };
}

/**
 * Main performance test runner
 */
async function main() {
  console.log("🎯 NextTinyRXStore Performance Test Suite");
  console.log("==========================================\n");

  const startTime = Date.now();

  // Force GC before starting
  if (forceGC()) {
    console.log("✅ Garbage collection forced\n");
  } else {
    console.log(
      "⚠️  GC not available (run with --expose-gc for better memory tests)\n"
    );
  }

  try {
    // Run all test suites
    const basicPerformance = await runBasicPerformanceTests();
    const dataCapacity = await runDataCapacityTests();
    const memoryEfficiency = await runMemoryEfficiencyTests();
    const stressTests = await runStressTests();

    console.log("\n🔄 Running Comparative Benchmarks...");
    const comparativeBenchmarks = await runAllComparativeBenchmarks();

    // Generate final report
    const report = generateReport({
      basicPerformance,
      dataCapacity,
      memoryEfficiency,
      stressTests,
      comparativeBenchmarks,
    });

    const totalTime = Date.now() - startTime;

    console.log("\n🏁 PERFORMANCE TEST SUMMARY");
    console.log("============================\n");

    console.log(`📅 Test Date: ${report.timestamp}`);
    console.log(`📦 Version: ${report.version}`);
    console.log(`⏱️  Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(
      `🖥️  Environment: ${report.environment.node} on ${report.environment.platform} ${report.environment.arch}`
    );
    console.log(
      `💾 System Memory: ${formatMemorySize(
        report.environment.memory.total
      )} total, ${formatMemorySize(report.environment.memory.free)} free\n`
    );

    // Key performance metrics
    const setOps =
      basicPerformance.results.find((r: any) => r.name === "Set single field")
        ?.ops || 0;
    const getOps =
      basicPerformance.results.find((r: any) => r.name === "Get single field")
        ?.ops || 0;

    console.log("📊 KEY PERFORMANCE METRICS:");
    console.log(`   Set Operations: ${setOps.toFixed(0)} ops/sec`);
    console.log(`   Get Operations: ${getOps.toFixed(0)} ops/sec`);
    console.log(
      `   Max Fields: ${dataCapacity.fieldCapacity.maxFields.toLocaleString()}`
    );
    console.log(
      `   Memory per Field: ${formatMemorySize(
        dataCapacity.fieldCapacity.totalMemoryUsed /
          dataCapacity.fieldCapacity.maxFields
      )}`
    );
    console.log(
      `   Memory Leaks: ${
        memoryEfficiency.leakTest.hasMemoryLeak ? "DETECTED ⚠️" : "NONE ✅"
      }`
    );

    // Performance grades
    console.log("\n🎯 PERFORMANCE GRADES:");
    console.log(
      `   Set Performance: ${
        setOps > 10000 ? "A+" : setOps > 5000 ? "A" : setOps > 1000 ? "B" : "C"
      }`
    );
    console.log(
      `   Get Performance: ${
        getOps > 50000
          ? "A+"
          : getOps > 25000
          ? "A"
          : getOps > 10000
          ? "B"
          : "C"
      }`
    );
    console.log(
      `   Memory Efficiency: ${
        dataCapacity.fieldCapacity.maxFields > 50000
          ? "A+"
          : dataCapacity.fieldCapacity.maxFields > 25000
          ? "A"
          : "B"
      }`
    );
    console.log(
      `   Stability: ${!memoryEfficiency.leakTest.hasMemoryLeak ? "A+" : "F"}`
    );

    // Save report to file
    const fs = require("fs");
    const reportPath = "./performance-report.json";
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    console.log("\n✅ Performance testing completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Performance testing failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runPerformanceTests };
