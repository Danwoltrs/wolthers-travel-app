import { createCleanEmailTemplate } from './templates/base'
import { sendEmail } from './sender'
import { EmailTemplate, StaffInvitationEmailData } from './types'

export function createStaffInvitationTemplate(data: StaffInvitationEmailData): EmailTemplate {
  const tripLabel = data.tripTitle ?? data.tripAccessCode
  const subject = `You've been invited to the trip: ${tripLabel}`

  const content = `
    <div class="content-section">
      <h3>Trip Invitation</h3>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        Hello ${data.newStaffName},
      </p>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        You have been invited by ${data.inviterName} to join the trip "<strong>${tripLabel}</strong>" as a ${data.role}.
      </p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Trip Code:</strong> ${data.tripAccessCode}</p>
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Your Role:</strong> ${data.role}</p>
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Invited by:</strong> ${data.inviterName}</p>
      </div>
      
      <p style="color: #333; font-size: 14px; margin: 15px 0 0 0;">
        Please review the trip details and contact ${data.inviterName} if you have any questions.
      </p>
    </div>
  `
  
  const html = createCleanEmailTemplate({
    title: tripLabel,
    content,
    tripAccessCode: data.tripAccessCode,
    showViewTripButton: true
  })
  
  return { subject, html }
}

export async function sendStaffInvitationEmail(email: string, data: StaffInvitationEmailData) {
  const template = createStaffInvitationTemplate(data)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}
