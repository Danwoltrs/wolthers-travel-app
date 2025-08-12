import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface AvailabilityCheckRequest {
  type: 'staff' | 'vehicle'
  id: string
  startDate: string
  endDate: string
  excludeTripId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AvailabilityCheckRequest = await request.json()
    const { type, id, startDate, endDate, excludeTripId } = body

    if (!type || !id || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: type, id, startDate, endDate' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    let isAvailable = false
    let conflicts: any[] = []

    if (type === 'staff') {
      // Check staff availability
      const { data: result, error } = await supabase
        .rpc('check_staff_availability', {
          staff_user_id: id,
          trip_start_date: startDate,
          trip_end_date: endDate,
          exclude_trip_id: excludeTripId || null
        })

      if (error) {
        console.error('Error checking staff availability:', error)
        return NextResponse.json(
          { error: 'Failed to check staff availability' },
          { status: 500 }
        )
      }

      isAvailable = result

      // If not available, get conflict details
      if (!isAvailable) {
        const { data: conflictTrips } = await supabase
          .from('trips')
          .select(`
            id,
            title,
            start_date,
            end_date,
            trip_participants!inner (
              user_id
            )
          `)
          .eq('trip_participants.user_id', id)
          .in('status', ['planning', 'confirmed', 'ongoing'])
          .not('id', 'eq', excludeTripId || '00000000-0000-0000-0000-000000000000')
          .gte('end_date', startDate)
          .lte('start_date', endDate)

        conflicts = conflictTrips || []
      }

    } else if (type === 'vehicle') {
      // Check vehicle availability
      const { data: result, error } = await supabase
        .rpc('check_vehicle_availability', {
          vehicle_id: id,
          trip_start_date: startDate,
          trip_end_date: endDate,
          exclude_trip_id: excludeTripId || null
        })

      if (error) {
        console.error('Error checking vehicle availability:', error)
        return NextResponse.json(
          { error: 'Failed to check vehicle availability' },
          { status: 500 }
        )
      }

      isAvailable = result

      // If not available, get conflict details
      if (!isAvailable) {
        const { data: conflictTrips } = await supabase
          .from('trips')
          .select(`
            id,
            title,
            start_date,
            end_date,
            trip_vehicles!inner (
              vehicle_id
            )
          `)
          .eq('trip_vehicles.vehicle_id', id)
          .in('status', ['planning', 'confirmed', 'ongoing'])
          .not('id', 'eq', excludeTripId || '00000000-0000-0000-0000-000000000000')
          .gte('end_date', startDate)
          .lte('start_date', endDate)

        conflicts = conflictTrips || []
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "staff" or "vehicle"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      available: isAvailable,
      conflicts: conflicts.map(conflict => ({
        tripId: conflict.id,
        title: conflict.title,
        startDate: conflict.start_date,
        endDate: conflict.end_date
      }))
    })

  } catch (error) {
    console.error('Availability check error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}