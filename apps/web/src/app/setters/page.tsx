import Link from "next/link";
import SettersDemo from "./SettersDemo";

export default function SettersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          ⚙️ Auto-Generated Setters
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Automatic setter creation for all store fields
        </p>

        {/* Interactive Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Interactive Setters Demo
          </h2>
          <SettersDemo />
        </div>

        {/* Explanation */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-amber-800 dark:text-amber-300">
            🤖 Automatic Generation
          </h2>
          <p className="text-amber-700 dark:text-amber-300 mb-4">
            For every field in your store, NextTinyRXStore automatically
            generates a corresponding setter function:
          </p>
          <ul className="list-disc list-inside space-y-2 text-amber-700 dark:text-amber-300">
            <li>
              <code>firstName</code> → <code>setters.setFirstName()</code>
            </li>
            <li>
              <code>lastName</code> → <code>setters.setLastName()</code>
            </li>
            <li>
              <code>isActive</code> → <code>setters.setIsActive()</code>
            </li>
            <li>
              <code>userProfile</code> → <code>setters.setUserProfile()</code>
            </li>
          </ul>
        </div>

        {/* Code Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Definition */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Store Definition
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`const userStore = createFieldStore({
  firstName: "John",
  lastName: "Doe",
  isActive: true,
  theme: "light",
  notifications: false,
});

// Setters are automatically available:
// userStore.setters.setFirstName()
// userStore.setters.setLastName()
// userStore.setters.setIsActive()
// userStore.setters.setTheme()
// userStore.setters.setNotifications()`}
            </pre>
          </div>

          {/* Usage Examples */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Using Auto-Generated Setters
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Individual field updates
userStore.setters.setFirstName("Jane");
userStore.setters.setLastName("Smith");
userStore.setters.setIsActive(false);

// vs. Manual approach:
userStore.set({ firstName: "Jane" });
userStore.set({ lastName: "Smith" });
userStore.set({ isActive: false });

// Both approaches work!`}
            </pre>
          </div>

          {/* TypeScript Benefits */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              TypeScript Benefits
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Full TypeScript support with auto-completion
userStore.setters.setFirstName("Alice");  // ✅ string expected
userStore.setters.setIsActive(true);      // ✅ boolean expected
userStore.setters.setAge(25);             // ✅ number expected

// TypeScript will catch errors:
userStore.setters.setFirstName(123);      // ❌ Type error!
userStore.setters.setIsActive("yes");     // ❌ Type error!`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
