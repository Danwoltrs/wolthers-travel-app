import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { sendTripNotification } from '@/lib/send-trip-notification'

export async function POST(req: NextRequest) {
  try {
    const { tripId, name, email } = await req.json()
    if (!tripId || !email) {
      return NextResponse.json({ error: 'tripId and email required' }, { status: 400 })
    }
    const supabase = createSupabaseServiceClient()

    // Upsert user
    const { data: existing } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('email', email)
      .single()

    let userId = existing?.id
    if (!existing) {
      const { data: created, error: createError } = await supabase
        .from('users')
        .insert({ email, full_name: name, role: 'driver', is_active: false })
        .select('id, full_name, email')
        .single()
      if (createError || !created) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      userId = created.id
    }

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
        user_id: userId!,
        role: 'driver',
        start_date: trip.start_date,
        end_date: trip.end_date
      },
      { onConflict: 'trip_id,user_id' }
    )

    await sendTripNotification({ type: 'invited', tripId, email })

    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', userId)
      .single()

    return NextResponse.json({ user })
  } catch (err) {
    console.error('inviteDriver error', err)
    return NextResponse.json({ error: 'Failed to invite driver' }, { status: 500 })
  }
}
