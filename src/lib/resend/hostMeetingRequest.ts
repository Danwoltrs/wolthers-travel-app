import { sendEmail } from './sender'
import { EmailTemplate, HostMeetingRequestData } from './types'

export function createHostMeetingRequestTemplate(data: HostMeetingRequestData): EmailTemplate {
  const {
    hostName,
    companyName,
    meetingTitle,
    meetingDate,
    meetingTime,
    meetingLocation,
    wolthersTeam,
    inviterName,
    acceptUrl,
    declineUrl,
    rescheduleUrl
  } = data

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  const subject = `Meeting Request - ${formatDate(meetingDate)} at ${meetingTime}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Request</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            color: #374151;
            margin: 0;
            padding: 40px 20px;
            background-color: #f9fafb;
          }
          .card {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 32px;
          }
          h1 {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin: 0 0 24px 0;
          }
          .meeting-info {
            background: #f3f4f6;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .info-row {
            display: flex;
            margin-bottom: 8px;
          }
          .info-row:last-child { margin-bottom: 0; }
          .info-label {
            font-weight: 500;
            width: 80px;
            color: #6b7280;
          }
          .buttons {
            text-align: center;
            margin-top: 32px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            margin: 0 8px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
          }
          .accept { background: #059669; color: white; }
          .decline { background: #dc2626; color: white; }
          .reschedule { background: #7c3aed; color: white; }
          .footer {
            margin-top: 32px;
            font-size: 13px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Meeting Request</h1>

          <p>Hi ${hostName},</p>

          <p>We would like to schedule a meeting with ${companyName}.</p>

          <div class="meeting-info">
            <div class="info-row">
              <span class="info-label">Date:</span>
              <span>${formatDate(meetingDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time:</span>
              <span>${meetingTime}</span>
            </div>
            ${meetingLocation ? `
            <div class="info-row">
              <span class="info-label">Location:</span>
              <span>${meetingLocation}</span>
            </div>` : ''}
            ${wolthersTeam.length > 0 ? `
            <div class="info-row">
              <span class="info-label">Team:</span>
              <span>${wolthersTeam.map(member => member.name).join(', ')}</span>
            </div>` : ''}
          </div>

          <div class="buttons">
            <a href="${acceptUrl}" class="button accept">Accept</a>
            <a href="${declineUrl}" class="button decline">Decline</a>
            <a href="${rescheduleUrl}" class="button reschedule">Reschedule</a>
          </div>

          <div class="footer">
            Best regards,<br/>
            ${inviterName}<br/>
            Wolthers & Associates
          </div>
        </div>
      </body>
    </html>`

  const text = `
Meeting Request

Hi ${hostName},

We would like to schedule a meeting with ${companyName}.

Date: ${formatDate(meetingDate)}
Time: ${meetingTime}${meetingLocation ? `
Location: ${meetingLocation}` : ''}${wolthersTeam.length > 0 ? `
Team: ${wolthersTeam.map(member => member.name).join(', ')}` : ''}

Please respond:
Accept: ${acceptUrl}
Decline: ${declineUrl}
Reschedule: ${rescheduleUrl}

Best regards,
${inviterName}
Wolthers & Associates`

  return { subject, html, text }
}

export async function sendHostMeetingRequestEmail(email: string, data: HostMeetingRequestData): Promise<{ success: boolean; error?: string }> {
  const template = createHostMeetingRequestTemplate(data)

  try {
    await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo: data.inviterEmail
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
