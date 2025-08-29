import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { EmailService } from '@/lib/email-service'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const cookieStore = await cookies()
  
  const sessionCookie = cookieStore.get('sb-access-token')
  if (!sessionCookie) {
    return null
  }

  const { data: { user } } = await supabase.auth.getUser(sessionCookie.value)
  if (!user) return null

  const { data: userDetails } = await supabase
    .from('users')
    .select('id, email, company_id, role, user_type')
    .eq('id', user.id)
    .single()

  return userDetails
}

// Approve or reject invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const currentUser = await getAuthenticatedUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const invitationId = resolvedParams.id
    const { action } = await request.json() // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "approve" or "reject"' 
      }, { status: 400 })
    }

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        company_id,
        role,
        status,
        companies!inner(name, fantasy_name)
      `)
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check authorization
    const isWolthersStaff = currentUser.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    const isCompanyAdmin = currentUser.company_id === invitation.company_id && ['admin', 'manager'].includes(currentUser.role)

    if (!isWolthersStaff && !isCompanyAdmin) {
      return NextResponse.json({ 
        error: 'Unauthorized to manage this invitation' 
      }, { status: 403 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        error: `Invitation already ${invitation.status}` 
      }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update invitation status
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({ status: newStatus })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update invitation' 
      }, { status: 500 })
    }

    console.log(`[INVITATION] ${action.toUpperCase()} invitation ${invitationId} for ${invitation.email}`)

    // Send email notification about approval/rejection
    const { data: currentUserDetails } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', currentUser.id)
      .single()

    const emailResult = await EmailService.sendApprovalEmail({
      email: invitation.email,
      companyName: invitation.companies.fantasy_name || invitation.companies.name,
      role: invitation.role,
      status: newStatus as 'approved' | 'rejected',
      adminName: currentUserDetails?.full_name || currentUser.email || 'Administrator'
    })

    if (!emailResult.success) {
      console.warn(`[INVITATION] Failed to send ${action} email: ${emailResult.error}`)
    } else {
      console.log(`[INVITATION] ${action} email sent successfully to ${invitation.email}`)
    }

    return NextResponse.json({
      message: `Invitation ${action}ed successfully`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: newStatus,
        companyName: invitation.companies.fantasy_name || invitation.companies.name
      }
    })

  } catch (error) {
    console.error('Error in invitation management API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Delete invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const currentUser = await getAuthenticatedUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const invitationId = resolvedParams.id

    // Get the invitation to check permissions
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select('id, company_id, invited_by')
      .eq('id', invitationId)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Check authorization (can delete own invitations or if admin)
    const isWolthersStaff = currentUser.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    const isCompanyAdmin = currentUser.company_id === invitation.company_id && ['admin', 'manager'].includes(currentUser.role)
    const isInviteCreator = currentUser.id === invitation.invited_by

    if (!isWolthersStaff && !isCompanyAdmin && !isInviteCreator) {
      return NextResponse.json({ 
        error: 'Unauthorized to delete this invitation' 
      }, { status: 403 })
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('user_invitations')
      .delete()
      .eq('id', invitationId)

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete invitation' 
      }, { status: 500 })
    }

    console.log(`[INVITATION] Deleted invitation ${invitationId}`)

    return NextResponse.json({
      message: 'Invitation deleted successfully'
    })

  } catch (error) {
    console.error('Error in invitation deletion API:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}