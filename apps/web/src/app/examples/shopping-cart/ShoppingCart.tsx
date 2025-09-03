"use client";
import { cartStore, sampleProducts, CartItem } from "../../../store/demoStores";
import { useState } from "react";

export default function ShoppingCart() {
  const { items, totalItems, subtotal, discountCode, hasDiscount } =
    cartStore.useStore();

  const [newDiscountCode, setNewDiscountCode] = useState("");

  const addItem = (product: Omit<CartItem, "quantity">) => {
    const currentItems = cartStore.get("items");
    const existingItem = currentItems.find((item) => item.id === product.id);

    console.log("Before update:", {
      currentItems: currentItems.length,
      totalItems: cartStore.get("totalItems"),
      subtotal: cartStore.get("subtotal"),
    });

    if (existingItem) {
      cartStore.setters.setItems(
        currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      cartStore.setters.setItems([
        ...currentItems,
        { ...product, quantity: 1 },
      ]);
    }

    console.log("After update:", {
      currentItems: cartStore.get("items").length,
      totalItems: cartStore.get("totalItems"),
      subtotal: cartStore.get("subtotal"),
    });
  };

  const removeItem = (productId: string) => {
    const currentItems = cartStore.get("items");
    cartStore.setters.setItems(
      currentItems.filter((item) => item.id !== productId)
    );
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      const currentItems = cartStore.get("items");
      cartStore.setters.setItems(
        currentItems.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const applyDiscount = () => {
    cartStore.setters.setDiscountCode(newDiscountCode);
    setNewDiscountCode("");
  };

  const clearCart = () => {
    cartStore.setters.setItems([]);
    cartStore.setters.setDiscountCode("");
  };

  const discountAmount = hasDiscount ? subtotal * 0.1 : 0; // 10% discount
  const total = subtotal - discountAmount;

  return (
    <div className="space-y-8">
      {/* Cart Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Shopping Cart ({totalItems} items)
        </h2>
        <button
          onClick={clearCart}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Available */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Available Products
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {sampleProducts.map((product) => (
              <div
                key={product.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  ${product.price.toFixed(2)}
                </p>
                <button
                  onClick={() => addItem(product)}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>

          {/* Cart Items */}
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Cart Items
          </h3>
          {items.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Your cart is empty
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        ${item.price.toFixed(2)} × {item.quantity} = $
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 w-8 h-8 rounded flex items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 w-8 h-8 rounded flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm ml-2 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 sticky top-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Order Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-700 dark:text-gray-300">
                <span>Items ({totalItems}):</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              {hasDiscount && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount ({discountCode}):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <hr className="border-gray-200 dark:border-gray-600" />

              <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Discount Code */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Discount Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newDiscountCode}
                  onChange={(e) => setNewDiscountCode(e.target.value)}
                  placeholder="Enter code (try: SAVE10)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <button
                  onClick={applyDiscount}
                  disabled={!newDiscountCode.trim()}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-md text-sm transition-colors"
                >
                  Apply
                </button>
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✅ Code "{discountCode}" applied (10% off)
                </p>
              )}
            </div>

            {/* Checkout Button */}
            <button
              disabled={items.length === 0}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {items.length === 0 ? "Cart is Empty" : "Proceed to Checkout"}
            </button>
          </div>
        </div>
      </div>

      {/* Store State Display */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">
          Current Store State:
        </h4>
        <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
          {JSON.stringify(
            {
              totalItems,
              subtotal: Number(subtotal.toFixed(2)),
              discountCode,
              hasDiscount,
              itemCount: items.length,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
