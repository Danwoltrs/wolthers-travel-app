import { sendEmail } from './sender'
import { EmailTemplate, GuestItineraryData } from './types'

export function createGuestItineraryTemplate(data: GuestItineraryData): EmailTemplate {
  const {
    guestName,
    tripTitle,
    tripAccessCode,
    tripStartDate,
    tripEndDate,
    createdBy,
    itinerary,
    accommodation,
    transportation,
    emergencyContacts,
    specialInstructions
  } = data

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const startFormatted = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
    const endFormatted = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    return `${startFormatted} - ${endFormatted}`
  }

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'meeting': return '🤝'
      case 'transport': return '🚗'
      case 'meal': return '🍽️'
      case 'activity': return '🎯'
      case 'accommodation': return '🏨'
      default: return '📍'
    }
  }

  const subject = `Your Itinerary: ${tripTitle} - ${formatDateRange(tripStartDate, tripEndDate)}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Guest Itinerary</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #2d3748;
            max-width: 650px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #2D5347, #1a4c42);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header .trip-code {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 12px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            letter-spacing: 1px;
          }
          .content {
            padding: 32px 24px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .card h3 {
            margin: 0 0 16px 0;
            color: #2D5347;
            font-size: 18px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .trip-overview {
            background: linear-gradient(135deg, #FEF3C7, #F3E8A6);
            border: none;
            border-left: 4px solid #2D5347;
          }
          .trip-overview h2 {
            margin: 0 0 12px 0;
            color: #2D5347;
            font-size: 22px;
          }
          .accommodation-card {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
          }
          .transport-card {
            background: #eff6ff;
            border: 1px solid #93c5fd;
          }
          .day-section {
            margin: 16px 0;
            border-left: 3px solid #2D5347;
            padding-left: 20px;
          }
          .day-header {
            background: #2D5347;
            color: white;
            padding: 12px 16px;
            margin-left: -23px;
            margin-bottom: 12px;
            border-radius: 0 6px 6px 0;
            font-weight: 600;
            font-size: 16px;
          }
          .activity {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin: 12px 0;
            display: flex;
            align-items: flex-start;
            gap: 16px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          .activity-time {
            background: #2D5347;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            font-weight: 600;
            min-width: 70px;
            text-align: center;
            flex-shrink: 0;
          }
          .activity-content {
            flex: 1;
          }
          .activity-title {
            font-weight: 600;
            color: #2D5347;
            margin: 0 0 6px 0;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .activity-details {
            color: #6b7280;
            font-size: 14px;
            margin: 4px 0;
          }
          .emergency-card {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-left: 4px solid #ef4444;
          }
          .emergency-contacts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-top: 12px;
          }
          .contact-item {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .contact-name {
            font-weight: 600;
            color: #ef4444;
            margin-bottom: 4px;
          }
          .contact-details {
            font-size: 13px;
            color: #6b7280;
          }
          .instructions-card {
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-left: 4px solid #3b82f6;
          }
          .footer {
            text-align: center;
            padding: 24px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            color: #6b7280;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .emergency-contacts {
              grid-template-columns: 1fr;
            }
            .activity {
              flex-direction: column;
              align-items: flex-start;
            }
            .activity-time {
              align-self: flex-start;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ Your Travel Itinerary</h1>
            <div class="trip-code">${tripAccessCode}</div>
          </div>

          <div class="content">
            <p>Dear ${guestName},</p>
            <p>Here is your complete itinerary for your upcoming trip. Please review all details carefully and keep this information handy during your travels.</p>

            <div class="card trip-overview">
              <h2>${tripTitle}</h2>
              <p style="margin: 0; font-size: 16px; font-weight: 500;">${formatDate(tripStartDate)} - ${formatDate(tripEndDate)}</p>
              <p style="margin: 8px 0 0 0; color: #6b7280;">Organized by ${createdBy}</p>
            </div>

            ${accommodation ? `
            <div class="card accommodation-card">
              <h3>🏨 Accommodation</h3>
              <p><strong>${accommodation.name}</strong></p>
              ${accommodation.address ? `<p>📍 ${accommodation.address}</p>` : ''}
              ${accommodation.phone ? `<p>📞 ${accommodation.phone}</p>` : ''}
              ${accommodation.checkIn ? `<p><strong>Check-in:</strong> ${accommodation.checkIn}</p>` : ''}
              ${accommodation.checkOut ? `<p><strong>Check-out:</strong> ${accommodation.checkOut}</p>` : ''}
            </div>
            ` : ''}

            ${transportation ? `
            <div class="card transport-card">
              <h3>🚗 Transportation</h3>
              <p><strong>Type:</strong> ${transportation.type.charAt(0).toUpperCase() + transportation.type.slice(1)}</p>
              <p><strong>Details:</strong> ${transportation.details}</p>
              ${transportation.arrivalTime ? `<p><strong>Arrival:</strong> ${transportation.arrivalTime}</p>` : ''}
              ${transportation.departureTime ? `<p><strong>Departure:</strong> ${transportation.departureTime}</p>` : ''}
            </div>
            ` : ''}

            <div class="card">
              <h3>📅 Daily Schedule</h3>

              ${itinerary.map(day => `
                <div class="day-section">
                  <div class="day-header">
                    ${formatDate(day.date)}
                  </div>
                  ${day.activities.map(activity => `
                    <div class="activity">
                      <div class="activity-time">${activity.time}</div>
                      <div class="activity-content">
                        <h4 class="activity-title">
                          ${getActivityIcon(activity.type)} ${activity.title}
                        </h4>
                        ${activity.location ? `<p class="activity-details">📍 ${activity.location}</p>` : ''}
                        ${activity.duration ? `<p class="activity-details">⏱️ Duration: ${activity.duration}</p>` : ''}
                        ${activity.description ? `<p class="activity-details">${activity.description}</p>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>

            ${specialInstructions ? `
            <div class="card instructions-card">
              <h3>ℹ️ Special Instructions</h3>
              <p>${specialInstructions}</p>
            </div>
            ` : ''}

            <div class="card emergency-card">
              <h3>🚨 Emergency Contacts</h3>
              <div class="emergency-contacts">
                ${emergencyContacts.map(contact => `
                  <div class="contact-item">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-details">${contact.role}</div>
                    ${contact.phone ? `<div class="contact-details">📞 ${contact.phone}</div>` : ''}
                    ${contact.email ? `<div class="contact-details">📧 ${contact.email}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>

            <p>We hope you have a wonderful trip! If you have any questions or need assistance, please don't hesitate to contact us.</p>
          </div>

          <div class="footer">
            <p><strong>Safe travels!</strong><br/>
            <strong>Wolthers & Associates Travel Team</strong></p>
            <p style="margin-top: 12px; font-size: 12px; color: #9ca3af;">
              Keep this itinerary with you during your trip. For changes or questions, contact ${createdBy}.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
YOUR TRAVEL ITINERARY

${tripTitle}
Trip Code: ${tripAccessCode}
Dates: ${formatDate(tripStartDate)} - ${formatDate(tripEndDate)}
Organized by: ${createdBy}

Dear ${guestName},

Here is your complete itinerary for your upcoming trip:

${accommodation ? `
ACCOMMODATION:
${accommodation.name}
${accommodation.address ? `Address: ${accommodation.address}` : ''}
${accommodation.phone ? `Phone: ${accommodation.phone}` : ''}
${accommodation.checkIn ? `Check-in: ${accommodation.checkIn}` : ''}
${accommodation.checkOut ? `Check-out: ${accommodation.checkOut}` : ''}
` : ''}

${transportation ? `
TRANSPORTATION:
Type: ${transportation.type.charAt(0).toUpperCase() + transportation.type.slice(1)}
Details: ${transportation.details}
${transportation.arrivalTime ? `Arrival: ${transportation.arrivalTime}` : ''}
${transportation.departureTime ? `Departure: ${transportation.departureTime}` : ''}
` : ''}

DAILY SCHEDULE:
${itinerary.map(day => `
${formatDate(day.date).toUpperCase()}
${day.activities.map(activity => `  ${activity.time} - ${activity.title}${activity.location ? ` at ${activity.location}` : ''}${activity.duration ? ` (${activity.duration})` : ''}${activity.description ? `\n    ${activity.description}` : ''}`).join('\n')}
`).join('')}

${specialInstructions ? `
SPECIAL INSTRUCTIONS:
${specialInstructions}
` : ''}

EMERGENCY CONTACTS:
${emergencyContacts.map(contact => `${contact.name} - ${contact.role}${contact.phone ? `\nPhone: ${contact.phone}` : ''}${contact.email ? `\nEmail: ${contact.email}` : ''}\n`).join('')}

Safe travels!
Wolthers & Associates Travel Team
  `

  return { subject, html, text }
}

export async function sendGuestItineraryEmail(email: string, data: GuestItineraryData): Promise<{ success: boolean; error?: string }> {
  const template = createGuestItineraryTemplate(data)

  try {
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
