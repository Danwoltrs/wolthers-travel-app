import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({
        heatmapData: {
          yearlyData: new Map(),
          totalTrips: 0,
          years: []
        },
        trendsData: {
          monthlyData: [],
          totalTrips: 0,
          totalCost: 0,
          tripsByType: {
            convention: 0,
            in_land: 0,
            other: 0
          }
        }
      })
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
      
      const cost = trip.total_cost ? parseFloat(trip.total_cost) : 0
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
      monthData.totalCost += cost
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
      totalCost,
      tripsByType
    }

    return NextResponse.json({
      heatmapData,
      trendsData,
      success: true
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch travel data' },
      { status: 500 }
    )
  }
}

// Helper function to get week number from date
function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1)
  const diff = date.getTime() - start.getTime()
  const weekNumber = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
  return weekNumber
}