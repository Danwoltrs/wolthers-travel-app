import { baseUrl } from './client'
import { sendEmail } from './sender'
import { EmailTemplate, TripChangeNotificationData } from './types'

export function createTripChangeNotificationTemplate(data: TripChangeNotificationData): EmailTemplate {
  const {
    tripTitle,
    tripAccessCode,
    tripDate,
    organizerName,
    recipientName,
    changes,
    summaryDate,
    totalChanges
  } = data

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'activity_added': return '🆕'
      case 'activity_deleted': return '🗑️'
      case 'activity_modified': return '✏️'
      case 'time_changed': return '⏰'
      case 'location_changed': return '📍'
      case 'participant_added': return '👤'
      case 'participant_removed': return '👥'
      default: return '📝'
    }
  }

  const getChangePriority = (type: string) => {
    switch (type) {
      case 'activity_deleted':
      case 'time_changed':
      case 'location_changed':
        return 'high'
      case 'activity_added':
      case 'activity_modified':
        return 'medium'
      case 'participant_added':
      case 'participant_removed':
        return 'low'
      default:
        return 'medium'
    }
  }

  const subject = totalChanges === 1 
    ? `Trip Update: ${tripTitle} - 1 change`
    : `Trip Update: ${tripTitle} - ${totalChanges} changes`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Update Notification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #2d3748;
            max-width: 650px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7fafc;
            font-size: 14px;
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
            font-size: 24px;
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
          .trip-overview {
            background: linear-gradient(135deg, #FEF3C7, #F3E8A6);
            border-left: 4px solid #2D5347;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .trip-overview h2 {
            margin: 0 0 8px 0;
            color: #2D5347;
            font-size: 20px;
          }
          .changes-summary {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
          }
          .changes-summary h3 {
            margin: 0 0 16px 0;
            color: #2D5347;
            font-size: 18px;
            font-weight: 600;
          }
          .change-item {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin: 12px 0;
            border-left: 4px solid transparent;
          }
          .change-item.priority-high {
            border-left-color: #ef4444;
            background: #fef2f2;
          }
          .change-item.priority-medium {
            border-left-color: #f59e0b;
            background: #fffbeb;
          }
          .change-item.priority-low {
            border-left-color: #10b981;
            background: #f0fdf4;
          }
          .change-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
          }
          .change-icon {
            font-size: 18px;
            margin-right: 8px;
          }
          .change-title {
            font-weight: 600;
            color: #2D5347;
            font-size: 16px;
            margin: 0;
          }
          .change-details {
            color: #4a5568;
            margin: 8px 0;
            font-size: 14px;
          }
          .change-meta {
            color: #718096;
            font-size: 12px;
            margin-top: 8px;
            display: flex;
            gap: 16px;
          }
          .next-steps {
            background: #2D5347;
            color: white;
            padding: 24px;
            border-radius: 8px;
            margin: 24px 0;
          }
          .next-steps h3 {
            margin: 0 0 16px 0;
            color: white;
            font-size: 18px;
          }
          .next-steps p, .next-steps li {
            color: white;
            opacity: 0.9;
          }
          .next-steps ul {
            margin: 12px 0;
            padding-left: 20px;
          }
          .next-steps li {
            margin: 6px 0;
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
            .change-meta {
              flex-direction: column;
              gap: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Trip Update</h1>
            <div class="trip-code">${tripAccessCode}</div>
          </div>

          <div class="content">
            <p>Hello ${recipientName},</p>
            <p>There ${totalChanges === 1 ? 'has been' : 'have been'} ${totalChanges} ${totalChanges === 1 ? 'change' : 'changes'} to your trip since yesterday. Here's a summary:</p>

            <div class="trip-overview">
              <h2>${tripTitle}</h2>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Trip Date: ${tripDate}</p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Organized by ${organizerName}</p>
            </div>

            <div class="changes-summary">
              <h3>Changes Made on ${summaryDate}</h3>

              ${changes.map(change => `
                <div class="change-item priority-${getChangePriority(change.type)}">
                  <div class="change-header">
                    <span class="change-icon">${getChangeIcon(change.type)}</span>
                    <h4 class="change-title">${change.description}</h4>
                  </div>
                  <p class="change-details">${change.details}</p>
                  <div class="change-meta">
                    ${change.time ? `<span>⏰ ${change.time}</span>` : ''}
                    ${change.location ? `<span>📍 ${change.location}</span>` : ''}
                    ${change.previousValue && change.newValue ? `<span>Changed from "${change.previousValue}" to "${change.newValue}"</span>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="next-steps">
              <h3>📋 What You Need to Know</h3>
              <ul>
                <li>Review the changes above and adjust your schedule if necessary</li>
                <li>Contact ${organizerName} if you have questions about any changes</li>
                <li>Check your calendar and transportation arrangements for affected times</li>
                <li>Inform any additional attendees about the updates</li>
              </ul>
              <p style="margin-top: 16px;">You can view the complete updated itinerary by visiting the trip dashboard.</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${baseUrl}/trips/${tripAccessCode}" 
                 style="display: inline-block; padding: 12px 24px; background: #2D5347; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Updated Trip
              </a>
            </div>

            <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
              This is your daily summary of trip changes. You'll receive these notifications only when changes occur.
            </p>
          </div>

          <div class="footer">
            <p><strong>Wolthers & Associates Travel Team</strong></p>
            <p style="margin-top: 12px; font-size: 12px; color: #9ca3af;">
              This notification was automatically generated at the end of the day. For urgent matters, contact ${organizerName} directly.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
TRIP UPDATE NOTIFICATION

${tripTitle} (${tripAccessCode})
Trip Date: ${tripDate}
Organized by: ${organizerName}

Hello ${recipientName},

There ${totalChanges === 1 ? 'has been' : 'have been'} ${totalChanges} ${totalChanges === 1 ? 'change' : 'changes'} to your trip since yesterday:

CHANGES MADE ON ${summaryDate.toUpperCase()}:
${changes.map(change => `
${getChangeIcon(change.type)} ${change.description}
   ${change.details}
   ${change.time ? `Time: ${change.time}` : ''}
   ${change.location ? `Location: ${change.location}` : ''}
   ${change.previousValue && change.newValue ? `Changed from "${change.previousValue}" to "${change.newValue}"` : ''}
`).join('')}

WHAT YOU NEED TO KNOW:
- Review the changes above and adjust your schedule if necessary
- Contact ${organizerName} if you have questions about any changes
- Check your calendar and transportation arrangements for affected times
- Inform any additional attendees about the updates

View Updated Trip: ${baseUrl}/trips/${tripAccessCode}

---
Wolthers & Associates Travel Team
This notification was automatically generated at the end of the day.
  `

  return { subject, html, text }
}
export async function sendTripChangeNotificationEmail(
  email: string,
  data: TripChangeNotificationData
): Promise<{ success: boolean; error?: string }> {
  const template = createTripChangeNotificationTemplate(data)

  try {
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: data.organizerEmail
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
