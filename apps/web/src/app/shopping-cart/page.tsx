import Link from "next/link";
import ShoppingCart from "./ShoppingCart";

export default function ShoppingCartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            ← Back to Examples
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          🛒 Shopping Cart
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
          Complex state management with derived calculations
        </p>

        {/* Interactive Demo */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <ShoppingCart />
        </div>

        {/* Architecture Explanation */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-indigo-800 dark:text-indigo-300">
            🏗️ Store Architecture
          </h2>
          <p className="text-indigo-700 dark:text-indigo-300 mb-4">
            This shopping cart demonstrates advanced NextTinyRXStore features:
          </p>
          <ul className="list-disc list-inside space-y-2 text-indigo-700 dark:text-indigo-300">
            <li>
              <strong>Complex State:</strong> Arrays, objects, and primitives in
              one store
            </li>
            <li>
              <strong>Derived Calculations:</strong> Total items, subtotal, and
              discount logic
            </li>
            <li>
              <strong>Performance Optimization:</strong> Only re-render
              components that need updates
            </li>
            <li>
              <strong>Type Safety:</strong> Full TypeScript support for all
              operations
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
              {`const cartStore = createFieldStore({
  items: [] as CartItem[],
  discountCode: "",
  shippingAddress: null as Address | null,
})
.derived("totalItems", ["items"], 
  ({ items }) => items.reduce((sum, item) => 
    sum + item.quantity, 0)
)
.derived("subtotal", ["items"], 
  ({ items }) => items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0)
)
.derived("hasDiscount", ["discountCode"], 
  ({ discountCode }) => discountCode.length > 0
);`}
            </pre>
          </div>

          {/* Complex Operations */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Complex Operations
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`const addItem = (product: Product) => {
  const existingItem = items.find(
    item => item.id === product.id
  );

  if (existingItem) {
    cartStore.setters.setItems(
      items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  } else {
    cartStore.setters.setItems([
      ...items, 
      { ...product, quantity: 1 }
    ]);
  }
};`}
            </pre>
          </div>

          {/* Performance Features */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Performance Optimizations
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
              {`// Only re-render when specific fields change
const { items, totalItems, subtotal } = cartStore.useFields([
  "items", "totalItems", "subtotal"
]);

// Cart header only watches totalItems - won't re-render on item changes
const totalItems = cartStore.useField("totalItems");

// Discount section only watches discount-related fields
const { discountCode, hasDiscount } = cartStore.useFields([
  "discountCode", "hasDiscount"
]);`}
            </pre>
          </div>
        </div>

        {/* Performance Benefits */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-300">
            ⚡ Performance Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-700 dark:text-green-300">
            <div>
              <h4 className="font-semibold mb-2">Granular Updates:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Cart total updates only when items change</li>
                <li>Discount UI only updates when discount code changes</li>
                <li>Individual items only re-render when their data changes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Efficient Calculations:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Derived fields are cached until dependencies change</li>
                <li>Complex calculations run only when necessary</li>
                <li>Reactive streams prevent duplicate computations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
