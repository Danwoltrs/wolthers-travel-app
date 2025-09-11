import { useState, useCallback } from 'react'

interface LandingTimeRequest {
  arrivalTime: string      // Format: "HH:MM" (24-hour format)
  arrivalDate: string      // Format: "YYYY-MM-DD"
  departureAirport?: string // Airport code (e.g., "JFK")
  arrivalAirport?: string   // Airport code (e.g., "GRU") 
  flightType?: 'international' | 'domestic' // Override automatic detection
  customBufferMinutes?: number // Custom buffer time override
}

interface LandingTimeResponse {
  // Input information
  scheduledArrival: {
    date: string
    time: string
    datetime: string
  }
  
  // Calculated landing time (arrival + buffer)
  estimatedLandingTime: {
    date: string
    time: string  
    datetime: string
  }
  
  // Buffer calculation details
  bufferCalculation: {
    bufferMinutes: number
    bufferReason: string
    airportClassification?: {
      departureAirport?: string
      arrivalAirport?: string
      flightType: 'international' | 'domestic'
      airportSize: string
    }
  }
  
  // Practical pickup time recommendation
  recommendedPickupTime: {
    date: string
    time: string
    datetime: string
    pickupBufferMinutes: number // Additional buffer for pickup coordination
  }
}

export interface UseLandingTimeReturn {
  data: LandingTimeResponse | null
  loading: boolean
  error: string | null
  calculateLandingTime: (request: LandingTimeRequest) => Promise<void>
  reset: () => void
  // Utility functions
  getPickupTime: () => string | null
  getLandingTime: () => string | null
  getTotalBufferMinutes: () => number
  getBufferExplanation: () => string | null
}

export function useLandingTimeCalculation(): UseLandingTimeReturn {
  const [data, setData] = useState<LandingTimeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateLandingTime = useCallback(async (request: LandingTimeRequest) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🛬 [useLandingTime] Calculating landing time:', {
        arrivalDate: request.arrivalDate,
        arrivalTime: request.arrivalTime,
        route: `${request.departureAirport || 'Unknown'} → ${request.arrivalAirport || 'Unknown'}`,
        flightType: request.flightType || 'auto-detect'
      })

      const response = await fetch('/api/flights/landing-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Landing time calculation failed: ${response.status}`)
      }

      const result: LandingTimeResponse = await response.json()
      
      setData(result)
      console.log('✅ [useLandingTime] Calculation successful:', {
        scheduledArrival: result.scheduledArrival.datetime,
        estimatedLanding: result.estimatedLandingTime.datetime,
        recommendedPickup: result.recommendedPickupTime.datetime,
        bufferMinutes: result.bufferCalculation.bufferMinutes
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate landing time'
      console.error('❌ [useLandingTime] Calculation failed:', errorMessage)
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

  // Utility function to get recommended pickup time in HH:MM format
  const getPickupTime = useCallback((): string | null => {
    if (!data) return null
    return data.recommendedPickupTime.time
  }, [data])

  // Utility function to get estimated landing time in HH:MM format
  const getLandingTime = useCallback((): string | null => {
    if (!data) return null
    return data.estimatedLandingTime.time
  }, [data])

  // Utility function to get total buffer minutes (landing buffer + pickup buffer)
  const getTotalBufferMinutes = useCallback((): number => {
    if (!data) return 0
    return data.bufferCalculation.bufferMinutes + data.recommendedPickupTime.pickupBufferMinutes
  }, [data])

  // Utility function to get human-readable buffer explanation
  const getBufferExplanation = useCallback((): string | null => {
    if (!data) return null
    
    const landingBuffer = data.bufferCalculation.bufferMinutes
    const pickupBuffer = data.recommendedPickupTime.pickupBufferMinutes
    const total = landingBuffer + pickupBuffer
    
    return `${total} minutes total (${landingBuffer} min ${data.bufferCalculation.airportClassification?.flightType || 'flight'} buffer + ${pickupBuffer} min pickup coordination)`
  }, [data])

  return {
    data,
    loading,
    error,
    calculateLandingTime,
    reset,
    getPickupTime,
    getLandingTime,
    getTotalBufferMinutes,
    getBufferExplanation
  }
}

// Helper function to extract flight info from common flight info objects
export function extractLandingTimeRequest(flightInfo: {
  arrivalDate: string
  arrivalTime: string
  departureAirport?: string
  airline?: string
  flightNumber?: string
}): LandingTimeRequest {
  return {
    arrivalTime: flightInfo.arrivalTime,
    arrivalDate: flightInfo.arrivalDate,
    departureAirport: flightInfo.departureAirport,
    arrivalAirport: 'GRU', // Default to GRU for São Paulo arrivals
    // Auto-detect flight type based on departure airport
    // Will be determined by the API based on route
  }
}

// Helper function to format landing time calculation results for display
export function formatLandingTimeResults(data: LandingTimeResponse | null): {
  scheduledArrival: string
  estimatedLanding: string
  recommendedPickup: string
  bufferInfo: string
} | null {
  if (!data) return null

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}:00`)
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  return {
    scheduledArrival: formatDateTime(data.scheduledArrival.date, data.scheduledArrival.time),
    estimatedLanding: formatDateTime(data.estimatedLandingTime.date, data.estimatedLandingTime.time),
    recommendedPickup: formatDateTime(data.recommendedPickupTime.date, data.recommendedPickupTime.time),
    bufferInfo: data.bufferCalculation.bufferReason
  }
}

// Export types for use in other components
export type { LandingTimeRequest, LandingTimeResponse }