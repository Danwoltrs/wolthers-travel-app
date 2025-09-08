import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { tripId, userId } = await req.json()
    if (!tripId || !userId) {
      return NextResponse.json({ error: 'tripId and userId required' }, { status: 400 })
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
    await supabase.from('trip_participants').upsert(
      {
        trip_id: tripId,
        user_id: userId,
        role: 'driver',
        start_date: trip.start_date,
        end_date: trip.end_date
      },
      { onConflict: 'trip_id,user_id' }
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('assignDriver error', err)
    return NextResponse.json({ error: 'Failed to assign driver' }, { status: 500 })
  }
}
