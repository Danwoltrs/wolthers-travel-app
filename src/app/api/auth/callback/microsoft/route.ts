import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, trackServerLoginEvent } from '@/lib/supabase-server'
import { sign } from 'jsonwebtoken'

// Helper function to create a session token
async function createSessionToken(userId: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
  
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  }
  
  return sign(payload, secret)
}

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Microsoft callback API (GET): Request received')
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    console.log('📋 Request data:', { hasCode: !!code, error, errorDescription })
    
    if (error) {
      console.error('❌ OAuth error:', error, errorDescription)
      return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent(errorDescription || error)}`)
    }
    
    if (!code) {
      console.error('❌ No authorization code received')
      return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent('No authorization code received')}`)
    }
    
    const redirectUri = `${request.nextUrl.origin}/api/auth/callback/microsoft`

    const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
    const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID

    console.log('🔧 Environment check:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasTenantId: !!tenantId,
      clientId: clientId?.substring(0, 8) + '...'
    })

    if (!clientId || !clientSecret || !tenantId) {
      console.error('❌ Missing Azure AD configuration')
      return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent('Authentication configuration error')}`)
    }

    console.log('🔄 Starting token exchange with Microsoft...')
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

    console.log('🎫 Token response status:', tokenResponse.status, tokenResponse.statusText)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('❌ Token exchange failed:', errorData)
      return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent(errorData.error_description || 'Token exchange failed')}`)
    }

    const tokens = await tokenResponse.json()
    console.log('✅ Token exchange successful, got access token')

    console.log('👤 Getting user information from Microsoft Graph...')
    // Get user information from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('❌ Failed to get user info from Microsoft Graph')
      return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent('Failed to get user info')}`)
    }

    const msUser = await userResponse.json()
    console.log('✅ Got user info:', { 
      email: msUser.mail || msUser.userPrincipalName,
      name: msUser.displayName,
      id: msUser.id 
    })
    
    // Get timezone from request or default
    const timezone = request.headers.get('x-timezone') || 'UTC'
    const userAgent = request.headers.get('user-agent') || undefined

    console.log('💾 Creating/updating user in database...')
    // Create or update user in Supabase
    const supabase = createServerSupabaseClient()

    console.log('🔍 Checking for existing user...')
    // Check if user exists by email or Microsoft OAuth ID
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${msUser.mail || msUser.userPrincipalName},microsoft_oauth_id.eq.${msUser.id}`)

    if (queryError) {
      console.error('❌ Database query error:', queryError)
    }

    const existingUser = existingUsers?.[0]
    console.log('👤 User check result:', { 
      foundExisting: !!existingUser,
      userEmail: msUser.mail || msUser.userPrincipalName 
    })

    const userEmail = msUser.mail || msUser.userPrincipalName
    const emailDomain = userEmail?.split('@')[1]?.toLowerCase()
    const isWolthersUser = emailDomain === 'wolthers.com'
    
    // Check if this domain belongs to a company (for company admin detection)
    let isCompanyAdmin = false
    let companyId = null
    
    if (!isWolthersUser && emailDomain) {
      console.log('🔍 Checking if user is a company admin for domain:', emailDomain)
      // Check if there are existing users with this domain who might be company participants
      const { data: existingDomainUsers } = await supabase
        .from('users')
        .select('id, company_id')
        .like('email', `%@${emailDomain}`)
        .not('company_id', 'is', null)
        .limit(1)
      
      if (existingDomainUsers && existingDomainUsers.length > 0) {
        companyId = existingDomainUsers[0].company_id
        isCompanyAdmin = true // First user from domain becomes admin
        console.log('✅ User detected as company admin for existing company:', companyId)
      }
    }
    
    console.log('🏢 User domain analysis:', { 
      email: userEmail, 
      domain: emailDomain,
      isWolthersUser,
      isCompanyAdmin,
      companyId
    })

    // Ensure full_name is never null (database constraint)
    const fullName = msUser.displayName || 
                     userEmail?.split('@')[0] || 
                     'User'

    console.log('👤 User data preparation:', {
      email: userEmail,
      full_name: fullName,
      isWolthersUser
    })

    const userData = {
      email: userEmail,
      full_name: fullName,
      microsoft_oauth_id: msUser.id,
      company_id: companyId, // Link to company if detected
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
        return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent('Failed to update user')}`)
      }

      user = data
    } else {
      console.log('🆕 Creating new user...')
      
      // Determine user type and permissions based on role
      let userType = 'client' // Default
      let canViewAllTrips = false
      let canViewCompanyTrips = false
      
      if (isWolthersUser) {
        userType = 'wolthers_staff'
        canViewAllTrips = true
        canViewCompanyTrips = true
      } else if (isCompanyAdmin) {
        userType = 'admin' // Company admin
        canViewAllTrips = false
        canViewCompanyTrips = true // Can view trips from their company domain
      }
      
      const newUserData = {
        ...userData,
        user_type: userType,
        is_global_admin: false,
        can_view_all_trips: canViewAllTrips,
        can_view_company_trips: canViewCompanyTrips,
        created_at: new Date().toISOString(),
      }
      
      console.log('👤 New user data:', { 
        email: newUserData.email,
        user_type: newUserData.user_type,
        can_view_all_trips: newUserData.can_view_all_trips 
      })
      
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert(newUserData)
        .select()
        .single()

      if (error) {
        console.error('❌ User creation error:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent(`Failed to create user: ${error.message}`)}`)
      }

      console.log('✅ User created successfully:', data.id)
      user = data
    }

    // Track the login event
    await trackServerLoginEvent(user.id, 'microsoft', user.email, userAgent)

    // Create a session token for the client
    const sessionToken = await createSessionToken(user.id)

    // Redirect to dashboard with auth token in cookie
    const response = NextResponse.redirect(`${request.nextUrl.origin}/dashboard`)

    // Set the session as an HTTP-only cookie
    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response

  } catch (error) {
    console.error('Microsoft auth callback error:', error)
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent('Authentication failed')}`)
  }
}