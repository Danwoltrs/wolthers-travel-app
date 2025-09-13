import { NextRequest, NextResponse } from 'next/server'
import { WeatherData, getWeatherIcon } from '@/lib/trip-locations'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

interface OpenWeatherResponse {
  main: {
    temp: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
}

interface OpenWeatherForecastResponse {
  list: Array<{
    dt: number
    main: {
      temp: number
    }
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
  }>
}

async function getCoordinates(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Try with city name first
    let geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${OPENWEATHER_API_KEY}`
    let response = await fetch(geocodeUrl)
    
    if (!response.ok) {
      console.error(`Geocoding failed for ${city}:`, response.status)
      return null
    }
    
    let data = await response.json()
    
    // If no results, try adding common country contexts
    if (!data || data.length === 0) {
      const cityWithCountries = [
        `${city}, Switzerland`,
        `${city}, Germany`, 
        `${city}, Austria`,
        `${city}, France`,
        `${city}, Italy`
      ]
      
      for (const cityQuery of cityWithCountries) {
        try {
          geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityQuery)}&limit=1&appid=${OPENWEATHER_API_KEY}`
          response = await fetch(geocodeUrl)
          
          if (response.ok) {
            data = await response.json()
            if (data && data.length > 0) {
              console.log(`Found coordinates for ${city} using query: ${cityQuery}`)
              break
            }
          }
        } catch (err) {
          console.log(`Failed to geocode with ${cityQuery}:`, err)
        }
      }
    }
    
    if (!data || data.length === 0) {
      console.error(`No coordinates found for city: ${city}`)
      return null
    }
    
    // Prefer results with higher population or more specific matches
    const bestMatch = data.length > 1 ? 
      data.find((location: any) => location.country === 'CH') || // Prefer Switzerland for Basel
      data.find((location: any) => location.state) || 
      data[0] : 
      data[0]
    
    return {
      lat: bestMatch.lat,
      lon: bestMatch.lon
    }
  } catch (error) {
    console.error(`Error geocoding ${city}:`, error)
    return null
  }
}

async function getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const weatherUrl = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    const response = await fetch(weatherUrl)
    
    if (!response.ok) {
      console.error('Current weather API failed:', response.status)
      return null
    }
    
    const data: OpenWeatherResponse = await response.json()
    
    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      icon: getWeatherIcon(data.weather[0].icon),
      description: data.weather[0].description
    }
  } catch (error) {
    console.error('Error fetching current weather:', error)
    return null
  }
}

async function getForecastWeather(lat: number, lon: number, targetDate: string): Promise<WeatherData | null> {
  try {
    const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    const response = await fetch(forecastUrl)
    
    if (!response.ok) {
      console.error('Forecast weather API failed:', response.status)
      return null
    }
    
    const data: OpenWeatherForecastResponse = await response.json()
    
    // Find forecast closest to target date (at noon for consistency)
    const targetTimestamp = new Date(targetDate + 'T12:00:00Z').getTime() / 1000
    
    const closestForecast = data.list.reduce((closest, current) => {
      const currentDiff = Math.abs(current.dt - targetTimestamp)
      const closestDiff = Math.abs(closest.dt - targetTimestamp)
      return currentDiff < closestDiff ? current : closest
    })
    
    return {
      temperature: Math.round(closestForecast.main.temp),
      condition: closestForecast.weather[0].main,
      icon: getWeatherIcon(closestForecast.weather[0].icon),
      description: closestForecast.weather[0].description
    }
  } catch (error) {
    console.error('Error fetching forecast weather:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const date = searchParams.get('date')
  
  if (!city) {
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 })
  }
  
  if (!OPENWEATHER_API_KEY) {
    console.error('OpenWeatherMap API key not configured')
    return NextResponse.json({ error: 'Weather service not configured' }, { status: 500 })
  }
  
  // Debug logging for API key (first/last 4 characters only for security)
  console.log(`Using OpenWeather API key: ${OPENWEATHER_API_KEY.slice(0, 4)}...${OPENWEATHER_API_KEY.slice(-4)}`)
  console.log(`Fetching weather for city: ${city}, date: ${date}`)
  
  try {
    // Get coordinates for the city
    const coordinates = await getCoordinates(city)
    
    if (!coordinates) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }
    
    let weatherData: WeatherData | null = null
    
    if (date) {
      // Get forecast for specific date
      const targetDate = new Date(date)
      const today = new Date()
      
      // If date is today or in the past, get current weather
      if (targetDate <= today) {
        weatherData = await getCurrentWeather(coordinates.lat, coordinates.lon)
      } else {
        // Get forecast for future date
        weatherData = await getForecastWeather(coordinates.lat, coordinates.lon, date)
      }
    } else {
      // Get current weather
      weatherData = await getCurrentWeather(coordinates.lat, coordinates.lon)
    }
    
    if (!weatherData) {
      return NextResponse.json({ error: 'Weather data not available' }, { status: 503 })
    }
    
    return NextResponse.json(weatherData)
    
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}