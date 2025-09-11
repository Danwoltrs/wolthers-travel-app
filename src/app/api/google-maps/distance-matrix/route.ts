import { NextRequest, NextResponse } from 'next/server'
import distanceCache, { type DistanceMatrixRequest } from '@/lib/distance-cache'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { origins, destinations, mode = 'driving', units = 'metric' } = body

    if (!origins || !destinations) {
      return NextResponse.json(
        { error: 'Origins and destinations are required' },
        { status: 400 }
      )
    }

    // Create cache request object
    const cacheRequest: DistanceMatrixRequest = {
      origins: Array.isArray(origins) ? origins : [origins],
      destinations: Array.isArray(destinations) ? destinations : [destinations],
      mode,
      units
    }

    // Check cache first
    const cachedResult = distanceCache.get(cacheRequest)
    if (cachedResult) {
      console.log('🎯 [DistanceMatrix] Serving from cache')
      return NextResponse.json(cachedResult, { 
        status: 200,
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Source': 'distance-matrix-cache'
        }
      })
    }

    // Check if Google Maps API key is available
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      console.error('Google Maps API key not configured')
      return NextResponse.json(
        { error: 'Google Maps API not configured' },
        { status: 500 }
      )
    }

    // Construct the Google Maps Distance Matrix API URL
    const params = new URLSearchParams({
      origins: Array.isArray(origins) ? origins.join('|') : origins,
      destinations: Array.isArray(destinations) ? destinations.join('|') : destinations,
      mode,
      units,
      key: apiKey
    })

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`

    // Make request to Google Maps API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        console.error('Google Maps API request failed:', response.status, response.statusText)
        return NextResponse.json(
          { error: 'Failed to fetch distance matrix data' },
          { status: response.status }
        )
      }

      const data = await response.json()

      // Check for API errors in the response
      if (data.status !== 'OK') {
        console.error('Google Maps API error:', data.status, data.error_message)
        return NextResponse.json(
          { error: `Google Maps API error: ${data.status}` },
          { status: 400 }
        )
      }

      // Cache the result before returning
      console.log('💾 [DistanceMatrix] Caching result for future requests')
      distanceCache.set(cacheRequest, data)

      // Return the distance matrix data
      return NextResponse.json(data, { 
        status: 200,
        headers: {
          'X-Cache': 'MISS',
          'X-Cache-Source': 'google-maps-api'
        }
      })
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.error('Google Maps API request timed out after 10 seconds')
        return NextResponse.json(
          { error: 'Google Maps API request timed out' },
          { status: 408 }
        )
      }
      throw error
    }

  } catch (error) {
    console.error('Distance matrix API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origins = searchParams.get('origins')
  const destinations = searchParams.get('destinations')
  
  if (!origins || !destinations) {
    return NextResponse.json(
      { 
        message: 'Google Maps Distance Matrix API endpoint',
        usage: 'POST /api/google-maps/distance-matrix',
        required_params: ['origins', 'destinations'],
        optional_params: ['mode (driving|walking|transit)', 'units (metric|imperial)'],
        example: {
          origins: ['São Paulo, Brazil'],
          destinations: ['Santos, Brazil'],
          mode: 'driving',
          units: 'metric'
        }
      },
      { status: 200 }
    )
  }

  // Handle GET request with query parameters (for testing)
  const mode = searchParams.get('mode') || 'driving'
  const units = searchParams.get('units') || 'metric'

  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({
      origins: origins.split('|'),
      destinations: destinations.split('|'),
      mode,
      units
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }))
}