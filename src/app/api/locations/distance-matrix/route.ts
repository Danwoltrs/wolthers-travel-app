import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured')
      return NextResponse.json(
        { error: 'Google Maps API key not configured', distance: 0, duration: 0 },
        { status: 500 }
      )
    }

    const { origin, destination } = await request.json()

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required', distance: 0, duration: 0 },
        { status: 400 }
      )
    }

    // Build the Google Maps Distance Matrix API URL
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
    
    console.log(`🗺️ [Distance Matrix API] Calculating distance: ${origin} → ${destination}`)

    const response = await fetch(url)
    
    if (!response.ok) {
      console.warn(`Distance Matrix request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: 'Distance Matrix request failed', distance: 0, duration: 0 },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Check API response status
    if (data.status !== 'OK') {
      console.warn('Distance Matrix API error:', data.status, data.error_message)
      return NextResponse.json(
        { 
          error: `Distance Matrix API error: ${data.status}`, 
          details: data.error_message,
          distance: 0, 
          duration: 0 
        },
        { status: 400 }
      )
    }

    // Check if we have valid results
    if (!data.rows || !data.rows[0] || !data.rows[0].elements || !data.rows[0].elements[0]) {
      console.warn('Distance Matrix returned no results')
      return NextResponse.json(
        { error: 'No route found between locations', distance: 0, duration: 0 },
        { status: 404 }
      )
    }

    const element = data.rows[0].elements[0]

    // Check element status
    if (element.status !== 'OK') {
      console.warn(`Distance Matrix element error: ${element.status}`)
      return NextResponse.json(
        { 
          error: `Route calculation failed: ${element.status}`, 
          distance: 0, 
          duration: 0 
        },
        { status: 400 }
      )
    }

    // Extract distance and duration
    const distance = element.distance?.value || 0  // in meters
    const duration = element.duration?.value || 0  // in seconds
    
    console.log(`✅ [Distance Matrix API] Success: ${distance}m, ${duration}s (${Math.round(duration/60)}min)`)

    return NextResponse.json({
      distance,
      duration,
      distanceText: element.distance?.text || '0 km',
      durationText: element.duration?.text || '0 mins',
      origin,
      destination
    })

  } catch (error) {
    console.error('Distance Matrix service error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        distance: 0, 
        duration: 0,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}