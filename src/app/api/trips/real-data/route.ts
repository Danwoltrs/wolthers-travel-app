import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get companyId from query parameters
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    
    console.log(`[RealTravelData API] Request for companyId: ${companyId}`)
    
    let query = supabase
      .from('trips')
      .select(`
        id, title, status, start_date, end_date, total_cost, access_code, trip_type, created_at,
        trip_participants!inner(
          company_id,
          is_meeting_attendee
        )
      `)
      .order('created_at', { ascending: false })

    // If companyId is provided, filter trips by company participation
    if (companyId) {
      query = query.eq('trip_participants.company_id', companyId)
      console.log(`[RealTravelData API] Filtering trips for company: ${companyId}`)
    } else {
      console.log(`[RealTravelData API] Fetching all trips (no company filter)`)
    }

    const { data: trips, error } = await query

    if (error) {
      console.error('Error fetching trips:', error)
      return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
    }

    console.log(`[RealTravelData API] Found ${trips?.length || 0} trips${companyId ? ` for company ${companyId}` : ''}`)

    return NextResponse.json({ 
      trips: trips || [],
      count: trips?.length || 0,
      success: true,
      companyId: companyId || null
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      trips: [],
      count: 0 
    }, { status: 500 })
  }
}