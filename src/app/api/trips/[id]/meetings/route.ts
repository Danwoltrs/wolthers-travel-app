import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface MeetingUpdateRequest {
  meetings: Array<{
    id?: string
    day: number
    time: string
    title: string
    location?: string
    attendees?: string[]
    notes?: string
  }>
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let user: any = null
  
  try {
    // Authentication logic (same as progressive save)
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
    const body: MeetingUpdateRequest = await request.json()
    const { meetings } = body

    if (!meetings || !Array.isArray(meetings)) {
      return NextResponse.json(
        { error: 'Invalid meetings data' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Check if user has permission to edit this trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
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

    // Update the trip's itinerary data with new meetings
    const { data: currentTrip } = await supabase
      .from('trips')
      .select('step_data')
      .eq('id', tripId)
      .single()

    const stepData = currentTrip?.step_data || {}
    const updatedStepData = {
      ...stepData,
      meetings: meetings,
      lastMeetingUpdate: new Date().toISOString()
    }

    // Update the trip with new meeting data
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        step_data: updatedStepData,
        last_edited_at: new Date().toISOString(),
        last_edited_by: user.id
      })
      .eq('id', tripId)

    if (updateError) {
      console.error('Failed to update trip meetings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update meetings', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Meetings updated successfully',
      meetings: meetings
    })

  } catch (error) {
    console.error('Meeting update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch current meetings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const tripId = params.id

    const { data: trip, error } = await supabase
      .from('trips')
      .select('step_data')
      .eq('id', tripId)
      .single()

    if (error || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    const meetings = trip.step_data?.meetings || []

    return NextResponse.json({
      success: true,
      meetings: meetings
    })

  } catch (error) {
    console.error('Get meetings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}