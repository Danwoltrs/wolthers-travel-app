import { createCleanEmailTemplate } from './templates/base'
import { delay, sendEmail } from './sender'
import { EmailTemplate, TripCancellationEmailData } from './types'

export function createTripCancellationTemplate(data: TripCancellationEmailData): EmailTemplate {
  const subject = `Trip Cancelled: ${data.tripTitle}`

  const content = `
    <div class="content-section">
      <p style="color: #333; font-size: 14px; margin: 0 0 15px 0;">
        The trip "<strong>${data.tripTitle}</strong>" has been cancelled by ${data.cancelledBy}.
      </p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Trip Code:</strong> ${data.tripAccessCode}</p>
        ${data.cancellationReason ? `<p style="margin: 5px 0; color: #333; font-size: 14px;"><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
      </div>
      
      <p style="color: #333; font-size: 14px; margin: 15px 0 0 0;">
        Please adjust your schedule accordingly.
      </p>
    </div>
  `
  
  const html = createCleanEmailTemplate({
    title: 'Trip Cancellation Notice',
    content,
    tripAccessCode: data.tripAccessCode,
    showViewTripButton: false
  }).replace('#f0f9f0', '#ffebee').replace('color: #333', 'color: #c62828')
  
  return { subject, html }
}

export async function sendTripCancellationEmails(data: TripCancellationEmailData) {
  const template = createTripCancellationTemplate(data)
  const recipients = data.stakeholders.map(s => s.email)

  if (recipients.length > 3) {
    const results = []
    for (let i = 0; i < recipients.length; i++) {
      try {
        const result = await sendEmail({
          to: recipients[i],
          subject: template.subject,
          html: template.html
        })
        results.push(result)

        if (i < recipients.length - 1) {
          await delay(2000)
        }
      } catch (error) {
        results.push({ error })
      }
    }
    return results
  }

  return sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html
  })
}
