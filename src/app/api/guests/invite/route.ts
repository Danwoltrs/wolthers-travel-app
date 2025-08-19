import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifySessionToken, extractBearerToken } from '@/lib/jwt-utils'
import { sendGuestInvitationEmail, generateInvitationToken } from '@/lib/email'

interface GuestInvitationRequest {
  tripId: string
  guestEmail: string
  guestName: string
  guestCompany?: string
  guestTitle?: string
  guestPhone?: string
  message?: string
  invitationType?: 'company_guest' | 'external_guest'
  isReminder?: boolean
}

export async function POST(request: NextRequest) {
  try {
    let user: any = null
    
    // Try JWT token authentication first (Microsoft OAuth and Email/Password)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = extractBearerToken(authHeader)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      try {
        // Try custom JWT token first
        const decoded = verifySessionToken(token)
        if (decoded) {
          // Get user from database
          const supabase = createServerSupabaseClient()
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single()

          if (!userError && userData) {
            user = userData
          }
        }
      } catch (jwtError) {
        // Try Supabase session authentication
        const supabase = createServerSupabaseClient()
        
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser }, error: sessionError } = await supabase.auth.getUser(token)
          
          if (!sessionError && supabaseUser) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()

            if (!userError && userData) {
              user = userData
            }
          }
        }
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body: GuestInvitationRequest = await request.json()
    const { 
      tripId, 
      guestEmail, 
      guestName, 
      guestCompany, 
      guestTitle, 
      guestPhone, 
      message, 
      invitationType = 'company_guest',
      isReminder = false
    } = body

    // Validate required fields
    if (!tripId || !guestEmail || !guestName) {
      return NextResponse.json(
        { error: 'Trip ID, guest email, and guest name are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Check if user has permission to invite guests to this trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        title,
        start_date,
        end_date,
        access_code,
        creator_id, 
        trip_access_permissions (user_id, permission_type, expires_at)
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const hasPermission = trip.creator_id === user.id || 
      trip.trip_access_permissions?.some((perm: any) => 
        perm.user_id === user.id && 
        ['edit', 'admin'].includes(perm.permission_type) &&
        (!perm.expires_at || new Date(perm.expires_at) > new Date())
      )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to invite guests to this trip' },
        { status: 403 }
      )
    }

    // Check if invitation already exists for this email and trip
    const { data: existingInvitation } = await supabase
      .from('guest_invitations')
      .select('id, status, invitation_token, sent_at, email_sent_count, expires_at')
      .eq('trip_id', tripId)
      .eq('guest_email', guestEmail)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      if (!isReminder) {
        return NextResponse.json(
          { 
            error: 'An invitation has already been sent to this email for this trip',
            canSendReminder: true,
            existingInvitation: {
              id: existingInvitation.id,
              sent_at: existingInvitation.sent_at,
              email_sent_count: existingInvitation.email_sent_count,
              expires_at: existingInvitation.expires_at
            }
          },
          { status: 409 }
        )
      }

      // Handle reminder case
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('guest_invitations')
        .update({
          last_email_sent_at: new Date().toISOString(),
          email_sent_count: (existingInvitation.email_sent_count || 1) + 1,
          invitation_message: message, // Update with new message if provided
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvitation.id)
        .select()
        .single()

      if (updateError || !updatedInvitation) {
        console.error('Failed to update invitation for reminder:', updateError)
        return NextResponse.json(
          { error: 'Failed to send reminder' },
          { status: 500 }
        )
      }

      // Send reminder email using existing token
      const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://trips.wolthers.com'}/accept-invitation?token=${existingInvitation.invitation_token}`
      
      const emailResult = await sendGuestInvitationEmail({
        to: guestEmail,
        guestName,
        tripTitle: trip.title,
        tripStartDate: trip.start_date,
        tripEndDate: trip.end_date,
        invitedBy: user.full_name,
        invitationToken: existingInvitation.invitation_token,
        tripId,
        acceptUrl,
        companyName: guestCompany,
        message
      })

      if (!emailResult.success) {
        return NextResponse.json(
          { error: 'Failed to send reminder email', details: emailResult.error },
          { status: 500 }
        )
      }

      console.log(`✅ Guest invitation reminder sent successfully:`, {
        invitationId: existingInvitation.id,
        guestEmail,
        guestName,
        tripTitle: trip.title,
        invitedBy: user.full_name,
        reminderCount: updatedInvitation.email_sent_count
      })

      return NextResponse.json({
        success: true,
        isReminder: true,
        invitation: {
          id: existingInvitation.id,
          guest_email: guestEmail,
          guest_name: guestName,
          invitation_token: existingInvitation.invitation_token,
          status: 'pending',
          sent_at: updatedInvitation.last_email_sent_at,
          expires_at: existingInvitation.expires_at,
          email_sent_count: updatedInvitation.email_sent_count,
          original_sent_at: existingInvitation.sent_at
        }
      })
    }

    // Generate invitation token
    const invitationToken = generateInvitationToken()

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('guest_invitations')
      .insert({
        trip_id: tripId,
        invited_by: user.id,
        guest_email: guestEmail,
        guest_name: guestName,
        guest_company: guestCompany,
        guest_title: guestTitle,
        guest_phone: guestPhone,
        invitation_token: invitationToken,
        invitation_message: message,
        invitation_type: invitationType,
        status: 'pending',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        email_sent_count: 1,
        last_email_sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (invitationError || !invitation) {
      console.error('Failed to create invitation:', invitationError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Send invitation email
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://trips.wolthers.com'}/accept-invitation?token=${invitationToken}`
    
    const emailResult = await sendGuestInvitationEmail({
      to: guestEmail,
      guestName,
      tripTitle: trip.title,
      tripStartDate: trip.start_date,
      tripEndDate: trip.end_date,
      invitedBy: user.full_name,
      invitationToken,
      tripId,
      acceptUrl,
      companyName: guestCompany,
      message
    })

    if (!emailResult.success) {
      // Delete the invitation if email failed
      await supabase
        .from('guest_invitations')
        .delete()
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Failed to send invitation email', details: emailResult.error },
        { status: 500 }
      )
    }

    console.log(`✅ Guest invitation sent successfully:`, {
      invitationId: invitation.id,
      guestEmail,
      guestName,
      tripTitle: trip.title,
      invitedBy: user.full_name
    })

    return NextResponse.json({
      success: true,
      isReminder: false,
      invitation: {
        id: invitation.id,
        guest_email: guestEmail,
        guest_name: guestName,
        invitation_token: invitationToken,
        status: 'pending',
        sent_at: invitation.sent_at,
        expires_at: invitation.expires_at,
        email_sent_count: 1,
        original_sent_at: invitation.sent_at
      }
    })

  } catch (error) {
    console.error('❌ Guest invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}