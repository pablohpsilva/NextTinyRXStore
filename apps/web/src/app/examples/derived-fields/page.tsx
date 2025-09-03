import Link from "next/link";
import UserCard from "./UserCard";

export default function DerivedFieldsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/examples"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🧮 Derived Fields
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Computed fields that automatically update when dependencies change
        </p>

        {/* Interactive Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Interactive Derived Fields Demo
          </h2>
          <UserCard />
        </div>

        {/* Explanation */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-emerald-800 dark:text-emerald-300">
            🔄 Automatic Updates
          </h2>
          <p className="text-emerald-700 dark:text-emerald-300 mb-4">
            Derived fields automatically recompute when their dependencies
            change:
          </p>
          <ul className="list-disc list-inside space-y-2 text-emerald-700 dark:text-emerald-300">
            <li>
              <code>fullName</code> updates when <code>firstName</code> or{" "}
              <code>lastName</code> changes
            </li>
            <li>
              <code>isAdult</code> updates when <code>age</code> changes
            </li>
            <li>Derived fields are cached and only recompute when necessary</li>
            <li>
              You can chain derived fields to create complex computed values
            </li>
          </ul>
        </div>

        {/* Code Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Definition */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Store with Derived Fields
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`const userStore = createFieldStore({
  firstName: "John",
  lastName: "Doe",  
  age: 25,
})
.derived(
  "fullName",
  ["firstName", "lastName"],
  ({ firstName, lastName }) => 
    \`\${firstName} \${lastName}\`
)
.derived(
  "isAdult", 
  ["age"], 
  ({ age }) => age >= 18
);`}
            </pre>
          </div>

          {/* Usage Example */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Using Derived Fields
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`function UserCard() {
  const { fullName, isAdult } = 
    userStore.useFields(["fullName", "isAdult"]);

  return (
    <div>
      <h2>{fullName}</h2>
      {isAdult && <span>🔞 Adult</span>}
    </div>
  );
}`}
            </pre>
          </div>

          {/* Complex Example */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Complex Derived Fields Example
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`const userStore = createFieldStore({
  firstName: "John",
  lastName: "Doe",
  age: 25,
  salary: 50000,
})
.derived("fullName", ["firstName", "lastName"], 
  ({ firstName, lastName }) => \`\${firstName} \${lastName}\`)
.derived("isAdult", ["age"], 
  ({ age }) => age >= 18)
.derived("ageGroup", ["age"], ({ age }) => {
  if (age < 18) return "minor";
  if (age < 65) return "adult";
  return "senior";
})
.derived("displayInfo", ["fullName", "ageGroup", "salary"],
  ({ fullName, ageGroup, salary }) => 
    \`\${fullName} (\${ageGroup}) - $\${salary.toLocaleString()}\`);`}
            </pre>
          </div>
        </div>

        {/* Performance Notes */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-300">
            ⚡ Performance Features
          </h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-700 dark:text-yellow-300">
            <li>
              <strong>Lazy Evaluation:</strong> Derived fields only compute when
              accessed
            </li>
            <li>
              <strong>Caching:</strong> Results are cached until dependencies
              change
            </li>
            <li>
              <strong>Selective Updates:</strong> Only recompute when
              dependencies actually change
            </li>
            <li>
              <strong>RxJS Integration:</strong> Uses efficient observable
              patterns under the hood
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
