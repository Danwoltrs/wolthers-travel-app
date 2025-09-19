import { createCleanEmailTemplate } from './templates/base'
import { sendEmail } from './sender'
import { EmailTemplate, NewTimeProposedData } from './types'

export function createNewTimeProposedTemplate(data: NewTimeProposedData): EmailTemplate {
  const subject = `New Time Proposed for: ${data.tripTitle}`
  
  const content = `
    <div class="content-section">
      <h3>New Time Proposed</h3>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        Hi ${data.creatorName},
      </p>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        <strong>${data.hostName}</strong> has proposed a new time for a meeting during the "<strong>${data.tripTitle}</strong>" trip.
      </p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Host:</strong> ${data.hostName}</p>
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Proposed Date:</strong> ${data.newDate}</p>
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Proposed Time:</strong> ${data.newTime}</p>
      </div>
      
      <p style="color: #333; font-size: 14px; margin: 15px 0 0 0;">
        Please review this new time and update the trip schedule if it is suitable.
      </p>
    </div>
  `
  
  const html = createCleanEmailTemplate({
    title: data.tripTitle,
    content,
    tripAccessCode: data.tripAccessCode,
    showViewTripButton: true
  })
  
  return { subject, html }
}

export async function sendNewTimeProposedNotification(email: string, data: NewTimeProposedData) {
  const template = createNewTimeProposedTemplate(data)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}
