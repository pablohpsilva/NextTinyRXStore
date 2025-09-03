"use client";
import { userStore } from "../../../store/demoStores";
import { useState, useEffect } from "react";

export default function UserInfo() {
  // Only re-renders when name OR age changes
  const { name, age } = userStore.useFields(["name", "age"]);

  // Track render count to demonstrate efficiency
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, [name, age]);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <p className="text-lg text-purple-800 dark:text-purple-300">
          <strong>{name}</strong> is <strong>{age}</strong> years old
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>Render count:</strong> {renderCount}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This increases when 'name' OR 'age' changes, but NOT when email
          changes!
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          💡 <strong>Tip:</strong> This demonstrates selective reactivity - only
          the fields you subscribe to will trigger re-renders.
        </p>
      </div>
    </div>
  );
}
