import Link from "next/link";
import UserName from "./UserName";
import { userStore } from "../../store/demoStores";
import Buttons from "./buttons";

export default function FieldReactivityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🎯 Field-Level Reactivity
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Subscribe to individual fields for maximum performance
        </p>

        {/* Demo Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* UserName Component - Only subscribes to 'name' */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Name Component (Only re-renders on name changes)
            </h2>
            <UserName />
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ This component ONLY subscribes to the 'name' field. Changing
                age or email won't trigger a re-render here!
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Test Controls
            </h2>
            <div className="space-y-4">
              <Buttons />
            </div>

            <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded p-4">
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                Current Store State:
              </h3>
              <pre className="text-sm text-gray-700 dark:text-gray-300">
                {JSON.stringify(
                  {
                    name: userStore.get("name"),
                    age: userStore.get("age"),
                    email: userStore.get("email"),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>

        {/* Performance Explanation */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-300">
            ⚡ Performance Benefit
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300 mb-4">
            The Name component above only re-renders when the 'name' field
            changes. This is much more efficient than:
          </p>
          <ul className="list-disc list-inside space-y-2 text-yellow-700 dark:text-yellow-300">
            <li>Global state subscriptions that re-render on any change</li>
            <li>Context providers that pass down entire objects</li>
            <li>Redux selectors that don't use proper memoization</li>
          </ul>
        </div>

        {/* Code Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Field Subscription */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Field-Level Subscription
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`"use client";
function UserName() {
  // Only re-renders when 'name' changes
  const name = userStore.useField("name");

  return <h1>Hello, {name}!</h1>;
}`}
            </pre>
          </div>

          {/* Performance Comparison */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              vs. Full Store Subscription
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`"use client";
function UserNameInefficient() {
  // Re-renders on ANY store change!
  const { name } = userStore.useStore();

  return <h1>Hello, {name}!</h1>;
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
