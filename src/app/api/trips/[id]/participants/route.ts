import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ParticipantEmailService } from '@/services/participant-email-service'

interface ParticipantUpdateRequest {
  staff?: Array<{
    id: string
    role?: string
  }>
  guests?: Array<{
    id: string
    name: string
    email?: string
    company_id?: string
  }>
  action: 'add' | 'remove' | 'replace'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: any = null
  
  try {
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
      
      try {
        const decoded = verify(token, secret) as any
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        // Try Supabase session authentication
        const supabaseClient = createServerSupabaseClient()
        
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
          
          if (!sessionError && supabaseUser) {
            const { data: userData, error: userError } = await supabaseClient
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

    const { id: tripId } = await params
    const body: ParticipantUpdateRequest = await request.json()
    const { staff, guests, action } = body

    const supabase = createServerSupabaseClient()

    // Check if user has permission to edit this trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        creator_id, 
        start_date,
        end_date,
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
    const hasPermission = 
      trip.creator_id === user.id ||
      user.is_global_admin ||
      trip.trip_access_permissions?.some((perm: any) => 
        perm.user_id === user.id && 
        ['edit', 'admin'].includes(perm.permission_type) &&
        (!perm.expires_at || new Date(perm.expires_at) > new Date())
      )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    // Handle staff updates
    if (staff && Array.isArray(staff)) {
      // Check for conflicts with overlap prevention
      for (const staffMember of staff) {
        if (action === 'add' || action === 'replace') {
          const { data: isAvailable } = await supabase
            .rpc('check_staff_availability', {
              staff_user_id: staffMember.id,
              trip_start_date: trip.start_date,
              trip_end_date: trip.end_date,
              exclude_trip_id: tripId
            })

          if (!isAvailable) {
            return NextResponse.json(
              { 
                error: 'Staff member has conflicting assignment',
                details: `Staff member is already assigned to another trip during this period`
              },
              { status: 409 }
            )
          }
        }
      }

      if (action === 'replace') {
        // Remove all existing staff participants
        await supabase
          .from('trip_participants')
          .delete()
          .eq('trip_id', tripId)
          .eq('role', 'staff')
      }

      if (action === 'add' || action === 'replace') {
        // Add new staff participants
        const staffInserts = staff.map(staffMember => ({
          trip_id: tripId,
          user_id: staffMember.id,
          company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0', // Wolthers & Associates
          role: staffMember.role || 'staff',
          is_partial: false,
          created_at: now,
          updated_at: now
        }))

        const { error: staffError } = await supabase
          .from('trip_participants')
          .insert(staffInserts)

        if (staffError) {
          console.error('Failed to add staff participants:', staffError)
          return NextResponse.json(
            { error: 'Failed to add staff participants', details: staffError.message },
            { status: 500 }
          )
        }

        // Send emails to newly added staff members (only for 'add' and 'replace' actions)
        if ((action === 'add' || action === 'replace')) {
          try {
            await sendParticipantEmails(tripId, staff.map(s => ({ participantId: s.id, role: s.role || 'staff' })))
          } catch (emailError) {
            console.error('Failed to send staff emails:', emailError)
            // Don't fail the request - emails are not critical for participant addition
          }
        }
      } else if (action === 'remove') {
        // Remove specific staff participants
        const staffIds = staff.map(s => s.id)
        await supabase
          .from('trip_participants')
          .delete()
          .eq('trip_id', tripId)
          .eq('role', 'staff')
          .in('user_id', staffIds)
      }
    }

    // Handle guest and host updates (stored in trip_participants table for email functionality)
    if (guests && Array.isArray(guests)) {
      if (action === 'replace') {
        // Remove all existing guest participants
        await supabase
          .from('trip_participants')
          .delete()
          .eq('trip_id', tripId)
          .in('role', ['client_representative', 'external_guest', 'host'])
      }

      if (action === 'add' || action === 'replace') {
        // Add new guest participants
        const guestInserts = guests.map(guest => ({
          trip_id: tripId,
          user_id: guest.id,
          company_id: guest.company_id,
          role: guest.role || (guest.company_id ? 'host' : 'external_guest'), // Determine role based on company
          guest_email: guest.email,
          guest_name: guest.name,
          guest_company: guest.company_name,
          is_partial: false,
          created_at: now,
          updated_at: now
        }))

        const { error: guestError } = await supabase
          .from('trip_participants')
          .insert(guestInserts)

        if (guestError) {
          console.error('Failed to add guest participants:', guestError)
          return NextResponse.json(
            { error: 'Failed to add guest participants', details: guestError.message },
            { status: 500 }
          )
        }

        // Send emails to newly added guests and hosts
        if ((action === 'add' || action === 'replace')) {
          try {
            const participantEmails = guests.map(guest => ({
              participantId: guest.id,
              role: guest.role || (guest.company_id ? 'host' : 'external_guest')
            }))
            await sendParticipantEmails(tripId, participantEmails)
          } catch (emailError) {
            console.error('Failed to send guest/host emails:', emailError)
            // Don't fail the request - emails are not critical for participant addition
          }
        }
      } else if (action === 'remove') {
        // Remove specific guest participants
        const guestIds = guests.map(g => g.id)
        await supabase
          .from('trip_participants')
          .delete()
          .eq('trip_id', tripId)
          .in('role', ['client_representative', 'external_guest', 'host'])
          .in('user_id', guestIds)
      }

      // Also update step_data for backward compatibility
      const { data: currentTrip } = await supabase
        .from('trips')
        .select('step_data')
        .eq('id', tripId)
        .single()

      const stepData = currentTrip?.step_data || {}
      let currentGuests = stepData.guests || []

      if (action === 'replace') {
        currentGuests = guests
      } else if (action === 'add') {
        // Add new guests, avoiding duplicates
        const existingIds = currentGuests.map((g: any) => g.id)
        const newGuests = guests.filter(g => !existingIds.includes(g.id))
        currentGuests = [...currentGuests, ...newGuests]
      } else if (action === 'remove') {
        const removeIds = guests.map(g => g.id)
        currentGuests = currentGuests.filter((g: any) => !removeIds.includes(g.id))
      }

      const updatedStepData = {
        ...stepData,
        guests: currentGuests,
        lastParticipantUpdate: now
      }

      const { error: updateError } = await supabase
        .from('trips')
        .update({
          step_data: updatedStepData,
          last_edited_at: now,
          last_edited_by: user.id
        })
        .eq('id', tripId)

      if (updateError) {
        console.error('Failed to update trip step_data:', updateError)
        // Don't fail the request - step_data update is for backward compatibility
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Participants updated successfully'
    })

  } catch (error) {
    console.error('Participant update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to send emails to participants
 */
async function sendParticipantEmails(tripId: string, participants: Array<{ participantId: string; role: string }>) {
  const supabase = createServerSupabaseClient()
  
  // Get trip context for emails
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select(`
      id,
      title,
      access_code,
      start_date,
      end_date,
      creator_id,
      users!trips_creator_id_fkey(
        full_name,
        email
      )
    `)
    .eq('id', tripId)
    .single()

  if (tripError || !trip) {
    console.error('Failed to fetch trip details for email:', tripError)
    return
  }

  // Get current participants for email context
  const { data: currentParticipants } = await supabase
    .from('trip_participants')
    .select(`
      users!inner(
        id,
        full_name,
        email,
        role
      )
    `)
    .eq('trip_id', tripId)
    .eq('role', 'staff')

  const participantList = currentParticipants?.map(tp => ({
    id: tp.users.id,
    name: tp.users.full_name,
    email: tp.users.email,
    role: tp.users.role || 'staff'
  })) || []

  const emailContext = {
    tripId: trip.id,
    tripTitle: trip.title,
    tripAccessCode: trip.access_code,
    tripStartDate: trip.start_date,
    tripEndDate: trip.end_date,
    createdBy: trip.users.full_name,
    createdByEmail: trip.users.email,
    participants: participantList
  }

  // Send emails for each participant
  await ParticipantEmailService.sendParticipantEmails(participants, emailContext)
}

// POST endpoint to add a single participant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: any = null
  
  try {
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
      
      try {
        const decoded = verify(token, secret) as any
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        // Try Supabase session authentication
        const supabaseClient = createServerSupabaseClient()
        
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
          
          if (!sessionError && supabaseUser) {
            const { data: userData, error: userError } = await supabaseClient
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

    const { id: tripId } = await params
    const participant = await request.json()

    const supabase = createServerSupabaseClient()

    // Add participant to trip_participants table with conflict handling
    const now = new Date().toISOString()
    
    // First check if participant already exists
    const { data: existingParticipant } = await supabase
      .from('trip_participants')
      .select('*')
      .eq('trip_id', tripId)
      .eq('user_id', participant.personId)
      .single()
    
    if (existingParticipant) {
      // Participant already exists, return success with existing data
      return NextResponse.json({
        success: true,
        participant: existingParticipant,
        message: 'Participant already on trip'
      })
    }
    
    const { data: newParticipant, error: insertError } = await supabase
      .from('trip_participants')
      .insert({
        trip_id: tripId,
        user_id: participant.personId,
        company_id: participant.companyId || '840783f4-866d-4bdb-9b5d-5d0facf62db0',
        role: participant.role || 'staff',
        is_partial: false,
        created_at: now,
        updated_at: now
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to add participant:', insertError)
      return NextResponse.json(
        { error: 'Failed to add participant', details: insertError.message },
        { status: 500 }
      )
    }

    // Send email to newly added participant
    try {
      await sendParticipantEmails(tripId, [{ participantId: participant.personId, role: participant.role || 'staff' }])
    } catch (emailError) {
      console.error('Failed to send participant email:', emailError)
      // Don't fail the request - emails are not critical for participant addition
    }

    return NextResponse.json({
      success: true,
      participant: newParticipant
    })

  } catch (error) {
    console.error('Add participant error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch current participants
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { id: tripId } = await params

    // Get staff participants
    const { data: staffParticipants, error: staffError } = await supabase
      .from('trip_participants')
      .select(`
        user_id,
        role,
        users!trip_participants_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('trip_id', tripId)
      .eq('role', 'staff')

    if (staffError) {
      console.error('Error fetching staff participants:', staffError)
    }

    // Get guest participants with invitation information
    const { data: guestParticipants, error: guestError } = await supabase
      .from('trip_participants')
      .select(`
        id,
        user_id,
        role,
        guest_email,
        guest_name,
        guest_company,
        guest_title,
        guest_phone,
        invited_by,
        created_at,
        guest_invitations!inner (
          id,
          status,
          sent_at,
          accepted_at,
          declined_at,
          email_sent_count,
          last_email_sent_at
        ),
        invited_by_user:users!trip_participants_invited_by_fkey (
          full_name
        )
      `)
      .eq('trip_id', tripId)
      .in('role', ['client_representative', 'external_guest'])

    if (guestError) {
      console.error('Error fetching guest participants:', guestError)
    }

    // Also get pending invitations that haven't been accepted yet
    const { data: pendingInvitations, error: invitationError } = await supabase
      .from('guest_invitations')
      .select(`
        id,
        guest_email,
        guest_name,
        guest_company,
        guest_title,
        guest_phone,
        status,
        sent_at,
        accepted_at,
        declined_at,
        email_sent_count,
        last_email_sent_at,
        invitation_type,
        invited_by,
        invited_by_user:users!guest_invitations_invited_by_fkey (
          full_name
        )
      `)
      .eq('trip_id', tripId)
      .eq('status', 'pending')

    if (invitationError) {
      console.error('Error fetching pending invitations:', invitationError)
    }

    // Get trip step_data for any additional guests
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('step_data')
      .eq('id', tripId)
      .single()

    if (tripError) {
      console.error('Error fetching trip data:', tripError)
    }

    const stepDataGuests = trip?.step_data?.guests || []

    return NextResponse.json({
      success: true,
      staff: staffParticipants || [],
      guests: guestParticipants || [],
      pendingInvitations: pendingInvitations || [],
      stepDataGuests: stepDataGuests
    })

  } catch (error) {
    console.error('Get participants error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

