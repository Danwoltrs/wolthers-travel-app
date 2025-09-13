// Google Maps utility functions for travel distance and time calculations

declare global {
  interface Window {
    google: any
  }
}

export interface Location {
  lat: number
  lng: number
  address?: string
  name?: string
}

export interface TravelInfo {
  distance: {
    text: string
    value: number // meters
  }
  duration: {
    text: string
    value: number // seconds
  }
  origin: Location
  destination: Location
}

// Load Google Maps API if not already loaded
export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve()
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkGoogle = () => {
        if (window.google) {
          resolve()
        } else {
          setTimeout(checkGoogle, 100)
        }
      }
      checkGoogle()
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      reject(new Error('Google Maps API key not configured'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if (window.google) {
        resolve()
      } else {
        reject(new Error('Google Maps failed to initialize'))
      }
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps'))
    }

    document.head.appendChild(script)
  })
}

// Geocode an address to get coordinates
export const geocodeLocation = async (address: string, retryCount = 0): Promise<Location | null> => {
  return new Promise((resolve) => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps API not available for geocoding')
      resolve(null)
      return
    }

    const geocoder = new window.google.maps.Geocoder()
    
    const delay = retryCount * 100 // 0ms, 100ms, 200ms delays for retries
    setTimeout(() => {
      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            address: results[0].formatted_address,
            name: address
          })
        } else if (status === 'OVER_QUERY_LIMIT' && retryCount < 2) {
          console.warn(`Geocoding rate limit hit for "${address}", retrying...`)
          setTimeout(() => {
            geocodeLocation(address, retryCount + 1).then(resolve)
          }, Math.pow(2, retryCount) * 1000)
        } else {
          console.warn(`Geocoding failed for "${address}": ${status}`)
          resolve(null)
        }
      })
    }, delay)
  })
}

// Calculate travel distance and time between locations using cached API
export const calculateTravelTime = async (origin: Location, destination: Location): Promise<TravelInfo | null> => {
  try {
    // First try using our cached Distance Matrix API
    const originString = origin.address || `${origin.lat},${origin.lng}`
    const destinationString = destination.address || `${destination.lat},${destination.lng}`
    
    console.log(`🗺️ [Maps Utils] Calculating travel time: ${originString} → ${destinationString}`)
    
    const response = await fetch('/api/google-maps/distance-matrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origins: [originString],
        destinations: [destinationString],
        mode: 'driving',
        units: 'metric'
      })
    })

    if (!response.ok) {
      throw new Error(`Distance Matrix API failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const element = data.rows[0].elements[0]
      const cacheHeader = response.headers.get('X-Cache')
      console.log(`✅ [Maps Utils] Travel time calculated ${cacheHeader === 'HIT' ? '(cached)' : '(fresh)'}: ${element.duration.text} (${element.distance.text})`)
      
      return {
        distance: element.distance,
        duration: element.duration,
        origin,
        destination
      }
    } else {
      const elementStatus = data.rows?.[0]?.elements?.[0]?.status
      console.warn(`Distance Matrix API returned error - API Status: ${data.status}, Element Status: ${elementStatus}`)
      console.warn('Full API response:', JSON.stringify(data, null, 2))
      return fallbackToClientSideAPI(origin, destination)
    }
  } catch (error) {
    console.warn('Cached Distance Matrix API failed, falling back to client-side:', error)
    return fallbackToClientSideAPI(origin, destination)
  }
}

// Fallback to client-side Google Maps API if server-side fails
const fallbackToClientSideAPI = async (origin: Location, destination: Location): Promise<TravelInfo | null> => {
  return new Promise((resolve) => {
    if (!window.google || !window.google.maps) {
      console.warn('Google Maps client API not available for distance calculation')
      resolve(null)
      return
    }

    const service = new window.google.maps.DistanceMatrixService()
    
    service.getDistanceMatrix({
      origins: [{ lat: origin.lat, lng: origin.lng }],
      destinations: [{ lat: destination.lat, lng: destination.lng }],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, (response: any, status: string) => {
      if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
        const element = response.rows[0].elements[0]
        console.log('✅ [Maps Utils] Fallback calculation successful:', element.duration.text, `(${element.distance.text})`)
        resolve({
          distance: element.distance,
          duration: element.duration,
          origin,
          destination
        })
      } else {
        const elementStatus = response.rows?.[0]?.elements?.[0]?.status
        console.warn(`Fallback distance calculation failed - Status: ${status}, Element Status: ${elementStatus}`)
        console.warn('Fallback response:', JSON.stringify(response, null, 2))
        
        // Use Brazilian location-based calculation as intelligent fallback
        // This provides much more accurate estimates than hardcoded 30 minutes
        console.log('🔄 [Maps Utils] Google APIs failed, using Brazilian location fallback')
        
        try {
          // Import Brazilian calculation function
          const { calculateTravelTime: calculateLocalTravelTime } = require('./brazilian-locations')
          
          // Extract city names from addresses for Brazilian calculation
          const originCity = extractCityFromLocation(origin)
          const destinationCity = extractCityFromLocation(destination)
          
          console.log(`🗺️ [Maps Utils] Fallback calculation: ${originCity} → ${destinationCity}`)
          
          if (originCity && destinationCity) {
            const fallbackHours = calculateLocalTravelTime(originCity, destinationCity)
            const fallbackSeconds = Math.round(fallbackHours * 3600)
            const fallbackMinutes = Math.round(fallbackHours * 60)
            
            // Estimate distance based on travel time (60 km/h average)
            const estimatedDistanceKm = Math.round(fallbackHours * 60)
            
            const estimatedDuration = {
              text: formatDurationFromHours(fallbackHours),
              value: fallbackSeconds
            }
            const estimatedDistance = {
              text: `${estimatedDistanceKm} km`,
              value: estimatedDistanceKm * 1000 // meters
            }
            
            console.log(`✅ [Maps Utils] Brazilian fallback: ${estimatedDuration.text} (${estimatedDistance.text})`)
            resolve({
              distance: estimatedDistance,
              duration: estimatedDuration,
              origin,
              destination
            })
            return
          }
        } catch (error) {
          console.warn('🚨 [Maps Utils] Brazilian fallback failed:', error.message)
        }
        
        // Final conservative fallback for completely unknown locations
        const estimatedDuration = {
          text: '2h 30min',
          value: 9000 // 2.5 hours in seconds (much more reasonable than 30 minutes)
        }
        const estimatedDistance = {
          text: '150 km',
          value: 150000 // 150 km in meters
        }
        
        console.log('🔄 [Maps Utils] Using conservative 2.5h fallback for unknown locations')
        resolve({
          distance: estimatedDistance,
          duration: estimatedDuration,
          origin,
          destination
        })
      }
    })
  })
}

// Calculate optimal route between multiple locations
export const optimizeRoute = async (locations: Location[]): Promise<Location[]> => {
  if (locations.length <= 2) return locations

  await loadGoogleMapsAPI()

  // For simplicity, we'll use a basic optimization algorithm
  // Start with the first location
  const optimizedRoute: Location[] = [locations[0]]
  const remaining = locations.slice(1)

  let currentLocation = locations[0]
  
  while (remaining.length > 0) {
    let nearestIndex = 0
    let shortestDistance = Infinity

    // Find the nearest remaining location
    for (let i = 0; i < remaining.length; i++) {
      const distance = calculateStraightLineDistance(currentLocation, remaining[i])
      if (distance < shortestDistance) {
        shortestDistance = distance
        nearestIndex = i
      }
    }

    // Add the nearest location to the route
    const nearestLocation = remaining.splice(nearestIndex, 1)[0]
    optimizedRoute.push(nearestLocation)
    currentLocation = nearestLocation
  }

  return optimizedRoute
}

// Helper function to calculate straight-line distance between two points
const calculateStraightLineDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
  const dLon = (loc2.lng - loc1.lng) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in kilometers
}

// Convert seconds to human-readable time
export const formatDuration = (seconds: number): string => {
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

// Convert meters to human-readable distance
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

// Helper function to extract city name from location object for Brazilian calculation
const extractCityFromLocation = (location: Location): string => {
  if (location.name && location.name !== location.address) {
    // If name is provided and different from address, use name
    return location.name
  }
  
  if (location.address) {
    // Try to extract city from address string
    const addressParts = location.address.split(',')
    if (addressParts.length > 0) {
      // Take the first part as city (before first comma)
      const cityPart = addressParts[0].trim()
      
      // Remove common address prefixes
      const cleanCity = cityPart
        .replace(/^\d+\s+/, '') // Remove leading numbers
        .replace(/^(rua|av|avenida|alameda|estrada|rodovia)\s+/i, '') // Remove street prefixes
        .trim()
      
      return cleanCity
    }
  }
  
  return ''
}

// Helper function to format hours into readable duration text
const formatDurationFromHours = (hours: number): string => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes} min`
  }
  
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  
  if (minutes === 0) {
    return `${wholeHours}h`
  } else if (minutes === 60) {
    return `${wholeHours + 1}h`
  } else {
    return `${wholeHours}h ${minutes}min`
  }
}