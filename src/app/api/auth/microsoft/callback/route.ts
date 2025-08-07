import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, trackServerLoginEvent } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json()

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: 'Code and redirect URI are required' },
        { status: 400 }
      )
    }

    const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
    const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID

    if (!clientId || !clientSecret || !tenantId) {
      console.error('Missing Azure AD configuration')
      return NextResponse.json(
        { error: 'Authentication configuration error' },
        { status: 500 }
      )
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          scope: 'openid profile email User.Read',
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          client_secret: clientSecret,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return NextResponse.json(
        { error: errorData.error_description || 'Token exchange failed' },
        { status: 401 }
      )
    }

    const tokens = await tokenResponse.json()

    // Get user information from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('Failed to get user info from Microsoft Graph')
      return NextResponse.json(
        { error: 'Failed to get user info' },
        { status: 401 }
      )
    }

    const msUser = await userResponse.json()
    
    // Get timezone from request or default
    const timezone = request.headers.get('x-timezone') || 'UTC'
    const userAgent = request.headers.get('user-agent') || undefined

    // Create or update user in Supabase
    const supabase = createServerSupabaseClient()

    // Check if user exists by email or Microsoft OAuth ID
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${msUser.mail || msUser.userPrincipalName},microsoft_oauth_id.eq.${msUser.id}`)

    const existingUser = existingUsers?.[0]

    const userData = {
      email: msUser.mail || msUser.userPrincipalName,
      full_name: msUser.displayName,
      microsoft_oauth_id: msUser.id,
      last_login_at: new Date().toISOString(),
      last_login_timezone: timezone,
      last_login_provider: 'microsoft',
      updated_at: new Date().toISOString(),
    }

    let user

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', existingUser.id)
        .select()
        .single()

      if (error) {
        console.error('User update error:', error)
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        )
      }

      user = data
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          user_type: 'client_user',
          is_global_admin: false,
          can_view_all_trips: false,
          can_view_company_trips: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('User creation error:', error)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      user = data
    }

    // Track the login event
    await trackServerLoginEvent(user.id, 'microsoft', user.email, userAgent)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        microsoft_oauth_id: user.microsoft_oauth_id,
      },
    })

  } catch (error) {
    console.error('Microsoft auth callback error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}