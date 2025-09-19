import { baseUrl, logoUrl } from './client'
import { delay, sendEmail } from './sender'
import { EmailTemplate, TripItineraryEmailData } from './types'

export function createTripCreationNotificationTemplate(data: TripItineraryEmailData): EmailTemplate {
  const { tripTitle, tripAccessCode, tripStartDate, tripEndDate, createdBy, itinerary, participants, companies } = data

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const subject = `New trip itinerary - ${tripAccessCode}`

  const wolthersStaff = participants
    .filter(p => p.role === 'staff' || p.role === 'wolthers_staff')
    .map(p => p.name.split(' ')[0])
    .join(', ')

  const guestInfo = companies.map(company => {
    const reps = company.representatives || []
    const firstNames = reps
      .filter(rep => rep && (rep.name || (rep as any).full_name))
      .map(rep => (rep.name || (rep as any).full_name || 'Guest').split(' ')[0])
      .join(', ')

    return {
      name: company.name,
      firstNames: firstNames || 'Guests'
    }
  })

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Trip Itinerary</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            padding: 40px 20px;
            text-align: center;
            background: white;
          }
          .logo {
            width: 160px;
            height: auto;
            margin-bottom: 0;
          }
          .content {
            padding: 0 30px 30px;
          }
          .trip-overview {
            background: #f0f9f0;
            padding: 20px;
            border-radius: 6px;
            margin: 30px 0;
          }
          .trip-overview h2 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 20px;
            font-weight: 600;
          }
          .trip-overview p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          .trip-link {
            background: #4a5568;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
            display: inline-block;
            margin: 15px 0 0 0;
          }
          .trip-link:hover {
            background: #2d3748;
          }
          .participants-section {
            margin: 30px 0;
          }
          .participants-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
          }
          .participant-line {
            margin: 8px 0;
            color: #333;
            font-size: 14px;
          }
          .separator {
            height: 1px;
            background: #e2e8f0;
            margin: 25px 0;
          }
          .itinerary-section {
            margin: 25px 0;
          }
          .itinerary-section h3 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
          }
          .day-section {
            margin: 20px 0;
          }
          .day-header {
            font-weight: 600;
            font-size: 15px;
            color: #333;
            margin-bottom: 10px;
          }
          .activity-line {
            margin: 5px 0;
            padding-left: 20px;
            color: #333;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background: white;
            color: #666;
          }
          .footer p {
            margin: 5px 0;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Wolthers & Associates" class="logo" />
          </div>

          <div class="content">
            <div class="trip-overview">
              <h2>${tripTitle}</h2>
              <p>${formatDate(tripStartDate)} - ${formatDate(tripEndDate)}</p>
              <p>Organized by ${createdBy}</p>
              <div style="text-align: center;">
                <a href="${baseUrl}/trips/${tripAccessCode}" class="trip-link">
                  View Trip Details
                </a>
              </div>
            </div>

            <div class="participants-section">
              <h3>Joining the Trip</h3>
              ${wolthersStaff ? `
              <div class="participant-line">Wolthers - ${wolthersStaff}</div>
              ` : ''}
              ${guestInfo.map(guest => `
              <div class="participant-line">${guest.name} - ${guest.firstNames || 'Representatives to be confirmed'}</div>
              `).join('')}
            </div>

            <div class="separator"></div>

            <div class="itinerary-section">
              <h3>Itinerary</h3>
              ${itinerary.map(day => `
                <div class="day-section">
                  <div class="day-header">${formatDate(day.date)}</div>
                  ${day.activities.map(activity => `
                    <div class="activity-line">${activity.time} - ${activity.title}</div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p style="font-weight: 600; color: #333;">We wish you a safe travel, and looking forward to seeing you!</p>
            <p>Wolthers & Associates Travel Team</p>
            <p style="color: #999; margin-top: 10px;">
              This itinerary was automatically generated. For questions, contact ${createdBy}.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

export async function sendTripCreationNotificationEmails(data: TripItineraryEmailData): Promise<{ success: boolean; errors: string[] }> {
  const template = createTripCreationNotificationTemplate(data)
  const errors: string[] = []
  const recipients: Array<{ name: string; email: string }> = [
    ...data.participants,
    ...data.companies.flatMap(company => company.representatives || [])
  ]

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]
    try {
      await sendEmail({
        to: recipient.email,
        subject: template.subject,
        html: template.html
      })

      if (i < recipients.length - 1) {
        await delay(2000)
      }
    } catch (error) {
      errors.push(`${recipient.name} (${recipient.email}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return {
    success: errors.length === 0,
    errors
  }
}
