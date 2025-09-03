import { createFieldStore } from "@repo/next-tiny-rx-store";

// Basic user store from README example
export const userStore = createFieldStore({
  name: "Alice",
  age: 25,
  email: "alice@example.com",
});

// Extended user store with derived fields
export const extendedUserStore = createFieldStore({
  firstName: "John",
  lastName: "Doe",
  age: 25,
})
  .derived(
    "fullName",
    ["firstName", "lastName"],
    ({ firstName, lastName }) => `${firstName} ${lastName}`
  )
  .derived("isAdult", ["age"], ({ age }) => age >= 18);

// Shopping cart types and store
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Address {
  street: string;
  city: string;
  zip: string;
}

export const cartStore = createFieldStore({
  items: [] as CartItem[],
  discountCode: "",
  shippingAddress: null as Address | null,
})
  .derived("totalItems", ["items"], ({ items }) =>
    items.reduce((sum, item) => sum + item.quantity, 0)
  )
  .derived("subtotal", ["items"], ({ items }) =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  .derived(
    "hasDiscount",
    ["discountCode"],
    ({ discountCode }) => discountCode.length > 0
  );

// Sample products for cart demo
export const sampleProducts: Omit<CartItem, "quantity">[] = [
  { id: "1", name: "TypeScript Book", price: 29.99 },
  { id: "2", name: "React Hooks Guide", price: 19.99 },
  { id: "3", name: "Next.js Manual", price: 39.99 },
  { id: "4", name: "RxJS Cookbook", price: 24.99 },
];

export const loggerStore = createFieldStore({
  logs: [] as string[],
});
