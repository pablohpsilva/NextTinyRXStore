/**
 * React Native Compatibility Tests
 *
 * Tests verifying that NextTinyRXStore works seamlessly with React Native,
 * including all the unique challenges and requirements of mobile development:
 *
 * - Background/foreground state changes
 * - Memory constraints and optimization
 * - Navigation and deep linking
 * - Device orientation changes
 * - Network connectivity changes
 * - AsyncStorage integration
 * - Performance on mobile devices
 * - Platform-specific state (iOS/Android)
 * - Gesture and touch event handling
 * - Native module integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FieldStore } from "./store";

interface ReactNativeAppState {
  // App lifecycle
  appState: "active" | "background" | "inactive";

  // Device info
  device: {
    platform: "ios" | "android";
    version: string;
    orientation: "portrait" | "landscape";
    screenDimensions: { width: number; height: number };
    safeAreaInsets: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };

  // Navigation
  navigation: {
    currentRoute: string;
    routeParams: Record<string, any>;
    navigationHistory: string[];
    canGoBack: boolean;
  };

  // Network
  network: {
    isConnected: boolean;
    connectionType: "wifi" | "cellular" | "none" | "unknown";
    isExpensive: boolean;
  };

  // User data
  user: {
    id: string;
    profile: any;
    preferences: {
      theme: "light" | "dark" | "system";
      notifications: boolean;
      language: string;
    };
  };

  // UI state
  ui: {
    loading: boolean;
    modal: { visible: boolean; type: string | null; data: any };
    toast: {
      visible: boolean;
      message: string;
      type: "success" | "error" | "info";
    };
    keyboard: { visible: boolean; height: number };
  };

  // Cache and persistence
  cache: {
    images: Record<string, { uri: string; cached: boolean; size: number }>;
    api: Record<string, { data: any; timestamp: number; ttl: number }>;
  };

  // Performance metrics
  performance: {
    renderTime: number;
    memoryUsage: number;
    frameDrops: number;
    jsHeapSize: number;
  };
}

describe("React Native Compatibility", () => {
  let mobileStore: FieldStore<ReactNativeAppState>;
  let subscriptions: Array<{ unsubscribe: () => void }>;
  let mockAsyncStorage: Map<string, string>;

  beforeEach(() => {
    // Mock React Native environment
    global.navigator = {
      ...global.navigator,
      userAgent: "ReactNative/0.72.0",
    } as any;

    // Mock AsyncStorage
    mockAsyncStorage = new Map();
    global.AsyncStorage = {
      getItem: vi.fn((key: string) =>
        Promise.resolve(mockAsyncStorage.get(key) || null)
      ),
      setItem: vi.fn((key: string, value: string) => {
        mockAsyncStorage.set(key, value);
        return Promise.resolve();
      }),
      removeItem: vi.fn((key: string) => {
        mockAsyncStorage.delete(key);
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        mockAsyncStorage.clear();
        return Promise.resolve();
      }),
    } as any;

    // Initialize mobile-focused store
    mobileStore = new FieldStore<ReactNativeAppState>({
      appState: "active",
      device: {
        platform: "ios",
        version: "16.0",
        orientation: "portrait",
        screenDimensions: { width: 375, height: 812 },
        safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 },
      },
      navigation: {
        currentRoute: "Home",
        routeParams: {},
        navigationHistory: ["Home"],
        canGoBack: false,
      },
      network: {
        isConnected: true,
        connectionType: "wifi",
        isExpensive: false,
      },
      user: {
        id: "user-123",
        profile: { name: "John Doe", avatar: "https://example.com/avatar.jpg" },
        preferences: {
          theme: "system",
          notifications: true,
          language: "en",
        },
      },
      ui: {
        loading: false,
        modal: { visible: false, type: null, data: null },
        toast: { visible: false, message: "", type: "info" },
        keyboard: { visible: false, height: 0 },
      },
      cache: {
        images: {},
        api: {},
      },
      performance: {
        renderTime: 16.67, // 60fps target
        memoryUsage: 50, // MB
        frameDrops: 0,
        jsHeapSize: 25, // MB
      },
    });

    subscriptions = [];
  });

  afterEach(() => {
    // Clean up subscriptions
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

  describe("App Lifecycle Management", () => {
    it("should handle app state transitions (active/background/inactive)", () => {
      let appStateHistory: string[] = [];

      const subscription = mobileStore
        .observable("appState")
        .subscribe((state) => {
          appStateHistory.push(state);
        });
      subscriptions.push(subscription);

      // Simulate app going to background
      mobileStore.set({ appState: "background" });
      expect(appStateHistory).toEqual(["active", "background"]);

      // Simulate app becoming inactive
      mobileStore.set({ appState: "inactive" });
      expect(appStateHistory).toEqual(["active", "background", "inactive"]);

      // Simulate app returning to active
      mobileStore.set({ appState: "active" });
      expect(appStateHistory).toEqual([
        "active",
        "background",
        "inactive",
        "active",
      ]);
    });

    it("should handle background data persistence", async () => {
      const persistenceKey = "user_preferences";
      let persistedData: any = null;

      // Subscribe to app state changes to trigger persistence
      const subscription = mobileStore
        .observable("appState")
        .subscribe(async (appState) => {
          if (appState === "background") {
            // Persist current user preferences when app goes to background
            const currentUser = mobileStore.get("user");
            await global.AsyncStorage.setItem(
              persistenceKey,
              JSON.stringify(currentUser.preferences)
            );
          }
        });
      subscriptions.push(subscription);

      // Change user preferences
      mobileStore.set({
        user: {
          ...mobileStore.get("user"),
          preferences: {
            theme: "dark",
            notifications: false,
            language: "es",
          },
        },
      });

      // Simulate app going to background (this triggers persistence)
      mobileStore.set({ appState: "background" });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Verify data was persisted
      const storedData = await global.AsyncStorage.getItem(persistenceKey);
      persistedData = storedData ? JSON.parse(storedData) : null;

      expect(persistedData).toEqual({
        theme: "dark",
        notifications: false,
        language: "es",
      });
    });

    it("should optimize performance when app is in background", () => {
      let updateCounts = { active: 0, background: 0 };

      // Create performance-aware subscription
      const subscription = mobileStore
        .observable("performance")
        .subscribe((perf) => {
          const appState = mobileStore.get("appState");
          updateCounts[appState]++;

          if (appState === "background") {
            // Simulate reduced update frequency in background
            expect(perf.renderTime).toBeGreaterThan(33); // Lower frame rate expected
          } else {
            // Active app should maintain good performance
            expect(perf.renderTime).toBeLessThan(20); // Good frame rate
          }
        });
      subscriptions.push(subscription);

      // Update performance in active state
      mobileStore.set({
        performance: { ...mobileStore.get("performance"), renderTime: 16.67 },
      });

      // Go to background and update performance
      mobileStore.set({ appState: "background" });
      mobileStore.set({
        performance: { ...mobileStore.get("performance"), renderTime: 50 },
      });

      // Return to active
      mobileStore.set({ appState: "active" });
      mobileStore.set({
        performance: { ...mobileStore.get("performance"), renderTime: 16.67 },
      });

      expect(updateCounts.active).toBeGreaterThan(1);
      expect(updateCounts.background).toBeGreaterThan(0);
    });
  });

  describe("Device and Platform Handling", () => {
    it("should handle device orientation changes", () => {
      let orientationChanges: string[] = [];
      let dimensionChanges: Array<{ width: number; height: number }> = [];

      const deviceSubscription = mobileStore
        .observable("device")
        .subscribe((device) => {
          orientationChanges.push(device.orientation);
          dimensionChanges.push(device.screenDimensions);
        });
      subscriptions.push(deviceSubscription);

      // Simulate rotation to landscape
      mobileStore.set({
        device: {
          ...mobileStore.get("device"),
          orientation: "landscape",
          screenDimensions: { width: 812, height: 375 },
        },
      });

      // Simulate rotation back to portrait
      mobileStore.set({
        device: {
          ...mobileStore.get("device"),
          orientation: "portrait",
          screenDimensions: { width: 375, height: 812 },
        },
      });

      expect(orientationChanges).toEqual(["portrait", "landscape", "portrait"]);
      expect(dimensionChanges[1]).toEqual({ width: 812, height: 375 });
      expect(dimensionChanges[2]).toEqual({ width: 375, height: 812 });
    });

    it("should handle platform-specific state (iOS vs Android)", () => {
      let platformSpecificData: any[] = [];

      const subscription = mobileStore
        .observable("device")
        .subscribe((device) => {
          platformSpecificData.push({
            platform: device.platform,
            safeArea: device.safeAreaInsets,
            timestamp: Date.now(),
          });
        });
      subscriptions.push(subscription);

      // Simulate iOS device
      mobileStore.set({
        device: {
          ...mobileStore.get("device"),
          platform: "ios",
          safeAreaInsets: { top: 44, bottom: 34, left: 0, right: 0 }, // iPhone with notch
        },
      });

      // Simulate Android device
      mobileStore.set({
        device: {
          ...mobileStore.get("device"),
          platform: "android",
          safeAreaInsets: { top: 24, bottom: 0, left: 0, right: 0 }, // Android status bar
        },
      });

      expect(platformSpecificData[1].platform).toBe("ios");
      expect(platformSpecificData[1].safeArea.top).toBe(44);
      expect(platformSpecificData[2].platform).toBe("android");
      expect(platformSpecificData[2].safeArea.top).toBe(24);
    });

    it("should handle keyboard show/hide events", () => {
      let keyboardEvents: Array<{ visible: boolean; height: number }> = [];

      const uiSubscription = mobileStore.observable("ui").subscribe((ui) => {
        keyboardEvents.push({
          visible: ui.keyboard.visible,
          height: ui.keyboard.height,
        });
      });
      subscriptions.push(uiSubscription);

      // Simulate keyboard showing
      mobileStore.set({
        ui: {
          ...mobileStore.get("ui"),
          keyboard: { visible: true, height: 291 },
        },
      });

      // Simulate keyboard hiding
      mobileStore.set({
        ui: {
          ...mobileStore.get("ui"),
          keyboard: { visible: false, height: 0 },
        },
      });

      expect(keyboardEvents).toEqual([
        { visible: false, height: 0 }, // Initial
        { visible: true, height: 291 }, // Shown
        { visible: false, height: 0 }, // Hidden
      ]);
    });
  });

  describe("Navigation and Routing", () => {
    it("should handle navigation state changes", () => {
      let navigationHistory: string[] = [];

      const navSubscription = mobileStore
        .observable("navigation")
        .subscribe((nav) => {
          navigationHistory.push(nav.currentRoute);
        });
      subscriptions.push(navSubscription);

      // Navigate to Profile
      mobileStore.set({
        navigation: {
          currentRoute: "Profile",
          routeParams: { userId: "123" },
          navigationHistory: ["Home", "Profile"],
          canGoBack: true,
        },
      });

      // Navigate to Settings
      mobileStore.set({
        navigation: {
          currentRoute: "Settings",
          routeParams: {},
          navigationHistory: ["Home", "Profile", "Settings"],
          canGoBack: true,
        },
      });

      // Go back to Profile
      mobileStore.set({
        navigation: {
          currentRoute: "Profile",
          routeParams: { userId: "123" },
          navigationHistory: ["Home", "Profile"],
          canGoBack: true,
        },
      });

      expect(navigationHistory).toEqual([
        "Home",
        "Profile",
        "Settings",
        "Profile",
      ]);
    });

    it("should handle deep linking with route parameters", () => {
      let routeParams: any[] = [];

      const subscription = mobileStore
        .observable("navigation")
        .subscribe((nav) => {
          routeParams.push(nav.routeParams);
        });
      subscriptions.push(subscription);

      // Simulate deep link to user profile
      mobileStore.set({
        navigation: {
          ...mobileStore.get("navigation"),
          currentRoute: "UserProfile",
          routeParams: {
            userId: "456",
            tab: "posts",
            highlight: "post-789",
          },
        },
      });

      // Simulate deep link to product page
      mobileStore.set({
        navigation: {
          ...mobileStore.get("navigation"),
          currentRoute: "Product",
          routeParams: {
            productId: "prod-123",
            variant: "red",
            size: "large",
          },
        },
      });

      expect(routeParams[1]).toEqual({
        userId: "456",
        tab: "posts",
        highlight: "post-789",
      });
      expect(routeParams[2]).toEqual({
        productId: "prod-123",
        variant: "red",
        size: "large",
      });
    });
  });

  describe("Network and Connectivity", () => {
    it("should handle network connectivity changes", () => {
      let connectivityEvents: Array<{
        connected: boolean;
        type: string;
        expensive: boolean;
      }> = [];

      const networkSubscription = mobileStore
        .observable("network")
        .subscribe((network) => {
          connectivityEvents.push({
            connected: network.isConnected,
            type: network.connectionType,
            expensive: network.isExpensive,
          });
        });
      subscriptions.push(networkSubscription);

      // Simulate switching to cellular
      mobileStore.set({
        network: {
          isConnected: true,
          connectionType: "cellular",
          isExpensive: true,
        },
      });

      // Simulate going offline
      mobileStore.set({
        network: {
          isConnected: false,
          connectionType: "none",
          isExpensive: false,
        },
      });

      // Simulate reconnecting to WiFi
      mobileStore.set({
        network: {
          isConnected: true,
          connectionType: "wifi",
          isExpensive: false,
        },
      });

      expect(connectivityEvents).toEqual([
        { connected: true, type: "wifi", expensive: false },
        { connected: true, type: "cellular", expensive: true },
        { connected: false, type: "none", expensive: false },
        { connected: true, type: "wifi", expensive: false },
      ]);
    });

    it("should handle offline data caching", () => {
      let cacheOperations: string[] = [];

      const cacheSubscription = mobileStore
        .observable("cache")
        .subscribe((cache) => {
          const apiCacheSize = Object.keys(cache.api).length;
          const imageCacheSize = Object.keys(cache.images).length;
          cacheOperations.push(`API:${apiCacheSize}, Images:${imageCacheSize}`);
        });
      subscriptions.push(cacheSubscription);

      // Cache API response
      mobileStore.set({
        cache: {
          ...mobileStore.get("cache"),
          api: {
            "users/123": {
              data: { id: 123, name: "John" },
              timestamp: Date.now(),
              ttl: 300000, // 5 minutes
            },
          },
        },
      });

      // Cache image
      mobileStore.set({
        cache: {
          ...mobileStore.get("cache"),
          images: {
            "profile-123": {
              uri: "file://cache/profile-123.jpg",
              cached: true,
              size: 1024 * 50, // 50KB
            },
          },
        },
      });

      expect(cacheOperations).toEqual([
        "API:0, Images:0", // Initial
        "API:1, Images:0", // After API cache
        "API:1, Images:1", // After image cache
      ]);
    });
  });

  describe("Memory Management and Performance", () => {
    it("should monitor and optimize memory usage", () => {
      let memoryAlerts: number[] = [];
      const memoryThreshold = 100; // MB

      const performanceSubscription = mobileStore
        .observable("performance")
        .subscribe((perf) => {
          if (perf.memoryUsage > memoryThreshold) {
            memoryAlerts.push(perf.memoryUsage);
          }
        });
      subscriptions.push(performanceSubscription);

      // Simulate memory usage increase
      mobileStore.set({
        performance: {
          ...mobileStore.get("performance"),
          memoryUsage: 120, // Above threshold
          jsHeapSize: 60,
        },
      });

      // Simulate memory optimization
      mobileStore.set({
        performance: {
          ...mobileStore.get("performance"),
          memoryUsage: 80, // Back below threshold
          jsHeapSize: 40,
        },
      });

      // Simulate another spike
      mobileStore.set({
        performance: {
          ...mobileStore.get("performance"),
          memoryUsage: 150, // Above threshold again
          jsHeapSize: 75,
        },
      });

      expect(memoryAlerts).toEqual([120, 150]);
    });

    it("should handle high-frequency updates efficiently on mobile", async () => {
      let updateCounts = 0;
      let averageUpdateTime = 0;
      let totalTime = 0;

      const subscription = mobileStore.observable("ui").subscribe(() => {
        const start = performance.now();

        // Simulate mobile UI processing
        updateCounts++;

        const end = performance.now();
        totalTime += end - start;
        averageUpdateTime = totalTime / updateCounts;
      });
      subscriptions.push(subscription);

      // Simulate rapid UI updates (e.g., scrolling, animations)
      const updateCount = 60; // 1 second at 60fps
      const startTime = performance.now();

      for (let i = 0; i < updateCount; i++) {
        mobileStore.set({
          ui: {
            ...mobileStore.get("ui"),
            loading: i % 2 === 0, // Toggle loading state
          },
        });

        // Small delay to simulate frame timing
        if (i % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // Performance expectations for mobile
      expect(totalDuration).toBeLessThan(200); // Complete in < 200ms
      expect(averageUpdateTime).toBeLessThan(2); // Avg update < 2ms
      expect(updateCounts).toBe(updateCount + 1); // +1 for initial subscription
    });

    it("should handle image caching and memory pressure", () => {
      let cacheEvictions: string[] = [];
      const maxCacheSize = 10 * 1024 * 1024; // 10MB

      const cacheSubscription = mobileStore
        .observable("cache")
        .subscribe((cache) => {
          const totalImageSize = Object.values(cache.images).reduce(
            (total, img) => total + img.size,
            0
          );

          if (totalImageSize > maxCacheSize) {
            // Simulate cache eviction
            const imageKeys = Object.keys(cache.images);
            const oldestKey = imageKeys[0]; // Simple FIFO eviction
            cacheEvictions.push(oldestKey);
          }
        });
      subscriptions.push(cacheSubscription);

      // Add images to cache
      const currentCache = mobileStore.get("cache");
      const newImages = {
        ...currentCache.images,
        img1: { uri: "file://img1.jpg", cached: true, size: 3 * 1024 * 1024 },
        img2: { uri: "file://img2.jpg", cached: true, size: 4 * 1024 * 1024 },
        img3: { uri: "file://img3.jpg", cached: true, size: 5 * 1024 * 1024 }, // Total: 12MB > 10MB
      };

      mobileStore.set({
        cache: {
          ...currentCache,
          images: newImages,
        },
      });

      expect(cacheEvictions.length).toBeGreaterThan(0);
    });
  });

  describe("UI State Management", () => {
    it("should handle modal state management", () => {
      let modalStates: Array<{ visible: boolean; type: string | null }> = [];

      const uiSubscription = mobileStore.observable("ui").subscribe((ui) => {
        modalStates.push({
          visible: ui.modal.visible,
          type: ui.modal.type,
        });
      });
      subscriptions.push(uiSubscription);

      // Show confirmation modal
      mobileStore.set({
        ui: {
          ...mobileStore.get("ui"),
          modal: {
            visible: true,
            type: "confirmation",
            data: { message: "Are you sure?" },
          },
        },
      });

      // Hide modal
      mobileStore.set({
        ui: {
          ...mobileStore.get("ui"),
          modal: {
            visible: false,
            type: null,
            data: null,
          },
        },
      });

      // Show image picker modal
      mobileStore.set({
        ui: {
          ...mobileStore.get("ui"),
          modal: {
            visible: true,
            type: "imagePicker",
            data: { allowsEditing: true },
          },
        },
      });

      expect(modalStates).toEqual([
        { visible: false, type: null },
        { visible: true, type: "confirmation" },
        { visible: false, type: null },
        { visible: true, type: "imagePicker" },
      ]);
    });

    it("should handle toast notifications", () => {
      let toastMessages: Array<{
        message: string;
        type: string;
        visible: boolean;
      }> = [];

      const toastSubscription = mobileStore.observable("ui").subscribe((ui) => {
        toastMessages.push({
          message: ui.toast.message,
          type: ui.toast.type,
          visible: ui.toast.visible,
        });
      });
      subscriptions.push(toastSubscription);

      // Show success toast
      mobileStore.set({
        ui: {
          ...mobileStore.get("ui"),
          toast: {
            visible: true,
            message: "Profile updated successfully!",
            type: "success",
          },
        },
      });

      // Auto-hide toast after delay (simulated)
      setTimeout(() => {
        mobileStore.set({
          ui: {
            ...mobileStore.get("ui"),
            toast: {
              visible: false,
              message: "",
              type: "info",
            },
          },
        });
      }, 10);

      // Wait for timeout
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(toastMessages.length).toBeGreaterThanOrEqual(2);
          expect(toastMessages[1].visible).toBe(true);
          expect(toastMessages[1].message).toBe(
            "Profile updated successfully!"
          );
          expect(toastMessages[1].type).toBe("success");
          resolve();
        }, 20);
      });
    });
  });

  describe("Cross-Platform State Synchronization", () => {
    it("should sync state between React Native and React DOM", async () => {
      let syncedData: any[] = [];

      // Simulate React DOM web app running alongside mobile app
      const webStore = new FieldStore({
        syncedCounter: 0,
        webSpecificData: { browserType: "chrome" },
        sharedUserData: { id: "user-123", preferences: {} },
      });

      // Subscribe to changes from mobile store
      const mobileSubscription = mobileStore
        .observable("user")
        .subscribe((user) => {
          syncedData.push({ source: "mobile", user });

          // Sync to web store when mobile user changes
          webStore.set({
            sharedUserData: {
              id: user.id,
              preferences: user.preferences,
            },
          });
        });

      const webSubscription = webStore
        .observable("sharedUserData")
        .subscribe((userData) => {
          syncedData.push({ source: "web", userData });
        });

      subscriptions.push(mobileSubscription, webSubscription);

      // Clear initial subscription data
      syncedData = [];

      // Update user preferences on mobile
      mobileStore.set({
        user: {
          ...mobileStore.get("user"),
          preferences: {
            theme: "dark",
            notifications: true,
            language: "fr",
          },
        },
      });

      // Wait for both subscriptions to fire
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify synchronization - should have both mobile and web updates
      const mobileUpdate = syncedData.find(
        (d) => d.source === "mobile" && d.user?.preferences?.theme === "dark"
      );
      const webUpdate = syncedData.find(
        (d) => d.source === "web" && d.userData?.preferences?.theme === "dark"
      );

      expect(mobileUpdate).toBeDefined();
      expect(webUpdate).toBeDefined();
      expect(webUpdate!.userData.preferences.theme).toBe("dark");
      expect(webUpdate!.userData.preferences.language).toBe("fr");
    });

    it("should handle offline/online state synchronization", async () => {
      let syncQueue: any[] = [];
      let syncedChanges: any[] = [];

      // Subscribe to network changes
      const networkSubscription = mobileStore
        .observable("network")
        .subscribe((network) => {
          if (network.isConnected && syncQueue.length > 0) {
            // Simulate syncing queued changes when back online
            syncedChanges.push(...syncQueue);
            syncQueue = [];
          }
        });
      subscriptions.push(networkSubscription);

      // Go offline
      mobileStore.set({
        network: {
          isConnected: false,
          connectionType: "none",
          isExpensive: false,
        },
      });

      // Make changes while offline
      const offlineChanges = [
        { type: "user_preference", data: { theme: "dark" } },
        { type: "navigation", data: { visited: "Profile" } },
        { type: "cache", data: { image: "cached_offline.jpg" } },
      ];

      offlineChanges.forEach((change) => {
        syncQueue.push(change);
      });

      expect(syncedChanges).toHaveLength(0); // Nothing synced yet

      // Come back online
      mobileStore.set({
        network: {
          isConnected: true,
          connectionType: "wifi",
          isExpensive: false,
        },
      });

      // Wait for sync
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(syncedChanges).toHaveLength(3);
      expect(syncQueue).toHaveLength(0); // Queue should be cleared
    });
  });

  describe("Native Module Integration", () => {
    it("should handle native module data updates", () => {
      let nativeModuleUpdates: any[] = [];

      // Mock native module bridge
      const mockNativeModule = {
        getDeviceInfo: vi.fn(() =>
          Promise.resolve({
            model: "iPhone 14 Pro",
            systemVersion: "16.1",
            batteryLevel: 0.85,
            isCharging: false,
          })
        ),

        getLocation: vi.fn(() =>
          Promise.resolve({
            latitude: 37.7749,
            longitude: -122.4194,
            accuracy: 5.0,
          })
        ),
      };

      // Subscribe to device updates
      const deviceSubscription = mobileStore
        .observable("device")
        .subscribe((device) => {
          nativeModuleUpdates.push({
            type: "device",
            platform: device.platform,
            version: device.version,
          });
        });
      subscriptions.push(deviceSubscription);

      // Simulate native module updating device info
      mockNativeModule.getDeviceInfo().then((deviceInfo) => {
        mobileStore.set({
          device: {
            ...mobileStore.get("device"),
            version: deviceInfo.systemVersion,
            // Add custom native data
            batteryLevel: deviceInfo.batteryLevel,
            isCharging: deviceInfo.isCharging,
          } as any,
        });
      });

      // Verify integration
      expect(mockNativeModule.getDeviceInfo).toHaveBeenCalled();

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(nativeModuleUpdates.length).toBeGreaterThan(1);
          resolve();
        }, 20);
      });
    });

    it("should handle push notification state", () => {
      let notificationStates: any[] = [];

      // Add push notification state to user preferences
      const notificationSubscription = mobileStore
        .observable("user")
        .subscribe((user) => {
          notificationStates.push({
            enabled: user.preferences.notifications,
            timestamp: Date.now(),
          });
        });
      subscriptions.push(notificationSubscription);

      // Simulate user enabling push notifications
      mobileStore.set({
        user: {
          ...mobileStore.get("user"),
          preferences: {
            ...mobileStore.get("user").preferences,
            notifications: true,
          },
        },
      });

      // Simulate system revoking notification permission
      mobileStore.set({
        user: {
          ...mobileStore.get("user"),
          preferences: {
            ...mobileStore.get("user").preferences,
            notifications: false,
          },
        },
      });

      expect(notificationStates).toEqual([
        expect.objectContaining({ enabled: true }),
        expect.objectContaining({ enabled: true }),
        expect.objectContaining({ enabled: false }),
      ]);
    });
  });

  describe("Performance on Mobile Hardware", () => {
    it("should maintain performance with limited mobile resources", () => {
      let performanceMetrics: any[] = [];
      const targetFrameTime = 16.67; // 60fps

      const perfSubscription = mobileStore
        .observable("performance")
        .subscribe((perf) => {
          performanceMetrics.push({
            renderTime: perf.renderTime,
            memoryUsage: perf.memoryUsage,
            frameDrops: perf.frameDrops,
            efficient:
              perf.renderTime <= targetFrameTime && perf.memoryUsage < 200,
          });
        });
      subscriptions.push(perfSubscription);

      // Simulate various performance scenarios
      const scenarios = [
        { renderTime: 16.0, memoryUsage: 45, frameDrops: 0 }, // Excellent
        { renderTime: 18.5, memoryUsage: 85, frameDrops: 1 }, // Good
        { renderTime: 25.0, memoryUsage: 150, frameDrops: 3 }, // Fair
        { renderTime: 14.2, memoryUsage: 40, frameDrops: 0 }, // Excellent again
      ];

      scenarios.forEach((scenario) => {
        mobileStore.set({
          performance: {
            ...mobileStore.get("performance"),
            ...scenario,
            jsHeapSize: scenario.memoryUsage * 0.6, // Approximate heap size
          },
        });
      });

      // Most scenarios should be efficient (including initial state)
      const efficientCount = performanceMetrics.filter(
        (m) => m.efficient
      ).length;
      expect(efficientCount).toBeGreaterThanOrEqual(
        Math.floor(performanceMetrics.length * 0.6)
      ); // 60%+ efficient
    });

    it("should handle rapid state changes during animations", async () => {
      let animationFrames: number[] = [];
      const animationDuration = 100; // ms
      const frameCount = 6; // 60fps for 100ms

      const animationSubscription = mobileStore
        .observable("ui")
        .subscribe((ui) => {
          if (ui.loading) {
            animationFrames.push(performance.now());
          }
        });
      subscriptions.push(animationSubscription);

      // Simulate animation frames
      const startTime = performance.now();

      for (let i = 0; i < frameCount; i++) {
        mobileStore.set({
          ui: {
            ...mobileStore.get("ui"),
            loading: true,
          },
        });

        await new Promise((resolve) =>
          setTimeout(resolve, animationDuration / frameCount)
        );

        mobileStore.set({
          ui: {
            ...mobileStore.get("ui"),
            loading: false,
          },
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Animation should complete within reasonable time
      expect(totalTime).toBeLessThan(animationDuration * 2);
      expect(animationFrames.length).toBe(frameCount);

      // Frame timing should be consistent
      const frameTimes = animationFrames
        .slice(1)
        .map((time, i) => time - animationFrames[i]);
      const averageFrameTime =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      expect(averageFrameTime).toBeLessThan(50); // < 50ms between frames
    });
  });
});
