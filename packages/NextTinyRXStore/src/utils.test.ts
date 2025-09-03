import { describe, it, expect, afterEach, vi } from "vitest";
import { isServer, shallowEqual } from "./utils";

describe("utils", () => {
  describe("isServer", () => {
    const originalWindow = global.window;

    afterEach(() => {
      // Restore original window after each test
      global.window = originalWindow;
    });

    it("should return true when window is undefined (server environment)", async () => {
      // @ts-ignore - Temporarily delete window to simulate server
      delete global.window;

      // Re-import to get fresh evaluation
      vi.resetModules();
      const { isServer: freshIsServer } = await import("./utils");

      expect(freshIsServer).toBe(true);
    });

    it("should return false when window is defined (client environment)", async () => {
      // Ensure window exists (jsdom provides this)
      global.window = originalWindow || ({} as any);

      // Re-import to get fresh evaluation
      vi.resetModules();
      const { isServer: freshIsServer } = await import("./utils");

      expect(freshIsServer).toBe(false);
    });

    it("should handle window being explicitly set to undefined", async () => {
      // @ts-ignore - Set window to undefined
      global.window = undefined;

      // Re-import to get fresh evaluation
      vi.resetModules();
      const { isServer: freshIsServer } = await import("./utils");

      expect(freshIsServer).toBe(true);
    });
  });

  describe("shallowEqual", () => {
    describe("Object.is cases (should return true immediately)", () => {
      it("should return true for identical references", () => {
        const obj = { a: 1 };
        expect(shallowEqual(obj, obj)).toBe(true);
      });

      it("should return true for identical primitive values", () => {
        expect(shallowEqual(5, 5)).toBe(true);
        expect(shallowEqual("hello", "hello")).toBe(true);
        expect(shallowEqual(true, true)).toBe(true);
        expect(shallowEqual(false, false)).toBe(true);
      });

      it("should return true for both null", () => {
        expect(shallowEqual(null, null)).toBe(true);
      });

      it("should return true for both undefined", () => {
        expect(shallowEqual(undefined, undefined)).toBe(true);
      });

      it("should handle special Number cases", () => {
        expect(shallowEqual(NaN, NaN)).toBe(true); // Object.is(NaN, NaN) is true
        expect(shallowEqual(+0, -0)).toBe(false); // Object.is(+0, -0) is false
        expect(shallowEqual(-0, +0)).toBe(false); // Object.is(-0, +0) is false
      });
    });

    describe("Non-object cases (should return false)", () => {
      it("should return false when first argument is not an object", () => {
        expect(shallowEqual(5, { a: 1 })).toBe(false);
        expect(shallowEqual("string", { a: 1 })).toBe(false);
        expect(shallowEqual(true, { a: 1 })).toBe(false);
        expect(shallowEqual(undefined, { a: 1 })).toBe(false);
      });

      it("should return false when second argument is not an object", () => {
        expect(shallowEqual({ a: 1 }, 5)).toBe(false);
        expect(shallowEqual({ a: 1 }, "string")).toBe(false);
        expect(shallowEqual({ a: 1 }, true)).toBe(false);
        expect(shallowEqual({ a: 1 }, undefined)).toBe(false);
      });

      it("should return false when both arguments are non-objects but different", () => {
        expect(shallowEqual(5, 10)).toBe(false);
        expect(shallowEqual("hello", "world")).toBe(false);
        expect(shallowEqual(true, false)).toBe(false);
      });

      it("should return false when one argument is null", () => {
        expect(shallowEqual(null, { a: 1 })).toBe(false);
        expect(shallowEqual({ a: 1 }, null)).toBe(false);
      });

      it("should return false for different primitive types", () => {
        expect(shallowEqual(0, "0")).toBe(false);
        expect(shallowEqual(false, 0)).toBe(false);
        expect(shallowEqual("", false)).toBe(false);
      });
    });

    describe("Object comparison cases", () => {
      it("should return false when objects have different number of keys", () => {
        expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(shallowEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
        expect(shallowEqual({}, { a: 1 })).toBe(false);
        expect(shallowEqual({ a: 1 }, {})).toBe(false);
      });

      it("should return true for empty objects", () => {
        expect(shallowEqual({}, {})).toBe(true);
      });

      it("should return true when objects have same keys and values", () => {
        expect(shallowEqual({ a: 1 }, { a: 1 })).toBe(true);
        expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
        expect(shallowEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true); // Order doesn't matter
      });

      it("should return false when objects have same keys but different values", () => {
        expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
        expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      });

      it("should handle objects with various value types", () => {
        const obj1 = { a: 1, b: "string", c: true, d: null, e: undefined };
        const obj2 = { a: 1, b: "string", c: true, d: null, e: undefined };
        const obj3 = { a: 1, b: "string", c: true, d: null, e: null }; // e is different

        expect(shallowEqual(obj1, obj2)).toBe(true);
        expect(shallowEqual(obj1, obj3)).toBe(false);
      });

      it("should handle nested objects (shallow comparison)", () => {
        const nested1 = { x: 1 };
        const nested2 = { x: 1 };

        // Same reference - should be true
        expect(shallowEqual({ a: nested1 }, { a: nested1 })).toBe(true);

        // Different references but same content - should be false (shallow)
        expect(shallowEqual({ a: nested1 }, { a: nested2 })).toBe(false);
      });

      it("should handle arrays as object values", () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2, 3];

        // Same reference
        expect(shallowEqual({ a: arr1 }, { a: arr1 })).toBe(true);

        // Different references but same content - should be false (shallow)
        expect(shallowEqual({ a: arr1 }, { a: arr2 })).toBe(false);
      });

      it("should handle functions as object values", () => {
        const func1 = () => {};
        const func2 = () => {};

        // Same reference
        expect(shallowEqual({ a: func1 }, { a: func1 })).toBe(true);

        // Different functions
        expect(shallowEqual({ a: func1 }, { a: func2 })).toBe(false);
      });

      it("should handle objects with symbol keys", () => {
        const sym1 = Symbol("test");
        const sym2 = Symbol("test");

        const obj1 = { [sym1]: "value1" };
        const obj2 = { [sym1]: "value1" };
        const obj3 = { [sym2]: "value1" };

        expect(shallowEqual(obj1, obj2)).toBe(true);
        expect(shallowEqual(obj1, obj3)).toBe(true); // Object.keys() doesn't include symbols, so they appear equal
      });

      it("should handle objects with number and string keys", () => {
        const obj1 = { 1: "one", "2": "two" };
        const obj2 = { 1: "one", "2": "two" };
        const obj3 = { 1: "one", 2: "two" }; // '2' vs 2

        expect(shallowEqual(obj1, obj2)).toBe(true);
        // Note: JavaScript converts numeric keys to strings in Object.keys()
        expect(shallowEqual(obj1, obj3)).toBe(true);
      });

      it("should handle Date objects", () => {
        const date1 = new Date("2023-01-01");
        const date2 = new Date("2023-01-01");
        const date3 = new Date("2023-01-02");

        // Same reference
        expect(shallowEqual({ date: date1 }, { date: date1 })).toBe(true);

        // Different references, same date - should be false (shallow)
        expect(shallowEqual({ date: date1 }, { date: date2 })).toBe(false);

        // Different dates
        expect(shallowEqual({ date: date1 }, { date: date3 })).toBe(false);
      });

      it("should handle special numeric values in objects", () => {
        expect(shallowEqual({ a: NaN }, { a: NaN })).toBe(true); // Object.is(NaN, NaN) is true
        expect(shallowEqual({ a: +0 }, { a: -0 })).toBe(false); // Object.is(+0, -0) is false
        expect(shallowEqual({ a: Infinity }, { a: Infinity })).toBe(true);
        expect(shallowEqual({ a: -Infinity }, { a: -Infinity })).toBe(true);
      });
    });

    describe("Edge cases and type coercion", () => {
      it("should handle objects vs arrays", () => {
        expect(shallowEqual({}, [])).toBe(true); // Both are objects with no keys
        expect(shallowEqual({ 0: "a" }, ["a"])).toBe(true); // Array keys are strings, so '0': 'a' equals ['a']
        expect(shallowEqual({ length: 1, 0: "a" }, ["a"])).toBe(false); // Object has different key order/count than array
      });

      it("should handle class instances", () => {
        class TestClass {
          constructor(public value: number) {}
        }

        const instance1 = new TestClass(1);
        const instance2 = new TestClass(1);

        // Same reference
        expect(shallowEqual({ obj: instance1 }, { obj: instance1 })).toBe(true);

        // Different instances, same value - should be false (shallow)
        expect(shallowEqual({ obj: instance1 }, { obj: instance2 })).toBe(
          false
        );
      });

      it("should handle prototype chain differences", () => {
        const obj1 = Object.create({ inherited: "value" });
        obj1.own = "value";

        const obj2 = { own: "value" };

        // Object.keys only returns own properties, so these should be equal
        expect(shallowEqual(obj1, obj2)).toBe(true);
      });
    });
  });
});
