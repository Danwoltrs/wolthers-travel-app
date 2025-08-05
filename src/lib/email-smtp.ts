import nodemailer from 'nodemailer';

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

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '465'),
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
};

// Get logo as inline attachment
function getLogoAttachment() {
  // Simple SVG logo for email
  const logoSvg = `
    <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="25" fill="#059669"/>
      <text x="30" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">W</text>
    </svg>
  `;
  
  return {
    filename: 'logo.svg',
    content: Buffer.from(logoSvg),
    cid: 'logo' // Content ID for inline use
  };
}

// Minimal Email Template
function getMinimalTemplate(data: OTPEmailData): string {
  const purpose = data.purpose === 'signin' ? 'Sign In' : data.purpose === 'signup' ? 'Account Verification' : 'Password Reset';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wolthers Travel - ${purpose}</title>
    </head>
    <body style="margin: 0; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; color: #111827;">
      <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; text-align: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <img src="cid:logo" alt="Wolthers Travel" style="width: 60px; height: 60px; margin-bottom: 24px;">
        
        <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827;">Your verification code</h1>
        
        <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
          ${data.name ? `Hi ${data.name}, ` : ''}Enter this code to ${purpose.toLowerCase()}:
        </p>
        
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 0 0 32px 0;">
          <div style="font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; color: #059669; letter-spacing: 4px;">${data.otp}</div>
        </div>
        
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          This code expires in 10 minutes.
        </p>
      </div>
    </body>
    </html>
  `;
}

// Classic Email Template
function getClassicTemplate(data: OTPEmailData): string {
  const purpose = data.purpose === 'signin' ? 'Sign In' : data.purpose === 'signup' ? 'Account Verification' : 'Password Reset';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wolthers Travel - ${purpose}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Georgia, serif; background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); min-height: 100vh;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%); min-height: 100vh;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="100%" style="max-width: 500px; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); overflow: hidden;" cellpadding="0" cellspacing="0">
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 32px; color: white;">
                  <img src="cid:logo" alt="Wolthers Travel" style="width: 80px; height: 80px; margin-bottom: 16px; filter: brightness(0) invert(1);">
                  <h1 style="margin: 0; font-size: 28px; font-weight: normal;">Wolthers Travel</h1>
                  <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">${purpose}</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 32px; text-align: center;">
                  <h2 style="margin: 0 0 24px 0; font-size: 24px; color: #111827;">
                    ${data.name ? `Hello ${data.name}` : 'Hello'}
                  </h2>
                  
                  <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                    We received a request to ${purpose.toLowerCase()} to your account. Please use the verification code below:
                  </p>
                  
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background: #f9fafb; border: 2px solid #059669; border-radius: 12px; padding: 24px 32px; margin: 0 0 32px 0;">
                          <div style="font-size: 36px; font-weight: bold; font-family: 'Courier New', monospace; color: #059669; letter-spacing: 6px;">${data.otp}</div>
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 0; color: #6b7280; font-size: 14px; font-style: italic;">
                    This verification code will expire in 10 minutes for security purposes.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Wolthers & Associates. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Modern Email Template
function getModernTemplate(data: OTPEmailData): string {
  const purpose = data.purpose === 'signin' ? 'Sign In' : data.purpose === 'signup' ? 'Account Verification' : 'Password Reset';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Wolthers Travel - ${purpose}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: white;">
      <div style="min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px;">
        <div style="max-width: 450px; margin: 0 auto;">
          
          <!-- Floating Card -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 24px; padding: 0; overflow: hidden; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5); border: 1px solid rgba(255, 255, 255, 0.1);">
            
            <!-- Header with Logo -->
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px; text-align: center; position: relative;">
              <img src="cid:logo" alt="Wolthers Travel" style="width: 70px; height: 70px; margin-bottom: 16px; filter: brightness(0) invert(1);">
              <h1 style="margin: 0; font-size: 20px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">Wolthers Travel</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 32px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: white;">
                  ${purpose}
                </h2>
                <p style="margin: 0; color: #94a3b8; font-size: 14px;">
                  ${data.name ? `Hi ${data.name}, ` : ''}verification required
                </p>
              </div>
              
              <!-- OTP Display -->
              <div style="background: rgba(5, 150, 105, 0.1); border: 1px solid #059669; border-radius: 16px; padding: 24px; margin: 0 0 32px 0; text-align: center; backdrop-filter: blur(10px);">
                <p style="margin: 0 0 16px 0; color: #10b981; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verification Code</p>
                <div style="font-size: 32px; font-weight: 700; font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace; color: #10b981; letter-spacing: 8px; text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);">${data.otp}</div>
              </div>
              
              <!-- Info Box -->
              <div style="background: rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 16px; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                  <strong style="color: #e2e8f0;">Security Notice:</strong><br>
                  This code expires in 10 minutes. Never share it with anyone.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: rgba(15, 23, 42, 0.5); padding: 20px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0; color: #64748b; font-size: 11px;">
                © ${new Date().getFullYear()} Wolthers & Associates • Secure Travel Management
              </p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOTPEmailSMTP(data: OTPEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const template = data.template || 'modern';
    let htmlContent: string;
    
    switch (template) {
      case 'minimal':
        htmlContent = getMinimalTemplate(data);
        break;
      case 'classic':
        htmlContent = getClassicTemplate(data);
        break;
      case 'modern':
      default:
        htmlContent = getModernTemplate(data);
        break;
    }
    
    const purpose = data.purpose === 'signin' ? 'Sign In' : data.purpose === 'signup' ? 'Account Verification' : 'Password Reset';
    
    const mailOptions = {
      from: `"Wolthers Travel" <${process.env.EMAIL_FROM}>`,
      to: data.to,
      subject: `Your ${purpose} Code - Wolthers Travel`,
      html: htmlContent,
      attachments: [getLogoAttachment()],
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('SMTP Email sent successfully:', result.messageId);
    return { success: true };
  } catch (error) {
    console.error('SMTP Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}