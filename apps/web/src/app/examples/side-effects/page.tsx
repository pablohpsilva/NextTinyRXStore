import Link from "next/link";
import SideEffectsDemo from "./SideEffectsDemo";

export default function SideEffectsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/examples"
            className="inline-flex items-center text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🔔 Side Effects & Callbacks
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Register callbacks and work with RxJS observables directly
        </p>

        {/* Interactive Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Interactive Side Effects Demo
          </h2>
          <SideEffectsDemo />
        </div>

        {/* Explanation */}
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-pink-800 dark:text-pink-300">
            🔄 Side Effects Use Cases
          </h2>
          <p className="text-pink-700 dark:text-pink-300 mb-4">
            Side effects are perfect for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-pink-700 dark:text-pink-300">
            <li>
              <strong>Analytics:</strong> Track user actions and state changes
            </li>
            <li>
              <strong>Notifications:</strong> Show toasts when certain
              conditions are met
            </li>
            <li>
              <strong>API Calls:</strong> Sync data to server when state changes
            </li>
            <li>
              <strong>Local Storage:</strong> Persist state changes
              automatically
            </li>
            <li>
              <strong>DOM Updates:</strong> Update document title, favicon, etc.
            </li>
            <li>
              <strong>Third-party Integrations:</strong> Trigger external
              services
            </li>
          </ul>
        </div>

        {/* Code Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Register Callbacks */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Register Callbacks
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Register callback for age changes
userStore.register("age", (newAge) => {
  if (newAge >= 18) {
    console.log("User is now an adult!");
    // Trigger analytics, notifications, etc.
  }
});

// Multiple callbacks for the same field
userStore.register("name", (name) => {
  console.log(\`Name changed to: \${name}\`);
});

userStore.register("name", (name) => {
  document.title = \`Welcome, \${name}!\`;
});`}
            </pre>
          </div>

          {/* RxJS Observables */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              RxJS Observables
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Direct observable access
userStore.observable("name").subscribe((name) => {
  document.title = \`Welcome, \${name}!\`;
});

// Advanced RxJS operations
userStore.observable("age")
  .pipe(
    filter(age => age >= 18),
    debounceTime(1000),
    distinctUntilChanged()
  )
  .subscribe(age => {
    console.log(\`Adult age confirmed: \${age}\`);
  });`}
            </pre>
          </div>

          {/* Complex Side Effects */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Complex Side Effects Example
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`import { combineLatest } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

// Combine multiple observables for complex side effects
combineLatest([
  userStore.observable("name"),
  userStore.observable("age"),
  userStore.observable("email")
]).pipe(
  debounceTime(500), // Wait for 500ms of inactivity
  distinctUntilChanged((prev, curr) => 
    JSON.stringify(prev) === JSON.stringify(curr)
  )
).subscribe(([name, age, email]) => {
  // Save to localStorage
  localStorage.setItem("userProfile", JSON.stringify({
    name, age, email, lastUpdated: Date.now()
  }));
  
  // Send analytics event
  analytics.track("User Profile Updated", { name, age, email });
  
  // Show success notification
  showNotification("Profile saved successfully!");
});`}
            </pre>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-300">
            💡 Best Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-yellow-700 dark:text-yellow-300">
            <div>
              <h4 className="font-semibold mb-2">Performance:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  Use <code>debounceTime</code> for expensive operations
                </li>
                <li>
                  Use <code>distinctUntilChanged</code> to prevent duplicate
                  calls
                </li>
                <li>Unsubscribe from observables when components unmount</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Error Handling:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Wrap side effects in try-catch blocks</li>
                <li>
                  Use RxJS <code>catchError</code> operator
                </li>
                <li>Log errors appropriately for debugging</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
