import { NextRequest, NextResponse } from 'next/server'
import { sendHostInvitationEmail, sendHostInvitationEmails, type HostInvitationEmailData } from '@/lib/resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Support both single and bulk host invitations
    if (body.hosts && Array.isArray(body.hosts)) {
      return handleBulkInvitations(body)
    } else {
      return handleSingleInvitation(body)
    }
  } catch (error) {
    console.error('Error processing host invitation request:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request format' 
    }, { status: 400 })
  }
}

async function handleSingleInvitation(data: any) {
  const {
    hostEmail,
    hostName,
    companyName,
    tripTitle,
    tripAccessCode,
    tripStartDate,
    tripEndDate,
    inviterName,
    inviterEmail,
    wolthersTeam,
    whatsApp
  } = data

  // Validate required fields
  if (!hostEmail || !hostName || !companyName || !tripTitle || !tripAccessCode || !tripStartDate || !tripEndDate || !inviterName || !inviterEmail) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing required fields for host invitation' 
    }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(hostEmail)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid host email format' 
    }, { status: 400 })
  }

  // Generate confirmation and platform URLs
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trips.wolthers.com'
  const confirmationUrl = `${baseUrl}/api/visits/confirm?tripCode=${tripAccessCode}&hostEmail=${encodeURIComponent(hostEmail)}&token=${generateConfirmationToken()}`
  const platformLoginUrl = `${baseUrl}/host/login`

  const emailData: HostInvitationEmailData = {
    hostName,
    hostEmail,
    companyName,
    tripTitle,
    tripAccessCode,
    tripStartDate,
    tripEndDate,
    inviterName,
    inviterEmail,
    wolthersTeam: wolthersTeam || [],
    confirmationUrl,
    platformLoginUrl,
    whatsApp
  }

  const result = await sendHostInvitationEmail(hostEmail, emailData)

  if (result.success) {
    console.log(`✅ Host invitation email sent successfully to ${hostName} at ${companyName}`)
    return NextResponse.json({ 
      success: true,
      message: 'Host invitation email sent successfully'
    })
  } else {
    console.error(`❌ Failed to send host invitation email to ${hostEmail}:`, result.error)
    return NextResponse.json({ 
      success: false, 
      error: result.error || 'Failed to send host invitation email'
    }, { status: 500 })
  }
}

async function handleBulkInvitations(data: any) {
  const { hosts, tripTitle, tripAccessCode, tripStartDate, tripEndDate, inviterName, inviterEmail, wolthersTeam } = data

  if (!hosts || !Array.isArray(hosts) || hosts.length === 0) {
    return NextResponse.json({ 
      success: false, 
      error: 'No hosts provided for bulk invitation' 
    }, { status: 400 })
  }

  // Generate base URLs
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://trips.wolthers.com'
  const platformLoginUrl = `${baseUrl}/host/login`

  // Prepare host invitation data
  const hostInvitations = hosts.map((host: any) => {
    const confirmationUrl = `${baseUrl}/api/visits/confirm?tripCode=${tripAccessCode}&hostEmail=${encodeURIComponent(host.email)}&token=${generateConfirmationToken()}`
    
    const emailData: HostInvitationEmailData = {
      hostName: host.name,
      hostEmail: host.email,
      companyName: host.companyName,
      tripTitle,
      tripAccessCode,
      tripStartDate,
      tripEndDate,
      inviterName,
      inviterEmail,
      wolthersTeam: wolthersTeam || [],
      confirmationUrl,
      platformLoginUrl,
      whatsApp: host.whatsApp,
      personalMessage: host.personalMessage,
      visitingCompanyName: host.visitingCompanyName,
      visitDate: host.visitDate,
      visitTime: host.visitTime
    }

    return {
      email: host.email,
      data: emailData
    }
  })

  const result = await sendHostInvitationEmails(hostInvitations)

  if (result.success) {
    console.log(`✅ All ${hosts.length} host invitation emails sent successfully`)
    return NextResponse.json({ 
      success: true,
      message: `${hosts.length} host invitation emails sent successfully`
    })
  } else {
    console.error(`❌ Some host invitation emails failed:`, result.errors)
    return NextResponse.json({ 
      success: false, 
      message: `${hosts.length - result.errors.length}/${hosts.length} emails sent successfully`,
      errors: result.errors
    }, { status: 207 }) // 207 Multi-Status for partial success
  }
}

function generateConfirmationToken(): string {
  // Generate a secure token for visit confirmation
  return Buffer.from(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).toString('base64url')
}