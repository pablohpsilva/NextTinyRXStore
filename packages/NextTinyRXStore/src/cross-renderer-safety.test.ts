/**
 * Cross-Renderer Safety Tests
 *
 * Tests based on React GitHub issue #13332:
 * https://github.com/facebook/react/issues/13332
 *
 * Verifies that NextTinyRXStore works correctly across different React renderers
 * and doesn't suffer from the portal limitations that affect React's built-in
 * cross-renderer communication.
 *
 * NextTinyRXStore should provide seamless state sharing between:
 * - react-dom and react-native
 * - react-dom and react-art
 * - react-dom and custom renderers
 * - Any combination of React renderers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FieldStore } from "./store";

interface AppState {
  sharedCounter: number;
  domSpecificData: Record<string, any>;
  artSpecificData: Record<string, any>;
  nativeSpecificData: Record<string, any>;
  crossRendererMessages: Array<{
    id: string;
    source: string;
    target: string;
    payload: any;
    timestamp: number;
  }>;
}

describe("Cross-Renderer Safety", () => {
  let globalStore: FieldStore<AppState>;
  let subscriptions: Array<{ unsubscribe: () => void }>;
  let mockRendererContexts: Map<string, any>;

  beforeEach(() => {
    // Initialize a global store that can be shared across renderers
    globalStore = new FieldStore<AppState>({
      sharedCounter: 0,
      domSpecificData: {
        windowSize: { width: 1920, height: 1080 },
        theme: "light",
        route: "/home",
      },
      artSpecificData: {
        canvasSize: { width: 800, height: 600 },
        shapes: [],
        activeLayer: "background",
      },
      nativeSpecificData: {
        deviceInfo: { platform: "ios", version: "16.0" },
        permissions: { camera: true, location: false },
        orientation: "portrait",
      },
      crossRendererMessages: [],
    });

    subscriptions = [];
    mockRendererContexts = new Map();

    // Mock different renderer contexts
    mockRendererContexts.set("react-dom", {
      rendererName: "react-dom",
      capabilities: ["dom", "events", "css"],
      version: "18.3.1",
    });

    mockRendererContexts.set("react-art", {
      rendererName: "react-art",
      capabilities: ["canvas", "svg", "shapes"],
      version: "18.3.1",
    });

    mockRendererContexts.set("react-native", {
      rendererName: "react-native",
      capabilities: ["native", "gestures", "animations"],
      version: "0.72.0",
    });
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

  describe("Renderer-Agnostic State Sharing", () => {
    it("should allow shared state access across multiple mock renderers", () => {
      let domUpdates: any[] = [];
      let artUpdates: any[] = [];
      let nativeUpdates: any[] = [];

      // Simulate components from different renderers subscribing to shared state

      // React DOM component
      const domSubscription = globalStore
        .observable("sharedCounter")
        .subscribe((counter) => {
          domUpdates.push({
            renderer: "react-dom",
            value: counter,
            timestamp: Date.now(),
            context: mockRendererContexts.get("react-dom"),
          });
        });

      // React ART component
      const artSubscription = globalStore
        .observable("sharedCounter")
        .subscribe((counter) => {
          artUpdates.push({
            renderer: "react-art",
            value: counter,
            timestamp: Date.now(),
            context: mockRendererContexts.get("react-art"),
          });
        });

      // React Native component
      const nativeSubscription = globalStore
        .observable("sharedCounter")
        .subscribe((counter) => {
          nativeUpdates.push({
            renderer: "react-native",
            value: counter,
            timestamp: Date.now(),
            context: mockRendererContexts.get("react-native"),
          });
        });

      subscriptions.push(domSubscription, artSubscription, nativeSubscription);

      // All renderers should receive initial value
      expect(domUpdates).toHaveLength(1);
      expect(artUpdates).toHaveLength(1);
      expect(nativeUpdates).toHaveLength(1);

      // All should have the same value
      expect(domUpdates[0].value).toBe(0);
      expect(artUpdates[0].value).toBe(0);
      expect(nativeUpdates[0].value).toBe(0);

      // Update shared state from one renderer
      globalStore.set({ sharedCounter: 42 });

      // All renderers should receive the update
      expect(domUpdates).toHaveLength(2);
      expect(artUpdates).toHaveLength(2);
      expect(nativeUpdates).toHaveLength(2);

      // All should have the updated value
      expect(domUpdates[1].value).toBe(42);
      expect(artUpdates[1].value).toBe(42);
      expect(nativeUpdates[1].value).toBe(42);
    });

    it("should handle renderer-specific data isolation", () => {
      let domSpecificUpdates: any[] = [];
      let artSpecificUpdates: any[] = [];

      // Each renderer can have its own specific data that doesn't interfere
      const domSubscription = globalStore
        .observable("domSpecificData")
        .subscribe((data) => {
          domSpecificUpdates.push({
            renderer: "react-dom",
            data,
            timestamp: Date.now(),
          });
        });

      const artSubscription = globalStore
        .observable("artSpecificData")
        .subscribe((data) => {
          artSpecificUpdates.push({
            renderer: "react-art",
            data,
            timestamp: Date.now(),
          });
        });

      subscriptions.push(domSubscription, artSubscription);

      // Update DOM-specific data
      globalStore.set({
        domSpecificData: {
          ...globalStore.get("domSpecificData"),
          theme: "dark",
          route: "/settings",
        },
      });

      // Only DOM subscription should be affected
      expect(domSpecificUpdates).toHaveLength(2);
      expect(artSpecificUpdates).toHaveLength(1); // Only initial

      // Update ART-specific data
      globalStore.set({
        artSpecificData: {
          ...globalStore.get("artSpecificData"),
          shapes: [{ type: "circle", x: 100, y: 100, radius: 50 }],
          activeLayer: "foreground",
        },
      });

      // Only ART subscription should be affected
      expect(domSpecificUpdates).toHaveLength(2); // No change
      expect(artSpecificUpdates).toHaveLength(2); // New update

      // Verify data isolation
      expect(domSpecificUpdates[1].data.theme).toBe("dark");
      expect(artSpecificUpdates[1].data.shapes).toHaveLength(1);
    });

    it("should enable cross-renderer communication through shared state", () => {
      let messageLog: any[] = [];

      // Subscribe to cross-renderer messages
      const messageSubscription = globalStore
        .observable("crossRendererMessages")
        .subscribe((messages) => {
          if (messages.length > messageLog.length) {
            // New message added
            const newMessage = messages[messages.length - 1];
            messageLog.push({
              ...newMessage,
              receivedAt: Date.now(),
            });
          }
        });

      subscriptions.push(messageSubscription);

      // Simulate React DOM sending a message to React ART
      const sendMessage = (source: string, target: string, payload: any) => {
        const message = {
          id: `${Date.now()}-${Math.random()}`,
          source,
          target,
          payload,
          timestamp: Date.now(),
        };

        globalStore.set({
          crossRendererMessages: [
            ...globalStore.get("crossRendererMessages"),
            message,
          ],
        });
      };

      // DOM renderer sends a message to ART renderer
      sendMessage("react-dom", "react-art", {
        action: "DRAW_SHAPE",
        data: { type: "rectangle", x: 50, y: 50, width: 100, height: 75 },
      });

      expect(messageLog).toHaveLength(1);
      expect(messageLog[0].source).toBe("react-dom");
      expect(messageLog[0].target).toBe("react-art");
      expect(messageLog[0].payload.action).toBe("DRAW_SHAPE");

      // ART renderer responds back to DOM renderer
      sendMessage("react-art", "react-dom", {
        action: "SHAPE_DRAWN",
        data: { success: true, shapeId: "rect-001" },
      });

      expect(messageLog).toHaveLength(2);
      expect(messageLog[1].source).toBe("react-art");
      expect(messageLog[1].target).toBe("react-dom");
      expect(messageLog[1].payload.action).toBe("SHAPE_DRAWN");
    });
  });

  describe("Concurrent Renderer Updates", () => {
    it("should handle simultaneous updates from multiple renderers", async () => {
      let updateSequence: Array<{
        renderer: string;
        field: string;
        timestamp: number;
      }> = [];

      // Multiple renderers subscribing to shared state
      const trackedFields = [
        "sharedCounter",
        "domSpecificData",
        "artSpecificData",
      ];

      trackedFields.forEach((field) => {
        ["react-dom", "react-art", "react-native"].forEach((renderer) => {
          const subscription = globalStore
            .observable(field as keyof AppState)
            .subscribe(() => {
              updateSequence.push({
                renderer,
                field,
                timestamp: performance.now(),
              });
            });
          subscriptions.push(subscription);
        });
      });

      // Clear initial notifications
      updateSequence = [];

      // Simulate concurrent updates from different renderers
      const concurrentUpdates = [
        // DOM renderer updates
        () =>
          globalStore.set({
            domSpecificData: {
              ...globalStore.get("domSpecificData"),
              theme: "dark",
            },
          }),

        // ART renderer updates
        () =>
          globalStore.set({
            artSpecificData: {
              ...globalStore.get("artSpecificData"),
              activeLayer: "overlay",
            },
          }),

        // Shared update (could come from any renderer)
        () =>
          globalStore.set({
            sharedCounter: globalStore.get("sharedCounter") + 1,
          }),
      ];

      // Execute updates concurrently
      await Promise.all(
        concurrentUpdates.map(
          (update) =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                update();
                resolve();
              }, Math.random() * 10);
            })
        )
      );

      // All renderers should have received appropriate updates
      expect(updateSequence.length).toBeGreaterThan(6); // At least 3 updates × 3 renderers for relevant fields

      // Verify each renderer received updates for fields they care about
      const domUpdates = updateSequence.filter(
        (u) => u.renderer === "react-dom"
      );
      const artUpdates = updateSequence.filter(
        (u) => u.renderer === "react-art"
      );
      const nativeUpdates = updateSequence.filter(
        (u) => u.renderer === "react-native"
      );

      // All renderers should have received shared counter updates
      expect(domUpdates.some((u) => u.field === "sharedCounter")).toBe(true);
      expect(artUpdates.some((u) => u.field === "sharedCounter")).toBe(true);
      expect(nativeUpdates.some((u) => u.field === "sharedCounter")).toBe(true);

      // Renderers should receive their specific field updates
      expect(domUpdates.some((u) => u.field === "domSpecificData")).toBe(true);
      expect(artUpdates.some((u) => u.field === "artSpecificData")).toBe(true);
    });

    it("should maintain state consistency across renderer boundaries", () => {
      let domView: any = null;
      let artView: any = null;
      let nativeView: any = null;

      // Each renderer maintains its view of the shared state using direct subscriptions
      const createRendererView = (rendererName: string, fields: string[]) => {
        const updateView = () => {
          if (fields.includes("domSpecificData")) {
            return {
              counter: globalStore.get("sharedCounter"),
              domData: globalStore.get("domSpecificData"),
              renderer: rendererName,
            };
          } else if (fields.includes("artSpecificData")) {
            return {
              counter: globalStore.get("sharedCounter"),
              artData: globalStore.get("artSpecificData"),
              renderer: rendererName,
            };
          } else {
            return {
              counter: globalStore.get("sharedCounter"),
              nativeData: globalStore.get("nativeSpecificData"),
              renderer: rendererName,
            };
          }
        };

        const subscription = globalStore
          .observable("sharedCounter")
          .subscribe(() => {
            // Update views when shared counter changes
            if (rendererName === "react-dom") domView = updateView();
            else if (rendererName === "react-art") artView = updateView();
            else nativeView = updateView();
          });

        subscriptions.push(subscription);
        return updateView();
      };

      // Initialize views
      domView = createRendererView("react-dom", [
        "sharedCounter",
        "domSpecificData",
      ]);
      artView = createRendererView("react-art", [
        "sharedCounter",
        "artSpecificData",
      ]);
      nativeView = createRendererView("react-native", [
        "sharedCounter",
        "nativeSpecificData",
      ]);

      // All renderers should see the same shared counter
      expect(domView.counter).toBe(0);
      expect(artView.counter).toBe(0);
      expect(nativeView.counter).toBe(0);

      // Update shared counter
      globalStore.set({ sharedCounter: 100 });

      // Views should automatically update through subscriptions
      expect(domView.counter).toBe(100);
      expect(artView.counter).toBe(100);
      expect(nativeView.counter).toBe(100);

      // Each renderer should maintain its own specific data
      expect(domView.domData.theme).toBeDefined();
      expect(artView.artData.canvasSize).toBeDefined();
      expect(nativeView.nativeData.deviceInfo).toBeDefined();
    });
  });

  describe("Renderer Lifecycle Independence", () => {
    it("should handle renderer mounting and unmounting independently", () => {
      let activeRenderers = new Set<string>();
      let rendererStates = new Map<string, any>();

      const simulateRendererMount = (rendererName: string) => {
        activeRenderers.add(rendererName);

        // Each renderer subscribes to relevant state
        const subscription = globalStore
          .observable("sharedCounter")
          .subscribe((counter) => {
            rendererStates.set(rendererName, {
              counter,
              mountedAt: Date.now(),
              isActive: true,
            });
          });

        return subscription;
      };

      const simulateRendererUnmount = (
        rendererName: string,
        subscription: any
      ) => {
        activeRenderers.delete(rendererName);
        rendererStates.set(rendererName, {
          ...rendererStates.get(rendererName),
          isActive: false,
          unmountedAt: Date.now(),
        });
        subscription.unsubscribe();
      };

      // Mount renderers sequentially
      const domSub = simulateRendererMount("react-dom");
      expect(activeRenderers.has("react-dom")).toBe(true);
      expect(rendererStates.get("react-dom")?.counter).toBe(0);

      const artSub = simulateRendererMount("react-art");
      expect(activeRenderers.has("react-art")).toBe(true);
      expect(rendererStates.get("react-art")?.counter).toBe(0);

      // Update shared state
      globalStore.set({ sharedCounter: 25 });

      // Both active renderers should receive update
      expect(rendererStates.get("react-dom")?.counter).toBe(25);
      expect(rendererStates.get("react-art")?.counter).toBe(25);

      // Unmount one renderer
      simulateRendererUnmount("react-dom", domSub);
      expect(activeRenderers.has("react-dom")).toBe(false);
      expect(rendererStates.get("react-dom")?.isActive).toBe(false);

      // Update state again
      globalStore.set({ sharedCounter: 50 });

      // Only active renderer should receive update
      expect(rendererStates.get("react-dom")?.counter).toBe(25); // Unchanged after unmount
      expect(rendererStates.get("react-art")?.counter).toBe(50); // Updated

      // Mount new renderer
      const nativeSub = simulateRendererMount("react-native");
      expect(rendererStates.get("react-native")?.counter).toBe(50); // Gets current state

      // Clean up
      simulateRendererUnmount("react-art", artSub);
      simulateRendererUnmount("react-native", nativeSub);
    });

    it("should handle renderer errors without affecting other renderers", () => {
      let rendererErrors = new Map<string, any[]>();
      let rendererUpdates = new Map<string, number>();

      const createRendererSubscription = (
        rendererName: string,
        shouldError: boolean = false
      ) => {
        rendererErrors.set(rendererName, []);
        rendererUpdates.set(rendererName, 0);

        return globalStore.observable("sharedCounter").subscribe((counter) => {
          try {
            if (shouldError && counter > 10) {
              throw new Error(`Intentional error in ${rendererName}`);
            }

            rendererUpdates.set(rendererName, counter);
          } catch (error) {
            rendererErrors.get(rendererName)?.push(error);
            console.debug(
              `Renderer error caught in ${rendererName}:`,
              error.message
            );
          }
        });
      };

      // Create subscriptions for multiple renderers
      const domSub = createRendererSubscription("react-dom", false);
      const artSub = createRendererSubscription("react-art", true); // This one will error
      const nativeSub = createRendererSubscription("react-native", false);

      subscriptions.push(domSub, artSub, nativeSub);

      // Initial state - all should work
      expect(rendererUpdates.get("react-dom")).toBe(0);
      expect(rendererUpdates.get("react-art")).toBe(0);
      expect(rendererUpdates.get("react-native")).toBe(0);
      expect(rendererErrors.get("react-art")).toHaveLength(0);

      // Update to a value that will cause art renderer to error
      globalStore.set({ sharedCounter: 15 });

      // DOM and Native should update successfully
      expect(rendererUpdates.get("react-dom")).toBe(15);
      expect(rendererUpdates.get("react-native")).toBe(15);

      // ART should have errored and not updated its state
      expect(rendererUpdates.get("react-art")).toBe(0); // Still initial value
      expect(rendererErrors.get("react-art")).toHaveLength(1);

      // Continue with more updates
      globalStore.set({ sharedCounter: 20 });

      // Healthy renderers should continue working
      expect(rendererUpdates.get("react-dom")).toBe(20);
      expect(rendererUpdates.get("react-native")).toBe(20);

      // Erroring renderer should have more errors but not affect others
      expect(rendererErrors.get("react-art")).toHaveLength(2);
    });
  });

  describe("Context and Provider Independence", () => {
    it("should work without React Context Provider requirements", () => {
      // NextTinyRXStore doesn't require React Context Providers
      // This test verifies it works in isolated renderer environments

      let isolatedRendererUpdates: any[] = [];

      // Simulate a renderer that can't access React Context from other renderers
      const isolatedRendererComponent = () => {
        // Direct store access without any Provider
        const sharedState = globalStore.get("sharedCounter");
        const subscription = globalStore
          .observable("sharedCounter")
          .subscribe((counter) => {
            isolatedRendererUpdates.push({
              component: "IsolatedRenderer",
              value: counter,
              hasContext: false, // No React Context available
              timestamp: Date.now(),
            });
          });

        return { sharedState, cleanup: () => subscription.unsubscribe() };
      };

      const component = isolatedRendererComponent();

      // Should work immediately without any Provider setup
      expect(component.sharedState).toBe(0);
      expect(isolatedRendererUpdates).toHaveLength(1);

      // Should receive updates
      globalStore.set({ sharedCounter: 77 });
      expect(isolatedRendererUpdates).toHaveLength(2);
      expect(isolatedRendererUpdates[1].value).toBe(77);

      // Clean up
      component.cleanup();
    });

    it("should enable seamless data flow between renderer types", () => {
      let dataFlowLog: Array<{
        from: string;
        to: string;
        data: any;
        timestamp: number;
      }> = [];

      // Simulate complex cross-renderer data flow
      const setupDataFlow = () => {
        // DOM renderer produces data
        const domProducer = () => {
          const data = {
            userInteraction: "button-click",
            coordinates: { x: 150, y: 200 },
            timestamp: Date.now(),
          };

          globalStore.set({
            domSpecificData: {
              ...globalStore.get("domSpecificData"),
              lastInteraction: data,
            },
          });

          dataFlowLog.push({
            from: "react-dom",
            to: "store",
            data,
            timestamp: Date.now(),
          });
        };

        // ART renderer consumes DOM data and produces graphics
        const artConsumer = globalStore
          .observable("domSpecificData")
          .subscribe((domData) => {
            if (domData.lastInteraction) {
              const artwork = {
                shape: "circle",
                position: domData.lastInteraction.coordinates,
                color: "#3498db",
                createdAt: Date.now(),
              };

              globalStore.set({
                artSpecificData: {
                  ...globalStore.get("artSpecificData"),
                  generatedArtwork: artwork,
                },
              });

              dataFlowLog.push({
                from: "react-art",
                to: "store",
                data: artwork,
                timestamp: Date.now(),
              });
            }
          });

        // Native renderer displays combined state using direct access
        const nativeDisplay = {
          get hasInteraction() {
            return !!globalStore.get("domSpecificData").lastInteraction;
          },
          get hasArtwork() {
            return !!globalStore.get("artSpecificData").generatedArtwork;
          },
          get combined() {
            return {
              interaction: globalStore.get("domSpecificData").lastInteraction,
              artwork: globalStore.get("artSpecificData").generatedArtwork,
            };
          },
        };

        return { domProducer, artConsumer, nativeDisplay };
      };

      const { domProducer, artConsumer, nativeDisplay } = setupDataFlow();
      subscriptions.push(artConsumer);

      // Trigger the data flow
      domProducer();

      // Wait for async updates
      setTimeout(() => {
        // Should have data flowing through all renderers
        expect(dataFlowLog.length).toBeGreaterThan(1);

        const domToStore = dataFlowLog.find((log) => log.from === "react-dom");
        const artToStore = dataFlowLog.find((log) => log.from === "react-art");

        expect(domToStore).toBeDefined();
        expect(artToStore).toBeDefined();

        // Native renderer should see combined state
        expect(nativeDisplay.hasInteraction).toBe(true);
        expect(nativeDisplay.hasArtwork).toBe(true);
        expect(nativeDisplay.combined.interaction).toBeDefined();
        expect(nativeDisplay.combined.artwork).toBeDefined();
      }, 100);
    });
  });

  describe("Performance Across Renderer Boundaries", () => {
    it("should maintain performance with multiple active renderers", () => {
      const performanceMetrics = {
        subscriptionTime: [] as number[],
        updateTime: [] as number[],
        memoryUsage: [] as number[],
      };

      // Create multiple renderers with multiple subscriptions each
      const rendererCount = 5;
      const subscriptionsPerRenderer = 3;

      for (let r = 0; r < rendererCount; r++) {
        const rendererName = `mock-renderer-${r}`;

        for (let s = 0; s < subscriptionsPerRenderer; s++) {
          const startTime = performance.now();

          const subscription = globalStore
            .observable("sharedCounter")
            .subscribe((counter) => {
              // Simulate some work in each renderer
              const workStartTime = performance.now();

              // Minimal processing to simulate component update
              const processedValue = counter * 2 + r + s;

              const workEndTime = performance.now();
              performanceMetrics.updateTime.push(workEndTime - workStartTime);
            });

          const endTime = performance.now();
          performanceMetrics.subscriptionTime.push(endTime - startTime);

          subscriptions.push(subscription);
        }
      }

      // Measure update performance
      const updateStartTime = performance.now();
      globalStore.set({ sharedCounter: 123 });
      const updateEndTime = performance.now();

      const totalUpdateTime = updateEndTime - updateStartTime;
      const averageSubscriptionTime =
        performanceMetrics.subscriptionTime.reduce((a, b) => a + b, 0) /
        performanceMetrics.subscriptionTime.length;
      const averageUpdateTime =
        performanceMetrics.updateTime.reduce((a, b) => a + b, 0) /
        performanceMetrics.updateTime.length;

      // Performance should be reasonable even with many renderers
      expect(totalUpdateTime).toBeLessThan(50); // Total update < 50ms
      expect(averageSubscriptionTime).toBeLessThan(5); // Avg subscription < 5ms
      expect(averageUpdateTime).toBeLessThan(1); // Avg update processing < 1ms

      // All subscriptions should have been triggered (initial + update)
      expect(performanceMetrics.updateTime.length).toBe(
        rendererCount * subscriptionsPerRenderer * 2
      );
    });

    it("should handle high-frequency updates across renderers efficiently", async () => {
      let updateCounts = new Map<string, number>();
      const renderers = ["react-dom", "react-art", "react-native"];

      // Setup subscriptions for each renderer
      renderers.forEach((renderer) => {
        updateCounts.set(renderer, 0);

        const subscription = globalStore
          .observable("sharedCounter")
          .subscribe(() => {
            updateCounts.set(renderer, updateCounts.get(renderer)! + 1);
          });

        subscriptions.push(subscription);
      });

      // Generate high-frequency updates
      const updateCount = 100;
      const startTime = performance.now();

      for (let i = 0; i < updateCount; i++) {
        globalStore.set({ sharedCounter: i });

        // Small delay to prevent overwhelming the system
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // All renderers should have received all updates (initial + updates)
      renderers.forEach((renderer) => {
        expect(updateCounts.get(renderer)).toBe(updateCount); // updateCount updates (starts at 1 from initial)
      });

      // Should handle high frequency efficiently
      expect(totalTime).toBeLessThan(500); // Complete in < 500ms

      const updatesPerSecond =
        (updateCount * renderers.length) / (totalTime / 1000);
      expect(updatesPerSecond).toBeGreaterThan(1000); // > 1000 updates/sec across all renderers
    });
  });
});
