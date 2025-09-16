/**
 * Stale Props and Zombie Children Prevention Tests
 *
 * Tests based on React-Redux documentation:
 * https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
 *
 * These tests verify that NextTinyRXStore's subscription mechanism
 * correctly handles edge cases that can cause stale props and
 * zombie children issues, focusing on the store-level behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FieldStore } from "./store";

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  userId: number;
}

interface TodoState {
  todos: Record<number, TodoItem>;
  users: Record<number, { id: number; name: string }>;
  selectedUserId: number;
  loading: boolean;
}

describe("Stale Props and Zombie Children Prevention", () => {
  let store: FieldStore<TodoState>;
  let subscriptionCallbacks: Array<() => void>;
  let errorLogs: string[];

  beforeEach(() => {
    // Initialize test store with sample data
    store = new FieldStore<TodoState>({
      todos: {
        1: { id: 1, text: "Todo 1", completed: false, userId: 1 },
        2: { id: 2, text: "Todo 2", completed: true, userId: 1 },
        3: { id: 3, text: "Todo 3", completed: false, userId: 2 },
      },
      users: {
        1: { id: 1, name: "User 1" },
        2: { id: 2, name: "User 2" },
      },
      selectedUserId: 1,
      loading: false,
    });

    subscriptionCallbacks = [];
    errorLogs = [];

    // Mock console.error to capture actual errors
    vi.spyOn(console, "error").mockImplementation((message, ...args) => {
      const messageStr =
        typeof message === "string" ? message : String(message);
      // Only capture real errors, not React dev warnings
      if (
        !messageStr.includes("Warning:") &&
        !messageStr.includes("ReactDOM") &&
        !messageStr.includes("act()")
      ) {
        errorLogs.push(messageStr);
      }
    });
  });

  afterEach(() => {
    // Clean up subscriptions
    subscriptionCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (e) {
        /* ignore */
      }
    });
    subscriptionCallbacks = [];
    vi.restoreAllMocks();
  });

  describe("Prop-Dependent Selector Behavior", () => {
    it("should handle selectors that depend on external parameters without stale data", async () => {
      let selectorCallCount = 0;
      let lastResult: TodoItem | null = null;
      let currentUserId = 1;

      // Create a prop-dependent selector (simulating useSelector with props)
      const createPropDependentSelector = (userId: number) => {
        return (todos: Record<number, TodoItem>) => {
          selectorCallCount++;
          const userTodos = Object.values(todos).filter(
            (todo) => todo.userId === userId
          );
          return userTodos[0] || null;
        };
      };

      // Subscribe with initial props
      let selector = createPropDependentSelector(currentUserId);
      const unsubscribe = store.observable("todos").subscribe((todos) => {
        lastResult = selector(todos);
      });
      subscriptionCallbacks.push(unsubscribe.unsubscribe);

      // Initial state
      expect(lastResult?.userId).toBe(1);
      expect(lastResult?.text).toBe("Todo 1");

      // Simulate prop change (like parent re-render with new props)
      currentUserId = 2;
      selector = createPropDependentSelector(currentUserId);

      // Update store data
      store.set({
        todos: {
          ...store.get("todos"),
          3: { id: 3, text: "Updated Todo 3", completed: false, userId: 2 },
        },
      });

      // Wait for subscription to fire
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have the updated data for the new userId
      expect(lastResult?.userId).toBe(2);
      expect(lastResult?.text).toBe("Updated Todo 3");
      expect(errorLogs).toHaveLength(0);
    });

    it("should handle defensive selectors when referenced data is deleted", () => {
      let selectorErrors = 0;
      let results: any[] = [];

      // Create defensive selector
      const defensiveSelector =
        (todoId: number) => (todos: Record<number, TodoItem>) => {
          try {
            const todo = todos[todoId];
            if (!todo) {
              return { error: "Todo not found", id: todoId };
            }
            return { todo, error: null, id: todoId };
          } catch (error) {
            selectorErrors++;
            return { error: "Selector error", id: todoId };
          }
        };

      const selector = defensiveSelector(1);
      const unsubscribe = store.observable("todos").subscribe((todos) => {
        results.push(selector(todos));
      });
      subscriptionCallbacks.push(unsubscribe.unsubscribe);

      // Initial state should be valid
      expect(results[0].error).toBeNull();
      expect(results[0].todo.text).toBe("Todo 1");

      // Remove the todo
      const todosWithoutOne = { ...store.get("todos") };
      delete todosWithoutOne[1];
      store.set({ todos: todosWithoutOne });

      // Should handle missing data gracefully
      expect(results[results.length - 1].error).toBe("Todo not found");
      expect(selectorErrors).toBe(0);
      expect(errorLogs).toHaveLength(0);
    });

    it("should maintain consistency during rapid updates with prop-like parameters", async () => {
      let results: Array<{
        paramId: number;
        dataId: number | null;
        timestamp: number;
      }> = [];

      const createParameterizedSelector = (paramId: number) => {
        return (todos: Record<number, TodoItem>) => {
          const todo = todos[paramId] || null;
          return {
            paramId,
            dataId: todo?.id || null,
            timestamp: Date.now(),
          };
        };
      };

      // Subscribe with different parameters rapidly
      const parameters = [1, 2, 1, 3, 2];
      const subscriptions: Array<() => void> = [];

      for (const paramId of parameters) {
        const selector = createParameterizedSelector(paramId);
        const unsubscribe = store.observable("todos").subscribe((todos) => {
          results.push(selector(todos));
        });
        subscriptions.push(unsubscribe.unsubscribe);

        // Small delay between subscriptions
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      subscriptionCallbacks.push(...subscriptions);

      // Trigger store update
      store.set({
        todos: {
          ...store.get("todos"),
          4: { id: 4, text: "New Todo 4", completed: false, userId: 1 },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Check consistency - parameter and data should match when data exists
      results.forEach((result) => {
        if (result.dataId !== null) {
          expect(result.paramId).toBe(result.dataId);
        }
      });

      expect(errorLogs).toHaveLength(0);
    });
  });

  describe("Zombie Children Prevention", () => {
    it("should handle subscriptions to data that gets deleted", () => {
      let childSubscriptionResults: any[] = [];
      let parentSubscriptionResults: any[] = [];
      let childErrors = 0;

      // Simulate parent subscription (decides what children to render)
      const parentSubscription = store
        .observable("todos")
        .subscribe((todos) => {
          const userTodos = Object.values(todos).filter(
            (todo) => todo.userId === 1
          );
          parentSubscriptionResults.push({
            type: "parent",
            todoIds: userTodos.map((t) => t.id),
            timestamp: Date.now(),
          });
        });

      // Simulate child subscription (depends on specific todo)
      const childTodoId = 1;
      const childSubscription = store.observable("todos").subscribe((todos) => {
        try {
          const todo = todos[childTodoId];
          if (!todo) {
            childSubscriptionResults.push({
              type: "child",
              todo: null,
              error: "Todo not found",
              timestamp: Date.now(),
            });
          } else {
            childSubscriptionResults.push({
              type: "child",
              todo: todo,
              error: null,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          childErrors++;
          childSubscriptionResults.push({
            type: "child",
            todo: null,
            error: "Child subscription error",
            timestamp: Date.now(),
          });
        }
      });

      subscriptionCallbacks.push(
        parentSubscription.unsubscribe,
        childSubscription.unsubscribe
      );

      // Initial state - both should have data
      expect(parentSubscriptionResults[0].todoIds).toContain(1);
      expect(childSubscriptionResults[0].todo?.id).toBe(1);
      expect(childSubscriptionResults[0].error).toBeNull();

      // Delete the todo that child depends on
      const todosWithoutOne = { ...store.get("todos") };
      delete todosWithoutOne[1];
      store.set({ todos: todosWithoutOne });

      // Parent should update to not include deleted todo
      const latestParentResult =
        parentSubscriptionResults[parentSubscriptionResults.length - 1];
      expect(latestParentResult.todoIds).not.toContain(1);

      // Child should handle missing data gracefully (no zombie)
      const latestChildResult =
        childSubscriptionResults[childSubscriptionResults.length - 1];
      expect(latestChildResult.error).toBe("Todo not found");
      expect(childErrors).toBe(0);
      expect(errorLogs).toHaveLength(0);
    });

    it("should handle nested subscription hierarchies correctly", () => {
      let level1Results: any[] = [];
      let level2Results: any[] = [];
      let level3Results: any[] = [];

      // Level 1: Subscribe to users
      const level1Sub = store.observable("users").subscribe((users) => {
        level1Results.push({
          level: 1,
          userIds: Object.keys(users).map(Number),
          timestamp: Date.now(),
        });
      });

      // Level 2: Subscribe to todos for specific user
      const level2Sub = store.observable("todos").subscribe((todos) => {
        const userTodos = Object.values(todos).filter(
          (todo) => todo.userId === 1
        );
        level2Results.push({
          level: 2,
          todoIds: userTodos.map((t) => t.id),
          timestamp: Date.now(),
        });
      });

      // Level 3: Subscribe to specific todo
      const level3Sub = store.observable("todos").subscribe((todos) => {
        const specificTodo = todos[1];
        level3Results.push({
          level: 3,
          todo: specificTodo || null,
          timestamp: Date.now(),
        });
      });

      subscriptionCallbacks.push(
        level1Sub.unsubscribe,
        level2Sub.unsubscribe,
        level3Sub.unsubscribe
      );

      // Add new user and todo
      store.set({
        users: {
          ...store.get("users"),
          3: { id: 3, name: "User 3" },
        },
        todos: {
          ...store.get("todos"),
          4: { id: 4, text: "Todo 4", completed: false, userId: 3 },
        },
      });

      // All levels should update without errors
      expect(level1Results.length).toBeGreaterThan(1);
      expect(level2Results.length).toBeGreaterThan(0);
      expect(level3Results.length).toBeGreaterThan(0);
      expect(errorLogs).toHaveLength(0);
    });

    it("should handle subscription cleanup during updates", () => {
      let subscriptionCalls = 0;
      let cleanupCalls = 0;
      let updateDuringCleanup = false;

      const subscription = store.observable("todos").subscribe((todos) => {
        subscriptionCalls++;

        // Simulate component that might unmount during update
        if (subscriptionCalls === 2) {
          // Schedule cleanup to happen during next update
          setTimeout(() => {
            cleanupCalls++;
            subscription.unsubscribe();
          }, 5);
        }
      });

      // Trigger initial update
      store.set({
        todos: {
          ...store.get("todos"),
          5: { id: 5, text: "Todo 5", completed: false, userId: 1 },
        },
      });

      // Trigger update that should cause cleanup
      setTimeout(() => {
        store.set({
          todos: {
            ...store.get("todos"),
            6: { id: 6, text: "Todo 6", completed: false, userId: 1 },
          },
        });
      }, 10);

      // Trigger another update after cleanup
      setTimeout(() => {
        store.set({
          todos: {
            ...store.get("todos"),
            7: { id: 7, text: "Todo 7", completed: false, userId: 1 },
          },
        });
        updateDuringCleanup = true;
      }, 20);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(subscriptionCalls).toBeGreaterThan(1);
          expect(cleanupCalls).toBeGreaterThan(0);
          expect(updateDuringCleanup).toBe(true);
          expect(errorLogs).toHaveLength(0);
          resolve();
        }, 50);
      });
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should recover gracefully from selector errors", () => {
      let errorCount = 0;
      let successfulResults: any[] = [];
      let selectorCallCount = 0;

      const flakySelector = (todos: Record<number, TodoItem>) => {
        selectorCallCount++;

        // Cause error on specific calls
        if (selectorCallCount === 3 || selectorCallCount === 5) {
          throw new Error(`Intentional selector error #${errorCount++}`);
        }

        return Object.values(todos).length;
      };

      let subscription: any;
      const subscribeWithErrorHandling = () => {
        subscription = store.observable("todos").subscribe((todos) => {
          try {
            const result = flakySelector(todos);
            successfulResults.push(result);
          } catch (error) {
            // Handle selector error gracefully
            console.debug("Selector error handled:", error);
          }
        });
      };

      subscribeWithErrorHandling();
      subscriptionCallbacks.push(() => subscription?.unsubscribe());

      // Trigger multiple updates
      for (let i = 0; i < 6; i++) {
        store.set({
          todos: {
            ...store.get("todos"),
            [100 + i]: {
              id: 100 + i,
              text: `Todo ${100 + i}`,
              completed: false,
              userId: 1,
            },
          },
        });
      }

      // Should have some successful results despite errors
      expect(successfulResults.length).toBeGreaterThan(2);
      expect(errorCount).toBe(2); // Two intentional errors
      expect(errorLogs).toHaveLength(0); // No unhandled errors
    });

    it("should maintain subscription integrity under stress", async () => {
      let subscriptionResults: number[] = [];
      let maxConcurrentUpdates = 10;
      let completedUpdates = 0;

      const subscription = store.observable("todos").subscribe((todos) => {
        subscriptionResults.push(Object.keys(todos).length);
      });
      subscriptionCallbacks.push(subscription.unsubscribe);

      // Trigger many rapid updates
      const updatePromises = Array.from(
        { length: maxConcurrentUpdates },
        (_, i) => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              store.set({
                todos: {
                  ...store.get("todos"),
                  [200 + i]: {
                    id: 200 + i,
                    text: `Stress Todo ${i}`,
                    completed: false,
                    userId: 1,
                  },
                },
              });
              completedUpdates++;
              resolve();
            }, Math.random() * 20);
          });
        }
      );

      await Promise.all(updatePromises);

      // All updates should complete without errors
      expect(completedUpdates).toBe(maxConcurrentUpdates);
      expect(subscriptionResults.length).toBeGreaterThan(maxConcurrentUpdates);
      expect(errorLogs).toHaveLength(0);
    });
  });

  describe("Subscription Timing and Consistency", () => {
    it("should ensure consistent subscription notification order", () => {
      let notificationOrder: Array<{
        subscriber: string;
        timestamp: number;
        value: any;
      }> = [];

      // Create multiple subscribers
      const sub1 = store.observable("selectedUserId").subscribe((userId) => {
        notificationOrder.push({
          subscriber: "sub1",
          timestamp: performance.now(),
          value: userId,
        });
      });

      const sub2 = store.observable("selectedUserId").subscribe((userId) => {
        notificationOrder.push({
          subscriber: "sub2",
          timestamp: performance.now(),
          value: userId,
        });
      });

      const sub3 = store.observable("selectedUserId").subscribe((userId) => {
        notificationOrder.push({
          subscriber: "sub3",
          timestamp: performance.now(),
          value: userId,
        });
      });

      subscriptionCallbacks.push(
        sub1.unsubscribe,
        sub2.unsubscribe,
        sub3.unsubscribe
      );

      // Clear initial notifications
      notificationOrder = [];

      // Trigger update
      store.set({ selectedUserId: 2 });

      // All subscribers should get same value
      const uniqueValues = new Set(notificationOrder.map((n) => n.value));
      expect(uniqueValues.size).toBe(1);
      expect(Array.from(uniqueValues)[0]).toBe(2);

      // All subscribers should be notified
      expect(notificationOrder.length).toBe(3);
      expect(errorLogs).toHaveLength(0);
    });

    it("should handle overlapping subscription updates correctly", async () => {
      let updateSequence: Array<{
        field: string;
        value: any;
        timestamp: number;
      }> = [];

      // Subscribe to multiple fields
      const todosSub = store.observable("todos").subscribe((todos) => {
        updateSequence.push({
          field: "todos",
          value: Object.keys(todos).length,
          timestamp: performance.now(),
        });
      });

      const usersSub = store.observable("users").subscribe((users) => {
        updateSequence.push({
          field: "users",
          value: Object.keys(users).length,
          timestamp: performance.now(),
        });
      });

      subscriptionCallbacks.push(todosSub.unsubscribe, usersSub.unsubscribe);

      // Clear initial updates
      updateSequence = [];

      // Update both fields simultaneously
      store.set({
        todos: {
          ...store.get("todos"),
          8: { id: 8, text: "Todo 8", completed: false, userId: 1 },
        },
        users: {
          ...store.get("users"),
          4: { id: 4, name: "User 4" },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Both fields should have been updated
      expect(updateSequence.some((u) => u.field === "todos")).toBe(true);
      expect(updateSequence.some((u) => u.field === "users")).toBe(true);
      expect(errorLogs).toHaveLength(0);
    });
  });
});
