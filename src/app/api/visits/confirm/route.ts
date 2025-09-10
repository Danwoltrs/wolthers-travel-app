import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { sendStaffInvitationEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripCode = searchParams.get('tripCode')
    const hostEmail = searchParams.get('hostEmail')
    const response = searchParams.get('response') // 'accept' or 'decline'
    const token = searchParams.get('token')

    // Validate required parameters
    if (!tripCode || !hostEmail || !response || !token) {
      return new NextResponse(createErrorPage('Invalid confirmation link'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (!['accept', 'decline'].includes(response)) {
      return new NextResponse(createErrorPage('Invalid response type'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // If declining, redirect to decline form instead of processing immediately
    if (response === 'decline') {
      const declineFormUrl = `/host/decline?tripCode=${tripCode}&hostEmail=${encodeURIComponent(hostEmail)}&token=${token}`
      return NextResponse.redirect(new URL(declineFormUrl, request.url))
    }

    const supabase = createServerSupabaseClient()

    // Find the trip by access code
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id,
        title,
        access_code,
        start_date,
        end_date,
        created_by,
        users!trips_created_by_fkey (
          full_name,
          email
        )
      `)
      .eq('access_code', tripCode)
      .single()

    if (tripError || !trip) {
      console.error('Trip not found:', tripError)
      return new NextResponse(createErrorPage('Trip not found'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Find the host contact by email
    const { data: hostContact, error: hostError } = await supabase
      .from('contacts')
      .select(`
        id,
        name,
        email,
        company_id,
        companies (
          name,
          fantasy_name
        )
      `)
      .eq('email', hostEmail)
      .single()

    if (hostError || !hostContact) {
      console.error('Host contact not found:', hostError)
      return new NextResponse(createErrorPage('Host contact not found'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Record the visit confirmation
    const { data: confirmation, error: confirmError } = await supabase
      .from('visit_confirmations')
      .upsert({
        trip_id: trip.id,
        host_contact_id: hostContact.id,
        company_id: hostContact.company_id,
        response_type: response,
        confirmed_at: new Date().toISOString(),
        confirmation_token: token
      }, {
        onConflict: 'trip_id,host_contact_id'
      })
      .select()
      .single()

    if (confirmError) {
      console.error('Failed to record confirmation:', confirmError)
      return new NextResponse(createErrorPage('Failed to record confirmation'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // If accepted, create host user account and send login credentials
    if (response === 'accept') {
      await createHostAccount(supabase, hostContact, trip, token)
    }

    // Send notification to trip creator
    await notifyTripCreator(trip, hostContact, response)

    // Return success page
    const successPage = createSuccessPage(
      response, 
      hostContact.name, 
      hostContact.companies?.fantasy_name || hostContact.companies?.name || 'Your Company',
      trip.title,
      new Date(trip.start_date).toLocaleDateString(),
      new Date(trip.end_date).toLocaleDateString()
    )

    return new NextResponse(successPage, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Error processing visit confirmation:', error)
    return new NextResponse(createErrorPage('Internal server error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

async function createHostAccount(supabase: any, hostContact: any, trip: any, token: string) {
  try {
    // Check if host user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', hostContact.email)
      .single()

    if (!existingUser) {
      // Create new host user account
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: hostContact.email,
          full_name: hostContact.name,
          company_id: hostContact.company_id,
          user_type: 'host',
          role: 'host',
          can_view_company_trips: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (userError) {
        console.error('Failed to create host user account:', userError)
        return
      }

      // Send login credentials email
      const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/host/login?email=${encodeURIComponent(hostContact.email)}&token=${token}`
      
      await sendStaffInvitationEmail(hostContact.email, {
        inviterName: trip.users.full_name,
        inviterEmail: trip.users.email,
        newStaffName: hostContact.name,
        role: 'Host Partner',
        tripTitle: trip.title
      })

      console.log(`✅ Created host account and sent credentials to ${hostContact.email}`)
    } else {
      console.log(`ℹ️ Host account already exists for ${hostContact.email}`)
    }
  } catch (error) {
    console.error('Error creating host account:', error)
  }
}

async function notifyTripCreator(trip: any, hostContact: any, response: string) {
  try {
    // Here you could send an email or in-app notification to the trip creator
    console.log(`📧 Visit ${response} notification: ${hostContact.name} ${response}ed visit for trip ${trip.title}`)
    
    // TODO: Implement notification to trip creator
    // await sendTripCreatorNotification(trip.users.email, {
    //   tripTitle: trip.title,
    //   hostName: hostContact.name,
    //   companyName: hostContact.companies?.name,
    //   response: response
    // })
  } catch (error) {
    console.error('Error notifying trip creator:', error)
  }
}

function createSuccessPage(response: string, hostName: string, companyName: string, tripTitle: string, startDate: string, endDate: string): string {
  const isAccepted = response === 'accept'
  const emoji = isAccepted ? '✅' : '❌'
  const title = isAccepted ? 'Visit Confirmed!' : 'Visit Declined'
  const message = isAccepted 
    ? `Thank you for confirming your availability to host our visit. You will receive platform access credentials shortly.`
    : `Thank you for letting us know. We understand and will make alternative arrangements.`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Wolthers Travel</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
          }
          .emoji {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          h1 {
            color: ${isAccepted ? '#10b981' : '#ef4444'};
            margin-bottom: 20px;
          }
          .trip-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid ${isAccepted ? '#10b981' : '#ef4444'};
          }
          .next-steps {
            background: ${isAccepted ? '#ecfdf5' : '#fef2f2'};
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="emoji">${emoji}</div>
          <h1>${title}</h1>
          
          <p><strong>Hello ${hostName} from ${companyName},</strong></p>
          <p>${message}</p>
          
          <div class="trip-info">
            <h3>Visit Details</h3>
            <p><strong>${tripTitle}</strong></p>
            <p>${startDate} - ${endDate}</p>
          </div>

          ${isAccepted ? `
          <div class="next-steps">
            <h3>🚀 What's Next?</h3>
            <ul style="text-align: left;">
              <li>Check your email for platform login credentials</li>
              <li>Access your host dashboard to manage visit details</li>
              <li>Upload presentation materials for the meeting</li>
              <li>Review guest information and prepare for the visit</li>
            </ul>
          </div>
          ` : `
          <div class="next-steps">
            <h3>Thank You</h3>
            <p>We appreciate your prompt response. The Wolthers team will make alternative arrangements and may reach out for future opportunities.</p>
          </div>
          `}

          <div class="footer">
            <p><strong>Wolthers & Associates Travel Team</strong></p>
            <p>For any questions, please contact your trip organizer.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

function createErrorPage(message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - Wolthers Travel</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            border-left: 4px solid #ef4444;
          }
          .error-icon {
            font-size: 3rem;
            margin-bottom: 20px;
          }
          h1 {
            color: #ef4444;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">❌</div>
          <h1>Error</h1>
          <p>${message}</p>
          <p>Please contact the Wolthers team if this error persists.</p>
        </div>
      </body>
    </html>
  `
}