import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createFieldStore,
  createSSRStore,
  initializeServerStore,
} from "./factories";

describe("factories", () => {
  const originalWindow = global.window;

  afterEach(() => {
    global.window = originalWindow;
  });

  describe("createFieldStore", () => {
    it("should create a FieldStore with initial state", () => {
      const store = createFieldStore({ name: "John", age: 30 });

      expect(store.get("name")).toBe("John");
      expect(store.get("age")).toBe(30);
      expect(typeof store.setters.setName).toBe("function");
      expect(typeof store.setters.setAge).toBe("function");
    });

    it("should create store with complex initial state", () => {
      const complexState = {
        user: { id: 1, name: "John" },
        settings: { theme: "dark", notifications: true },
        data: [1, 2, 3],
        count: 0,
      };

      const store = createFieldStore(complexState);

      expect(store.get("user")).toEqual({ id: 1, name: "John" });
      expect(store.get("settings")).toEqual({
        theme: "dark",
        notifications: true,
      });
      expect(store.get("data")).toEqual([1, 2, 3]);
      expect(store.get("count")).toBe(0);
    });

    it("should create store with empty state", () => {
      const store = createFieldStore({});
      expect(store.getAll()).toEqual({});
    });
  });

  describe("createSSRStore", () => {
    it("should create store and immediately hydrate with server state", () => {
      // Ensure we're in client environment for hydration test
      global.window = originalWindow || ({} as any);

      const initialState = { name: "Client", age: 25 };
      const serverState = { name: "Server", age: 30 };

      const store = createSSRStore(initialState, serverState);

      // Should have server state, not initial state (hydrated on client)
      expect(store.get("name")).toBe("Server");
      expect(store.get("age")).toBe(30);
    });

    it("should handle partial server state", () => {
      // Ensure we're in client environment for hydration test
      global.window = originalWindow || ({} as any);

      const initialState = { name: "Client", age: 25, active: true };
      const serverState = { name: "Server" }; // Only partial state from server

      const store = createSSRStore(initialState, serverState);

      expect(store.get("name")).toBe("Server"); // From server
      expect(store.get("age")).toBe(25); // From initial (unchanged)
      expect(store.get("active")).toBe(true); // From initial (unchanged)
    });

    it("should handle empty server state", () => {
      // Ensure we're in client environment
      global.window = originalWindow || ({} as any);

      const initialState = { name: "Client", age: 25 };
      const serverState = {};

      const store = createSSRStore(initialState, serverState);

      expect(store.get("name")).toBe("Client");
      expect(store.get("age")).toBe(25);
    });

    it("should handle null/undefined server state", () => {
      // Ensure we're in client environment
      global.window = originalWindow || ({} as any);

      const initialState = { name: "Client", age: 25 };

      const store1 = createSSRStore(initialState, null as any);
      expect(store1.get("name")).toBe("Client");

      const store2 = createSSRStore(initialState, undefined as any);
      expect(store2.get("name")).toBe("Client");
    });

    it("should NOT hydrate on server even with server state", async () => {
      // Simulate server environment by deleting window
      // @ts-ignore
      delete global.window;

      // Need to re-import after changing environment to get fresh isServer evaluation
      vi.resetModules();
      const { createSSRStore: serverCreateSSRStore } = await import(
        "./factories"
      );
      const { FieldStore: ServerFieldStore } = await import("./store");

      const initialState = { name: "Client", age: 25 };
      const serverState = { name: "Server", age: 30 };

      const store = serverCreateSSRStore(initialState, serverState);

      // Should NOT hydrate on server, keeping initial state
      expect(store.get("name")).toBe("Client");
      expect(store.get("age")).toBe(25);
    });
  });

  describe("initializeServerStore", () => {
    beforeEach(() => {
      // Simulate server environment
      // @ts-ignore
      delete global.window;
    });

    it("should create store and set server state", () => {
      const initialState = { name: "Initial", count: 0 };
      const serverData = { name: "ServerProcessed", count: 42 };

      const result = initializeServerStore(
        createFieldStore(initialState),
        serverData
      );

      expect(result.name).toBe("ServerProcessed");
      expect(result.count).toBe(42);
    });

    it("should handle complex server logic", () => {
      const initialState = {
        users: [] as string[],
        isLoading: true,
        error: null as string | null,
      };

      const serverData = {
        users: ["user1", "user2", "user3"] as string[],
        isLoading: false,
        error: null as string | null,
      };

      const result = initializeServerStore(
        createFieldStore(initialState),
        serverData
      );

      expect(result.users).toEqual(["user1", "user2", "user3"]);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBe(null);
    });

    it("should handle partial server data", () => {
      const initialState = { data: "initial", error: null, status: "loading" };
      const serverData = { data: "processed" }; // Only partial data

      const result = initializeServerStore(
        createFieldStore(initialState),
        serverData
      );

      expect(result.data).toBe("processed"); // Updated
      expect(result.error).toBe(null); // Unchanged
      expect(result.status).toBe("loading"); // Unchanged
    });

    it("should handle empty server data", () => {
      const initialState = { data: "initial", status: "pending" };
      const serverData = {}; // Empty server data

      const result = initializeServerStore(
        createFieldStore(initialState),
        serverData
      );

      // Should retain initial values
      expect(result.data).toBe("initial");
      expect(result.status).toBe("pending");
    });

    it("should return serialized state", () => {
      const initialState = { name: "test", count: 0 };
      const serverData = { name: "updated", count: 5 };

      const result = initializeServerStore(
        createFieldStore(initialState),
        serverData
      );

      // Should return the serialized state object, not the store instance
      expect(typeof result).toBe("object");
      expect(result.name).toBe("updated");
      expect(result.count).toBe(5);

      // Should not be a store instance
      expect(typeof (result as any).get).toBe("undefined");
      expect(typeof (result as any).set).toBe("undefined");
    });

    it("should work in client environment too", () => {
      // Restore window to simulate client
      global.window = originalWindow || ({} as any);

      const initialState = { env: "unknown" };
      const serverData = { env: "processed" };

      const result = initializeServerStore(
        createFieldStore(initialState),
        serverData
      );
      expect(result.env).toBe("processed");
    });
  });

  describe("factory edge cases", () => {
    it("should handle TypeScript type inference correctly", () => {
      // Test that TypeScript types are inferred correctly
      const store = createFieldStore({
        stringField: "test",
        numberField: 42,
        booleanField: true,
        objectField: { nested: "value" },
      });

      // These should not cause TypeScript errors
      const str: string = store.get("stringField");
      const num: number = store.get("numberField");
      const bool: boolean = store.get("booleanField");
      const obj: { nested: string } = store.get("objectField");

      expect(str).toBe("test");
      expect(num).toBe(42);
      expect(bool).toBe(true);
      expect(obj).toEqual({ nested: "value" });
    });

    it("should handle very large initial states", () => {
      const largeState: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        largeState[`field${i}`] = i;
      }

      const store = createFieldStore(largeState);

      expect(store.get("field0")).toBe(0);
      expect(store.get("field500")).toBe(500);
      expect(store.get("field999")).toBe(999);

      // Test that all setters were created
      expect(typeof store.setters.setField0).toBe("function");
      expect(typeof store.setters.setField999).toBe("function");
    });

    it("should handle special characters in field names", () => {
      const store = createFieldStore({
        "field-with-dash": "dash",
        "field with space": "space",
        field$with$symbols: "symbols",
        "123numeric": "numeric",
      });

      expect(store.get("field-with-dash")).toBe("dash");
      expect(store.get("field with space")).toBe("space");
      expect(store.get("field$with$symbols")).toBe("symbols");
      expect(store.get("123numeric")).toBe("numeric");
    });
  });
});
