import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Session API: Starting session check...')
    
    // Get the auth token from httpOnly cookie
    const authToken = request.cookies.get('auth-token')?.value
    console.log('🔐 Session API: Auth token exists:', !!authToken)
    
    if (!authToken) {
      console.log('🔐 Session API: No auth token found, returning unauthenticated')
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    // Verify the JWT token
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    let decoded: any
    
    try {
      decoded = verify(authToken, secret)
    } catch (error) {
      // Token is invalid, clear the cookie
      const response = NextResponse.json({ authenticated: false }, { status: 200 })
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Delete the cookie
      })
      return response
    }

    // Get user from database with company information
    console.log('🔐 Session API: Creating Supabase client...')
    const supabase = createServerSupabaseClient()
    console.log('🔐 Session API: Querying user data for ID:', decoded.userId)
    
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        companies!users_company_id_fkey (
          id,
          name,
          fantasy_name
        )
      `)
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      console.error('🔐 Session API: User query failed:', error)
      console.log('🔐 Session API: User data:', user)
      
      // User not found, clear the cookie
      const response = NextResponse.json({ authenticated: false }, { status: 200 })
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Delete the cookie
      })
      return response
    }

    console.log('🔐 Session API: User found:', { email: user.email, id: user.id })

    // Return user data and session info
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        is_global_admin: user.is_global_admin,
        can_view_all_trips: user.can_view_all_trips,
        can_view_company_trips: user.can_view_company_trips,
        company_id: user.company_id,
        microsoft_oauth_id: user.microsoft_oauth_id,
        phone: user.phone,
        whatsapp: user.whatsapp,
        timezone: user.timezone,
        last_login_at: user.last_login_at,
        last_login_timezone: user.last_login_timezone,
        last_login_provider: user.last_login_provider,
        company_name: user.companies?.name || 'No Company',
        company_fantasy_name: user.companies?.fantasy_name,
        notification_preferences: user.notification_preferences,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile_picture_url: user.profile_picture_url,
      },
      sessionToken: authToken, // Provide token for client-side use
    })

  } catch (error) {
    console.error('🔐 Session API: Unexpected error:', error)
    console.error('🔐 Session API: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Ensure we always return valid JSON
    const response = NextResponse.json({ 
      authenticated: false, 
      error: 'Internal server error during session check' 
    }, { status: 500 })
    
    // Clear any invalid cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })
    
    return response
  }
}