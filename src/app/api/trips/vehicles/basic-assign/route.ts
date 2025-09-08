import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { tripId, vehicleId, rental } = await req.json()
    if (!tripId || (!vehicleId && !rental)) {
      return NextResponse.json({ error: 'tripId and vehicleId or rental required' }, { status: 400 })
    }
    const supabase = createSupabaseServiceClient()
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('start_date,end_date')
      .eq('id', tripId)
      .single()
    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Remove previous vehicle assignments for this trip
    await supabase.from('trip_vehicles').delete().eq('trip_id', tripId)

    const record: any = {
      trip_id: tripId,
      start_date: trip.start_date,
      end_date: trip.end_date,
      status: 'assigned'
    }
    if (vehicleId) {
      record.vehicle_id = vehicleId
      record.assignment_type = 'company_vehicle'
    } else {
      record.vehicle_id = null
      record.assignment_type = 'rental_assigned'
      record.rental_company = rental?.provider || null
      record.rental_pickup_time = rental?.pickup ? rental.pickup.split('T')[1] : null
      record.rental_return_time = rental?.dropoff ? rental.dropoff.split('T')[1] : null
    }

    const { data: inserted, error: insertError } = await supabase
      .from('trip_vehicles')
      .insert(record)
      .select('id, vehicle_id, rental_company, rental_pickup_time, rental_return_time')
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to assign vehicle' }, { status: 500 })
    }

    return NextResponse.json({ assignment: inserted })
  } catch (err) {
    console.error('assignVehicle error', err)
    return NextResponse.json({ error: 'Failed to assign vehicle' }, { status: 500 })
  }
}
