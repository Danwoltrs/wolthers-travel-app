import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { 
  authenticateApiRequest, 
  filterTripCostData, 
  createAuthErrorResponse,
  logSecurityEvent 
} from '@/lib/api-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate and authorize the request
    const authResult = await authenticateApiRequest(request)
    
    if (!authResult.success || !authResult.user) {
      logSecurityEvent('UNAUTHORIZED_REQUEST', null, { 
        endpoint: '/api/trips/real-data',
        error: authResult.error 
      })
      return createAuthErrorResponse(
        authResult.error || 'Authentication failed', 
        authResult.statusCode || 401
      )
    }

    const authenticatedUser = authResult.user
    logSecurityEvent('AUTH_SUCCESS', authenticatedUser, { 
      endpoint: '/api/trips/real-data' 
    })

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
          role
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

    // 🔒 SECURITY: Filter cost data based on user permissions
    const filteredTrips = filterTripCostData(trips || [], authenticatedUser.can_view_cost_data)
    
    if (authenticatedUser.can_view_cost_data) {
      logSecurityEvent('COST_ACCESS_GRANTED', authenticatedUser, { 
        endpoint: '/api/trips/real-data',
        trips_count: filteredTrips.length,
        company_filter: companyId 
      })
    } else {
      logSecurityEvent('COST_ACCESS_DENIED', authenticatedUser, { 
        endpoint: '/api/trips/real-data',
        trips_count: filteredTrips.length,
        company_filter: companyId 
      })
    }

    return NextResponse.json({ 
      trips: filteredTrips,
      count: filteredTrips.length,
      success: true,
      companyId: companyId || null,
      has_cost_data: authenticatedUser.can_view_cost_data // Inform client about data completeness
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