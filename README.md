# NextTinyRXStore 🚀

**Performant, SSR-friendly reactive state management library for Next.js applications with zero dependencies.**

NextTinyRXStore delivers lightning-fast reactive state management that works seamlessly on both server and client. Built with custom reactive primitives for maximum performance and minimal bundle size. No more hydration mismatches, no more external dependencies, just pure reactive bliss.

## 🌐 **Live Demo**

**[🚀 Try NextTinyRXStore Live Examples](https://pablohpsilva.github.io/NextTinyRXStore/)**

Explore interactive examples showcasing:

- Basic usage patterns
- Derived fields and computed values
- Multi-field reactivity
- Shopping cart implementation
- Side effects and async operations
- SSR compatibility demos
- Performance optimizations

## ✨ What Makes It Shine

- 🔥 **Universal Hooks** - Same API works on server and client
- ⚡ **Zero Config SSR** - Perfect Next.js App Router integration
- 🧠 **Smart Re-rendering** - Only updates when data actually changes
- 💾 **Memory Optimized** - Granular cache invalidation and efficient Map-based caching
- 🎯 **Type-Safe** - Full TypeScript support with intelligent inference
- 📦 **Zero Dependencies** - No external dependencies, truly lightweight
- 🚀 **Tiny Bundle** - Custom reactive primitives for minimal overhead
- 🔧 **Great DX** - Auto-generated setters, derived fields, and more

## 📦 Bundle Size

NextTinyRXStore is truly **tiny** and optimized for production with **zero dependencies**:

- **ESM (Modern)**: 6.6 KB (2.4 KB gzipped) ⚡
- **CommonJS**: 8.4 KB (2.7 KB gzipped)
- **UMD (Browser)**: 6.7 KB (2.4 KB gzipped)
- **TypeScript definitions**: Included
- **Tree-shakeable**: Import only what you need
- **Zero dependencies**: No external libraries required

_For comparison: Zustand is ~4.1KB gzipped + dependencies, Redux Toolkit is ~23KB gzipped + dependencies_

## 🚀 Quick Start

### Installation

```bash
npm install next-tiny-rx-store
# or
pnpm add next-tiny-rx-store
# or
yarn add next-tiny-rx-store
```

**That's it!** No additional dependencies required. NextTinyRXStore comes with everything built-in.

### 🎯 Zero Dependencies Philosophy

NextTinyRXStore achieves true zero dependencies by implementing custom reactive primitives instead of relying on external libraries:

- ✅ **Custom reactive primitives** - Built-in `BehaviorSubject`, `combineLatest`, `distinctUntilChanged`, and `map` implementations
- ✅ **No utility libraries** - All functionality built from scratch
- ✅ **Smaller total bundle** - Optimized for minimal overhead
- ✅ **No version conflicts** - Your app controls all dependencies
- ✅ **Better tree-shaking** - Only the exact code you use is included

### Basic Usage

```typescript
// store/userStore.ts
import { createFieldStore } from "next-tiny-rx-store";

export const userStore = createFieldStore({
  name: "Alice",
  age: 25,
  email: "alice@example.com",
});
```

### Server-Side Usage

```tsx
// app/page.tsx (Server Component)
import { userStore } from "../store/userStore";
import UserProfile from "../components/UserProfile";

export default function HomePage() {
  // ✨ Works perfectly on the server!
  const userName = userStore.get("name");
  const userAge = userStore.get("age");

  // Initialize server-side data
  userStore.set({
    name: "Server-initialized User",
    age: 30,
  });

  return (
    <main>
      <h1>
        Server Data: {userName} is {userAge} years old
      </h1>
      <UserProfile /> {/* Will hydrate with server state */}
    </main>
  );
}
```

Whenever the client needs to either read or write on the store:

```tsx
// components/UserProfile.tsx
"use client";
import { userStore } from "../store/userStore";

export default function UserProfile() {
  // You have atomic changes only on what matters!
  // const name = userStore.useField('name')
  // or
  const { name, age, email } = userStore.useFields(["name", "age", "email"]);

  // ✨ Universal hook - works on server AND client!
  // This one your component will react to the entire store.
  // const { name, age, email } = userStore.useStore();

  return (
    <div>
      <h1>Welcome, {name}!</h1>
      <p>Age: {age}</p>
      <p>Email: {email}</p>

      <button onClick={() => userStore.setters.setAge(age + 1)}>
        🎂 Happy Birthday!
      </button>
    </div>
  );
}
```

## 📚 Core Concepts

### 1. Field-Level Reactivity

Subscribe to individual fields for maximum performance:

```tsx
function UserName() {
  // Only re-renders when 'name' changes, not age or email
  const name = userStore.useField("name");

  return <h1>Hello, {name}!</h1>;
}
```

### 2. Multi-Field Subscriptions

```tsx
function UserInfo() {
  // Only re-renders when name OR age changes
  const { name, age } = userStore.useFields(["name", "age"]);

  return (
    <p>
      {name} is {age} years old
    </p>
  );
}
```

### 3. Auto-Generated Setters

Every field automatically gets a setter:

```typescript
const userStore = createFieldStore({
  firstName: "John",
  lastName: "Doe",
  isActive: true,
});

// Auto-generated setters:
userStore.setters.setFirstName("Jane");
userStore.setters.setLastName("Smith");
userStore.setters.setIsActive(false);
```

### 4. Derived/Computed Fields

```typescript
const userStore = createFieldStore({
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

// Usage
function UserCard() {
  const { fullName, isAdult } = userStore.useFields(["fullName", "isAdult"]);

  return (
    <div>
      <h2>{fullName}</h2>
      {isAdult && <span>🔞 Adult</span>}
    </div>
  );
}
```

## 🌟 Advanced Patterns

### SSR with Data Fetching

```tsx
// app/user/[id]/page.tsx
import { initializeServerStore } from "next-tiny-rx-store";
import { userStore } from "../../store/userStore";

interface Props {
  params: { id: string };
}

export default async function UserPage({ params }: Props) {
  // Fetch data on server
  const userData = await fetchUser(params.id);

  // Initialize store with server data
  const serverState = initializeServerStore(userStore, userData);

  return (
    <div>
      <h1>Server-rendered: {userData.name}</h1>
      <UserProfile serverState={serverState} />
    </div>
  );
}
```

```tsx
// components/UserProfile.tsx
"use client";
import { useEffect } from "react";
import { userStore } from "../store/userStore";

interface Props {
  serverState?: any;
}

export default function UserProfile({ serverState }: Props) {
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
    </div>
  );
}
```

### Complex State Management

```typescript
// store/appStore.ts
import { createFieldStore } from "next-tiny-rx-store";

// Shopping cart example
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

// Usage in components
function ShoppingCart() {
  const { items, totalItems, subtotal } = cartStore.useFields([
    "items",
    "totalItems",
    "subtotal",
  ]);

  const addItem = (product: Product) => {
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      cartStore.setters.setItems(
        items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      cartStore.setters.setItems([...items, { ...product, quantity: 1 }]);
    }
  };

  return (
    <div>
      <h2>Cart ({totalItems} items)</h2>
      <p>Subtotal: ${subtotal.toFixed(2)}</p>
      {/* Cart items... */}
    </div>
  );
}
```

### Side Effects and Callbacks

```typescript
// Register callbacks for side effects
userStore.register("age", (newAge) => {
  if (newAge >= 18) {
    console.log("User is now an adult!");
    // Trigger analytics, notifications, etc.
  }
});

// Listen to reactive observables directly
userStore.observable("name").subscribe((name) => {
  document.title = `Welcome, ${name}!`;
});
```

## 🔧 API Reference

### Core Methods

| Method            | Description             | Usage                         |
| ----------------- | ----------------------- | ----------------------------- |
| `get(key)`        | Get current value       | `store.get('name')`           |
| `getAll()`        | Get entire state        | `store.getAll()`              |
| `set(partial)`    | Update fields           | `store.set({ name: 'John' })` |
| `observable(key)` | Get reactive observable | `store.observable('name')`    |
| `serialize()`     | Serialize for SSR       | `store.serialize()`           |
| `hydrate(state)`  | Hydrate from server     | `store.hydrate(serverState)`  |

### React Hooks

| Hook              | Description                  | Usage                              |
| ----------------- | ---------------------------- | ---------------------------------- |
| `useField(key)`   | Subscribe to single field    | `store.useField('name')`           |
| `useFields(keys)` | Subscribe to multiple fields | `store.useFields(['name', 'age'])` |
| `useStore()`      | Subscribe to entire store    | `store.useStore()`                 |

### Factory Functions

| Function                             | Description                | Usage                                  |
| ------------------------------------ | -------------------------- | -------------------------------------- |
| `createFieldStore(initial)`          | Create basic store         | `createFieldStore({ name: 'John' })`   |
| `createSSRStore(initial, server?)`   | Create SSR-optimized store | `createSSRStore(initial, serverState)` |
| `initializeServerStore(store, data)` | Initialize server state    | `initializeServerStore(store, data)`   |

## ⚡ Performance Features

### Smart Re-rendering Prevention

```typescript
// Only re-renders when values actually change
store.set({ name: "John" }); // ✅ Triggers re-render
store.set({ name: "John" }); // ❌ No re-render (same value)
store.set({ name: "Jane" }); // ✅ Triggers re-render (different value)
```

### Granular Cache Invalidation

```typescript
// Changing 'name' only invalidates name-related caches
store.set({ name: "New Name" }); // Only 'name' caches cleared
// 'age' and 'email' caches remain intact
```

### Memory-Efficient Design

- **Granular cache invalidation** - only affected caches are cleared
- **Per-field versioning** instead of global invalidation
- **Shallow equality checks** to prevent unnecessary object recreation
- **Custom reactive operators** like `distinctUntilChanged` for stream optimization
- **Efficient Map-based caching** with smart invalidation strategies
- **Zero external dependencies** - minimal overhead

## 🛠️ Development

This repository includes a demo Next.js app for visual testing of the library.

### Setup

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Test the Demo

Visit `http://localhost:3001` to see NextTinyRXStore in action with:

- Server-side rendering examples
- Client-side reactivity demos
- Performance comparisons
- Real-time state synchronization

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT © [Your Name]

---

**NextTinyRXStore** - Where performance meets simplicity. 🚀
