import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Missing invitation token' 
      }, { status: 400 })
    }

    console.log(`[INVITATION ACCEPT] Validating token: ${token.substring(0, 10)}...`)

    // Look up the invitation by token
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        invited_name,
        invited_whatsapp,
        role,
        status,
        expires_at,
        created_at,
        companies!inner(name, fantasy_name)
      `)
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      console.log(`[INVITATION ACCEPT] Token not found or invalid:`, error)
      return NextResponse.json({ 
        error: 'Invalid or expired invitation token' 
      }, { status: 404 })
    }

    // Check if invitation has expired
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)
    
    if (now > expiresAt) {
      console.log(`[INVITATION ACCEPT] Token expired: ${invitation.expires_at}`)
      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 410 })
    }

    // Check if invitation is approved
    if (invitation.status !== 'approved') {
      console.log(`[INVITATION ACCEPT] Token not approved, status: ${invitation.status}`)
      return NextResponse.json({ 
        error: `Invitation is ${invitation.status}. Please contact your administrator.` 
      }, { status: 403 })
    }

    // Check if user already exists with this email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', invitation.email)
      .single()

    if (existingUser) {
      console.log(`[INVITATION ACCEPT] User already exists: ${invitation.email}`)
      return NextResponse.json({ 
        error: 'An account with this email already exists. Please sign in instead.' 
      }, { status: 409 })
    }

    console.log(`[INVITATION ACCEPT] Token validated successfully for ${invitation.email}`)

    // Return invitation details for account creation
    return NextResponse.json({
      message: 'Invitation validated successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        invited_name: invitation.invited_name,
        invited_whatsapp: invitation.invited_whatsapp,
        role: invitation.role,
        company_name: invitation.companies.fantasy_name || invitation.companies.name,
        expires_at: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('[INVITATION ACCEPT] Error validating invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error while validating invitation' 
    }, { status: 500 })
  }
}