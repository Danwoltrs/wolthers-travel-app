/**
 * Background Synchronization Manager
 * 
 * Core service that manages background data synchronization between cache and server,
 * handles offline operations, and ensures data consistency across the application.
 */

import { CacheManager, networkManager } from '@/lib/cache/CacheManager'
import { QueueManager, type QueuedOperation } from './QueueManager'
import { ConflictResolver } from './ConflictResolver'
import type { TripCard } from '@/types'

export interface SyncConfig {
  syncInterval: number // Background sync frequency (ms)
  retryAttempts: number // Max retry attempts for failed operations
  batchSize: number // Max operations to process in one batch
  conflictStrategy: 'server_wins' | 'client_wins' | 'merge' | 'prompt_user'
  enableRealTimeSync: boolean
}

export interface SyncStats {
  queueSize: number
  lastSync: number | null
  syncInProgress: boolean
  failedOperations: number
  successfulOperations: number
  conflictsResolved: number
}

export type SyncEventType = 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict_detected' | 'queue_updated'

export interface SyncEvent {
  type: SyncEventType
  timestamp: number
  data?: any
  error?: Error
}

export class SyncManager {
  private config: SyncConfig
  private queueManager: QueueManager
  private conflictResolver: ConflictResolver
  private tripCacheManager: CacheManager<TripCard[]>

  private syncTimer: NodeJS.Timeout | null = null
  private retryTimer: NodeJS.Timeout | null = null
  private retryDelay = 5000 // start at 5s
  private syncInProgress = false
  private stats: SyncStats = {
    queueSize: 0,
    lastSync: null,
    syncInProgress: false,
    failedOperations: 0,
    successfulOperations: 0,
    conflictsResolved: 0
  }

  // Lightweight state tracking for error handling
  private state: { status: 'active' | 'paused'; lastError: Error | null } = {
    status: 'active',
    lastError: null
  }
  
  private eventListeners: Map<SyncEventType, Array<(event: SyncEvent) => void>> = new Map()
  private supabaseSubscription: any = null

  constructor(
    tripCacheManager: CacheManager<TripCard[]>,
    config: Partial<SyncConfig> = {}
  ) {
    this.config = {
      syncInterval: 30 * 1000, // 30 seconds
      retryAttempts: 3,
      batchSize: 10,
      conflictStrategy: 'merge',
      enableRealTimeSync: true,
      ...config
    }

    this.tripCacheManager = tripCacheManager
    this.queueManager = new QueueManager()
    this.conflictResolver = new ConflictResolver(this.config.conflictStrategy)

    this.initialize()
  }

  /**
   * Initialize the sync manager
   */
  private async initialize(): Promise<void> {
    console.log('SyncManager: Initializing background sync service')
    
    // Clean up stale operations on startup
    await this.cleanupStaleOperations()
    
    // Listen for network status changes
    networkManager.onStatusChange((online) => {
      if (online) {
        console.log('SyncManager: Network restored, starting sync')
        this.startSync()
      } else {
        console.log('SyncManager: Network lost, pausing sync')
        this.pauseSync()
      }
    })

    // Start background sync if online
    if (networkManager.isOnline) {
      this.startSync()
    }

    // Initialize real-time subscriptions
    if (this.config.enableRealTimeSync) {
      await this.setupRealTimeSync()
    }

    // Process any existing queued operations
    await this.processQueue()
  }

  /**
   * Start background synchronization
   */
  public startSync(): void {
    if (this.syncTimer) return

    console.log(`SyncManager: Starting background sync (${this.config.syncInterval}ms interval)`)
    
    this.syncTimer = setInterval(() => {
      if (!this.syncInProgress && networkManager.isOnline) {
        void this.processQueue().catch(err => this.handleError(err))
      }
    }, this.config.syncInterval)

    // Initial sync
    if (networkManager.isOnline) {
      setTimeout(() => void this.processQueue().catch(err => this.handleError(err)), 1000)
    }
  }

  /**
   * Pause background synchronization
   */
  public pauseSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      console.log('SyncManager: Background sync paused')
    }
  }

  /**
   * Handle sync errors without destroying the manager
   */
  private handleError(error: any) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('SyncManager: Sync error:', err)
    this.state.status = 'paused'
    this.state.lastError = err
    this.pauseSync()
    this.scheduleRetry()
  }

  /**
   * Schedule a retry with exponential backoff
   */
  private scheduleRetry() {
    if (this.retryTimer) return
    const delay = this.retryDelay
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.state.status = 'active'
      this.startSync()
    }, delay)
    this.retryDelay = Math.min(this.retryDelay * 3, 120000)
  }

  /**
   * Queue an operation for background processing
   */
  public async queueOperation(operation: QueuedOperation): Promise<void> {
    await this.queueManager.enqueue(operation)
    this.updateStats()
    
    this.emitEvent({
      type: 'queue_updated',
      timestamp: Date.now(),
      data: { queueSize: this.stats.queueSize }
    })

    // If online and not currently syncing, process immediately
    if (networkManager.isOnline && !this.syncInProgress) {
      setTimeout(() => void this.processQueue().catch(err => this.handleError(err)), 100)
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    if (this.syncInProgress || !networkManager.isOnline) return

    const operations = await this.queueManager.peek(this.config.batchSize)
    if (operations.length === 0) return

    this.syncInProgress = true
    this.stats.syncInProgress = true
    
    this.emitEvent({
      type: 'sync_start',
      timestamp: Date.now(),
      data: { operationCount: operations.length }
    })

    console.log(`SyncManager: Processing ${operations.length} queued operations`)

    try {
      const results = await this.processBatch(operations)
      
      // Remove successfully processed operations from queue
      const successfulIds = results
        .filter(r => r.success)
        .map(r => r.operationId)
      
      await this.queueManager.removeMultiple(successfulIds)
      
      // Handle failed operations
      const failedOperations = results.filter(r => !r.success)
      await this.handleFailedOperations(failedOperations)

      this.stats.successfulOperations += successfulIds.length
      this.stats.failedOperations += failedOperations.length
      this.stats.lastSync = Date.now()

      this.emitEvent({
        type: 'sync_complete',
        timestamp: Date.now(),
        data: {
          successful: successfulIds.length,
          failed: failedOperations.length
        }
      })

      console.log(`SyncManager: Sync complete - ${successfulIds.length} successful, ${failedOperations.length} failed`)
      this.state.lastError = null
      this.retryDelay = 5000

    } catch (error) {
      this.handleError(error)
      this.emitEvent({
        type: 'sync_error',
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error(String(error))
      })
    } finally {
      this.syncInProgress = false
      this.stats.syncInProgress = false
      this.updateStats()
    }
  }

  /**
   * Process a batch of operations
   */
  private async processBatch(operations: QueuedOperation[]): Promise<Array<{
    operationId: string
    success: boolean
    error?: Error
    conflicts?: any[]
    statusCode?: number
  }>> {
    // Group operations by type for batch processing
    const groupedOps = this.groupOperationsByType(operations)
    const results: Array<{
      operationId: string
      success: boolean
      error?: Error
      conflicts?: any[]
      statusCode?: number
    }> = []

    // Process each group with appropriate batch endpoints
    for (const [type, ops] of Object.entries(groupedOps)) {
      try {
        const batchResults = await this.processBatchByType(type, ops)
        results.push(...batchResults)
      } catch (error) {
        console.error(`SyncManager: Failed to process ${type} operations:`, error)
        // Mark all operations in this group as failed
        const statusCode = (error as any)?.statusCode || 500
        ops.forEach(op => {
          results.push({
            operationId: op.id,
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
            statusCode
          })
        })
      }
    }

    return results
  }

  /**
   * Group operations by type for efficient batch processing
   */
  private groupOperationsByType(operations: QueuedOperation[]): Record<string, QueuedOperation[]> {
    return operations.reduce((groups, op) => {
      const key = `${op.type}_${op.resource}`
      if (!groups[key]) groups[key] = []
      groups[key].push(op)
      return groups
    }, {} as Record<string, QueuedOperation[]>)
  }

  /**
   * Process batch operations by type
   */
  private async processBatchByType(
    type: string, 
    operations: QueuedOperation[]
  ): Promise<Array<{
    operationId: string
    success: boolean
    error?: Error
    conflicts?: any[]
    statusCode?: number
  }>> {
    const results: Array<{
      operationId: string
      success: boolean
      error?: Error
      conflicts?: any[]
      statusCode?: number
    }> = []

    switch (type) {
      case 'create_trips':
      case 'update_trips':
      case 'delete_trips':
        const batchResults = await this.processTripBatch(operations)
        results.push(...batchResults)
        break

      default:
        // Process individual operations for unsupported batch types
        for (const op of operations) {
          try {
            await this.processIndividualOperation(op)
            results.push({ operationId: op.id, success: true })
          } catch (error) {
            const statusCode = (error as any)?.statusCode || 500
            results.push({
              operationId: op.id,
              success: false,
              error: error instanceof Error ? error : new Error(String(error)),
              statusCode
            })
          }
        }
    }

    return results
  }

  /**
   * Process trip operations in batch
   */
  private async processTripBatch(operations: QueuedOperation[]): Promise<Array<{
    operationId: string
    success: boolean
    error?: Error
    conflicts?: any[]
    statusCode?: number
  }>> {
    try {
      // Validate and clean data for all operations
      const cleanedOperations = operations.map(op => ({
        id: op.id,
        type: op.type,
        resourceId: op.resourceId,
        data: op.data ? this.validateAndCleanData(op.data) : op.data,
        timestamp: op.timestamp,
        mutationId: op.mutationId
      }))

      const response = await fetch('/api/trips/batch', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ operations: cleanedOperations })
      })

      if (!response.ok) {
        const errorWithStatus = new Error(`Batch API error: ${response.status}`) as Error & { statusCode?: number }
        errorWithStatus.statusCode = response.status
        throw errorWithStatus
      }

      const result = await response.json()
      return result.results || []

    } catch (error) {
      console.error('SyncManager: Trip batch processing failed:', error)
      const statusCode = (error as any)?.statusCode || 500
      // Return failure for all operations
      return operations.map(op => ({
        operationId: op.id,
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        statusCode
      }))
    }
  }

  /**
   * Process individual operation (fallback for non-batch operations)
   */
  private async processIndividualOperation(operation: QueuedOperation): Promise<void> {
    const { type, resource, resourceId, data } = operation

    let endpoint = ''
    let method = 'POST'
    let body = data

    // Validate and clean data before sending
    if (body) {
      body = this.validateAndCleanData(body)
    }

    switch (`${type}_${resource}`) {
      case 'create_trip':
        endpoint = '/api/trips'
        method = 'POST'
        break
      case 'update_trip':
        endpoint = `/api/trips/${resourceId}`
        method = 'PUT'
        break
      case 'delete_trip':
        endpoint = `/api/trips/${resourceId}/delete`
        method = 'DELETE'
        body = undefined
        break
      default:
        throw new Error(`Unsupported operation: ${type}_${resource}`)
    }

    // Attach mutation ID for idempotency if available
    if (operation.mutationId) {
      if (method === 'DELETE') {
        body = { clientMutationId: operation.mutationId }
      } else {
        body = { ...(body || {}), clientMutationId: operation.mutationId }
      }
    }

    const response = await fetch(endpoint, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const error = await response.text()
      const errorWithStatus = new Error(`API error: ${response.status} - ${error}`) as Error & { statusCode?: number }
      errorWithStatus.statusCode = response.status
      throw errorWithStatus
    }
  }

  /**
   * Handle failed operations with smart retry logic
   */
  private async handleFailedOperations(
    failedOperations: Array<{
      operationId: string
      success: boolean
      error?: Error
      conflicts?: any[]
      statusCode?: number
    }>
  ): Promise<void> {
    for (const failure of failedOperations) {
      const operation = await this.queueManager.get(failure.operationId)
      if (!operation) continue

      // Check if this is a non-retryable error
      const shouldRetry = this.shouldRetryOperation(failure.error, failure.statusCode)
      
      if (!shouldRetry) {
        console.log(`SyncManager: Operation ${operation.id} failed with non-retryable error, removing from queue`)
        await this.queueManager.remove(operation.id)
        continue
      }

      // Handle conflicts
      if (failure.conflicts && failure.conflicts.length > 0) {
        try {
          const resolved = await this.conflictResolver.resolve(
            operation,
            failure.conflicts[0]
          )
          
          if (resolved) {
            // Update operation with resolved data and retry
            operation.data = this.validateAndCleanData(resolved.data)
            operation.retryCount = 0 // Reset retry count after conflict resolution
            await this.queueManager.update(operation)
            this.stats.conflictsResolved++
            
            this.emitEvent({
              type: 'conflict_detected',
              timestamp: Date.now(),
              data: { operation, resolution: resolved }
            })
          }
        } catch (error) {
          console.error('SyncManager: Conflict resolution failed:', error)
        }
      }

      // Retry logic for retryable failed operations
      operation.retryCount = (operation.retryCount || 0) + 1
      
      if (operation.retryCount >= this.config.retryAttempts) {
        console.warn(`SyncManager: Operation ${operation.id} failed after ${this.config.retryAttempts} attempts, removing from queue`)
        await this.queueManager.remove(operation.id)
      } else {
        // Update retry count and schedule for retry
        operation.nextRetry = Date.now() + (operation.retryCount * 5000) // Exponential backoff
        await this.queueManager.update(operation)
        console.log(`SyncManager: Operation ${operation.id} scheduled for retry ${operation.retryCount}/${this.config.retryAttempts}`)
      }
    }
  }

  /**
   * Setup real-time synchronization with Supabase
   */
  private async setupRealTimeSync(): Promise<void> {
    try {
      // Import Supabase client dynamically to avoid SSR issues
      const supabaseModule = await import('@/lib/supabase-client')
      const supabase = supabaseModule.getSupabaseClient()

      // Define callback functions with proper context binding
      const handleTripsChange = (payload: any) => this.handleRealTimeChange('trips', payload)
      const handleParticipantsChange = (payload: any) => this.handleRealTimeChange('participants', payload)

      // Subscribe to trip changes
      this.supabaseSubscription = supabase
        .channel('trips_sync')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'trips' },
          handleTripsChange
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'trip_participants' },
          handleParticipantsChange
        )
        .subscribe()

      console.log('SyncManager: Real-time sync initialized')
    } catch (error) {
      console.error('SyncManager: Failed to setup real-time sync:', error)
    }
  }

  /**
   * Handle real-time changes from Supabase
   */
  private async handleRealTimeChange(table: string, payload: any): Promise<void> {
    console.log(`SyncManager: Real-time change detected in ${table}:`, payload.eventType)

    try {
      // Invalidate relevant cache entries
      if (table === 'trips') {
        this.tripCacheManager.invalidate('all-trips')
        if (payload.new?.id) {
          this.tripCacheManager.invalidate(`trip-${payload.new.id}`)
        }
        if (payload.old?.id) {
          this.tripCacheManager.invalidate(`trip-${payload.old.id}`)
        }
      }

      // Remove completed operations from queue to avoid conflicts
      if (payload.new?.id) {
        await this.queueManager.removeByResourceId(payload.new.id)
      }

    } catch (error) {
      console.error('SyncManager: Failed to handle real-time change:', error)
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.queueManager.getStats().then(queueStats => {
      this.stats.queueSize = queueStats.totalOperations
    })
  }

  /**
   * Get current sync statistics
   */
  public getStats(): SyncStats {
    return { ...this.stats }
  }

  /**
   * Add event listener
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

  /**
   * Emit sync event
   */
  private emitEvent(event: SyncEvent): void {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`SyncManager: Event listener error:`, error)
        }
      })
    }
  }

  /**
   * Force sync all cached data
   */
  public async forceSyncAll(): Promise<void> {
    if (!networkManager.isOnline) {
      throw new Error('Cannot force sync while offline')
    }

    console.log('SyncManager: Force syncing all cached data')
    
    // Force refresh cache with server data
    this.tripCacheManager.clear()
    
    // Process all queued operations
    await this.processQueue()
    
    console.log('SyncManager: Force sync completed')
  }

  /**
   * Clear all queued operations
   */
  public async clearQueue(): Promise<void> {
    await this.queueManager.clear()
    this.updateStats()
    console.log('SyncManager: Queue cleared')
  }

  /**
   * Clean up stale operations on startup
   */
  private async cleanupStaleOperations(): Promise<void> {
    console.log('SyncManager: Cleaning up stale operations')
    try {
      // Run general cleanup
      const cleanedGeneral = await this.queueManager.cleanup()
      
      // Validate and fix operation data integrity
      const validation = await this.queueManager.validateOperations()
      
      // Clean up operations that shouldn't be retried based on error patterns
      const cleanedByError = await this.queueManager.cleanupByErrorType((op) => {
        // Remove delete operations that have been retried (likely 404s)
        if (op.type === 'delete' && op.retryCount > 1) {
          return true
        }
        
        // Remove very old operations that haven't succeeded
        const ageInDays = (Date.now() - op.timestamp) / (24 * 60 * 60 * 1000)
        if (ageInDays > 7 && op.retryCount > 0) {
          return true
        }
        
        return false
      })
      
      const totalCleaned = cleanedGeneral + validation.invalid + cleanedByError
      if (totalCleaned > 0 || validation.fixed > 0) {
        console.log(`SyncManager: Startup cleanup complete - ${totalCleaned} removed, ${validation.fixed} fixed`)
      }
    } catch (error) {
      console.error('SyncManager: Failed to clean up stale operations:', error)
    }
  }

  /**
   * Determine if an operation should be retried based on error type
   */
  private shouldRetryOperation(error?: Error, statusCode?: number): boolean {
    // Don't retry for client errors that won't resolve with time
    if (statusCode) {
      // Non-retryable HTTP status codes
      if (statusCode === 400 || statusCode === 401 || statusCode === 403 || 
          statusCode === 404 || statusCode === 409 || statusCode === 410) {
        return false
      }
    }
    
    // Don't retry for specific error types
    if (error?.message) {
      const message = error.message.toLowerCase()
      if (message.includes('not found') || 
          message.includes('does not exist') ||
          message.includes('unauthorized') ||
          message.includes('forbidden')) {
        return false
      }
    }
    
    return true // Retry by default for network errors, temporary issues
  }

  /**
   * Validate and clean data before sync operations
   */
  private validateAndCleanData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data
    }
    
    const cleaned = { ...data }
    
    // Convert date strings to proper Date objects or ISO strings
    const dateFields = ['start_date', 'end_date', 'created_at', 'updated_at', 'startDate', 'endDate']
    
    for (const field of dateFields) {
      if (cleaned[field]) {
        try {
          // Handle various date formats
          if (typeof cleaned[field] === 'string') {
            const date = new Date(cleaned[field])
            if (!isNaN(date.getTime())) {
              cleaned[field] = date.toISOString()
            }
          } else if (cleaned[field] instanceof Date) {
            if (!isNaN(cleaned[field].getTime())) {
              cleaned[field] = cleaned[field].toISOString()
            } else {
              delete cleaned[field] // Remove invalid dates
            }
          } else if (typeof cleaned[field] === 'object' && cleaned[field].toISOString) {
            // Handle Date-like objects
            try {
              cleaned[field] = cleaned[field].toISOString()
            } catch {
              delete cleaned[field]
            }
          }
        } catch (error) {
          console.warn(`SyncManager: Invalid date field ${field}:`, cleaned[field])
          delete cleaned[field] // Remove invalid date fields
        }
      }
    }
    
    return cleaned
  }

  /**
   * Destroy the sync manager
   */
  public destroy(): void {
    this.pauseSync()
    
    if (this.supabaseSubscription) {
      this.supabaseSubscription.unsubscribe()
      this.supabaseSubscription = null
    }
    
    this.eventListeners.clear()
    console.log('SyncManager: Destroyed')
  }
}

// Export singleton instance factory
let syncManagerInstance: SyncManager | null = null

export function createSyncManager(
  tripCacheManager: CacheManager<TripCard[]>,
  config?: Partial<SyncConfig>
): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager(tripCacheManager, config)
  }
  return syncManagerInstance
}

export function getSyncManager(): SyncManager | null {
  return syncManagerInstance
}