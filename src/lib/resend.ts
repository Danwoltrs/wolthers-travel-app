import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/images/logos/wolthers-logo-green.png`;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// --- INTERFACES ---

interface BaseEmailData {
  tripTitle: string;
  tripAccessCode: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface TripCreationEmailData extends BaseEmailData {
  createdBy: string;
  recipients: Array<{ name: string; email: string; role?: string }>;
}

export interface TripCancellationEmailData extends BaseEmailData {
  cancelledBy: string;
  cancellationReason?: string;
  stakeholders: Array<{ name: string; email: string; role?: string }>;
}

export interface TripItineraryEmailData {
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  createdBy: string
  itinerary: Array<{
    date: string
    activities: Array<{
      time: string
      title: string
      location?: string
      duration?: string
    }>
  }>
  participants: Array<{
    name: string
    email: string
    role?: string
  }>
  companies: Array<{
    name: string
    representatives?: Array<{
      name: string
      email: string
    }>
  }>
  vehicle?: {
    make: string
    model: string
    licensePlate?: string
  }
  driver?: {
    name: string
    phone?: string
  }
}

export interface StaffInvitationEmailData extends BaseEmailData {
  inviterName: string
  inviterEmail: string
  newStaffName: string
  role: string
  tripTitle?: string
  whatsApp?: string
}

export interface HostInvitationEmailData extends BaseEmailData {
  hostName: string;
  companyName: string;
  inviterName: string;
  inviterEmail: string;
  wolthersTeam: Array<{ name: string; role?: string }>;
  visitDate?: string;
  visitTime?: string;
}

export interface HostVisitConfirmationData extends BaseEmailData {
  hostName: string;
  companyName: string;
  visitDate: string;
  visitTime: string;
  guests: string[];
  inviterName: string;
  inviterEmail: string;
  yesUrl: string;
  noUrl: string;
}

export interface HostMeetingRequestData {
  hostName: string
  hostEmail: string
  companyName: string
  meetingTitle: string
  meetingDate: string
  meetingTime: string
  meetingDuration?: string
  meetingLocation?: string
  meetingDescription?: string
  wolthersTeam: Array<{
    name: string
    role?: string
  }>
  tripTitle?: string
  tripAccessCode?: string
  inviterName: string
  inviterEmail: string
  acceptUrl: string
  declineUrl: string
  rescheduleUrl: string
  personalMessage?: string
  whatsApp?: string
}

export interface GuestItineraryData {
  guestName: string
  guestEmail: string
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  createdBy: string
  itinerary: Array<{
    date: string
    activities: Array<{
      time: string
      title: string
      location?: string
      duration?: string
      type?: 'meeting' | 'transport' | 'meal' | 'activity' | 'accommodation'
      description?: string
    }>
  }>
  accommodation?: {
    name: string
    address?: string
    phone?: string
    checkIn?: string
    checkOut?: string
  }
  transportation?: {
    type: 'flight' | 'train' | 'car' | 'other'
    details: string
    arrivalTime?: string
    departureTime?: string
  }
  emergencyContacts: Array<{
    name: string
    role: string
    phone?: string
    email?: string
  }>
  specialInstructions?: string
}

export interface VisitDeclinedData extends BaseEmailData {
  creatorName: string;
  hostName: string;
  companyName: string;
  visitDate: string;
}

export interface NewTimeProposedData extends BaseEmailData {
  creatorName: string;
  hostName: string;
  newDate: string;
  newTime: string;
}

// --- BASE TEMPLATE ---

function createBaseTemplate(subject: string, title: string, content: string, tripAccessCode?: string) {
  const tripLinkContent = tripAccessCode
    ? `
    <div style="text-align: center; margin-top: 30px;">
      <a href="${baseUrl}/trips/${tripAccessCode}" style="display: inline-block; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; background-color: #004d40; color: white;">View Trip Details</a>
    </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${subject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; line-height: 1.5; color: #333; max-width: 600px; margin: 20px auto; padding: 20px; background-color: #f7f7f7; font-size: 14px; }
          .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          .logo-container { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e9e9e9; margin-bottom: 20px; }
          h1 { font-size: 22px; color: #1a202c; margin-bottom: 10px; }
          p { color: #4a5568; }
          .details-box { background: #f7fafc; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .footer { text-align: center; color: #718096; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9e9e9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-container">
            <img src="${logoUrl}" alt="Wolthers & Associates Logo" style="max-width: 160px; margin: 0 auto;" />
          </div>
          <h1>${title}</h1>
          ${content}
          ${tripLinkContent}
          <div class="footer">
            <p>This is an automated message from the Wolthers Travel Platform.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// --- TEMPLATE CREATORS ---

export function createTripCreationTemplate(data: TripCreationEmailData): EmailTemplate {
  const subject = `You've been added to a new trip: ${data.tripTitle}`;
  const content = `
    <p>You have been added as a participant for the trip "<strong>${data.tripTitle}</strong>" by ${data.createdBy}.</p>
    <div class="details-box">
      <p><strong>Trip Code:</strong> ${data.tripAccessCode}</p>
    </div>
  `;
  const html = createBaseTemplate(subject, 'New Trip Assignment', content, data.tripAccessCode);
  return { subject, html };
}

export function createTripCancellationTemplate(data: TripCancellationEmailData): EmailTemplate {
  const subject = `Trip Cancelled: ${data.tripTitle}`;
  const content = `
    <p>The trip "<strong>${data.tripTitle}</strong>" has been cancelled by ${data.cancelledBy}.</p>
    <div class="details-box">
      <p><strong>Trip Code:</strong> ${data.tripAccessCode}</p>
      ${data.cancellationReason ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
    </div>
    <p>Please adjust your schedule accordingly.</p>
  `;
  const html = createBaseTemplate(subject, 'Trip Cancellation Notice', content);
  return { subject, html };
}

/**
 * Generate trip itinerary email template (NEW - replaces the ugly trip creation template)
 */
export function createTripItineraryTemplate(data: TripItineraryEmailData): EmailTemplate {
  const { tripTitle, tripAccessCode, tripStartDate, tripEndDate, createdBy, itinerary, participants, companies, vehicle, driver } = data

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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

  const subject = `${tripTitle} - ${formatDateRange(tripStartDate, tripEndDate)}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Itinerary</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 16px;
            background-color: #f9f9f9;
            font-size: 13px;
          }
          .container {
            background: white;
            padding: 0;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #2D5347, #1a4c42);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
          }
          .header .trip-code {
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            letter-spacing: 1px;
          }
          .content {
            padding: 20px;
          }
          .trip-overview {
            background: linear-gradient(135deg, #FEF3C7, #F3E8A6);
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
            border-left: 3px solid #2D5347;
          }
          .itinerary-section {
            background: #f8fafc;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
          }
          .day-section {
            margin: 12px 0;
            border-left: 2px solid #2D5347;
            padding-left: 12px;
          }
          .day-header {
            background: #2D5347;
            color: white;
            padding: 8px 12px;
            margin-left: -14px;
            margin-bottom: 8px;
            border-radius: 0 4px 4px 0;
            font-weight: 600;
            font-size: 14px;
          }
          .activity {
            background: white;
            padding: 10px;
            margin: 6px 0;
            border-radius: 4px;
            border-left: 2px solid #FEF3C7;
            display: flex;
            align-items: flex-start;
            gap: 10px;
          }
          .activity-time {
            background: #2D5347;
            color: white;
            padding: 6px 8px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 11px;
            font-weight: 600;
            min-width: 60px;
            text-align: center;
            flex-shrink: 0;
          }
          .activity-details {
            flex: 1;
          }
          .activity-title {
            font-weight: 600;
            color: #2D5347;
            margin: 0 0 3px 0;
            font-size: 13px;
          }
          .activity-location {
            color: #666;
            font-size: 11px;
            margin: 0;
          }
          .logistics-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 16px 0;
          }
          .logistics-card {
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #f0f0f0;
          }
          .logistics-card h4 {
            margin: 0 0 8px 0;
            color: #2D5347;
            font-size: 13px;
            font-weight: 600;
          }
          .participants-section {
            background: #f0f9ff;
            padding: 12px;
            border-radius: 6px;
            margin: 16px 0;
          }
          .participants-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 8px;
          }
          .participant-group h5 {
            color: #2D5347;
            margin: 0 0 6px 0;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .participant-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          .participant-list li {
            padding: 2px 0;
            font-size: 11px;
            color: #555;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 20px;
            padding: 16px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
          }
          .contact-info {
            background: #2D5347;
            color: white;
            padding: 12px;
            border-radius: 6px;
            margin: 16px 0;
            text-align: center;
          }
          @media (max-width: 600px) {
            .logistics-section,
            .participants-grid {
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
            <h1>Trip Itinerary</h1>
            <div class="trip-code">${tripAccessCode}</div>
          </div>

          <div class="content">
            <div class="trip-overview">
              <h2 style="margin: 0 0 15px 0; color: #2D5347;">${tripTitle}</h2>
              <p style="margin: 0; font-size: 14px;"><strong>${new Date(tripStartDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(tripEndDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>
              <p style="margin: 8px 0 0 0; color: #666; font-size: 13px;">Organized by ${createdBy}</p>
            </div>

            <div class="itinerary-section">
              <h3 style="margin: 0 0 20px 0; color: #2D5347; font-size: 18px;">Daily Schedule</h3>

              ${itinerary.map(day => `
                <div class="day-section">
                  <div class="day-header">
                    ${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  ${day.activities.map(activity => `
                    <div class="activity">
                      <div class="activity-time">${activity.time}</div>
                      <div class="activity-details">
                        <h4 class="activity-title">${activity.title}</h4>
                        ${activity.location ? `<p class="activity-location">${activity.location}</p>` : ''}
                        ${activity.duration ? `<p class="activity-location">Duration: ${activity.duration}</p>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>

            <div class="logistics-section">
              ${vehicle ? `
              <div class="logistics-card">
                <h4>Transportation</h4>
                <p style="margin: 5px 0;"><strong>${vehicle.make} ${vehicle.model}</strong></p>
                ${vehicle.licensePlate ? `<p style="margin: 5px 0; color: #666; font-family: monospace;">${vehicle.licensePlate}</p>` : ''}
                ${driver ? `<p style="margin: 10px 0 5px 0; color: #2D5347; font-weight: 600;">Driver: ${driver.name}</p>` : ''}
                ${driver?.phone ? `<p style="margin: 5px 0; color: #666;">${driver.phone}</p>` : ''}
              </div>
              ` : ''}

              <div class="logistics-card">
                <h4>Emergency Contact</h4>
                <p style="margin: 5px 0;"><strong>${createdBy}</strong></p>
                <p style="margin: 5px 0; color: #666;">Wolthers & Associates</p>
                <p style="margin: 10px 0 5px 0; color: #2D5347;">trips@trips.wolthers.com</p>
              </div>
            </div>

            <div class="participants-section">
              <h3 style="margin: 0 0 15px 0; color: #2D5347; font-size: 16px;">Trip Participants</h3>
              <div class="participants-grid">
                ${participants.length > 0 ? `
                <div class="participant-group">
                  <h5>Wolthers Team</h5>
                  <ul class="participant-list">
                    ${participants.map(p => `<li>• ${p.name}${p.role ? ` (${p.role})` : ''}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}

                ${companies.length > 0 ? `
                <div class="participant-group">
                  <h5>Traveling Companies</h5>
                  <ul class="participant-list">
                    ${companies.map(c => `<li>• ${c.name}</li>`).join('')}
                  </ul>
                </div>
                ` : ''}
              </div>
            </div>

            <div class="contact-info">
              <h4 style="margin: 0 0 10px 0; font-size: 15px;">Need Help During Your Trip?</h4>
              <p style="margin: 0; font-size: 13px;">Contact ${createdBy} or email <strong>trips@trips.wolthers.com</strong></p>
            </div>
          </div>

          <div class="footer">
            <p style="font-size: 14px;"><strong>Safe travels!</strong><br/>
            <strong>Wolthers & Associates Travel Team</strong></p>
            <p style="font-size: 11px; color: #999; margin-top: 12px;">
              This itinerary was generated automatically. For changes or questions, contact your trip organizer.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
TRIP ITINERARY

${tripTitle}
Trip Code: ${tripAccessCode}
Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}
Organized by: ${createdBy}

DAILY SCHEDULE:
${itinerary.map(day => `
${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
${day.activities.map(activity => `  ${activity.time} - ${activity.title}${activity.location ? ` at ${activity.location}` : ''}${activity.duration ? ` (${activity.duration})` : ''}`).join('\n')}
`).join('\n')}

TRANSPORTATION:
${vehicle ? `Vehicle: ${vehicle.make} ${vehicle.model}${vehicle.licensePlate ? ` (${vehicle.licensePlate})` : ''}` : 'TBD'}
${driver ? `Driver: ${driver.name}${driver.phone ? ` - ${driver.phone}` : ''}` : ''}

PARTICIPANTS:
${participants.length > 0 ? `Wolthers Team:\n${participants.map(p => `- ${p.name}${p.role ? ` (${p.role})` : ''}`).join('\n')}` : ''}
${companies.length > 0 ? `\nTraveling Companies:\n${companies.map(c => `- ${c.name}`).join('\n')}` : ''}

EMERGENCY CONTACT:
${createdBy} - trips@trips.wolthers.com

Safe travels!
Wolthers & Associates Travel Team
  `

  return { subject, html, text }
}
export function createStaffInvitationTemplate(data: StaffInvitationEmailData): EmailTemplate {
  const subject = `You've been invited to the trip: ${data.tripTitle}`;
  const content = `
    <p>Hello ${data.newStaffName},</p>
    <p>You have been invited by ${data.inviterName} to join the trip "<strong>${data.tripTitle}</strong>" as a ${data.role}.</p>
  `;
  const html = createBaseTemplate(subject, 'Trip Invitation', content, data.tripAccessCode);
  return { subject, html };
}

export function createHostInvitationTemplate(data: HostInvitationEmailData): EmailTemplate {
  const subject = `Visit Request for ${data.tripTitle}`;
  const content = `
    <p>Dear ${data.hostName},</p>
    <p>${data.inviterName} from Wolthers & Associates invites you to host a visit at <strong>${data.companyName}</strong> as part of the trip "<strong>${data.tripTitle}</strong>".</p>
    <div class="details-box">
        <p><strong>Trip Code:</strong> ${data.tripAccessCode}</p>
        ${data.visitDate ? `<p><strong>Proposed Date:</strong> ${data.visitDate}</p>` : ''}
        ${data.visitTime ? `<p><strong>Proposed Time:</strong> ${data.visitTime}</p>` : ''}
    </div>
    <p>Please contact ${data.inviterName} at ${data.inviterEmail} to coordinate.</p>
  `;
  const html = createBaseTemplate(subject, 'Visit Request', content, data.tripAccessCode);
  return { subject, html };
}

export function createHostVisitConfirmationTemplate(data: HostVisitConfirmationData): EmailTemplate {
  const subject = `Confirmation Required for visit during ${data.tripTitle}`;
  const content = `
    <p>Dear ${data.hostName},</p>
    <p>As part of the "<strong>${data.tripTitle}</strong>" trip, please confirm your availability for the following visit:</p>
    <div class="details-box">
      <p><strong>Company:</strong> ${data.companyName}</p>
      <p><strong>Date:</strong> ${data.visitDate}</p>
      <p><strong>Time:</strong> ${data.visitTime}</p>
      <p><strong>Attendees:</strong> ${data.guests.join(', ')}</p>
    </div>
    <p>Please confirm if you can host the visit at this time:</p>
    <div style="margin: 30px 0; text-align: center;">
      <a href="${data.yesUrl}" style="display: inline-block; padding: 12px 25px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: 600; background: #28a745; color: white;">Yes, I can host</a>
      <a href="${data.noUrl}" style="display: inline-block; padding: 12px 25px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: 600; background: #dc3545; color: white;">No, I am not available</a>
    </div>
  `;
  const html = createBaseTemplate(subject, 'Visit Confirmation Request', content);
  return { subject, html };
}

export function createVisitDeclinedTemplate(data: VisitDeclinedData): EmailTemplate {
  const subject = `Action Required: A visit for "${data.tripTitle}" was declined`;
  const content = `
    <p>Hi ${data.creatorName},</p>
    <p>This is a notification that <strong>${data.hostName}</strong> from <strong>${data.companyName}</strong> has declined the proposed visit on ${data.visitDate}.</p>
    <p>The host has been asked to propose an alternative time. You may also want to contact them directly to reschedule.</p>
  `;
  const html = createBaseTemplate(subject, 'Visit Declined', content, data.tripAccessCode);
  return { subject, html };
}

export function createNewTimeProposedTemplate(data: NewTimeProposedData): EmailTemplate {
  const subject = `New Time Proposed for: ${data.tripTitle}`;
  const content = `
    <p>Hi ${data.creatorName},</p>
    <p><strong>${data.hostName}</strong> has proposed a new time for a meeting during the "<strong>${data.tripTitle}</strong>" trip.</p>
    <div class="details-box">
      <p><strong>Proposed Date:</strong> ${data.newDate}</p>
      <p><strong>Proposed Time:</strong> ${data.newTime}</p>
    </div>
    <p>Please review this new time and update the trip schedule if it is suitable.</p>
  `;
  const html = createBaseTemplate(subject, 'New Time Proposed', content, data.tripAccessCode);
  return { subject, html };
}

// --- SENDER FUNCTIONS ---

// Add delay function to prevent rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function sendEmail(to: string | string[], subject: string, html: string, reply_to?: string) {
  try {
    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>', // Fixed: Use consistent sender address
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      reply_to,
    });
    if (result.error) {
      console.error(`[Resend] Failed to send email to ${to}:`, result.error);
      throw new Error(result.error.message);
    }
    console.log(`[Resend] Email sent successfully to ${to}`);

    // Add delay after successful send to prevent rate limiting
    await delay(1000); // 1 second delay between emails

    return result;
  } catch (error) {
    console.error(`[Resend] Exception sending email to ${to}:`, error);

    // If rate limited, wait longer and retry once
    if (error instanceof Error && error.message.includes('rate limit')) {
      console.log(`[Resend] Rate limited, waiting 10 seconds and retrying...`);
      await delay(10000); // 10 second delay for rate limit

      try {
        const retryResult = await resend.emails.send({
          from: 'Wolthers Travel <trips@trips.wolthers.com>',
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          reply_to,
        });

        if (retryResult.error) {
          throw new Error(retryResult.error.message);
        }

        console.log(`[Resend] Email sent successfully on retry to ${to}`);
        await delay(1000); // Delay after retry too
        return retryResult;
      } catch (retryError) {
        console.error(`[Resend] Retry also failed:`, retryError);
        throw retryError;
      }
    }

    throw error;
  }
}

export async function sendTripCreationEmails(data: TripCreationEmailData) {
  const template = createTripCreationTemplate(data);
  const recipients = data.recipients.map(r => r.email);

  // For multiple recipients, send individually with delays to avoid rate limits
  if (recipients.length > 3) {
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      try {
        const result = await sendEmail(recipients[i], template.subject, template.html);
        results.push(result);

        // Extra delay between recipients for large batches
        if (i < recipients.length - 1) {
          await delay(2000); // 2 second delay between individual sends
        }
      } catch (error) {
        console.error(`Failed to send to ${recipients[i]}:`, error);
        results.push({ error });
      }
    }
    return results;
  }

  return sendEmail(recipients, template.subject, template.html);
}

export async function sendTripCancellationEmails(data: TripCancellationEmailData) {
  const template = createTripCancellationTemplate(data);
  const recipients = data.stakeholders.map(s => s.email);

  // For multiple recipients, send individually with delays to avoid rate limits
  if (recipients.length > 3) {
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      try {
        const result = await sendEmail(recipients[i], template.subject, template.html);
        results.push(result);

        // Extra delay between recipients for large batches
        if (i < recipients.length - 1) {
          await delay(2000); // 2 second delay between individual sends
        }
      } catch (error) {
        console.error(`Failed to send to ${recipients[i]}:`, error);
        results.push({ error });
      }
    }
    return results;
  }

  return sendEmail(recipients, template.subject, template.html);
}

/**
 * Send trip itinerary emails to guests and Wolthers staff (NEW - replaces ugly trip creation emails)
 */
export async function sendTripItineraryEmails(data: TripItineraryEmailData): Promise<{ success: boolean; errors: string[] }> {
  const template = createTripItineraryTemplate(data)
  const errors: string[] = []
  let successCount = 0

  // Collect all recipient emails (participants + company representatives)
  const recipients: Array<{ name: string; email: string }> = [
    ...data.participants,
    ...data.companies.flatMap(c => c.representatives || [])
  ]

  console.log(`📧 [Resend] Sending itinerary emails to ${recipients.length} recipients`)

  for (const recipient of recipients) {
    try {
      const result = await resend.emails.send({
        from: 'Wolthers Travel <trips@trips.wolthers.com>',
        to: [recipient.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      if (result.error) {
        console.error(`❌ [Resend] Failed to send itinerary to ${recipient.email}:`, result.error)
        errors.push(`${recipient.name} (${recipient.email}): ${result.error.message}`)
      } else {
        console.log(`✅ [Resend] Sent itinerary email to ${recipient.name} (${recipient.email})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ [Resend] Exception sending itinerary to ${recipient.email}:`, error)
      errors.push(`${recipient.name} (${recipient.email}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log(`📧 [Resend] Itinerary email summary: ${successCount}/${recipients.length} sent successfully`)

  return {
    success: errors.length === 0,
    errors
  }
}

/**
 * Generate host meeting request email template - minimalistic card design
 */
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    })
  }

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

/**
 * Generate guest itinerary email template - minimalistic card design
 */
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

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

/**
 * Send host meeting request email
 */
export async function sendHostMeetingRequestEmail(email: string, data: HostMeetingRequestData): Promise<{ success: boolean; error?: string }> {
  const template = createHostMeetingRequestTemplate(data)

  try {
    console.log(`📧 [Resend] Sending meeting request to ${email} for ${data.companyName}`)

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: data.inviterEmail
    })

    if (result.error) {
      console.error(`❌ [Resend] Failed to send meeting request to ${email}:`, result.error)
      return {
        success: false,
        error: result.error.message
      }
    } else {
      console.log(`✅ [Resend] Sent meeting request to ${data.hostName} at ${data.companyName} (${email})`)
      return { success: true }
    }
  } catch (error) {
    console.error(`❌ [Resend] Exception sending meeting request to ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send guest itinerary email
 */
export async function sendGuestItineraryEmail(email: string, data: GuestItineraryData): Promise<{ success: boolean; error?: string }> {
  const template = createGuestItineraryTemplate(data)

  try {
    console.log(`📧 [Resend] Sending itinerary to ${email} for ${data.tripTitle}`)

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
      text: template.text
    })

    if (result.error) {
      console.error(`❌ [Resend] Failed to send itinerary to ${email}:`, result.error)
      return {
        success: false,
        error: result.error.message
      }
    } else {
      console.log(`✅ [Resend] Sent itinerary to ${data.guestName} (${email})`)
      return { success: true }
    }
  } catch (error) {
    console.error(`❌ [Resend] Exception sending itinerary to ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Meeting response notification email templates and functions
 */

export interface MeetingResponseNotificationData {
  organizerName: string
  organizerEmail: string
  hostName: string
  hostEmail: string
  companyName: string
  meetingTitle: string
  originalDate: string
  originalTime: string
  responseType: 'accept' | 'decline' | 'reschedule'
  responseMessage?: string
  rescheduleDetails?: {
    requestedDate?: string
    requestedTime?: string
  }
  tripTitle?: string
  tripAccessCode?: string
  respondedAt: string
}

/**
 * Generate meeting response notification email template for organizers
 */
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

/**
 * Send meeting response notification to organizer
 */
export async function sendMeetingResponseNotification(
  organizerEmail: string,
  data: MeetingResponseNotificationData
): Promise<{ success: boolean; error?: string }> {
  const template = createMeetingResponseNotificationTemplate(data)

  try {
    console.log(`📧 [Resend] Sending meeting response notification to organizer: ${organizerEmail}`)

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [organizerEmail],
      subject: template.subject,
      html: template.html,
      text: template.text,
      // Add reply-to as host email for easy response
      reply_to: data.hostEmail
    })

    if (result.error) {
      console.error(`❌ [Resend] Failed to send meeting response notification:`, result.error)
      return {
        success: false,
        error: result.error.message
      }
    } else {
      console.log(`✅ [Resend] Sent meeting response notification to ${organizerEmail}`)
      return { success: true }
    }
  } catch (error) {
    console.error(`❌ [Resend] Exception sending meeting response notification:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function sendStaffInvitationEmail(email: string, data: StaffInvitationEmailData) {
  const template = createStaffInvitationTemplate(data);
  return sendEmail(email, template.subject, template.html);
}

export async function sendHostInvitationEmail(email: string, data: HostInvitationEmailData) {
  const template = createHostInvitationTemplate(data);
  return sendEmail(email, template.subject, template.html, data.inviterEmail);
}

export async function sendHostVisitConfirmationEmail(email: string, data: HostVisitConfirmationData) {
  const template = createHostVisitConfirmationTemplate(data);
  return sendEmail(email, template.subject, template.html, data.inviterEmail);
}

export async function sendVisitDeclinedNotification(email: string, data: VisitDeclinedData) {
  const template = createVisitDeclinedTemplate(data);
  return sendEmail(email, template.subject, template.html);
}

export async function sendNewTimeProposedNotification(email: string, data: NewTimeProposedData) {
  const template = createNewTimeProposedTemplate(data);
  return sendEmail(email, template.subject, template.html);
}

export default resend
