import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  sendTripCreationEmails,
  sendTripCancellationEmails,
  sendStaffInvitationEmail,
  sendHostInvitationEmail,
  sendHostVisitConfirmationEmail,
  sendVisitDeclinedNotification,
  sendNewTimeProposedNotification,
  type TripCreationEmailData,
  type TripCancellationEmailData,
  type StaffInvitationEmailData,
  type HostInvitationEmailData,
  type HostVisitConfirmationData,
  type VisitDeclinedData,
  type NewTimeProposedData
} from '@/lib/resend'

interface EmailTestRequest {
  emailType: string
  testEmail: string
  tripData?: {
    title: string
    accessCode: string
  }
}

export async function POST(request: NextRequest) {
  try {
    let user: any = null

    // Authentication logic (same as other endpoints)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }

    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        console.warn('JWT decode failed, trying Supabase session auth:', jwtError.message)
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only allow admins or the specific Wolthers company users to test emails
    const isWolthersUser = user.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    if (!user.is_global_admin && !isWolthersUser) {
      return NextResponse.json(
        { error: 'Access denied - admin or Wolthers user required' },
        { status: 403 }
      )
    }

    const body: EmailTestRequest = await request.json()
    const { emailType, testEmail, tripData } = body

    if (!emailType || !testEmail) {
      return NextResponse.json(
        { error: 'emailType and testEmail are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const defaultTripData = {
      title: tripData?.title || 'Test Trip - Email System Check',
      accessCode: tripData?.accessCode || 'TEST_EMAIL_2024'
    }

    let result
    const delay = 500 // 500ms delay between test emails

    console.log(`🧪 [Email Test] Sending ${emailType} email to ${testEmail}`)

    try {
      switch (emailType) {
        case 'trip_creation':
          const tripCreationData: TripCreationEmailData = {
            tripTitle: defaultTripData.title,
            tripAccessCode: defaultTripData.accessCode,
            createdBy: user.full_name || user.email,
            recipients: [{ name: 'Test User', email: testEmail, role: 'participant' }]
          }
          result = await sendTripCreationEmails(tripCreationData)
          break

        case 'trip_cancellation':
          const tripCancellationData: TripCancellationEmailData = {
            tripTitle: defaultTripData.title,
            tripAccessCode: defaultTripData.accessCode,
            cancelledBy: user.full_name || user.email,
            cancellationReason: 'This is a test cancellation notification',
            stakeholders: [{ name: 'Test User', email: testEmail, role: 'participant' }]
          }
          result = await sendTripCancellationEmails(tripCancellationData)
          break

        case 'staff_invitation':
          const staffInvitationData: StaffInvitationEmailData = {
            tripTitle: defaultTripData.title,
            tripAccessCode: defaultTripData.accessCode,
            inviterName: user.full_name || user.email,
            newStaffName: 'Test Staff Member',
            role: 'Team Member'
          }
          result = await sendStaffInvitationEmail(testEmail, staffInvitationData)
          break

        case 'host_invitation':
          const hostInvitationData: HostInvitationEmailData = {
            tripTitle: defaultTripData.title,
            tripAccessCode: defaultTripData.accessCode,
            hostName: 'Test Host',
            companyName: 'Test Company',
            inviterName: user.full_name || user.email,
            inviterEmail: user.email,
            wolthersTeam: [{ name: user.full_name || 'Test User', role: 'Team Lead' }],
            visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Next week
            visitTime: '10:00 AM'
          }
          result = await sendHostInvitationEmail(testEmail, hostInvitationData)
          break

        case 'visit_confirmation':
          const visitConfirmationData: HostVisitConfirmationData = {
            tripTitle: defaultTripData.title,
            tripAccessCode: defaultTripData.accessCode,
            hostName: 'Test Host',
            companyName: 'Test Company',
            visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            visitTime: '10:00 AM',
            guests: [user.full_name || 'Test User', 'Test Colleague'],
            inviterName: user.full_name || user.email,
            inviterEmail: user.email,
            yesUrl: `${baseUrl}/api/visit-response?response=yes&token=test_token`,
            noUrl: `${baseUrl}/api/visit-response?response=no&token=test_token`
          }
          result = await sendHostVisitConfirmationEmail(testEmail, visitConfirmationData)
          break

        case 'visit_declined':
          const visitDeclinedData: VisitDeclinedData = {
            tripTitle: defaultTripData.title,
            tripAccessCode: defaultTripData.accessCode,
            creatorName: user.full_name || user.email,
            hostName: 'Test Host',
            companyName: 'Test Company',
            visitDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          }
          result = await sendVisitDeclinedNotification(testEmail, visitDeclinedData)
          break

        case 'new_time_proposed':
          const newTimeProposedData: NewTimeProposedData = {
            tripTitle: defaultTripData.title,
            tripAccessCode: defaultTripData.accessCode,
            creatorName: user.full_name || user.email,
            hostName: 'Test Host',
            newDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            newTime: '2:00 PM'
          }
          result = await sendNewTimeProposedNotification(testEmail, newTimeProposedData)
          break

        case 'all_templates':
          console.log(`🧪 [Email Test] Sending all email templates with delays...`)
          const allResults = []

          // Send each template with delays to prevent rate limiting
          const templates = [
            'trip_creation',
            'staff_invitation',
            'host_invitation',
            'visit_confirmation',
            'visit_declined',
            'new_time_proposed',
            'trip_cancellation' // Send cancellation last
          ]

          for (let i = 0; i < templates.length; i++) {
            const templateType = templates[i]
            console.log(`📧 [Email Test] Sending ${templateType} (${i + 1}/${templates.length})`)

            try {
              // Recursively call this endpoint for each template
              const templateResult = await fetch(`${baseUrl}/api/emails/test`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': request.headers.get('authorization') || '',
                  'Cookie': request.headers.get('cookie') || ''
                },
                body: JSON.stringify({
                  emailType: templateType,
                  testEmail,
                  tripData: defaultTripData
                })
              })

              const templateData = await templateResult.json()
              allResults.push({ template: templateType, result: templateData })

              // Add delay between templates
              if (i < templates.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay))
              }
            } catch (templateError) {
              console.error(`Failed to send ${templateType}:`, templateError)
              allResults.push({
                template: templateType,
                error: templateError instanceof Error ? templateError.message : 'Unknown error'
              })
            }
          }

          return NextResponse.json({
            success: true,
            message: `All email templates sent to ${testEmail}`,
            results: allResults,
            totalSent: allResults.filter(r => !r.error).length,
            totalFailed: allResults.filter(r => r.error).length
          })

        default:
          return NextResponse.json(
            { error: `Unknown email type: ${emailType}. Available types: trip_creation, trip_cancellation, staff_invitation, host_invitation, visit_confirmation, visit_declined, new_time_proposed, all_templates` },
            { status: 400 }
          )
      }

      console.log(`✅ [Email Test] Successfully sent ${emailType} email to ${testEmail}`)

      return NextResponse.json({
        success: true,
        message: `${emailType} email sent successfully to ${testEmail}`,
        result,
        sentAt: new Date().toISOString(),
        sentBy: user.email
      })

    } catch (emailError) {
      console.error(`❌ [Email Test] Failed to send ${emailType} email:`, emailError)

      return NextResponse.json({
        success: false,
        error: `Failed to send ${emailType} email`,
        details: emailError instanceof Error ? emailError.message : 'Unknown error',
        sentAt: new Date().toISOString(),
        sentBy: user.email
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Email test API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to list available email types
export async function GET(request: NextRequest) {
  return NextResponse.json({
    availableEmailTypes: [
      'trip_creation',
      'trip_cancellation',
      'staff_invitation',
      'host_invitation',
      'visit_confirmation',
      'visit_declined',
      'new_time_proposed',
      'all_templates'
    ],
    description: 'Use POST to send test emails',
    example: {
      method: 'POST',
      body: {
        emailType: 'trip_creation',
        testEmail: 'test@example.com',
        tripData: {
          title: 'My Test Trip',
          accessCode: 'TEST_2024'
        }
      }
    }
  })
}