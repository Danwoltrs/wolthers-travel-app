/**
 * Background Sync System - Main Export
 * 
 * Complete background synchronization system with offline queue,
 * conflict resolution, and real-time updates.
 */

// Core sync components
export { SyncManager, createSyncManager, getSyncManager } from './SyncManager'
export type { SyncConfig, SyncStats, SyncEvent, SyncEventType } from './SyncManager'

export { QueueManager } from './QueueManager'
export type { QueuedOperation, OperationType, ResourceType, QueueStats } from './QueueManager'

export { ConflictResolver } from './ConflictResolver'
export type { 
  ConflictStrategy, 
  ConflictData, 
  ResolvedConflict, 
  ConflictResolutionRule 
} from './ConflictResolver'

// React hooks
export {
  useBackgroundSync,
  useSyncStatus,
  useSyncConflicts,
  useSyncQueue,
  formatSyncTime,
  getSyncStatusDescription,
  useSyncPerformance
} from '../hooks/useBackgroundSync'
export type {
  BackgroundSyncState,
  BackgroundSyncActions,
  UseBackgroundSyncOptions
} from '../hooks/useBackgroundSync'

// UI Components
export {
  SyncStatusIndicator,
  MiniSyncIndicator,
  SyncStatusBanner
} from '../components/sync/SyncStatusIndicator'

/**
 * Initialize the background sync system
 * 
 * This should be called once in your application root, typically in the
 * TripCacheProvider or a similar high-level component.
 * 
 * @param tripCacheManager - The cache manager instance for trips
 * @param config - Optional sync configuration
 * @returns The initialized sync manager instance
 * 
 * @example
 * ```typescript
 * import { initializeBackgroundSync } from '@/lib/sync'
 * import { tripCacheManager } from '@/contexts/TripCacheContext'
 * 
 * const syncManager = initializeBackgroundSync(tripCacheManager, {
 *   syncInterval: 30 * 1000, // 30 seconds
 *   retryAttempts: 3,
 *   conflictStrategy: 'merge'
 * })
 * ```
 */
export function initializeBackgroundSync(
  tripCacheManager: any,
  config?: Partial<import('./SyncManager').SyncConfig>
) {
  return createSyncManager(tripCacheManager, config)
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: import('./SyncManager').SyncConfig = {
  syncInterval: 30 * 1000, // 30 seconds
  retryAttempts: 3,
  batchSize: 10,
  conflictStrategy: 'merge',
  enableRealTimeSync: true
}

/**
 * Queue operation priority constants
 */
export const SYNC_PRIORITIES = {
  LOW: 5,
  NORMAL: 3,
  HIGH: 1,
  CRITICAL: 0
} as const

/**
 * Sync event types for easy reference
 */
export const SYNC_EVENTS = {
  SYNC_START: 'sync_start',
  SYNC_COMPLETE: 'sync_complete',
  SYNC_ERROR: 'sync_error',
  CONFLICT_DETECTED: 'conflict_detected',
  QUEUE_UPDATED: 'queue_updated'
} as const

/**
 * Utility function to create a queued operation
 */
export function createQueuedOperation(
  type: import('./QueueManager').OperationType,
  resource: import('./QueueManager').ResourceType,
  data?: any,
  options: {
    resourceId?: string
    priority?: number
    userId?: string
    dependencies?: string[]
  } = {}
): Omit<import('./QueueManager').QueuedOperation, 'id' | 'timestamp' | 'retryCount'> {
  return {
    type,
    resource,
    resourceId: options.resourceId,
    data,
    priority: options.priority ?? SYNC_PRIORITIES.NORMAL,
    userId: options.userId,
    dependencies: options.dependencies
  }
}

/**
 * Error types for sync operations
 */
export class SyncError extends Error {
  constructor(
    message: string,
    public operationId?: string,
    public retryable: boolean = true
  ) {
    super(message)
    this.name = 'SyncError'
  }
}

export class ConflictError extends SyncError {
  constructor(
    message: string,
    public conflicts: string[],
    operationId?: string
  ) {
    super(message, operationId, false)
    this.name = 'ConflictError'
  }
}

export class NetworkError extends SyncError {
  constructor(message: string, operationId?: string) {
    super(message, operationId, true)
    this.name = 'NetworkError'
  }
}

/**
 * Helper function to determine if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof SyncError) {
    return error.retryable
  }
  
  // Network errors are generally retryable
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true
  }
  
  // Server errors (5xx) are retryable, client errors (4xx) are not
  if (error.message.includes('HTTP')) {
    const statusMatch = error.message.match(/HTTP (\d{3})/)
    if (statusMatch) {
      const status = parseInt(statusMatch[1])
      return status >= 500
    }
  }
  
  return false
}

/**
 * Utility to get human-readable operation description
 */
export function getOperationDescription(operation: import('./QueueManager').QueuedOperation): string {
  const actionMap = {
    create: 'Creating',
    update: 'Updating',
    delete: 'Deleting',
    patch: 'Modifying'
  }
  
  const resourceMap = {
    trip: 'trip',
    participant: 'participant',
    activity: 'activity',
    document: 'document',
    expense: 'expense'
  }
  
  const action = actionMap[operation.type] || 'Processing'
  const resource = resourceMap[operation.resource] || 'item'
  
  return `${action} ${resource}${operation.resourceId ? ` ${operation.resourceId}` : ''}`
}

/**
 * Development utilities
 */
export const DevUtils = {
  /**
   * Log detailed sync statistics
   */
  logSyncStats(stats: import('./SyncManager').SyncStats) {
    console.group('🔄 Sync Statistics')
    console.log('Queue Size:', stats.queueSize)
    console.log('Last Sync:', stats.lastSync ? new Date(stats.lastSync).toISOString() : 'Never')
    console.log('Sync In Progress:', stats.syncInProgress)
    console.log('Failed Operations:', stats.failedOperations)
    console.log('Successful Operations:', stats.successfulOperations)
    console.log('Conflicts Resolved:', stats.conflictsResolved)
    console.groupEnd()
  },

  /**
   * Simulate network conditions for testing
   */
  simulateOffline(duration: number = 5000) {
    console.warn('🌐 Simulating offline mode for', duration, 'ms')
    // This would require integration with the NetworkManager
    // Implementation would depend on testing framework
  },

  /**
   * Create test conflict scenario
   */
  createTestConflict(tripId: string) {
    return {
      clientVersion: { title: 'Client Title', description: 'Client Description' },
      serverVersion: { title: 'Server Title', description: 'Server Description' },
      conflictFields: ['title', 'description']
    }
  }
}