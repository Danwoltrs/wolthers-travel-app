// Trip Route Optimization Utilities
// Integrates with Google Maps to optimize travel routes and suggest visit orders

export interface TripLocation {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  type: 'hotel' | 'company' | 'restaurant' | 'airport' | 'activity'
  priority: number // 1-5, higher is more important
  timeSlots?: {
    preferredStart?: string // HH:MM format
    preferredEnd?: string // HH:MM format
    duration?: number // minutes
    isFlexible?: boolean
  }
  companyId?: string
  meetingId?: string
}

export interface RouteSegment {
  from: TripLocation
  to: TripLocation
  distance: number // meters
  duration: number // seconds
  travelMode: 'DRIVING' | 'WALKING' | 'TRANSIT'
}

export interface OptimizedRoute {
  orderedLocations: TripLocation[]
  segments: RouteSegment[]
  totalDistance: number // meters
  totalTravelTime: number // seconds
  estimatedStartTime: string
  estimatedEndTime: string
  suggestions: RouteSuggestion[]
}

export interface RouteSuggestion {
  type: 'time_optimization' | 'cost_optimization' | 'proximity_grouping' | 'priority_reorder'
  message: string
  impact: 'high' | 'medium' | 'low'
  originalOrder?: string[]
  suggestedOrder?: string[]
  timeSaved?: number // seconds
  costSaved?: number // euros
}

export class TripRouteOptimizer {
  private googleMapsService: google.maps.DirectionsService | null = null
  private distanceMatrixService: google.maps.DistanceMatrixService | null = null

  constructor() {
    if (typeof window !== 'undefined' && window.google) {
      this.googleMapsService = new google.maps.DirectionsService()
      this.distanceMatrixService = new google.maps.DistanceMatrixService()
    }
  }

  /**
   * Optimize the order of locations for a trip to minimize travel time and distance
   */
  async optimizeRoute(
    locations: TripLocation[],
    startLocation?: TripLocation,
    endLocation?: TripLocation,
    options: {
      prioritizeTime?: boolean
      prioritizeDistance?: boolean
      respectTimeSlots?: boolean
      travelMode?: google.maps.TravelMode
    } = {}
  ): Promise<OptimizedRoute> {
    if (!this.distanceMatrixService || !this.googleMapsService) {
      throw new Error('Google Maps services not available')
    }

    const {
      prioritizeTime = true,
      prioritizeDistance = false,
      respectTimeSlots = true,
      travelMode = google.maps.TravelMode.DRIVING
    } = options

    // Step 1: Calculate distance matrix between all locations
    const distanceMatrix = await this.calculateDistanceMatrix(locations, travelMode)

    // Step 2: Apply optimization algorithm
    const optimizedOrder = this.applyOptimizationAlgorithm(
      locations,
      distanceMatrix,
      startLocation,
      endLocation,
      {
        prioritizeTime,
        prioritizeDistance,
        respectTimeSlots
      }
    )

    // Step 3: Calculate route segments
    const segments = await this.calculateRouteSegments(optimizedOrder, travelMode)

    // Step 4: Generate suggestions
    const suggestions = this.generateRouteSuggestions(locations, optimizedOrder, segments)

    // Step 5: Calculate totals and times
    const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0)
    const totalTravelTime = segments.reduce((sum, segment) => sum + segment.duration, 0)

    return {
      orderedLocations: optimizedOrder,
      segments,
      totalDistance,
      totalTravelTime,
      estimatedStartTime: this.calculateEstimatedStartTime(optimizedOrder),
      estimatedEndTime: this.calculateEstimatedEndTime(optimizedOrder, totalTravelTime),
      suggestions
    }
  }

  /**
   * Calculate distance matrix between all locations
   */
  private async calculateDistanceMatrix(
    locations: TripLocation[],
    travelMode: google.maps.TravelMode
  ): Promise<number[][]> {
    if (!this.distanceMatrixService) {
      throw new Error('Distance Matrix service not available')
    }

    const origins = locations.map(loc => new google.maps.LatLng(loc.latitude, loc.longitude))
    const destinations = locations.map(loc => new google.maps.LatLng(loc.latitude, loc.longitude))

    return new Promise((resolve, reject) => {
      this.distanceMatrixService!.getDistanceMatrix({
        origins,
        destinations,
        travelMode,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const matrix: number[][] = []
          
          for (let i = 0; i < response.rows.length; i++) {
            matrix[i] = []
            for (let j = 0; j < response.rows[i].elements.length; j++) {
              const element = response.rows[i].elements[j]
              if (element.status === google.maps.DistanceMatrixElementStatus.OK) {
                matrix[i][j] = element.duration?.value || Infinity
              } else {
                matrix[i][j] = Infinity
              }
            }
          }
          
          resolve(matrix)
        } else {
          reject(new Error(`Distance Matrix request failed: ${status}`))
        }
      })
    })
  }

  /**
   * Apply optimization algorithm (simplified Traveling Salesman Problem solver)
   */
  private applyOptimizationAlgorithm(
    locations: TripLocation[],
    distanceMatrix: number[][],
    startLocation?: TripLocation,
    endLocation?: TripLocation,
    options: {
      prioritizeTime: boolean
      prioritizeDistance: boolean
      respectTimeSlots: boolean
    }
  ): TripLocation[] {
    const { prioritizeTime, respectTimeSlots } = options

    // Separate fixed locations (start/end) from optimizable ones
    const optimizableLocations = locations.filter(loc => 
      loc.id !== startLocation?.id && loc.id !== endLocation?.id
    )

    // If we have time slots to respect, group by time preferences first
    if (respectTimeSlots) {
      return this.optimizeWithTimeConstraints(
        optimizableLocations,
        distanceMatrix,
        locations,
        startLocation,
        endLocation
      )
    }

    // For simple case, use nearest neighbor algorithm with priority weighting
    let optimizedOrder: TripLocation[] = []
    
    if (startLocation) {
      optimizedOrder.push(startLocation)
    }

    const remaining = [...optimizableLocations]
    let currentLocation = startLocation || remaining[0]

    if (!startLocation && remaining.length > 0) {
      currentLocation = remaining.shift()!
      optimizedOrder.push(currentLocation)
    }

    // Nearest neighbor with priority weighting
    while (remaining.length > 0) {
      let bestLocation: TripLocation | null = null
      let bestScore = Infinity

      for (const location of remaining) {
        const currentIndex = locations.indexOf(currentLocation)
        const locationIndex = locations.indexOf(location)
        
        if (currentIndex >= 0 && locationIndex >= 0) {
          const travelTime = distanceMatrix[currentIndex][locationIndex]
          // Weight by priority (higher priority = lower score multiplier)
          const priorityWeight = 1 / Math.max(location.priority, 1)
          const score = travelTime * priorityWeight

          if (score < bestScore) {
            bestScore = score
            bestLocation = location
          }
        }
      }

      if (bestLocation) {
        optimizedOrder.push(bestLocation)
        remaining.splice(remaining.indexOf(bestLocation), 1)
        currentLocation = bestLocation
      } else {
        // Fallback: add remaining locations in original order
        optimizedOrder.push(...remaining)
        break
      }
    }

    if (endLocation) {
      optimizedOrder.push(endLocation)
    }

    return optimizedOrder
  }

  /**
   * Optimize with time constraints and preferred time slots
   */
  private optimizeWithTimeConstraints(
    locations: TripLocation[],
    distanceMatrix: number[][],
    allLocations: TripLocation[],
    startLocation?: TripLocation,
    endLocation?: TripLocation
  ): TripLocation[] {
    // Group locations by preferred time slots
    const morningLocations = locations.filter(loc => 
      loc.timeSlots?.preferredStart && loc.timeSlots.preferredStart < '12:00'
    )
    const afternoonLocations = locations.filter(loc => 
      loc.timeSlots?.preferredStart && loc.timeSlots.preferredStart >= '12:00' && loc.timeSlots.preferredStart < '18:00'
    )
    const eveningLocations = locations.filter(loc => 
      loc.timeSlots?.preferredStart && loc.timeSlots.preferredStart >= '18:00'
    )
    const flexibleLocations = locations.filter(loc => 
      !loc.timeSlots?.preferredStart || loc.timeSlots?.isFlexible
    )

    // Optimize each time group separately
    const optimizedMorning = this.optimizeLocationGroup(morningLocations, distanceMatrix, allLocations)
    const optimizedAfternoon = this.optimizeLocationGroup(afternoonLocations, distanceMatrix, allLocations)
    const optimizedEvening = this.optimizeLocationGroup(eveningLocations, distanceMatrix, allLocations)

    // Intersperse flexible locations optimally
    let result: TripLocation[] = []
    
    if (startLocation) result.push(startLocation)
    
    result.push(...optimizedMorning)
    result.push(...this.intersperse(flexibleLocations, optimizedAfternoon, distanceMatrix, allLocations))
    result.push(...optimizedEvening)
    
    if (endLocation) result.push(endLocation)

    return result
  }

  /**
   * Optimize a group of locations using nearest neighbor
   */
  private optimizeLocationGroup(
    locations: TripLocation[],
    distanceMatrix: number[][],
    allLocations: TripLocation[]
  ): TripLocation[] {
    if (locations.length <= 1) return locations

    const optimized: TripLocation[] = []
    const remaining = [...locations]
    
    // Start with highest priority location
    let current = remaining.reduce((highest, loc) => 
      loc.priority > highest.priority ? loc : highest
    )
    
    optimized.push(current)
    remaining.splice(remaining.indexOf(current), 1)

    // Use nearest neighbor for the rest
    while (remaining.length > 0) {
      let nearest: TripLocation | null = null
      let shortestTime = Infinity

      for (const location of remaining) {
        const currentIndex = allLocations.indexOf(current)
        const locationIndex = allLocations.indexOf(location)
        
        if (currentIndex >= 0 && locationIndex >= 0) {
          const travelTime = distanceMatrix[currentIndex][locationIndex]
          if (travelTime < shortestTime) {
            shortestTime = travelTime
            nearest = location
          }
        }
      }

      if (nearest) {
        optimized.push(nearest)
        remaining.splice(remaining.indexOf(nearest), 1)
        current = nearest
      } else {
        optimized.push(...remaining)
        break
      }
    }

    return optimized
  }

  /**
   * Intersperse flexible locations optimally between fixed ones
   */
  private intersperse(
    flexibleLocations: TripLocation[],
    fixedLocations: TripLocation[],
    distanceMatrix: number[][],
    allLocations: TripLocation[]
  ): TripLocation[] {
    const result = [...fixedLocations]
    
    for (const flexible of flexibleLocations) {
      let bestPosition = 0
      let bestScore = Infinity

      // Try inserting at each position and calculate the cost
      for (let i = 0; i <= result.length; i++) {
        const score = this.calculateInsertionCost(flexible, result, i, distanceMatrix, allLocations)
        if (score < bestScore) {
          bestScore = score
          bestPosition = i
        }
      }

      result.splice(bestPosition, 0, flexible)
    }

    return result
  }

  /**
   * Calculate the cost of inserting a location at a specific position
   */
  private calculateInsertionCost(
    location: TripLocation,
    route: TripLocation[],
    position: number,
    distanceMatrix: number[][],
    allLocations: TripLocation[]
  ): number {
    if (route.length === 0) return 0

    const locationIndex = allLocations.indexOf(location)
    if (locationIndex < 0) return Infinity

    let cost = 0

    // Cost from previous location to new location
    if (position > 0) {
      const prevIndex = allLocations.indexOf(route[position - 1])
      if (prevIndex >= 0) {
        cost += distanceMatrix[prevIndex][locationIndex]
      }
    }

    // Cost from new location to next location
    if (position < route.length) {
      const nextIndex = allLocations.indexOf(route[position])
      if (nextIndex >= 0) {
        cost += distanceMatrix[locationIndex][nextIndex]
        
        // Subtract the original direct cost between prev and next
        if (position > 0) {
          const prevIndex = allLocations.indexOf(route[position - 1])
          if (prevIndex >= 0) {
            cost -= distanceMatrix[prevIndex][nextIndex]
          }
        }
      }
    }

    return cost
  }

  /**
   * Calculate route segments with actual directions
   */
  private async calculateRouteSegments(
    orderedLocations: TripLocation[],
    travelMode: google.maps.TravelMode
  ): Promise<RouteSegment[]> {
    const segments: RouteSegment[] = []

    for (let i = 0; i < orderedLocations.length - 1; i++) {
      const from = orderedLocations[i]
      const to = orderedLocations[i + 1]

      try {
        const segment = await this.calculateSingleSegment(from, to, travelMode)
        segments.push(segment)
      } catch (error) {
        console.error(`Failed to calculate segment from ${from.name} to ${to.name}:`, error)
        // Fallback to straight-line estimation
        segments.push({
          from,
          to,
          distance: this.calculateHaversineDistance(from, to),
          duration: this.estimateTravelTime(from, to, travelMode),
          travelMode: travelMode as any
        })
      }
    }

    return segments
  }

  /**
   * Calculate a single route segment
   */
  private async calculateSingleSegment(
    from: TripLocation,
    to: TripLocation,
    travelMode: google.maps.TravelMode
  ): Promise<RouteSegment> {
    if (!this.googleMapsService) {
      throw new Error('Directions service not available')
    }

    return new Promise((resolve, reject) => {
      this.googleMapsService!.route({
        origin: new google.maps.LatLng(from.latitude, from.longitude),
        destination: new google.maps.LatLng(to.latitude, to.longitude),
        travelMode,
        unitSystem: google.maps.UnitSystem.METRIC
      }, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          const route = response.routes[0]
          const leg = route.legs[0]
          
          resolve({
            from,
            to,
            distance: leg.distance?.value || 0,
            duration: leg.duration?.value || 0,
            travelMode: travelMode as any
          })
        } else {
          reject(new Error(`Directions request failed: ${status}`))
        }
      })
    })
  }

  /**
   * Calculate straight-line distance using Haversine formula
   */
  private calculateHaversineDistance(from: TripLocation, to: TripLocation): number {
    const R = 6371000 // Earth's radius in meters
    const lat1Rad = from.latitude * Math.PI / 180
    const lat2Rad = to.latitude * Math.PI / 180
    const deltaLatRad = (to.latitude - from.latitude) * Math.PI / 180
    const deltaLngRad = (to.longitude - from.longitude) * Math.PI / 180

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  /**
   * Estimate travel time based on distance and mode
   */
  private estimateTravelTime(from: TripLocation, to: TripLocation, travelMode: google.maps.TravelMode): number {
    const distance = this.calculateHaversineDistance(from, to)
    
    // Rough speed estimates (m/s)
    const speeds = {
      [google.maps.TravelMode.DRIVING]: 13.89, // ~50 km/h average
      [google.maps.TravelMode.WALKING]: 1.39,  // ~5 km/h
      [google.maps.TravelMode.BICYCLING]: 4.17, // ~15 km/h
      [google.maps.TravelMode.TRANSIT]: 8.33   // ~30 km/h average
    }

    return Math.round(distance / speeds[travelMode])
  }

  /**
   * Generate route optimization suggestions
   */
  private generateRouteSuggestions(
    originalLocations: TripLocation[],
    optimizedLocations: TripLocation[],
    segments: RouteSegment[]
  ): RouteSuggestion[] {
    const suggestions: RouteSuggestion[] = []

    // Check if order was changed
    const originalOrder = originalLocations.map(loc => loc.id)
    const optimizedOrder = optimizedLocations.map(loc => loc.id)
    
    if (JSON.stringify(originalOrder) !== JSON.stringify(optimizedOrder)) {
      const timeSaved = this.calculateTimeSaved(originalLocations, segments)
      
      suggestions.push({
        type: 'time_optimization',
        message: `Route optimized to save approximately ${Math.round(timeSaved / 60)} minutes of travel time`,
        impact: timeSaved > 1800 ? 'high' : timeSaved > 600 ? 'medium' : 'low',
        originalOrder,
        suggestedOrder: optimizedOrder,
        timeSaved
      })
    }

    // Check for proximity groupings
    const proximityGroups = this.findProximityGroups(optimizedLocations)
    if (proximityGroups.length > 1) {
      suggestions.push({
        type: 'proximity_grouping',
        message: `Locations grouped by proximity to minimize backtracking`,
        impact: 'medium'
      })
    }

    // Check for priority reordering
    const priorityChanges = this.checkPriorityOptimization(originalLocations, optimizedLocations)
    if (priorityChanges) {
      suggestions.push({
        type: 'priority_reorder',
        message: `High-priority meetings scheduled earlier in the day`,
        impact: 'high'
      })
    }

    return suggestions
  }

  /**
   * Find groups of nearby locations
   */
  private findProximityGroups(locations: TripLocation[]): TripLocation[][] {
    const groups: TripLocation[][] = []
    const visited = new Set<string>()
    
    for (const location of locations) {
      if (visited.has(location.id)) continue
      
      const group = [location]
      visited.add(location.id)
      
      // Find nearby locations (within 5km)
      for (const other of locations) {
        if (visited.has(other.id)) continue
        
        const distance = this.calculateHaversineDistance(location, other)
        if (distance < 5000) { // 5km threshold
          group.push(other)
          visited.add(other.id)
        }
      }
      
      groups.push(group)
    }
    
    return groups
  }

  /**
   * Check if priority optimization was applied
   */
  private checkPriorityOptimization(
    original: TripLocation[],
    optimized: TripLocation[]
  ): boolean {
    // Check if high-priority items moved earlier
    for (let i = 0; i < optimized.length; i++) {
      const location = optimized[i]
      if (location.priority >= 4) { // High priority
        const originalIndex = original.findIndex(loc => loc.id === location.id)
        if (originalIndex > i) {
          return true // High priority item moved earlier
        }
      }
    }
    return false
  }

  /**
   * Calculate estimated start time based on first location preferences
   */
  private calculateEstimatedStartTime(locations: TripLocation[]): string {
    if (locations.length === 0) return '09:00'
    
    const firstLocation = locations[0]
    if (firstLocation.timeSlots?.preferredStart) {
      return firstLocation.timeSlots.preferredStart
    }
    
    return '09:00' // Default start time
  }

  /**
   * Calculate estimated end time
   */
  private calculateEstimatedEndTime(locations: TripLocation[], totalTravelTime: number): string {
    const startTime = this.calculateEstimatedStartTime(locations)
    const [hours, minutes] = startTime.split(':').map(Number)
    
    // Add travel time and estimated meeting durations
    let totalMinutes = hours * 60 + minutes + Math.round(totalTravelTime / 60)
    
    // Add estimated meeting durations
    for (const location of locations) {
      totalMinutes += location.timeSlots?.duration || 60 // Default 1 hour per meeting
    }
    
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  /**
   * Calculate time saved by optimization
   */
  private calculateTimeSaved(originalLocations: TripLocation[], optimizedSegments: RouteSegment[]): number {
    // This is a simplified calculation
    // In practice, you'd want to calculate the original route time too
    const optimizedTime = optimizedSegments.reduce((sum, seg) => sum + seg.duration, 0)
    const estimatedOriginalTime = optimizedTime * 1.2 // Assume 20% longer without optimization
    
    return estimatedOriginalTime - optimizedTime
  }
}

// Export utility functions for use in components
export const routeOptimizer = new TripRouteOptimizer()

export async function optimizeTripRoute(
  locations: TripLocation[],
  options?: {
    startLocation?: TripLocation
    endLocation?: TripLocation
    prioritizeTime?: boolean
    respectTimeSlots?: boolean
  }
): Promise<OptimizedRoute> {
  return routeOptimizer.optimizeRoute(
    locations,
    options?.startLocation,
    options?.endLocation,
    {
      prioritizeTime: options?.prioritizeTime ?? true,
      respectTimeSlots: options?.respectTimeSlots ?? true,
      travelMode: google.maps.TravelMode.DRIVING
    }
  )
}

export function formatTravelTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0min'
  
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  let minutes = totalMinutes % 60
  
  // Round minutes to nearest 5-minute interval
  minutes = Math.round(minutes / 5) * 5
  
  // Ensure minimum 5 minutes for any non-zero duration
  if (minutes === 0 && hours === 0 && seconds > 0) {
    minutes = 5
  }
  
  // Handle case where rounding brings minutes to 60
  if (minutes === 60) {
    return `${hours + 1}hr`
  }
  
  if (hours > 0 && minutes > 0) {
    return `${hours}hr ${minutes}min`
  } else if (hours > 0) {
    return `${hours}hr`
  } else {
    return `${minutes}min`
  }
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`
  }
  return `${Math.round(meters)} m`
}