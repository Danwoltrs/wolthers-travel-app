/**
 * Smart trips hook with caching awareness
 * Drop-in replacement for useTrips with enhanced performance
 * Provides backward compatibility while leveraging the new cache system
 */

import { useCallback } from 'react'
import { useTripCache } from '@/contexts/TripCacheContext'
import type { TripCard } from '@/types'

export interface UseSmartTripsResult {
  trips: TripCard[]
  loading: boolean
  error: string | null
  isOffline: boolean
  refetch: () => Promise<void>
  
  // Enhanced caching features
  refreshSilently: () => Promise<void>
  addTripOptimistically: (trip: TripCard) => Promise<void>
  updateTripOptimistically: (tripId: string, updates: Partial<TripCard>) => Promise<void>
  deleteTripOptimistically: (tripId: string) => Promise<void>
  
  // Cache management
  invalidateCache: () => void
  getCacheInfo: () => {
    stats: any
    lastRefresh: number | null
  }
}

/**
 * Smart trips hook with instant loading and background updates
 * 
 * Features:
 * - Instant loading from cache (fresh or stale)
 * - Background refresh for stale data
 * - Optimistic updates for user actions
 * - Offline support with cached data
 * - Network-aware refresh strategy
 * 
 * @param options Configuration options for caching behavior
 */
export function useSmartTrips(options: {
  enableOptimisticUpdates?: boolean
  backgroundRefresh?: boolean
} = {}): UseSmartTripsResult {
  
  const {
    enableOptimisticUpdates = true,
    backgroundRefresh = true
  } = options

  const {
    trips,
    loading,
    error,
    isOffline,
    lastRefresh,
    refreshTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    invalidateCache,
    getCacheStats
  } = useTripCache()

  /**
   * Force refresh trips (backward compatibility with useTrips.refetch)
   */
  const refetch = useCallback(async () => {
    await refreshTrips({ force: true })
  }, [refreshTrips])

  /**
   * Silently refresh trips in background without loading state
   */
  const refreshSilently = useCallback(async () => {
    await refreshTrips({ force: false })
  }, [refreshTrips])

  /**
   * Optimistically add a trip if optimistic updates are enabled
   */
  const addTripOptimistically = useCallback(async (trip: TripCard) => {
    if (!enableOptimisticUpdates) {
      console.warn('Optimistic updates disabled, use refetch() after server update')
      return
    }
    
    await addTrip(trip)
  }, [addTrip, enableOptimisticUpdates])

  /**
   * Optimistically update a trip if optimistic updates are enabled
   */
  const updateTripOptimistically = useCallback(async (tripId: string, updates: Partial<TripCard>) => {
    if (!enableOptimisticUpdates) {
      console.warn('Optimistic updates disabled, use refetch() after server update')
      return
    }
    
    await updateTrip(tripId, updates)
  }, [updateTrip, enableOptimisticUpdates])

  /**
   * Optimistically delete a trip if optimistic updates are enabled
   */
  const deleteTripOptimistically = useCallback(async (tripId: string) => {
    if (!enableOptimisticUpdates) {
      console.warn('Optimistic updates disabled, use refetch() after server update')
      return
    }
    
    await deleteTrip(tripId)
  }, [deleteTrip, enableOptimisticUpdates])

  /**
   * Get cache information for debugging and monitoring
   */
  const getCacheInfo = useCallback(() => {
    return {
      stats: getCacheStats(),
      lastRefresh
    }
  }, [getCacheStats, lastRefresh])

  return {
    // Core data (backward compatible with useTrips)
    trips,
    loading,
    error,
    isOffline,
    refetch,
    
    // Enhanced features
    refreshSilently,
    addTripOptimistically,
    updateTripOptimistically,
    deleteTripOptimistically,
    
    // Cache management
    invalidateCache,
    getCacheInfo
  }
}

/**
 * Legacy hook adapter for backward compatibility
 * Use this to migrate existing useTrips calls gradually
 */
export function useTripsWithCache() {
  const smartTrips = useSmartTrips()
  
  // Return only the original useTrips interface
  return {
    trips: smartTrips.trips,
    loading: smartTrips.loading,
    error: smartTrips.error,
    isOffline: smartTrips.isOffline,
    refetch: smartTrips.refetch
  }
}

/**
 * Specialized hooks for common patterns
 */

/**
 * Hook for trip management actions (create, update, delete)
 * Optimized for forms and user interactions
 */
export function useTripActions() {
  const {
    addTripOptimistically,
    updateTripOptimistically,
    deleteTripOptimistically,
    refetch
  } = useSmartTrips()

  const createTrip = useCallback(async (tripData: Omit<TripCard, 'id'>) => {
    const newTrip: TripCard = {
      ...tripData,
      id: `temp-${Date.now()}` // Temporary ID until server response
    }
    
    await addTripOptimistically(newTrip)
    // TODO: Send to server and update with real ID
  }, [addTripOptimistically])

  const updateTripDetails = useCallback(async (tripId: string, updates: Partial<TripCard>) => {
    await updateTripOptimistically(tripId, updates)
    // TODO: Send to server and handle conflicts
  }, [updateTripOptimistically])

  const removeTrip = useCallback(async (tripId: string) => {
    await deleteTripOptimistically(tripId)
    // TODO: Send to server and handle rollback if needed
  }, [deleteTripOptimistically])

  const forceSyncWithServer = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    createTrip,
    updateTripDetails,
    removeTrip,
    forceSyncWithServer
  }
}

/**
 * Hook for monitoring cache performance
 * Useful for debugging and performance optimization
 */
export function useCacheMonitor() {
  const { getCacheInfo } = useSmartTrips()
  
  const getPerformanceMetrics = useCallback(() => {
    const info = getCacheInfo()
    const now = Date.now()
    
    return {
      ...info.stats,
      lastRefreshAge: info.lastRefresh ? now - info.lastRefresh : null,
      cacheEffectiveness: info.stats.trips?.fresh / (info.stats.trips?.fresh + info.stats.trips?.stale + info.stats.trips?.expired) || 0
    }
  }, [getCacheInfo])

  return {
    getPerformanceMetrics
  }
}