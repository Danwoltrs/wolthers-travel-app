import { Resend } from 'resend'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates for different scenarios
export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface TripCancellationEmailData {
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  cancelledBy: string
  cancellationReason?: string
  stakeholders: Array<{
    name: string
    email: string
    role?: string
  }>
}

export interface TripCreationEmailData {
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  createdBy: string
  participants: Array<{
    name: string
    email: string
    role?: string
  }>
  companies: Array<{
    name: string
    representatives?: Array<{
      name: string
      email: string
    }>
  }>
}

export interface StaffInvitationEmailData {
  inviterName: string
  inviterEmail: string
  newStaffName: string
  role: string
  tripTitle?: string
  whatsApp?: string
}

export interface HostInvitationEmailData {
  hostName: string
  hostEmail: string
  companyName: string
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  inviterName: string
  inviterEmail: string
  wolthersTeam: Array<{
    name: string
    role?: string
  }>
  confirmationUrl: string
  platformLoginUrl: string
  whatsApp?: string
  personalMessage?: string
  visitingCompanyName?: string
  visitDate?: string
  visitTime?: string
}

/**
 * Generate trip cancellation email template
 */
export function createTripCancellationTemplate(data: TripCancellationEmailData): EmailTemplate {
  const { tripTitle, tripAccessCode, tripStartDate, tripEndDate, cancelledBy, cancellationReason } = data

  const subject = `Trip Cancelled: ${tripTitle} (${tripAccessCode})`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Cancellation Notice</title>
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
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: #dc3545; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
            margin: -30px -30px 30px -30px; 
          }
          .trip-details { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
          }
          .important-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚫 Trip Cancellation Notice</h1>
          </div>
          
          <div class="important-notice">
            <p><strong>Important:</strong> This trip has been cancelled by ${cancelledBy}.</p>
          </div>

          <p>We regret to inform you that the following trip has been cancelled:</p>
          
          <div class="trip-details">
            <h3>${tripTitle}</h3>
            <p><strong>Trip Code:</strong> ${tripAccessCode}</p>
            <p><strong>Original Dates:</strong> ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}</p>
            <p><strong>Cancelled By:</strong> ${cancelledBy}</p>
            ${cancellationReason ? `<p><strong>Reason:</strong> ${cancellationReason}</p>` : ''}
          </div>

          <p>Please take note of this cancellation and adjust your schedule accordingly. If you have any questions or need to discuss alternative arrangements, please contact the Wolthers & Associates team.</p>
          
          <div class="footer">
            <p>Best regards,<br/>
            <strong>Wolthers & Associates Travel Team</strong></p>
            <p style="font-size: 12px; color: #999;">
              This is an automated notification from the Wolthers Travel Management System.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
TRIP CANCELLATION NOTICE

The following trip has been cancelled:

${tripTitle}
Trip Code: ${tripAccessCode}
Original Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}
Cancelled By: ${cancelledBy}
${cancellationReason ? `Reason: ${cancellationReason}` : ''}

Please adjust your schedule accordingly and contact Wolthers & Associates if you have any questions.

Best regards,
Wolthers & Associates Travel Team
  `

  return { subject, html, text }
}

/**
 * Generate trip creation notification email template
 */
export function createTripCreationTemplate(data: TripCreationEmailData): EmailTemplate {
  const { tripTitle, tripAccessCode, tripStartDate, tripEndDate, createdBy, participants, companies } = data

  const subject = `New Trip Created: ${tripTitle} (${tripAccessCode})`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Trip Notification</title>
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
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: #28a745; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
            margin: -30px -30px 30px -30px; 
          }
          .trip-details { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .participants-list { 
            background: #e8f5e8; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ New Trip Created</h1>
          </div>

          <p>A new trip has been created and you have been included as a stakeholder:</p>
          
          <div class="trip-details">
            <h3>${tripTitle}</h3>
            <p><strong>Trip Code:</strong> ${tripAccessCode}</p>
            <p><strong>Dates:</strong> ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}</p>
            <p><strong>Created By:</strong> ${createdBy}</p>
          </div>

          ${participants.length > 0 ? `
          <div class="participants-list">
            <h4>Wolthers Team Members:</h4>
            <ul>
              ${participants.map(p => `<li>${p.name} (${p.email})${p.role ? ` - ${p.role}` : ''}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${companies.length > 0 ? `
          <div class="participants-list">
            <h4>Partner Companies:</h4>
            <ul>
              ${companies.map(c => `<li>${c.name}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <p>You will receive further details about the itinerary and arrangements as they are finalized.</p>
          
          <div class="footer">
            <p>Best regards,<br/>
            <strong>Wolthers & Associates Travel Team</strong></p>
            <p style="font-size: 12px; color: #999;">
              This is an automated notification from the Wolthers Travel Management System.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
NEW TRIP CREATED

A new trip has been created:

${tripTitle}
Trip Code: ${tripAccessCode}
Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}
Created By: ${createdBy}

${participants.length > 0 ? `
Wolthers Team Members:
${participants.map(p => `- ${p.name} (${p.email})${p.role ? ` - ${p.role}` : ''}`).join('\n')}
` : ''}

${companies.length > 0 ? `
Partner Companies:
${companies.map(c => `- ${c.name}`).join('\n')}
` : ''}

You will receive further details as they are finalized.

Best regards,
Wolthers & Associates Travel Team
  `

  return { subject, html, text }
}

/**
 * Generate staff invitation email template
 */
export function createStaffInvitationTemplate(data: StaffInvitationEmailData): EmailTemplate {
  const { inviterName, inviterEmail, newStaffName, role, tripTitle, whatsApp } = data

  const subject = `Wolthers & Associates - Team Invitation${tripTitle ? ` for ${tripTitle}` : ''}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
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
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: #007bff; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
            margin: -30px -30px 30px -30px; 
          }
          .invitation-details { 
            background: #e7f3ff; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Team Invitation</h1>
          </div>

          <p>Hello ${newStaffName},</p>
          
          <p>You have been invited to join the Wolthers & Associates team by ${inviterName} (${inviterEmail}).</p>
          
          <div class="invitation-details">
            <h3>Invitation Details</h3>
            <p><strong>Role:</strong> ${role}</p>
            ${tripTitle ? `<p><strong>Initial Project:</strong> ${tripTitle}</p>` : ''}
            ${whatsApp ? `<p><strong>WhatsApp:</strong> ${whatsApp}</p>` : ''}
            <p><strong>Invited By:</strong> ${inviterName}</p>
          </div>

          <p>Please contact ${inviterName} at ${inviterEmail} to confirm your participation and receive access to the travel management system.</p>
          
          <div class="footer">
            <p>Welcome to the team!<br/>
            <strong>Wolthers & Associates</strong></p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
WOLTHERS & ASSOCIATES - TEAM INVITATION

Hello ${newStaffName},

You have been invited to join the Wolthers & Associates team by ${inviterName} (${inviterEmail}).

Invitation Details:
Role: ${role}
${tripTitle ? `Initial Project: ${tripTitle}` : ''}
${whatsApp ? `WhatsApp: ${whatsApp}` : ''}
Invited By: ${inviterName}

Please contact ${inviterName} at ${inviterEmail} to confirm your participation.

Welcome to the team!
Wolthers & Associates
  `

  return { subject, html, text }
}

/**
 * Generate host invitation email template with platform features and visit confirmation
 */
export function createHostInvitationTemplate(data: HostInvitationEmailData): EmailTemplate {
  const { 
    hostName, 
    companyName, 
    tripTitle, 
    tripAccessCode, 
    tripStartDate, 
    tripEndDate, 
    inviterName, 
    inviterEmail,
    wolthersTeam,
    confirmationUrl,
    platformLoginUrl,
    whatsApp,
    personalMessage,
    visitingCompanyName,
    visitDate,
    visitTime
  } = data

  const subject = `Visit Confirmation Required - ${visitingCompanyName || companyName} ${visitDate ? `on ${visitDate}` : ''}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Host Platform Invitation & Visit Confirmation</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 650px; 
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
            background: linear-gradient(135deg, #2D5347, #1a4c42); 
            color: white; 
            padding: 30px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .welcome-section {
            background: linear-gradient(135deg, #FEF3C7, #F3E8A6);
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2D5347;
          }
          .visit-confirmation {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
          }
          .confirmation-buttons {
            margin: 20px 0;
          }
          .btn {
            display: inline-block;
            padding: 15px 30px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
          }
          .btn-accept {
            background: #10b981;
            color: white;
          }
          .btn-accept:hover {
            background: #059669;
          }
          .btn-decline {
            background: #ef4444;
            color: white;
          }
          .btn-decline:hover {
            background: #dc2626;
          }
          .platform-features {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .feature-list {
            list-style: none;
            padding: 0;
          }
          .feature-list li {
            padding: 8px 0;
            position: relative;
            padding-left: 25px;
          }
          .feature-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
          }
          .trip-details {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .team-list {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
          .platform-access {
            background: #2D5347;
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
          }
          .btn-platform {
            background: #FEF3C7;
            color: #2D5347;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            display: inline-block;
            margin-top: 15px;
          }
          .btn-platform:hover {
            background: #F3E8A6;
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px; 
            padding: 25px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0; 
          }
          .urgent-note {
            background: #fef2f2;
            border: 2px solid #fecaca;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Welcome to Wolthers Travel Platform</h1>
            <p>Your invitation to join our exclusive host network</p>
          </div>
          
          <div class="content">
            <p>Dear ${hostName},</p>

            <div class="welcome-section">
              <h3>🎉 Platform Invitation</h3>
              <p>We're excited to invite you and <strong>${companyName}</strong> to join the <strong>Wolthers Travel Platform</strong> as our valued host partner!</p>
            </div>

            ${personalMessage ? `
            <div class="welcome-section">
              <h3>💬 Personal Message</h3>
              <p><em>"${personalMessage}"</em></p>
              <p style="text-align: right; margin-top: 15px; font-size: 14px; color: #666;">— ${inviterName}</p>
            </div>
            ` : ''}

            <div class="urgent-note">
              <h3>⏰ URGENT: Visit Confirmation Required</h3>
              <p><strong>Please confirm your availability for our upcoming visit</strong></p>
            </div>
            
            <div class="trip-details">
              <h3>📅 Visit Details</h3>
              <p><strong>Company Visiting:</strong> ${visitingCompanyName || companyName}</p>
              ${visitDate ? `<p><strong>Visit Date:</strong> ${visitDate}</p>` : ''}
              ${visitTime ? `<p><strong>Visit Time:</strong> ${visitTime}</p>` : ''}
              <p><strong>Organized by:</strong> ${inviterName} (${inviterEmail})</p>
            </div>

            ${wolthersTeam.length > 0 ? `
            <div class="team-list">
              <h4>👥 Wolthers Team Members Visiting:</h4>
              <ul>
                ${wolthersTeam.map(member => `<li>${member.name}${member.role ? ` - ${member.role}` : ''}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <div class="visit-confirmation">
              <h3>🤝 Can you host our visit?</h3>
              <p>Please confirm your availability for the dates above.</p>
              <div class="confirmation-buttons">
                <a href="${confirmationUrl}&response=accept" class="btn btn-accept">
                  ✅ YES, We can host
                </a>
                <a href="${confirmationUrl}&response=decline" class="btn btn-decline">
                  ❌ Sorry, not available
                </a>
              </div>
              <p><small>Click one of the buttons above to confirm your availability</small></p>
            </div>

            <div class="platform-features">
              <h3>🚀 Your Wolthers Travel Platform Benefits</h3>
              <p>As a host on our platform, you'll have access to:</p>
              <ul class="feature-list">
                <li><strong>Client Visit Management</strong> - Track all past and future guests</li>
                <li><strong>Meeting Presentations</strong> - Upload PowerPoint presentations for meetings</li>
                <li><strong>Visit Dashboard</strong> - Comprehensive overview of all interactions</li>
                <li><strong>Guest Information</strong> - Detailed profiles of visiting clients</li>
                <li><strong>Visit Confirmations</strong> - Easily accept or decline visit requests</li>
                <li><strong>Communication Tools</strong> - Direct messaging with Wolthers team</li>
                <li><strong>Historical Records</strong> - Access to complete visit history</li>
                <li><strong>Analytics</strong> - Insights on your partnership performance</li>
              </ul>
            </div>

            <div class="platform-access">
              <h3>🔐 Access Your Dashboard</h3>
              <p>Once you confirm this visit, you'll receive login credentials to access your personalized host dashboard.</p>
              <a href="${platformLoginUrl}" class="btn-platform">
                🌐 Access Wolthers Travel Platform
              </a>
              <p><small>Login details will be sent after visit confirmation</small></p>
            </div>

            <div class="welcome-section">
              <h3>📋 Next Steps</h3>
              <ol>
                <li><strong>Confirm Visit</strong> - Click YES or NO above for the ${new Date(tripStartDate).toLocaleDateString()} visit</li>
                <li><strong>Receive Login</strong> - Get your platform credentials via email</li>
                <li><strong>Set Up Profile</strong> - Complete your company profile on the platform</li>
                <li><strong>Prepare Materials</strong> - Upload presentations and meeting materials</li>
                <li><strong>Welcome Guests</strong> - Host the Wolthers team during their visit</li>
              </ol>
            </div>

            <p>We're looking forward to building a long-term partnership with ${companyName} and providing you with the tools to manage our visits effectively.</p>

            ${whatsApp ? `<p><strong>WhatsApp Contact:</strong> ${whatsApp}</p>` : ''}
          </div>
          
          <div class="footer">
            <p><strong>Best regards,</strong><br/>
            <strong>${inviterName}</strong><br/>
            Wolthers & Associates Travel Team</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              This email contains an invitation to join the Wolthers Travel Platform and requires visit confirmation.<br/>
              For questions, contact ${inviterEmail}
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
WELCOME TO WOLTHERS TRAVEL PLATFORM + VISIT CONFIRMATION REQUIRED

Dear ${hostName},

PLATFORM INVITATION
We're excited to invite you and ${companyName} to join the Wolthers Travel Platform as our valued host partner!

URGENT: VISIT CONFIRMATION REQUIRED
Please confirm your availability for our upcoming visit.

VISIT DETAILS
Company Visiting: ${visitingCompanyName || companyName}
${visitDate ? `Visit Date: ${visitDate}` : `Visit Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}`}
${visitTime ? `Visit Time: ${visitTime}` : ''}
Organized by: ${inviterName} (${inviterEmail})

${wolthersTeam.length > 0 ? `
WOLTHERS TEAM MEMBERS VISITING:
${wolthersTeam.map(member => `- ${member.name}${member.role ? ` - ${member.role}` : ''}`).join('\n')}
` : ''}

CAN YOU HOST OUR VISIT?
Please confirm your availability by visiting:
ACCEPT: ${confirmationUrl}&response=accept
DECLINE: ${confirmationUrl}&response=decline

PLATFORM BENEFITS:
- Client Visit Management - Track all past and future guests
- Meeting Presentations - Upload PowerPoint presentations
- Visit Dashboard - Comprehensive overview of interactions
- Guest Information - Detailed visitor profiles
- Visit Confirmations - Easy accept/decline system
- Communication Tools - Direct messaging with Wolthers team
- Historical Records - Complete visit history
- Analytics - Partnership performance insights

ACCESS YOUR DASHBOARD:
${platformLoginUrl}
(Login credentials sent after visit confirmation)

NEXT STEPS:
1. Confirm Visit - Click accept or decline link above
2. Receive Login - Get platform credentials via email
3. Set Up Profile - Complete your company profile
4. Prepare Materials - Upload presentations and materials
5. Welcome Guests - Host the Wolthers team

We look forward to building a long-term partnership with ${companyName}.

${whatsApp ? `WhatsApp Contact: ${whatsApp}` : ''}

Best regards,
${inviterName}
Wolthers & Associates Travel Team

For questions, contact ${inviterEmail}
  `

  return { subject, html, text }
}

/**
 * Send trip cancellation emails to all stakeholders
 */
export async function sendTripCancellationEmails(data: TripCancellationEmailData): Promise<{ success: boolean; errors: string[] }> {
  const template = createTripCancellationTemplate(data)
  const errors: string[] = []
  let successCount = 0

  console.log(`📧 [Resend] Sending cancellation emails to ${data.stakeholders.length} stakeholders`)

  for (const stakeholder of data.stakeholders) {
    try {
      const result = await resend.emails.send({
        from: 'Wolthers Travel <trips@trips.wolthers.com>',
        to: [stakeholder.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      if (result.error) {
        console.error(`❌ [Resend] Failed to send to ${stakeholder.email}:`, result.error)
        errors.push(`${stakeholder.name} (${stakeholder.email}): ${result.error.message}`)
      } else {
        console.log(`✅ [Resend] Sent cancellation email to ${stakeholder.name} (${stakeholder.email})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ [Resend] Exception sending to ${stakeholder.email}:`, error)
      errors.push(`${stakeholder.name} (${stakeholder.email}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log(`📧 [Resend] Cancellation email summary: ${successCount}/${data.stakeholders.length} sent successfully`)

  return {
    success: errors.length === 0,
    errors
  }
}

/**
 * Send trip creation notification emails
 */
export async function sendTripCreationEmails(data: TripCreationEmailData): Promise<{ success: boolean; errors: string[] }> {
  const template = createTripCreationTemplate(data)
  const errors: string[] = []
  let successCount = 0

  // Collect all recipient emails (participants + company representatives)
  const recipients: Array<{ name: string; email: string }> = [
    ...data.participants,
    ...data.companies.flatMap(c => c.representatives || [])
  ]

  console.log(`📧 [Resend] Sending creation emails to ${recipients.length} recipients`)

  for (const recipient of recipients) {
    try {
      const result = await resend.emails.send({
        from: 'Wolthers Travel <trips@trips.wolthers.com>',
        to: [recipient.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      if (result.error) {
        console.error(`❌ [Resend] Failed to send to ${recipient.email}:`, result.error)
        errors.push(`${recipient.name} (${recipient.email}): ${result.error.message}`)
      } else {
        console.log(`✅ [Resend] Sent creation email to ${recipient.name} (${recipient.email})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ [Resend] Exception sending to ${recipient.email}:`, error)
      errors.push(`${recipient.name} (${recipient.email}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log(`📧 [Resend] Creation email summary: ${successCount}/${recipients.length} sent successfully`)

  return {
    success: errors.length === 0,
    errors
  }
}

/**
 * Send staff invitation email
 */
export async function sendStaffInvitationEmail(email: string, data: StaffInvitationEmailData): Promise<{ success: boolean; error?: string }> {
  const template = createStaffInvitationTemplate(data)

  try {
    console.log(`📧 [Resend] Sending staff invitation to ${email}`)

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (result.error) {
      console.error(`❌ [Resend] Failed to send staff invitation to ${email}:`, result.error)
      return {
        success: false,
        error: result.error.message
      }
    } else {
      console.log(`✅ [Resend] Sent staff invitation to ${email}`)
      return { success: true }
    }
  } catch (error) {
    console.error(`❌ [Resend] Exception sending staff invitation to ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send host invitation email with platform access and visit confirmation
 */
export async function sendHostInvitationEmail(email: string, data: HostInvitationEmailData): Promise<{ success: boolean; error?: string }> {
  const template = createHostInvitationTemplate(data)

  try {
    console.log(`📧 [Resend] Sending host invitation to ${email} for ${data.companyName}`)

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
      text: template.text,
      // Add reply-to for better engagement
      reply_to: data.inviterEmail
    })

    if (result.error) {
      console.error(`❌ [Resend] Failed to send host invitation to ${email}:`, result.error)
      return {
        success: false,
        error: result.error.message
      }
    } else {
      console.log(`✅ [Resend] Sent host invitation to ${data.hostName} at ${data.companyName} (${email})`)
      return { success: true }
    }
  } catch (error) {
    console.error(`❌ [Resend] Exception sending host invitation to ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send host invitations to multiple hosts for a trip
 */
export async function sendHostInvitationEmails(hosts: Array<{ email: string; data: HostInvitationEmailData }>): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  let successCount = 0

  console.log(`📧 [Resend] Sending host invitations to ${hosts.length} hosts`)

  for (const host of hosts) {
    const result = await sendHostInvitationEmail(host.email, host.data)
    
    if (result.success) {
      successCount++
    } else {
      errors.push(`${host.data.hostName} (${host.email}): ${result.error}`)
    }
  }

  console.log(`📧 [Resend] Host invitation summary: ${successCount}/${hosts.length} sent successfully`)

  return {
    success: errors.length === 0,
    errors
  }
}

export default resend