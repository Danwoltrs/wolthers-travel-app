import { createCleanEmailTemplate } from './templates/base'
import { sendEmail } from './sender'
import { EmailTemplate, VisitDeclinedData } from './types'

export function createVisitDeclinedTemplate(data: VisitDeclinedData): EmailTemplate {
  const subject = `Action Required: A visit for "${data.tripTitle}" was declined`
  
  const content = `
    <div class="content-section">
      <h3>Visit Declined</h3>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        Hi ${data.creatorName},
      </p>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        This is a notification that <strong>${data.hostName}</strong> from <strong>${data.companyName}</strong> has declined the proposed visit on ${data.visitDate}.
      </p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Host:</strong> ${data.hostName}</p>
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Company:</strong> ${data.companyName}</p>
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Original Date:</strong> ${data.visitDate}</p>
      </div>
      
      <p style="color: #333; font-size: 14px; margin: 15px 0 0 0;">
        The host has been asked to propose an alternative time. You may also want to contact them directly to reschedule.
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

export async function sendVisitDeclinedNotification(email: string, data: VisitDeclinedData) {
  const template = createVisitDeclinedTemplate(data)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html
  })
}
