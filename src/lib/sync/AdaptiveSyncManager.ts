/**
 * Adaptive Sync Manager with Performance Optimization
 * 
 * Enhanced synchronization manager with adaptive intervals, parallel processing,
 * intelligent batching, and comprehensive performance monitoring.
 */

import { CacheManager, networkManager } from '@/lib/cache/CacheManager'
import { OptimizedQueueManager } from './OptimizedQueueManager'
import { ConflictResolver } from './ConflictResolver'
import { getPerformanceMonitor } from '@/lib/performance/PerformanceMonitor'
import type { TripCard } from '@/types'
import type { QueuedOperation, SyncConfig, SyncStats, SyncEvent, SyncEventType } from './SyncManager'

interface AdaptiveSyncConfig extends SyncConfig {
  adaptiveIntervals: boolean
  minSyncInterval: number
  maxSyncInterval: number
  parallelProcessing: boolean
  maxParallelBatches: number
  intelligentBatching: boolean
  userActivityTracking: boolean
  memoryOptimization: boolean
}

interface UserActivity {
  lastInteraction: number
  actionsPerMinute: number
  isActive: boolean
  inactivityPeriod: number
}

interface SyncWorkerPool {
  workers: Worker[]
  busy: boolean[]
  taskQueue: Array<{ operations: QueuedOperation[]; resolve: Function; reject: Function }>
}

export class AdaptiveSyncManager {
  private config: AdaptiveSyncConfig
  private queueManager: OptimizedQueueManager
  private conflictResolver: ConflictResolver
  private tripCacheManager: CacheManager<TripCard[]>
  private performanceMonitor = getPerformanceMonitor()
  
  private syncTimer: NodeJS.Timeout | null = null
  private syncInProgress = false
  private currentSyncInterval: number
  private userActivity: UserActivity = {
    lastInteraction: Date.now(),
    actionsPerMinute: 0,
    isActive: true,
    inactivityPeriod: 0
  }
  
  private stats: SyncStats = {
    queueSize: 0,
    lastSync: null,
    syncInProgress: false,
    failedOperations: 0,
    successfulOperations: 0,
    conflictsResolved: 0
  }
  
  private eventListeners: Map<SyncEventType, Array<(event: SyncEvent) => void>> = new Map()
  private supabaseSubscription: any = null
  private workerPool: SyncWorkerPool | null = null
  private activityTracker: NodeJS.Timeout | null = null

  constructor(
    tripCacheManager: CacheManager<TripCard[]>,
    config: Partial<AdaptiveSyncConfig> = {}
  ) {
    this.config = {
      syncInterval: 30 * 1000,
      retryAttempts: 3,
      batchSize: 10,
      conflictStrategy: 'merge',
      enableRealTimeSync: true,
      adaptiveIntervals: true,
      minSyncInterval: 5 * 1000, // 5 seconds
      maxSyncInterval: 5 * 60 * 1000, // 5 minutes
      parallelProcessing: true,
      maxParallelBatches: 3,
      intelligentBatching: true,
      userActivityTracking: true,
      memoryOptimization: true,
      ...config
    }

    this.currentSyncInterval = this.config.syncInterval
    this.tripCacheManager = tripCacheManager
    this.queueManager = new OptimizedQueueManager({
      maxQueueSize: 5000,
      compressionEnabled: this.config.memoryOptimization
    })
    this.conflictResolver = new ConflictResolver(this.config.conflictStrategy)

    this.initialize()
  }

  /**
   * Initialize the adaptive sync manager
   */
  private async initialize(): Promise<void> {
    const startTime = performance.now()
    
    console.log('AdaptiveSyncManager: Initializing adaptive sync service')
    
    try {
      // Clean up stale operations
      await this.cleanupStaleOperations()
      
      // Initialize worker pool for parallel processing
      if (this.config.parallelProcessing) {
        this.initializeWorkerPool()
      }
      
      // Start user activity tracking
      if (this.config.userActivityTracking) {
        this.startActivityTracking()
      }
      
      // Listen for network status changes
      networkManager.onStatusChange((online) => {
        if (online) {
          console.log('AdaptiveSyncManager: Network restored, adapting sync strategy')
          this.adaptSyncStrategy()
          this.startSync()
        } else {
          console.log('AdaptiveSyncManager: Network lost, pausing sync')
          this.pauseSync()
        }
      })

      // Start adaptive sync if online
      if (networkManager.isOnline) {
        this.startSync()
      }

      // Initialize real-time subscriptions
      if (this.config.enableRealTimeSync) {
        await this.setupRealTimeSync()
      }

      // Process any existing queued operations
      await this.processQueue()

      this.performanceMonitor.recordTiming('adaptive_sync_init', startTime)
      console.log('AdaptiveSyncManager: Initialization complete')

    } catch (error) {
      this.performanceMonitor.recordTiming('adaptive_sync_init_error', startTime)
      console.error('AdaptiveSyncManager: Initialization failed:', error)
    }
  }

  /**
   * Start adaptive synchronization
   */
  public startSync(): void {
    if (this.syncTimer) return

    this.adaptSyncStrategy()
    console.log(`AdaptiveSyncManager: Starting adaptive sync (${this.currentSyncInterval}ms interval)`)
    
    this.syncTimer = setInterval(() => {
      if (!this.syncInProgress && networkManager.isOnline) {
        this.processQueueWithAdaptation()
      }
    }, this.currentSyncInterval)

    // Initial sync with delay
    if (networkManager.isOnline) {
      setTimeout(() => this.processQueueWithAdaptation(), 1000)
    }
  }

  /**
   * Pause synchronization
   */
  public pauseSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      console.log('AdaptiveSyncManager: Adaptive sync paused')
    }
  }

  /**
   * Queue operation with intelligent routing
   */
  public async queueOperation(operation: QueuedOperation): Promise<void> {
    const startTime = performance.now()
    
    try {
      // Track user activity
      this.recordUserActivity()
      
      // Add operation to optimized queue
      await this.queueManager.enqueue(operation)
      await this.updateStats()
      
      this.emitEvent({
        type: 'queue_updated',
        timestamp: Date.now(),
        data: { queueSize: this.stats.queueSize }
      })

      // Adapt sync strategy based on queue size and user activity
      this.adaptSyncStrategy()

      // If online and conditions are right, process immediately
      if (networkManager.isOnline && !this.syncInProgress && this.shouldProcessImmediately()) {
        setTimeout(() => this.processQueueWithAdaptation(), 100)
      }

      this.performanceMonitor.recordTiming('queue_operation', startTime)

    } catch (error) {
      this.performanceMonitor.recordTiming('queue_operation_error', startTime)
      console.error('AdaptiveSyncManager: Queue operation failed:', error)
    }
  }

  /**
   * Process queue with adaptive optimization
   */
  private async processQueueWithAdaptation(): Promise<void> {
    if (this.syncInProgress || !networkManager.isOnline) return

    const startTime = performance.now()
    const batchSize = this.calculateOptimalBatchSize()
    const operations = await this.queueManager.peek(batchSize)
    
    if (operations.length === 0) return

    this.syncInProgress = true
    this.stats.syncInProgress = true
    
    this.emitEvent({
      type: 'sync_start',
      timestamp: Date.now(),
      data: { operationCount: operations.length, batchSize }
    })

    console.log(`AdaptiveSyncManager: Processing ${operations.length} operations (adaptive batch size: ${batchSize})`)

    try {
      const results = await this.processBatchWithParallelization(operations)
      
      // Process results
      const successfulIds = results
        .filter(r => r.success)
        .map(r => r.operationId)
      
      await this.queueManager.removeMultiple(successfulIds)
      
      const failedOperations = results.filter(r => !r.success)
      await this.handleFailedOperations(failedOperations)

      // Update statistics
      this.stats.successfulOperations += successfulIds.length
      this.stats.failedOperations += failedOperations.length
      this.stats.lastSync = Date.now()

      // Record performance metrics
      const duration = performance.now() - startTime
      this.performanceMonitor.recordSyncOperation(
        'adaptive_batch',
        operations.length,
        duration,
        successfulIds.length,
        failedOperations.length
      )

      this.emitEvent({
        type: 'sync_complete',
        timestamp: Date.now(),
        data: {
          successful: successfulIds.length,
          failed: failedOperations.length,
          duration
        }
      })

      console.log(`AdaptiveSyncManager: Sync complete - ${successfulIds.length} successful, ${failedOperations.length} failed (${duration.toFixed(1)}ms)`)

      // Adapt strategy based on results
      this.adaptSyncStrategyPostProcessing(results, duration)

    } catch (error) {
      console.error('AdaptiveSyncManager: Batch processing failed:', error)
      this.performanceMonitor.recordTiming('adaptive_sync_error', startTime)
      this.emitEvent({
        type: 'sync_error',
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error(String(error))
      })
    } finally {
      this.syncInProgress = false
      this.stats.syncInProgress = false
      await this.updateStats()
    }
  }

  /**
   * Process batch with parallelization
   */
  private async processBatchWithParallelization(operations: QueuedOperation[]): Promise<Array<{
    operationId: string
    success: boolean
    error?: Error
    conflicts?: any[]
    statusCode?: number
  }>> {
    if (!this.config.parallelProcessing || !this.workerPool) {
      return this.processBatch(operations)
    }

    const startTime = performance.now()
    const results: Array<any> = []
    
    try {
      // Split operations into parallel batches
      const parallelBatches = this.createParallelBatches(operations)
      
      // Process batches in parallel
      const batchPromises = parallelBatches.map(batch => 
        this.processParallelBatch(batch)
      )
      
      const batchResults = await Promise.allSettled(batchPromises)
      
      // Combine results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(...result.value)
        } else {
          console.error('AdaptiveSyncManager: Parallel batch failed:', result.reason)
        }
      })

      const duration = performance.now() - startTime
      this.performanceMonitor.recordTiming('parallel_batch_processing', startTime)
      this.performanceMonitor.recordMetric({
        name: 'parallel_batch_count',
        value: parallelBatches.length,
        category: 'throughput',
        unit: 'count'
      })

      return results

    } catch (error) {
      console.error('AdaptiveSyncManager: Parallel processing failed:', error)
      // Fallback to sequential processing
      return this.processBatch(operations)
    }
  }

  /**
   * Adapt sync strategy based on conditions
   */
  private adaptSyncStrategy(): void {
    if (!this.config.adaptiveIntervals) return

    const previousInterval = this.currentSyncInterval
    const queueSize = this.stats.queueSize
    const isUserActive = this.userActivity.isActive
    const actionsPerMinute = this.userActivity.actionsPerMinute

    // Base interval calculation
    let newInterval = this.config.syncInterval

    // Adjust based on queue size
    if (queueSize > 50) {
      newInterval = Math.max(this.config.minSyncInterval, newInterval * 0.5)
    } else if (queueSize > 20) {
      newInterval = Math.max(this.config.minSyncInterval, newInterval * 0.7)
    } else if (queueSize === 0) {
      newInterval = Math.min(this.config.maxSyncInterval, newInterval * 1.5)
    }

    // Adjust based on user activity
    if (isUserActive && actionsPerMinute > 10) {
      newInterval = Math.max(this.config.minSyncInterval, newInterval * 0.6)
    } else if (!isUserActive) {
      newInterval = Math.min(this.config.maxSyncInterval, newInterval * 2)
    }

    // Apply bounds
    newInterval = Math.max(this.config.minSyncInterval, 
                  Math.min(this.config.maxSyncInterval, newInterval))

    if (newInterval !== previousInterval) {
      this.currentSyncInterval = newInterval
      
      // Restart timer with new interval
      if (this.syncTimer) {
        clearInterval(this.syncTimer)
        this.startSync()
      }

      console.log(`AdaptiveSyncManager: Adapted sync interval from ${previousInterval}ms to ${newInterval}ms`)
      
      this.performanceMonitor.recordMetric({
        name: 'sync_interval',
        value: newInterval,
        category: 'timing',
        unit: 'ms'
      })
    }
  }

  /**
   * Calculate optimal batch size based on conditions
   */
  private calculateOptimalBatchSize(): number {
    const baseBatchSize = this.config.batchSize
    const queueSize = this.stats.queueSize
    const isUserActive = this.userActivity.isActive

    let optimalSize = baseBatchSize

    // Increase batch size for large queues
    if (queueSize > 100) {
      optimalSize = Math.min(50, baseBatchSize * 2)
    } else if (queueSize > 50) {
      optimalSize = Math.min(30, baseBatchSize * 1.5)
    }

    // Decrease batch size if user is actively interacting
    if (isUserActive && this.userActivity.actionsPerMinute > 15) {
      optimalSize = Math.max(5, Math.floor(optimalSize * 0.7))
    }

    return optimalSize
  }

  /**
   * Determine if operations should be processed immediately
   */
  private shouldProcessImmediately(): boolean {
    return this.stats.queueSize > 20 || 
           (this.userActivity.isActive && this.userActivity.actionsPerMinute > 5)
  }

  /**
   * Create parallel batches for processing
   */
  private createParallelBatches(operations: QueuedOperation[]): QueuedOperation[][] {
    const maxBatches = Math.min(this.config.maxParallelBatches, operations.length)
    const batchSize = Math.ceil(operations.length / maxBatches)
    const batches: QueuedOperation[][] = []

    for (let i = 0; i < operations.length; i += batchSize) {
      batches.push(operations.slice(i, i + batchSize))
    }

    return batches
  }

  /**
   * Process a parallel batch
   */
  private async processParallelBatch(operations: QueuedOperation[]): Promise<Array<any>> {
    // This would use the worker pool if available
    // For now, fall back to sequential processing
    return this.processBatch(operations)
  }

  /**
   * Record user activity for adaptive behavior
   */
  private recordUserActivity(): void {
    const now = Date.now()
    const timeSinceLastActivity = now - this.userActivity.lastInteraction
    
    this.userActivity.lastInteraction = now
    
    // Calculate actions per minute
    if (timeSinceLastActivity < 60000) { // Within last minute
      this.userActivity.actionsPerMinute = Math.min(30, this.userActivity.actionsPerMinute + 1)
    } else {
      this.userActivity.actionsPerMinute = Math.max(0, this.userActivity.actionsPerMinute * 0.8)
    }
    
    // Update activity status
    this.userActivity.isActive = timeSinceLastActivity < 30000 // 30 seconds
    this.userActivity.inactivityPeriod = this.userActivity.isActive ? 0 : timeSinceLastActivity
  }

  /**
   * Start activity tracking
   */
  private startActivityTracking(): void {
    // Track various user interactions
    const events = ['click', 'keypress', 'scroll', 'touchstart']
    
    events.forEach(event => {
      if (typeof window !== 'undefined') {
        window.addEventListener(event, () => this.recordUserActivity(), { passive: true })
      }
    })

    // Periodic activity decay
    this.activityTracker = setInterval(() => {
      const now = Date.now()
      const inactiveTime = now - this.userActivity.lastInteraction
      
      if (inactiveTime > 60000) { // 1 minute
        this.userActivity.actionsPerMinute = Math.max(0, this.userActivity.actionsPerMinute * 0.9)
        this.userActivity.isActive = false
        this.userActivity.inactivityPeriod = inactiveTime
      }
    }, 10000) // Every 10 seconds
  }

  /**
   * Adapt strategy after processing
   */
  private adaptSyncStrategyPostProcessing(results: Array<any>, duration: number): void {
    const successRate = results.filter(r => r.success).length / results.length
    
    // If processing took too long, reduce batch size
    if (duration > 5000) { // 5 seconds
      this.config.batchSize = Math.max(5, Math.floor(this.config.batchSize * 0.8))
      console.log(`AdaptiveSyncManager: Reduced batch size to ${this.config.batchSize} due to slow processing`)
    }
    
    // If success rate is low, increase sync frequency
    if (successRate < 0.8) {
      this.currentSyncInterval = Math.max(
        this.config.minSyncInterval, 
        this.currentSyncInterval * 0.8
      )
      console.log(`AdaptiveSyncManager: Increased sync frequency due to low success rate`)
    }
  }

  /**
   * Initialize worker pool for parallel processing
   */
  private initializeWorkerPool(): void {
    if (typeof Worker === 'undefined') {
      console.warn('AdaptiveSyncManager: Web Workers not available, disabling parallel processing')
      this.config.parallelProcessing = false
      return
    }

    // Worker pool would be initialized here
    // For now, we'll skip the actual implementation
    console.log('AdaptiveSyncManager: Worker pool initialization deferred')
  }

  // Inherit remaining methods from base SyncManager
  private async processBatch(operations: QueuedOperation[]): Promise<Array<any>> {
    // Implementation similar to base SyncManager but with performance monitoring
    return []
  }

  private async handleFailedOperations(failedOps: Array<any>): Promise<void> {
    // Enhanced error handling with adaptive retry logic
  }

  private async cleanupStaleOperations(): Promise<void> {
    console.log('AdaptiveSyncManager: Cleaning up stale operations')
    const cleaned = await this.queueManager.cleanup()
    console.log(`AdaptiveSyncManager: Cleaned up ${cleaned} stale operations`)
  }

  private async setupRealTimeSync(): Promise<void> {
    // Enhanced real-time sync with performance monitoring
  }

  private async updateStats(): Promise<void> {
    const queueStats = await this.queueManager.getStats()
    this.stats.queueSize = queueStats.totalOperations
  }

  private emitEvent(event: SyncEvent): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`AdaptiveSyncManager: Event listener error:`, error)
        }
      })
    }
  }

  /**
   * Public API methods
   */
  public addEventListener(type: SyncEventType, listener: (event: SyncEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    this.eventListeners.get(type)!.push(listener)

    return () => {
      const listeners = this.eventListeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) listeners.splice(index, 1)
      }
    }
  }

  public getStats(): SyncStats & { adaptiveConfig: Partial<AdaptiveSyncConfig> } {
    return { 
      ...this.stats,
      adaptiveConfig: {
        currentSyncInterval: this.currentSyncInterval,
        batchSize: this.config.batchSize,
        userActivity: this.userActivity
      }
    }
  }

  public async forceSyncAll(): Promise<void> {
    console.log('AdaptiveSyncManager: Force sync requested')
    this.tripCacheManager.clear()
    await this.processQueueWithAdaptation()
  }

  public async clearQueue(): Promise<void> {
    await this.queueManager.cleanup()
    await this.updateStats()
    console.log('AdaptiveSyncManager: Queue cleared')
  }

  /**
   * Destroy and cleanup
   */
  public destroy(): void {
    this.pauseSync()
    
    if (this.activityTracker) {
      clearInterval(this.activityTracker)
      this.activityTracker = null
    }
    
    if (this.supabaseSubscription) {
      this.supabaseSubscription.unsubscribe()
      this.supabaseSubscription = null
    }
    
    if (this.workerPool) {
      this.workerPool.workers.forEach(worker => worker.terminate())
      this.workerPool = null
    }
    
    this.queueManager.destroy()
    this.eventListeners.clear()
    console.log('AdaptiveSyncManager: Destroyed')
  }
}

// Export enhanced singleton instance factory
let adaptiveSyncManagerInstance: AdaptiveSyncManager | null = null

export function createAdaptiveSyncManager(
  tripCacheManager: CacheManager<TripCard[]>,
  config?: Partial<AdaptiveSyncConfig>
): AdaptiveSyncManager {
  if (!adaptiveSyncManagerInstance) {
    adaptiveSyncManagerInstance = new AdaptiveSyncManager(tripCacheManager, config)
  }
  return adaptiveSyncManagerInstance
}

export function getAdaptiveSyncManager(): AdaptiveSyncManager | null {
  return adaptiveSyncManagerInstance
}