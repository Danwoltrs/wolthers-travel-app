import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  authenticateApiRequest, 
  filterChartCostData, 
  createAuthErrorResponse,
  logSecurityEvent 
} from '@/lib/api-auth'

// Create Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // 🔒 SECURITY: Authenticate and authorize the request
    const authResult = await authenticateApiRequest(request)
    
    if (!authResult.success || !authResult.user) {
      logSecurityEvent('UNAUTHORIZED_REQUEST', null, { 
        endpoint: '/api/charts/travel-data',
        error: authResult.error 
      })
      return createAuthErrorResponse(
        authResult.error || 'Authentication failed', 
        authResult.statusCode || 401
      )
    }

    const authenticatedUser = authResult.user
    logSecurityEvent('AUTH_SUCCESS', authenticatedUser, { 
      endpoint: '/api/charts/travel-data' 
    })

    const supabase = createClient(supabaseUrl, supabaseServiceRole)
    
    // Query for real trip data with participants and users
    const { data: trips, error } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        start_date,
        end_date,
        total_cost,
        trip_type,
        status,
        created_at,
        trip_participants!inner (
          user_id,
          users!trip_participants_user_id_fkey (
            id,
            full_name,
            email
          )
        )
      `)
      .neq('status', 'cancelled')
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 })
    }

    if (!trips || trips.length === 0) {
      // 🔒 SECURITY: Return safe empty data structure
      const emptyData = {
        heatmapData: {
          yearlyData: new Map(),
          totalTrips: 0,
          years: []
        },
        trendsData: {
          monthlyData: [],
          totalTrips: 0,
          totalCost: authenticatedUser.can_view_cost_data ? 0 : undefined, // Only include cost if authorized
          tripsByType: {
            convention: 0,
            in_land: 0,
            other: 0
          }
        },
        has_cost_data: authenticatedUser.can_view_cost_data
      }
      
      return NextResponse.json(emptyData)
    }

    // Process data for heatmap
    const yearlyData = new Map<number, any>()
    const staffData = new Map<string, any>()
    
    // Process data for trends
    const monthlyMap = new Map<string, any>()
    let totalCost = 0
    let tripsByType = { convention: 0, in_land: 0, other: 0 }

    trips.forEach((trip: any) => {
      const startDate = new Date(trip.start_date)
      const year = startDate.getFullYear()
      const weekNumber = getWeekNumber(startDate)
      const monthKey = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      // 🔒 SECURITY: Only process cost data for authorized users
      const cost = (authenticatedUser.can_view_cost_data && trip.total_cost) ? parseFloat(trip.total_cost) : 0
      totalCost += cost

      // Count trip types
      switch (trip.trip_type) {
        case 'convention':
          tripsByType.convention++
          break
        case 'in_land':
          tripsByType.in_land++
          break
        default:
          tripsByType.other++
          break
      }

      // Process monthly data for trends
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          conventions: 0,
          inland: 0,
          other: 0,
          totalCost: 0,
          trips: []
        })
      }
      
      const monthData = monthlyMap.get(monthKey)!
      // 🔒 SECURITY: Only include cost data for authorized users
      if (authenticatedUser.can_view_cost_data) {
        monthData.totalCost += cost
      }
      monthData.trips.push(trip)
      
      switch (trip.trip_type) {
        case 'convention':
          monthData.conventions++
          break
        case 'in_land':
          monthData.inland++
          break
        default:
          monthData.other++
          break
      }

      // Process yearly data for heatmap
      if (!yearlyData.has(year)) {
        yearlyData.set(year, {
          entities: new Map(),
          totalTrips: 0,
          busiestWeekCount: 0
        })
      }

      const yearData = yearlyData.get(year)!
      yearData.totalTrips++

      // Process each participant
      trip.trip_participants?.forEach((participant: any) => {
        const user = participant.users
        if (!user) return

        const staffName = user.full_name || 'Unknown'
        
        // Initialize staff data if not exists
        if (!staffData.has(staffName)) {
          staffData.set(staffName, {
            name: staffName,
            weeks: new Map(),
            totalTrips: 0
          })
        }

        const staff = staffData.get(staffName)!
        staff.totalTrips++

        // Track weekly activity
        if (!staff.weeks.has(weekNumber)) {
          staff.weeks.set(weekNumber, {
            count: 0,
            level: 0
          })
        }

        const weekData = staff.weeks.get(weekNumber)!
        weekData.count++
        weekData.level = Math.min(weekData.count, 4)

        // Update year's busiest week count
        yearData.busiestWeekCount = Math.max(yearData.busiestWeekCount, weekData.count)
      })

      // Set staff data in year data
      staffData.forEach((staff, name) => {
        yearData.entities.set(name, {
          name: staff.name,
          weeks: staff.weeks,
          totalTrips: staff.totalTrips
        })
      })
    })

    // Convert Maps to Objects for JSON serialization
    const heatmapData = {
      yearlyData: Object.fromEntries(
        Array.from(yearlyData.entries()).map(([year, data]) => [
          year,
          {
            ...data,
            entities: Object.fromEntries(
              Array.from(data.entities.entries()).map(([name, entity]) => [
                name,
                {
                  ...entity,
                  weeks: Object.fromEntries(Array.from(entity.weeks.entries()))
                }
              ])
            )
          }
        ])
      ),
      totalTrips: trips.length,
      years: Array.from(yearlyData.keys()).sort((a, b) => a - b)
    }

    // Sort monthly data chronologically
    const sortedMonthlyData = Array.from(monthlyMap.values()).sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime()
    })

    const trendsData = {
      monthlyData: sortedMonthlyData,
      totalTrips: trips.length,
      totalCost: authenticatedUser.can_view_cost_data ? totalCost : undefined, // Only include if authorized
      tripsByType
    }

    // 🔒 SECURITY: Filter cost data and log access
    const responseData = {
      heatmapData,
      trendsData,
      success: true,
      has_cost_data: authenticatedUser.can_view_cost_data
    }

    if (authenticatedUser.can_view_cost_data) {
      logSecurityEvent('COST_ACCESS_GRANTED', authenticatedUser, { 
        endpoint: '/api/charts/travel-data',
        trips_processed: trips.length,
        total_cost: totalCost
      })
    } else {
      logSecurityEvent('COST_ACCESS_DENIED', authenticatedUser, { 
        endpoint: '/api/charts/travel-data',
        trips_processed: trips.length,
        cost_data_filtered: true
      })
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch travel data' },
      { status: 500 }
    )
  }
}

// Helper function to get week number from date (ISO week number)
function getWeekNumber(date: Date): number {
  // ISO week calculation (Monday-Sunday weeks, first week contains Jan 4th)
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7 // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3) // Thursday of this week
  const firstThursday = target.valueOf()
  target.setMonth(0, 1) // January 1st
  if (target.getDay() !== 4) { // If January 1st is not a Thursday
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7) // First Thursday of the year
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000) // 604800000 = 7 * 24 * 3600 * 1000
}