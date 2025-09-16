import Link from "next/link";

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          NextTinyRXStore Examples
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Interactive demonstrations of all README examples
        </p>

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

          {/* Performance Demo */}
          {/* <Link
            href="/performance"
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              ⚡ Performance Features
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Smart re-rendering prevention and cache optimization
            </p>
          </Link> */}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            ← Back to Main Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
