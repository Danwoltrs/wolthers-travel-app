import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

export type EmailTemplate = 'minimal' | 'classic' | 'modern';

export interface OTPEmailData {
  to: string;
  name?: string;
  otp: string;
  purpose: 'signin' | 'signup' | 'reset';
  template?: EmailTemplate;
}

export interface GuestInvitationEmailData {
  to: string;
  guestName: string;
  tripTitle: string;
  tripStartDate: string;
  tripEndDate: string;
  invitedBy: string;
  invitationToken: string;
  tripId: string;
  acceptUrl: string;
  companyName?: string;
  message?: string;
}

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a secure invitation token
export function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36);
}

// Clean Email Template matching the provided design
function getCleanTemplate(data: OTPEmailData): string {
  const purpose = data.purpose === 'signin' ? 'sign in' : data.purpose === 'signup' ? 'account verification' : data.purpose === 'reset' ? 'password reset' : 'account verification';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Verification Code - Wolthers Travel</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: white;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 60px 40px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
        
        <!-- Logo -->
        <img src="https://wolthers.com/images/wolthers-logo-green.png" alt="Wolthers Associates" style="width: 240px; height: auto; margin-bottom: 40px; display: block; margin-left: auto; margin-right: auto;">
        
        <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 400; color: #333; line-height: 1.2;">Your verification code</h1>
        
        <p style="margin: 0 0 40px 0; color: #666; font-size: 16px; line-height: 1.5;">
          ${data.name ? `Hi ${data.name.split(' ')[0]}, enter this code to ${purpose}:` : `Enter this code to ${purpose}:`}
        </p>
        
        <!-- OTP Code -->
        <div style="font-size: 48px; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #059669; letter-spacing: 8px; text-align: center; margin: 0 0 40px 0;">${data.otp}</div>
        
        <p style="margin: 0; color: #999; font-size: 14px;">
          This code expires in 10 minutes.
        </p>
        
      </div>
    </body>
    </html>
  `;
}

// Guest Invitation Email Template
function getGuestInvitationTemplate(data: GuestInvitationEmailData): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Trip Invitation - ${data.tripTitle}</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">
        
        <!-- Logo -->
        <img src="https://wolthers.com/images/wolthers-logo-green.png" alt="Wolthers Associates" style="width: 240px; height: auto; margin-bottom: 32px; display: block; margin-left: auto; margin-right: auto;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 600; color: #1a1a1a; line-height: 1.2;">You're Invited!</h1>
          <p style="margin: 0; color: #666; font-size: 18px; line-height: 1.4;">
            ${data.invitedBy} has invited you to join an upcoming trip
          </p>
        </div>
        
        <!-- Trip Details Card -->
        <div style="background: #f8fffe; border: 1px solid #d1fae5; border-radius: 12px; padding: 32px; margin-bottom: 32px;">
          <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #065f46;">${data.tripTitle}</h2>
          
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #047857; font-size: 16px;">Travel Dates</div>
            <div style="color: #374151; font-size: 16px; line-height: 1.4;">${formatDate(data.tripStartDate)} - ${formatDate(data.tripEndDate)}</div>
          </div>
          
          ${data.companyName ? `
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #047857; font-size: 16px;">Company</div>
            <div style="color: #374151; font-size: 16px; line-height: 1.4;">${data.companyName}</div>
          </div>
          ` : ''}
        </div>
        
        ${data.message ? `
        <!-- Personal Message -->
        <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #059669;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">Message from ${data.invitedBy}:</h3>
          <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.5; font-style: italic;">"${data.message}"</p>
        </div>
        ` : ''}
        
        <!-- Call to Action -->
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${data.acceptUrl}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); transition: all 0.2s ease;">
            Accept Invitation
          </a>
        </div>
        
        <!-- Additional Info -->
        <div style="border-top: 1px solid #e5e5e5; padding-top: 24px; text-align: center;">
          <p style="margin: 0 0 16px 0; color: #666; font-size: 14px; line-height: 1.5;">
            Click the button above to accept this invitation and join the trip. You'll be able to view trip details, itinerary, and connect with other participants.
          </p>
          
          <p style="margin: 0; color: #999; font-size: 12px;">
            This invitation will expire in 7 days. If you're having trouble with the button above, copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #059669;">${data.acceptUrl}</span>
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f0f0f0;">
          <p style="margin: 0; color: #999; font-size: 12px;">
            © ${new Date().getFullYear()} Wolthers & Associates. All rights reserved.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}


export async function sendOTPEmail(data: OTPEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = getCleanTemplate(data);
    
    const purpose = data.purpose === 'signin' ? 'Sign In' : data.purpose === 'signup' ? 'Account Verification' : 'Password Reset';
    
    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: data.to,
      subject: `Your ${purpose} Code - Wolthers Travel`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Email sending failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Email sent successfully:', result.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function sendGuestInvitationEmail(data: GuestInvitationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = getGuestInvitationTemplate(data);
    
    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: data.to,
      subject: `Trip Invitation: ${data.tripTitle}`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Guest invitation email sending failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Guest invitation email sent successfully:', result.data?.id);
    return { success: true };
  } catch (error) {
    console.error('Guest invitation email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}