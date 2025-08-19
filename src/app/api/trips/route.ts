import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Use the same authentication logic as the session API
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      console.log('🔑 Trips API: No auth-token cookie found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the JWT token (same as session API)
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    let user: any = null
    
    try {
      const decoded = verify(authToken, secret) as any
      console.log('🔑 Trips API: JWT Token decoded successfully:', { userId: decoded.userId })
      
      // Get user from database
      const supabase = createServerSupabaseClient()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (userError) {
        console.log('🔑 Trips API: Database query failed:', userError)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }
      
      if (!userData) {
        console.log('🔑 Trips API: No user data found')
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }

      user = userData
      console.log('🔑 Trips API: Successfully authenticated user:', user.email)
      
    } catch (jwtError) {
      console.log('🔑 Trips API: JWT verification failed:', jwtError.message)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('🔍 API: User access check:', {
      email: user.email,
      user_type: user.user_type,
      can_view_all_trips: user.can_view_all_trips,
      can_view_company_trips: user.can_view_company_trips
    })

    // Use service client for database queries to bypass RLS
    const supabase = createServerSupabaseClient()
    let tripsQuery = supabase
      .from('trips')
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        status,
        access_code,
        total_cost,
        trip_type,
        created_at,
        creator_id,
        trip_participants (
          trip_id,
          user_id,
          company_id,
          role,
          users!trip_participants_user_id_fkey (id, full_name, email),
          companies (id, name, fantasy_name)
        ),
        trip_vehicles (
          trip_id,
          vehicle_id,
          driver_id,
          vehicles (id, model, license_plate),
          users!trip_vehicles_driver_id_fkey (id, full_name, email)
        ),
        itinerary_items (
          id,
          activity_type,
          meeting_notes (id)
        )
      `)
      .order('start_date', { ascending: false })
      .limit(20)

    // Apply access control based on user permissions
    if (user.can_view_all_trips) {
      // Wolthers staff and global admins can see all trips
      console.log('✅ API: User can view all trips')
      // No additional filtering needed
    } else if (user.can_view_company_trips) {
      // Company admins can see trips from their domain
      console.log('🏢 API: User can view company trips')
      const userDomain = user.email?.split('@')[1]
      if (userDomain) {
        // Find trips where any participant has the same email domain
        const { data: companyTripIds } = await supabase
          .from('trip_participants')
          .select(`
            trip_id,
            users!trip_participants_user_id_fkey!inner(email)
          `)
          .like('users.email', `%@${userDomain}`)
        
        const tripIds = companyTripIds?.map(p => p.trip_id) || []
        if (tripIds.length > 0) {
          tripsQuery = tripsQuery.in('id', tripIds)
        } else {
          // No trips for this domain
          return NextResponse.json({ trips: [] })
        }
      } else {
        return NextResponse.json({ trips: [] })
      }
    } else {
      // Regular clients can only see trips they're invited to
      console.log('👤 API: User can view invited trips only')
      const { data: userTripIds } = await supabase
        .from('trip_participants')
        .select('trip_id')
        .eq('user_id', user.id)
      
      const tripIds = userTripIds?.map(p => p.trip_id) || []
      if (tripIds.length > 0) {
        tripsQuery = tripsQuery.in('id', tripIds)
      } else {
        // User not invited to any trips
        return NextResponse.json({ trips: [] })
      }
    }

    const { data: trips, error: tripsError } = await tripsQuery

    if (tripsError) {
      console.error('❌ API: Failed to fetch trips:', tripsError)
      return NextResponse.json(
        { error: 'Failed to fetch trips' },
        { status: 500 }
      )
    }

    // Also fetch draft information for these trips
    const tripIds = trips?.map(t => t.id) || []
    let draftsMap = {}
    
    if (tripIds.length > 0) {
      const { data: drafts } = await supabase
        .from('trip_drafts')
        .select('id, trip_id, creator_id')
        .in('trip_id', tripIds)
      
      if (drafts) {
        draftsMap = drafts.reduce((acc, draft) => {
          acc[draft.trip_id] = draft.id
          return acc
        }, {})
      }
    }

    // Add draft IDs to trips
    const tripsWithDrafts = trips?.map(trip => ({
      ...trip,
      draftId: draftsMap[trip.id] || null,
      isDraft: trip.status === 'planning' && draftsMap[trip.id] != null
    })) || []

    console.log(`✅ API: Returning ${tripsWithDrafts.length} trips for user ${user.email}`)

    return NextResponse.json({
      trips: tripsWithDrafts,
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
    console.error('❌ API: Trip fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}