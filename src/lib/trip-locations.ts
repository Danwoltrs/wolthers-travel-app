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
    const cityPart = parts[parts.length - 1].trim()
    
    // Additional validation for the extracted city
    if (isValidCityName(cityPart)) {
      return cityPart
    }
    return null
  }
  
  // Handle simple venue names that might be cities
  const cleanLocation = location.trim()
  
  // Skip if it looks like an airport code (3 letters)
  if (/^[A-Z]{3}$/.test(cleanLocation)) {
    return null
  }
  
  // Skip organization/venue codes (like SCTA, BWC, etc.)
  if (/^[A-Z]{2,6}$/.test(cleanLocation)) {
    return null
  }
  
  // Skip if it contains typical venue keywords without city info
  const venueKeywords = ['hotel', 'conference', 'center', 'office', 'building', 'hall']
  const lowerLocation = cleanLocation.toLowerCase()
  if (venueKeywords.some(keyword => lowerLocation.includes(keyword)) && cleanLocation.length < 15) {
    return null
  }
  
  // Return if it looks like a valid city name
  if (isValidCityName(cleanLocation)) {
    return cleanLocation
  }
  
  return null
}

/**
 * Validates if a string looks like a valid city name
 */
function isValidCityName(name: string): boolean {
  if (!name || name.length < 2) return false
  
  // Check if it's not all uppercase (likely an acronym)
  if (name === name.toUpperCase() && name.length < 8) return false
  
  // Check if it contains numbers (unlikely for city names)
  if (/\d/.test(name)) return false
  
  // Check if it contains special characters (except spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) return false
  
  return true
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

  // Extract all unique cities from activities
  const allCities = new Set<string>()
  const locationsByDate = new Map<string, Set<string>>()
  
  activities.forEach(activity => {
    const city = extractCityFromLocation(activity.location)
    if (city) {
      allCities.add(city)
      if (!locationsByDate.has(activity.activity_date)) {
        locationsByDate.set(activity.activity_date, new Set())
      }
      locationsByDate.get(activity.activity_date)!.add(city)
    }
  })

  // If only one unique city across all activities, assume entire trip is at that location
  if (allCities.size === 1) {
    const singleCity = Array.from(allCities)[0]
    const startDate = typeof tripStartDate === 'string' ? parseISO(tripStartDate) : new Date(tripStartDate)
    const endDate = typeof tripEndDate === 'string' ? parseISO(tripEndDate) : new Date(tripEndDate)
    const nights = Math.max(1, differenceInDays(endDate, startDate))
    
    return [{
      city: singleCity,
      nights,
      startDate: tripStartDate,
      endDate: tripEndDate
    }]
  }

  // Multiple cities - calculate stays based on activity dates
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
          const startDate = typeof currentStartDate === 'string' ? parseISO(currentStartDate) : new Date(currentStartDate)
          const endDate = typeof date === 'string' ? parseISO(date) : new Date(date)
          const nights = Math.max(0, differenceInDays(endDate, startDate))
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
    const startDate = typeof currentStartDate === 'string' ? parseISO(currentStartDate) : new Date(currentStartDate)
    const endDate = typeof tripEndDate === 'string' ? parseISO(tripEndDate) : new Date(tripEndDate)
    const nights = Math.max(1, differenceInDays(endDate, startDate))
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