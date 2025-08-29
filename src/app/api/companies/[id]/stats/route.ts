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
    const resolvedParams = await params
    
    // Get basic company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', resolvedParams.id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get trip statistics for this company
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id, status, start_date, end_date')
      .eq('company_id', resolvedParams.id)

    const tripStats = trips ? trips.reduce((acc, trip) => {
      acc.totalTrips++
      
      const startDate = new Date(trip.start_date)
      const endDate = new Date(trip.end_date)
      const now = new Date()
      
      if (trip.status === 'completed' || endDate < now) {
        acc.completedTrips++
      } else if (trip.status === 'ongoing' || (startDate <= now && endDate >= now)) {
        acc.activeTrips++
      } else {
        acc.activeTrips++
      }
      
      return acc
    }, { totalTrips: 0, activeTrips: 0, completedTrips: 0 }) : { totalTrips: 0, activeTrips: 0, completedTrips: 0 }

    // Get user count for this company
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', resolvedParams.id)

    const totalUsers = users ? users.length : 0

    const stats = {
      ...tripStats,
      totalUsers
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in company stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}