// Email service for sending user invitations using Resend
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface InvitationEmailData {
  email: string
  name?: string
  whatsapp?: string
  companyName: string
  role: string
  invitedBy: string
  invitationToken: string
  message?: string
}

export interface ApprovalEmailData {
  email: string
  companyName: string
  role: string
  status: 'approved' | 'rejected'
  adminName: string
}

export class EmailService {
  private static async sendEmail(to: string, subject: string, html: string) {
    try {
      console.log(`[EMAIL SERVICE] Sending email via Resend to: ${to}`)
      console.log(`[EMAIL SERVICE] Subject: ${subject}`)
      
      const { data, error } = await resend.emails.send({
        from: 'Wolthers Travel Platform <noreply@trips.wolthers.com>',
        to: [to],
        subject: subject,
        html: html,
      })

      if (error) {
        console.error('[EMAIL SERVICE] Resend error:', error)
        return { success: false, error: error.message }
      }

      console.log(`[EMAIL SERVICE] Email sent successfully via Resend:`, data?.id)
      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('[EMAIL SERVICE] Failed to send email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static async sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const acceptUrl = `https://trips.wolthers.com/auth/accept-invitation?token=${data.invitationToken}`
      
      const subject = `Invitation to join ${data.companyName} on Wolthers Travel Platform`
      
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to ${data.companyName}</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Logo Header -->
            <div style="padding: 40px 30px 20px; text-align: center;">
              <img src="https://wolthers.com/images/wolthers-logo-green.png" alt="Wolthers & Associates" style="width: 200px; height: auto; margin-bottom: 20px;">
              <h1 style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: 600; line-height: 1.2;">
                Welcome to Wolthers Travel Platform
              </h1>
              <p style="color: #666666; margin: 10px 0 0; font-size: 16px; line-height: 1.4;">
                You've been invited to join ${data.companyName}
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 0 30px 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello${data.name ? ` ${data.name}` : ''},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>${data.invitedBy}</strong> has invited you to join <strong>${data.companyName}</strong> as a <strong>${data.role}</strong> on the Wolthers Travel Platform.
              </p>
              
              ${data.message ? `
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                ${data.message}
              </p>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                - ${data.invitedBy}
              </p>
              ` : ''}
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                The Wolthers Travel Platform helps companies manage their coffee origin trips efficiently, from planning to execution. As a <strong>${data.role}</strong>, you'll have access to:
              </p>
              
              <ul style="margin: 20px 0; padding-left: 20px;">
                <li style="padding: 4px 0; color: #333333; font-size: 16px; line-height: 1.5;">Trip planning and scheduling tools</li>
                <li style="padding: 4px 0; color: #333333; font-size: 16px; line-height: 1.5;">Team collaboration features</li>
                <li style="padding: 4px 0; color: #333333; font-size: 16px; line-height: 1.5;">Document management system</li>
                <li style="padding: 4px 0; color: #333333; font-size: 16px; line-height: 1.5;">Real-time trip updates and notifications</li>
              </ul>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);">
                  Accept Invitation & Create Account
                </a>
              </div>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #059669;">
                <p style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0; font-weight: 500;">
                  <strong>Secure Access:</strong> This invitation link is unique to you and expires in 7 days for security.
                </p>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                If you have any questions, please contact your administrator at ${data.companyName} or reply to this email.
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #999999; font-size: 12px; line-height: 1.4; margin: 0;">
                  If the button above doesn't work, copy and paste this link into your browser:<br>
                  <a href="${acceptUrl}" style="color: #059669; word-break: break-all;">${acceptUrl}</a>
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
                © ${new Date().getFullYear()} Wolthers & Associates. All rights reserved.<br>
                <a href="https://trips.wolthers.com" style="color: #059669; text-decoration: none;">trips.wolthers.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const result = await this.sendEmail(data.email, subject, html)
      return result

    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending invitation email:', error)
      return { success: false, error: 'Failed to send invitation email' }
    }
  }

  static async sendApprovalEmail(data: ApprovalEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const isApproved = data.status === 'approved'
      const subject = `Invitation ${isApproved ? 'Approved' : 'Declined'} - ${data.companyName}`
      
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation ${isApproved ? 'Approved' : 'Declined'}</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Logo Header -->
            <div style="padding: 40px 30px 20px; text-align: center;">
              <img src="https://wolthers.com/images/wolthers-logo-green.png" alt="Wolthers & Associates" style="width: 200px; height: auto; margin-bottom: 20px;">
              <h1 style="color: ${isApproved ? '#059669' : '#dc2626'}; margin: 0; font-size: 24px; font-weight: 600; line-height: 1.2;">
                Invitation ${isApproved ? 'Approved' : 'Declined'}
              </h1>
              <p style="color: #666666; margin: 10px 0 0; font-size: 16px; line-height: 1.4;">
                Your request to join ${data.companyName}
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 0 30px 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hello,
              </p>
            
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${isApproved 
                  ? `Great news! <strong>${data.adminName}</strong> has approved your invitation to join <strong>${data.companyName}</strong> as a <strong>${data.role}</strong>.`
                  : `Unfortunately, <strong>${data.adminName}</strong> has declined your request to join <strong>${data.companyName}</strong>.`
                }
              </p>
            
              ${isApproved ? `
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://trips.wolthers.com/auth/register" style="display: inline-block; background: #059669; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);">
                  Create Your Account Now
                </a>
              </div>
              ` : `
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                If you believe this was a mistake, please contact the administrator directly or reach out to Wolthers support.
              </p>
              `}
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #666666; font-size: 14px; margin: 0; line-height: 1.6;">
                © ${new Date().getFullYear()} Wolthers & Associates. All rights reserved.<br>
                <a href="https://trips.wolthers.com" style="color: #059669; text-decoration: none;">trips.wolthers.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const result = await this.sendEmail(data.email, subject, html)
      return result

    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending approval email:', error)
      return { success: false, error: 'Failed to send approval email' }
    }
  }
}

export default EmailService