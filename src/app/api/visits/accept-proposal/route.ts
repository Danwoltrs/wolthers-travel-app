import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripCode = searchParams.get('tripCode')
    const hostEmail = searchParams.get('hostEmail')
    const alternativeDate = searchParams.get('alternativeDate')
    const alternativeTime = searchParams.get('alternativeTime')
    const token = searchParams.get('token')

    // Validate required parameters
    if (!tripCode || !hostEmail || !alternativeDate || !alternativeTime || !token) {
      return new NextResponse(createErrorPage('Invalid acceptance link'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      })
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
        companies,
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

    // Find the host contact
    const { data: hostContact, error: contactError } = await supabase
      .from('contacts')
      .select(`
        id,
        name,
        email,
        phone,
        company_id,
        companies (
          id,
          name,
          fantasy_name
        )
      `)
      .eq('email', hostEmail)
      .single()

    if (contactError || !hostContact) {
      console.error('Host contact not found:', contactError)
      return new NextResponse(createErrorPage('Host contact not found'), {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // Update the visit confirmation to accepted with new date/time
    const { error: updateError } = await supabase
      .from('visit_confirmations')
      .update({
        response_type: 'accept',
        confirmed_at: new Date().toISOString(),
        notes: JSON.stringify({
          originalProposal: true,
          acceptedAlternativeDate: alternativeDate,
          acceptedAlternativeTime: alternativeTime,
          acceptedAt: new Date().toISOString(),
          acceptedBy: trip.users.email
        })
      })
      .eq('trip_id', trip.id)
      .eq('host_contact_id', hostContact.id)

    if (updateError) {
      console.error('Failed to update confirmation:', updateError)
      return new NextResponse(createErrorPage('Failed to update confirmation'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      })
    }

    // TODO: Update trip schedule with new date/time automatically
    // This would involve updating the trip's activities/calendar to reflect the new visit time

    // Send confirmation email to host
    await sendHostConfirmationEmail({
      hostName: hostContact.name,
      hostEmail: hostContact.email,
      companyName: hostContact.companies?.fantasy_name || hostContact.companies?.name || 'Your Company',
      tripTitle: trip.title,
      tripCode: trip.access_code,
      acceptedDate: alternativeDate,
      acceptedTime: alternativeTime,
      organizerName: trip.users.full_name,
      organizerEmail: trip.users.email,
      visitingCompany: getVisitingCompanies(trip.companies)
    })

    // Create host account if needed
    await createHostAccount(supabase, hostContact, trip)

    // Return success page
    const successPage = createProposalAcceptedPage(
      hostContact.name,
      hostContact.companies?.fantasy_name || hostContact.companies?.name || 'Host Company',
      trip.title,
      alternativeDate,
      alternativeTime
    )

    return new NextResponse(successPage, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Error accepting proposal:', error)
    return new NextResponse(createErrorPage('Internal server error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

// Helper function to get visiting companies
function getVisitingCompanies(companies: any[]): string {
  try {
    if (companies && Array.isArray(companies)) {
      const buyerCompanies = companies
        .filter((c: any) => c.selectedContacts && c.selectedContacts.length > 0)
        .map((c: any) => c.fantasyName || c.name)
      
      if (buyerCompanies.length > 0) {
        return buyerCompanies.join(', ')
      }
    }
  } catch (err) {
    console.error('Error parsing companies:', err)
  }
  return 'Our Team'
}

// Send confirmation email to host
async function sendHostConfirmationEmail(data: {
  hostName: string
  hostEmail: string
  companyName: string
  tripTitle: string
  tripCode: string
  acceptedDate: string
  acceptedTime: string
  organizerName: string
  organizerEmail: string
  visitingCompany: string
}) {
  const {
    hostName,
    hostEmail,
    companyName,
    tripTitle,
    tripCode,
    acceptedDate,
    acceptedTime,
    organizerName,
    organizerEmail,
    visitingCompany
  } = data

  const subject = `Visit Confirmed! ${visitingCompany} - ${new Date(acceptedDate).toLocaleDateString()}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visit Confirmed - Wolthers Travel</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f9f9f9; 
          }
          .container { 
            background: white; 
            padding: 0; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .celebration-box {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border: 2px solid #10b981;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .visit-details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .next-steps {
            background: #eff6ff;
            border: 2px solid #3b82f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .btn {
            display: inline-block;
            padding: 15px 30px;
            margin: 10px 5px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            color: white;
            background: #10b981;
          }
          .btn:hover {
            background: #059669;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            padding: 25px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Visit Confirmed!</h1>
            <p>Your alternative date proposal has been accepted</p>
          </div>
          
          <div class="content">
            <p>Dear ${hostName},</p>

            <div class="celebration-box">
              <h3>✅ Great News!</h3>
              <p><strong>${organizerName}</strong> has accepted your alternative date proposal. Your visit is now confirmed!</p>
            </div>
            
            <div class="visit-details">
              <h3>📅 Confirmed Visit Details</h3>
              <p><strong>Trip:</strong> ${tripTitle} (${tripCode})</p>
              <p><strong>Companies Visiting:</strong> ${visitingCompany}</p>
              <p><strong>Confirmed Date:</strong> ${new Date(acceptedDate).toLocaleDateString()}</p>
              <p><strong>Confirmed Time:</strong> ${acceptedTime}</p>
              <p><strong>Host Company:</strong> ${companyName}</p>
              <p><strong>Organized by:</strong> ${organizerName} (${organizerEmail})</p>
            </div>

            <div class="next-steps">
              <h3>🚀 What's Next?</h3>
              <ul style="text-align: left;">
                <li><strong>Platform Access:</strong> Check your email for dashboard login credentials</li>
                <li><strong>Preparation:</strong> Access your host dashboard to manage visit details</li>
                <li><strong>Materials:</strong> Upload presentations and meeting materials</li>
                <li><strong>Coordination:</strong> Review guest information and prepare your facilities</li>
                <li><strong>Contact:</strong> Reach out to ${organizerName} if you need any adjustments</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://trips.wolthers.com'}/host/login?email=${encodeURIComponent(hostEmail)}" 
                 class="btn">
                🏢 Access Host Dashboard
              </a>
            </div>

            <p style="margin-top: 30px;">
              Thank you for your flexibility and for hosting our visit. We look forward to a productive meeting on ${new Date(acceptedDate).toLocaleDateString()}!
            </p>
          </div>

          <div class="footer">
            <p><strong>Wolthers & Associates Travel Team</strong></p>
            <p style="font-size: 12px; color: #999;">
              This confirmation was generated automatically when your proposal was accepted.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Visit Confirmed! ${visitingCompany} - ${new Date(acceptedDate).toLocaleDateString()}

Dear ${hostName},

Great news! ${organizerName} has accepted your alternative date proposal. Your visit is now confirmed!

CONFIRMED VISIT DETAILS:
Trip: ${tripTitle} (${tripCode})
Companies Visiting: ${visitingCompany}  
Confirmed Date: ${new Date(acceptedDate).toLocaleDateString()}
Confirmed Time: ${acceptedTime}
Host Company: ${companyName}
Organized by: ${organizerName} (${organizerEmail})

WHAT'S NEXT:
1. Check your email for dashboard login credentials
2. Access your host dashboard to manage visit details
3. Upload presentations and meeting materials
4. Review guest information and prepare your facilities
5. Contact ${organizerName} if you need any adjustments

Thank you for your flexibility and for hosting our visit. We look forward to a productive meeting on ${new Date(acceptedDate).toLocaleDateString()}!

Best regards,
Wolthers & Associates Travel Team
  `

  try {
    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [hostEmail],
      subject: subject,
      html: html,
      text: text,
      reply_to: organizerEmail
    })

    if (result.error) {
      console.error('Failed to send host confirmation email:', result.error)
    } else {
      console.log(`✅ Host confirmation email sent to ${hostEmail}`)
    }
  } catch (error) {
    console.error('Exception sending host confirmation email:', error)
  }
}

// Create host account if it doesn't exist
async function createHostAccount(supabase: any, hostContact: any, trip: any) {
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
        console.error('Failed to create host user:', userError)
        return
      }

      console.log(`✅ Created host user account for ${hostContact.email}`)
      
      // Send platform access email (this could be enhanced)
      // await sendHostPlatformAccessEmail(hostContact, trip)
    }
  } catch (error) {
    console.error('Error creating host account:', error)
  }
}

// Create success page for proposal acceptance
function createProposalAcceptedPage(hostName: string, companyName: string, tripTitle: string, acceptedDate: string, acceptedTime: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Proposal Accepted - Wolthers Travel</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
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
            border: 2px solid #10b981;
          }
          .emoji {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          h1 {
            color: #10b981;
            margin-bottom: 20px;
          }
          .proposal-info {
            background: #f0fdf4;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
          }
          .next-steps {
            background: #eff6ff;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
            border-left: 4px solid #3b82f6;
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
          <div class="emoji">🎉</div>
          <h1>Proposal Accepted!</h1>
          
          <p><strong>Great news!</strong></p>
          <p>The alternative date proposal from <strong>${hostName}</strong> at <strong>${companyName}</strong> has been accepted.</p>
          
          <div class="proposal-info">
            <h3>✅ Confirmed Details</h3>
            <p><strong>Trip:</strong> ${tripTitle}</p>
            <p><strong>Host:</strong> ${hostName} (${companyName})</p>
            <p><strong>New Date:</strong> ${new Date(acceptedDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${acceptedTime}</p>
          </div>

          <div class="next-steps">
            <h3>📧 What Happens Next</h3>
            <ul style="text-align: left;">
              <li>The host has been automatically notified of the acceptance</li>
              <li>Host platform access credentials have been sent</li>
              <li>The visit is now confirmed in the system</li>
              <li>Both parties can coordinate final details directly</li>
            </ul>
          </div>
          
          <div class="footer">
            <p><strong>Wolthers & Associates Travel Team</strong></p>
            <p style="font-size: 12px; color: #999;">
              This confirmation was processed automatically.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

// Create error page
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
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: #fef2f2;
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
            border: 2px solid #ef4444;
          }
          h1 { color: #ef4444; margin-bottom: 20px; }
          .footer { margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error</h1>
          <p>${message}</p>
          <div class="footer">
            <p><strong>Wolthers & Associates Travel Team</strong></p>
            <p>If you continue to have issues, please contact support.</p>
          </div>
        </div>
      </body>
    </html>
  `
}