# NextTinyRXStore Performance Testing

This document describes the comprehensive performance testing suite for NextTinyRXStore, designed to measure and validate the library's performance characteristics across multiple dimensions.

## Overview

The performance testing suite includes:

- **Basic Operation Benchmarks**: Core CRUD operations performance
- **Data Capacity Tests**: Maximum data handling capabilities
- **Memory Efficiency Tests**: Memory usage patterns and leak detection
- **Concurrent Operation Stress Tests**: Multi-threaded performance
- **React Integration Performance**: Re-render optimization and hook efficiency
- **Comparative Benchmarks**: Performance vs other state management solutions
- **Garbage Collection Impact**: GC pressure and cleanup efficiency

## Running Performance Tests

### Quick Start

```bash
# Run all performance tests
npm run perf

# Run specific test suites
npm run perf:basic      # Basic operation benchmarks
npm run perf:react      # React integration tests
npm run perf:comparative # Comparative benchmarks
npm run perf:all        # All test suites separately

# For CI environments
npm run perf:ci
```

### Requirements

For optimal memory testing, run with garbage collection exposed:

```bash
node --expose-gc -r ts-node/register src/performance-runner.ts
```

## Test Categories

### 1. Basic Operation Benchmarks

Tests core store operations:

- **Set Operations**: Single and multiple field updates
- **Get Operations**: Field retrieval and bulk access
- **Subscription Management**: Subscribe/unsubscribe cycles
- **Derived Fields**: Computed field creation and updates

**Performance Targets:**

- Set operations: >10,000 ops/sec
- Get operations: >50,000 ops/sec
- Subscriptions: >1,000 ops/sec

### 2. Data Capacity Tests

Measures maximum data handling:

- **Field Count**: Maximum number of fields per store
- **Value Size**: Largest individual value storage
- **Memory Scaling**: Memory usage vs field count
- **Time Complexity**: Performance degradation patterns

**Typical Results:**

- Max fields: >50,000 fields
- Memory per field: <1KB average
- Value size: >100MB individual values

### 3. Memory Efficiency Tests

Monitors memory usage patterns:

- **Memory Leak Detection**: Long-running operation analysis
- **GC Pressure**: Garbage collection frequency and impact
- **Memory Growth**: Heap usage over time
- **Cleanup Efficiency**: Resource deallocation

**Health Indicators:**

- No memory leaks detected
- GC frequency within normal bounds
- Linear memory scaling
- Complete cleanup on disposal

### 4. Concurrent Operation Stress Tests

Tests under concurrent load:

- **Read Concurrency**: Multiple simultaneous reads
- **Write Concurrency**: Concurrent updates and conflict resolution
- **Mixed Operations**: Read/write operation interleaving
- **Subscription Stress**: Rapid subscribe/unsubscribe cycles

**Load Targets:**

- 10+ concurrent readers
- 5+ concurrent writers
- 100+ subscriptions/sec
- 5+ second sustained load

### 5. React Integration Performance

React-specific performance metrics:

- **Re-render Optimization**: Unnecessary render prevention
- **Hook Performance**: useField, useFields, useStore efficiency
- **Component Lifecycle**: Mount/unmount performance
- **Large Dataset Handling**: Performance with big lists

**React Targets:**

- Minimal re-renders (only when data changes)
- <5ms average render time
- Efficient component cleanup
- Linear performance with data size

### 6. Comparative Benchmarks

Performance vs other solutions:

- **Vanilla JavaScript**: Basic object management
- **Map-based Store**: Map data structure comparison
- **Event Emitter**: Event-driven state comparison
- **Feature Parity**: Derived fields and subscriptions

**Competitive Analysis:**

- Comparable or better basic operation speed
- Superior memory efficiency
- Better subscription management
- Optimized derived field computation

## Performance Metrics

### Key Performance Indicators (KPIs)

1. **Throughput**

   - Operations per second for reads/writes
   - Subscription creation/destruction rate
   - React re-render frequency

2. **Latency**

   - Average operation time
   - 95th percentile response time
   - Maximum operation time

3. **Memory Efficiency**

   - Memory per field stored
   - Peak memory usage
   - Memory leak detection

4. **Scalability**
   - Performance vs data size
   - Concurrent operation handling
   - Subscriber count impact

### Performance Grades

The test suite provides performance grades:

- **A+**: Exceptional performance (top 10% of benchmarks)
- **A**: Excellent performance (meets or exceeds targets)
- **B**: Good performance (within acceptable ranges)
- **C**: Adequate performance (may need optimization)
- **F**: Poor performance (requires attention)

## Understanding Results

### Benchmark Output

```
=== Basic Operations ===
Set single field:
  Iterations: 10000
  Total time: 892.34ms
  Average: 0.0892ms/op
  Ops/sec: 11,206 (fastest)

Get single field:
  Iterations: 10000
  Total time: 234.12ms
  Average: 0.0234ms/op
  Ops/sec: 42,734 (4.82x faster)
```

### Memory Reports

```
=== Memory Usage ===
Initial memory: 15.23 MB
Final memory: 87.45 MB
Peak memory: 92.11 MB
Memory delta: +72.22 MB
Duration: 5,432ms
Samples collected: 543
```

### Stress Test Results

```
=== Concurrent Operations ===
Total operations: 8,432
Successful: 8,432 (100%)
Failed: 0 (0%)
Avg ops/sec: 1,686
Peak ops/sec: 2,341
Average operation time: 0.5932ms
```

## Optimization Strategies

Based on test results, consider these optimizations:

### For High-Frequency Updates

- Use batch updates with multiple fields
- Implement debouncing for rapid changes
- Consider derived fields for computed values

### For Memory Efficiency

- Monitor field count vs memory usage
- Use appropriate data types
- Clean up unused subscriptions

### For React Performance

- Use specific field subscriptions vs full store
- Implement proper memoization
- Avoid unnecessary re-renders

## Continuous Performance Monitoring

### CI Integration

Add performance tests to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run Performance Tests
  run: npm run perf:ci

- name: Check Performance Regression
  run: node scripts/check-performance-regression.js
```

### Performance Budgets

Set performance budgets in your project:

```json
{
  "performanceBudgets": {
    "setOperations": 10000,
    "getOperations": 50000,
    "memoryPerField": 1024,
    "maxRenderTime": 5
  }
}
```

## Troubleshooting Performance Issues

### Common Issues and Solutions

1. **Slow Set Operations**

   - Check for excessive derived field computations
   - Verify subscription count and complexity
   - Consider batching multiple updates

2. **High Memory Usage**

   - Monitor for memory leaks in subscriptions
   - Check large object storage patterns
   - Verify proper cleanup in component unmounting

3. **React Re-render Issues**

   - Use field-specific subscriptions
   - Implement proper dependency arrays
   - Check for unnecessary state changes

4. **Subscription Performance**
   - Limit subscriber count per field
   - Use cleanup functions properly
   - Consider subscription batching

## Advanced Performance Analysis

### Profiling Tools

For detailed analysis, use:

- Node.js profiler: `node --prof`
- Chrome DevTools: Memory and Performance tabs
- React DevTools Profiler: Component render analysis

### Custom Metrics

Add custom performance monitoring:

```typescript
import { measureMemoryUsage, benchmark } from "./performance";

// Custom operation benchmarking
const result = await benchmark("custom-operation", () => {
  // Your operation here
});

// Memory impact measurement
const { result, memoryStats } = await measureMemoryUsage(() => {
  // Memory-intensive operation
});
```

## Performance Test Architecture

### Test Structure

```
src/performance/
├── index.ts                    # Main exports
├── benchmarks.ts              # Benchmarking utilities
├── memory-utils.ts            # Memory monitoring
├── react-performance.ts       # React-specific tests
├── stress-tests.ts           # Stress testing
└── comparative-benchmarks.ts  # Comparison tests

src/
├── performance.test.ts        # Core performance tests
├── react-performance.test.tsx # React integration tests
├── comparative-benchmarks.test.ts # Benchmark comparisons
└── performance-runner.ts      # Test runner script
```

### Extensibility

The performance testing framework is designed to be extensible:

1. **Add New Benchmarks**: Create functions in appropriate modules
2. **Custom Metrics**: Implement new measurement utilities
3. **Additional Comparisons**: Add competing libraries to comparative tests
4. **React Components**: Create new React performance test scenarios

This comprehensive performance testing suite ensures NextTinyRXStore maintains optimal performance characteristics across all usage scenarios and provides confidence in production deployments.
