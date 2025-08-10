import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Try JWT token authentication first (Microsoft OAuth)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
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
      } catch (jwtError) {
        console.log('🔑 JWT verification failed, trying Supabase session...')
      }
    }

    // If JWT failed, try Supabase session authentication (Email/Password)
    if (!user) {
      try {
        const supabaseClient = createSupabaseServiceClient()
        
        // Try to get session from Supabase auth header
        let authToken = null
        if (authHeader && authHeader.startsWith('Bearer ')) {
          authToken = authHeader.substring(7)
        }
        
        // Check if this might be a Supabase session token
        if (authToken && authToken.includes('.')) {
          // This looks like a Supabase JWT token, try to verify with Supabase
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(authToken)
          
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
        }
      } catch (supabaseError) {
        console.log('🔑 Supabase authentication also failed:', supabaseError)
      }
    }
    
    // If both methods failed, return unauthorized
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const currentYear = new Date().getFullYear()
    const now = new Date().toISOString().split('T')[0]
    // Calculate the range of years to include (up to 5 years back)
    const yearsToInclude = 5
    const oldestYear = currentYear - (yearsToInclude - 1)

    console.log('🔍 API: Fetching trip statistics for user:', {
      email: user.email,
      userId: user.id,
      yearRange: `${oldestYear}-${currentYear}`
    })

    // Get all trips for this user through trip_participants using service role
    const supabase = createSupabaseServiceClient()
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

      // Group trips by year and week for multi-year heatmap
      const yearlyData: Record<number, { weeklyData: Record<number, number>; tripCount: number; maxTripsPerWeek: number }> = {}
      let globalMaxTrips = 0

      const getWeekOfYear = (date: Date): number => {
        const start = new Date(date.getFullYear(), 0, 1)
        const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayOfYear = (today.getTime() - start.getTime() + 86400000) / 86400000
        return Math.ceil(dayOfYear / 7)
      }

      // Initialize yearly data for all potential years
      for (let year = oldestYear; year <= currentYear; year++) {
        yearlyData[year] = {
          weeklyData: {},
          tripCount: 0,
          maxTripsPerWeek: 0
        }
      }

      // Process all trips and group by year and week
      userTrips.forEach(tp => {
        const trip = tp.trips
        if (trip && trip.start_date) {
          const startDate = new Date(trip.start_date)
          const tripYear = startDate.getFullYear()
          
          // Only include trips within our year range
          if (tripYear >= oldestYear && tripYear <= currentYear) {
            const weekOfYear = getWeekOfYear(startDate)
            const yearData = yearlyData[tripYear]
            
            yearData.weeklyData[weekOfYear] = (yearData.weeklyData[weekOfYear] || 0) + 1
            yearData.tripCount++
            yearData.maxTripsPerWeek = Math.max(yearData.maxTripsPerWeek, yearData.weeklyData[weekOfYear])
            globalMaxTrips = Math.max(globalMaxTrips, yearData.weeklyData[weekOfYear])
          }
        }
      })

      // Filter out years with no trips (smart year filtering)
      const yearsWithTrips = Object.keys(yearlyData)
        .map(year => parseInt(year))
        .filter(year => yearlyData[year].tripCount > 0)
        .sort((a, b) => b - a) // Sort descending (newest first)

      console.log('📊 API: Multi-year heatmap data:', {
        yearsWithTrips,
        totalYearsWithData: yearsWithTrips.length,
        globalMaxTrips
      })

      return NextResponse.json({
        tripsThisYear: tripsThisYear.length,
        upcomingTrips: upcomingTrips.length,
        totalTrips: userTrips.length,
        // Legacy single-year data for backward compatibility
        weeklyData: yearlyData[currentYear]?.weeklyData || {},
        maxTripsPerWeek: yearlyData[currentYear]?.maxTripsPerWeek || 0,
        year: currentYear,
        // New multi-year data
        yearlyData,
        yearsWithTrips,
        globalMaxTrips,
        hasAnyTrips: yearsWithTrips.length > 0
      })
    } else {
      return NextResponse.json({
        tripsThisYear: 0,
        upcomingTrips: 0,
        totalTrips: 0,
        weeklyData: {},
        maxTripsPerWeek: 0,
        year: currentYear,
        yearlyData: {},
        yearsWithTrips: [],
        globalMaxTrips: 0,
        hasAnyTrips: false
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