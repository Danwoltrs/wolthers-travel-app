import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { EmailService } from '@/lib/email-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { id } = await params
    const supabase = createServerSupabaseClient()

    // Fetch trip for email details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, name, start_date, end_date')
      .eq('id', id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
      .throwOnError(false)

    let user = existingUser

    if (!user) {
      // Create invited user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email, status: 'invited' })
        .select()
        .single()

      if (createError || !newUser) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      user = newUser

      // Send invitation email
      const inviteLink = `https://trips.wolthers.com/auth/register?email=${encodeURIComponent(email)}&tripId=${id}`
      await EmailService.sendTripInviteEmail({
        email,
        tripName: trip.name,
        startDate: trip.start_date,
        endDate: trip.end_date,
        inviteLink
      })
    }

    // Link user to trip
    const { error: linkError } = await supabase
      .from('trip_staff')
      .insert({ trip_id: id, user_id: user.id })

    if (linkError) {
      return NextResponse.json({ error: 'Failed to link staff to trip' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error adding staff to trip', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
