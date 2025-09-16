/**
 * Comparative benchmarks against other state management solutions
 */

import { FieldStore } from "../store";
import { benchmark, compareBenchmarks, BenchmarkSuite } from "./benchmarks";
import { measureMemoryUsage, MemoryStats } from "./memory-utils";

// Simple state implementations for comparison
interface SimpleState extends Record<string, unknown> {
  counter: number;
  text: string;
  list: string[];
  user: { name: string; age: number };
}

/**
 * Vanilla JavaScript object state management
 */
class VanillaStore {
  private state: SimpleState;
  private listeners: Array<(state: SimpleState) => void> = [];

  constructor(initialState: SimpleState) {
    this.state = { ...initialState };
  }

  getState(): SimpleState {
    return { ...this.state };
  }

  setState(partial: Partial<SimpleState>): void {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  subscribe(listener: (state: SimpleState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

/**
 * Map-based state management
 */
class MapStore {
  private state = new Map<string, any>();
  private listeners = new Map<string, Array<(value: any) => void>>();

  set<K extends keyof SimpleState>(key: K, value: SimpleState[K]): void {
    this.state.set(key as string, value);
    const fieldListeners = this.listeners.get(key as string);
    if (fieldListeners) {
      fieldListeners.forEach((listener) => listener(value));
    }
  }

  get<K extends keyof SimpleState>(key: K): SimpleState[K] {
    return this.state.get(key as string);
  }

  subscribe<K extends keyof SimpleState>(
    key: K,
    listener: (value: SimpleState[K]) => void
  ): () => void {
    const keyStr = key as string;
    if (!this.listeners.has(keyStr)) {
      this.listeners.set(keyStr, []);
    }
    this.listeners.get(keyStr)!.push(listener);

    return () => {
      const fieldListeners = this.listeners.get(keyStr);
      if (fieldListeners) {
        const index = fieldListeners.indexOf(listener);
        if (index > -1) {
          fieldListeners.splice(index, 1);
        }
      }
    };
  }
}

/**
 * Event emitter based state
 */
class EventEmitterStore {
  private state: SimpleState;
  private listeners: { [key: string]: Array<(value: any) => void> } = {};

  constructor(initialState: SimpleState) {
    this.state = { ...initialState };
  }

  set<K extends keyof SimpleState>(key: K, value: SimpleState[K]): void {
    this.state[key] = value;
    const fieldListeners = this.listeners[key as string];
    if (fieldListeners) {
      fieldListeners.forEach((listener) => listener(value));
    }
  }

  get<K extends keyof SimpleState>(key: K): SimpleState[K] {
    return this.state[key];
  }

  subscribe<K extends keyof SimpleState>(
    key: K,
    listener: (value: SimpleState[K]) => void
  ): () => void {
    const keyStr = key as string;
    if (!this.listeners[keyStr]) {
      this.listeners[keyStr] = [];
    }
    this.listeners[keyStr].push(listener);

    return () => {
      const fieldListeners = this.listeners[keyStr];
      if (fieldListeners) {
        const index = fieldListeners.indexOf(listener);
        if (index > -1) {
          fieldListeners.splice(index, 1);
        }
      }
    };
  }
}

/**
 * Compare basic operation performance
 */
export async function compareBasicOperations(): Promise<BenchmarkSuite> {
  const initialState: SimpleState = {
    counter: 0,
    text: "hello",
    list: ["item1", "item2"],
    user: { name: "John", age: 30 },
  };

  const fieldStore = new FieldStore(initialState);
  const vanillaStore = new VanillaStore(initialState);
  const mapStore = new MapStore();
  const eventStore = new EventEmitterStore(initialState);

  // Initialize map store
  mapStore.set("counter", initialState.counter);
  mapStore.set("text", initialState.text);
  mapStore.set("list", initialState.list);
  mapStore.set("user", initialState.user);

  return await compareBenchmarks(
    [
      {
        name: "NextTinyRXStore - set field",
        fn: () => fieldStore.set({ counter: Math.random() * 100 }),
      },
      {
        name: "Vanilla Store - setState",
        fn: () => vanillaStore.setState({ counter: Math.random() * 100 }),
      },
      {
        name: "Map Store - set",
        fn: () => mapStore.set("counter", Math.random() * 100),
      },
      {
        name: "Event Store - set",
        fn: () => eventStore.set("counter", Math.random() * 100),
      },
      {
        name: "NextTinyRXStore - get field",
        fn: () => fieldStore.get("counter"),
      },
      {
        name: "Vanilla Store - getState",
        fn: () => vanillaStore.getState().counter,
      },
      {
        name: "Map Store - get",
        fn: () => mapStore.get("counter"),
      },
      {
        name: "Event Store - get",
        fn: () => eventStore.get("counter"),
      },
    ],
    { iterations: 10000, minTime: 3000 }
  );
}

/**
 * Compare subscription performance
 */
export async function compareSubscriptionPerformance(): Promise<{
  subscriptionBenchmarks: BenchmarkSuite;
  memoryUsage: MemoryStats;
}> {
  const initialState: SimpleState = {
    counter: 0,
    text: "hello",
    list: ["item1", "item2"],
    user: { name: "John", age: 30 },
  };

  const { result: subscriptionBenchmarks, memoryStats: memoryUsage } =
    await measureMemoryUsage(async () => {
      const fieldStore = new FieldStore(initialState);
      const vanillaStore = new VanillaStore(initialState);
      const mapStore = new MapStore();
      const eventStore = new EventEmitterStore(initialState);

      // Initialize map store
      mapStore.set("counter", initialState.counter);
      mapStore.set("text", initialState.text);
      mapStore.set("list", initialState.list);
      mapStore.set("user", initialState.user);

      return await compareBenchmarks(
        [
          {
            name: "NextTinyRXStore - subscribe",
            fn: () => {
              const unsubscribe = fieldStore.register("counter", () => {});
              unsubscribe();
            },
          },
          {
            name: "Vanilla Store - subscribe",
            fn: () => {
              const unsubscribe = vanillaStore.subscribe(() => {});
              unsubscribe();
            },
          },
          {
            name: "Map Store - subscribe",
            fn: () => {
              const unsubscribe = mapStore.subscribe("counter", () => {});
              unsubscribe();
            },
          },
          {
            name: "Event Store - subscribe",
            fn: () => {
              const unsubscribe = eventStore.subscribe("counter", () => {});
              unsubscribe();
            },
          },
        ],
        { iterations: 5000, minTime: 2000 }
      );
    });

  return { subscriptionBenchmarks, memoryUsage };
}

/**
 * Compare memory efficiency
 */
export async function compareMemoryEfficiency(): Promise<{
  stores: Array<{
    name: string;
    memoryUsage: MemoryStats;
    finalSize: number;
  }>;
}> {
  const stores: Array<{
    name: string;
    memoryUsage: MemoryStats;
    finalSize: number;
  }> = [];

  // Test NextTinyRXStore
  const { result: fieldStoreSize, memoryStats: fieldStoreMemory } =
    await measureMemoryUsage(async () => {
      // Initialize with first field to establish initial state
      const initialData: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        initialData[`field${i}`] = `value${i}`;
      }
      const store = new FieldStore(initialData);
      return Object.keys(store.getAll()).length;
    });

  stores.push({
    name: "NextTinyRXStore",
    memoryUsage: fieldStoreMemory,
    finalSize: fieldStoreSize,
  });

  // Test Vanilla Store
  const { result: vanillaStoreSize, memoryStats: vanillaStoreMemory } =
    await measureMemoryUsage(async () => {
      const store = new VanillaStore({} as any);
      for (let i = 0; i < 1000; i++) {
        store.setState({ [`field${i}`]: `value${i}` } as any);
      }
      return Object.keys(store.getState()).length;
    });

  stores.push({
    name: "Vanilla Store",
    memoryUsage: vanillaStoreMemory,
    finalSize: vanillaStoreSize,
  });

  // Test Map Store
  const { result: mapStoreSize, memoryStats: mapStoreMemory } =
    await measureMemoryUsage(async () => {
      const store = new MapStore();
      for (let i = 0; i < 1000; i++) {
        store.set(`field${i}` as any, `value${i}`);
      }
      return 1000; // We know the size
    });

  stores.push({
    name: "Map Store",
    memoryUsage: mapStoreMemory,
    finalSize: mapStoreSize,
  });

  // Test Event Store
  const { result: eventStoreSize, memoryStats: eventStoreMemory } =
    await measureMemoryUsage(async () => {
      const store = new EventEmitterStore({} as any);
      for (let i = 0; i < 1000; i++) {
        store.set(`field${i}` as any, `value${i}`);
      }
      return 1000; // We know the size
    });

  stores.push({
    name: "Event Store",
    memoryUsage: eventStoreMemory,
    finalSize: eventStoreSize,
  });

  return { stores };
}

/**
 * Compare performance with many subscribers
 */
export async function compareWithManySubscribers(): Promise<BenchmarkSuite> {
  const initialState: SimpleState = {
    counter: 0,
    text: "hello",
    list: ["item1", "item2"],
    user: { name: "John", age: 30 },
  };

  const fieldStore = new FieldStore(initialState);
  const vanillaStore = new VanillaStore(initialState);
  const mapStore = new MapStore();
  const eventStore = new EventEmitterStore(initialState);

  // Initialize map store
  mapStore.set("counter", initialState.counter);
  mapStore.set("text", initialState.text);
  mapStore.set("list", initialState.list);
  mapStore.set("user", initialState.user);

  // Add many subscribers
  const subscriberCount = 100;

  // NextTinyRXStore subscribers
  const fieldStoreUnsubscribers: Array<() => void> = [];
  for (let i = 0; i < subscriberCount; i++) {
    fieldStoreUnsubscribers.push(fieldStore.register("counter", () => {}));
  }

  // Vanilla store subscribers
  const vanillaStoreUnsubscribers: Array<() => void> = [];
  for (let i = 0; i < subscriberCount; i++) {
    vanillaStoreUnsubscribers.push(vanillaStore.subscribe(() => {}));
  }

  // Map store subscribers
  const mapStoreUnsubscribers: Array<() => void> = [];
  for (let i = 0; i < subscriberCount; i++) {
    mapStoreUnsubscribers.push(mapStore.subscribe("counter", () => {}));
  }

  // Event store subscribers
  const eventStoreUnsubscribers: Array<() => void> = [];
  for (let i = 0; i < subscriberCount; i++) {
    eventStoreUnsubscribers.push(eventStore.subscribe("counter", () => {}));
  }

  try {
    return await compareBenchmarks(
      [
        {
          name: `NextTinyRXStore - update with ${subscriberCount} subscribers`,
          fn: () => fieldStore.set({ counter: Math.random() * 100 }),
        },
        {
          name: `Vanilla Store - update with ${subscriberCount} subscribers`,
          fn: () => vanillaStore.setState({ counter: Math.random() * 100 }),
        },
        {
          name: `Map Store - update with ${subscriberCount} subscribers`,
          fn: () => mapStore.set("counter", Math.random() * 100),
        },
        {
          name: `Event Store - update with ${subscriberCount} subscribers`,
          fn: () => eventStore.set("counter", Math.random() * 100),
        },
      ],
      { iterations: 1000, minTime: 2000 }
    );
  } finally {
    // Cleanup subscribers
    fieldStoreUnsubscribers.forEach((unsub) => unsub());
    vanillaStoreUnsubscribers.forEach((unsub) => unsub());
    mapStoreUnsubscribers.forEach((unsub) => unsub());
    eventStoreUnsubscribers.forEach((unsub) => unsub());
  }
}

/**
 * Compare derived/computed field performance
 */
export async function compareDerivedFields(): Promise<BenchmarkSuite> {
  const initialState = { a: 1, b: 2, c: 3 };

  // NextTinyRXStore with derived fields
  const fieldStore = new FieldStore(initialState)
    .derived("sum", ["a", "b"], (values) => values.a + values.b)
    .derived("product", ["sum", "c"], (values) => values.sum * values.c);

  // Vanilla store with manual computation
  class VanillaComputedStore extends VanillaStore {
    getSum(): number {
      const state = this.getState();
      return (state as any).a + (state as any).b;
    }

    getProduct(): number {
      const sum = this.getSum();
      const state = this.getState();
      return sum * (state as any).c;
    }
  }

  const vanillaStore = new VanillaComputedStore(initialState as any);

  return await compareBenchmarks(
    [
      {
        name: "NextTinyRXStore - derived field access",
        fn: () => {
          fieldStore.get("product");
        },
      },
      {
        name: "Vanilla Store - manual computation",
        fn: () => {
          vanillaStore.getProduct();
        },
      },
      {
        name: "NextTinyRXStore - update triggering derived",
        fn: () => {
          fieldStore.set({ a: Math.random() * 10 });
          fieldStore.get("product");
        },
      },
      {
        name: "Vanilla Store - update and recompute",
        fn: () => {
          vanillaStore.setState({ a: Math.random() * 10 } as any);
          vanillaStore.getProduct();
        },
      },
    ],
    { iterations: 5000, minTime: 2000 }
  );
}

/**
 * Run all comparative benchmarks
 */
export async function runAllComparativeBenchmarks(): Promise<{
  basicOperations: BenchmarkSuite;
  subscriptions: { benchmarks: BenchmarkSuite; memory: MemoryStats };
  memoryEfficiency: {
    stores: Array<{
      name: string;
      memoryUsage: MemoryStats;
      finalSize: number;
    }>;
  };
  manySubscribers: BenchmarkSuite;
  derivedFields: BenchmarkSuite;
}> {
  console.log("\n🚀 Starting Comparative Benchmarks...\n");

  console.log("1. Basic Operations...");
  const basicOperations = await compareBasicOperations();

  console.log("2. Subscription Performance...");
  const { subscriptionBenchmarks, memoryUsage } =
    await compareSubscriptionPerformance();

  console.log("3. Memory Efficiency...");
  const memoryEfficiency = await compareMemoryEfficiency();

  console.log("4. Many Subscribers Performance...");
  const manySubscribers = await compareWithManySubscribers();

  console.log("5. Derived Fields Performance...");
  const derivedFields = await compareDerivedFields();

  console.log("\n✅ All comparative benchmarks completed!\n");

  return {
    basicOperations,
    subscriptions: { benchmarks: subscriptionBenchmarks, memory: memoryUsage },
    memoryEfficiency,
    manySubscribers,
    derivedFields,
  };
}
