import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: any = null
  
  try {
    // Authentication logic (same as other API endpoints)
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
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const activityId = resolvedParams.id

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get all participants for this activity
    const { data: participants, error } = await supabase
      .from('activity_participants')
      .select(`
        id,
        participant_id,
        role,
        attendance_status,
        created_at,
        trip_participants!inner (
          id,
          user_id,
          guest_name,
          guest_email,
          guest_company,
          users (
            id,
            email,
            full_name,
            companies (
              id,
              name
            )
          )
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching activity participants:', error)
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 })
    }

    return NextResponse.json({ participants: participants || [] })

  } catch (error) {
    console.error('Error in activity participants GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: any = null
  
  try {
    // Authentication logic (same as other API endpoints)
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
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const activityId = resolvedParams.id
    const body = await request.json()
    const { participant_id, role, attendance_status } = body

    if (!participant_id) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    console.log('Adding participant to activity:', { activityId, participant_id, role, attendance_status })

    // Add participant to activity
    const { data: newParticipant, error: insertError } = await supabase
      .from('activity_participants')
      .insert({
        activity_id: activityId,
        participant_id,
        role: role || 'attendee',
        attendance_status: attendance_status || 'invited',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error adding activity participant:', insertError)
      return NextResponse.json({ 
        error: 'Failed to add participant', 
        details: insertError.message 
      }, { status: 500 })
    }

    console.log('Activity participant added successfully:', newParticipant.id)
    return NextResponse.json(newParticipant)

  } catch (error) {
    console.error('Error in activity participants POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: any = null
  
  try {
    // Authentication logic (same as other API endpoints)
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
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const activityId = resolvedParams.id
    const body = await request.json()
    const { participant_id } = body

    if (!participant_id) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    console.log('Removing participant from activity:', { activityId, participant_id })

    // Remove participant from activity
    const { error: deleteError } = await supabase
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId)
      .eq('participant_id', participant_id)

    if (deleteError) {
      console.error('Error removing activity participant:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to remove participant', 
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('Activity participant removed successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in activity participants DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}