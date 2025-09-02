import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: companyId } = await params
    
    // Validate companyId
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    // Get trips where this company participated
    const { data: trips, error } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        trip_code,
        start_date,
        end_date,
        status,
        created_at,
        trip_participants!inner (
          company_id,
          user_id,
          role
        ),
        companies!trip_participants_company_id_fkey (
          id,
          name
        )
      `)
      .eq('trip_participants.company_id', companyId)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Error fetching company trips:', error)
      return NextResponse.json(
        { error: 'Failed to fetch company trips', details: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedTrips = trips?.map(trip => ({
      ...trip,
      participants: trip.trip_participants || [],
      company_participation: trip.trip_participants?.length || 0
    })) || []

    return NextResponse.json({
      trips: transformedTrips,
      count: transformedTrips.length,
      message: transformedTrips.length === 0 
        ? 'No trips found for this company'
        : `Found ${transformedTrips.length} trips`
    })
  } catch (error) {
    console.error('Error in company trips API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}