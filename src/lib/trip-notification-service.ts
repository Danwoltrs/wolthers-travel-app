// Enhanced Trip Notification Service with rich email templates
import { Resend } from 'resend'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface TripCreationEmailData {
  tripId: string
  tripTitle: string
  tripCode: string
  startDate: string
  endDate: string
  duration: number
  createdBy: string
  participants: Array<{
    email: string
    name: string
    role: string
    company?: string
  }>
  activities: Array<{
    date: string
    time: string
    title: string
    description?: string
  }>
  flightInfo?: {
    passengerName: string
    arrivalTime: string
    terminal?: string
  }
  vehicles?: Array<{
    make: string
    model: string
    licensePlate: string
  }>
  drivers?: Array<{
    name: string
    phone?: string
  }>
}

export interface ActivityUpdateEmailData {
  tripId: string
  tripTitle: string
  tripCode: string
  activityTitle: string
  activityDate: string
  activityTime: string
  activityDuration?: string
  location?: string
  description?: string
  addedBy: string
  participants: Array<{
    email: string
    name: string
  }>
  scheduleImpact?: {
    previous: string
    updated: string
  }
  attendees: Array<{
    name: string
    company?: string
    status: 'confirmed' | 'pending'
  }>
}

export interface StaffAssignmentEmailData {
  tripId: string
  tripTitle: string
  tripCode: string
  startDate: string
  endDate: string
  staffMember: {
    email: string
    name: string
    role: string
  }
  tripLeader: string
  client: {
    name: string
    company: string
  }
  responsibilities: string[]
  keyContacts: Array<{
    name: string
    phone: string
    role: string
  }>
  urgentActions: string[]
  assignedBy: string
}

export interface HostConfirmationEmailData {
  hostName: string
  hostEmail: string
  companyName: string
  clientCompanyName: string
  tripCode: string
  visitDate: string
  visitTime: string
  wolthersTeam: string[]
  guestCount: number
  confirmUrl: string
  rescheduleUrl: string
}

export class TripNotificationService {
  private static async sendEmail(to: string | string[], subject: string, html: string) {
    try {
      console.log(`[TRIP NOTIFICATIONS] Sending email via Resend to:`, Array.isArray(to) ? to.join(', ') : to)
      console.log(`[TRIP NOTIFICATIONS] Subject: ${subject}`)
      
      const { data, error } = await resend.emails.send({
        from: 'Wolthers Travel Platform <trips@trips.wolthers.com>',
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
      })

      if (error) {
        console.error('[TRIP NOTIFICATIONS] Resend error:', error)
        return { success: false, error: error.message }
      }

      console.log(`[TRIP NOTIFICATIONS] Email sent successfully via Resend:`, data?.id)
      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('[TRIP NOTIFICATIONS] Failed to send email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  private static formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  private static formatDateShort(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  static async sendTripCreationNotification(data: TripCreationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const participantEmails = data.participants.map(p => p.email)
      const subject = `New Trip Created: ${data.tripTitle}`

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Trip Created - ${data.tripTitle}</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e9ecef;">
            
            <!-- Header with Gradient Background -->
            <div style="padding: 40px 30px 30px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white;">
              <h1 style="color: #ffffff; margin: 0 0 10px; font-size: 28px; font-weight: 700; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                New Trip Created
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px; line-height: 1.4;">
                You've been invited to join a coffee origin experience
              </p>
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
                <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">
                  WOLTHERS & ASSOCIATES TRAVEL PLATFORM
                </p>
              </div>
            </div>
            
            <!-- Trip Details Card -->
            <div style="margin: 30px; padding: 25px; background-color: #f8fffe; border: 1px solid #d1fae5; border-radius: 12px;">
              <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 600; color: #065f46; text-align: center;">
                ${data.tripCode}
              </h2>
              <h3 style="margin: 0 0 30px; font-size: 18px; font-weight: 500; color: #047857; text-align: center;">
                ${data.tripTitle}
              </h3>
              
              <div style="margin-bottom: 30px;">
                <div style="color: #374151; font-size: 16px; line-height: 1.4; text-align: center;">
                  ${this.formatDate(data.startDate)} - ${this.formatDate(data.endDate)}
                  <span style="color: #6b7280; font-size: 14px;">(${data.duration} days)</span>
                </div>
              </div>
              
              ${data.participants.filter(p => p.role === 'Wolthers Staff').length > 0 ? `
              <div style="margin-bottom: 20px;">
                <span style="color: #1f2937; font-size: 16px; font-weight: 600;">Wolthers Team: </span>
                <span style="color: #374151; font-size: 16px;">
                  ${data.participants.filter(p => p.role === 'Wolthers Staff').map(participant => participant.name.split(' ')[0]).join(', ')}
                </span>
              </div>
              ` : ''}
              
              ${data.participants.filter(p => p.role !== 'Wolthers Staff').length > 0 ? `
              <div style="margin-bottom: 0;">
                <span style="color: #1f2937; font-size: 16px; font-weight: 600;">Participants: </span>
                <span style="color: #374151; font-size: 16px;">
                  ${data.participants.filter(p => p.role !== 'Wolthers Staff').map(participant => participant.name.split(' ')[0]).join(', ')}
                </span>
              </div>
              ` : ''}
            </div>
            
            <!-- Trip Itinerary -->
            ${data.activities && data.activities.length > 0 ? `
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600;">
                Trip Itinerary
              </h3>
              <div style="background-color: #f8fffe; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px;">
                ${(() => {
                  // Group activities by date
                  const activitiesByDate = data.activities.reduce((acc, activity) => {
                    const date = activity.date;
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(activity);
                    return acc;
                  }, {});
                  
                  // Sort dates and create daily itinerary
                  return Object.keys(activitiesByDate)
                    .sort()
                    .map(date => {
                      const dayActivities = activitiesByDate[date].sort((a, b) => a.time.localeCompare(b.time));
                      return `
                        <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                          <div style="color: #047857; font-weight: 600; font-size: 16px; margin-bottom: 12px;">
                            ${this.formatDate(date)}
                          </div>
                          ${dayActivities.map(activity => `
                            <div style="display: flex; align-items: flex-start; margin-bottom: 8px; padding-left: 15px;">
                              <div style="color: #6b7280; font-size: 14px; font-weight: 500; min-width: 60px; margin-right: 15px;">
                                ${activity.time}
                              </div>
                              <div style="flex: 1;">
                                <div style="color: #1f2937; font-size: 15px; font-weight: 500; margin-bottom: 2px;">
                                  ${activity.title}
                                </div>
                                ${activity.description ? `
                                <div style="color: #6b7280; font-size: 14px; line-height: 1.4;">
                                  ${activity.description}
                                </div>
                                ` : ''}
                              </div>
                            </div>
                          `).join('')}
                        </div>
                      `;
                    }).join('');
                })()}
              </div>
            </div>
            ` : ''}
            
            <!-- Call to Action -->
            <div style="text-align: center; margin: 40px 30px; padding: 30px 0; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 1px solid #bbf7d0;">
              <h3 style="color: #047857; margin: 0 0 20px; font-size: 20px; font-weight: 600;">
                Ready to get started?
              </h3>
              <a href="https://trips.wolthers.com/trips/${data.tripCode}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); transition: all 0.2s ease; margin: 0 10px 10px 0;">
                View Trip Details
              </a>
              <a href="https://trips.wolthers.com/calendar/export/${data.tripCode}" style="display: inline-block; background: #ffffff; color: #059669; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; border: 2px solid #059669; margin: 0 10px 10px 0;">
                Export Calendar
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 35px; text-align: center;">
              <div style="margin-bottom: 15px;">
                <span style="color: #ffffff; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">WOLTHERS & ASSOCIATES</span>
              </div>
              <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
                Coffee Origin Travel Specialists<br>
                © ${new Date().getFullYear()} Wolthers & Associates. All rights reserved.
              </p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <a href="https://trips.wolthers.com" style="color: #10b981; text-decoration: none; font-weight: 500; font-size: 14px;">
                  trips.wolthers.com
                </a>
                <span style="color: rgba(255,255,255,0.4); margin: 0 15px;">|</span>
                <a href="mailto:trips@trips.wolthers.com" style="color: #10b981; text-decoration: none; font-weight: 500; font-size: 14px;">
                  trips@trips.wolthers.com
                </a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      if (participantEmails.length === 0) {
        console.log('[TRIP NOTIFICATIONS] No participant emails found for trip creation notification')
        return { success: false, error: 'No participant emails found' }
      }

      const result = await this.sendEmail(participantEmails, subject, html)
      return result

    } catch (error) {
      console.error('[TRIP NOTIFICATIONS] Error sending trip creation email:', error)
      return { success: false, error: 'Failed to send trip creation email' }
    }
  }

  static async sendActivityUpdateNotification(data: ActivityUpdateEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const participantEmails = data.participants.map(p => p.email)
      const subject = `📅 Itinerary Updated: ${data.activityTitle} added to ${data.tripCode}`
      
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Itinerary Updated - ${data.tripTitle}</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e9ecef;">
            
            <!-- Header -->
            <div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                📅 ITINERARY UPDATED
              </h1>
              <p style="color: #bfdbfe; margin: 10px 0 0; font-size: 16px;">
                Your trip schedule has been updated with a new activity!
              </p>
            </div>
            
            <!-- New Meeting Card -->
            <div style="margin: 30px; padding: 25px; background: linear-gradient(135deg, #10b981, #047857); border-radius: 12px; color: white;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; font-weight: 700;">
                  🆕 NEW MEETING ADDED
                </h2>
              </div>
              <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
                <h3 style="margin: 0 0 15px; font-size: 20px; font-weight: 600;">
                  ${data.activityTitle}
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Date:</strong></p>
                    <p style="margin: 0; font-size: 16px;">${this.formatDate(data.activityDate)}</p>
                  </div>
                  <div>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>⏰ Time:</strong></p>
                    <p style="margin: 0; font-size: 16px;">${data.activityTime}${data.activityDuration ? ` (${data.activityDuration})` : ''}</p>
                  </div>
                </div>
                ${data.location ? `
                <p style="margin: 15px 0 5px; font-size: 16px;"><strong>📍 Location:</strong></p>
                <p style="margin: 0; font-size: 16px;">${data.location}</p>
                ` : ''}
                <p style="margin: 15px 0 5px; font-size: 16px;"><strong>👤 Added by:</strong></p>
                <p style="margin: 0; font-size: 16px;">${data.addedBy}</p>
              </div>
            </div>
            
            ${data.description ? `
            <!-- Meeting Details -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                📋 MEETING DETAILS
              </h3>
              <div style="padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  ${data.description}
                </p>
              </div>
            </div>
            ` : ''}
            
            ${data.scheduleImpact ? `
            <!-- Schedule Impact -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                ⚠️ SCHEDULE IMPACT
              </h3>
              <div style="padding: 20px; background-color: #fef3cd; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 10px; color: #92400e; font-size: 14px;"><strong>Previous:</strong> ${data.scheduleImpact.previous}</p>
                <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Updated:</strong> ${data.scheduleImpact.updated}</p>
              </div>
            </div>
            ` : ''}
            
            <!-- Attendees -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                👥 ATTENDEES
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                ${data.attendees.map(attendee => `
                  <div style="padding: 10px 15px; background-color: ${attendee.status === 'confirmed' ? '#d1fae5' : '#fef3c7'}; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px;">${attendee.name}</p>
                      ${attendee.company ? `<p style="margin: 0; color: #6b7280; font-size: 12px;">${attendee.company}</p>` : ''}
                    </div>
                    <span style="color: ${attendee.status === 'confirmed' ? '#059669' : '#d97706'}; font-size: 16px;">
                      ${attendee.status === 'confirmed' ? '✓' : '⏳'}
                    </span>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px;">
              <a href="https://trips.wolthers.com/trips/${data.tripCode}" style="display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 5px;">
                View Updated Itinerary
              </a>
              <a href="https://trips.wolthers.com/calendar/export/${data.tripCode}" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 5px;">
                Export to Calendar
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                This update was made ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by ${data.addedBy}<br>
                © ${new Date().getFullYear()} Wolthers & Associates
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const result = await this.sendEmail(participantEmails, subject, html)
      return result

    } catch (error) {
      console.error('[TRIP NOTIFICATIONS] Error sending activity update email:', error)
      return { success: false, error: 'Failed to send activity update email' }
    }
  }

  static async sendStaffAssignmentNotification(data: StaffAssignmentEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subject = `👥 Staff Assignment: ${data.tripCode} - ${data.tripTitle}`
      
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Staff Assignment - ${data.tripTitle}</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e9ecef;">
            
            <!-- Header -->
            <div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #7c3aed, #5b21b6);">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                👥 STAFF ASSIGNMENT UPDATE
              </h1>
              <p style="color: #ddd6fe; margin: 10px 0 0; font-size: 16px;">
                You've been assigned to an upcoming trip!
              </p>
            </div>
            
            <!-- Assignment Card -->
            <div style="margin: 30px; padding: 25px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; color: white;">
              <h2 style="margin: 0 0 20px; font-size: 22px; font-weight: 700; text-align: center;">
                ${data.tripCode} - ${data.tripTitle}
              </h2>
              <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                  <div>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Duration:</strong></p>
                    <p style="margin: 0; font-size: 16px;">${this.formatDate(data.startDate)} - ${this.formatDate(data.endDate)}</p>
                  </div>
                  <div>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>🎯 Your Role:</strong></p>
                    <p style="margin: 0; font-size: 16px; font-weight: 600;">${data.staffMember.role}</p>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>👤 Trip Leader:</strong></p>
                    <p style="margin: 0; font-size: 16px;">${data.tripLeader}</p>
                  </div>
                  <div>
                    <p style="margin: 5px 0; font-size: 16px;"><strong>🏢 Client:</strong></p>
                    <p style="margin: 0; font-size: 16px;">${data.client.name} (${data.client.company})</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Responsibilities -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                📋 YOUR RESPONSIBILITIES
              </h3>
              <div style="padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                ${data.responsibilities.map(resp => `
                  <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                    <span style="color: #3b82f6; margin-right: 10px;">•</span>
                    <span style="color: #1e40af; font-size: 16px; line-height: 1.5;">${resp}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Key Contacts -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                📞 KEY CONTACTS
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                ${data.keyContacts.map(contact => `
                  <div style="padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
                    <p style="margin: 0 0 5px; font-weight: 600; color: #1f2937; font-size: 14px;">${contact.name}</p>
                    <p style="margin: 0 0 5px; color: #6b7280; font-size: 12px;">${contact.role}</p>
                    <p style="margin: 0; color: #059669; font-size: 14px; font-weight: 500;">${contact.phone}</p>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Urgent Actions -->
            <div style="margin: 30px;">
              <h3 style="color: #dc2626; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                🚨 URGENT ACTIONS NEEDED
              </h3>
              <div style="padding: 20px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                ${data.urgentActions.map(action => `
                  <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                    <input type="checkbox" style="margin-right: 10px; margin-top: 2px;" />
                    <span style="color: #991b1b; font-size: 16px; line-height: 1.5;">${action}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px;">
              <a href="https://trips.wolthers.com/trips/${data.tripCode}" style="display: inline-block; background: #7c3aed; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 5px;">
                Access Trip Dashboard
              </a>
              <a href="https://trips.wolthers.com/trips/${data.tripCode}/briefing" style="display: inline-block; background: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 5px;">
                Download Briefing
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                Assignment made by <strong>${data.assignedBy}</strong> • ${new Date().toLocaleDateString()}<br>
                © ${new Date().getFullYear()} Wolthers & Associates
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const result = await this.sendEmail(data.staffMember.email, subject, html)
      return result

    } catch (error) {
      console.error('[TRIP NOTIFICATIONS] Error sending staff assignment email:', error)
      return { success: false, error: 'Failed to send staff assignment email' }
    }
  }

  static async sendHostConfirmationNotification(data: HostConfirmationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const subject = `Visit request from ${data.clientCompanyName} - ${this.formatDateShort(data.visitDate)}`
      
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Meeting Confirmation Required</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e9ecef;">
            
            <!-- Header with Logo -->
            <div style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white;">
              <div style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 0.5px;">
                WOLTHERS & ASSOCIATES
              </div>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 20px; font-weight: 600; text-align: center;">
                Meeting Confirmation Required
              </h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.5; margin: 0 0 25px;">
                Hello ${data.hostName},
              </p>
              
              <div style="background-color: #f8fffe; border: 1px solid #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #047857; font-size: 16px; font-weight: 500; margin: 0 0 15px;">
                  Can you receive our team and ${data.clientCompanyName} on:
                </p>
                <div style="color: #1f2937; font-size: 18px; font-weight: 600; text-align: center; margin: 15px 0;">
                  ${this.formatDate(data.visitDate)}
                </div>
                <div style="color: #1f2937; font-size: 18px; font-weight: 600; text-align: center; margin: 15px 0;">
                  ${data.visitTime}
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Company:</strong> ${data.companyName}
                  </p>
                  <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Wolthers Team:</strong> ${data.wolthersTeam.join(', ')}
                  </p>
                  <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Total Guests:</strong> ${data.guestCount} people
                  </p>
                  <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                    <strong>Trip Code:</strong> ${data.tripCode}
                  </p>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmUrl}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
                  Confirm Meeting
                </a>
                <a href="${data.rescheduleUrl}" style="display: inline-block; background: #ffffff; color: #6b7280; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #d1d5db; margin: 0 10px 10px 0;">
                  Request Different Time
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center; margin: 25px 0 0;">
                If you cannot accommodate this meeting, please click "Request Different Time" to see alternative options.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.6;">
                © ${new Date().getFullYear()} Wolthers & Associates<br>
                <a href="mailto:trips@trips.wolthers.com" style="color: #10b981; text-decoration: none;">trips@trips.wolthers.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const result = await this.sendEmail(data.hostEmail, subject, html)
      return result

    } catch (error) {
      console.error('[TRIP NOTIFICATIONS] Error sending host confirmation email:', error)
      return { success: false, error: 'Failed to send host confirmation email' }
    }
  }

  static async fetchTripDataForNotification(tripId: string): Promise<TripCreationEmailData | null> {
    try {
      const supabase = createSupabaseServiceClient()
      
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          id,
          title,
          access_code,
          start_date,
          end_date,
          created_by,
          step_data,
          trip_participants (
            role,
            guest_name,
            users (email, full_name),
            companies (name, fantasy_name)
          ),
          trip_vehicles (
            vehicles (model, license_plate),
            users!trip_vehicles_driver_id_fkey (full_name, phone)
          ),
          activities (
            title,
            description,
            activity_date,
            start_time
          )
        `)
        .eq('id', tripId)
        .single()

      if (error || !trip) {
        console.error('[TRIP NOTIFICATIONS] Failed to fetch trip data:', error)
        return null
      }

      // Calculate duration
      const startDate = new Date(trip.start_date)
      const endDate = new Date(trip.end_date)
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // Parse participants - properly handle both user accounts and external guests
      const participants = (trip.trip_participants || []).map((p: any) => {
        // Determine the best email - prioritize user email, then guest email
        let participantEmail = null
        if (p.users?.email) {
          participantEmail = p.users.email
        } else if (p.guest_email) {
          participantEmail = p.guest_email
        }
        
        // Only include participants with valid email addresses
        if (!participantEmail || participantEmail.includes('guest-') || participantEmail.includes('@example.com')) {
          return null
        }
        
        // Determine the best name - prioritize user name, then guest name
        const participantName = p.users?.full_name || p.guest_name || 'Participant'
        
        // Determine role display name
        let roleDisplayName = 'Participant'
        if (p.role === 'staff' || p.role === 'wolthers_staff') {
          roleDisplayName = 'Wolthers Staff'
        } else if (p.role === 'client_representative') {
          roleDisplayName = 'Client Representative'
        } else if (p.role === 'representative') {
          roleDisplayName = 'Company Representative'
        } else if (p.role === 'guest') {
          roleDisplayName = 'Guest'
        }
        
        // Determine company name - prioritize user company, then guest company
        const companyName = p.companies?.fantasy_name || p.companies?.name || p.guest_company
        
        return {
          email: participantEmail,
          name: participantName,
          role: roleDisplayName,
          company: companyName
        }
      }).filter(Boolean) // Remove null entries

      // Parse activities
      const activities = (trip.activities || []).map((a: any) => ({
        date: a.activity_date,
        time: a.start_time,
        title: a.title,
        description: a.description
      }))

      // Parse vehicles
      const vehicles = (trip.trip_vehicles || []).map((v: any) => {
        const modelParts = v.vehicles?.model?.split(' ') || []
        return {
          make: modelParts[0] || '',
          model: modelParts.slice(1).join(' ') || v.vehicles?.model || '',
          licensePlate: v.vehicles?.license_plate || ''
        }
      })

      // Parse drivers
      const drivers = (trip.trip_vehicles || [])
        .filter((v: any) => v.users)
        .map((v: any) => ({
          name: v.users.full_name,
          phone: v.users.phone
        }))

      // Extract flight info from step_data
      let flightInfo = null
      if (trip.step_data && typeof trip.step_data === 'object') {
        const stepData = trip.step_data as any
        if (stepData.flightInfo) {
          flightInfo = {
            passengerName: stepData.flightInfo.passengerName,
            arrivalTime: stepData.flightInfo.arrivalTime,
            terminal: stepData.flightInfo.terminal
          }
        }
      }

      return {
        tripId: trip.id,
        tripTitle: trip.title,
        tripCode: trip.access_code,
        startDate: trip.start_date,
        endDate: trip.end_date,
        duration,
        createdBy: trip.created_by || 'Wolthers Team',
        participants,
        activities,
        flightInfo,
        vehicles: vehicles.length > 0 ? vehicles : undefined,
        drivers: drivers.length > 0 ? drivers : undefined
      }

    } catch (error) {
      console.error('[TRIP NOTIFICATIONS] Error fetching trip data:', error)
      return null
    }
  }
}

export default TripNotificationService