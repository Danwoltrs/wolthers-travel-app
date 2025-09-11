// Travel Calculation Service
// Integrates Google Maps Distance Matrix and Landing Time calculations
// for trip creation and activity management

import { cachedDistanceMatrixRequest, type DistanceMatrixRequest } from '@/lib/distance-cache'

// Types for travel calculations
export interface TravelCalculationRequest {
  origin: string
  destination: string
  mode?: 'driving' | 'walking' | 'transit' | 'bicycling'
  departureTime?: string // ISO datetime string
}

export interface TravelCalculationResult {
  distance: {
    meters: number
    text: string
  }
  duration: {
    seconds: number
    text: string
  }
  origin_address: string
  destination_address: string
  travel_mode: string
  calculated_at: string
}

export interface FlightLandingRequest {
  flightInfo: {
    flightNumber: string
    airline: string
    arrivalDate: string
    arrivalTime: string
    departureAirport?: string
    arrivalAirport?: string
  }
  customBufferMinutes?: number
}

export interface FlightLandingResult {
  scheduledArrival: {
    datetime: string
    date: string
    time: string
  }
  estimatedLandingTime: {
    datetime: string
    date: string
    time: string
  }
  recommendedPickupTime: {
    datetime: string
    date: string
    time: string
  }
  bufferMinutes: number
  bufferReason: string
  calculatedAt: string
}

export interface IntercityTravelCalculation {
  route: {
    origin: string
    destination: string
    distance: TravelCalculationResult
  }
  flightLanding?: FlightLandingResult
  totalTravelTime: number // in seconds
  recommendedDepartureTime?: string
  activities: Array<{
    type: 'flight' | 'pickup' | 'drive' | 'arrival'
    title: string
    time: string
    duration_minutes: number
    location?: string
    description?: string
    metadata?: any
  }>
}

class TravelCalculationService {
  
  /**
   * Calculate travel distance and duration between two points
   */
  async calculateTravelDistance(request: TravelCalculationRequest): Promise<TravelCalculationResult> {
    const distanceRequest: DistanceMatrixRequest = {
      origins: [request.origin],
      destinations: [request.destination],
      mode: request.mode || 'driving',
      units: 'metric'
    }

    console.log('🗺️ [TravelCalc] Calculating distance:', {
      origin: request.origin.substring(0, 50),
      destination: request.destination.substring(0, 50),
      mode: request.mode || 'driving'
    })

    const result = await cachedDistanceMatrixRequest(distanceRequest)
    
    if (result.status !== 'OK' || !result.rows || result.rows.length === 0) {
      throw new Error(`Distance calculation failed: ${result.status}`)
    }

    const element = result.rows[0].elements[0]
    if (element.status !== 'OK') {
      throw new Error(`Route not found: ${element.status}`)
    }

    const travelResult: TravelCalculationResult = {
      distance: {
        meters: element.distance.value,
        text: element.distance.text
      },
      duration: {
        seconds: element.duration.value,
        text: element.duration.text
      },
      origin_address: result.origin_addresses[0],
      destination_address: result.destination_addresses[0],
      travel_mode: request.mode || 'driving',
      calculated_at: new Date().toISOString()
    }

    console.log('✅ [TravelCalc] Distance calculation successful:', {
      distance: travelResult.distance.text,
      duration: travelResult.duration.text
    })

    return travelResult
  }

  /**
   * Calculate flight landing time with airport buffers
   */
  async calculateFlightLanding(request: FlightLandingRequest): Promise<FlightLandingResult> {
    console.log('🛬 [TravelCalc] Calculating flight landing time:', {
      flight: `${request.flightInfo.airline} ${request.flightInfo.flightNumber}`,
      arrival: `${request.flightInfo.arrivalDate} ${request.flightInfo.arrivalTime}`,
      route: `${request.flightInfo.departureAirport} → ${request.flightInfo.arrivalAirport || 'GRU'}`
    })

    const response = await fetch('/api/flights/landing-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        arrivalTime: request.flightInfo.arrivalTime,
        arrivalDate: request.flightInfo.arrivalDate,
        departureAirport: request.flightInfo.departureAirport,
        arrivalAirport: request.flightInfo.arrivalAirport || 'GRU',
        customBufferMinutes: request.customBufferMinutes
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Landing time calculation failed: ${response.status}`)
    }

    const landingData = await response.json()
    
    const result: FlightLandingResult = {
      scheduledArrival: landingData.scheduledArrival,
      estimatedLandingTime: landingData.estimatedLandingTime,
      recommendedPickupTime: landingData.recommendedPickupTime,
      bufferMinutes: landingData.bufferCalculation.bufferMinutes,
      bufferReason: landingData.bufferCalculation.bufferReason,
      calculatedAt: new Date().toISOString()
    }

    console.log('✅ [TravelCalc] Flight landing calculation successful:', {
      scheduledArrival: result.scheduledArrival.datetime,
      recommendedPickup: result.recommendedPickupTime.datetime,
      bufferMinutes: result.bufferMinutes
    })

    return result
  }

  /**
   * Calculate complete intercity travel itinerary (flight + ground transport)
   * Example: Randy's JFK → GRU flight + drive to Santos Sheraton Hotel
   */
  async calculateIntercityTravel(
    flightInfo: {
      flightNumber: string
      airline: string
      arrivalDate: string
      arrivalTime: string
      departureAirport?: string
      passengerName: string
    },
    groundTransport: {
      origin: string // e.g., "GRU Airport, São Paulo, Brazil"
      destination: string // e.g., "Sheraton Santos Hotel, Santos, SP, Brazil"
      mode?: 'driving' | 'transit'
    },
    options?: {
      customFlightBuffer?: number
      includePreparationTime?: number // Additional time for driver preparation
    }
  ): Promise<IntercityTravelCalculation> {
    
    console.log('🌍 [TravelCalc] Calculating intercity travel:', {
      flight: `${flightInfo.airline} ${flightInfo.flightNumber}`,
      passenger: flightInfo.passengerName,
      route: `${groundTransport.origin} → ${groundTransport.destination}`
    })

    // Calculate flight landing time
    const flightLanding = await this.calculateFlightLanding({
      flightInfo: {
        ...flightInfo,
        arrivalAirport: 'GRU'
      },
      customBufferMinutes: options?.customFlightBuffer
    })

    // Calculate ground transportation distance/time
    const groundDistance = await this.calculateTravelDistance({
      origin: groundTransport.origin,
      destination: groundTransport.destination,
      mode: groundTransport.mode || 'driving'
    })

    // Calculate recommended departure time for ground transport
    const pickupTime = new Date(flightLanding.recommendedPickupTime.datetime)
    const preparationMinutes = options?.includePreparationTime || 0
    const departureTime = new Date(pickupTime.getTime() - (preparationMinutes * 60 * 1000))

    // Calculate arrival time at final destination
    const arrivalTime = new Date(pickupTime.getTime() + (groundDistance.duration.seconds * 1000))

    // Create activity timeline
    const activities = [
      {
        type: 'flight' as const,
        title: `${flightInfo.airline} ${flightInfo.flightNumber} Landing`,
        time: flightLanding.estimatedLandingTime.datetime,
        duration_minutes: flightLanding.bufferMinutes,
        location: groundTransport.origin,
        description: `Flight arrival with ${flightLanding.bufferMinutes} min buffer for ${flightLanding.bufferReason.toLowerCase()}`,
        metadata: {
          flight_info: flightInfo,
          scheduled_arrival: flightLanding.scheduledArrival.datetime,
          estimated_landing: flightLanding.estimatedLandingTime.datetime
        }
      },
      {
        type: 'pickup' as const,
        title: `Airport Pickup - ${flightInfo.passengerName}`,
        time: flightLanding.recommendedPickupTime.datetime,
        duration_minutes: 15,
        location: groundTransport.origin,
        description: `Pickup coordination for ${flightInfo.passengerName}`,
        metadata: {
          passenger_name: flightInfo.passengerName,
          pickup_location: groundDistance.origin_address
        }
      },
      {
        type: 'drive' as const,
        title: `Drive to ${groundTransport.destination}`,
        time: pickupTime.toISOString(),
        duration_minutes: Math.ceil(groundDistance.duration.seconds / 60),
        location: `${groundDistance.origin_address} → ${groundDistance.destination_address}`,
        description: `${groundDistance.distance.text} drive (${groundDistance.duration.text}) via ${groundTransport.mode}`,
        metadata: {
          distance_meters: groundDistance.distance.meters,
          duration_seconds: groundDistance.duration.seconds,
          travel_mode: groundDistance.travel_mode,
          origin_address: groundDistance.origin_address,
          destination_address: groundDistance.destination_address
        }
      },
      {
        type: 'arrival' as const,
        title: `Arrival at Destination`,
        time: arrivalTime.toISOString(),
        duration_minutes: 30,
        location: groundDistance.destination_address,
        description: `Arrival and check-in at ${groundTransport.destination}`,
        metadata: {
          destination_type: groundTransport.destination.toLowerCase().includes('hotel') ? 'hotel' : 'office',
          total_travel_time: Math.ceil((arrivalTime.getTime() - pickupTime.getTime()) / 60000)
        }
      }
    ]

    const result: IntercityTravelCalculation = {
      route: {
        origin: groundDistance.origin_address,
        destination: groundDistance.destination_address,
        distance: groundDistance
      },
      flightLanding,
      totalTravelTime: groundDistance.duration.seconds,
      recommendedDepartureTime: departureTime.toISOString(),
      activities
    }

    console.log('✅ [TravelCalc] Intercity travel calculation complete:', {
      flightLanding: flightLanding.recommendedPickupTime.datetime,
      finalArrival: arrivalTime.toISOString(),
      totalActivities: activities.length,
      driveDistance: groundDistance.distance.text,
      driveDuration: groundDistance.duration.text
    })

    return result
  }

  /**
   * Utility function to format duration in human-readable format
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  /**
   * Utility function to format distance in human-readable format
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    }
    const kilometers = meters / 1000
    return `${kilometers.toFixed(1)}km`
  }

  /**
   * Check if distance calculation is recent (less than 10 minutes old)
   */
  isCalculationFresh(calculatedAt: string): boolean {
    const calculationTime = new Date(calculatedAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - calculationTime.getTime()) / (1000 * 60)
    return diffMinutes < 10
  }
}

// Export singleton instance
export const travelCalculationService = new TravelCalculationService()

// Export helper functions
export {
  TravelCalculationService
}

// Export types
export type {
  TravelCalculationRequest,
  TravelCalculationResult,
  FlightLandingRequest,
  FlightLandingResult,
  IntercityTravelCalculation
}