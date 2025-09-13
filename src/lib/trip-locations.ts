import { differenceInDays, parseISO, isWithinInterval } from 'date-fns'

export interface TripActivity {
  activity_date: string
  location: string
  type: string
  start_time: string
  end_time: string
  activity_title: string
}

export interface LocationStay {
  city: string
  country?: string
  nights: number
  startDate: string
  endDate: string
}

export interface WeatherData {
  temperature: number
  condition: string
  icon: string
  description: string
}

export interface LocationWithWeather extends LocationStay {
  weather?: WeatherData | null
  weatherError?: string
}

/**
 * Extracts city names from location strings, handling various formats
 */
function extractCityFromLocation(location: string): string | null {
  if (!location || location.trim() === '') return null
  
  // Handle flight routes (GRU → FRA, NYC → LON, etc.)
  if (location.includes('→') || location.includes('->')) {
    return null // Skip flight routes
  }
  
  // Handle hotel/venue with city (e.g., "Hyperion Hotel - Basel")
  if (location.includes(' - ')) {
    const parts = location.split(' - ')
    return parts[parts.length - 1].trim()
  }
  
  // Handle simple venue names that might be cities
  const cleanLocation = location.trim()
  
  // Skip if it looks like an airport code (3 letters)
  if (/^[A-Z]{3}$/.test(cleanLocation)) {
    return null
  }
  
  // Return as-is for processing
  return cleanLocation
}

/**
 * Calculates nights spent in each location based on trip activities
 */
export function calculateLocationStays(
  activities: TripActivity[],
  tripStartDate: string,
  tripEndDate: string
): LocationStay[] {
  if (!activities || activities.length === 0) {
    return []
  }

  // Group activities by date and extract locations
  const locationsByDate = new Map<string, Set<string>>()
  
  activities.forEach(activity => {
    const city = extractCityFromLocation(activity.location)
    if (city) {
      if (!locationsByDate.has(activity.activity_date)) {
        locationsByDate.set(activity.activity_date, new Set())
      }
      locationsByDate.get(activity.activity_date)!.add(city)
    }
  })

  // Sort dates and determine location sequences
  const sortedDates = Array.from(locationsByDate.keys()).sort()
  const locationStays: LocationStay[] = []
  
  let currentLocation: string | null = null
  let currentStartDate: string | null = null
  
  // Process each date to determine where we're staying
  sortedDates.forEach((date, index) => {
    const locationsOnDate = Array.from(locationsByDate.get(date) || [])
    
    if (locationsOnDate.length > 0) {
      // Assume we stay in the last location visited that day
      const stayLocation = locationsOnDate[locationsOnDate.length - 1]
      
      if (currentLocation !== stayLocation) {
        // We're moving to a new location
        if (currentLocation && currentStartDate) {
          // Finalize the previous stay
          const nights = Math.max(0, differenceInDays(parseISO(date), parseISO(currentStartDate)))
          if (nights > 0) {
            locationStays.push({
              city: currentLocation,
              nights,
              startDate: currentStartDate,
              endDate: date
            })
          }
        }
        
        // Start new stay
        currentLocation = stayLocation
        currentStartDate = date
      }
    }
  })
  
  // Handle the final location stay
  if (currentLocation && currentStartDate) {
    const nights = Math.max(1, differenceInDays(parseISO(tripEndDate), parseISO(currentStartDate)))
    locationStays.push({
      city: currentLocation,
      nights,
      startDate: currentStartDate,
      endDate: tripEndDate
    })
  }
  
  return locationStays
}

/**
 * Formats location stays for display on trip cards
 */
export function formatLocationStays(locationStays: LocationWithWeather[]): string {
  if (!locationStays || locationStays.length === 0) {
    return 'No locations'
  }
  
  if (locationStays.length === 1) {
    const stay = locationStays[0]
    const weatherInfo = stay.weather 
      ? `, ${stay.weather.temperature}°C ${stay.weather.icon}`
      : stay.weatherError 
        ? ', weather unavailable'
        : ''
    
    return `${stay.city}: ${stay.nights} night${stay.nights !== 1 ? 's' : ''}${weatherInfo}`
  }
  
  // Multiple locations - show summary
  const totalNights = locationStays.reduce((sum, stay) => sum + stay.nights, 0)
  return `${locationStays.length} cities, ${totalNights} nights total`
}

/**
 * Simple weather icon mapping for common conditions
 */
export function getWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain day
    '10n': '🌧️', // rain night
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '🌨️', // snow
    '13n': '🌨️',
    '50d': '🌫️', // mist
    '50n': '🌫️'
  }
  
  return iconMap[iconCode] || '🌤️'
}