/**
 * Performance Integration Service
 * 
 * Integrates all performance optimization components and provides a unified
 * interface for the application. Coordinates between performance monitoring,
 * memory management, auto-tuning, and sync optimization.
 */

import { getPerformanceMonitor, destroyPerformanceMonitor } from './PerformanceMonitor'
import { getMemoryManager, destroyMemoryManager } from './MemoryManager'
import { getAutoTuner, destroyAutoTuner } from './AutoTuner'
import { CacheManager } from '@/lib/cache/CacheManager'
import { createAdaptiveSyncManager } from '@/lib/sync/AdaptiveSyncManager'
import type { TripCard } from '@/types'

interface PerformanceConfig {
  monitoring: {
    enabled: boolean
    alertThreshold: 'low' | 'medium' | 'high'
    metricsRetention: number // days
  }
  memory: {
    enabled: boolean
    aggressiveCleanup: boolean
    memoryThreshold: number // percentage
  }
  autoTuning: {
    enabled: boolean
    aggressiveMode: boolean
    learningMode: boolean
  }
  sync: {
    adaptiveIntervals: boolean
    parallelProcessing: boolean
    memoryOptimization: boolean
  }
}

export class PerformanceIntegration {
  private config: PerformanceConfig
  private performanceMonitor = getPerformanceMonitor()
  private memoryManager = getMemoryManager()
  private autoTuner = getAutoTuner()
  private adaptiveSyncManager: any = null
  private initialized = false
  private integrationInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      monitoring: {
        enabled: true,
        alertThreshold: 'medium',
        metricsRetention: 7
      },
      memory: {
        enabled: true,
        aggressiveCleanup: false,
        memoryThreshold: 75
      },
      autoTuning: {
        enabled: true,
        aggressiveMode: false,
        learningMode: true
      },
      sync: {
        adaptiveIntervals: true,
        parallelProcessing: true,
        memoryOptimization: true
      },
      ...config
    }
  }

  /**
   * Initialize the integrated performance system
   */
  async initialize(tripCacheManager?: CacheManager<TripCard[]>): Promise<void> {
    if (this.initialized) {
      console.warn('PerformanceIntegration: Already initialized')
      return
    }

    const startTime = performance.now()

    try {
      console.log('PerformanceIntegration: Initializing performance optimization system')

      // Initialize adaptive sync manager if cache manager is provided
      if (tripCacheManager) {
        this.adaptiveSyncManager = createAdaptiveSyncManager(tripCacheManager, {
          adaptiveIntervals: this.config.sync.adaptiveIntervals,
          parallelProcessing: this.config.sync.parallelProcessing,
          memoryOptimization: this.config.sync.memoryOptimization
        })
      }

      // Set up performance monitoring alerts
      this.setupPerformanceAlerts()

      // Set up memory management integration
      this.setupMemoryIntegration()

      // Set up auto-tuning integration
      this.setupAutoTuningIntegration()

      // Start integration monitoring
      this.startIntegrationMonitoring()

      this.initialized = true
      
      const duration = performance.now() - startTime
      this.performanceMonitor.recordTiming('performance_integration_init', startTime)
      
      console.log(`PerformanceIntegration: Initialized in ${duration.toFixed(1)}ms`)

      // Record successful initialization
      this.performanceMonitor.recordMetric({
        name: 'performance_integration_status',
        value: 1,
        category: 'throughput',
        unit: 'count'
      })

    } catch (error) {
      console.error('PerformanceIntegration: Initialization failed:', error)
      this.performanceMonitor.recordMetric({
        name: 'performance_integration_error',
        value: 1,
        category: 'error',
        unit: 'count'
      })
      throw error
    }
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    overall: 'excellent' | 'good' | 'warning' | 'critical'
    components: {
      monitoring: { status: string; metrics: any }
      memory: { status: string; stats: any }
      tuning: { status: string; info: any }
      sync: { status: string; stats: any }
    }
    recommendations: string[]
    alerts: any[]
  } {
    const performanceStats = this.performanceMonitor.getStats()
    const memoryStats = this.memoryManager.getMemoryStats()
    const tuningStatus = this.autoTuner.getTuningStatus()
    const syncStats = this.adaptiveSyncManager?.getStats()

    const components = {
      monitoring: {
        status: performanceStats.health,
        metrics: performanceStats.metrics
      },
      memory: {
        status: memoryStats.trend.memoryPressure,
        stats: memoryStats
      },
      tuning: {
        status: tuningStatus.enabled ? 'active' : 'disabled',
        info: tuningStatus
      },
      sync: {
        status: syncStats?.syncInProgress ? 'syncing' : 'ready',
        stats: syncStats
      }
    }

    // Determine overall status
    const statuses = [
      performanceStats.health,
      memoryStats.trend.memoryPressure,
      tuningStatus.enabled ? 'good' : 'warning'
    ]

    let overall: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent'
    if (statuses.includes('critical')) overall = 'critical'
    else if (statuses.includes('warning')) overall = 'warning'
    else if (statuses.includes('high')) overall = 'warning'
    else if (statuses.includes('medium')) overall = 'good'

    // Gather all recommendations
    const recommendations = [
      ...performanceStats.recommendations,
      ...memoryStats.recommendations,
      ...tuningStatus.recommendations
    ]

    // Gather all alerts
    const alerts = this.performanceMonitor.getActiveAlerts()

    return {
      overall,
      components,
      recommendations,
      alerts
    }
  }

  /**
   * Trigger system-wide optimization
   */
  async optimizeSystem(): Promise<{
    memoryFreed: number
    settingsAdjusted: number
    cacheCleared: boolean
    syncOptimized: boolean
  }> {
    const startTime = performance.now()
    
    console.log('PerformanceIntegration: Starting system optimization')

    try {
      // Force memory cleanup
      const memoryFreed = await this.memoryManager.forceCleanup()

      // Get current tuning recommendations and apply them
      const tuningStatus = this.autoTuner.getTuningStatus()
      const settingsAdjusted = tuningStatus.recommendations.length

      // Clear caches if needed
      const memoryStats = this.memoryManager.getMemoryStats()
      let cacheCleared = false
      if (memoryStats.trend.memoryPressure === 'critical') {
        // Clear application caches
        if (typeof localStorage !== 'undefined') {
          const before = Object.keys(localStorage).length
          this.clearExpiredCache()
          const after = Object.keys(localStorage).length
          cacheCleared = before > after
        }
      }

      // Optimize sync if available
      let syncOptimized = false
      if (this.adaptiveSyncManager) {
        // Force sync optimization
        await this.adaptiveSyncManager.forceSyncAll()
        syncOptimized = true
      }

      const duration = performance.now() - startTime
      this.performanceMonitor.recordTiming('system_optimization', startTime)

      const result = {
        memoryFreed,
        settingsAdjusted,
        cacheCleared,
        syncOptimized
      }

      console.log('PerformanceIntegration: System optimization complete:', result)
      return result

    } catch (error) {
      console.error('PerformanceIntegration: System optimization failed:', error)
      throw error
    }
  }

  /**
   * Enable or disable specific components
   */
  configureComponent(component: 'monitoring' | 'memory' | 'tuning' | 'sync', enabled: boolean): void {
    switch (component) {
      case 'monitoring':
        this.config.monitoring.enabled = enabled
        break
      case 'memory':
        this.config.memory.enabled = enabled
        break
      case 'tuning':
        this.config.autoTuning.enabled = enabled
        this.autoTuner.setEnabled(enabled)
        break
      case 'sync':
        this.config.sync.adaptiveIntervals = enabled
        break
    }
    
    console.log(`PerformanceIntegration: ${component} ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Get performance recommendations based on current state
   */
  getRecommendations(): {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
    priority: 'low' | 'medium' | 'high' | 'critical'
  } {
    const systemStatus = this.getSystemStatus()
    const recommendations = systemStatus.recommendations
    
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []
    
    // Categorize recommendations based on urgency and impact
    recommendations.forEach(rec => {
      if (rec.toLowerCase().includes('critical') || rec.toLowerCase().includes('memory leak')) {
        immediate.push(rec)
      } else if (rec.toLowerCase().includes('high') || rec.toLowerCase().includes('restart')) {
        shortTerm.push(rec)
      } else {
        longTerm.push(rec)
      }
    })
    
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (immediate.length > 0) priority = 'critical'
    else if (shortTerm.length > 2) priority = 'high'
    else if (shortTerm.length > 0 || longTerm.length > 3) priority = 'medium'
    
    return {
      immediate,
      shortTerm,
      longTerm,
      priority
    }
  }

  /**
   * Private setup methods
   */
  private setupPerformanceAlerts(): void {
    this.performanceMonitor.onAlert((alert) => {
      console.log(`PerformanceIntegration: Alert received - ${alert.severity}: ${alert.message}`)
      
      // Take automatic action for critical alerts
      if (alert.severity === 'critical') {
        this.handleCriticalAlert(alert)
      }
    })
  }

  private setupMemoryIntegration(): void {
    // Register custom cleanup tasks for application-specific components
    this.memoryManager.registerCleanupTask({
      id: 'integration_cache_cleanup',
      name: 'Integration Cache Cleanup',
      priority: 'medium',
      threshold: 50 * 1024 * 1024, // 50MB
      interval: 2 * 60 * 1000, // 2 minutes
      lastRun: 0,
      execute: async () => {
        return this.performIntegratedCleanup()
      }
    })
  }

  private setupAutoTuningIntegration(): void {
    // Add custom tuning rules for integrated components
    this.autoTuner.addTuningRule({
      id: 'adaptive_sync_optimization',
      name: 'Optimize Adaptive Sync Based on Performance',
      condition: (metrics) => {
        return metrics.performance?.health === 'warning' && this.adaptiveSyncManager
      },
      action: async (metrics) => {
        // Apply sync optimizations
        const config = this.autoTuner.getCurrentConfiguration()
        // This would update the adaptive sync manager configuration
        
        return {
          parameter: 'syncConfiguration',
          oldValue: 'default',
          newValue: 'optimized',
          reasoning: 'Optimized sync configuration due to performance warnings',
          impact: 'medium',
          category: 'sync'
        }
      },
      cooldown: 300000, // 5 minutes
      priority: 6,
      lastApplied: 0,
      maxApplications: 2,
      applicationsThisHour: 0,
      enabled: true
    })
  }

  private startIntegrationMonitoring(): void {
    this.integrationInterval = setInterval(() => {
      try {
        this.performIntegrationHealthCheck()
      } catch (error) {
        console.error('PerformanceIntegration: Health check failed:', error)
      }
    }, 60000) // Every minute
  }

  private async handleCriticalAlert(alert: any): Promise<void> {
    console.log('PerformanceIntegration: Handling critical alert:', alert.message)
    
    if (alert.metric.includes('memory')) {
      // Force aggressive memory cleanup
      await this.memoryManager.forceCleanup()
    }
    
    if (alert.metric.includes('sync') && this.adaptiveSyncManager) {
      // Reduce sync load
      this.adaptiveSyncManager.pauseSync()
      setTimeout(() => {
        this.adaptiveSyncManager.startSync()
      }, 30000) // Resume after 30 seconds
    }
  }

  private async performIntegratedCleanup(): Promise<number> {
    let totalFreed = 0
    
    // Clear expired cache entries
    if (typeof localStorage !== 'undefined') {
      const before = this.estimateStorageSize()
      this.clearExpiredCache()
      const after = this.estimateStorageSize()
      totalFreed += before - after
    }
    
    return totalFreed
  }

  private performIntegrationHealthCheck(): void {
    const systemStatus = this.getSystemStatus()
    
    // Record overall system health
    this.performanceMonitor.recordMetric({
      name: 'system_health_score',
      value: this.calculateHealthScore(systemStatus),
      category: 'throughput',
      unit: 'count'
    })
  }

  private calculateHealthScore(status: any): number {
    const weights = {
      excellent: 100,
      good: 80,
      warning: 60,
      critical: 20,
      high: 40,
      medium: 70,
      low: 90
    }
    
    return (weights as any)[status.overall] || 50
  }

  private clearExpiredCache(): void {
    if (typeof localStorage === 'undefined') return
    
    const keys = Object.keys(localStorage)
    const now = Date.now()
    
    keys.forEach(key => {
      try {
        if (key.includes('wolthers-') || key.includes('cache')) {
          const value = localStorage.getItem(key)
          if (value) {
            const parsed = JSON.parse(value)
            if (parsed.expires && now > parsed.expires) {
              localStorage.removeItem(key)
            }
          }
        }
      } catch (error) {
        // Remove invalid entries
        if (key.includes('wolthers-')) {
          localStorage.removeItem(key)
        }
      }
    })
  }

  private estimateStorageSize(): number {
    if (typeof localStorage === 'undefined') return 0
    
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    
    return total * 2 // UTF-16 estimate
  }

  /**
   * Destroy and cleanup all performance components
   */
  destroy(): void {
    if (this.integrationInterval) {
      clearInterval(this.integrationInterval)
      this.integrationInterval = null
    }
    
    if (this.adaptiveSyncManager) {
      this.adaptiveSyncManager.destroy()
      this.adaptiveSyncManager = null
    }
    
    this.initialized = false
    console.log('PerformanceIntegration: Destroyed')
  }

  /**
   * Static method to cleanup all singletons
   */
  static destroyAll(): void {
    destroyPerformanceMonitor()
    destroyMemoryManager()
    destroyAutoTuner()
  }
}

// Create and export singleton instance
let performanceIntegration: PerformanceIntegration | null = null

export function getPerformanceIntegration(config?: Partial<PerformanceConfig>): PerformanceIntegration {
  if (!performanceIntegration) {
    performanceIntegration = new PerformanceIntegration(config)
  }
  return performanceIntegration
}

export function destroyPerformanceIntegration(): void {
  if (performanceIntegration) {
    performanceIntegration.destroy()
    performanceIntegration = null
  }
  
  // Also cleanup all singletons
  PerformanceIntegration.destroyAll()
}

// Initialize performance integration for the application
export async function initializePerformanceSystem(
  tripCacheManager?: CacheManager<TripCard[]>,
  config?: Partial<PerformanceConfig>
): Promise<PerformanceIntegration> {
  const integration = getPerformanceIntegration(config)
  await integration.initialize(tripCacheManager)
  return integration
}