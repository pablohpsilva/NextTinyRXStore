import { FieldStore } from "./store";
import { isServer } from "./utils";

/** Factory helper */
export function createFieldStore<T extends Record<string, unknown>>(
  initialState: T
) {
  return new FieldStore(initialState);
}

/**
 * Create a store that supports SSR hydration
 * This is the recommended way to create stores for Next.js apps
 */
export function createSSRStore<T extends Record<string, unknown>>(
  initialState: T,
  serverState?: Partial<T>
) {
  const store = new FieldStore(initialState);

  // If we have server state and we're on the client, hydrate it
  if (serverState && !isServer) {
    store.hydrate(serverState);
  }

  return store;
}

/**
 * Helper for server-side store initialization
 * Use this in your server components or getServerSideProps
 */
export function initializeServerStore<T extends Record<string, unknown>>(
  store: FieldStore<T>,
  serverData: Partial<T>
): T {
  store.set(serverData);
  return store.serialize();
}
