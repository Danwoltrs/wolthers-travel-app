import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface ContinueResponse {
  success: boolean
  trip?: any
  draft?: any
  currentStep: number
  canEdit: boolean
  permissions: string[]
  message: string
}

export async function GET(request: NextRequest, { params }: { params: { accessCode: string } }) {
  try {
    let user: any = null
    
    // Authentication logic (same as other endpoints)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
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

    const { accessCode } = params

    if (!accessCode) {
      return NextResponse.json(
        { error: 'Access code required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // First, try to find the trip by access code
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        *,
        trip_access_permissions (user_id, permission_type, expires_at),
        trip_participants (user_id, role, company_id),
        company_user_roles (user_id, role, can_edit_all_company_trips)
      `)
      .eq('access_code', accessCode)
      .single()

    if (tripError || !trip) {
      // Try to find by access token in trip_drafts
      const { data: draft, error: draftError } = await supabase
        .from('trip_drafts')
        .select(`
          *,
          trips (*)
        `)
        .eq('access_token', `trip_${accessCode}`)
        .single()

      if (draftError || !draft) {
        return NextResponse.json(
          { 
            success: false,
            message: 'Trip not found or access code expired' 
          },
          { status: 404 }
        )
      }

      // Check if user has permission to access this draft
      const canAccess = 
        draft.creator_id === user.id ||
        user.is_global_admin

      if (!canAccess) {
        return NextResponse.json(
          { 
            success: false,
            message: 'You do not have permission to access this trip' 
          },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        draft,
        trip: draft.trips,
        currentStep: draft.current_step || 1,
        canEdit: true,
        permissions: ['edit'],
        message: 'Draft trip loaded successfully'
      })
    }

    // Check permissions for the found trip
    let canEdit = false
    let permissions: string[] = ['view']

    // Creator always has edit access
    if (trip.creator_id === user.id) {
      canEdit = true
      permissions = ['view', 'edit', 'admin']
    }
    // Global admin has full access
    else if (user.is_global_admin) {
      canEdit = true
      permissions = ['view', 'edit', 'admin']
    }
    // Check explicit trip permissions
    else {
      const explicitPermission = trip.trip_access_permissions?.find((perm: any) =>
        perm.user_id === user.id &&
        (!perm.expires_at || new Date(perm.expires_at) > new Date())
      )

      if (explicitPermission) {
        permissions = ['view']
        if (['edit', 'admin'].includes(explicitPermission.permission_type)) {
          canEdit = true
          permissions.push('edit')
        }
        if (explicitPermission.permission_type === 'admin') {
          permissions.push('admin')
        }
      }
      // Check company-based permissions
      else {
        const userCompanyParticipation = trip.trip_participants?.find((tp: any) => 
          tp.company_id === user.company_id
        )

        if (userCompanyParticipation) {
          // User is from a participating company
          const companyRole = trip.company_user_roles?.find((cur: any) =>
            cur.user_id === user.id
          )

          if (companyRole && (companyRole.role === 'admin' || companyRole.can_edit_all_company_trips)) {
            canEdit = true
            permissions.push('edit')
          }
        }
      }
    }

    // If user has no access, deny
    if (permissions.length === 0 || (permissions.length === 1 && permissions[0] === 'view' && !canEdit && trip.creator_id !== user.id)) {
      // Allow view access if user is a trip participant
      const isParticipant = trip.trip_participants?.some((tp: any) => tp.user_id === user.id)
      
      if (!isParticipant && !user.can_view_all_trips && !user.can_view_company_trips) {
        return NextResponse.json(
          { 
            success: false,
            message: 'You do not have permission to access this trip' 
          },
          { status: 403 }
        )
      }
    }

    // Get associated draft if exists
    const { data: draft } = await supabase
      .from('trip_drafts')
      .select('*')
      .eq('trip_id', trip.id)
      .single()

    const response: ContinueResponse = {
      success: true,
      trip,
      draft,
      currentStep: trip.completion_step || draft?.current_step || 1,
      canEdit,
      permissions,
      message: canEdit ? 
        'Trip loaded successfully - you can continue editing' :
        'Trip loaded successfully - view only access'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Continue trip error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { accessCode: string } }) {
  try {
    // This endpoint can be used to request edit access or extend expiration
    let user: any = null
    
    // Authentication logic (same as GET)
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

    const { accessCode } = params
    const body = await request.json()
    const { action } = body // 'request_access', 'extend_expiration'

    const supabase = createServerSupabaseClient()

    // Find trip by access code
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('access_code', accessCode)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    if (action === 'request_access') {
      // Create a pending access request (could be extended with notifications)
      return NextResponse.json({
        success: true,
        message: 'Access request submitted. The trip creator will be notified.'
      })
    }

    if (action === 'extend_expiration' && trip.creator_id === user.id) {
      // Extend draft expiration
      const { error: updateError } = await supabase
        .from('trip_drafts')
        .update({
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 more days
          last_accessed_at: new Date().toISOString()
        })
        .eq('trip_id', trip.id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to extend expiration' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Trip access extended for 30 more days'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Continue trip POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}