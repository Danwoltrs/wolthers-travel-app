import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, trackServerLoginEvent } from '@/lib/supabase-server'
import { createSessionToken } from '@/lib/jwt-utils'

// Handle OAuth redirect from Microsoft (GET)
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

    // Get profile picture from Microsoft Graph
    let profilePictureUrl = null
    try {
      const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })
      
      if (photoResponse.ok) {
        // Convert the image to a data URL for storage
        const photoBlob = await photoResponse.blob()
        const photoBuffer = await photoBlob.arrayBuffer()
        const base64String = Buffer.from(photoBuffer).toString('base64')
        profilePictureUrl = `data:${photoBlob.type};base64,${base64String}`
        console.log('✅ Got Microsoft profile picture')
      } else {
        console.log('ℹ️ No Microsoft profile picture available')
      }
    } catch (error) {
      console.log('ℹ️ Could not fetch Microsoft profile picture:', error instanceof Error ? error.message : 'Unknown error')
    }

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
      profile_picture_url: profilePictureUrl, // Include Microsoft profile picture
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
    const sessionToken = createSessionToken(user.id)

    // Redirect to auth callback page to complete the client-side authentication
    const response = NextResponse.redirect(`${request.nextUrl.origin}/auth/callback?success=true&provider=microsoft`)

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

// Handle client-side token exchange requests (POST)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Microsoft callback API (POST): Request received')
    const body = await request.json()
    const { code, redirectUri } = body
    
    console.log('📋 POST request data:', { hasCode: !!code, redirectUri })
    
    if (!code) {
      console.error('❌ No authorization code received in POST request')
      return NextResponse.json({ success: false, error: 'No authorization code received' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID
    const clientSecret = process.env.AZURE_AD_CLIENT_SECRET
    const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID

    console.log('🔧 Environment check (POST):', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasTenantId: !!tenantId,
      clientId: clientId?.substring(0, 8) + '...'
    })

    if (!clientId || !clientSecret || !tenantId) {
      console.error('❌ Missing Azure AD configuration')
      return NextResponse.json({ success: false, error: 'Authentication configuration error' }, { status: 500 })
    }

    // Use the provided redirect URI (should match what was used in the initial auth request)
    const tokenRedirectUri = redirectUri || `${request.nextUrl.origin}/auth/callback`

    console.log('🔄 Starting token exchange with Microsoft (POST)...')
    console.log('🔗 Using redirect URI for token exchange:', tokenRedirectUri)
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
          redirect_uri: tokenRedirectUri,
          grant_type: 'authorization_code',
          client_secret: clientSecret,
        }),
      }
    )

    console.log('🎫 Token response status (POST):', tokenResponse.status, tokenResponse.statusText)

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('❌ Token exchange failed (POST):', errorData)
      return NextResponse.json({ 
        success: false, 
        error: errorData.error_description || 'Token exchange failed' 
      }, { status: 400 })
    }

    const tokens = await tokenResponse.json()
    console.log('✅ Token exchange successful (POST), got access token')

    console.log('👤 Getting user information from Microsoft Graph (POST)...')
    // Get user information from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    // Get profile picture from Microsoft Graph
    let profilePictureUrl = null
    try {
      const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })
      
      if (photoResponse.ok) {
        // Convert the image to a data URL for storage
        const photoBlob = await photoResponse.blob()
        const photoBuffer = await photoBlob.arrayBuffer()
        const base64String = Buffer.from(photoBuffer).toString('base64')
        profilePictureUrl = `data:${photoBlob.type};base64,${base64String}`
        console.log('✅ Got Microsoft profile picture (POST)')
      } else {
        console.log('ℹ️ No Microsoft profile picture available (POST)')
      }
    } catch (error) {
      console.log('ℹ️ Could not fetch Microsoft profile picture (POST):', error instanceof Error ? error.message : 'Unknown error')
    }

    if (!userResponse.ok) {
      console.error('❌ Failed to get user info from Microsoft Graph (POST)')
      return NextResponse.json({ success: false, error: 'Failed to get user info' }, { status: 400 })
    }

    const msUser = await userResponse.json()
    console.log('✅ Got user info (POST):', { 
      email: msUser.mail || msUser.userPrincipalName,
      name: msUser.displayName,
      id: msUser.id 
    })
    
    // Get timezone from request headers or default
    const timezone = request.headers.get('x-timezone') || 'UTC'
    const userAgent = request.headers.get('user-agent') || undefined

    console.log('💾 Creating/updating user in database (POST)...')
    // Create or update user in Supabase
    const supabase = createServerSupabaseClient()

    console.log('🔍 Checking for existing user (POST)...')
    // Check if user exists by email or Microsoft OAuth ID
    const { data: existingUsers, error: queryError } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${msUser.mail || msUser.userPrincipalName},microsoft_oauth_id.eq.${msUser.id}`)

    if (queryError) {
      console.error('❌ Database query error (POST):', queryError)
    }

    const existingUser = existingUsers?.[0]
    console.log('👤 User check result (POST):', { 
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
      console.log('🔍 Checking if user is a company admin for domain (POST):', emailDomain)
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
        console.log('✅ User detected as company admin for existing company (POST):', companyId)
      }
    }
    
    console.log('🏢 User domain analysis (POST):', { 
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

    console.log('👤 User data preparation (POST):', {
      email: userEmail,
      full_name: fullName,
      isWolthersUser
    })

    const userData = {
      email: userEmail,
      full_name: fullName,
      microsoft_oauth_id: msUser.id,
      company_id: companyId, // Link to company if detected
      profile_picture_url: profilePictureUrl, // Include Microsoft profile picture
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
        console.error('User update error (POST):', error)
        return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
      }

      user = data
    } else {
      console.log('🆕 Creating new user (POST)...')
      
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
      
      console.log('👤 New user data (POST):', { 
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
        console.error('❌ User creation error (POST):', error)
        console.error('Error details (POST):', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        return NextResponse.json({ 
          success: false, 
          error: `Failed to create user: ${error.message}` 
        }, { status: 500 })
      }

      console.log('✅ User created successfully (POST):', data.id)
      user = data
    }

    // Track the login event
    await trackServerLoginEvent(user.id, 'microsoft', user.email, userAgent)

    // Create a session token for the client
    const sessionToken = createSessionToken(user.id)

    console.log('✅ Authentication successful (POST), returning user data and session')

    // Return JSON response with user data and session token
    return NextResponse.json({
      success: true,
      user,
      sessionToken
    })

  } catch (error) {
    console.error('Microsoft auth callback error (POST):', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 500 })
  }
}