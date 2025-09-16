/**
 * React-specific performance testing utilities for NextTinyRXStore
 */

import React from "react";

export interface RenderMetrics {
  renderCount: number;
  totalRenderTime: number;
  averageRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
  renderTimes: number[];
}

export interface ComponentPerfResult {
  component: string;
  metrics: RenderMetrics;
  memorizedRenders: number;
  wastedRenders: number;
}

/**
 * Hook to measure component render performance
 */
export function useRenderMetrics(componentName: string): RenderMetrics {
  const metricsRef = React.useRef<{
    renderTimes: number[];
    startTime?: number;
  }>({ renderTimes: [] });

  // Start timing at the beginning of render
  const renderStartTime = performance.now();

  React.useLayoutEffect(() => {
    // End timing after render is complete
    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime;

    metricsRef.current.renderTimes.push(renderTime);
  });

  const renderTimes = metricsRef.current.renderTimes;
  const renderCount = renderTimes.length;
  const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0);
  const averageRenderTime = renderCount > 0 ? totalRenderTime / renderCount : 0;
  const minRenderTime = renderCount > 0 ? Math.min(...renderTimes) : 0;
  const maxRenderTime = renderCount > 0 ? Math.max(...renderTimes) : 0;

  return {
    renderCount,
    totalRenderTime,
    averageRenderTime,
    minRenderTime,
    maxRenderTime,
    renderTimes: [...renderTimes],
  };
}

/**
 * HOC to wrap a component with render performance tracking
 */
export function withRenderTracking<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const TrackedComponent = (props: P) => {
    const name =
      componentName ||
      WrappedComponent.displayName ||
      WrappedComponent.name ||
      "Unknown";
    const metrics = useRenderMetrics(name);

    // Store metrics globally for retrieval
    if (typeof window !== "undefined") {
      (window as any).__renderMetrics = (window as any).__renderMetrics || {};
      (window as any).__renderMetrics[name] = metrics;
    }

    return React.createElement(WrappedComponent, props);
  };

  TrackedComponent.displayName = `withRenderTracking(${
    componentName || WrappedComponent.displayName || WrappedComponent.name
  })`;

  return TrackedComponent;
}

/**
 * Utility to get render metrics from tracked components
 */
export function getRenderMetrics(
  componentName?: string
): Record<string, RenderMetrics> {
  if (typeof window !== "undefined" && (window as any).__renderMetrics) {
    const metrics = (window as any).__renderMetrics;
    return componentName
      ? { [componentName]: metrics[componentName] }
      : metrics;
  }
  return {};
}

/**
 * Clear render metrics
 */
export function clearRenderMetrics(): void {
  if (typeof window !== "undefined") {
    (window as any).__renderMetrics = {};
  }
}

/**
 * Hook to detect unnecessary re-renders
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>
): void {
  const previousProps = React.useRef<Record<string, any>>();

  React.useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log("[why-did-you-update]", name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * Performance testing utilities for React components
 */
export class ReactPerformanceTester {
  private renderTimes: Map<string, number[]> = new Map();
  private renderCounts: Map<string, number> = new Map();

  startRender(componentName: string): () => void {
    const startTime = performance.now();
    const currentCount = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, currentCount + 1);

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      const times = this.renderTimes.get(componentName) || [];
      times.push(renderTime);
      this.renderTimes.set(componentName, times);
    };
  }

  getMetrics(componentName: string): RenderMetrics | null {
    const renderTimes = this.renderTimes.get(componentName);
    const renderCount = this.renderCounts.get(componentName) || 0;

    if (!renderTimes || renderTimes.length === 0) {
      return null;
    }

    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0);

    return {
      renderCount,
      totalRenderTime,
      averageRenderTime: totalRenderTime / renderTimes.length,
      minRenderTime: Math.min(...renderTimes),
      maxRenderTime: Math.max(...renderTimes),
      renderTimes: [...renderTimes],
    };
  }

  getAllMetrics(): Record<string, RenderMetrics> {
    const result: Record<string, RenderMetrics> = {};

    for (const componentName of this.renderTimes.keys()) {
      const metrics = this.getMetrics(componentName);
      if (metrics) {
        result[componentName] = metrics;
      }
    }

    return result;
  }

  reset(): void {
    this.renderTimes.clear();
    this.renderCounts.clear();
  }
}

/**
 * Measure component re-render frequency
 */
export async function measureReRenderFrequency(
  component: React.ReactElement,
  stateChanges: (() => void)[],
  duration: number = 1000
): Promise<{
  totalRenders: number;
  rendersPerSecond: number;
  renderTimes: number[];
}> {
  const renderTimes: number[] = [];
  let totalRenders = 0;

  const startTime = Date.now();
  const endTime = startTime + duration;

  // Simulate state changes
  const changeInterval = duration / stateChanges.length;
  let changeIndex = 0;

  const changeTimer = setInterval(() => {
    if (changeIndex < stateChanges.length && Date.now() < endTime) {
      const renderStart = performance.now();
      stateChanges[changeIndex]();

      // Simulate render completion (this would need actual React integration)
      setTimeout(() => {
        const renderEnd = performance.now();
        renderTimes.push(renderEnd - renderStart);
        totalRenders++;
      }, 0);

      changeIndex++;
    } else {
      clearInterval(changeTimer);
    }
  }, changeInterval);

  return new Promise((resolve) => {
    setTimeout(() => {
      clearInterval(changeTimer);
      const actualDuration = Date.now() - startTime;
      const rendersPerSecond = totalRenders / (actualDuration / 1000);

      resolve({
        totalRenders,
        rendersPerSecond,
        renderTimes,
      });
    }, duration + 100); // Add small buffer
  });
}
