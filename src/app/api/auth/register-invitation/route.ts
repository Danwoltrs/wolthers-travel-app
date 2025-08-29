import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user account
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: invitation.email,
        full_name: invitation.invited_name,
        whatsapp: whatsapp || invitation.invited_whatsapp || null,
        company_id: invitation.company_id,
        role: invitation.role,
        user_type: 'external',
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (createError) {
      console.error(`[REGISTER INVITATION] Failed to create user:`, createError)
      return NextResponse.json({ 
        error: 'Failed to create account. Please try again.' 
      }, { status: 500 })
    }

    console.log(`[REGISTER INVITATION] User created successfully: ${newUser.id}`)

    // Mark invitation as used
    await supabase
      .from('user_invitations')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

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

    // Set HTTP-only cookie
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
      }
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
    return NextResponse.json({ 
      error: 'Internal server error while creating account' 
    }, { status: 500 })
  }
}