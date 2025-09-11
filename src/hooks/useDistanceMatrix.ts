import { useState, useCallback } from 'react'
import { cachedDistanceMatrixRequest, type DistanceMatrixRequest } from '@/lib/distance-cache'

export interface DistanceMatrixResult {
  rows: Array<{
    elements: Array<{
      distance: {
        text: string
        value: number // meters
      }
      duration: {
        text: string
        value: number // seconds
      }
      status: string
    }>
  }>
  origin_addresses: string[]
  destination_addresses: string[]
  status: string
}

export interface UseDistanceMatrixReturn {
  data: DistanceMatrixResult | null
  loading: boolean
  error: string | null
  calculate: (request: DistanceMatrixRequest) => Promise<void>
  reset: () => void
}

export function useDistanceMatrix(): UseDistanceMatrixReturn {
  const [data, setData] = useState<DistanceMatrixResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(async (request: DistanceMatrixRequest) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🗺️ [useDistanceMatrix] Calculating distances:', {
        origins: request.origins.length,
        destinations: request.destinations.length,
        mode: request.mode || 'driving'
      })

      const result = await cachedDistanceMatrixRequest(request)
      
      if (result.status !== 'OK') {
        throw new Error(`Google Maps API error: ${result.status}`)
      }

      setData(result)
      console.log('✅ [useDistanceMatrix] Distance calculation successful')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate distances'
      console.error('❌ [useDistanceMatrix] Distance calculation failed:', errorMessage)
      setError(errorMessage)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    calculate,
    reset
  }
}

// Utility hook for calculating intercity travel times for trip planning
export function useIntercityTravel() {
  const { data, loading, error, calculate, reset } = useDistanceMatrix()

  const calculateIntercityRoute = useCallback(async (cities: string[], mode: 'driving' | 'transit' = 'driving') => {
    if (cities.length < 2) {
      throw new Error('At least 2 cities required for route calculation')
    }

    // For intercity travel, we calculate from each city to all subsequent cities
    const origins = cities.slice(0, -1) // All cities except the last
    const destinations = cities.slice(1) // All cities except the first

    await calculate({
      origins,
      destinations,
      mode,
      units: 'metric'
    })
  }, [calculate])

  const getTotalTravelTime = useCallback((): number => {
    if (!data || !data.rows) return 0

    let totalSeconds = 0
    for (let i = 0; i < data.rows.length; i++) {
      const element = data.rows[i].elements[0] // First (and usually only) destination
      if (element.status === 'OK') {
        totalSeconds += element.duration.value
      }
    }

    return totalSeconds
  }, [data])

  const getTotalDistance = useCallback((): number => {
    if (!data || !data.rows) return 0

    let totalMeters = 0
    for (let i = 0; i < data.rows.length; i++) {
      const element = data.rows[i].elements[0] // First (and usually only) destination
      if (element.status === 'OK') {
        totalMeters += element.distance.value
      }
    }

    return totalMeters
  }, [data])

  const getRouteSegments = useCallback(() => {
    if (!data || !data.rows) return []

    const segments = []
    for (let i = 0; i < data.rows.length; i++) {
      const element = data.rows[i].elements[0]
      if (element.status === 'OK') {
        segments.push({
          from: data.origin_addresses[i],
          to: data.destination_addresses[0],
          distance: element.distance,
          duration: element.duration
        })
      }
    }

    return segments
  }, [data])

  return {
    data,
    loading,
    error,
    calculateIntercityRoute,
    getTotalTravelTime,
    getTotalDistance,
    getRouteSegments,
    reset
  }
}

// Helper function to format duration in a human-readable way
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Helper function to format distance in a human-readable way
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  const kilometers = meters / 1000
  return `${kilometers.toFixed(1)}km`
}