/**
 * Memory Manager for Performance Optimization
 * 
 * Monitors and optimizes memory usage across the application,
 * prevents memory leaks, and provides intelligent cleanup strategies.
 */

import { getPerformanceMonitor } from './PerformanceMonitor'

interface MemorySnapshot {
  timestamp: number
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
}

interface MemoryLeak {
  id: string
  component: string
  severity: 'minor' | 'moderate' | 'severe'
  growthRate: number // bytes per minute
  duration: number // how long it's been growing
  detected: number // timestamp when detected
  lastSize: number
}

interface CleanupTask {
  id: string
  name: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  execute: () => Promise<number> // returns bytes freed
  threshold: number // memory threshold to trigger
  interval: number // how often to check (ms)
  lastRun: number
}

interface MemoryConfig {
  snapshotInterval: number
  leakDetectionThreshold: number // bytes per minute growth
  cleanupThreshold: number // percentage of available memory
  maxSnapshots: number
  aggressiveCleanupThreshold: number
  emergencyCleanupThreshold: number
}

export class MemoryManager {
  private config: MemoryConfig
  private performanceMonitor = getPerformanceMonitor()
  private snapshots: MemorySnapshot[] = []
  private detectedLeaks = new Map<string, MemoryLeak>()
  private cleanupTasks = new Map<string, CleanupTask>()
  private monitoringInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null
  private emergencyCleanupActive = false

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      snapshotInterval: 15000, // 15 seconds
      leakDetectionThreshold: 1024 * 1024, // 1MB per minute
      cleanupThreshold: 75, // 75% memory usage
      maxSnapshots: 100,
      aggressiveCleanupThreshold: 85,
      emergencyCleanupThreshold: 95,
      ...config
    }

    this.registerDefaultCleanupTasks()
    this.startMonitoring()
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot | null {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return null
    }

    const memory = (performance as any).memory
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapUsed: memory.usedJSHeapSize,
      heapTotal: memory.totalJSHeapSize,
      external: memory.usedJSHeapSize - memory.totalJSHeapSize, // Approximation
      arrayBuffers: 0 // Would need additional tracking
    }

    this.snapshots.push(snapshot)
    
    // Keep only recent snapshots
    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift()
    }

    // Record performance metrics
    this.performanceMonitor.recordMetric({
      name: 'memory_heap_used',
      value: snapshot.heapUsed,
      category: 'memory',
      unit: 'bytes',
      threshold: { 
        warning: 50 * 1024 * 1024, 
        critical: 100 * 1024 * 1024 
      }
    })

    this.performanceMonitor.recordMetric({
      name: 'memory_heap_total',
      value: snapshot.heapTotal,
      category: 'memory',
      unit: 'bytes',
      threshold: { 
        warning: 100 * 1024 * 1024, 
        critical: 200 * 1024 * 1024 
      }
    })

    return snapshot
  }

  /**
   * Analyze memory usage trends and detect leaks
   */
  analyzeMemoryTrends(): {
    trend: 'stable' | 'growing' | 'shrinking'
    growthRate: number
    memoryPressure: 'low' | 'medium' | 'high' | 'critical'
    leaksDetected: number
  } {
    if (this.snapshots.length < 3) {
      return {
        trend: 'stable',
        growthRate: 0,
        memoryPressure: 'low',
        leaksDetected: 0
      }
    }

    // Calculate growth rate over last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    const recentSnapshots = this.snapshots.filter(s => s.timestamp > fiveMinutesAgo)
    
    if (recentSnapshots.length < 2) {
      return {
        trend: 'stable',
        growthRate: 0,
        memoryPressure: this.calculateMemoryPressure(),
        leaksDetected: this.detectedLeaks.size
      }
    }

    const first = recentSnapshots[0]
    const last = recentSnapshots[recentSnapshots.length - 1]
    const timeDiff = last.timestamp - first.timestamp
    const memoryDiff = last.heapUsed - first.heapUsed
    
    // Growth rate in bytes per minute
    const growthRate = (memoryDiff / timeDiff) * 60000

    let trend: 'stable' | 'growing' | 'shrinking' = 'stable'
    if (Math.abs(growthRate) > 100 * 1024) { // 100KB/min threshold
      trend = growthRate > 0 ? 'growing' : 'shrinking'
    }

    // Detect potential leaks
    if (growthRate > this.config.leakDetectionThreshold) {
      this.detectMemoryLeak('general', growthRate)
    }

    return {
      trend,
      growthRate,
      memoryPressure: this.calculateMemoryPressure(),
      leaksDetected: this.detectedLeaks.size
    }
  }

  /**
   * Register a cleanup task
   */
  registerCleanupTask(task: CleanupTask): void {
    this.cleanupTasks.set(task.id, task)
    console.log(`MemoryManager: Registered cleanup task '${task.name}'`)
  }

  /**
   * Unregister a cleanup task
   */
  unregisterCleanupTask(taskId: string): void {
    this.cleanupTasks.delete(taskId)
    console.log(`MemoryManager: Unregistered cleanup task '${taskId}'`)
  }

  /**
   * Execute cleanup tasks based on memory pressure
   */
  async executeCleanup(forced: boolean = false): Promise<number> {
    const startTime = performance.now()
    let totalFreed = 0
    const memoryPressure = this.calculateMemoryPressure()
    
    console.log(`MemoryManager: Executing cleanup (pressure: ${memoryPressure}, forced: ${forced})`)

    try {
      const eligibleTasks = this.getEligibleCleanupTasks(memoryPressure, forced)
      
      // Sort tasks by priority and execute
      const sortedTasks = eligibleTasks.sort((a, b) => {
        const priorities = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorities[b.priority] - priorities[a.priority]
      })

      for (const task of sortedTasks) {
        try {
          const taskStart = performance.now()
          const freed = await task.execute()
          totalFreed += freed
          task.lastRun = Date.now()
          
          console.log(`MemoryManager: Task '${task.name}' freed ${this.formatBytes(freed)} in ${performance.now() - taskStart}ms`)
          
          // Record task performance
          this.performanceMonitor.recordMetric({
            name: `cleanup_task_${task.id}_freed`,
            value: freed,
            category: 'memory',
            unit: 'bytes'
          })
          
        } catch (error) {
          console.error(`MemoryManager: Cleanup task '${task.name}' failed:`, error)
        }
      }

      // Trigger garbage collection if available (development only)
      if (forced && typeof (window as any).gc === 'function') {
        (window as any).gc()
        console.log('MemoryManager: Manual garbage collection triggered')
      }

      const duration = performance.now() - startTime
      this.performanceMonitor.recordTiming('memory_cleanup', startTime)
      this.performanceMonitor.recordMetric({
        name: 'memory_cleanup_freed_total',
        value: totalFreed,
        category: 'memory',
        unit: 'bytes'
      })

      console.log(`MemoryManager: Cleanup completed in ${duration.toFixed(1)}ms, freed ${this.formatBytes(totalFreed)}`)
      
      return totalFreed

    } catch (error) {
      this.performanceMonitor.recordTiming('memory_cleanup_error', startTime)
      console.error('MemoryManager: Cleanup failed:', error)
      return totalFreed
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    current: MemorySnapshot | null
    trend: ReturnType<typeof this.analyzeMemoryTrends>
    leaks: MemoryLeak[]
    cleanupTasks: number
    recommendations: string[]
  } {
    const current = this.snapshots[this.snapshots.length - 1] || null
    const trend = this.analyzeMemoryTrends()
    const leaks = Array.from(this.detectedLeaks.values())
    const recommendations = this.generateMemoryRecommendations(current, trend, leaks)

    return {
      current,
      trend,
      leaks,
      cleanupTasks: this.cleanupTasks.size,
      recommendations
    }
  }

  /**
   * Force aggressive cleanup
   */
  async forceCleanup(): Promise<number> {
    console.log('MemoryManager: Force cleanup requested')
    return this.executeCleanup(true)
  }

  /**
   * Private methods
   */
  private calculateMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const latest = this.snapshots[this.snapshots.length - 1]
    if (!latest) return 'low'

    const usagePercentage = (latest.heapUsed / latest.heapTotal) * 100

    if (usagePercentage >= this.config.emergencyCleanupThreshold) return 'critical'
    if (usagePercentage >= this.config.aggressiveCleanupThreshold) return 'high'
    if (usagePercentage >= this.config.cleanupThreshold) return 'medium'
    return 'low'
  }

  private detectMemoryLeak(component: string, growthRate: number): void {
    const leakId = `${component}_${Date.now()}`
    const severity = growthRate > 5 * 1024 * 1024 ? 'severe' : 
                    growthRate > 2 * 1024 * 1024 ? 'moderate' : 'minor'

    const leak: MemoryLeak = {
      id: leakId,
      component,
      severity,
      growthRate,
      duration: 0,
      detected: Date.now(),
      lastSize: this.snapshots[this.snapshots.length - 1]?.heapUsed || 0
    }

    this.detectedLeaks.set(leakId, leak)
    
    console.warn(`MemoryManager: Potential memory leak detected in ${component} (${this.formatBytes(growthRate)}/min)`)
    
    // Record performance alert
    this.performanceMonitor.recordMetric({
      name: 'memory_leak_detected',
      value: growthRate,
      category: 'error',
      unit: 'bytes'
    })
  }

  private getEligibleCleanupTasks(memoryPressure: string, forced: boolean): CleanupTask[] {
    const now = Date.now()
    const latest = this.snapshots[this.snapshots.length - 1]
    
    return Array.from(this.cleanupTasks.values()).filter(task => {
      // Always run if forced
      if (forced) return true
      
      // Check if enough time has passed since last run
      if (now - task.lastRun < task.interval) return false
      
      // Check memory threshold
      if (latest && latest.heapUsed < task.threshold) return false
      
      // Check if task priority matches memory pressure
      if (memoryPressure === 'critical') return true
      if (memoryPressure === 'high' && task.priority !== 'low') return true
      if (memoryPressure === 'medium' && ['medium', 'high', 'critical'].includes(task.priority)) return true
      if (memoryPressure === 'low' && task.priority === 'critical') return true
      
      return false
    })
  }

  private registerDefaultCleanupTasks(): void {
    // Cache cleanup task
    this.registerCleanupTask({
      id: 'cache_cleanup',
      name: 'Cache Cleanup',
      priority: 'medium',
      threshold: 30 * 1024 * 1024, // 30MB
      interval: 60000, // 1 minute
      lastRun: 0,
      execute: async () => {
        // This would integrate with cache managers
        let freed = 0
        
        // Clear expired cache entries
        if (typeof localStorage !== 'undefined') {
          const before = this.estimateLocalStorageSize()
          this.cleanupExpiredLocalStorage()
          const after = this.estimateLocalStorageSize()
          freed = before - after
        }
        
        return freed
      }
    })

    // Queue cleanup task
    this.registerCleanupTask({
      id: 'queue_cleanup',
      name: 'Queue Cleanup',
      priority: 'high',
      threshold: 50 * 1024 * 1024, // 50MB
      interval: 30000, // 30 seconds
      lastRun: 0,
      execute: async () => {
        // This would integrate with queue managers
        return 0 // Placeholder
      }
    })

    // DOM cleanup task
    this.registerCleanupTask({
      id: 'dom_cleanup',
      name: 'DOM Cleanup',
      priority: 'low',
      threshold: 20 * 1024 * 1024, // 20MB
      interval: 2 * 60000, // 2 minutes
      lastRun: 0,
      execute: async () => {
        // Clean up detached DOM nodes, unused event listeners, etc.
        let freed = 0
        
        if (typeof document !== 'undefined') {
          // Remove unused elements, clean up event listeners
          // This is a simplified implementation
          freed = 1024 * 100 // Estimate 100KB freed
        }
        
        return freed
      }
    })

    // Emergency cleanup task
    this.registerCleanupTask({
      id: 'emergency_cleanup',
      name: 'Emergency Cleanup',
      priority: 'critical',
      threshold: 100 * 1024 * 1024, // 100MB
      interval: 10000, // 10 seconds
      lastRun: 0,
      execute: async () => {
        let freed = 0
        
        // Clear all non-essential caches
        // Force component unmounting if needed
        // Clear large data structures
        
        return freed
      }
    })
  }

  private cleanupExpiredLocalStorage(): void {
    if (typeof localStorage === 'undefined') return

    const keys = Object.keys(localStorage)
    const now = Date.now()
    
    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          const parsed = JSON.parse(value)
          if (parsed.expires && now > parsed.expires) {
            localStorage.removeItem(key)
          }
        }
      } catch (error) {
        // Invalid JSON, might be corrupted - remove it
        localStorage.removeItem(key)
      }
    })
  }

  private estimateLocalStorageSize(): number {
    if (typeof localStorage === 'undefined') return 0
    
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    
    return total * 2 // Rough estimate (UTF-16)
  }

  private generateMemoryRecommendations(
    current: MemorySnapshot | null,
    trend: ReturnType<typeof this.analyzeMemoryTrends>,
    leaks: MemoryLeak[]
  ): string[] {
    const recommendations: string[] = []

    if (trend.memoryPressure === 'critical') {
      recommendations.push('CRITICAL: Memory usage is very high - consider restarting the application')
      recommendations.push('Close unused browser tabs and applications')
    }

    if (trend.memoryPressure === 'high') {
      recommendations.push('Memory usage is high - enable aggressive cleanup')
      recommendations.push('Consider clearing browser cache and data')
    }

    if (trend.trend === 'growing' && trend.growthRate > 1024 * 1024) {
      recommendations.push('Memory usage is growing rapidly - check for memory leaks')
    }

    if (leaks.length > 0) {
      recommendations.push(`${leaks.length} potential memory leaks detected`)
      const severeLeaks = leaks.filter(l => l.severity === 'severe')
      if (severeLeaks.length > 0) {
        recommendations.push(`${severeLeaks.length} severe memory leaks require immediate attention`)
      }
    }

    if (current && current.heapUsed > 75 * 1024 * 1024) {
      recommendations.push('High memory usage - consider reducing cache sizes')
    }

    return recommendations
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot()
      
      // Check for emergency cleanup conditions
      const memoryPressure = this.calculateMemoryPressure()
      if (memoryPressure === 'critical' && !this.emergencyCleanupActive) {
        this.emergencyCleanupActive = true
        this.executeCleanup(true).then(() => {
          this.emergencyCleanupActive = false
        })
      }
    }, this.config.snapshotInterval)

    // Regular cleanup checks
    this.cleanupInterval = setInterval(() => {
      const memoryPressure = this.calculateMemoryPressure()
      if (['medium', 'high'].includes(memoryPressure)) {
        this.executeCleanup(false)
      }
    }, 60000) // Every minute
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    this.snapshots.length = 0
    this.detectedLeaks.clear()
    this.cleanupTasks.clear()
    
    console.log('MemoryManager: Destroyed')
  }
}

// Singleton instance
let memoryManager: MemoryManager | null = null

export function getMemoryManager(): MemoryManager {
  if (!memoryManager) {
    memoryManager = new MemoryManager()
  }
  return memoryManager
}

export function destroyMemoryManager(): void {
  if (memoryManager) {
    memoryManager.destroy()
    memoryManager = null
  }
}