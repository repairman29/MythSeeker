export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  fps: number;
  errors: number;
  timestamp: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface ResourceUsage {
  memory: number;
  cpu: number;
  network: number;
  storage: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private cache: Map<string, CacheEntry> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private fpsCounter = 0;
  private lastFpsTime = Date.now();
  private errorCount = 0;
  private readonly MAX_METRICS = 100;
  private readonly CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes

  constructor() {
    this.initialize();
  }

  // Initialize performance monitoring
  private initialize(): void {
    // Set up performance observers
    this.setupPerformanceObservers();
    
    // Set up error tracking
    this.setupErrorTracking();
    
    // Set up FPS monitoring
    this.setupFPSMonitoring();
    
    // Set up cache cleanup
    setInterval(() => {
      this.cleanupCache();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  // Set up performance observers
  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn('Long task detected:', entry);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported');
      }

      // Monitor paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-paint') {
              this.recordMetric('paint', entry.startTime);
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      } catch (error) {
        console.warn('Paint observer not supported');
      }
    }
  }

  // Set up error tracking
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.errorCount++;
      this.recordError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.errorCount++;
      this.recordError(event.reason);
    });
  }

  // Set up FPS monitoring
  private setupFPSMonitoring(): void {
    let lastTime = performance.now();
    
    const measureFPS = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      if (deltaTime > 0) {
        const fps = 1000 / deltaTime;
        this.fpsCounter = fps;
      }
      
      lastTime = currentTime;
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  // Record a performance metric
  recordMetric(type: string, value: number): void {
    const metric: PerformanceMetrics = {
      loadTime: type === 'load' ? value : 0,
      renderTime: type === 'render' ? value : 0,
      memoryUsage: this.getMemoryUsage(),
      fps: this.fpsCounter,
      errors: this.errorCount,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  // Record an error
  recordError(error: Error | any): void {
    console.error('Performance Service - Error recorded:', error);
    
    // Store error in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('mythseeker_errors') || '[]');
      errors.push({
        message: error.message || error,
        stack: error.stack,
        timestamp: Date.now()
      });
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('mythseeker_errors', JSON.stringify(errors));
    } catch (e) {
      console.warn('Could not save error to localStorage');
    }
  }

  // Get memory usage (if available)
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  // Cache data with TTL
  setCache(key: string, data: any, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get cached data
  getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Cleanup expired cache entries
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get current performance metrics
  getCurrentMetrics(): PerformanceMetrics {
    return {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: this.getMemoryUsage(),
      fps: this.fpsCounter,
      errors: this.errorCount,
      timestamp: Date.now()
    };
  }

  // Get performance history
  getMetricsHistory(limit: number = 50): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Get average metrics
  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sum = this.metrics.reduce((acc, metric) => ({
      loadTime: acc.loadTime + metric.loadTime,
      renderTime: acc.renderTime + metric.renderTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      fps: acc.fps + metric.fps,
      errors: acc.errors + metric.errors,
      timestamp: 0
    }), {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      fps: 0,
      errors: 0,
      timestamp: 0
    });

    const count = this.metrics.length;
    return {
      loadTime: sum.loadTime / count,
      renderTime: sum.renderTime / count,
      memoryUsage: sum.memoryUsage / count,
      fps: sum.fps / count,
      errors: sum.errors / count
    };
  }

  // Get resource usage
  getResourceUsage(): ResourceUsage {
    return {
      memory: this.getMemoryUsage(),
      cpu: 0, // Would need Web Workers or other APIs to measure
      network: 0, // Would need Network Information API
      storage: this.getStorageUsage()
    };
  }

  // Get storage usage
  private getStorageUsage(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      return total / 1024; // KB
    } catch (error) {
      return 0;
    }
  }

  // Optimize images
  optimizeImage(url: string, width: number, height: number): string {
    // Add image optimization parameters
    const params = new URLSearchParams();
    params.append('w', width.toString());
    params.append('h', height.toString());
    params.append('q', '85'); // Quality
    params.append('f', 'auto'); // Format auto
    
    return `${url}?${params.toString()}`;
  }

  // Lazy load component
  lazyLoadComponent(importFn: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      importFn()
        .then((module) => {
          const loadTime = performance.now() - startTime;
          this.recordMetric('load', loadTime);
          resolve(module);
        })
        .catch((error) => {
          this.recordError(error);
          reject(error);
        });
    });
  }

  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Preload resources
  preloadResource(url: string, type: 'image' | 'script' | 'style'): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = type;
    document.head.appendChild(link);
  }

  // Monitor component render time
  monitorRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const renderTime = performance.now() - startTime;
    
    if (renderTime > 16) { // Longer than one frame (60fps)
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }
    
    this.recordMetric('render', renderTime);
  }

  // Get performance report
  getPerformanceReport(): any {
    const current = this.getCurrentMetrics();
    const average = this.getAverageMetrics();
    const resources = this.getResourceUsage();
    
    return {
      current,
      average,
      resources,
      cacheSize: this.cache.size,
      metricsCount: this.metrics.length,
      timestamp: Date.now()
    };
  }

  // Export performance data
  exportData(): string {
    return JSON.stringify({
      metrics: this.metrics,
      cache: Array.from(this.cache.entries()),
      report: this.getPerformanceReport(),
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  // Cleanup
  cleanup(): void {
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear cache
    this.cache.clear();
    
    // Clear metrics
    this.metrics = [];
  }
}

export const performanceService = new PerformanceService(); 