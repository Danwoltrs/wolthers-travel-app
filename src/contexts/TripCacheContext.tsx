'use client'

import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react'
import { CacheManager, networkManager } from '@/lib/cache/CacheManager'
import { createSyncManager, getSyncManager, type SyncManager, type SyncEvent } from '@/lib/sync/SyncManager'
import { adaptiveCacheConfig, getCacheSystemConfig } from '@/lib/cache/config'
import { performanceOptimizer, measurePerformance } from '@/lib/cache/performance'
import type { TripCard } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-client'
import { cleanStorageOnBoot } from '@/lib/storage/safeStorage'
import { extractCityFromLocation, getCityWeather } from '@/lib/geographical-intelligence'

// Get environment-appropriate configuration
const systemConfig = getCacheSystemConfig()

/**
 * Trip cache configuration with adaptive optimization
 */
const getTripCacheConfig = () => {
  const config = adaptiveCacheConfig.getConfig()
  return {
    freshTTL: config.cache.freshTTL,
    staleTTL: config.cache.staleTTL,
    maxMemoryItems: config.cache.maxMemoryItems,
    storageKey: config.cache.storageKeyPrefix + '-trips-v2' // Force cache invalidation
  }
}

const getActivityCacheConfig = () => {
  const config = adaptiveCacheConfig.getConfig()
  return {
    freshTTL: Math.floor(config.cache.freshTTL * 0.6), // 60% of trip cache TTL
    staleTTL: Math.floor(config.cache.staleTTL * 0.67), // 67% of trip cache TTL
    maxMemoryItems: Math.floor(config.cache.maxMemoryItems * 0.5),
    storageKey: config.cache.storageKeyPrefix + '-activities'
  }
}

interface TripCacheState {
  trips: TripCard[]
  loading: boolean
  error: string | null
  isOffline: boolean
  lastRefresh: number | null
  syncStats: {
    queueSize: number
    lastSync: number | null
    syncInProgress: boolean
    failedOperations: number
    successfulOperations: number
    conflictsResolved: number
  }
}

interface TripCacheContextValue {
  // State
  trips: TripCard[]
  loading: boolean
  error: string | null
  isOffline: boolean
  lastRefresh: number | null
  syncStats: {
    queueSize: number
    lastSync: number | null
    syncInProgress: boolean
    failedOperations: number
    successfulOperations: number
    conflictsResolved: number
  }
  
  // Actions
  refreshTrips: (options?: { force?: boolean }) => Promise<void>
  addTrip: (trip: TripCard) => Promise<void>
  updateTrip: (tripId: string, updates: Partial<TripCard>) => Promise<void>
  deleteTrip: (tripId: string) => Promise<void>
  
  // Cache management
  invalidateCache: () => void
  getCacheStats: () => any
  
  // Sync management
  forceSyncAll: () => Promise<void>
  clearSyncQueue: () => Promise<void>
  getSyncManager: () => SyncManager | null
}

const TripCacheContext = createContext<TripCacheContextValue | null>(null)

// Singleton cache managers with adaptive configuration
const tripCacheManager = new CacheManager<TripCard[]>(getTripCacheConfig())
const activityCacheManager = new CacheManager<any>(getActivityCacheConfig())

// Initialize sync manager
let syncManager: SyncManager | null = null


interface TripCacheProviderProps {
  children: React.ReactNode
}

export function TripCacheProvider({ children }: TripCacheProviderProps) {
  const [state, setState] = useState<TripCacheState>({
    trips: [],
    loading: true,
    error: null,
    isOffline: !networkManager.isOnline,
    lastRefresh: null,
    syncStats: {
      queueSize: 0,
      lastSync: null,
      syncInProgress: false,
      failedOperations: 0,
      successfulOperations: 0,
      conflictsResolved: 0
    }
  })

  const syncManagerRef = useRef<SyncManager | null>(null)
  const { user } = useAuth()
  const userId = user?.id || 'anonymous'

  useEffect(() => {
    cleanStorageOnBoot()
  }, [])

  /**
   * Fetch trips from API with authentication
   */
  const fetchTripsFromAPI = useCallback(async (): Promise<TripCard[]> => {
    console.log('TripCache: Fetching trips from API...')
    const response = await fetch('/api/trips?includeDrafts=1', {
      method: 'GET',
      credentials: 'include', // This ensures httpOnly cookies are sent
      headers: {
        'Content-Type': 'application/json'
      },
      next: { tags: ['trips', `trips:user:${userId}`] }
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // If we can't parse as JSON, check if it's HTML (indicates redirect or error page)
        if (errorText.startsWith('<!DOCTYPE') || errorText.includes('<html>')) {
          errorMessage = `Authentication required - redirected to error page`
          console.error('TripCache: Received HTML instead of JSON:', errorText.substring(0, 200))
        } else {
          errorMessage = response.statusText || errorMessage
        }
      }
      
      throw new Error(errorMessage)
    }

    let result
    try {
      result = await response.json()
    } catch (jsonError) {
      const responseText = await response.clone().text()
      console.error('TripCache: JSON parsing failed:', jsonError)
      console.error('TripCache: Response text:', responseText.substring(0, 500))
      
      if (responseText.startsWith('<!DOCTYPE') || responseText.includes('<html>')) {
        throw new Error('Authentication required - received HTML page instead of JSON')
      }
      throw new Error(`Failed to parse API response: ${jsonError.message}`)
    }
    const apiTrips = result.trips || []

    // Transform API data to TripCard format 
    const transformedTrips: TripCard[] = apiTrips.map((trip: any) => {
      const tripParticipants = trip.trip_participants || []
      
      // Separate companies and Wolthers staff
      const externalParticipants = tripParticipants
        .filter((p: any) => (p.role === 'client_representative' || p.role === 'participant' || p.role === 'representative'))
      
      // Get companies from both linked users and guest entries
      const companies = externalParticipants
        .map((p: any) => ({
          id: p.companies?.id || p.company_id,
          name: p.companies?.name || p.guest_company,
          fantasyName: p.companies?.fantasy_name || p.guest_company
        }))
        .filter(company => company.id) // Only include entries with valid company IDs
      
      // Remove duplicates by company id
      const uniqueCompanies = companies.filter((company: any, index: number, self: any[]) => 
        self.findIndex((c: any) => c.id === company.id) === index
      )
      
      const guests = uniqueCompanies.map((company: any) => ({
        companyId: company.id,
        names: externalParticipants
          .filter((p: any) => p.company_id === company.id)
          .map((p: any) => p.users?.full_name || p.guest_name) // Use guest_name for external guests
          .filter(Boolean)
      }))

      const wolthersStaff = tripParticipants
        .filter((p: any) => p.users && (
          p.users.user_type === 'wolthers_staff' || 
          p.users.email?.endsWith('@wolthers.com') ||
          (p.role === 'staff' && p.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0') // Wolthers company ID
        ))
        .map((p: any) => ({
          id: p.users?.id,
          fullName: p.users?.full_name,
          email: p.users?.email
        }))

      // Get vehicles and drivers
      const tripVehicles = trip.trip_vehicles || []
      const vehicles = tripVehicles
        .filter((v: any) => v.vehicles)
        .map((v: any) => {
          const fullModel = v.vehicles?.model || ''
          const modelParts = fullModel.split(' ')
          const make = modelParts[0] || fullModel
          const model = modelParts.length > 1 ? modelParts.slice(1).join(' ') : ''
          
          return {
            id: v.vehicles?.id,
            make,
            model: model || fullModel, // Fallback to full model if no space found
            licensePlate: v.vehicles?.license_plate
          }
        })

      const drivers = tripVehicles
        .filter((v: any) => v.users && v.driver_id)
        .map((v: any) => ({
          id: v.users?.id,
          fullName: v.users?.full_name,
          email: v.users?.email
        }))

      // Calculate stats (simplified for cache efficiency)
      const tripItems = trip.itinerary_items || []
      const notesCount = tripItems.reduce((total: number, item: any) => {
        return total + (item.meeting_notes?.length || 0)
      }, 0)

      // Extract location data from activities for instant display
      const activities = trip.activities || []
      
      // Filter only actual meetings and company visits (exclude drive/travel activities)
      const meetingActivities = activities.filter((a: any) => {
        if (!a.location) return false
        
        const title = a.title?.toLowerCase() || ''
        const activityType = a.activity_type?.toLowerCase() || ''
        
        // Exclude travel/transport activities by title keywords
        const travelKeywords = ['drive', 'return', 'flight', 'travel', 'transport', 'transfer', 'journey']
        if (travelKeywords.some(keyword => title.includes(keyword))) {
          return false
        }
        
        // Include only actual business meeting types
        const validTypes = ['meeting', 'company_visit', 'visit', 'facility_tour']
        return validTypes.includes(activityType)
      }
      )
      
      console.log(`🎯 Trip ${trip.title}: Found ${meetingActivities.length} meeting activities out of ${activities.length} total:`, 
        meetingActivities.map(a => ({ title: a.title, location: a.location, type: a.activity_type }))
      )

      // Extract city information using intelligent geographical analysis
      const getLocationInfo = (location: string) => {
        console.log('🚀 DEBUGGING: getLocationInfo called with:', location)
        const cityInfo = extractCityFromLocation(location)
        console.log('🚀 DEBUGGING: extractCityFromLocation result:', cityInfo)
        if (!cityInfo) return null
        
        // Always use just the city name, never include state codes
        return {
          city: cityInfo.city,
          state: undefined // Never display state codes in trip cards
        }
      }

      // Group activities by city and calculate nights based on activity sequence
      const cityStaysMap = new Map()
      const tripStartDate = new Date(trip.start_date)
      const tripEndDate = new Date(trip.end_date)
      const totalDays = Math.ceil((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // First pass: collect all activities with valid cities
      const activitiesWithCities = meetingActivities
        .map((activity: any) => {
          const cityInfo = getLocationInfo(activity.location)
          if (!cityInfo) return null
          
          // Use just the city name, no state codes for display
          const cityKey = cityInfo.city
          return {
            ...activity,
            cityKey,
            activityDate: new Date(activity.activity_date || activity.date)
          }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.activityDate.getTime() - b.activityDate.getTime())

      // Group activities by city
      activitiesWithCities.forEach((activity: any) => {
        if (!cityStaysMap.has(activity.cityKey)) {
          cityStaysMap.set(activity.cityKey, {
            city: activity.cityKey,
            meetings: [],
            companies: new Set(),
            firstDate: activity.activityDate,
            lastDate: activity.activityDate
          })
        }
        
        const cityData = cityStaysMap.get(activity.cityKey)
        cityData.meetings.push(activity)
        if (activity.company_name) {
          cityData.companies.add(activity.company_name)
        }
        
        // Track date range for this city
        if (activity.activityDate < cityData.firstDate) {
          cityData.firstDate = activity.activityDate
        }
        if (activity.activityDate > cityData.lastDate) {
          cityData.lastDate = activity.activityDate
        }
      })

      // Calculate nights based on city sequence and logic
      const citiesWithMeetings = Array.from(cityStaysMap.keys())
      let cityNightsMap = new Map()

      if (citiesWithMeetings.length === 1) {
        // Single location: entire trip duration
        const singleCity = citiesWithMeetings[0]
        const totalNights = Math.max(1, totalDays - 1) // nights = days - 1
        cityNightsMap.set(singleCity, totalNights)
        console.log(`🏙️ Single city trip: ${singleCity} gets all ${totalNights} nights (${totalDays} days)`)
      } else if (citiesWithMeetings.length > 1) {
        // Multiple cities: calculate based on sequence
        // Example: Santos (day 1) → Guaxupe (day 2) → Varginha (day 3) → Santos (day 4)
        // Result: Santos 2 nights, Guaxupe 1 night, Varginha 1 night
        
        const citySequence = []
        const dateToCity = new Map()
        
        // Map each day to a city based on activities
        activitiesWithCities.forEach((activity: any) => {
          const dateKey = activity.activityDate.toDateString()
          dateToCity.set(dateKey, activity.cityKey)
        })
        
        // Create sequence of cities by day
        const currentDate = new Date(tripStartDate)
        const endDate = new Date(tripEndDate)
        
        while (currentDate <= endDate) {
          const dateKey = currentDate.toDateString()
          const cityForDay = dateToCity.get(dateKey)
          
          if (cityForDay) {
            citySequence.push(cityForDay)
          } else if (citySequence.length > 0) {
            // No activity this day - assume staying in last city
            citySequence.push(citySequence[citySequence.length - 1])
          }
          
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        // Count nights per city based on consecutive day sequences
        console.log('🗺️ City sequence for night calculation:', citySequence)
        
        let currentStay = null
        let stayStartIndex = 0
        
        for (let i = 0; i < citySequence.length; i++) {
          const city = citySequence[i]
          
          if (city !== currentStay) {
            // Switching cities - finalize previous stay
            if (currentStay && i > stayStartIndex) {
              const stayDuration = i - stayStartIndex
              const nights = Math.max(1, stayDuration - 1) // nights = days - 1 (last day is departure)
              console.log(`🏙️ ${currentStay}: ${stayDuration} days = ${nights} nights`)
              cityNightsMap.set(currentStay, (cityNightsMap.get(currentStay) || 0) + nights)
            }
            currentStay = city
            stayStartIndex = i
          }
          
          // Handle the final city
          if (i === citySequence.length - 1 && currentStay) {
            const stayDuration = (i + 1) - stayStartIndex
            const nights = Math.max(1, stayDuration - 1) // nights = days - 1 (last day is departure)
            console.log(`🏙️ ${currentStay} (final): ${stayDuration} days = ${nights} nights`)
            cityNightsMap.set(currentStay, (cityNightsMap.get(currentStay) || 0) + nights)
          }
        }
      }

      // Create location details with consolidated cities and accurate night counts
      const locationDetails = Array.from(cityStaysMap.entries()).map(([cityKey, data]: [string, any]) => {
        const nights = cityNightsMap.get(cityKey) || 1
        console.log(`🎯 City: ${cityKey}, Nights: ${nights}, Meetings: ${data.meetings.length}`)
        
        return {
          city: cityKey,
          nights: nights,
          meetings: data.meetings.length,
          companies: Array.from(data.companies),
          activities: data.meetings,
          weather: undefined // Will be populated by useTripWeather hook
        }
      })

      console.log(`🗺️ Final location details:`, locationDetails.map(l => `${l.city}: ${l.nights} nights, ${l.meetings} meetings`))

      // Get unique cities for weather fetching
      const uniqueLocations = citiesWithMeetings

      // Calculate visit count from filtered activities
      const visitCount = meetingActivities.length

      return {
        id: trip.id,
        title: trip.title,
        subject: trip.description || '',
        client: uniqueCompanies,
        guests,
        wolthersStaff,
        vehicles,
        drivers,
        startDate: new Date(trip.start_date + 'T00:00:00'),
        endDate: new Date(trip.end_date + 'T00:00:00'),
        duration: Math.ceil((new Date(trip.end_date + 'T00:00:00').getTime() - new Date(trip.start_date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)) + 1,
        status: trip.status,
        progress: 0,
        notesCount,
        visitCount: visitCount,
        locations: uniqueLocations, // Unique cities from meetings/visits for instant display
        locationDetails: locationDetails, // Detailed location data with companies
        activities: meetingActivities, // Only meeting/visit activities for display
        allActivities: activities, // Keep all activities for other uses
        accessCode: trip.access_code,
        draftId: trip.draftId || null,
        isDraft: trip.isDraft || false
      }
    })

    console.log(`TripCache: Transformed ${transformedTrips.length} trips from API`)
    return transformedTrips
  }, [])

  /**
   * Refresh trips using cache-first approach with performance monitoring
   */
  const refreshTrips = useCallback(async (options: { force?: boolean } = {}) => {
    const measureDashboardLoad = measurePerformance('dashboard_load', async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        // Start cache hit/miss measurement
        performanceOptimizer.startMeasurement('cache_lookup')
        
        const { data: trips, isStale } = await tripCacheManager.get(
          'all-trips',
          fetchTripsFromAPI,
          { 
            forceRefresh: options.force,
            backgroundRefresh: true
          }
        )

        // Record cache performance
        performanceOptimizer.endMeasurement(isStale ? 'cache_miss' : 'cache_hit', true)
        performanceOptimizer.endMeasurement('cache_lookup', true)

        setState(prev => ({
          ...prev,
          trips,
          loading: false,
          error: null,
          lastRefresh: Date.now()
        }))

        // No longer need to fetch activity counts separately - data comes from main API

        if (systemConfig.development.enableVerboseLogging) {
          console.log(`TripCache: Loaded ${trips.length} trips (${isStale ? 'stale' : 'fresh'})`)
        }
        
      } catch (error) {
        performanceOptimizer.endMeasurement('cache_lookup', false)
        console.error('TripCache: Failed to refresh trips:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load trips'
        }))
      }
    })
    
    await measureDashboardLoad()
  }, [fetchTripsFromAPI])

  /**
   * Fetch activity counts and update trips
   */
  const fetchActivityCounts = useCallback(async (trips: TripCard[]): Promise<TripCard[]> => {
    const tripsWithCounts = await Promise.all(
      trips.map(async (trip) => {
        try {
          const { data: activities } = await activityCacheManager.get(
            `activities-${trip.id}`,
            async () => {
              const response = await fetch(`/api/activities?tripId=${trip.id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              if (!response.ok && response.status !== 404) {
                throw new Error(`HTTP ${response.status}`)
              }
              return response.ok ? await response.json() : []
            },
            { backgroundRefresh: true }
          )

          const visitCount = activities.filter((a: any) => 
            a.activity_type === 'meeting' || 
            a.activity_type === 'visit' ||
            a.activity_type === 'company_visit' ||
            a.activity_type === 'facility_tour'
          ).length

          return { ...trip, visitCount }
        } catch (error) {
          console.warn(`Failed to fetch activities for trip ${trip.id}:`, error)
          return trip
        }
      })
    )

    return tripsWithCounts
  }, [])

  /**
   * Optimistically add a new trip
   */
  const addTrip = useCallback(async (trip: TripCard) => {
    // Immediately update cache
    tripCacheManager.updateOptimistically('all-trips', (currentTrips) => [
      ...currentTrips,
      trip
    ])
    
    // Update state immediately
    setState(prev => ({
      ...prev,
      trips: [...prev.trips, trip]
    }))

    // Queue for background sync
    if (syncManagerRef.current) {
      await syncManagerRef.current.queueOperation({
        id: `create_trip_${trip.id}_${Date.now()}`,
        type: 'create',
        resource: 'trip',
        resourceId: trip.id,
        data: trip,
        mutationId: crypto.randomUUID(),
        timestamp: Date.now(),
        priority: 1,
        retryCount: 0
      })
    }

    console.log('TripCache: Trip added optimistically and queued for sync:', trip.id)
  }, [])

  /**
   * Optimistically update a trip
   */
  const updateTrip = useCallback(async (tripId: string, updates: Partial<TripCard>) => {
    // Immediately update cache
    tripCacheManager.updateOptimistically('all-trips', (currentTrips) =>
      currentTrips.map(trip => 
        trip.id === tripId ? { ...trip, ...updates } : trip
      )
    )
    
    // Update state immediately
    setState(prev => ({
      ...prev,
      trips: prev.trips.map(trip => 
        trip.id === tripId ? { ...trip, ...updates } : trip
      )
    }))

    // Queue for background sync
    if (syncManagerRef.current) {
      await syncManagerRef.current.queueOperation({
        id: `update_trip_${tripId}_${Date.now()}`,
        type: 'update',
        resource: 'trip',
        resourceId: tripId,
        data: updates,
        mutationId: crypto.randomUUID(),
        timestamp: Date.now(),
        priority: 2,
        retryCount: 0
      })
    }

    console.log('TripCache: Trip updated optimistically and queued for sync:', tripId)
  }, [])

  /**
   * Optimistically delete a trip
   */
  const deleteTrip = useCallback(async (tripId: string) => {
    // Immediately update cache
    tripCacheManager.updateOptimistically('all-trips', (currentTrips) =>
      currentTrips.filter(trip => trip.id !== tripId)
    )
    
    // Update state immediately
    setState(prev => ({
      ...prev,
      trips: prev.trips.filter(trip => trip.id !== tripId)
    }))

    // Queue for background sync
    if (syncManagerRef.current) {
      await syncManagerRef.current.queueOperation({
        id: `delete_trip_${tripId}_${Date.now()}`,
        type: 'delete',
        resource: 'trip',
        resourceId: tripId,
        data: undefined,
        mutationId: crypto.randomUUID(),
        timestamp: Date.now(),
        priority: 3, // Higher priority for deletes
        retryCount: 0
      })
    }

    console.log('TripCache: Trip deleted optimistically and queued for sync:', tripId)
  }, [])

  /**
   * Clear all cached data
   */
  const invalidateCache = useCallback(() => {
    tripCacheManager.clear()
    activityCacheManager.clear()
    console.log('TripCache: Cache invalidated')
  }, [])

  /**
   * Get cache performance statistics
   */
  const getCacheStats = useCallback(() => {
    return {
      trips: tripCacheManager.getStats(),
      activities: activityCacheManager.getStats(),
      isOnline: networkManager.isOnline,
      sync: syncManagerRef.current?.getStats() || null
    }
  }, [])

  /**
   * Force sync all data with server
   */
  const forceSyncAll = useCallback(async () => {
    if (syncManagerRef.current) {
      await syncManagerRef.current.forceSyncAll()
    }
  }, [])

  /**
   * Clear sync queue
   */
  const clearSyncQueue = useCallback(async () => {
    if (syncManagerRef.current) {
      await syncManagerRef.current.clearQueue()
      updateSyncStats()
    }
  }, [])

  /**
   * Get sync manager instance
   */
  const getSyncManagerInstance = useCallback(() => {
    return syncManagerRef.current
  }, [])

  /**
   * Update sync statistics
   */
  const updateSyncStats = useCallback(() => {
    if (syncManagerRef.current) {
      const stats = syncManagerRef.current.getStats()
      setState(prev => ({
        ...prev,
        syncStats: stats
      }))
    }
  }, [])

  /**
   * Handle sync events
   */
  const handleSyncEvent = useCallback((event: SyncEvent) => {
    console.log('TripCache: Sync event:', event.type, event.data)
    
    switch (event.type) {
      case 'sync_complete':
        // Refresh trips after successful sync
        if (event.data?.successful > 0) {
          // Add delay to prevent rapid refresh cycles
          setTimeout(() => {
            refreshTrips({ force: false })
          }, 200)
        }
        break
        
      case 'conflict_detected':
        console.warn('TripCache: Conflict detected:', event.data)
        // Could show user notification here
        break
        
      case 'sync_error':
        console.error('TripCache: Sync error:', event.error)
        // Clear sync queue if too many errors accumulate
        if (syncManagerRef.current) {
          const stats = syncManagerRef.current.getStats()
          if (stats.failedOperations > 10) {
            console.warn('TripCache: Too many sync errors, clearing queue')
            syncManagerRef.current.clearQueue()
          }
        }
        break
    }
    
    updateSyncStats()
  }, [refreshTrips])

  // Initialize sync manager
  useEffect(() => {
    if (!syncManagerRef.current) {
      syncManagerRef.current = createSyncManager(tripCacheManager, {
        syncInterval: 30 * 1000, // 30 seconds
        retryAttempts: 3,
        batchSize: 10,
        conflictStrategy: 'merge',
        enableRealTimeSync: true
      })

      // Subscribe to sync events
      const unsubscribeSync = [
        syncManagerRef.current.addEventListener('sync_start', handleSyncEvent),
        syncManagerRef.current.addEventListener('sync_complete', handleSyncEvent),
        syncManagerRef.current.addEventListener('sync_error', handleSyncEvent),
        syncManagerRef.current.addEventListener('conflict_detected', handleSyncEvent),
        syncManagerRef.current.addEventListener('queue_updated', handleSyncEvent)
      ]

      // Initial stats update
      updateSyncStats()

      return () => {
        unsubscribeSync.forEach(unsub => unsub())
        if (syncManagerRef.current) {
          syncManagerRef.current.destroy()
          syncManagerRef.current = null
        }
      }
    }
  }, [handleSyncEvent, updateSyncStats])

  // Listen for network status changes
  useEffect(() => {
    const unsubscribe = networkManager.onStatusChange((online) => {
      setState(prev => ({ ...prev, isOffline: !online }))
      
      if (online) {
        // When coming back online, refresh trips in background
        console.log('TripCache: Back online, refreshing trips')
        refreshTrips({ force: false })
      }
    })

    return unsubscribe
  }, [refreshTrips])

  // Supabase realtime subscription for trip inserts and cancellations
  useEffect(() => {
    const channel = supabase
      .channel('trips-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, () => {
        refreshTrips({ force: true })
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'trips', filter: 'status=eq.cancelled' },
        () => {
          refreshTrips({ force: true })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshTrips])

  // Periodic sync stats update
  useEffect(() => {
    const interval = setInterval(updateSyncStats, 10000) // Every 10 seconds
    return () => clearInterval(interval)
  }, [updateSyncStats])

  // Initial load
  useEffect(() => {
    refreshTrips()
  }, [refreshTrips])

  const contextValue: TripCacheContextValue = {
    trips: state.trips,
    loading: state.loading,
    error: state.error,
    isOffline: state.isOffline,
    lastRefresh: state.lastRefresh,
    syncStats: state.syncStats,
    refreshTrips,
    addTrip,
    updateTrip,
    deleteTrip,
    invalidateCache,
    getCacheStats,
    forceSyncAll,
    clearSyncQueue,
    getSyncManager: getSyncManagerInstance
  }

  return (
    <TripCacheContext.Provider value={contextValue}>
      {children}
    </TripCacheContext.Provider>
  )
}

export function useTripCache(): TripCacheContextValue {
  const context = useContext(TripCacheContext)
  if (!context) {
    throw new Error('useTripCache must be used within a TripCacheProvider')
  }
  return context
}

// Additional hooks for specific use cases
export function useTripById(tripId: string): TripCard | null {
  const { trips } = useTripCache()
  return trips.find(trip => trip.id === tripId) || null
}

export function useTripsByStatus(status: string): TripCard[] {
  const { trips } = useTripCache()
  return trips.filter(trip => trip.status === status)
}