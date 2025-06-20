'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  loadTime: number;
  interactionTime: number;
}

interface UsePerformanceOptions {
  trackRender?: boolean;
  trackLoad?: boolean;
  trackInteraction?: boolean;
  onMetrics?: (metrics: Partial<PerformanceMetrics>) => void;
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    trackRender = true,
    trackLoad = true,
    trackInteraction = false,
    onMetrics
  } = options;

  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const renderStartTime = useRef<number | undefined>(undefined);
  const loadStartTime = useRef<number | undefined>(undefined);
  const interactionStartTime = useRef<number | undefined>(undefined);

  // Track component render time
  useEffect(() => {
    if (!trackRender) return;

    renderStartTime.current = performance.now();
    
    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        const newMetrics = { renderTime };
        setMetrics(prev => ({ ...prev, ...newMetrics }));
        onMetrics?.(newMetrics);
      }
    };
  }, [trackRender, onMetrics]);

  // Track page load time
  useEffect(() => {
    if (!trackLoad) return;

    loadStartTime.current = performance.now();
    
    const handleLoad = () => {
      if (loadStartTime.current) {
        const loadTime = performance.now() - loadStartTime.current;
        const newMetrics = { loadTime };
        setMetrics(prev => ({ ...prev, ...newMetrics }));
        onMetrics?.(newMetrics);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [trackLoad, onMetrics]);

  // Measure interaction performance
  const measureInteraction = (callback?: () => void) => {
    if (!trackInteraction) {
      callback?.();
      return;
    }

    interactionStartTime.current = performance.now();
    
    const measure = () => {
      if (interactionStartTime.current) {
        const interactionTime = performance.now() - interactionStartTime.current;
        const newMetrics = { interactionTime };
        setMetrics(prev => ({ ...prev, ...newMetrics }));
        onMetrics?.(newMetrics);
      }
    };

    // Execute callback and measure
    Promise.resolve(callback?.()).finally(measure);
  };

  // Get performance navigation timing
  const getNavigationTiming = () => {
    if (typeof window === 'undefined') return null;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: navigation.responseEnd - navigation.requestStart,
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      dom: navigation.domComplete - navigation.responseEnd
    };
  };

  // Get resource timing
  const getResourceTiming = () => {
    if (typeof window === 'undefined') return [];
    
    return performance.getEntriesByType('resource').map(entry => ({
      name: entry.name,
      duration: entry.duration,
      size: (entry as PerformanceResourceTiming).transferSize || 0,
      type: entry.name.split('.').pop() || 'unknown'
    }));
  };

  // Clear performance metrics
  const clearMetrics = () => {
    setMetrics({});
    if (typeof window !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  };

  return {
    metrics,
    measureInteraction,
    getNavigationTiming,
    getResourceTiming,
    clearMetrics
  };
} 