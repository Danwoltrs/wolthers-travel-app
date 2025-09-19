import { logoUrl } from './client'
import { sendEmail } from './sender'
import { EmailTemplate, HostVisitConfirmationData } from './types'

const splitFirstName = (value: string): string => {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const segments = trimmed.split(/\s+/)
  return segments[0]
}

const formatList = (names: string[]): string => {
  const filtered = names.filter(Boolean)
  if (filtered.length === 0) return ''
  if (filtered.length === 1) return filtered[0]
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`
  const head = filtered.slice(0, -1).join(', ')
  return `${head}, and ${filtered[filtered.length - 1]}`
}

const stripCompanySuffixes = (value?: string): string => {
  if (!value) return ''
  return value
    .replace(/\b(LTDA\.?|Ltda\.?|Ltd\.?|S\.?A\.?|SA|A\/G|AG|LLC|INC\.?|Incorporated|Corp\.?|Corporation)\b/gi, '')
    .replace(/\b(Exportacao|Exportação|Importacao|Importação|Comercio|Comércio|Industria|Indústria|Agroindustrial|Cooperativa|Holdings?)\b/gi, '')
    .replace(/[()]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const normalizeName = (value?: string): string => {
  if (!value) return ''
  try {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  } catch (error) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  }
}

const namesMatch = (a?: string, b?: string): boolean => {
  const normA = normalizeName(a)
  const normB = normalizeName(b)
  if (!normA || !normB) return false
  return normA === normB
}

const resolveHostLabel = (data: HostVisitConfirmationData): string | undefined => {
  return data.companyFantasyName || data.companyName
}

const resolveGuestLabels = (data: HostVisitConfirmationData, hostLabel?: string) => {
  const filteredGuests = (data.guests || []).filter(guest => !namesMatch(guest, hostLabel))
  const cleanedGuests = filteredGuests
    .map(guest => stripCompanySuffixes(guest))
    .filter(Boolean)

  const guestFirstNames = cleanedGuests.map(splitFirstName).filter(Boolean)
  const leadLabel = cleanedGuests.length > 0 ? splitFirstName(cleanedGuests[0]) || cleanedGuests[0] : undefined

  return {
    cleanedGuests,
    guestFirstNames,
    leadLabel
  }
}

export function createHostVisitConfirmationTemplate(data: HostVisitConfirmationData): EmailTemplate {
  const hostLabel = resolveHostLabel(data)
  const { cleanedGuests, guestFirstNames, leadLabel } = resolveGuestLabels(data, hostLabel)
  const wolthersFirstNames = (data.wolthersTeam || []).map(splitFirstName).filter(Boolean)

  const subject = leadLabel ? `Visit Request by ${leadLabel}` : 'Visit Request from Wolthers & Associates'

  const visitDateLong = new Date(data.visitDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const invitationLine = guestFirstNames.length > 0
    ? `We would like to inform you we are going to be traveling with ${formatList(guestFirstNames)}, and we would like to know if you are able to receive us${hostLabel ? ` at ${hostLabel}` : ''} on ${visitDateLong} at ${data.visitTime}.`
    : `We would like to know if you are able to receive us${hostLabel ? ` at ${hostLabel}` : ''} on ${visitDateLong} at ${data.visitTime}.`

  const wolthersLine = wolthersFirstNames.length > 0
    ? `${formatList(wolthersFirstNames)} from Wolthers will be joining the trip.`
    : 'Our Wolthers team will be joining the trip.'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: #f6f8f7;
            padding: 32px 16px;
            margin: 0;
            color: #1f2a25;
          }
          .card {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 18px;
            border: 1px solid rgba(22, 68, 47, 0.12);
            box-shadow: 0 28px 54px rgba(22, 68, 47, 0.12);
            overflow: hidden;
          }
          .header {
            text-align: center;
            padding: 28px 24px 12px;
          }
          .header img {
            width: 150px;
            height: auto;
          }
          .title {
            margin: 24px 20px 8px;
            font-size: 22px;
            font-weight: 600;
            color: #134631;
            text-align: center;
          }
          .body {
            padding: 0 32px 28px;
          }
          .body p {
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 16px 0;
            color: #28352d;
          }
          .info-box {
            background: #f3f7f4;
            border-radius: 12px;
            padding: 18px 20px;
            margin: 24px 0;
            border: 1px solid rgba(22, 68, 47, 0.1);
          }
          .info-box p {
            margin: 6px 0;
            font-size: 14px;
            color: #1f2a25;
          }
          .action-row {
            text-align: center;
            margin: 32px 0 24px;
          }
          .button {
            display: inline-block;
            padding: 13px 28px;
            margin: 0 10px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            text-decoration: none;
            color: #ffffff;
          }
          .button-yes {
            background: #1f9f55;
          }
          .button-no {
            background: #d23d43;
          }
          .footer {
            text-align: center;
            padding: 0 24px 28px;
            color: #4b5a52;
            font-size: 12px;
          }
          .footer p {
            margin: 6px 0;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img src="${logoUrl}" alt="Wolthers & Associates" />
          </div>
          <h1 class="title">${subject}</h1>
          <div class="body">
            <p>Dear ${data.hostName},</p>
            <p>${invitationLine}</p>
            <p>${wolthersLine}</p>
            <div class="info-box">
              <p><strong>Date:</strong> ${visitDateLong}</p>
              <p><strong>Time:</strong> ${data.visitTime}</p>
              ${hostLabel ? `<p><strong>Host:</strong> ${hostLabel}</p>` : ''}
              ${cleanedGuests.length > 0 ? `<p><strong>Guests:</strong> ${formatList(cleanedGuests)}</p>` : ''}
              <p><strong>Contact:</strong> ${data.inviterEmail}</p>
            </div>
            <div class="action-row">
              <a href="${data.yesUrl}" class="button button-yes">Yes, I can host</a>
              <a href="${data.noUrl}" class="button button-no">No, I am not available</a>
            </div>
          </div>
          <div class="footer">
            <p><strong>Looking forward to seeing you!</strong></p>
            <p>Wolthers & Associates Travel Team</p>
            <p>For questions, please contact our travel team.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

export async function sendHostVisitConfirmationEmail(email: string, data: HostVisitConfirmationData) {
  const template = createHostVisitConfirmationTemplate(data)
  return sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    replyTo: data.inviterEmail
  })
}
