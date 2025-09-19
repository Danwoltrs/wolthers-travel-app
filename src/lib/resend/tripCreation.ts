import { createBaseTemplate } from './templates/base'
import { delay, sendEmail } from './sender'
import { EmailTemplate, TripCreationEmailData } from './types'

export function createTripCreationTemplate(data: TripCreationEmailData): EmailTemplate {
  const subject = `You've been added to a new trip: ${data.tripTitle}`
  const content = `
    <p>You have been added as a participant for the trip "<strong>${data.tripTitle}</strong>" by ${data.createdBy}.</p>
    <div class="details-box">
      <p><strong>Trip Code:</strong> ${data.tripAccessCode}</p>
    </div>
  `
  const html = createBaseTemplate(subject, 'New Trip Assignment', content, data.tripAccessCode)
  return { subject, html }
}

export async function sendTripCreationEmails(data: TripCreationEmailData) {
  const template = createTripCreationTemplate(data)
  const recipients = data.recipients.map(r => r.email)

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
