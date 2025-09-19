import { createCleanEmailTemplate } from './templates/base'
import { sendEmail } from './sender'
import { EmailTemplate, HostInvitationEmailData } from './types'

export function createHostInvitationTemplate(data: HostInvitationEmailData): EmailTemplate {
  const subject = `Visit Request for ${data.tripTitle}`

  const content = `
    <div class="content-section">
      <h3>Visit Request</h3>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        Dear ${data.hostName},
      </p>
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        ${data.inviterName} from Wolthers & Associates invites you to host a visit at <strong>${data.companyName}</strong> as part of the trip "<strong>${data.tripTitle}</strong>".
      </p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Trip Code:</strong> ${data.tripAccessCode}</p>
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Company:</strong> ${data.companyName}</p>
        ${data.visitDate ? `<p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Proposed Date:</strong> ${data.visitDate}</p>` : ''}
        ${data.visitTime ? `<p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Proposed Time:</strong> ${data.visitTime}</p>` : ''}
      </div>
      
      ${data.wolthersTeam && data.wolthersTeam.length > 0 ? `
      <div class="content-section">
        <h3>Wolthers Team</h3>
        <p style="color: #333; font-size: 14px;">
          ${data.wolthersTeam.map(member => member.name + (member.role ? ` (${member.role})` : '')).join(', ')}
        </p>
      </div>
      ` : ''}
      
      <p style="color: #333; font-size: 14px; margin: 15px 0 0 0;">
        Please contact ${data.inviterName} at ${data.inviterEmail} to coordinate the visit details.
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

export async function sendHostInvitationEmail(email: string, data: HostInvitationEmailData) {
  const template = createHostInvitationTemplate(data)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    replyTo: data.inviterEmail
  })
}
