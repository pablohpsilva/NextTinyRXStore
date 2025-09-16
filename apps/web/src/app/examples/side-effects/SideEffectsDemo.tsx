"use client";
import { userStore, loggerStore } from "../../../store/demoStores";
import { useState, useEffect, useRef } from "react";

const ageCallback = (addLog: (message: string) => void) => (newAge: number) => {
  addLog(`Age changed to: ${newAge}`);
  if (newAge >= 18) {
    addLog("🎉 User is now an adult!");
  } else {
    addLog("👶 User is a minor");
  }
};

const nameCallback =
  (
    addLog: (message: string) => void,
    setDocumentTitle: (title: string) => void
  ) =>
  (newName: string) => {
    addLog(`Name changed to: ${newName}`);
    const newTitle = `Welcome, ${newName}!`;
    document.title = newTitle;
    setDocumentTitle(newTitle);
  };

const emailCallback =
  (addLog: (message: string) => void) => (newEmail: string) => {
    addLog(`Email changed to: ${newEmail}`);
  };

export default function SideEffectsDemo() {
  const [documentTitle, setDocumentTitle] = useState("");
  const { logs } = loggerStore.useStore();
  const { name, age, email } = userStore.useStore();
  const subscriptionRef = useRef<any>(null);

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    loggerStore.setters.setLogs([
      ...loggerStore.get("logs"),
      `[${timestamp}] ${message}`,
    ]);
  };

  // Set up side effects when component mounts
  useEffect(() => {
    console.log("registered");

    // Register callbacks - now automatically prevents duplicates via function hashing!
    const ageCleanup = userStore.register("age", ageCallback(addLog));
    const nameCleanup = userStore.register(
      "name",
      nameCallback(addLog, setDocumentTitle)
    );
    const emailCleanup = userStore.register("email", emailCallback(addLog));

    // Set up observable subscription
    subscriptionRef.current = userStore.observable("name").subscribe((name) => {
      addLog(`📡 Observable: Name is now "${name}"`);
    });

    // Initial document title
    const initialTitle = `Welcome, ${name}!`;
    document.title = initialTitle;
    setDocumentTitle(initialTitle);
    addLog("🚀 Side effects initialized");

    // Cleanup on unmount
    return () => {
      ageCleanup();
      nameCleanup();
      emailCleanup();

      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        addLog("🧹 Observable subscription cleaned up");
      }
      document.title = "NextTinyRXStore"; // Reset title
    };
  }, []); // Empty dependency array - only run on mount

  const clearLogs = () => {
    loggerStore.setters.setLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* Current State */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-pink-800 dark:text-pink-300">
          Current State & Document Title
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-pink-700 dark:text-pink-300">
            <p>
              <strong>Name:</strong> {name}
            </p>
            <p>
              <strong>Age:</strong> {age}
            </p>
            <p>
              <strong>Email:</strong> {email}
            </p>
          </div>
          <div className="bg-pink-100 dark:bg-pink-800 rounded p-3">
            <p className="text-sm text-pink-800 dark:text-pink-200">
              <strong>Document Title:</strong>
              <br />
              {documentTitle}
            </p>
            <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
              (Check your browser tab!)
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Name Controls */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-300">
            Name Changes
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => userStore.setters.setName("Alice")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Set Name: "Alice"
            </button>
            <button
              onClick={() => userStore.setters.setName("Bob")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Set Name: "Bob"
            </button>
            <button
              onClick={() => {
                const names = ["Charlie", "Diana", "Eva", "Frank", "Grace"];
                const randomName =
                  names[Math.floor(Math.random() * names.length)];
                userStore.setters.setName(randomName);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Random Name
            </button>
          </div>
        </div>

        {/* Age Controls */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-purple-800 dark:text-purple-300">
            Age Changes
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => userStore.setters.setAge(16)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Set Age: 16 (Minor)
            </button>
            <button
              onClick={() => userStore.setters.setAge(18)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Set Age: 18 (Adult)
            </button>
            <button
              onClick={() =>
                userStore.setters.setAge(Math.floor(Math.random() * 50) + 15)
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Random Age (15-65)
            </button>
          </div>
        </div>

        {/* Email Controls */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-green-800 dark:text-green-300">
            Email Changes
          </h4>
          <div className="space-y-2">
            <button
              onClick={() => userStore.setters.setEmail("user@example.com")}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Set: example.com
            </button>
            <button
              onClick={() => userStore.setters.setEmail("user@demo.org")}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Set: demo.org
            </button>
            <button
              onClick={() =>
                userStore.setters.setEmail(`user${Date.now()}@test.com`)
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors"
            >
              Generate Unique
            </button>
          </div>
        </div>
      </div>

      {/* Side Effects Log */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Side Effects Log
          </h3>
          <button
            onClick={clearLogs}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Clear Log
          </button>
        </div>
        <div className="bg-black rounded p-4 font-mono text-sm max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400">
              No side effects triggered yet. Try changing some values above!
            </p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-green-400 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
          Active Side Effects Code:
        </h4>
        <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          {`// Register callbacks
const cleanup = userStore.register("age", (newAge) => {
  if (newAge >= 18) {
    console.log("🎉 User is now an adult!");
  }
});

// Observable
userStore.observable("name").subscribe((name) => {
  document.title = \`Welcome, \${name}!\`;
});

// Don't forget to cleanup when component unmounts
cleanup();
`}
        </pre>
      </div>
    </div>
  );
}
