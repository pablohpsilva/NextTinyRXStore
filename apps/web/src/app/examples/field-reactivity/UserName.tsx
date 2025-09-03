"use client";

import { userStore } from "../../../store/demoStores";
import { useState, useEffect } from "react";

export default function UserName() {
  // Only re-renders when 'name' changes, not age or email
  const name = userStore.useField("name");

  // Track render count to demonstrate efficiency
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, [name]);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-300">
          Hello, {name}! 👋
        </h1>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <strong>Render count:</strong> {renderCount}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This counter only increases when the 'name' field changes!
        </p>
      </div>
    </div>
  );
}
