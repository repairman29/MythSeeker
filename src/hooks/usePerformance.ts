/// <reference lib="dom" />
import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';

// Type for IntersectionObserverInit
type IntersectionObserverInit = {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
};

// Debounce hook for expensive operations
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for frequent events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, hasIntersected]);

  return { elementRef, isIntersecting, hasIntersected };
};

// Memory management hook
export const useMemoryManagement = () => {
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctions.current.forEach(fn => fn());
    cleanupFunctions.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanup, cleanup };
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    return { start: Math.max(0, start - overscan), end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange
  };
};

// Image preloading hook
export const useImagePreloader = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  const preloadImage = useCallback((src: string) => {
    if (loadedImages.has(src) || loadingImages.has(src)) return;

    setLoadingImages(prev => new Set(prev).add(src));

    const img = new Image();
    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(src));
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(src);
        return newSet;
      });
    };
    img.onerror = () => {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(src);
        return newSet;
      });
    };
    img.src = src;
  }, [loadedImages, loadingImages]);

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src);
  }, [loadedImages]);

  const isImageLoading = useCallback((src: string) => {
    return loadingImages.has(src);
  }, [loadingImages]);

  return {
    preloadImage,
    isImageLoaded,
    isImageLoading,
    loadedImages: Array.from(loadedImages),
    loadingImages: Array.from(loadingImages)
  };
};

// Network status hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };
      
      connection.addEventListener('change', handleConnectionChange);
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    // Start FPS measurement
    animationId = requestAnimationFrame(measureFPS);

    // Measure memory usage if available
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memory: Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
        }));
      }
    };

    const memoryInterval = setInterval(measureMemory, 5000);

    // Measure page load time
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics;
};



// Cache management hook
export const useCache = <T>(key: string, ttl: number = 5 * 60 * 1000) => {
  const [cache, setCache] = useState<Map<string, { data: T; timestamp: number }>>(new Map());

  const get = useCallback((cacheKey: string): T | null => {
    const item = cache.get(cacheKey);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > ttl) {
      cache.delete(cacheKey);
      return null;
    }
    
    return item.data;
  }, [cache, ttl]);

  const set = useCallback((cacheKey: string, data: T) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(cacheKey, { data, timestamp: Date.now() });
      return newCache;
    });
  }, []);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  const remove = useCallback((cacheKey: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
  }, []);

  return { get, set, clear, remove };
};

export default {
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useMemoryManagement,
  useVirtualScroll,
  useImagePreloader,
  useNetworkStatus,
  usePerformanceMonitor,
  useCache
}; 