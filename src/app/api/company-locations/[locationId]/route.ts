import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface LocationParams {
  params: Promise<{
    locationId: string
  }>
}

export async function GET(request: NextRequest, segmentData: LocationParams) {
  console.log('🏢 Company location details API called')
  
  try {
    // Await the params since they're now a Promise in Next.js 15
    const { locationId } = await segmentData.params
    
    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let user = null
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

    try {
      const decoded = verify(token, secret) as any
      const supabase = createServerSupabaseClient()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (!userError && userData) {
        user = userData
      }
    } catch (jwtError) {
      // Try Supabase session authentication
      const supabaseClient = createServerSupabaseClient()
      
      if (token && token.includes('.')) {
        const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
        
        if (!sessionError && supabaseUser) {
          const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single()

          if (!userError && userData) {
            user = userData
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    console.log('👤 User authenticated:', user.email, 'fetching location details for:', locationId)

    const supabase = createServerSupabaseClient()
    
    // Get location details with company information
    const { data: locationData, error: locationError } = await supabase
      .from('company_locations')
      .select(`
        id,
        company_id,
        location_name,
        address_line_1,
        address_line_2,
        city,
        state_province,
        postal_code,
        country,
        location_type,
        is_primary_location,
        is_meeting_location,
        phone,
        email,
        contact_person,
        meeting_room_capacity,
        has_presentation_facilities,
        has_catering,
        parking_availability,
        accessibility_notes,
        latitude,
        longitude,
        notes,
        created_at,
        updated_at,
        companies:company_id (
          id,
          name,
          email,
          phone,
          website
        )
      `)
      .eq('id', locationId)
      .single()

    if (locationError || !locationData) {
      console.error('❌ Location not found:', locationError)
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    console.log(`✅ Found location details for ${locationData.location_name}`)

    // Format the full address for easy use
    const fullAddress = [
      locationData.address_line_1,
      locationData.address_line_2,
      locationData.city,
      locationData.state_province,
      locationData.postal_code,
      locationData.country
    ].filter(Boolean).join(', ')

    const response = {
      location: {
        ...locationData,
        full_address: fullAddress,
        // Add convenience flags for frontend
        has_meeting_facilities: locationData.is_meeting_location,
        suitable_for_presentations: locationData.has_presentation_facilities,
        suitable_for_catering: locationData.has_catering
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('🚨 Company location details API error:', error)
    
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}