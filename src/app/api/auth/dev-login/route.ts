import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createSessionToken } from '@/lib/jwt-utils'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Dev login only available in development' },
        { status: 403 }
      )
    }

    const { email, role } = await request.json()
    
    console.log('🔧 DEV LOGIN API:', { email, role })

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    try {
      // Get user from database using server client
      const supabase = createServerSupabaseClient()
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (userError || !user) {
        console.log('🔧 DEV LOGIN: User not found:', email)
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 })
      }

      console.log('🔧 DEV LOGIN: User found:', { 
        email: user.email, 
        userId: user.id, 
        userType: user.user_type 
      })

      // Create a JWT session token for consistent authentication
      const sessionToken = createSessionToken(user.id)

      // Create response with session token
      const response = NextResponse.json({
        success: true,
        message: 'Dev login successful',
        user: user,
        sessionToken
      })

      // Set the session as an HTTP-only cookie (same as regular login)
      response.cookies.set('auth-token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      })

      console.log('🔧 DEV LOGIN: Session token created and cookie set for:', user.email)

      return response

    } catch (dbError) {
      console.error('🔧 DEV LOGIN: Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Database error during dev login'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('🔧 DEV LOGIN: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}