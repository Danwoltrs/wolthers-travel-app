import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id

    // Verify JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

    let decoded: any
    try {
      decoded = verify(token, secret)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user from database with service role (bypasses RLS)
    const supabase = createServerSupabaseClient()
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('🔍 API: Trip details request for:', { tripId, userEmail: user.email })

    // Determine if tripId is a UUID or an access code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId)
    
    let tripQuery
    if (isUUID) {
      // Query by ID
      tripQuery = supabase
        .from('trips')
        .select(`
          *,
          trip_participants (
            trip_id,
            user_id,
            company_id,
            role,
            users (id, full_name, email),
            companies (id, name, fantasy_name)
          ),
          trip_vehicles (
            trip_id,
            vehicle_id,
            driver_id,
            vehicles (id, model, license_plate),
            users!trip_vehicles_driver_id_fkey (id, full_name, email)
          )
        `)
        .eq('id', tripId)
        .single()
    } else {
      // Query by access code
      tripQuery = supabase
        .from('trips')
        .select(`
          *,
          trip_participants (
            trip_id,
            user_id,
            company_id,
            role,
            users (id, full_name, email),
            companies (id, name, fantasy_name)
          ),
          trip_vehicles (
            trip_id,
            vehicle_id,
            driver_id,
            vehicles (id, model, license_plate),
            users!trip_vehicles_driver_id_fkey (id, full_name, email)
          )
        `)
        .eq('access_code', tripId)
        .single()
    }

    const { data: tripData, error: tripError } = await tripQuery

    if (tripError) {
      console.error('Trip query error:', tripError)
      return NextResponse.json(
        { error: `Failed to fetch trip details - ${tripError.message}` },
        { status: 404 }
      )
    }

    if (!tripData) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this trip
    const hasAccess = user.can_view_all_trips || 
                     (user.can_view_company_trips && tripData.trip_participants?.some((p: any) => 
                       p.users?.email?.split('@')[1] === user.email?.split('@')[1])) ||
                     tripData.trip_participants?.some((p: any) => p.user_id === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this trip' },
        { status: 403 }
      )
    }

    // Load itinerary items with location data
    const { data: itineraryData, error: itineraryError } = await supabase
      .from('itinerary_items')
      .select(`
        *,
        meeting_notes (*),
        company_locations (
          id,
          name,
          latitude,
          longitude,
          city,
          country,
          address_line1
        )
      `)
      .eq('trip_id', tripData.id)
      .order('activity_date, start_time')

    if (itineraryError) {
      console.warn('Error loading itinerary items:', itineraryError)
    }

    // Combine the data
    tripData.itinerary_items = itineraryData || []

    console.log(`✅ API: Returning trip details for ${user.email}:`, {
      tripId: tripData.id,
      title: tripData.title,
      itineraryItems: itineraryData?.length || 0
    })

    return NextResponse.json({
      trip: tripData,
      user: {
        id: user.id,
        email: user.email,
        permissions: {
          view_all_trips: user.can_view_all_trips,
          view_company_trips: user.can_view_company_trips,
          is_global_admin: user.is_global_admin
        }
      }
    })

  } catch (error) {
    console.error('❌ API: Trip details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}