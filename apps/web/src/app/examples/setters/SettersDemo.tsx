"use client";
import { createFieldStore } from "@repo/next-tiny-rx-store";

// Create a demo store for this page
const demoUserStore = createFieldStore({
  firstName: "John",
  lastName: "Doe",
  isActive: true,
  theme: "light" as "light" | "dark",
  notifications: false,
});

export default function SettersDemo() {
  const { firstName, lastName, isActive, theme, notifications } =
    demoUserStore.useStore();

  return (
    <div className="space-y-6">
      {/* Current State Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-300">
          Current User State
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>First Name:</strong> {firstName}
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Last Name:</strong> {lastName}
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Full Name:</strong> {firstName} {lastName}
            </p>
          </div>
          <div>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Status:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs ${
                  isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Theme:</strong> {theme}
            </p>
            <p className="text-blue-700 dark:text-blue-300">
              <strong>Notifications:</strong>{" "}
              {notifications ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </div>

      {/* Setter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Name Controls */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-orange-800 dark:text-orange-300">
            Name Controls
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => demoUserStore.setters.setFirstName("Alice")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              setFirstName("Alice")
            </button>
            <button
              onClick={() => demoUserStore.setters.setLastName("Johnson")}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              setLastName("Johnson")
            </button>
            <button
              onClick={() => {
                demoUserStore.setters.setFirstName("Bob");
                demoUserStore.setters.setLastName("Wilson");
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Set Both Names
            </button>
          </div>
        </div>

        {/* Status & Theme Controls */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-purple-800 dark:text-purple-300">
            Status & Theme
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => demoUserStore.setters.setIsActive(!isActive)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              setIsActive({!isActive ? "true" : "false"})
            </button>
            <button
              onClick={() =>
                demoUserStore.setters.setTheme(
                  theme === "light" ? "dark" : "light"
                )
              }
              className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              setTheme("{theme === "light" ? "dark" : "light"}")
            </button>
            <button
              onClick={() =>
                demoUserStore.setters.setNotifications(!notifications)
              }
              className="w-full bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              setNotifications({!notifications ? "true" : "false"})
            </button>
          </div>
        </div>

        {/* Random Values */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-green-800 dark:text-green-300">
            Random Values
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                const names = ["Alex", "Sam", "Jordan", "Taylor", "Casey"];
                const randomName =
                  names[Math.floor(Math.random() * names.length)];
                demoUserStore.setters.setFirstName(randomName);
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Random First Name
            </button>
            <button
              onClick={() => {
                const surnames = [
                  "Smith",
                  "Brown",
                  "Davis",
                  "Miller",
                  "Wilson",
                ];
                const randomSurname =
                  surnames[Math.floor(Math.random() * surnames.length)];
                demoUserStore.setters.setLastName(randomSurname);
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Random Last Name
            </button>
            <button
              onClick={() => {
                demoUserStore.setters.setIsActive(Math.random() > 0.5);
                demoUserStore.setters.setTheme(
                  Math.random() > 0.5 ? "light" : "dark"
                );
                demoUserStore.setters.setNotifications(Math.random() > 0.5);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              Randomize All
            </button>
          </div>
        </div>
      </div>

      {/* Manual Set Example */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
          Alternative: Manual Set Method
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              demoUserStore.set({ firstName: "Manual", lastName: "User" })
            }
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded transition-colors"
          >
            set({`{ firstName: "Manual", lastName: "User" }`})
          </button>
          <button
            onClick={() =>
              demoUserStore.set({ isActive: true, notifications: true })
            }
            className="bg-gray-500 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded transition-colors"
          >
            set({`{ isActive: true, notifications: true }`})
          </button>
        </div>
      </div>

      {/* Raw State Display */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded p-4">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
          Raw State Object:
        </h4>
        <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          {JSON.stringify(
            { firstName, lastName, isActive, theme, notifications },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
