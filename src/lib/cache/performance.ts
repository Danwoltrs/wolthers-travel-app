/**
 * Performance optimization utilities for the caching system
 * Provides performance monitoring, optimization hints, and automatic tuning
 */

interface PerformanceMetrics {
  cacheHitRate: number
  averageLoadTime: number
  memoryUsage: number
  syncLatency: number
  errorRate: number
  backgroundSyncCount: number
}

interface PerformanceTargets {
  dashboardLoadTime: number // <200ms
  navigationTime: number    // <100ms  
  cacheHitRate: number     // >85%
  maxMemoryUsage: number   // <50MB
  maxSyncLatency: number   // <5000ms
  maxErrorRate: number     // <1%
}

const PERFORMANCE_TARGETS: PerformanceTargets = {
  dashboardLoadTime: 200,
  navigationTime: 100,
  cacheHitRate: 0.85,
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB in bytes
  maxSyncLatency: 5000,
  maxErrorRate: 0.01
}

export class PerformanceOptimizer {
  private metrics: Map<string, number[]> = new Map()
  private startTimes: Map<string, number> = new Map()
  private errorCount = 0
  private totalRequests = 0

  /**
   * Start performance measurement for an operation
   */
  startMeasurement(operationId: string): void {
    this.startTimes.set(operationId, performance.now())
  }

  /**
   * End performance measurement and record result
   */
  endMeasurement(operationId: string, success: boolean = true): number {
    const startTime = this.startTimes.get(operationId)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.startTimes.delete(operationId)

    // Record metrics
    const existing = this.metrics.get(operationId) || []
    existing.push(duration)
    
    // Keep only last 100 measurements for memory efficiency
    if (existing.length > 100) {
      existing.shift()
    }
    
    this.metrics.set(operationId, existing)

    // Track success/error rates
    this.totalRequests++
    if (!success) {
      this.errorCount++
    }

    return duration
  }

  /**
   * Get performance metrics for monitoring
   */
  getMetrics(): PerformanceMetrics & {
    operationMetrics: Record<string, {
      average: number
      median: number
      p95: number
      count: number
    }>
    recommendations: string[]
  } {
    const operationMetrics: Record<string, any> = {}
    const recommendations: string[] = []

    // Calculate operation-specific metrics
    this.metrics.forEach((measurements, operationId) => {
      if (measurements.length === 0) return

      const sorted = [...measurements].sort((a, b) => a - b)
      const average = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
      const median = sorted[Math.floor(sorted.length / 2)]
      const p95Index = Math.floor(sorted.length * 0.95)
      const p95 = sorted[p95Index] || sorted[sorted.length - 1]

      operationMetrics[operationId] = {
        average,
        median, 
        p95,
        count: measurements.length
      }

      // Generate recommendations based on performance
      if (operationId.includes('dashboard') && average > PERFORMANCE_TARGETS.dashboardLoadTime) {
        recommendations.push(`Dashboard loading is slow (${Math.round(average)}ms). Consider pre-loading critical data.`)
      }
      
      if (operationId.includes('navigation') && average > PERFORMANCE_TARGETS.navigationTime) {
        recommendations.push(`Navigation is slow (${Math.round(average)}ms). Check cache hit rates and memory usage.`)
      }

      if (p95 > average * 2) {
        recommendations.push(`${operationId} has high variance. Some requests are significantly slower than others.`)
      }
    })

    // Calculate overall metrics
    const dashboardMetrics = operationMetrics['dashboard_load'] || { average: 0 }
    const navigationMetrics = operationMetrics['navigation'] || { average: 0 }
    
    const errorRate = this.totalRequests > 0 ? this.errorCount / this.totalRequests : 0
    const memoryUsage = this.estimateMemoryUsage()
    
    // Generate memory recommendations
    if (memoryUsage > PERFORMANCE_TARGETS.maxMemoryUsage * 0.8) {
      recommendations.push(`Memory usage is high (${Math.round(memoryUsage / 1024 / 1024)}MB). Consider reducing cache TTL or max items.`)
    }

    if (errorRate > PERFORMANCE_TARGETS.maxErrorRate) {
      recommendations.push(`Error rate is high (${Math.round(errorRate * 100)}%). Check network connectivity and API health.`)
    }

    return {
      cacheHitRate: this.calculateCacheHitRate(),
      averageLoadTime: dashboardMetrics.average,
      memoryUsage,
      syncLatency: operationMetrics['sync_operation']?.average || 0,
      errorRate,
      backgroundSyncCount: operationMetrics['background_sync']?.count || 0,
      operationMetrics,
      recommendations
    }
  }

  /**
   * Auto-tune cache configuration based on performance
   */
  getOptimizedCacheConfig(): {
    freshTTL: number
    staleTTL: number
    maxMemoryItems: number
    syncInterval: number
  } {
    const metrics = this.getMetrics()
    
    let freshTTL = 5 * 60 * 1000 // 5 minutes default
    let staleTTL = 15 * 60 * 1000 // 15 minutes default
    let maxMemoryItems = 100
    let syncInterval = 30 * 1000 // 30 seconds default

    // Adjust based on cache hit rate
    if (metrics.cacheHitRate < 0.5) {
      // Low hit rate - extend TTL
      freshTTL *= 2
      staleTTL *= 2
    } else if (metrics.cacheHitRate > 0.9) {
      // Very high hit rate - can reduce TTL for fresher data
      freshTTL *= 0.8
      staleTTL *= 0.8
    }

    // Adjust based on memory usage
    if (metrics.memoryUsage > PERFORMANCE_TARGETS.maxMemoryUsage * 0.8) {
      maxMemoryItems = Math.floor(maxMemoryItems * 0.7)
    }

    // Adjust sync interval based on sync latency
    if (metrics.syncLatency > 2000) {
      // High sync latency - reduce frequency
      syncInterval = Math.min(syncInterval * 1.5, 60 * 1000)
    } else if (metrics.syncLatency < 500) {
      // Low sync latency - can sync more frequently
      syncInterval = Math.max(syncInterval * 0.8, 10 * 1000)
    }

    return {
      freshTTL,
      staleTTL,
      maxMemoryItems,
      syncInterval
    }
  }

  /**
   * Check if performance meets targets
   */
  validatePerformance(): {
    passed: boolean
    results: Record<string, { passed: boolean; actual: number; target: number }>
  } {
    const metrics = this.getMetrics()
    
    const results = {
      dashboardLoad: {
        passed: metrics.averageLoadTime <= PERFORMANCE_TARGETS.dashboardLoadTime,
        actual: metrics.averageLoadTime,
        target: PERFORMANCE_TARGETS.dashboardLoadTime
      },
      cacheHitRate: {
        passed: metrics.cacheHitRate >= PERFORMANCE_TARGETS.cacheHitRate,
        actual: metrics.cacheHitRate,
        target: PERFORMANCE_TARGETS.cacheHitRate
      },
      memoryUsage: {
        passed: metrics.memoryUsage <= PERFORMANCE_TARGETS.maxMemoryUsage,
        actual: metrics.memoryUsage / 1024 / 1024, // Convert to MB
        target: PERFORMANCE_TARGETS.maxMemoryUsage / 1024 / 1024
      },
      syncLatency: {
        passed: metrics.syncLatency <= PERFORMANCE_TARGETS.maxSyncLatency,
        actual: metrics.syncLatency,
        target: PERFORMANCE_TARGETS.maxSyncLatency
      },
      errorRate: {
        passed: metrics.errorRate <= PERFORMANCE_TARGETS.maxErrorRate,
        actual: metrics.errorRate * 100, // Convert to percentage
        target: PERFORMANCE_TARGETS.maxErrorRate * 100
      }
    }

    const passed = Object.values(results).every(result => result.passed)

    return { passed, results }
  }

  /**
   * Reset all metrics (useful for testing or fresh start)
   */
  reset(): void {
    this.metrics.clear()
    this.startTimes.clear()
    this.errorCount = 0
    this.totalRequests = 0
  }

  /**
   * Export metrics for analytics/debugging
   */
  exportMetrics(): string {
    const data = {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      validation: this.validatePerformance(),
      targets: PERFORMANCE_TARGETS
    }
    
    return JSON.stringify(data, null, 2)
  }

  /**
   * Calculate cache hit rate (approximation)
   */
  private calculateCacheHitRate(): number {
    const cacheHits = this.metrics.get('cache_hit') || []
    const cacheMisses = this.metrics.get('cache_miss') || []
    
    const totalHits = cacheHits.length
    const totalMisses = cacheMisses.length
    const total = totalHits + totalMisses
    
    if (total === 0) return 0
    return totalHits / total
  }

  /**
   * Estimate memory usage (approximation)
   */
  private estimateMemoryUsage(): number {
    const jsHeapSizeLimit = (performance as any).memory?.jsHeapSizeLimit
    const usedJSHeapSize = (performance as any).memory?.usedJSHeapSize
    
    if (usedJSHeapSize && jsHeapSizeLimit) {
      // Return estimated cache portion (assume 10% of total memory)
      return usedJSHeapSize * 0.1
    }
    
    // Fallback estimation based on cache items
    const totalItems = Array.from(this.metrics.values()).reduce((sum, arr) => sum + arr.length, 0)
    return totalItems * 1024 * 8 // Rough estimate: 8KB per cached item
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

/**
 * Performance measurement decorator/utility
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  operationId: string,
  fn: T
): T {
  return ((...args: any[]) => {
    performanceOptimizer.startMeasurement(operationId)
    
    try {
      const result = fn(...args)
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result
          .then(value => {
            performanceOptimizer.endMeasurement(operationId, true)
            return value
          })
          .catch(error => {
            performanceOptimizer.endMeasurement(operationId, false)
            throw error
          })
      } else {
        performanceOptimizer.endMeasurement(operationId, true)
        return result
      }
    } catch (error) {
      performanceOptimizer.endMeasurement(operationId, false)
      throw error
    }
  }) as T
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  return {
    startMeasurement: (id: string) => performanceOptimizer.startMeasurement(id),
    endMeasurement: (id: string, success?: boolean) => performanceOptimizer.endMeasurement(id, success),
    getMetrics: () => performanceOptimizer.getMetrics(),
    validatePerformance: () => performanceOptimizer.validatePerformance(),
    exportMetrics: () => performanceOptimizer.exportMetrics()
  }
}