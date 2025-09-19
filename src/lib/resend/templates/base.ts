import { baseUrl, logoUrl } from '../client'

interface CleanTemplateOptions {
  title: string
  content: string
  tripAccessCode?: string
  tripUrl?: string
  showViewTripButton?: boolean
}

export function createCleanEmailTemplate({
  title,
  content,
  tripAccessCode,
  tripUrl,
  showViewTripButton = true
}: CleanTemplateOptions) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            padding: 40px 20px;
            text-align: center;
            background: white;
          }
          .logo {
            width: 160px;
            height: auto;
            margin-bottom: 0;
          }
          .content {
            padding: 0 30px 30px;
          }
          .main-section {
            background: #f0f9f0;
            padding: 20px;
            border-radius: 6px;
            margin: 30px 0;
          }
          .main-section h2 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 20px;
            font-weight: 600;
          }
          .main-section p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
          }
          .trip-link {
            background: #4a5568;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 500;
            font-size: 14px;
            display: inline-block;
            margin: 15px 0 0 0;
          }
          .trip-link:hover {
            background: #2d3748;
          }
          .content-section {
            margin: 30px 0;
          }
          .content-section h3 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 16px;
            font-weight: 600;
          }
          .separator {
            height: 1px;
            background: #e2e8f0;
            margin: 25px 0;
          }
          .footer {
            text-align: center;
            padding: 20px;
            background: white;
            color: #666;
          }
          .footer p {
            margin: 5px 0;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="Wolthers & Associates" class="logo" />
          </div>
          <div class="content">
            <div class="main-section">
              <h2>${title}</h2>
              ${showViewTripButton && tripAccessCode ? `
              <div style="text-align: center;">
                <a href="${tripUrl || `${baseUrl}/trips/${tripAccessCode}`}" class="trip-link">
                  View Trip Details
                </a>
              </div>
              ` : ''}
            </div>
            ${content}
          </div>
          <div class="footer">
            <p style="font-weight: 600; color: #333;">We wish you a safe travel, and looking forward to seeing you!</p>
            <p>Wolthers & Associates Travel Team</p>
            <p style="color: #999; margin-top: 10px;">
              For questions, please contact our travel team.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function createBaseTemplate(subject: string, title: string, content: string, tripAccessCode?: string) {
  const tripLinkContent = tripAccessCode
    ? `
    <div style="text-align: center; margin-top: 30px;">
      <a href="${baseUrl}/trips/${tripAccessCode}" style="display: inline-block; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; background-color: #004d40; color: white;">View Trip Details</a>
    </div>
    `
    : ''

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
  `
}
