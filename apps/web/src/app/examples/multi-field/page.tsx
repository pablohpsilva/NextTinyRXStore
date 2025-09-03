import Link from "next/link";
import UserInfo from "./UserInfo";
import { userStore } from "../../../store/demoStores";
import Buttons from "./buttons";

export default function MultiFieldPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/examples"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🔗 Multi-Field Subscriptions
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Subscribe to multiple fields with optimized re-rendering
        </p>

        {/* Demo Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* UserInfo Component - Subscribes to name and age only */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              User Info (Only re-renders on name or age changes)
            </h2>
            <UserInfo />
            <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-4">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                ✅ This component subscribes to ['name', 'age'] fields. Changing
                email won't trigger a re-render!
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

        {/* Optimization Explanation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-300">
            🧠 Smart Optimization
          </h2>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            Multi-field subscriptions use shallow equality checks to prevent
            unnecessary re-renders:
          </p>
          <ul className="list-disc list-inside space-y-2 text-blue-700 dark:text-blue-300">
            <li>Only re-renders if subscribed fields actually change</li>
            <li>
              Uses RxJS <code>distinctUntilChanged</code> with shallow equality
            </li>
            <li>
              Combines multiple observables efficiently with{" "}
              <code>combineLatest</code>
            </li>
            <li>Cached snapshot functions prevent object recreation</li>
          </ul>
        </div>

        {/* Code Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Multi-Field Subscription */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Multi-Field Subscription
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`"use client";
function UserInfo() {
  // Only re-renders when name OR age changes
  const { name, age } = userStore.useFields(["name", "age"]);

  return (
    <p>{name} is {age} years old</p>
  );
}`}
            </pre>
          </div>

          {/* Performance Benefits */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Behind the Scenes
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Internally uses RxJS optimization:
combineLatest(
  keys.map(k => 
    store.subjects[k].pipe(
      distinctUntilChanged(Object.is)
    )
  )
).pipe(
  map(() => ({ name, age })),
  distinctUntilChanged(shallowEqual)
)`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
