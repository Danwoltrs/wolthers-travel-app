import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tripId } = params
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    // Get invitations for the trip
    let query = supabase
      .from('guest_invitations')
      .select(`
        id,
        guest_email,
        guest_name,
        guest_company,
        invitation_type,
        status,
        sent_at,
        accepted_at,
        declined_at,
        email_sent_count
      `)
      .eq('trip_id', tripId)
      .order('sent_at', { ascending: false })

    const { data: invitations, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    // If filtering by company, match users by email and company
    let filteredInvitations = invitations || []
    
    if (companyId && filteredInvitations.length > 0) {
      // Get all users from the specified company
      const { data: companyUsers, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .eq('company_id', companyId)

      if (!usersError && companyUsers) {
        const companyEmails = new Set(companyUsers.map(user => user.email.toLowerCase()))
        filteredInvitations = filteredInvitations.filter(invitation => 
          companyEmails.has(invitation.guest_email.toLowerCase())
        )

        // Transform invitations to include user IDs
        const emailToUserId = new Map(companyUsers.map(user => [user.email.toLowerCase(), user.id]))
        
        const transformedInvitations = filteredInvitations.map(invitation => ({
          id: invitation.id,
          user_id: emailToUserId.get(invitation.guest_email.toLowerCase()) || invitation.guest_email,
          status: invitation.status,
          sent_at: invitation.sent_at,
          responded_at: invitation.accepted_at || invitation.declined_at,
          email_sent_count: invitation.email_sent_count || 1
        }))

        return NextResponse.json({
          invitations: transformedInvitations,
          total: transformedInvitations.length
        })
      }
    }

    // Default response for all invitations or when no company filter
    const transformedInvitations = filteredInvitations.map(invitation => ({
      id: invitation.id,
      user_id: invitation.guest_email, // Use email as fallback ID
      status: invitation.status,
      sent_at: invitation.sent_at,
      responded_at: invitation.accepted_at || invitation.declined_at,
      email_sent_count: invitation.email_sent_count || 1
    }))

    return NextResponse.json({
      invitations: transformedInvitations,
      total: transformedInvitations.length
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}