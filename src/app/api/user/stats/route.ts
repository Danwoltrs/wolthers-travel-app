import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
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

    const currentYear = new Date().getFullYear()
    const now = new Date().toISOString().split('T')[0]

    console.log('🔍 API: Fetching trip statistics for user:', {
      email: user.email,
      userId: user.id,
      year: currentYear
    })

    // Get all trips for this user through trip_participants using service role
    const { data: userTrips, error: tripsError } = await supabase
      .from('trip_participants')
      .select(`
        trips!inner (
          id,
          start_date,
          end_date,
          status
        )
      `)
      .eq('user_id', user.id)

    if (tripsError) {
      console.error('❌ API: Trip stats error:', tripsError)
      return NextResponse.json(
        { error: 'Failed to fetch trip statistics' },
        { status: 500 }
      )
    }

    console.log('📊 API: Raw trip data:', {
      totalTrips: userTrips?.length || 0,
      trips: userTrips?.map(tp => ({
        id: tp.trips?.id,
        start_date: tp.trips?.start_date,
        status: tp.trips?.status
      }))
    })

    if (userTrips) {
      // Filter trips this year
      const tripsThisYear = userTrips.filter(tp => {
        const trip = tp.trips
        if (!trip || !trip.start_date) return false
        const tripYear = new Date(trip.start_date).getFullYear()
        return tripYear === currentYear
      })

      // Filter upcoming trips
      const upcomingTrips = userTrips.filter(tp => {
        const trip = tp.trips
        if (!trip || !trip.start_date) return false
        return trip.start_date >= now
      })

      console.log('📈 API: Calculated statistics:', {
        tripsThisYear: tripsThisYear.length,
        upcomingTrips: upcomingTrips.length,
        currentYear,
        today: now
      })

      // Group trips by week for heatmap (for the specified year)
      const weeklyData: Record<number, number> = {}
      let maxTrips = 0

      const getWeekOfYear = (date: Date): number => {
        const start = new Date(date.getFullYear(), 0, 1)
        const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayOfYear = (today.getTime() - start.getTime() + 86400000) / 86400000
        return Math.ceil(dayOfYear / 7)
      }

      userTrips.forEach(tp => {
        const trip = tp.trips
        if (trip && trip.start_date) {
          const startDate = new Date(trip.start_date)
          if (startDate.getFullYear() === currentYear) {
            const weekOfYear = getWeekOfYear(startDate)
            weeklyData[weekOfYear] = (weeklyData[weekOfYear] || 0) + 1
            maxTrips = Math.max(maxTrips, weeklyData[weekOfYear])
          }
        }
      })

      return NextResponse.json({
        tripsThisYear: tripsThisYear.length,
        upcomingTrips: upcomingTrips.length,
        totalTrips: userTrips.length,
        weeklyData,
        maxTripsPerWeek: maxTrips,
        year: currentYear
      })
    } else {
      return NextResponse.json({
        tripsThisYear: 0,
        upcomingTrips: 0,
        totalTrips: 0,
        weeklyData: {},
        maxTripsPerWeek: 0,
        year: currentYear
      })
    }

  } catch (error) {
    console.error('❌ API: User stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}