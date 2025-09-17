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

export interface StaffInvitationEmailData extends BaseEmailData {
  inviterName: string;
  newStaffName: string;
  role: string;
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