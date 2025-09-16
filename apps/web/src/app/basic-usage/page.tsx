import Link from "next/link";
import { userStore } from "../../store/demoStores";
import UserProfile from "./UserProfile";

export default function BasicUsagePage() {
  // ✨ Works perfectly on the server!
  const userName = userStore.get("name");
  const userAge = userStore.get("age");

  // Initialize server-side data
  userStore.set({
    name: "Server-initialized User",
    age: 30,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🚀 Basic Usage
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Simple store creation and usage with auto-generated setters
        </p>

        {/* Server-side data display */}
        <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-300">
            📊 Server-Side Data (SSR)
          </h2>
          <p className="text-green-700 dark:text-green-300">
            Server read: <strong>{userName}</strong> is{" "}
            <strong>{userAge}</strong> years old
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            This data was read on the server and rendered as part of the initial
            HTML.
          </p>
        </div>

        {/* Client-side interactive component */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Interactive Client Component
          </h2>
          <UserProfile />
        </div>

        {/* Code examples */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Definition */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Store Definition
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// store/demoStores.ts
import { createFieldStore } from "@repo/next-tiny-rx-store";

export const userStore = createFieldStore({
  name: "Alice",
  age: 25,
  email: "alice@example.com",
});`}
            </pre>
          </div>

          {/* Server Usage */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Server Component Usage
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Server Component (this page)
const userName = userStore.get("name");
const userAge = userStore.get("age");

userStore.set({
  name: "Server-initialized User",
  age: 30,
});`}
            </pre>
          </div>

          {/* Client Usage */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Client Component Usage
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Client Component
"use client";
export default function UserProfile() {
  const { name, age, email } = userStore.useFields(["name", "age", "email"]);

  return (
    <div>
      <h1>Welcome, {name}!</h1>
      <p>Age: {age}</p>
      <p>Email: {email}</p>

      <button onClick={() => userStore.setters.setAge(age + 1)}>
        🎂 Happy Birthday!
      </button>
    </div>
  );
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
