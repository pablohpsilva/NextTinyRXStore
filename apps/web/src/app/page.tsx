import Link from "next/link";

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          NextTinyRXStore Examples
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
          Interactive demonstrations of all README examples
        </p>

        {/* Library Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-12">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Performant, SSR-friendly reactive state management
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Lightning-fast reactive state management that works seamlessly on
              both server and client. Built with custom reactive primitives for
              maximum performance and minimal bundle size.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  2.4 KB
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bundle size
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  3.3M+ ops/sec
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Performance
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  Zero deps
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Dependencies
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  1M fields
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Capacity
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Problems Solved */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Problems Solved
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Hydration mismatches
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Perfect server-client sync
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Unnecessary re-renders
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Field-level subscriptions
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Bundle bloat
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Zero external dependencies
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Performance bottlenecks
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Optimized for large datasets
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Universal Hooks
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Same API on server & client
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Field-level reactivity
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Subscribe to specific fields
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Auto-generated setters
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      No boilerplate code
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Derived fields
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Computed values that auto-update
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Usage */}
          <Link
            href="/basic-usage"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              🚀 Basic Usage
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Simple store creation and usage with auto-generated setters
            </p>
          </Link>

          {/* Field-Level Reactivity */}
          <Link
            href="/field-reactivity"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              🎯 Field-Level Reactivity
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Subscribe to individual fields for maximum performance
            </p>
          </Link>

          {/* Multi-Field Subscriptions */}
          <Link
            href="/multi-field"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              🔗 Multi-Field Subscriptions
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Subscribe to multiple fields with optimized re-rendering
            </p>
          </Link>

          {/* Auto-Generated Setters */}
          <Link
            href="/setters"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              ⚙️ Auto-Generated Setters
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Automatic setter creation for all store fields
            </p>
          </Link>

          {/* Derived Fields */}
          <Link
            href="/derived-fields"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              🧮 Derived Fields
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Computed fields that automatically update when dependencies change
            </p>
          </Link>

          {/* SSR Demo */}
          <Link
            href="/ssr-demo"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              🌐 SSR with Data Fetching
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Server-side rendering with store hydration
            </p>
          </Link>

          {/* Shopping Cart */}
          <Link
            href="/shopping-cart"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              🛒 Shopping Cart
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Complex state management with derived calculations
            </p>
          </Link>

          {/* Side Effects */}
          <Link
            href="/side-effects"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              🔔 Side Effects & Callbacks
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Register callbacks and work with observables directly
            </p>
          </Link>
        </div>

        {/* Performance Section */}
        <div className="mt-16">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Performance Benchmarks
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Comprehensive performance testing across multiple dimensions with
              exceptional results
            </p>
          </div>

          {/* Key Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Performance Metrics
              </h3>
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                A+ Grade
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  3.3M+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Get operations/sec
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  67x faster than target
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  1.5M+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Set operations/sec
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  154x faster than target
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  72 bytes
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Memory per field
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  1M+ fields supported
                </div>
              </div>
            </div>
          </div>

          {/* Test Coverage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Test Coverage
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Basic operation benchmarks
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  React integration performance
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Data capacity limits
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Comparative benchmarks
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Memory efficiency tests
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Cross-renderer safety
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Concurrent stress tests
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Zero memory leaks
                </span>
              </div>
            </div>
          </div>

          {/* Run Tests */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
              Run Performance Tests
            </h3>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Quick Benchmark
                  </div>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm">
                    <div className="text-gray-400">npm run perf:basic</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Full Test Suite
                  </div>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm">
                    <div className="text-gray-400">npm run perf:all</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Run from{" "}
                  <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs">
                    packages/NextTinyRXStore
                  </code>{" "}
                  directory for detailed reports
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
