/**
 * Advanced Performance Monitor Service
 * 
 * Provides comprehensive performance monitoring, alerting, and automatic
 * optimization for the sync and cache system. Tracks memory usage, 
 * operation times, and system health metrics.
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: 'memory' | 'timing' | 'throughput' | 'error' | 'cache'
  unit: 'ms' | 'bytes' | 'count' | 'percentage'
  threshold?: {
    warning: number
    critical: number
  }
}

interface PerformanceAlert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  metric: string
  value: number
  threshold: number
  timestamp: number
  resolved: boolean
}

interface PerformanceSample {
  timestamp: number
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    arrayBuffers: number
  }
  sync: {
    queueSize: number
    operationTime: number
    batchSize: number
    successRate: number
  }
  cache: {
    hitRate: number
    memoryItems: number
    storageSize: number
  }
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric[]>()
  private alerts: PerformanceAlert[] = []
  private samples: PerformanceSample[] = []
  private maxSamples = 1000 // Keep last 1000 samples
  private maxMetricHistory = 100 // Keep last 100 values per metric
  private listeners = new Set<(alert: PerformanceAlert) => void>()
  
  private memoryWatcher: NodeJS.Timeout | null = null
  private alertProcessor: NodeJS.Timeout | null = null

  constructor() {
    this.startMemoryMonitoring()
    this.startAlertProcessing()
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now()
    }

    if (!this.metrics.has(metric.name)) {
      this.metrics.set(metric.name, [])
    }

    const history = this.metrics.get(metric.name)!
    history.push(fullMetric)

    // Keep only recent history
    if (history.length > this.maxMetricHistory) {
      history.splice(0, history.length - this.maxMetricHistory)
    }

    // Check for threshold violations
    this.checkThresholds(fullMetric)
  }

  /**
   * Record timing for an operation
   */
  recordTiming(operation: string, startTime: number, category: string = 'timing'): void {
    const duration = performance.now() - startTime
    
    this.recordMetric({
      name: `${operation}_time`,
      value: duration,
      category: category as any,
      unit: 'ms',
      threshold: this.getTimingThreshold(operation)
    })
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(context: string): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      
      this.recordMetric({
        name: `${context}_heap_used`,
        value: memory.usedJSHeapSize,
        category: 'memory',
        unit: 'bytes',
        threshold: { warning: 50 * 1024 * 1024, critical: 100 * 1024 * 1024 } // 50MB/100MB
      })

      this.recordMetric({
        name: `${context}_heap_total`,
        value: memory.totalJSHeapSize,
        category: 'memory',
        unit: 'bytes',
        threshold: { warning: 100 * 1024 * 1024, critical: 200 * 1024 * 1024 }
      })
    }
  }

  /**
   * Record cache performance
   */
  recordCacheHit(cacheType: string, hit: boolean): void {
    const metricName = `${cacheType}_hit_rate`
    const existing = this.getLatestMetric(metricName)
    
    // Calculate rolling hit rate
    const currentHits = existing ? existing.value : 0
    const newHitRate = hit ? Math.min(100, currentHits + 1) : Math.max(0, currentHits - 0.1)
    
    this.recordMetric({
      name: metricName,
      value: newHitRate,
      category: 'cache',
      unit: 'percentage',
      threshold: { warning: 70, critical: 50 }
    })
  }

  /**
   * Record sync operation performance
   */
  recordSyncOperation(
    operationType: string,
    batchSize: number,
    duration: number,
    successCount: number,
    failureCount: number
  ): void {
    this.recordMetric({
      name: `sync_${operationType}_duration`,
      value: duration,
      category: 'timing',
      unit: 'ms',
      threshold: this.getSyncTimingThreshold(batchSize)
    })

    const totalOps = successCount + failureCount
    const successRate = totalOps > 0 ? (successCount / totalOps) * 100 : 100

    this.recordMetric({
      name: `sync_${operationType}_success_rate`,
      value: successRate,
      category: 'throughput',
      unit: 'percentage',
      threshold: { warning: 90, critical: 75 }
    })

    this.recordMetric({
      name: `sync_${operationType}_batch_size`,
      value: batchSize,
      category: 'throughput',
      unit: 'count'
    })
  }

  /**
   * Take a performance sample
   */
  takeSample(additionalData?: Partial<PerformanceSample>): void {
    const sample: PerformanceSample = {
      timestamp: Date.now(),
      memory: {
        heapUsed: this.getLatestMetric('heap_used')?.value || 0,
        heapTotal: this.getLatestMetric('heap_total')?.value || 0,
        external: 0,
        arrayBuffers: 0
      },
      sync: {
        queueSize: this.getLatestMetric('queue_size')?.value || 0,
        operationTime: this.getLatestMetric('sync_operation_time')?.value || 0,
        batchSize: this.getLatestMetric('sync_batch_size')?.value || 0,
        successRate: this.getLatestMetric('sync_success_rate')?.value || 100
      },
      cache: {
        hitRate: this.getLatestMetric('cache_hit_rate')?.value || 0,
        memoryItems: this.getLatestMetric('cache_memory_items')?.value || 0,
        storageSize: this.getLatestMetric('cache_storage_size')?.value || 0
      },
      ...additionalData
    }

    this.samples.push(sample)

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.splice(0, this.samples.length - this.maxSamples)
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    metrics: Record<string, { current: number; average: number; min: number; max: number }>
    alerts: { active: number; resolved: number }
    health: 'good' | 'warning' | 'critical'
    recommendations: string[]
  } {
    const metricStats: Record<string, any> = {}
    
    for (const [name, history] of this.metrics.entries()) {
      if (history.length === 0) continue
      
      const values = history.map(m => m.value)
      metricStats[name] = {
        current: values[values.length - 1],
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    }

    const activeAlerts = this.alerts.filter(a => !a.resolved)
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
    const warningAlerts = activeAlerts.filter(a => a.severity === 'warning')

    const health = criticalAlerts.length > 0 ? 'critical' : 
                  warningAlerts.length > 0 ? 'warning' : 'good'

    return {
      metrics: metricStats,
      alerts: {
        active: activeAlerts.length,
        resolved: this.alerts.filter(a => a.resolved).length
      },
      health,
      recommendations: this.generateRecommendations(metricStats, activeAlerts)
    }
  }

  /**
   * Get recent performance samples
   */
  getRecentSamples(count: number = 50): PerformanceSample[] {
    return this.samples.slice(-count)
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
    }
  }

  /**
   * Get performance trends
   */
  getTrends(metricName: string, period: number = 5 * 60 * 1000): {
    trend: 'up' | 'down' | 'stable'
    change: number
    confidence: number
  } {
    const history = this.metrics.get(metricName)
    if (!history || history.length < 3) {
      return { trend: 'stable', change: 0, confidence: 0 }
    }

    const cutoff = Date.now() - period
    const recentMetrics = history.filter(m => m.timestamp > cutoff)
    
    if (recentMetrics.length < 2) {
      return { trend: 'stable', change: 0, confidence: 0 }
    }

    const first = recentMetrics[0].value
    const last = recentMetrics[recentMetrics.length - 1].value
    const change = ((last - first) / first) * 100

    const trend = Math.abs(change) < 5 ? 'stable' : 
                  change > 0 ? 'up' : 'down'

    const confidence = Math.min(100, recentMetrics.length * 10) // More samples = higher confidence

    return { trend, change, confidence }
  }

  /**
   * Private methods
   */
  private getLatestMetric(name: string): PerformanceMetric | undefined {
    const history = this.metrics.get(name)
    return history && history.length > 0 ? history[history.length - 1] : undefined
  }

  private checkThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return

    const { warning, critical } = metric.threshold
    let severity: 'warning' | 'critical' | null = null

    if (metric.value >= critical) {
      severity = 'critical'
    } else if (metric.value >= warning) {
      severity = 'warning'
    }

    if (severity) {
      const alertId = `${metric.name}_${metric.timestamp}`
      const alert: PerformanceAlert = {
        id: alertId,
        severity,
        message: this.generateAlertMessage(metric, severity),
        metric: metric.name,
        value: metric.value,
        threshold: severity === 'critical' ? critical : warning,
        timestamp: metric.timestamp,
        resolved: false
      }

      this.alerts.push(alert)
      this.notifyAlert(alert)
    }
  }

  private generateAlertMessage(metric: PerformanceMetric, severity: 'warning' | 'critical'): string {
    const value = metric.unit === 'bytes' ? this.formatBytes(metric.value) : 
                  metric.unit === 'ms' ? `${metric.value.toFixed(1)}ms` :
                  metric.unit === 'percentage' ? `${metric.value.toFixed(1)}%` :
                  metric.value.toString()

    return `${severity.toUpperCase()}: ${metric.name} is ${value}`
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  private getTimingThreshold(operation: string): { warning: number; critical: number } {
    const thresholds: Record<string, { warning: number; critical: number }> = {
      queue_cleanup: { warning: 100, critical: 500 },
      sync_batch: { warning: 2000, critical: 5000 },
      cache_get: { warning: 50, critical: 200 },
      cache_set: { warning: 20, critical: 100 },
      storage_read: { warning: 100, critical: 300 },
      storage_write: { warning: 50, critical: 200 }
    }

    return thresholds[operation] || { warning: 1000, critical: 3000 }
  }

  private getSyncTimingThreshold(batchSize: number): { warning: number; critical: number } {
    // Adjust thresholds based on batch size
    const baseWarning = 1000 + (batchSize * 100)
    const baseCritical = 3000 + (batchSize * 200)
    
    return { warning: baseWarning, critical: baseCritical }
  }

  private generateRecommendations(
    metrics: Record<string, any>, 
    alerts: PerformanceAlert[]
  ): string[] {
    const recommendations: string[] = []

    // Memory recommendations
    const heapUsage = metrics.heap_used?.current || 0
    if (heapUsage > 75 * 1024 * 1024) { // 75MB
      recommendations.push('Consider reducing queue size or implementing more aggressive cleanup')
    }

    // Cache recommendations
    const hitRate = metrics.cache_hit_rate?.current || 0
    if (hitRate < 70) {
      recommendations.push('Cache hit rate is low - consider adjusting TTL settings or preloading strategies')
    }

    // Sync recommendations
    const syncSuccessRate = metrics.sync_success_rate?.current || 100
    if (syncSuccessRate < 90) {
      recommendations.push('Sync success rate is low - check network connectivity and error handling')
    }

    // Alert-based recommendations
    alerts.forEach(alert => {
      if (alert.metric.includes('memory') && alert.severity === 'critical') {
        recommendations.push('Memory usage is critical - restart application or clear caches')
      }
      if (alert.metric.includes('sync') && alert.severity === 'warning') {
        recommendations.push('Sync performance is degraded - consider reducing batch size or sync frequency')
      }
    })

    return recommendations
  }

  private notifyAlert(alert: PerformanceAlert): void {
    this.listeners.forEach(listener => {
      try {
        listener(alert)
      } catch (error) {
        console.error('Performance alert listener error:', error)
      }
    })
  }

  private startMemoryMonitoring(): void {
    this.memoryWatcher = setInterval(() => {
      this.recordMemoryUsage('system')
      this.takeSample()
    }, 10000) // Every 10 seconds
  }

  private startAlertProcessing(): void {
    this.alertProcessor = setInterval(() => {
      // Auto-resolve old alerts if conditions are no longer met
      const now = Date.now()
      const maxAge = 5 * 60 * 1000 // 5 minutes

      this.alerts.forEach(alert => {
        if (!alert.resolved && now - alert.timestamp > maxAge) {
          const currentMetric = this.getLatestMetric(alert.metric)
          if (currentMetric && currentMetric.value < alert.threshold) {
            alert.resolved = true
          }
        }
      })

      // Clean up old resolved alerts
      const keepAfter = now - (24 * 60 * 60 * 1000) // 24 hours
      this.alerts = this.alerts.filter(alert => 
        !alert.resolved || alert.timestamp > keepAfter
      )
    }, 60000) // Every minute
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.memoryWatcher) {
      clearInterval(this.memoryWatcher)
      this.memoryWatcher = null
    }
    if (this.alertProcessor) {
      clearInterval(this.alertProcessor)
      this.alertProcessor = null
    }
    this.listeners.clear()
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

export function destroyPerformanceMonitor(): void {
  if (performanceMonitor) {
    performanceMonitor.destroy()
    performanceMonitor = null
  }
}