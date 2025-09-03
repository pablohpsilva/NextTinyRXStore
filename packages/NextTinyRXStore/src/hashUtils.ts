// Hash utilities for function deduplication and identity management

// WeakMap to track unique function identities
const functionIdMap = new WeakMap<Function, number>();
let functionIdCounter = 0;

// Type for mock functions with Vitest API
interface MockFunction extends Function {
  mock?: unknown;
  getMockImplementation?(): Function | undefined;
}

/**
 * Enhanced hash function for function strings that handles mock functions intelligently
 *
 * For mock functions, we differentiate between:
 * 1. Generic mocks (vi.fn()) - should be unique by object identity
 * 2. Mocks with implementation (vi.fn(() => {...})) - should be deduplicated by content
 */
export function hashFunction(fn: Function): string {
  const fnString = fn.toString();
  const mockFn = fn as MockFunction;
  const isMock = mockFn.mock !== undefined;

  if (isMock) {
    // Check if the mock has a custom implementation
    // Generic vi.fn() calls don't have r.impl, while vi.fn(implementation) do
    const hasCustomImpl = mockFn.getMockImplementation?.() !== undefined;
    const isGeneric = !hasCustomImpl;

    if (isGeneric) {
      // Generic mocks should be unique by object identity
      if (!functionIdMap.has(fn)) {
        functionIdMap.set(fn, ++functionIdCounter);
      }
      return `mock_${functionIdMap.get(fn)}`;
    }

    // For mocks with implementation, hash the actual implementation, not the wrapper
    const implementation = mockFn.getMockImplementation!();
    const implString = implementation!.toString();

    return `fn_${hashString(implString)}`;
  }

  // For regular functions, use content-based hashing for deduplication
  return `fn_${hashString(fnString)}`;
}

/**
 * Simple string hashing function using djb2 algorithm
 * More efficient than the previous character-by-character approach
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36);
}
