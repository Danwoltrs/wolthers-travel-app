import { sendEmail } from './sender'
import { EmailTemplate, MeetingResponseNotificationData } from './types'

export function createMeetingResponseNotificationTemplate(data: MeetingResponseNotificationData): EmailTemplate {
  const {
    organizerName,
    hostName,
    hostEmail,
    companyName,
    meetingTitle,
    originalDate,
    originalTime,
    responseType,
    responseMessage,
    rescheduleDetails,
    tripTitle,
    tripAccessCode,
    respondedAt
  } = data

  const getResponseColor = () => {
    switch (responseType) {
      case 'accept': return '#10b981'
      case 'decline': return '#ef4444'
      case 'reschedule': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getResponseIcon = () => {
    switch (responseType) {
      case 'accept': return '✅'
      case 'decline': return '❌'
      case 'reschedule': return '🔄'
      default: return '📝'
    }
  }

  const getActionText = () => {
    switch (responseType) {
      case 'accept': return 'accepted'
      case 'decline': return 'declined'
      case 'reschedule': return 'requested to reschedule'
      default: return 'responded to'
    }
  }

  const subject = `Meeting Response: ${hostName} ${getActionText()} "${meetingTitle}"`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Response Notification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #2d3748;
            max-width: 600px;
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
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 32px 24px;
          }
          .response-badge {
            display: inline-flex;
            align-items: center;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            margin: 0 auto 24px auto;
            color: white;
            background-color: ${getResponseColor()};
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          .card h3 {
            margin: 0 0 16px 0;
            color: #2D5347;
            font-size: 18px;
            font-weight: 600;
          }
          .card p {
            margin: 8px 0;
            color: #4a5568;
          }
          .meeting-details {
            background: linear-gradient(135deg, #FEF3C7, #F3E8A6);
            border: none;
            border-left: 4px solid #2D5347;
          }
          .host-details {
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
          }
          .reschedule-card {
            background: #fef3c7;
            border: 1px solid #fbbf24;
          }
          .message-card {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
          }
          .next-steps {
            background: #2D5347;
            color: white;
            margin: 24px 0;
            text-align: left;
          }
          .next-steps h3 {
            color: white;
            margin-bottom: 16px;
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
          .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 600;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${getResponseIcon()} Meeting Response</h1>
            <p>Notification from Host</p>
          </div>

          <div class="content">
            <div style="text-align: center; margin-bottom: 24px;">
              <div class="response-badge">
                ${getResponseIcon()} Meeting ${responseType.charAt(0).toUpperCase() + responseType.slice(1)}
              </div>
            </div>

            <p>Hello ${organizerName},</p>
            <p><strong>${hostName}</strong> from <strong>${companyName}</strong> has ${getActionText()} the meeting invitation.</p>

            <div class="card meeting-details">
              <h3>📋 Meeting Details</h3>
              <p><strong>Meeting:</strong> ${meetingTitle}</p>
              <p><strong>Scheduled:</strong> ${originalDate} at ${originalTime}</p>
              ${tripTitle ? `<p><strong>Trip:</strong> ${tripTitle} ${tripAccessCode ? `(${tripAccessCode})` : ''}</p>` : ''}
              <p><strong>Response Date:</strong> ${new Date(respondedAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} at ${new Date(respondedAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <div class="card host-details">
              <h3>🏢 Host Information</h3>
              <p><strong>Contact:</strong> ${hostName}</p>
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Email:</strong> <a href="mailto:${hostEmail}" style="color: #2D5347;">${hostEmail}</a></p>
            </div>

            ${responseType === 'reschedule' && rescheduleDetails ? `
            <div class="card reschedule-card">
              <h3>🔄 Reschedule Request</h3>
              ${rescheduleDetails.requestedDate ? `<p><strong>Requested Date:</strong> ${rescheduleDetails.requestedDate}</p>` : ''}
              ${rescheduleDetails.requestedTime ? `<p><strong>Requested Time:</strong> ${rescheduleDetails.requestedTime}</p>` : ''}
              ${!rescheduleDetails.requestedDate && !rescheduleDetails.requestedTime ?
                '<p><em>No specific time requested. See message below for details.</em></p>' : ''}
            </div>
            ` : ''}

            ${responseMessage && responseMessage !== `Meeting ${responseType}ed` && responseMessage !== `Meeting ${responseType}ed via direct link` ? `
            <div class="card message-card">
              <h3>💬 Host's Message</h3>
              <p style="font-style: italic;">"${responseMessage}"</p>
            </div>
            ` : ''}

            <div class="card next-steps">
              <h3>📋 Recommended Next Steps</h3>
              ${responseType === 'accept' ? `
                <ul>
                  <li>Send calendar invitation with meeting details</li>
                  <li>Confirm meeting location and any required preparations</li>
                  <li>Share agenda or materials if needed</li>
                  <li>Add meeting to trip itinerary if applicable</li>
                </ul>
              ` : responseType === 'decline' ? `
                <ul>
                  <li>Acknowledge their decision respectfully</li>
                  <li>Remove meeting from trip itinerary</li>
                  <li>Consider alternative engagement opportunities</li>
                  <li>Update trip participants about the change</li>
                </ul>
              ` : `
                <ul>
                  <li>Review your schedule for alternative times</li>
                  <li>Contact ${hostName} to coordinate new timing</li>
                  <li>Consider their requested preferences above</li>
                  <li>Send updated meeting invitation once confirmed</li>
                </ul>
              `}
            </div>

            <div class="card" style="text-align: center; border: 2px solid #2D5347;">
              <h3>📞 Quick Actions</h3>
              <p style="margin-bottom: 16px;">Reach out to ${hostName} directly:</p>
              <a href="mailto:${hostEmail}"
                 style="display: inline-block; padding: 12px 24px; background: #2D5347; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 8px;">
                📧 Email ${hostName}
              </a>
            </div>
          </div>

          <div class="footer">
            <p><strong>Wolthers & Associates Travel Management System</strong></p>
            <p style="margin-top: 12px; font-size: 12px; color: #9ca3af;">
              This notification was automatically generated when ${hostName} responded to the meeting invitation.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
MEETING RESPONSE NOTIFICATION

${hostName} from ${companyName} has ${getActionText()} the meeting invitation.

MEETING DETAILS:
Meeting: ${meetingTitle}
Scheduled: ${originalDate} at ${originalTime}
${tripTitle ? `Trip: ${tripTitle} ${tripAccessCode ? `(${tripAccessCode})` : ''}` : ''}
Response Date: ${new Date(respondedAt).toLocaleDateString()} at ${new Date(respondedAt).toLocaleTimeString()}

HOST INFORMATION:
Contact: ${hostName}
Company: ${companyName}
Email: ${hostEmail}

${responseType === 'reschedule' && rescheduleDetails ? `
RESCHEDULE REQUEST:
${rescheduleDetails.requestedDate ? `Requested Date: ${rescheduleDetails.requestedDate}` : ''}
${rescheduleDetails.requestedTime ? `Requested Time: ${rescheduleDetails.requestedTime}` : ''}
` : ''}

${responseMessage && responseMessage !== `Meeting ${responseType}ed` ? `
HOST'S MESSAGE:
"${responseMessage}"
` : ''}

RECOMMENDED NEXT STEPS:
${responseType === 'accept' ? `
- Send calendar invitation with meeting details
- Confirm meeting location and preparations
- Share agenda or materials if needed
- Add meeting to trip itinerary if applicable
` : responseType === 'decline' ? `
- Acknowledge their decision respectfully
- Remove meeting from trip itinerary
- Consider alternative engagement opportunities
- Update trip participants about the change
` : `
- Review your schedule for alternative times
- Contact ${hostName} to coordinate new timing
- Consider their requested preferences
- Send updated meeting invitation once confirmed
`}

Contact ${hostName} directly: ${hostEmail}

---
Wolthers & Associates Travel Management System
This notification was automatically generated.
  `

  return { subject, html, text }
}
export async function sendMeetingResponseNotification(
  organizerEmail: string,
  data: MeetingResponseNotificationData
): Promise<{ success: boolean; error?: string }> {
  const template = createMeetingResponseNotificationTemplate(data)

  try {
    await sendEmail({
      to: organizerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: data.hostEmail
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
