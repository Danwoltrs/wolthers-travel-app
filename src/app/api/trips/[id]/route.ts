import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'
import { verifySessionToken, extractBearerToken } from '@/lib/jwt-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params

    let user: any = null
    
    // Try JWT token authentication first (Microsoft OAuth and Email/Password)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = extractBearerToken(authHeader)
      if (token) {
        // Try custom JWT token first
        const decoded = verifySessionToken(token)
        if (decoded) {
          // Get user from database with service role (bypasses RLS)
          const supabase = createServerSupabaseClient()
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single()

          if (!userError && userData) {
            user = userData
            console.log('🔑 JWT Auth: Successfully authenticated user:', user.email)
          }
        } else {
          // If JWT verification fails, try Supabase session token
          console.log('🔑 JWT verification failed, trying Supabase session...')
          try {
            const supabaseClient = createSupabaseServiceClient()
            const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
            
            if (!sessionError && supabaseUser) {
              // Get full user profile from database
              const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', supabaseUser.id)
                .single()

              if (!userError && userData) {
                user = userData
                console.log('🔑 Supabase Auth: Successfully authenticated user:', user.email)
              }
            }
          } catch (supabaseError) {
            console.log('🔑 Supabase authentication also failed:', supabaseError)
          }
        }
      }
    }
    
    // If both methods failed, return unauthorized
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🔍 API: Trip details request for:', { tripId, userEmail: user.email })

    // Use service client for database queries to bypass RLS
    const supabase = createServerSupabaseClient()
    
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
          ),
          trip_hotels (
            id,
            hotel_name,
            hotel_address,
            check_in_date,
            check_out_date,
            nights_count,
            cost_amount,
            cost_currency,
            room_type,
            guest_names,
            booking_status
          ),
          trip_flights (
            id,
            flight_type,
            airline,
            flight_number,
            departure_airport,
            departure_city,
            departure_date,
            departure_time,
            arrival_airport,
            arrival_city,
            arrival_date,
            arrival_time,
            cost_amount,
            cost_currency,
            passenger_names,
            booking_status
          ),
          trip_meetings (
            id,
            title,
            meeting_type,
            meeting_date,
            start_time,
            end_time,
            location,
            description,
            agenda,
            priority_level,
            meeting_status,
            is_supplier_meeting,
            supplier_company_name,
            meeting_attendees (
              id,
              attendee_name,
              attendee_email,
              attendee_company,
              attendee_title,
              attendance_status
            )
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
          ),
          trip_hotels (
            id,
            hotel_name,
            hotel_address,
            check_in_date,
            check_out_date,
            nights_count,
            cost_amount,
            cost_currency,
            room_type,
            guest_names,
            booking_status
          ),
          trip_flights (
            id,
            flight_type,
            airline,
            flight_number,
            departure_airport,
            departure_city,
            departure_date,
            departure_time,
            arrival_airport,
            arrival_city,
            arrival_date,
            arrival_time,
            cost_amount,
            cost_currency,
            passenger_names,
            booking_status
          ),
          trip_meetings (
            id,
            title,
            meeting_type,
            meeting_date,
            start_time,
            end_time,
            location,
            description,
            agenda,
            priority_level,
            meeting_status,
            is_supplier_meeting,
            supplier_company_name,
            meeting_attendees (
              id,
              attendee_name,
              attendee_email,
              attendee_company,
              attendee_title,
              attendance_status
            )
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

    // Load activities (modern approach) and itinerary items (legacy support)
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripData.id)
      .order('activity_date', { ascending: true })
      .order('start_time', { ascending: true })

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

    if (activitiesError) {
      console.warn('Error loading activities:', activitiesError)
    }
    if (itineraryError) {
      console.warn('Error loading itinerary items:', itineraryError)
    }

    // Combine the data - prioritize activities if available, fall back to itinerary_items
    tripData.itinerary_items = activitiesData && activitiesData.length > 0 ? activitiesData : (itineraryData || [])
    tripData.activities = activitiesData || []

    console.log(`✅ API: Returning trip details for ${user.email}:`, {
      tripId: tripData.id,
      title: tripData.title,
      activities: activitiesData?.length || 0,
      itineraryItems: itineraryData?.length || 0,
      usingActivities: activitiesData && activitiesData.length > 0
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