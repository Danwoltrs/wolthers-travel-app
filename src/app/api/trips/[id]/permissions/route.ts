import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { tripPermissionService, TripPermission } from '@/lib/trip-permissions'

// GET - List all users with access to a trip
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const tripId = params.id
    
    const result = await tripPermissionService.getTripAccessList(tripId, user.id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      accessList: result.data
    })

  } catch (error) {
    console.error('Get trip permissions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Grant access to a user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    let user: any = null
    
    // Authentication logic (same as GET)
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
    const body = await request.json()
    const { userId, permission, expiresAt } = body

    if (!userId || !permission) {
      return NextResponse.json(
        { error: 'User ID and permission type are required' },
        { status: 400 }
      )
    }

    if (!['view', 'edit', 'admin'].includes(permission)) {
      return NextResponse.json(
        { error: 'Invalid permission type' },
        { status: 400 }
      )
    }

    const result = await tripPermissionService.grantAccess(
      tripId,
      userId,
      user.id,
      permission as TripPermission,
      expiresAt ? new Date(expiresAt) : undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Access granted successfully'
    })

  } catch (error) {
    console.error('Grant trip permission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke access from a user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    let user: any = null
    
    // Authentication logic (same as GET)
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
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await tripPermissionService.revokeAccess(
      tripId,
      targetUserId,
      user.id
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('permission') ? 403 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Access revoked successfully'
    })

  } catch (error) {
    console.error('Revoke trip permission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}