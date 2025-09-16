import { Resend } from 'resend'

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates for different scenarios
export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface TripCancellationEmailData {
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  cancelledBy: string
  cancellationReason?: string
  stakeholders: Array<{
    name: string
    email: string
    role?: string
  }>
}

export interface TripCreationEmailData {
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  createdBy: string
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

export interface StaffInvitationEmailData {
  inviterName: string
  inviterEmail: string
  newStaffName: string
  role: string
  tripTitle?: string
  whatsApp?: string
}

export interface HostInvitationEmailData {
  hostName: string
  hostEmail: string
  companyName: string
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  inviterName: string
  inviterEmail: string
  wolthersTeam: Array<{
    name: string
    role?: string
  }>
  confirmationUrl: string
  platformLoginUrl: string
  whatsApp?: string
  personalMessage?: string
  visitingCompanyName?: string
  visitDate?: string
  visitTime?: string
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

/**
 * Generate trip cancellation email template
 */
export function createTripCancellationTemplate(data: TripCancellationEmailData): EmailTemplate {
  const { tripTitle, tripAccessCode, tripStartDate, tripEndDate, cancelledBy, cancellationReason } = data

  const subject = `Trip Cancelled: ${tripTitle} (${tripAccessCode})`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trip Cancellation Notice</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.4; 
            color: #333; 
            max-width: 500px; 
            margin: 0 auto; 
            padding: 16px; 
            background-color: #fff; 
            font-size: 13px;
          }
          .logo { 
            text-align: center; 
            margin-bottom: 20px; 
          }
          .logo svg {
            width: 32px;
            height: 32px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 24px; 
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 16px;
          }
          .header h1 { 
            margin: 0; 
            font-size: 16px; 
            font-weight: 600; 
            color: #d32f2f;
          }
          .trip-details { 
            background: #f8f9fa; 
            padding: 12px; 
            border-radius: 4px; 
            margin: 16px 0; 
            font-size: 12px;
          }
          .trip-details p { 
            margin: 4px 0; 
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 11px; 
            margin-top: 24px; 
            padding-top: 16px; 
            border-top: 1px solid #e5e5e5; 
          }
          p { 
            margin: 12px 0; 
            font-size: 13px; 
          }
        </style>
      </head>
      <body>
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="#2D5347">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        
        <div class="header">
          <h1>Trip Cancellation Notice</h1>
        </div>

        <p>This trip has been cancelled by ${cancelledBy}.</p>
        
        <div class="trip-details">
          <p><strong>${tripTitle}</strong></p>
          <p>Trip Code: ${tripAccessCode}</p>
          <p>Original Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}</p>
          <p>Cancelled By: ${cancelledBy}</p>
          ${cancellationReason ? `<p>Reason: ${cancellationReason}</p>` : ''}
        </div>

        <p>Please adjust your schedule accordingly. Contact the Wolthers & Associates team with any questions.</p>
        
        <div class="footer">
          <p>Wolthers & Associates Travel Team</p>
          <p>Automated notification from Wolthers Travel Management System</p>
        </div>
      </body>
    </html>
  `

  const text = `
TRIP CANCELLATION NOTICE

This trip has been cancelled by ${cancelledBy}.

${tripTitle}
Trip Code: ${tripAccessCode}
Original Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}
Cancelled By: ${cancelledBy}
${cancellationReason ? `Reason: ${cancellationReason}` : ''}

Please adjust your schedule accordingly. Contact the Wolthers & Associates team with any questions.

Wolthers & Associates Travel Team
  `

  return { subject, html, text }
}

/**
 * Generate trip creation notification email template
 */
export function createTripCreationTemplate(data: TripCreationEmailData): EmailTemplate {
  const { tripTitle, tripAccessCode, tripStartDate, tripEndDate, createdBy, participants, companies } = data

  const subject = `New Trip Created: ${tripTitle} (${tripAccessCode})`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Trip Notification</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f9f9f9; 
          }
          .container { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: #28a745; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
            margin: -30px -30px 30px -30px; 
          }
          .trip-details { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .participants-list { 
            background: #e8f5e8; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 15px 0; 
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ New Trip Created</h1>
          </div>

          <p>A new trip has been created and you have been included as a stakeholder:</p>
          
          <div class="trip-details">
            <h3>${tripTitle}</h3>
            <p><strong>Trip Code:</strong> ${tripAccessCode}</p>
            <p><strong>Dates:</strong> ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}</p>
            <p><strong>Created By:</strong> ${createdBy}</p>
          </div>

          ${participants.length > 0 ? `
          <div class="participants-list">
            <h4>Wolthers Team Members:</h4>
            <ul>
              ${participants.map(p => `<li>${p.name} (${p.email})${p.role ? ` - ${p.role}` : ''}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          ${companies.length > 0 ? `
          <div class="participants-list">
            <h4>Partner Companies:</h4>
            <ul>
              ${companies.map(c => `<li>${c.name}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <p>You will receive further details about the itinerary and arrangements as they are finalized.</p>
          
          <div class="footer">
            <p>Best regards,<br/>
            <strong>Wolthers & Associates Travel Team</strong></p>
            <p style="font-size: 12px; color: #999;">
              This is an automated notification from the Wolthers Travel Management System.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
NEW TRIP CREATED

A new trip has been created:

${tripTitle}
Trip Code: ${tripAccessCode}
Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}
Created By: ${createdBy}

${participants.length > 0 ? `
Wolthers Team Members:
${participants.map(p => `- ${p.name} (${p.email})${p.role ? ` - ${p.role}` : ''}`).join('\n')}
` : ''}

${companies.length > 0 ? `
Partner Companies:
${companies.map(c => `- ${c.name}`).join('\n')}
` : ''}

You will receive further details as they are finalized.

Best regards,
Wolthers & Associates Travel Team
  `

  return { subject, html, text }
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

/**
 * Generate staff invitation email template
 */
export function createStaffInvitationTemplate(data: StaffInvitationEmailData): EmailTemplate {
  const { inviterName, inviterEmail, newStaffName, role, tripTitle, whatsApp } = data

  const subject = `Wolthers & Associates - Team Invitation${tripTitle ? ` for ${tripTitle}` : ''}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f9f9f9; 
          }
          .container { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
          }
          .header { 
            background: #007bff; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
            margin: -30px -30px 30px -30px; 
          }
          .invitation-details { 
            background: #e7f3ff; 
            padding: 20px; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #eee; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Team Invitation</h1>
          </div>

          <p>Hello ${newStaffName},</p>
          
          <p>You have been invited to join the Wolthers & Associates team by ${inviterName} (${inviterEmail}).</p>
          
          <div class="invitation-details">
            <h3>Invitation Details</h3>
            <p><strong>Role:</strong> ${role}</p>
            ${tripTitle ? `<p><strong>Initial Project:</strong> ${tripTitle}</p>` : ''}
            ${whatsApp ? `<p><strong>WhatsApp:</strong> ${whatsApp}</p>` : ''}
            <p><strong>Invited By:</strong> ${inviterName}</p>
          </div>

          <p>Please contact ${inviterName} at ${inviterEmail} to confirm your participation and receive access to the travel management system.</p>
          
          <div class="footer">
            <p>Welcome to the team!<br/>
            <strong>Wolthers & Associates</strong></p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
WOLTHERS & ASSOCIATES - TEAM INVITATION

Hello ${newStaffName},

You have been invited to join the Wolthers & Associates team by ${inviterName} (${inviterEmail}).

Invitation Details:
Role: ${role}
${tripTitle ? `Initial Project: ${tripTitle}` : ''}
${whatsApp ? `WhatsApp: ${whatsApp}` : ''}
Invited By: ${inviterName}

Please contact ${inviterName} at ${inviterEmail} to confirm your participation.

Welcome to the team!
Wolthers & Associates
  `

  return { subject, html, text }
}

/**
 * Generate host invitation email template with platform features and visit confirmation
 */
export function createHostInvitationTemplate(data: HostInvitationEmailData): EmailTemplate {
  const { 
    hostName, 
    companyName, 
    tripTitle, 
    tripAccessCode, 
    tripStartDate, 
    tripEndDate, 
    inviterName, 
    inviterEmail,
    wolthersTeam,
    confirmationUrl,
    platformLoginUrl,
    whatsApp,
    personalMessage,
    visitingCompanyName,
    visitDate,
    visitTime
  } = data

  const subject = `Visit Confirmation Required - ${visitingCompanyName || companyName} ${visitDate ? `on ${visitDate}` : ''}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Host Platform Invitation & Visit Confirmation</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 650px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f9f9f9; 
          }
          .container { 
            background: white; 
            padding: 0; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
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
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .welcome-section {
            background: linear-gradient(135deg, #FEF3C7, #F3E8A6);
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2D5347;
          }
          .visit-confirmation {
            background: #fff3cd;
            border: 2px solid #ffeaa7;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
          }
          .confirmation-buttons {
            margin: 20px 0;
          }
          .btn {
            display: inline-block;
            padding: 15px 30px;
            margin: 0 10px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
          }
          .btn-accept {
            background: #10b981;
            color: white;
          }
          .btn-accept:hover {
            background: #059669;
          }
          .btn-decline {
            background: #ef4444;
            color: white;
          }
          .btn-decline:hover {
            background: #dc2626;
          }
          .platform-features {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .feature-list {
            list-style: none;
            padding: 0;
          }
          .feature-list li {
            padding: 8px 0;
            position: relative;
            padding-left: 25px;
          }
          .feature-list li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
          }
          .trip-details {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .team-list {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
          }
          .platform-access {
            background: #2D5347;
            color: white;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
            text-align: center;
          }
          .btn-platform {
            background: #FEF3C7;
            color: #2D5347;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            display: inline-block;
            margin-top: 15px;
          }
          .btn-platform:hover {
            background: #F3E8A6;
          }
          .footer { 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            margin-top: 30px; 
            padding: 25px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0; 
          }
          .urgent-note {
            background: #fef2f2;
            border: 2px solid #fecaca;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Welcome to Wolthers Travel Platform</h1>
            <p>Your invitation to join our exclusive host network</p>
          </div>
          
          <div class="content">
            <p>Dear ${hostName},</p>

            <div class="welcome-section">
              <h3>🎉 Platform Invitation</h3>
              <p>We're excited to invite you and <strong>${companyName}</strong> to join the <strong>Wolthers Travel Platform</strong> as our valued host partner!</p>
            </div>

            ${personalMessage ? `
            <div class="welcome-section">
              <h3>💬 Personal Message</h3>
              <p><em>"${personalMessage}"</em></p>
              <p style="text-align: right; margin-top: 15px; font-size: 14px; color: #666;">— ${inviterName}</p>
            </div>
            ` : ''}

            <div class="urgent-note">
              <h3>⏰ URGENT: Visit Confirmation Required</h3>
              <p><strong>Please confirm your availability for our upcoming visit</strong></p>
            </div>
            
            <div class="trip-details">
              <h3>📅 Visit Details</h3>
              <p><strong>Company Visiting:</strong> ${visitingCompanyName || companyName}</p>
              ${visitDate ? `<p><strong>Visit Date:</strong> ${visitDate}</p>` : ''}
              ${visitTime ? `<p><strong>Visit Time:</strong> ${visitTime}</p>` : ''}
              <p><strong>Organized by:</strong> ${inviterName} (${inviterEmail})</p>
            </div>

            ${wolthersTeam.length > 0 ? `
            <div class="team-list">
              <h4>👥 Wolthers Team Members Visiting:</h4>
              <ul>
                ${wolthersTeam.map(member => `<li>${member.name}${member.role ? ` - ${member.role}` : ''}</li>`).join('')}
              </ul>
            </div>
            ` : ''}

            <div class="visit-confirmation">
              <h3>🤝 Can you host our visit?</h3>
              <p>Please confirm your availability for the dates above.</p>
              <div class="confirmation-buttons">
                <a href="${confirmationUrl}&response=accept" class="btn btn-accept">
                  ✅ YES, We can host
                </a>
                <a href="${confirmationUrl}&response=decline" class="btn btn-decline">
                  ❌ Sorry, not available
                </a>
              </div>
              <p><small>Click one of the buttons above to confirm your availability</small></p>
            </div>

            <div class="platform-features">
              <h3>🚀 Your Wolthers Travel Platform Benefits</h3>
              <p>As a host on our platform, you'll have access to:</p>
              <ul class="feature-list">
                <li><strong>Client Visit Management</strong> - Track all past and future guests</li>
                <li><strong>Meeting Presentations</strong> - Upload PowerPoint presentations for meetings</li>
                <li><strong>Visit Dashboard</strong> - Comprehensive overview of all interactions</li>
                <li><strong>Guest Information</strong> - Detailed profiles of visiting clients</li>
                <li><strong>Visit Confirmations</strong> - Easily accept or decline visit requests</li>
                <li><strong>Communication Tools</strong> - Direct messaging with Wolthers team</li>
                <li><strong>Historical Records</strong> - Access to complete visit history</li>
                <li><strong>Analytics</strong> - Insights on your partnership performance</li>
              </ul>
            </div>

            <div class="platform-access">
              <h3>🔐 Access Your Dashboard</h3>
              <p>Once you confirm this visit, you'll receive login credentials to access your personalized host dashboard.</p>
              <a href="${platformLoginUrl}" class="btn-platform">
                🌐 Access Wolthers Travel Platform
              </a>
              <p><small>Login details will be sent after visit confirmation</small></p>
            </div>

            <div class="welcome-section">
              <h3>📋 Next Steps</h3>
              <ol>
                <li><strong>Confirm Visit</strong> - Click YES or NO above for the ${new Date(tripStartDate).toLocaleDateString()} visit</li>
                <li><strong>Receive Login</strong> - Get your platform credentials via email</li>
                <li><strong>Set Up Profile</strong> - Complete your company profile on the platform</li>
                <li><strong>Prepare Materials</strong> - Upload presentations and meeting materials</li>
                <li><strong>Welcome Guests</strong> - Host the Wolthers team during their visit</li>
              </ol>
            </div>

            <p>We're looking forward to building a long-term partnership with ${companyName} and providing you with the tools to manage our visits effectively.</p>

            ${whatsApp ? `<p><strong>WhatsApp Contact:</strong> ${whatsApp}</p>` : ''}
          </div>
          
          <div class="footer">
            <p><strong>Best regards,</strong><br/>
            <strong>${inviterName}</strong><br/>
            Wolthers & Associates Travel Team</p>
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              This email contains an invitation to join the Wolthers Travel Platform and requires visit confirmation.<br/>
              For questions, contact ${inviterEmail}
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
WELCOME TO WOLTHERS TRAVEL PLATFORM + VISIT CONFIRMATION REQUIRED

Dear ${hostName},

PLATFORM INVITATION
We're excited to invite you and ${companyName} to join the Wolthers Travel Platform as our valued host partner!

URGENT: VISIT CONFIRMATION REQUIRED
Please confirm your availability for our upcoming visit.

VISIT DETAILS
Company Visiting: ${visitingCompanyName || companyName}
${visitDate ? `Visit Date: ${visitDate}` : `Visit Dates: ${new Date(tripStartDate).toLocaleDateString()} - ${new Date(tripEndDate).toLocaleDateString()}`}
${visitTime ? `Visit Time: ${visitTime}` : ''}
Organized by: ${inviterName} (${inviterEmail})

${wolthersTeam.length > 0 ? `
WOLTHERS TEAM MEMBERS VISITING:
${wolthersTeam.map(member => `- ${member.name}${member.role ? ` - ${member.role}` : ''}`).join('\n')}
` : ''}

CAN YOU HOST OUR VISIT?
Please confirm your availability by visiting:
ACCEPT: ${confirmationUrl}&response=accept
DECLINE: ${confirmationUrl}&response=decline

PLATFORM BENEFITS:
- Client Visit Management - Track all past and future guests
- Meeting Presentations - Upload PowerPoint presentations
- Visit Dashboard - Comprehensive overview of interactions
- Guest Information - Detailed visitor profiles
- Visit Confirmations - Easy accept/decline system
- Communication Tools - Direct messaging with Wolthers team
- Historical Records - Complete visit history
- Analytics - Partnership performance insights

ACCESS YOUR DASHBOARD:
${platformLoginUrl}
(Login credentials sent after visit confirmation)

NEXT STEPS:
1. Confirm Visit - Click accept or decline link above
2. Receive Login - Get platform credentials via email
3. Set Up Profile - Complete your company profile
4. Prepare Materials - Upload presentations and materials
5. Welcome Guests - Host the Wolthers team

We look forward to building a long-term partnership with ${companyName}.

${whatsApp ? `WhatsApp Contact: ${whatsApp}` : ''}

Best regards,
${inviterName}
Wolthers & Associates Travel Team

For questions, contact ${inviterEmail}
  `

  return { subject, html, text }
}

/**
 * Send trip cancellation emails to all stakeholders
 */
export async function sendTripCancellationEmails(data: TripCancellationEmailData): Promise<{ success: boolean; errors: string[] }> {
  const template = createTripCancellationTemplate(data)
  const errors: string[] = []
  let successCount = 0

  console.log(`📧 [Resend] Sending cancellation emails to ${data.stakeholders.length} stakeholders`)

  for (const stakeholder of data.stakeholders) {
    try {
      const result = await resend.emails.send({
        from: 'Wolthers Travel <trips@trips.wolthers.com>',
        to: [stakeholder.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      if (result.error) {
        console.error(`❌ [Resend] Failed to send to ${stakeholder.email}:`, result.error)
        errors.push(`${stakeholder.name} (${stakeholder.email}): ${result.error.message}`)
      } else {
        console.log(`✅ [Resend] Sent cancellation email to ${stakeholder.name} (${stakeholder.email})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ [Resend] Exception sending to ${stakeholder.email}:`, error)
      errors.push(`${stakeholder.name} (${stakeholder.email}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log(`📧 [Resend] Cancellation email summary: ${successCount}/${data.stakeholders.length} sent successfully`)

  return {
    success: errors.length === 0,
    errors
  }
}

/**
 * Send trip creation notification emails
 */
export async function sendTripCreationEmails(data: TripCreationEmailData): Promise<{ success: boolean; errors: string[] }> {
  const template = createTripCreationTemplate(data)
  const errors: string[] = []
  let successCount = 0

  // Collect all recipient emails (participants + company representatives)
  const recipients: Array<{ name: string; email: string }> = [
    ...data.participants,
    ...data.companies.flatMap(c => c.representatives || [])
  ]

  console.log(`📧 [Resend] Sending creation emails to ${recipients.length} recipients`)

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
        console.error(`❌ [Resend] Failed to send to ${recipient.email}:`, result.error)
        errors.push(`${recipient.name} (${recipient.email}): ${result.error.message}`)
      } else {
        console.log(`✅ [Resend] Sent creation email to ${recipient.name} (${recipient.email})`)
        successCount++
      }
    } catch (error) {
      console.error(`❌ [Resend] Exception sending to ${recipient.email}:`, error)
      errors.push(`${recipient.name} (${recipient.email}): ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  console.log(`📧 [Resend] Creation email summary: ${successCount}/${recipients.length} sent successfully`)

  return {
    success: errors.length === 0,
    errors
  }
}

/**
 * Send staff invitation email
 */
export async function sendStaffInvitationEmail(email: string, data: StaffInvitationEmailData): Promise<{ success: boolean; error?: string }> {
  const template = createStaffInvitationTemplate(data)

  try {
    console.log(`📧 [Resend] Sending staff invitation to ${email}`)

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (result.error) {
      console.error(`❌ [Resend] Failed to send staff invitation to ${email}:`, result.error)
      return {
        success: false,
        error: result.error.message
      }
    } else {
      console.log(`✅ [Resend] Sent staff invitation to ${email}`)
      return { success: true }
    }
  } catch (error) {
    console.error(`❌ [Resend] Exception sending staff invitation to ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send host invitation email with platform access and visit confirmation
 */
export async function sendHostInvitationEmail(email: string, data: HostInvitationEmailData): Promise<{ success: boolean; error?: string }> {
  const template = createHostInvitationTemplate(data)

  try {
    console.log(`📧 [Resend] Sending host invitation to ${email} for ${data.companyName}`)

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [email],
      subject: template.subject,
      html: template.html,
      text: template.text,
      // Add reply-to for better engagement
      reply_to: data.inviterEmail
    })

    if (result.error) {
      console.error(`❌ [Resend] Failed to send host invitation to ${email}:`, result.error)
      return {
        success: false,
        error: result.error.message
      }
    } else {
      console.log(`✅ [Resend] Sent host invitation to ${data.hostName} at ${data.companyName} (${email})`)
      return { success: true }
    }
  } catch (error) {
    console.error(`❌ [Resend] Exception sending host invitation to ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send host invitations to multiple hosts for a trip
 */
export async function sendHostInvitationEmails(hosts: Array<{ email: string; data: HostInvitationEmailData }>): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = []
  let successCount = 0

  console.log(`📧 [Resend] Sending host invitations to ${hosts.length} hosts`)

  for (const host of hosts) {
    const result = await sendHostInvitationEmail(host.email, host.data)
    
    if (result.success) {
      successCount++
    } else {
      errors.push(`${host.data.hostName} (${host.email}): ${result.error}`)
    }
  }

  console.log(`📧 [Resend] Host invitation summary: ${successCount}/${hosts.length} sent successfully`)

  return {
    success: errors.length === 0,
    errors
  }
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

export default resend