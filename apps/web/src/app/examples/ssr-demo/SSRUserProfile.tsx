"use client";
import { useEffect, useState } from "react";
import { userStore } from "../../../store/demoStores";

interface Props {
  serverState: any;
}

export default function SSRUserProfile({ serverState }: Props) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const user = userStore.useFields(["name", "age", "email"]);

  // Hydrate client store with server state
  useEffect(() => {
    if (serverState) {
      userStore.hydrate(serverState);
      setIsHydrated(true);
    }
  }, [serverState]);

  // Track renders
  useEffect(() => {
    console.log(`name`, user.name);
    setRenderCount((prev) => prev + 1);
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Hydration Status */}
      <div
        className={`border rounded-lg p-4 ${
          isHydrated
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isHydrated ? "bg-green-500" : "bg-yellow-500"
            }`}
          ></div>
          <span
            className={`font-semibold ${
              isHydrated
                ? "text-green-800 dark:text-green-300"
                : "text-yellow-800 dark:text-yellow-300"
            }`}
          >
            {isHydrated ? "✅ Store Hydrated" : "⏳ Hydrating..."}
          </span>
        </div>
        <p
          className={`text-sm mt-1 ${
            isHydrated
              ? "text-green-600 dark:text-green-400"
              : "text-yellow-600 dark:text-yellow-400"
          }`}
        >
          {isHydrated
            ? "Client store successfully hydrated with server state"
            : "Waiting for client-side hydration to complete"}
        </p>
      </div>

      {/* User Profile Display */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-cyan-800 dark:text-cyan-300">
          User Profile (From Hydrated Store)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-cyan-700 dark:text-cyan-300">
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Age:</strong> {user.age}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
          </div>
          <div className="bg-cyan-100 dark:bg-cyan-800 rounded p-3">
            <p className="text-sm text-cyan-800 dark:text-cyan-200">
              <strong>Render Count:</strong> {renderCount}
            </p>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
              This component is now fully reactive!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Test Reactivity (Post-Hydration)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() =>
              userStore.setters.setName(
                `Hydrated-${Date.now().toString().slice(-4)}`
              )
            }
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
            disabled={!isHydrated}
          >
            Update Name
          </button>

          <button
            onClick={() =>
              userStore.setters.setAge(Math.floor(Math.random() * 40) + 20)
            }
            className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded transition-colors"
            disabled={!isHydrated}
          >
            Random Age
          </button>

          <button
            onClick={() =>
              userStore.setters.setEmail(`hydrated${Date.now()}@demo.com`)
            }
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition-colors"
            disabled={!isHydrated}
          >
            Update Email
          </button>
        </div>
        {!isHydrated && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Buttons will be enabled after hydration completes
          </p>
        )}
      </div>

      {/* State Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Server State */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
            Original Server State:
          </h4>
          <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
            {JSON.stringify(serverState, null, 2)}
          </pre>
        </div>

        {/* Current State */}
        <div className="bg-blue-50 dark:bg-blue-800 rounded p-4">
          <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            Current Store State:
          </h4>
          <pre className="text-sm text-blue-800 dark:text-blue-200 overflow-x-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-4">
        <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-300">
          🔧 Technical Implementation
        </h4>
        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
          <li>• Server component fetches data and initializes store</li>
          <li>
            • <code>initializeServerStore()</code> returns serializable state
          </li>
          <li>• Client component receives server state as props</li>
          <li>
            • <code>userStore.hydrate()</code> updates client store
          </li>
          <li>• Component becomes fully reactive after hydration</li>
        </ul>
      </div>
    </div>
  );
}
