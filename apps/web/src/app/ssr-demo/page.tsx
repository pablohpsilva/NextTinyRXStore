import Link from "next/link";
import { initializeServerStore } from "next-tiny-rx-store";
import { userStore } from "../../store/demoStores";
import SSRUserProfile from "./SSRUserProfile";

// Simulate async data fetching
async function fetchUserData(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    name: `Server User ${id}`,
    age: 28,
    email: `server-user-${id}@example.com`,
    lastLogin: new Date().toISOString(),
    serverLoadTime: new Date().toISOString(),
  };
}

export default async function SSRDemoPage() {
  // Simulate fetching user data on the server
  const userId = Math.floor(Math.random() * 1000).toString();
  const userData = await fetchUserData(userId);

  // Initialize store with server data
  const serverState = initializeServerStore(userStore, {
    name: userData.name,
    age: userData.age,
    email: userData.email,
  });

  // Additional server-only data
  const serverInfo = {
    userId,
    lastLogin: userData.lastLogin,
    serverLoadTime: userData.serverLoadTime,
    renderTime: new Date().toISOString(),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🌐 SSR with Data Fetching
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Server-side rendering with store hydration
        </p>

        {/* Server Data Display */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-300">
            📊 Server-Side Data (SSR)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">
                Store Data:
              </h3>
              <pre className="text-sm text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800/50 p-3 rounded">
                {JSON.stringify(serverState, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">
                Server Info:
              </h3>
              <pre className="text-sm text-green-600 dark:text-green-300 bg-green-100 dark:bg-green-800/50 p-3 rounded">
                {JSON.stringify(serverInfo, null, 2)}
              </pre>
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-4">
            ✅ This data was fetched on the server and rendered as part of the
            initial HTML. The store was initialized with this data before
            sending to the client.
          </p>
        </div>

        {/* Client Component with Hydration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Hydrated Client Component
          </h2>
          <SSRUserProfile serverState={serverState} />
        </div>

        {/* SSR Flow Explanation */}
        <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-cyan-800 dark:text-cyan-300">
            🔄 SSR + Hydration Flow
          </h2>
          <div className="space-y-3 text-cyan-700 dark:text-cyan-300">
            <div className="flex items-start space-x-3">
              <span className="bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <strong>Server Fetch:</strong> Data is fetched on the server
                using async functions
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <strong>Store Initialization:</strong>{" "}
                <code>initializeServerStore()</code> populates the store
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <strong>SSR Rendering:</strong> Server component renders with
                store data
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div>
                <strong>Client Hydration:</strong> Client components receive
                serialized state
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                5
              </span>
              <div>
                <strong>Interactive:</strong> Client components become fully
                reactive
              </div>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Server Component */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Server Component (this page)
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`export default async function SSRDemoPage() {
  // Fetch data on server
  const userData = await fetchUserData(userId);
  
  // Initialize store with server data
  const serverState = initializeServerStore(userStore, {
    name: userData.name,
    age: userData.age,
    email: userData.email,
  });

  return (
    <div>
      <h1>Server-rendered: {userData.name}</h1>
      <SSRUserProfile serverState={serverState} />
    </div>
  );
}`}
            </pre>
          </div>

          {/* Client Component */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Client Component
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`"use client";
import { useEffect } from "react";

export default function SSRUserProfile({ serverState }) {
  // Hydrate client store with server state
  useEffect(() => {
    if (serverState) {
      userStore.hydrate(serverState);
    }
  }, [serverState]);

  const user = userStore.useStore();

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      {/* Fully reactive now! */}
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-300">
            🚀 SSR Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700 dark:text-blue-300">
            <div>
              <h4 className="font-semibold mb-2">Performance:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Faster initial page load</li>
                <li>Content visible before JavaScript loads</li>
                <li>Better Core Web Vitals scores</li>
                <li>Reduced cumulative layout shift</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">SEO & Accessibility:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Search engines can index content</li>
                <li>Social media previews work correctly</li>
                <li>Better accessibility for screen readers</li>
                <li>Progressive enhancement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
