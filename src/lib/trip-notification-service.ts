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

export class TripNotificationService {
  private static async sendEmail(to: string | string[], subject: string, html: string) {
    try {
      console.log(`[TRIP NOTIFICATIONS] Sending email via Resend to:`, Array.isArray(to) ? to.join(', ') : to)
      console.log(`[TRIP NOTIFICATIONS] Subject: ${subject}`)
      
      const { data, error } = await resend.emails.send({
        from: 'Wolthers Travel Platform <noreply@trips.wolthers.com>',
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
      const subject = `🌍 New Trip Created: ${data.tripTitle}`
      
      // Group activities by date for better display
      const activitiesByDate = data.activities.reduce((acc, activity) => {
        if (!acc[activity.date]) acc[activity.date] = []
        acc[activity.date].push(activity)
        return acc
      }, {} as Record<string, typeof data.activities>)

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Trip Created - ${data.tripTitle}</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e9ecef;">
            
            <!-- Logo Header -->
            <div style="padding: 40px 30px 20px; text-align: center; background: linear-gradient(135deg, #059669, #047857);">
              <img src="https://wolthers.com/images/wolthers-logo-white.png" alt="Wolthers & Associates" style="width: 200px; height: auto; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; line-height: 1.2;">
                🌍 NEW TRIP CREATED
              </h1>
              <p style="color: #d1fae5; margin: 10px 0 0; font-size: 18px; line-height: 1.4;">
                You're invited to join an exciting coffee origin trip!
              </p>
            </div>
            
            <!-- Trip Details Card -->
            <div style="margin: 30px; padding: 25px; background: linear-gradient(135deg, #fbbf24, #f59e0b); border-radius: 12px; color: white;">
              <h2 style="margin: 0 0 15px; font-size: 24px; font-weight: 700; text-align: center;">
                ✨ ${data.tripCode} - ${data.tripTitle}
              </h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                <div>
                  <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Dates:</strong></p>
                  <p style="margin: 0; font-size: 16px;">${this.formatDate(data.startDate)} - ${this.formatDate(data.endDate)}</p>
                  <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">(${data.duration} days)</p>
                </div>
                <div>
                  <p style="margin: 5px 0; font-size: 16px;"><strong>👤 Trip Leader:</strong></p>
                  <p style="margin: 0; font-size: 16px;">${data.createdBy}</p>
                  ${data.flightInfo ? `
                  <p style="margin: 10px 0 5px; font-size: 16px;"><strong>✈️ Flight Info:</strong></p>
                  <p style="margin: 0; font-size: 14px;">Passenger: ${data.flightInfo.passengerName}</p>
                  <p style="margin: 0; font-size: 14px;">Arrival: ${data.flightInfo.arrivalTime}${data.flightInfo.terminal ? ` (Terminal ${data.flightInfo.terminal})` : ''}</p>
                  ` : ''}
                </div>
              </div>
            </div>
            
            <!-- Itinerary Section -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 20px; font-weight: 600; border-bottom: 2px solid #059669; padding-bottom: 10px;">
                📋 PRELIMINARY ITINERARY
              </h3>
              ${Object.entries(activitiesByDate).map(([date, activities], index) => `
                <div style="margin-bottom: 25px; padding: 20px; background-color: ${index % 2 === 0 ? '#f8fffe' : '#f0fdf4'}; border-radius: 8px; border-left: 4px solid #059669;">
                  <h4 style="color: #047857; margin: 0 0 15px; font-size: 18px; font-weight: 600;">
                    Day ${index + 1} - ${this.formatDate(date)}
                  </h4>
                  ${activities.map(activity => `
                    <div style="margin-bottom: 10px; padding-left: 15px;">
                      <p style="margin: 0; color: #1f2937; font-size: 16px;">
                        <strong style="color: #059669;">${activity.time}</strong> - ${activity.title}
                      </p>
                      ${activity.description ? `
                        <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px; padding-left: 15px;">
                          ${activity.description}
                        </p>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
            
            <!-- Team Section -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 20px; font-weight: 600; border-bottom: 2px solid #059669; padding-bottom: 10px;">
                👥 TRAVEL TEAM
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${data.participants.map(participant => `
                  <div style="padding: 15px; background-color: #f3f4f6; border-radius: 8px; text-align: center;">
                    <p style="margin: 0 0 5px; font-weight: 600; color: #1f2937; font-size: 16px;">${participant.name}</p>
                    <p style="margin: 0 0 5px; color: #6b7280; font-size: 14px;">${participant.role}</p>
                    ${participant.company ? `<p style="margin: 0; color: #059669; font-size: 14px; font-weight: 500;">${participant.company}</p>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
            
            ${data.vehicles && data.vehicles.length > 0 ? `
            <!-- Logistics Section -->
            <div style="margin: 30px;">
              <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 20px; font-weight: 600; border-bottom: 2px solid #059669; padding-bottom: 10px;">
                🚗 LOGISTICS
              </h3>
              ${data.vehicles.map((vehicle, index) => `
                <div style="padding: 15px; background-color: #fef3c7; border-radius: 8px; margin-bottom: 10px;">
                  <p style="margin: 0; color: #1f2937; font-size: 16px;">
                    <strong>Vehicle:</strong> ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})
                  </p>
                  ${data.drivers && data.drivers[index] ? `
                    <p style="margin: 5px 0 0; color: #6b7280; font-size: 14px;">
                      <strong>Driver:</strong> ${data.drivers[index].name}${data.drivers[index].phone ? ` (${data.drivers[index].phone})` : ''}
                    </p>
                  ` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 40px 30px;">
              <a href="https://trips.wolthers.com/trips/${data.tripCode}" style="display: inline-block; background: #059669; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);">
                📱 View Full Itinerary
              </a>
              <a href="https://trips.wolthers.com/calendar/export/${data.tripCode}" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px; box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);">
                📅 Export to Calendar
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
                This is an automated notification from Wolthers Travel Platform.<br>
                Trip created by <strong>${data.createdBy}</strong> • ${new Date().toLocaleDateString()}
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.6;">
                © ${new Date().getFullYear()} Wolthers & Associates. All rights reserved.<br>
                <a href="https://trips.wolthers.com" style="color: #059669; text-decoration: none;">trips.wolthers.com</a>
              </p>
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

      // Parse participants
      const participants = (trip.trip_participants || []).map((p: any) => ({
        email: p.users?.email || `guest-${Date.now()}@example.com`,
        name: p.guest_name || p.users?.full_name || 'Guest',
        role: p.role === 'guest' ? 'Guest' : (p.role === 'wolthers_staff' ? 'Wolthers Staff' : 'Participant'),
        company: p.companies?.fantasy_name || p.companies?.name
      }))

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