import { useState, useEffect, useMemo } from 'react'
import type { TripCard } from '@/types'
import { 
  calculateLocationStays, 
  type LocationWithWeather, 
  type TripActivity,
  type WeatherData 
} from '@/lib/trip-locations'

interface UseTripWeatherReturn {
  locationStays: LocationWithWeather[]
  isLoading: boolean
  error: string | null
}

async function fetchWeatherForCity(city: string, date: string): Promise<WeatherData | null> {
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}&date=${date}`)
    
    if (!response.ok) {
      console.error(`Weather fetch failed for ${city}:`, response.status)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error fetching weather for ${city}:`, error)
    return null
  }
}

async function fetchTripActivities(tripId: string): Promise<TripActivity[]> {
  try {
    const response = await fetch(`/api/trips/${tripId}/activities`, {
      credentials: 'include'
    })
    
    if (!response.ok) {
      console.error('Failed to fetch trip activities:', response.status)
      return []
    }
    
    const data = await response.json()
    return data.activities || []
  } catch (error) {
    console.error('Error fetching trip activities:', error)
    return []
  }
}

export function useTripWeather(trip: TripCard): UseTripWeatherReturn {
  const [locationStays, setLocationStays] = useState<LocationWithWeather[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Memoize trip identification to prevent unnecessary re-fetches
  const tripKey = useMemo(() => `${trip.id}_${trip.startDate}_${trip.endDate}`, [trip.id, trip.startDate, trip.endDate])
  
  useEffect(() => {
    let isCancelled = false
    
    const loadTripWeather = async () => {
      if (!trip.id) {
        setLocationStays([])
        setIsLoading(false)
        return
      }
      
      // Check if trip is in the past - skip weather updates for past trips
      const tripEndDate = new Date(trip.endDate)
      const today = new Date()
      const isPastTrip = tripEndDate < today
      
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch trip activities
        const activities = await fetchTripActivities(trip.id)
        
        if (isCancelled) return
        
        // Calculate location stays
        const stays = calculateLocationStays(activities, trip.startDate, trip.endDate)
        
        if (stays.length === 0) {
          setLocationStays([])
          setIsLoading(false)
          return
        }
        
        // For past trips, skip weather API calls and show locations only
        let staysWithWeather: LocationWithWeather[]
        
        if (isPastTrip) {
          // Past trips: show locations without weather data
          staysWithWeather = stays.map(stay => ({
            ...stay,
            weather: null,
            weatherError: undefined // No error, just no weather for past trips
          }))
        } else {
          // Current/future trips: fetch weather data for each location
          const weatherPromises = stays.map(async (stay): Promise<LocationWithWeather> => {
            try {
              const weather = await fetchWeatherForCity(stay.city, stay.startDate)
              
              if (weather) {
                return { ...stay, weather }
              } else {
                return { ...stay, weather: null, weatherError: 'Weather data unavailable' }
              }
            } catch (error) {
              console.error(`Weather error for ${stay.city}:`, error)
              return { ...stay, weather: null, weatherError: 'Weather data unavailable' }
            }
          })
          
          staysWithWeather = await Promise.all(weatherPromises)
        }
        
        if (!isCancelled) {
          setLocationStays(staysWithWeather)
        }
        
      } catch (error) {
        console.error('Error loading trip weather:', error)
        if (!isCancelled) {
          setError('Failed to load location data')
          setLocationStays([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }
    
    loadTripWeather()
    
    return () => {
      isCancelled = true
    }
  }, [tripKey])
  
  return {
    locationStays,
    isLoading,
    error
  }
}