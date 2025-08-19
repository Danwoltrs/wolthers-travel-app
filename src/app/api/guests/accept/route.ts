import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface InvitationAcceptRequest {
  token: string
  userId?: string // Optional - if user is already logged in
}

export async function POST(request: NextRequest) {
  try {
    const body: InvitationAcceptRequest = await request.json()
    const { token, userId } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Use the database function to handle invitation acceptance
    const { data: result, error: acceptError } = await supabase
      .rpc('accept_guest_invitation', {
        invitation_token_param: token,
        user_id_param: userId || null
      })

    if (acceptError) {
      console.error('Failed to accept invitation:', acceptError)
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      )
    }

    const acceptanceResult = result?.[0]

    if (!acceptanceResult?.success) {
      return NextResponse.json(
        { error: acceptanceResult?.message || 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // Get trip details for redirect
    const { data: tripDetails } = await supabase
      .from('trips')
      .select('title, access_code, start_date, end_date')
      .eq('id', acceptanceResult.trip_id)
      .single()

    console.log(`✅ Guest invitation accepted successfully:`, {
      invitationId: acceptanceResult.invitation_id,
      tripId: acceptanceResult.trip_id,
      participantId: acceptanceResult.participant_id,
      tripTitle: tripDetails?.title
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      trip: {
        id: acceptanceResult.trip_id,
        title: tripDetails?.title,
        access_code: tripDetails?.access_code,
        start_date: tripDetails?.start_date,
        end_date: tripDetails?.end_date
      },
      participant_id: acceptanceResult.participant_id,
      redirect_url: `/trips/${tripDetails?.access_code || acceptanceResult.trip_id}`
    })

  } catch (error) {
    console.error('❌ Invitation acceptance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to validate token and get invitation details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('active_guest_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        guest_name: invitation.guest_name,
        guest_email: invitation.guest_email,
        guest_company: invitation.guest_company,
        guest_title: invitation.guest_title,
        trip_title: invitation.trip_title,
        trip_start_date: invitation.trip_start_date,
        trip_end_date: invitation.trip_end_date,
        invited_by_name: invitation.invited_by_name,
        invitation_message: invitation.invitation_message,
        expires_at: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('❌ Invitation validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}