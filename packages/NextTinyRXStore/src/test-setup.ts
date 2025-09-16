/**
 * Test setup for performance tests
 */

// Mock testing-library if not available
if (!(global as any).expect) {
  // Basic expect implementation for environments without jest-dom
  const expect = (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan: (expected: number) => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(
            expected
          )}`
        );
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
    toHaveTextContent: (expected: string) => {
      const text = actual?.textContent || "";
      if (!text.includes(expected)) {
        throw new Error(
          `Expected element to have text content "${expected}", but got "${text}"`
        );
      }
    },
    toContain: (expected: any) => {
      if (!actual.includes(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(
            expected
          )}`
        );
      }
    },
  });

  (global as any).expect = expect;
}

export {}; // Make this a module
