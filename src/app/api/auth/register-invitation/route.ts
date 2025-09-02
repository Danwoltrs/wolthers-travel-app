import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const jwtSecret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { token, password, whatsapp } = await request.json()
    
    if (!token || !password) {
      return NextResponse.json({ 
        error: 'Invitation token and password are required' 
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters' 
      }, { status: 400 })
    }

    console.log(`[REGISTER INVITATION] Processing registration for token: ${token.substring(0, 10)}...`)

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        invited_name,
        invited_whatsapp,
        company_id,
        role,
        status,
        expires_at,
        companies!inner(name, fantasy_name)
      `)
      .eq('invitation_token', token)
      .single()

    if (invitationError || !invitation) {
      console.log(`[REGISTER INVITATION] Invalid token:`, invitationError)
      return NextResponse.json({ 
        error: 'Invalid invitation token' 
      }, { status: 404 })
    }

    // Validate invitation
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    
    if (now > expiresAt) {
      console.log(`[REGISTER INVITATION] Token expired: ${invitation.expires_at}`)
      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 410 })
    }

    if (invitation.status !== 'approved') {
      console.log(`[REGISTER INVITATION] Token not approved, status: ${invitation.status}`)
      return NextResponse.json({ 
        error: `Invitation is ${invitation.status}. Please contact your administrator.` 
      }, { status: 403 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', invitation.email)
      .single()

    if (existingUser) {
      console.log(`[REGISTER INVITATION] User already exists: ${invitation.email}`)
      return NextResponse.json({ 
        error: 'An account with this email already exists' 
      }, { status: 409 })
    }

    // Create user in Supabase Auth system
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true // Skip email confirmation since invitation is pre-approved
    })

    if (authError || !authData.user) {
      console.error(`[REGISTER INVITATION] Failed to create auth user:`, authError)
      return NextResponse.json({ 
        error: 'Failed to create account. Please try again.' 
      }, { status: 500 })
    }

    console.log(`[REGISTER INVITATION] Auth user created successfully: ${authData.user.id}`)

    // Sign the user in to create an active session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password: password
    })

    if (signInError) {
      console.warn(`[REGISTER INVITATION] Sign-in after creation failed:`, signInError)
      // Don't fail the registration, just log the warning
    } else {
      console.log(`[REGISTER INVITATION] User signed in successfully after creation`)
    }

    // Create corresponding profile in public.users table
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id, // Use same ID as auth user
        email: invitation.email,
        full_name: invitation.invited_name,
        whatsapp: whatsapp || invitation.invited_whatsapp || null,
        company_id: invitation.company_id,
        role: invitation.role,
        user_type: 'client',
        is_global_admin: false,
        can_view_all_trips: false,
        can_view_company_trips: true, // External users can view their company's trips
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (createError) {
      console.error(`[REGISTER INVITATION] Failed to create user profile:`, createError)
      // Clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ 
        error: 'Failed to create account. Please try again.' 
      }, { status: 500 })
    }

    console.log(`[REGISTER INVITATION] User profile created successfully: ${newUser.id}`)

    // Update invitation timestamp (status stays 'approved' as user has registered)
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error(`[REGISTER INVITATION] Failed to update invitation timestamp:`, updateError)
    } else {
      console.log(`[REGISTER INVITATION] Invitation timestamp updated: ${invitation.id}`)
    }

    // Create JWT session token
    const sessionToken = jwt.sign(
      { 
        userId: newUser.id,
        email: newUser.email,
        companyId: newUser.company_id,
        role: newUser.role,
        userType: newUser.user_type
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Set HTTP-only cookie and prepare response
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        company_id: newUser.company_id,
        role: newUser.role,
        company_name: invitation.companies.fantasy_name || invitation.companies.name
      },
      sessionToken,
      // Include session info if sign-in was successful
      session: signInData?.session || null
    })

    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    console.log(`[REGISTER INVITATION] Session created for user: ${newUser.email}`)

    return response

  } catch (error) {
    console.error('[REGISTER INVITATION] Error creating account:', error)
    console.error('[REGISTER INVITATION] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: 'Internal server error while creating account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}