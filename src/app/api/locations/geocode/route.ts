import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const { address } = await request.json()

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Build full address string
    const fullAddress = typeof address === 'string' ? address : [
      address.street,
      address.number,
      address.neighborhood,
      address.city,
      address.state,
      address.country || 'Brasil'
    ].filter(Boolean).join(', ')

    // Call Google Maps Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`
    
    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('Geocoding error:', data.status, data.error_message)
      return NextResponse.json(
        { error: 'Failed to geocode address', details: data.error_message },
        { status: 400 }
      )
    }

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'No results found for address' },
        { status: 404 }
      )
    }

    const result = data.results[0]
    const location = result.geometry.location

    // Extract address components for standardization
    const addressComponents = result.address_components.reduce((acc: any, component: any) => {
      component.types.forEach((type: string) => {
        acc[type] = component.long_name
      })
      return acc
    }, {})

    return NextResponse.json({
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      addressComponents: {
        street: addressComponents.route || '',
        streetNumber: addressComponents.street_number || '',
        neighborhood: addressComponents.sublocality_level_1 || addressComponents.neighborhood || '',
        city: addressComponents.locality || addressComponents.administrative_area_level_2 || '',
        state: addressComponents.administrative_area_level_1 || '',
        country: addressComponents.country || '',
        postalCode: addressComponents.postal_code || ''
      },
      placeId: result.place_id
    })

  } catch (error) {
    console.error('Geocoding service error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}