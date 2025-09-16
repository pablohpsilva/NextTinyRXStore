"use client";
import { extendedUserStore } from "../../store/demoStores";
import { useState, useEffect } from "react";

export default function UserCard() {
  const { firstName, lastName, age, fullName, isAdult } =
    extendedUserStore.useFields([
      "firstName",
      "lastName",
      "age",
      "fullName",
      "isAdult",
    ]);

  // Track render count for derived fields
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, [firstName, lastName, age, fullName, isAdult]);

  return (
    <div className="space-y-6">
      {/* User Card Display */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 mb-2">
            {fullName}
          </h2>
          <p className="text-emerald-600 dark:text-emerald-400 mb-4">
            Age: {age} years old
          </p>
          <div className="flex justify-center">
            {isAdult ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                🔞 Adult
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                👶 Minor
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name Controls */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-blue-800 dark:text-blue-300">
            Name Controls (affects fullName)
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => extendedUserStore.setters.setFirstName("Alice")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            >
              Set First Name: "Alice"
            </button>
            <button
              onClick={() => extendedUserStore.setters.setLastName("Johnson")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            >
              Set Last Name: "Johnson"
            </button>
            <button
              onClick={() => {
                const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava"];
                const lastNames = [
                  "Smith",
                  "Johnson",
                  "Williams",
                  "Brown",
                  "Jones",
                ];
                extendedUserStore.setters.setFirstName(
                  firstNames[Math.floor(Math.random() * firstNames.length)]
                );
                extendedUserStore.setters.setLastName(
                  lastNames[Math.floor(Math.random() * lastNames.length)]
                );
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors"
            >
              Random Names
            </button>
          </div>
        </div>

        {/* Age Controls */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-purple-800 dark:text-purple-300">
            Age Controls (affects isAdult)
          </h3>
          <div className="space-y-2">
            <button
              onClick={() =>
                extendedUserStore.setters.setAge(Math.max(0, age - 1))
              }
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition-colors"
            >
              Age Down (Currently: {age})
            </button>
            <button
              onClick={() => extendedUserStore.setters.setAge(age + 1)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition-colors"
            >
              Age Up (Currently: {age})
            </button>
            <button
              onClick={() => extendedUserStore.setters.setAge(17)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition-colors"
            >
              Set Age: 17 (Minor)
            </button>
            <button
              onClick={() => extendedUserStore.setters.setAge(18)}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
            >
              Set Age: 18 (Adult)
            </button>
          </div>
        </div>
      </div>

      {/* State Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Base Fields */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Base Fields:
          </h4>
          <pre className="text-sm text-gray-700 dark:text-gray-300">
            {JSON.stringify({ firstName, lastName, age }, null, 2)}
          </pre>
        </div>

        {/* Derived Fields */}
        <div className="bg-emerald-50 dark:bg-emerald-800 rounded p-4">
          <h4 className="font-semibold mb-2 text-emerald-900 dark:text-emerald-100">
            Derived Fields:
          </h4>
          <pre className="text-sm text-emerald-800 dark:text-emerald-200">
            {JSON.stringify({ fullName, isAdult }, null, 2)}
          </pre>
        </div>
      </div>

      {/* Performance Info */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-4">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Component renders:</strong> {renderCount} | This component
          re-renders when any of its subscribed fields (including derived ones)
          change.
        </p>
      </div>
    </div>
  );
}
