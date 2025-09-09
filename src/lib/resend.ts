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
        from: 'Wolthers Travel <travel@wolthers.com>',
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
        from: 'Wolthers Travel <travel@wolthers.com>',
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
      from: 'Wolthers Travel <travel@wolthers.com>',
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

export default resend