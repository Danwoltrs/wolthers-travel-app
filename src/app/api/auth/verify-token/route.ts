import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifySessionToken, extractBearerToken } from '@/lib/jwt-utils'

/**
 * Verifies a JWT session token and returns user data
 * Used by AuthContext to validate tokens on page load
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = extractBearerToken(authHeader)
    
    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 })
    }

    // Verify the JWT token
    const decoded = verifySessionToken(token)
    if (!decoded) {
      return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 })
    }

    // Get user from database
    const supabase = createServerSupabaseClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ valid: false, error: 'User not found' }, { status: 404 })
    }

    // Return user data
    return NextResponse.json({
      valid: true,
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
        company_name: user.company_name,
        notification_preferences: user.notification_preferences,
        created_at: user.created_at,
        updated_at: user.updated_at,
        profile_picture_url: user.profile_picture_url,
      }
    })

  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}