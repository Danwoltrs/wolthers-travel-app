import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Try JWT authentication first (Microsoft OAuth users)
    const authToken = request.cookies.get('auth-token')?.value
    
    if (authToken) {
      try {
        const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
        const decoded = verify(authToken, secret) as any
        console.log('🔑 Notes Summary API: JWT Token decoded successfully:', { userId: decoded.userId })
        
        // Get user from database using service client to bypass RLS
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()
        
        if (!userError && userData) {
          user = userData
          console.log('🔑 Notes Summary API: JWT User authenticated:', { userId: user.id, email: user.email })
        }
      } catch (jwtError) {
        console.log('🔑 Notes Summary API: JWT verification failed, trying Supabase auth:', jwtError)
      }
    }
    
    // Fallback to Supabase authentication (OTP login users)
    if (!user) {
      try {
        const supabase = createServerSupabaseClient()
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser()
        
        if (!authError && supabaseUser) {
          user = supabaseUser
          console.log('🔑 Notes Summary API: Supabase User authenticated:', { userId: user.id, email: user.email })
        }
      } catch (supabaseError) {
        console.log('🔑 Notes Summary API: Supabase auth also failed:', supabaseError)
      }
    }
    
    // If no authentication method worked
    if (!user) {
      console.log('🔑 Notes Summary API: No authentication found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get search params
    const { searchParams } = new URL(request.url)
    const tripIds = searchParams.get('trip_ids')?.split(',') || []

    if (tripIds.length === 0) {
      return NextResponse.json({ error: 'No trip IDs provided' }, { status: 400 })
    }

    // Get note counts for all trips by joining itinerary_items and activity_notes tables
    // Use service client to bypass RLS issues for better reliability
    const supabase = createSupabaseServiceClient()
    
    // First get all itinerary_items for the trips (notes are linked to itinerary_items, not activities)
    const { data: itineraryItems, error: itineraryError } = await supabase
      .from('itinerary_items')
      .select('id, trip_id')
      .in('trip_id', tripIds)
    
    if (itineraryError) {
      console.error('Error fetching itinerary items:', itineraryError)
      return NextResponse.json({ error: 'Failed to fetch itinerary items' }, { status: 500 })
    }
    
    // Then get note counts for those itinerary items
    const itineraryItemIds = itineraryItems?.map(item => item.id) || []
    const { data: notes, error: noteCountsError } = await supabase
      .from('activity_notes')
      .select('id, itinerary_item_id')
      .in('itinerary_item_id', itineraryItemIds)
      
    if (noteCountsError) {
      console.error('Error fetching note counts:', noteCountsError)
      return NextResponse.json({ error: 'Failed to fetch note counts' }, { status: 500 })
    }

    // Aggregate note counts by trip
    const tripNoteCounts: Record<string, number> = {}
    
    // Initialize all trips with 0 count
    tripIds.forEach(id => {
      tripNoteCounts[id] = 0
    })
    
    // Create a map of itinerary_item ID to trip ID
    const itineraryItemToTripMap: Record<string, string> = {}
    itineraryItems?.forEach(item => {
      itineraryItemToTripMap[item.id] = item.trip_id
    })
    
    // Count notes for each trip
    notes?.forEach(note => {
      const itineraryItemId = note.itinerary_item_id
      const tripId = itineraryItemToTripMap[itineraryItemId]
      if (tripId && tripNoteCounts.hasOwnProperty(tripId)) {
        tripNoteCounts[tripId] += 1
      }
    })

    return NextResponse.json({
      success: true,
      data: tripNoteCounts
    })

  } catch (error) {
    console.error('Trip notes summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}