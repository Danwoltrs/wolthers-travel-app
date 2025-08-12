import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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
  { params }: { params: { id: string } }
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

    const tripId = params.id
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

    // Handle guest updates (stored in step_data for now)
    if (guests && Array.isArray(guests)) {
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
        console.error('Failed to update trip guests:', updateError)
        return NextResponse.json(
          { error: 'Failed to update guests', details: updateError.message },
          { status: 500 }
        )
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

// GET endpoint to fetch current participants
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const tripId = params.id

    // Get staff participants
    const { data: staffParticipants, error: staffError } = await supabase
      .from('trip_participants')
      .select(`
        user_id,
        role,
        users (
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

    // Get guest participants from step_data
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('step_data')
      .eq('id', tripId)
      .single()

    if (tripError) {
      console.error('Error fetching trip data:', tripError)
    }

    const guests = trip?.step_data?.guests || []

    return NextResponse.json({
      success: true,
      staff: staffParticipants || [],
      guests: guests
    })

  } catch (error) {
    console.error('Get participants error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}