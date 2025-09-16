"use client";
import { userStore } from "../../store/demoStores";

export default function UserProfile() {
  // You have atomic changes only on what matters!
  // const name = userStore.useField('name')
  // or
  const { name, age, email } = userStore.useFields(["name", "age", "email"]);

  // ✨ Universal hook - works on server AND client!
  // This one your component will react to the entire store.
  // const { name, age, email } = userStore.useStore();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">
          Welcome, {name}! 👋
        </h1>
        <div className="space-y-2 text-blue-700 dark:text-blue-300">
          <p>
            <strong>Age:</strong> {age}
          </p>
          <p>
            <strong>Email:</strong> {email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => userStore.setters.setAge(age + 1)}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🎂 Happy Birthday!
        </button>

        <button
          onClick={() =>
            userStore.setters.setName(name === "Alice" ? "Bob" : "Alice")
          }
          className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🔄 Toggle Name
        </button>

        <button
          onClick={() =>
            userStore.setters.setEmail(
              email.includes("example.com")
                ? "user@demo.com"
                : "alice@example.com"
            )
          }
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          📧 Change Email
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
          Current Store State:
        </h3>
        <pre className="text-sm text-gray-700 dark:text-gray-300">
          {JSON.stringify({ name, age, email }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
