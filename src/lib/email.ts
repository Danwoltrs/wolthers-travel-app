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

// Generate a 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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