/**
 * Background Sync Hook
 * 
 * Provides a simple interface for components to interact with the
 * background synchronization system.
 */

import { useCallback, useEffect, useState } from 'react'
import { useTripCache } from '@/contexts/TripCacheContext'
import type { SyncStats, SyncEventType, SyncEvent } from '@/lib/sync/SyncManager'

export interface BackgroundSyncState {
  isOnline: boolean
  syncInProgress: boolean
  queueSize: number
  lastSync: number | null
  failedOperations: number
  successfulOperations: number
  conflictsResolved: number
  hasErrors: boolean
}

export interface BackgroundSyncActions {
  forceSync: () => Promise<void>
  clearQueue: () => Promise<void>
  retryFailedOperations: () => Promise<void>
  getDetailedStats: () => any
}

export interface UseBackgroundSyncOptions {
  onSyncComplete?: (successful: number, failed: number) => void
  onConflictDetected?: (conflict: any) => void
  onSyncError?: (error: Error) => void
  autoRetry?: boolean
}

export function useBackgroundSync(options: UseBackgroundSyncOptions = {}) {
  const {
    syncStats,
    isOffline,
    forceSyncAll,
    clearSyncQueue,
    getCacheStats,
    getSyncManager
  } = useTripCache()

  const [state, setState] = useState<BackgroundSyncState>({
    isOnline: !isOffline,
    syncInProgress: syncStats.syncInProgress,
    queueSize: syncStats.queueSize,
    lastSync: syncStats.lastSync,
    failedOperations: syncStats.failedOperations,
    successfulOperations: syncStats.successfulOperations,
    conflictsResolved: syncStats.conflictsResolved,
    hasErrors: syncStats.failedOperations > 0
  })

  // Update state when sync stats change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isOnline: !isOffline,
      syncInProgress: syncStats.syncInProgress,
      queueSize: syncStats.queueSize,
      lastSync: syncStats.lastSync,
      failedOperations: syncStats.failedOperations,
      successfulOperations: syncStats.successfulOperations,
      conflictsResolved: syncStats.conflictsResolved,
      hasErrors: syncStats.failedOperations > 0
    }))
  }, [syncStats, isOffline])

  // Subscribe to sync events
  useEffect(() => {
    const syncManager = getSyncManager()
    if (!syncManager) return

    const unsubscribers = [
      syncManager.addEventListener('sync_complete', (event: SyncEvent) => {
        if (options.onSyncComplete && event.data) {
          options.onSyncComplete(
            event.data.successful || 0,
            event.data.failed || 0
          )
        }
      }),

      syncManager.addEventListener('conflict_detected', (event: SyncEvent) => {
        if (options.onConflictDetected && event.data) {
          options.onConflictDetected(event.data)
        }
      }),

      syncManager.addEventListener('sync_error', (event: SyncEvent) => {
        if (options.onSyncError && event.error) {
          options.onSyncError(event.error)
        }
      })
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [getSyncManager, options])

  // Force synchronization
  const forceSync = useCallback(async () => {
    console.log('useBackgroundSync: Force sync requested')
    await forceSyncAll()
  }, [forceSyncAll])

  // Clear sync queue
  const clearQueue = useCallback(async () => {
    console.log('useBackgroundSync: Clear queue requested')
    await clearSyncQueue()
  }, [clearSyncQueue])

  // Retry failed operations
  const retryFailedOperations = useCallback(async () => {
    const syncManager = getSyncManager()
    if (!syncManager) return

    console.log('useBackgroundSync: Retry failed operations requested')
    
    // Force a sync cycle which will retry failed operations
    await forceSync()
  }, [getSyncManager, forceSync])

  // Get detailed statistics
  const getDetailedStats = useCallback(() => {
    return {
      cache: getCacheStats(),
      sync: getSyncManager()?.getStats() || null
    }
  }, [getCacheStats, getSyncManager])

  const actions: BackgroundSyncActions = {
    forceSync,
    clearQueue,
    retryFailedOperations,
    getDetailedStats
  }

  return {
    state,
    actions
  }
}

/**
 * Hook for monitoring sync status in real-time
 */
export function useSyncStatus() {
  const { syncStats, isOffline } = useTripCache()
  
  return {
    isOnline: !isOffline,
    isSyncing: syncStats.syncInProgress,
    hasQueuedOperations: syncStats.queueSize > 0,
    hasErrors: syncStats.failedOperations > 0,
    queueSize: syncStats.queueSize,
    lastSyncTime: syncStats.lastSync
  }
}

/**
 * Hook for handling sync conflicts
 */
export function useSyncConflicts() {
  const [conflicts, setConflicts] = useState<any[]>([])
  const { getSyncManager } = useTripCache()

  useEffect(() => {
    const syncManager = getSyncManager()
    if (!syncManager) return

    const unsubscribe = syncManager.addEventListener('conflict_detected', (event: SyncEvent) => {
      if (event.data?.operation && event.data?.conflicts) {
        setConflicts(prev => [...prev, {
          id: event.data.operation.id,
          timestamp: event.timestamp,
          operation: event.data.operation,
          conflicts: event.data.conflicts,
          resolved: false
        }])
      }
    })

    return unsubscribe
  }, [getSyncManager])

  const resolveConflict = useCallback((conflictId: string, resolution: 'accept' | 'reject') => {
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.id === conflictId 
          ? { ...conflict, resolved: true, resolution }
          : conflict
      )
    )
  }, [])

  const clearResolvedConflicts = useCallback(() => {
    setConflicts(prev => prev.filter(conflict => !conflict.resolved))
  }, [])

  return {
    conflicts: conflicts.filter(c => !c.resolved),
    resolvedConflicts: conflicts.filter(c => c.resolved),
    resolveConflict,
    clearResolvedConflicts,
    hasUnresolvedConflicts: conflicts.some(c => !c.resolved)
  }
}

/**
 * Hook for sync queue management
 */
export function useSyncQueue() {
  const { syncStats, getSyncManager } = useTripCache()
  const [queueDetails, setQueueDetails] = useState<any[]>([])

  const refreshQueueDetails = useCallback(async () => {
    const syncManager = getSyncManager()
    if (!syncManager) return

    // This would require adding a method to SyncManager to get queue details
    // For now, we'll just show basic stats
    setQueueDetails([])
  }, [getSyncManager])

  useEffect(() => {
    refreshQueueDetails()
  }, [syncStats.queueSize, refreshQueueDetails])

  const removeQueueItem = useCallback(async (itemId: string) => {
    const syncManager = getSyncManager()
    if (!syncManager) return

    // This would require accessing the queue manager
    console.log('Removing queue item:', itemId)
    await refreshQueueDetails()
  }, [getSyncManager, refreshQueueDetails])

  return {
    queueSize: syncStats.queueSize,
    queueDetails,
    refreshQueueDetails,
    removeQueueItem,
    isEmpty: syncStats.queueSize === 0
  }
}

/**
 * Utility function to format sync timestamps
 */
export function formatSyncTime(timestamp: number | null): string {
  if (!timestamp) return 'Never'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}

/**
 * Utility function to get sync status description
 */
export function getSyncStatusDescription(state: BackgroundSyncState): string {
  if (!state.isOnline) return 'Offline - changes will sync when connection is restored'
  if (state.syncInProgress) return 'Syncing changes...'
  if (state.hasErrors) return `${state.failedOperations} operations failed - tap to retry`
  if (state.queueSize > 0) return `${state.queueSize} changes pending sync`
  if (state.lastSync) return `Last synced ${formatSyncTime(state.lastSync)}`
  
  return 'All changes synced'
}

/**
 * Hook for sync performance monitoring
 */
export function useSyncPerformance() {
  const [performanceData, setPerformanceData] = useState({
    averageSyncTime: 0,
    successRate: 0,
    conflictRate: 0,
    networkLatency: 0
  })

  const { syncStats } = useTripCache()

  useEffect(() => {
    const total = syncStats.successfulOperations + syncStats.failedOperations
    if (total > 0) {
      setPerformanceData(prev => ({
        ...prev,
        successRate: (syncStats.successfulOperations / total) * 100,
        conflictRate: (syncStats.conflictsResolved / total) * 100
      }))
    }
  }, [syncStats])

  return performanceData
}