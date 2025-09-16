/**
 * Subscription Safety Tests
 *
 * Tests NextTinyRXStore's subscription mechanisms to ensure they handle
 * scenarios that could lead to stale props and zombie children issues.
 *
 * Based on React-Redux documentation:
 * https://react-redux.js.org/api/hooks#stale-props-and-zombie-children
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FieldStore } from "./store";

interface TestState {
  todos: Record<string, { id: string; text: string; userId: string }>;
  users: Record<string, { id: string; name: string }>;
  selectedUserId: string;
}

describe("Subscription Safety", () => {
  let store: FieldStore<TestState>;
  let subscriptions: Array<{ unsubscribe: () => void }>;

  beforeEach(() => {
    store = new FieldStore<TestState>({
      todos: {
        "1": { id: "1", text: "Todo 1", userId: "1" },
        "2": { id: "2", text: "Todo 2", userId: "1" },
        "3": { id: "3", text: "Todo 3", userId: "2" },
      },
      users: {
        "1": { id: "1", name: "User 1" },
        "2": { id: "2", name: "User 2" },
      },
      selectedUserId: "1",
    });

    subscriptions = [];
  });

  afterEach(() => {
    // Clean up all subscriptions
    subscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
      } catch (e) {
        /* ignore */
      }
    });
    subscriptions = [];
    vi.restoreAllMocks();
  });

  describe("Observable Subscription Safety", () => {
    it("should handle prop-dependent observations correctly", () => {
      let notificationCount = 0;
      let lastResults: any[] = [];

      // Simulate a prop-dependent subscription (like useField with props)
      const createPropDependentObserver = (userId: string) => {
        return store.observable("todos").subscribe((todos) => {
          notificationCount++;
          const userTodos = Object.values(todos).filter(
            (todo) => todo.userId === userId
          );
          lastResults.push({ userId, userTodos, timestamp: Date.now() });
        });
      };

      // Start with userId '1'
      const subscription1 = createPropDependentObserver("1");
      subscriptions.push(subscription1);

      expect(notificationCount).toBe(1);
      expect(lastResults[0].userTodos).toHaveLength(2);

      // Update todos
      store.set({
        todos: {
          ...store.get("todos"),
          "4": { id: "4", text: "New Todo", userId: "1" },
        },
      });

      expect(notificationCount).toBe(2);
      expect(lastResults[1].userTodos).toHaveLength(3);

      // Simulate prop change by unsubscribing old and subscribing with new userId
      subscription1.unsubscribe();
      const subscription2 = createPropDependentObserver("2");
      subscriptions.push(subscription2);

      expect(notificationCount).toBe(3);
      expect(lastResults[2].userId).toBe("2");
      expect(lastResults[2].userTodos).toHaveLength(1);

      // No errors should occur during prop-like changes
      expect(true).toBe(true); // Test passes if no exceptions thrown
    });

    it("should handle data deletion gracefully", () => {
      let observationResults: any[] = [];
      let errorCount = 0;

      // Defensive observer that handles missing data
      const subscription = store.observable("todos").subscribe((todos) => {
        try {
          const todo1 = todos["1"];
          if (!todo1) {
            observationResults.push({ error: "Todo not found", id: "1" });
          } else {
            observationResults.push({ todo: todo1, error: null, id: "1" });
          }
        } catch (error) {
          errorCount++;
          observationResults.push({ error: "Observer error", id: "1" });
        }
      });
      subscriptions.push(subscription);

      // Initial state should be valid
      expect(observationResults[0].error).toBeNull();
      expect(observationResults[0].todo.text).toBe("Todo 1");

      // Delete the todo
      const todosWithoutOne = { ...store.get("todos") };
      delete todosWithoutOne["1"];
      store.set({ todos: todosWithoutOne });

      // Should handle missing data gracefully
      expect(observationResults[1].error).toBe("Todo not found");
      expect(errorCount).toBe(0);
    });

    it("should handle rapid subscription/unsubscription cycles", () => {
      let totalSubscriptions = 0;
      let totalUnsubscriptions = 0;
      let activeSubscriptions = 0;

      // Simulate rapid subscribe/unsubscribe (like component mount/unmount)
      for (let i = 0; i < 20; i++) {
        const subscription = store.observable("todos").subscribe(() => {
          totalSubscriptions++;
          activeSubscriptions++;
        });

        // Immediately unsubscribe half of them
        if (i % 2 === 0) {
          subscription.unsubscribe();
          totalUnsubscriptions++;
          activeSubscriptions--;
        } else {
          subscriptions.push(subscription);
        }
      }

      // Update store to trigger remaining subscriptions
      store.set({
        todos: {
          ...store.get("todos"),
          rapid: { id: "rapid", text: "Rapid Test", userId: "1" },
        },
      });

      expect(totalSubscriptions).toBeGreaterThan(10);
      expect(totalUnsubscriptions).toBeGreaterThan(5);
      expect(activeSubscriptions).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Multi-Field Subscription Safety", () => {
    it("should handle dependent field observations consistently", () => {
      let combinedResults: any[] = [];

      // Simulate useFields behavior - subscribe to multiple fields
      const todosSubscription = store.observable("todos").subscribe((todos) => {
        const users = store.get("users");
        const selectedUserId = store.get("selectedUserId");

        const selectedUser = users[selectedUserId];
        const selectedUserTodos = Object.values(todos).filter(
          (todo) => todo.userId === selectedUserId
        );

        combinedResults.push({
          selectedUserId,
          selectedUser,
          selectedUserTodos,
          timestamp: Date.now(),
        });
      });
      subscriptions.push(todosSubscription);

      const usersSubscription = store.observable("users").subscribe(() => {
        // This would normally trigger a re-computation in useFields
        const todos = store.get("todos");
        const selectedUserId = store.get("selectedUserId");
        const users = store.get("users");

        const selectedUser = users[selectedUserId];
        const selectedUserTodos = Object.values(todos).filter(
          (todo) => todo.userId === selectedUserId
        );

        combinedResults.push({
          selectedUserId,
          selectedUser,
          selectedUserTodos,
          timestamp: Date.now(),
        });
      });
      subscriptions.push(usersSubscription);

      // Initial state
      expect(combinedResults).toHaveLength(2); // One from each subscription

      // Update both fields simultaneously
      store.set({
        todos: {
          ...store.get("todos"),
          "5": { id: "5", text: "New Todo", userId: "1" },
        },
        users: {
          ...store.get("users"),
          "1": { id: "1", name: "Updated User 1" },
        },
      });

      // Both subscriptions should have fired
      expect(combinedResults.length).toBeGreaterThan(2);

      // Final state should be consistent across subscriptions
      const latestResults = combinedResults.slice(-2);
      
      // At least one result should have the updated user name
      const hasUpdatedUser = latestResults.some(result => result.selectedUser.name === "Updated User 1");
      expect(hasUpdatedUser).toBe(true);
      
      // At least one result should have the new todo
      const hasNewTodo = latestResults.some(result => 
        result.selectedUserTodos.some((todo: any) => todo.id === "5")
      );
      expect(hasNewTodo).toBe(true);
    });

    it("should handle subscription ordering correctly", () => {
      let subscriptionOrder: Array<{ subscriber: string; timestamp: number }> =
        [];

      // Create multiple subscribers to same field
      const sub1 = store.observable("selectedUserId").subscribe(() => {
        subscriptionOrder.push({
          subscriber: "sub1",
          timestamp: performance.now(),
        });
      });

      const sub2 = store.observable("selectedUserId").subscribe(() => {
        subscriptionOrder.push({
          subscriber: "sub2",
          timestamp: performance.now(),
        });
      });

      const sub3 = store.observable("selectedUserId").subscribe(() => {
        subscriptionOrder.push({
          subscriber: "sub3",
          timestamp: performance.now(),
        });
      });

      subscriptions.push(sub1, sub2, sub3);

      // Clear initial notifications
      subscriptionOrder = [];

      // Trigger update
      store.set({ selectedUserId: "2" });

      // All subscribers should be notified
      expect(subscriptionOrder).toHaveLength(3);

      // All should have received the same logical update
      const timestamps = subscriptionOrder.map((s) => s.timestamp);
      const timeSpread = Math.max(...timestamps) - Math.min(...timestamps);

      // Should be notified quickly (within 10ms)
      expect(timeSpread).toBeLessThan(10);
    });
  });

  describe("Error Recovery and Resilience", () => {
    it("should isolate subscription errors", () => {
      let healthyNotifications = 0;
      let errorNotifications = 0;

      // Healthy subscriber
      const healthySub = store.observable("todos").subscribe(() => {
        healthyNotifications++;
      });

      // Error-prone subscriber
      const errorSub = store.observable("todos").subscribe(() => {
        errorNotifications++;
        if (errorNotifications === 2) {
          throw new Error("Intentional subscriber error");
        }
      });

      subscriptions.push(healthySub, errorSub);

      // Update store multiple times
      store.set({
        todos: {
          ...store.get("todos"),
          test1: { id: "test1", text: "Test 1", userId: "1" },
        },
      });

      store.set({
        todos: {
          ...store.get("todos"),
          test2: { id: "test2", text: "Test 2", userId: "1" },
        },
      });

      store.set({
        todos: {
          ...store.get("todos"),
          test3: { id: "test3", text: "Test 3", userId: "1" },
        },
      });

      // Healthy subscriber should continue working despite error in other subscriber
      expect(healthyNotifications).toBeGreaterThan(2);
      expect(errorNotifications).toBeGreaterThan(1);
    });

    it("should handle concurrent updates correctly", async () => {
      let updateResults: Array<{
        updateId: number;
        todoCount: number;
        timestamp: number;
      }> = [];

      const subscription = store.observable("todos").subscribe((todos) => {
        updateResults.push({
          updateId: Object.keys(todos).length,
          todoCount: Object.keys(todos).length,
          timestamp: performance.now(),
        });
      });
      subscriptions.push(subscription);

      // Clear initial result
      updateResults = [];

      // Trigger concurrent updates
      const updatePromises = Array.from({ length: 10 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            store.set({
              todos: {
                ...store.get("todos"),
                [`concurrent${i}`]: {
                  id: `concurrent${i}`,
                  text: `Concurrent ${i}`,
                  userId: "1",
                },
              },
            });
            resolve();
          }, Math.random() * 20);
        });
      });

      await Promise.all(updatePromises);

      // Should have received multiple updates
      expect(updateResults.length).toBeGreaterThan(5);

      // Final state should have all concurrent updates
      const finalTodoCount = Object.keys(store.get("todos")).length;
      expect(finalTodoCount).toBe(13); // 3 initial + 10 concurrent
    });

    it("should maintain subscription integrity under stress", () => {
      let subscriptionEvents: Array<{ type: string; timestamp: number }> = [];

      // Create and destroy subscriptions rapidly while updating store
      const stressTest = () => {
        for (let i = 0; i < 50; i++) {
          const subscription = store.observable("todos").subscribe(() => {
            subscriptionEvents.push({
              type: "notification",
              timestamp: performance.now(),
            });
          });

          // Update store
          store.set({
            todos: {
              ...store.get("todos"),
              [`stress${i}`]: {
                id: `stress${i}`,
                text: `Stress ${i}`,
                userId: "1",
              },
            },
          });

          // Sometimes keep subscription, sometimes clean up immediately
          if (i % 3 === 0) {
            subscription.unsubscribe();
            subscriptionEvents.push({
              type: "unsubscribe",
              timestamp: performance.now(),
            });
          } else {
            subscriptions.push(subscription);
          }
        }
      };

      stressTest();

      // Should have handled stress without errors
      expect(
        subscriptionEvents.filter((e) => e.type === "notification").length
      ).toBeGreaterThan(30);
      expect(
        subscriptionEvents.filter((e) => e.type === "unsubscribe").length
      ).toBeGreaterThan(10);

      // Final store state should be consistent
      const finalTodos = store.get("todos");
      expect(Object.keys(finalTodos).length).toBeGreaterThan(50);
    });
  });

  describe("Memory and Performance Safety", () => {
    it("should not leak memory on rapid subscription cycles", () => {
      let createdSubscriptions = 0;
      let destroyedSubscriptions = 0;

      // Simulate component mount/unmount cycles
      for (let cycle = 0; cycle < 100; cycle++) {
        const subscription = store.observable("todos").subscribe(() => {
          createdSubscriptions++;
        });

        // Immediately unsubscribe (simulating component unmount)
        subscription.unsubscribe();
        destroyedSubscriptions++;
      }

      expect(createdSubscriptions).toBe(100);
      expect(destroyedSubscriptions).toBe(100);

      // Update store to verify no leaked subscriptions
      const beforeUpdate = Date.now();
      store.set({
        todos: {
          ...store.get("todos"),
          "leak-test": { id: "leak-test", text: "Leak Test", userId: "1" },
        },
      });
      const afterUpdate = Date.now();

      // Update should be fast (no leaked subscriptions to notify)
      expect(afterUpdate - beforeUpdate).toBeLessThan(10);
    });

    it("should maintain performance with many concurrent subscriptions", () => {
      let totalNotifications = 0;
      const startTime = performance.now();

      // Create many subscriptions
      for (let i = 0; i < 50; i++) {
        const subscription = store.observable("todos").subscribe(() => {
          totalNotifications++;
        });
        subscriptions.push(subscription);
      }

      // Single update should notify all subscriptions quickly
      const updateStart = performance.now();
      store.set({
        todos: {
          ...store.get("todos"),
          "perf-test": {
            id: "perf-test",
            text: "Performance Test",
            userId: "1",
          },
        },
      });
      const updateEnd = performance.now();

      expect(totalNotifications).toBe(100); // 50 initial + 50 from update
      expect(updateEnd - updateStart).toBeLessThan(50); // Should be fast
    });
  });
});
