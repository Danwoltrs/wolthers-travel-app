import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    let user: any = null
    
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    // Try Authorization header first, then cookie
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
    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()

    // Check if user has permission to edit this trip
    const { data: existingTrip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        creator_id, 
        status,
        is_draft,
        trip_access_permissions (user_id, permission_type, expires_at)
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !existingTrip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const hasPermission = 
      existingTrip.creator_id === user.id ||
      user.is_global_admin ||
      existingTrip.trip_access_permissions?.some((perm: any) => 
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

    // Can only finalize draft trips with planning status
    if (!existingTrip.is_draft || existingTrip.status !== 'planning') {
      return NextResponse.json(
        { error: 'Only draft trips with planning status can be finalized' },
        { status: 400 }
      )
    }

    // Update trip to finalized status
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        status: 'confirmed',
        is_draft: false,
        completion_step: 5,
        creation_status: 'published',
        last_edited_at: now,
        last_edited_by: user.id,
        progress_percentage: 100
      })
      .eq('id', tripId)

    if (updateError) {
      console.error('Failed to finalize trip:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to finalize trip', 
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    // Remove the draft entry since the trip is now finalized
    const { error: draftDeleteError } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('trip_id', tripId)

    if (draftDeleteError) {
      console.warn('Failed to clean up draft entry:', draftDeleteError)
      // Don't fail the request for this cleanup error
    }

    return NextResponse.json({
      success: true,
      message: 'Trip finalized successfully',
      tripId: tripId
    })

  } catch (error) {
    console.error('Finalize trip error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}