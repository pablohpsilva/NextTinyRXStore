# Performance Report Auto-Generator

This directory contains scripts for automatically generating and updating performance reports for NextTinyRXStore.

## 📋 Available Scripts

### `update-performance-report.js`

Automatically runs performance tests and updates the `PERFORMANCE_REPORT.md` file with the latest results.

**Usage:**

```bash
# Run via npm script (recommended)
npm run perf:update-report

# Or run directly
node scripts/update-performance-report.js
```

**What it does:**

1. 🧪 Runs core performance tests (`npm run perf:basic`)
2. 📊 Parses test output to extract key metrics
3. 📄 Generates a comprehensive performance report
4. 💾 Updates `PERFORMANCE_REPORT.md` with latest data
5. ✨ Provides colored console output with progress updates

**Key Features:**

- **Automatic metric extraction** from test output
- **Real-time performance grading** (A+ scale)
- **Comparative analysis** vs targets
- **Memory efficiency calculations**
- **Formatted tables** for easy reading
- **Timestamp tracking** for report freshness

## 📊 Generated Report Sections

The auto-generated report includes:

### 🏆 Performance Overview

- Overall grade and TL;DR summary
- Key highlights and achievements

### 📈 Detailed Metrics

- **Operation Speed**: Get/Set/GetAll performance
- **Memory Efficiency**: Field capacity, bytes per field
- **Concurrent Operations**: Stress test results
- **Subscription Performance**: Create/destroy timings

### 🎯 Performance Analysis

- **Benchmarks** with actual vs target comparisons
- **Competitive analysis** vs other solutions
- **Performance grades** across categories
- **Threshold compliance** checking

### 🛠️ Usage Information

- Test running instructions
- System requirements
- Use case recommendations

## 🔧 Configuration

The script can be customized by modifying:

- **Test command**: Change which performance tests to run
- **Parsing patterns**: Add new metrics to extract
- **Report format**: Modify the generated markdown template
- **Thresholds**: Update performance targets

## 📝 Example Output

```bash
🚀 NextTinyRXStore Performance Report Generator
================================================

1. Running performance tests...
   This may take a few minutes...
   ✅ Performance tests completed

2. Parsing test results...
   ✅ Found operation metrics: 6,854,493 ops/sec
   ✅ Found memory metrics: 1,000,000 max fields
   ✅ Found test count: 155 tests

3. Generating performance report...
   ✅ Report written to: PERFORMANCE_REPORT.md

🎉 Performance report updated successfully!

Key metrics:
  • Get operations: 6,854,493 ops/sec
  • Set operations: 1,456,633 ops/sec
  • Max fields: 1,000,000
  • Memory per field: 109 bytes
  • Tests passing: 155

📄 View the updated report at PERFORMANCE_REPORT.md
```

## 🔄 CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Update Performance Report
  run: npm run perf:update-report

- name: Commit Updated Report
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add PERFORMANCE_REPORT.md
    git commit -m "📊 Auto-update performance report" || exit 0
    git push
```

## 🚨 Troubleshooting

**Script fails with module errors:**

- Ensure you're running from the package root directory
- Check that all dependencies are installed: `npm install`

**Missing test data in report:**

- Verify tests are passing: `npm run test:run`
- Check that test output contains expected performance data
- Review parsing patterns in the script if test format changed

**Performance numbers seem wrong:**

- Run tests manually to verify: `npm run perf:basic`
- Check system load during test execution
- Ensure consistent testing environment

## 📚 Related Files

- `../PERFORMANCE_REPORT.md` - Generated performance report
- `../src/performance.test.ts` - Core performance tests
- `../package.json` - NPM scripts configuration

---

_This script is part of the NextTinyRXStore performance testing suite._
