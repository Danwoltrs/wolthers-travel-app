import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { EmailService } from '@/lib/email-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper function to get authenticated user
async function getAuthenticatedUser(request: NextRequest) {
  const authToken = request.cookies.get('auth-token')?.value
  
  if (!authToken) {
    console.log('🔑 User Invitations API: No auth-token cookie found')
    return null
  }

  // Verify the JWT token (same as working APIs)
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
  
  try {
    const decoded = verify(authToken, secret) as any
    console.log('🔑 User Invitations API: JWT Token decoded successfully:', { userId: decoded.userId })
    
    // Get user from database using service role client (bypasses RLS)
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: userData, error: userError } = await serviceSupabase
      .from('users')
      .select('id, email, company_id, role, user_type')
      .eq('id', decoded.userId)
      .single()

    if (userError) {
      console.log('🔑 User Invitations API: Database query failed:', userError)
      return null
    }

    console.log('🔑 User Invitations API: User authenticated:', { 
      userId: userData.id, 
      email: userData.email,
      companyId: userData.company_id,
      role: userData.role
    })
    
    return userData
  } catch (error) {
    console.log('🔑 User Invitations API: JWT verification failed:', error)
    return null
  }
}

// Send user invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const currentUser = await getAuthenticatedUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, email, whatsapp, companyId, role, message } = await request.json()

    // Validate required fields
    if (!name?.trim() || !email || !companyId || !role) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, email, companyId, role' 
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['staff', 'driver', 'manager', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be one of: staff, driver, manager, admin' 
      }, { status: 400 })
    }

    // Check if user is authorized to send invitations for this company
    const isWolthersStaff = currentUser.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    const isCompanyAdmin = currentUser.company_id === companyId && ['admin', 'manager'].includes(currentUser.role)

    if (!isWolthersStaff && !isCompanyAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized to send invitations for this company' 
      }, { status: 403 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 })
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('user_invitations')
      .select('id, status')
      .eq('email', email)
      .eq('company_id', companyId)
      .single()

    if (existingInvitation) {
      return NextResponse.json({ 
        error: `Invitation already exists with status: ${existingInvitation.status}` 
      }, { status: 409 })
    }

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, fantasy_name')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Determine if approval is needed
    const needsApproval = !isWolthersStaff && !isCompanyAdmin
    const status = needsApproval ? 'pending' : 'approved'

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .insert([{
        email,
        invited_name: name.trim(),
        invited_whatsapp: whatsapp?.trim() || null,
        company_id: companyId,
        invited_by: currentUser.id,
        role,
        status,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }])
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return NextResponse.json({ 
        error: 'Failed to create invitation', 
        details: invitationError.message 
      }, { status: 500 })
    }

    // Send invitation email (only for approved invitations)
    if (status === 'approved') {
      const { data: invitedByUser } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', currentUser.id)
        .single()

      const emailResult = await EmailService.sendInvitationEmail({
        email,
        name: name.trim(),
        whatsapp: whatsapp?.trim() || undefined,
        companyName: company.fantasy_name || company.name,
        role,
        invitedBy: invitedByUser?.full_name || currentUser.email || 'Administrator',
        invitationToken: invitation.invitation_token,
        message: message || undefined
      })

      if (!emailResult.success) {
        console.warn(`[INVITATION] Failed to send email: ${emailResult.error}`)
      } else {
        console.log(`[INVITATION] Email sent successfully to ${email}`)
      }
    }

    console.log(`[INVITATION] Created invitation for ${name} (${email}) to join ${company.name} as ${role}`)
    console.log(`[INVITATION] Status: ${status}, Token: ${invitation.invitation_token}${whatsapp ? `, WhatsApp: ${whatsapp}` : ''}`)

    return NextResponse.json({
      message: needsApproval 
        ? 'Invitation created and pending approval'
        : 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        companyName: company.fantasy_name || company.name
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error in user invitation API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get invitations (for admin/manager to approve)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const currentUser = await getAuthenticatedUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const companyId = url.searchParams.get('companyId')
    const status = url.searchParams.get('status')

    let query = supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        invited_name,
        invited_whatsapp,
        role,
        status,
        created_at,
        expires_at,
        companies!inner(name, fantasy_name),
        invited_by_user:users!invited_by(full_name, email)
      `)

    // Filter by company if specified
    if (companyId) {
      query = query.eq('company_id', companyId)
    } else {
      // If no company specified, show invitations for user's company
      const isWolthersStaff = currentUser.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
      if (!isWolthersStaff) {
        query = query.eq('company_id', currentUser.company_id)
      }
    }

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status)
    }

    const { data: invitations, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch invitations' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      invitations: invitations || [],
      count: invitations?.length || 0 
    })

  } catch (error) {
    console.error('Error in get invitations API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}