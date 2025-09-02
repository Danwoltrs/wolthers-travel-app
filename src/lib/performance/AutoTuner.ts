/**
 * Automatic Performance Tuning Service
 * 
 * Monitors system performance and automatically adjusts configuration
 * parameters to optimize performance based on real-time metrics and
 * usage patterns. Prevents performance degradation through proactive tuning.
 */

import { getPerformanceMonitor } from './PerformanceMonitor'
import { getMemoryManager } from './MemoryManager'

interface TuningRule {
  id: string
  name: string
  condition: (metrics: any) => boolean
  action: (metrics: any) => Promise<TuningAction>
  cooldown: number // Minimum time between applications (ms)
  priority: number // Higher number = higher priority
  lastApplied: number
  maxApplications: number // Max times this rule can be applied per hour
  applicationsThisHour: number
  enabled: boolean
}

interface TuningAction {
  parameter: string
  oldValue: any
  newValue: any
  reasoning: string
  impact: 'low' | 'medium' | 'high'
  category: 'performance' | 'memory' | 'sync' | 'cache'
}

interface TuningConfig {
  enabled: boolean
  aggressiveMode: boolean
  learningMode: boolean
  maxAdjustmentsPerHour: number
  performanceThreshold: number
  memoryThreshold: number
  syncThreshold: number
}

interface TuningHistory {
  timestamp: number
  action: TuningAction
  beforeMetrics: any
  afterMetrics: any
  success: boolean
  rollback?: boolean
}

export class AutoTuner {
  private config: TuningConfig
  private performanceMonitor = getPerformanceMonitor()
  private memoryManager = getMemoryManager()
  private tuningRules = new Map<string, TuningRule>()
  private tuningHistory: TuningHistory[] = []
  private tuningTimer: NodeJS.Timeout | null = null
  private adjustmentsThisHour = 0
  private hourlyResetTimer: NodeJS.Timeout | null = null
  
  private currentSettings = {
    syncInterval: 30000,
    batchSize: 10,
    cacheSize: 100,
    memoryThreshold: 75,
    compressionEnabled: false,
    parallelProcessing: true
  }

  constructor(config: Partial<TuningConfig> = {}) {
    this.config = {
      enabled: true,
      aggressiveMode: false,
      learningMode: true,
      maxAdjustmentsPerHour: 10,
      performanceThreshold: 2000, // 2 seconds
      memoryThreshold: 75, // 75%
      syncThreshold: 1000, // 1 second
      ...config
    }

    this.initializeTuningRules()
    this.startAutoTuning()
  }

  /**
   * Initialize predefined tuning rules
   */
  private initializeTuningRules(): void {
    // Memory optimization rules
    this.addTuningRule({
      id: 'reduce_cache_on_memory_pressure',
      name: 'Reduce Cache Size on Memory Pressure',
      condition: (metrics) => {
        return metrics.memory?.trend?.memoryPressure === 'high' && 
               this.currentSettings.cacheSize > 50
      },
      action: async (metrics) => {
        const newSize = Math.max(50, Math.floor(this.currentSettings.cacheSize * 0.8))
        const oldSize = this.currentSettings.cacheSize
        this.currentSettings.cacheSize = newSize
        
        return {
          parameter: 'cacheSize',
          oldValue: oldSize,
          newValue: newSize,
          reasoning: `Reduced cache size from ${oldSize} to ${newSize} due to high memory pressure`,
          impact: 'medium',
          category: 'memory'
        }
      },
      cooldown: 60000, // 1 minute
      priority: 8,
      lastApplied: 0,
      maxApplications: 3,
      applicationsThisHour: 0,
      enabled: true
    })

    this.addTuningRule({
      id: 'enable_compression_on_memory_pressure',
      name: 'Enable Compression on Memory Pressure',
      condition: (metrics) => {
        return metrics.memory?.trend?.memoryPressure === 'high' && 
               !this.currentSettings.compressionEnabled
      },
      action: async (metrics) => {
        this.currentSettings.compressionEnabled = true
        
        return {
          parameter: 'compressionEnabled',
          oldValue: false,
          newValue: true,
          reasoning: 'Enabled compression due to high memory pressure',
          impact: 'high',
          category: 'memory'
        }
      },
      cooldown: 300000, // 5 minutes
      priority: 7,
      lastApplied: 0,
      maxApplications: 1,
      applicationsThisHour: 0,
      enabled: true
    })

    // Sync performance rules
    this.addTuningRule({
      id: 'increase_sync_interval_slow_performance',
      name: 'Increase Sync Interval on Slow Performance',
      condition: (metrics) => {
        const avgSyncTime = metrics.performance?.metrics?.sync_operation_time?.average
        return avgSyncTime > this.config.performanceThreshold && 
               this.currentSettings.syncInterval < 60000
      },
      action: async (metrics) => {
        const newInterval = Math.min(60000, this.currentSettings.syncInterval * 1.5)
        const oldInterval = this.currentSettings.syncInterval
        this.currentSettings.syncInterval = newInterval
        
        return {
          parameter: 'syncInterval',
          oldValue: oldInterval,
          newValue: newInterval,
          reasoning: `Increased sync interval from ${oldInterval}ms to ${newInterval}ms due to slow performance`,
          impact: 'medium',
          category: 'sync'
        }
      },
      cooldown: 120000, // 2 minutes
      priority: 6,
      lastApplied: 0,
      maxApplications: 3,
      applicationsThisHour: 0,
      enabled: true
    })

    this.addTuningRule({
      id: 'reduce_batch_size_slow_performance',
      name: 'Reduce Batch Size on Slow Performance',
      condition: (metrics) => {
        const avgSyncTime = metrics.performance?.metrics?.sync_batch_duration?.average
        return avgSyncTime > this.config.syncThreshold && 
               this.currentSettings.batchSize > 5
      },
      action: async (metrics) => {
        const newSize = Math.max(5, Math.floor(this.currentSettings.batchSize * 0.7))
        const oldSize = this.currentSettings.batchSize
        this.currentSettings.batchSize = newSize
        
        return {
          parameter: 'batchSize',
          oldValue: oldSize,
          newValue: newSize,
          reasoning: `Reduced batch size from ${oldSize} to ${newSize} due to slow sync performance`,
          impact: 'medium',
          category: 'sync'
        }
      },
      cooldown: 90000, // 1.5 minutes
      priority: 5,
      lastApplied: 0,
      maxApplications: 3,
      applicationsThisHour: 0,
      enabled: true
    })

    // Performance optimization rules
    this.addTuningRule({
      id: 'disable_parallel_processing_errors',
      name: 'Disable Parallel Processing on Errors',
      condition: (metrics) => {
        const errorRate = metrics.performance?.metrics?.sync_error_rate?.current || 0
        return errorRate > 10 && this.currentSettings.parallelProcessing
      },
      action: async (metrics) => {
        this.currentSettings.parallelProcessing = false
        
        return {
          parameter: 'parallelProcessing',
          oldValue: true,
          newValue: false,
          reasoning: 'Disabled parallel processing due to high error rate',
          impact: 'high',
          category: 'performance'
        }
      },
      cooldown: 300000, // 5 minutes
      priority: 9,
      lastApplied: 0,
      maxApplications: 1,
      applicationsThisHour: 0,
      enabled: true
    })

    // Recovery rules
    this.addTuningRule({
      id: 'restore_cache_size_good_memory',
      name: 'Restore Cache Size on Good Memory Conditions',
      condition: (metrics) => {
        return metrics.memory?.trend?.memoryPressure === 'low' && 
               this.currentSettings.cacheSize < 100
      },
      action: async (metrics) => {
        const newSize = Math.min(100, Math.floor(this.currentSettings.cacheSize * 1.2))
        const oldSize = this.currentSettings.cacheSize
        this.currentSettings.cacheSize = newSize
        
        return {
          parameter: 'cacheSize',
          oldValue: oldSize,
          newValue: newSize,
          reasoning: `Increased cache size from ${oldSize} to ${newSize} due to good memory conditions`,
          impact: 'low',
          category: 'memory'
        }
      },
      cooldown: 180000, // 3 minutes
      priority: 3,
      lastApplied: 0,
      maxApplications: 5,
      applicationsThisHour: 0,
      enabled: true
    })

    console.log(`AutoTuner: Initialized ${this.tuningRules.size} tuning rules`)
  }

  /**
   * Add a custom tuning rule
   */
  addTuningRule(rule: TuningRule): void {
    this.tuningRules.set(rule.id, rule)
  }

  /**
   * Remove a tuning rule
   */
  removeTuningRule(ruleId: string): void {
    this.tuningRules.delete(ruleId)
  }

  /**
   * Start automatic tuning
   */
  private startAutoTuning(): void {
    if (!this.config.enabled) return

    this.tuningTimer = setInterval(async () => {
      try {
        await this.performTuningCycle()
      } catch (error) {
        console.error('AutoTuner: Tuning cycle failed:', error)
      }
    }, 30000) // Run every 30 seconds

    // Reset hourly counters
    this.hourlyResetTimer = setInterval(() => {
      this.adjustmentsThisHour = 0
      this.tuningRules.forEach(rule => {
        rule.applicationsThisHour = 0
      })
    }, 60 * 60 * 1000) // Every hour

    console.log('AutoTuner: Started automatic performance tuning')
  }

  /**
   * Perform a tuning cycle
   */
  private async performTuningCycle(): Promise<void> {
    if (this.adjustmentsThisHour >= this.config.maxAdjustmentsPerHour) {
      return // Don't exceed hourly limit
    }

    // Gather current metrics
    const metrics = this.gatherMetrics()
    
    // Find applicable rules
    const applicableRules = this.findApplicableRules(metrics)
    
    if (applicableRules.length === 0) {
      return // No rules to apply
    }

    // Sort by priority and apply the highest priority rule
    const rule = applicableRules.sort((a, b) => b.priority - a.priority)[0]
    
    console.log(`AutoTuner: Applying rule '${rule.name}'`)
    
    // Record metrics before tuning
    const beforeMetrics = this.gatherMetrics()
    
    try {
      // Apply the tuning action
      const action = await rule.action(metrics)
      
      // Update rule tracking
      rule.lastApplied = Date.now()
      rule.applicationsThisHour++
      this.adjustmentsThisHour++
      
      // Record the action
      const historyEntry: TuningHistory = {
        timestamp: Date.now(),
        action,
        beforeMetrics,
        afterMetrics: null, // Will be filled later
        success: true,
        rollback: false
      }
      
      this.tuningHistory.push(historyEntry)
      
      // Wait a bit for the change to take effect
      setTimeout(async () => {
        const afterMetrics = this.gatherMetrics()
        historyEntry.afterMetrics = afterMetrics
        
        // Evaluate if the tuning was successful
        const success = this.evaluateTuningSuccess(beforeMetrics, afterMetrics, action)
        historyEntry.success = success
        
        if (!success && this.shouldRollback(action)) {
          await this.rollbackTuning(action, historyEntry)
        }
      }, 60000) // Wait 1 minute to evaluate
      
      console.log(`AutoTuner: Applied ${action.parameter} change: ${action.oldValue} → ${action.newValue}`)
      console.log(`AutoTuner: Reasoning: ${action.reasoning}`)
      
    } catch (error) {
      console.error(`AutoTuner: Failed to apply rule '${rule.name}':`, error)
    }
  }

  /**
   * Gather current performance metrics
   */
  private gatherMetrics(): any {
    try {
      const performanceStats = this.performanceMonitor.getStats()
      const memoryStats = this.memoryManager.getMemoryStats()
      
      return {
        timestamp: Date.now(),
        performance: performanceStats,
        memory: memoryStats,
        settings: { ...this.currentSettings }
      }
    } catch (error) {
      console.error('AutoTuner: Failed to gather metrics:', error)
      return { timestamp: Date.now() }
    }
  }

  /**
   * Find applicable tuning rules
   */
  private findApplicableRules(metrics: any): TuningRule[] {
    const now = Date.now()
    
    return Array.from(this.tuningRules.values()).filter(rule => {
      // Check if rule is enabled
      if (!rule.enabled) return false
      
      // Check cooldown
      if (now - rule.lastApplied < rule.cooldown) return false
      
      // Check hourly application limit
      if (rule.applicationsThisHour >= rule.maxApplications) return false
      
      // Check condition
      try {
        return rule.condition(metrics)
      } catch (error) {
        console.error(`AutoTuner: Rule condition failed for '${rule.name}':`, error)
        return false
      }
    })
  }

  /**
   * Evaluate if tuning was successful
   */
  private evaluateTuningSuccess(before: any, after: any, action: TuningAction): boolean {
    if (!before || !after) return false
    
    try {
      switch (action.category) {
        case 'memory':
          return this.evaluateMemoryImprovement(before, after)
        case 'performance':
          return this.evaluatePerformanceImprovement(before, after)
        case 'sync':
          return this.evaluateSyncImprovement(before, after)
        default:
          return true // Assume success for unknown categories
      }
    } catch (error) {
      console.error('AutoTuner: Failed to evaluate tuning success:', error)
      return false
    }
  }

  /**
   * Check if tuning should be rolled back
   */
  private shouldRollback(action: TuningAction): boolean {
    if (!this.config.learningMode) return false
    
    // Only rollback high-impact changes that failed
    return action.impact === 'high'
  }

  /**
   * Rollback a tuning change
   */
  private async rollbackTuning(action: TuningAction, historyEntry: TuningHistory): Promise<void> {
    try {
      console.log(`AutoTuner: Rolling back ${action.parameter} change`)
      
      // Restore the old value
      ;(this.currentSettings as any)[action.parameter] = action.oldValue
      
      // Mark as rollback in history
      historyEntry.rollback = true
      
      console.log(`AutoTuner: Rolled back ${action.parameter}: ${action.newValue} → ${action.oldValue}`)
      
    } catch (error) {
      console.error('AutoTuner: Rollback failed:', error)
    }
  }

  /**
   * Get current tuning status
   */
  getTuningStatus(): {
    enabled: boolean
    adjustmentsThisHour: number
    activeRules: number
    recentActions: TuningHistory[]
    currentSettings: any
    recommendations: string[]
  } {
    const recentActions = this.tuningHistory
      .slice(-10)
      .sort((a, b) => b.timestamp - a.timestamp)
    
    const recommendations = this.generateTuningRecommendations()
    
    return {
      enabled: this.config.enabled,
      adjustmentsThisHour: this.adjustmentsThisHour,
      activeRules: Array.from(this.tuningRules.values()).filter(r => r.enabled).length,
      recentActions,
      currentSettings: { ...this.currentSettings },
      recommendations
    }
  }

  /**
   * Enable or disable auto-tuning
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
    
    if (enabled) {
      this.startAutoTuning()
    } else {
      if (this.tuningTimer) {
        clearInterval(this.tuningTimer)
        this.tuningTimer = null
      }
    }
    
    console.log(`AutoTuner: ${enabled ? 'Enabled' : 'Disabled'} automatic tuning`)
  }

  /**
   * Private evaluation methods
   */
  private evaluateMemoryImprovement(before: any, after: any): boolean {
    const beforeUsage = before.memory?.current?.heapUsed || 0
    const afterUsage = after.memory?.current?.heapUsed || 0
    const improvement = beforeUsage - afterUsage
    
    // Consider it successful if memory usage decreased by at least 1MB or didn't increase significantly
    return improvement > 1024 * 1024 || improvement > -1024 * 512
  }

  private evaluatePerformanceImprovement(before: any, after: any): boolean {
    const beforeTime = before.performance?.metrics?.sync_operation_time?.average || 0
    const afterTime = after.performance?.metrics?.sync_operation_time?.average || 0
    
    // Consider it successful if performance improved or didn't degrade significantly
    return afterTime <= beforeTime * 1.1
  }

  private evaluateSyncImprovement(before: any, after: any): boolean {
    const beforeErrors = before.performance?.metrics?.sync_error_rate?.current || 0
    const afterErrors = after.performance?.metrics?.sync_error_rate?.current || 0
    
    // Consider it successful if error rate decreased or stayed the same
    return afterErrors <= beforeErrors
  }

  private generateTuningRecommendations(): string[] {
    const recommendations: string[] = []
    const metrics = this.gatherMetrics()
    
    // Check for opportunities
    const applicableRules = this.findApplicableRules(metrics)
    if (applicableRules.length > 0) {
      recommendations.push(`${applicableRules.length} tuning opportunities available`)
    }
    
    // Check for frequent adjustments
    if (this.adjustmentsThisHour > 5) {
      recommendations.push('High tuning frequency - consider adjusting thresholds')
    }
    
    // Check for failed tunings
    const recentFailures = this.tuningHistory
      .slice(-10)
      .filter(h => !h.success).length
    
    if (recentFailures > 2) {
      recommendations.push('Recent tuning failures detected - review rule conditions')
    }
    
    return recommendations
  }

  /**
   * Get current configuration that can be applied to sync managers
   */
  getCurrentConfiguration(): any {
    return { ...this.currentSettings }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.tuningTimer) {
      clearInterval(this.tuningTimer)
      this.tuningTimer = null
    }
    if (this.hourlyResetTimer) {
      clearInterval(this.hourlyResetTimer)
      this.hourlyResetTimer = null
    }
    
    this.tuningRules.clear()
    this.tuningHistory.length = 0
    
    console.log('AutoTuner: Destroyed')
  }
}

// Singleton instance
let autoTuner: AutoTuner | null = null

export function getAutoTuner(): AutoTuner {
  if (!autoTuner) {
    autoTuner = new AutoTuner()
  }
  return autoTuner
}

export function destroyAutoTuner(): void {
  if (autoTuner) {
    autoTuner.destroy()
    autoTuner = null
  }
}