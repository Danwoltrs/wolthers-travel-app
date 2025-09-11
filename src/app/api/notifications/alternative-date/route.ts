import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tripId,
      tripCode,
      tripTitle,
      hostEmail,
      hostName,
      originalDate,
      alternativeDate,
      alternativeTime,
      declineReason,
      additionalNotes,
      tripCreatorEmail
    } = body

    // Validate required fields
    if (!tripCode || !tripTitle || !hostEmail || !alternativeDate || !alternativeTime || !tripCreatorEmail) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    const subject = `Alternative Date Request - ${tripTitle} (${tripCode})`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Alternative Date Request</title>
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
              padding: 0; 
              border-radius: 12px; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #f59e0b, #d97706); 
              color: white; 
              padding: 30px; 
              text-align: center; 
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px;
            }
            .alert-box {
              background: #fef3cd;
              border: 2px solid #fbbf24;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .details-box {
              background: #f3f4f6;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .alternative-box {
              background: #ecfdf5;
              border: 2px solid #10b981;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .action-buttons {
              text-align: center;
              margin: 30px 0;
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
            }
            .btn-approve {
              background: #10b981;
              color: white;
            }
            .btn-contact {
              background: #3b82f6;
              color: white;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              padding: 25px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Alternative Date Request</h1>
              <p>A host has suggested a different visit date</p>
            </div>
            
            <div class="content">
              <div class="alert-box">
                <h3>🔄 Visit Date Change Requested</h3>
                <p><strong>${hostName || hostEmail}</strong> cannot accommodate the original visit date and has suggested an alternative.</p>
              </div>
              
              <div class="details-box">
                <h3>📋 Trip Details</h3>
                <p><strong>Trip:</strong> ${tripTitle}</p>
                <p><strong>Code:</strong> ${tripCode}</p>
                <p><strong>Host:</strong> ${hostName || hostEmail}</p>
                <p><strong>Host Email:</strong> ${hostEmail}</p>
              </div>

              <div class="details-box">
                <h3>❌ Decline Information</h3>
                <p><strong>Reason:</strong> ${declineReason}</p>
                <p><strong>Original Date:</strong> ${new Date(originalDate).toLocaleDateString()}</p>
                ${additionalNotes ? `<p><strong>Additional Notes:</strong> ${additionalNotes}</p>` : ''}
              </div>

              <div class="alternative-box">
                <h3>✨ Suggested Alternative</h3>
                <p><strong>New Date:</strong> ${new Date(alternativeDate).toLocaleDateString()}</p>
                <p><strong>Preferred Time:</strong> ${alternativeTime}</p>
              </div>

              <div class="action-buttons">
                <p><strong>Quick Actions:</strong></p>
                <p>You can accept the proposal instantly or contact the host for further discussion.</p>
                
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://trips.wolthers.com'}/api/visits/accept-proposal?tripCode=${tripCode}&hostEmail=${encodeURIComponent(hostEmail)}&alternativeDate=${alternativeDate}&alternativeTime=${encodeURIComponent(alternativeTime)}&token=${Buffer.from(`${tripCode}-${hostEmail}-${Date.now()}`).toString('base64url')}" 
                   class="btn btn-approve">
                  ✅ Accept Proposal
                </a>
                
                <a href="mailto:${hostEmail}?subject=Re: Visit Date Change for ${tripCode}&body=Hi ${hostName || 'there'},%0D%0A%0D%0AThank you for your alternative date suggestion for our visit.%0D%0A%0D%0AProposed: ${new Date(alternativeDate).toLocaleDateString()} at ${alternativeTime}%0D%0A%0D%0APlease let me know if this works for your schedule.%0D%0A%0D%0ABest regards" 
                   class="btn btn-contact">
                  📧 Contact Host
                </a>
              </div>

              <div class="details-box">
                <h4>💡 How to proceed:</h4>
                <ol>
                  <li><strong>Review the alternative date</strong> - Check if it works with your trip schedule</li>
                  <li><strong>Contact the host</strong> - Use the email button above to respond directly</li>
                  <li><strong>Update your trip</strong> - Modify the trip dates in your dashboard if accepted</li>
                  <li><strong>Notify your team</strong> - Update other participants about date changes</li>
                </ol>
              </div>
            </div>

            <div class="footer">
              <p><strong>Wolthers & Associates Travel Team</strong></p>
              <p style="font-size: 12px; color: #999;">
                This is an automated notification from the Wolthers Travel Platform.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Alternative Date Request - ${tripTitle} (${tripCode})

A host has requested a different visit date:

Trip: ${tripTitle}
Code: ${tripCode}
Host: ${hostName || hostEmail}
Host Email: ${hostEmail}

Decline Reason: ${declineReason}
Original Date: ${new Date(originalDate).toLocaleDateString()}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ''}

SUGGESTED ALTERNATIVE:
New Date: ${new Date(alternativeDate).toLocaleDateString()}
Preferred Time: ${alternativeTime}

Please contact the host directly to confirm this new arrangement.

Best regards,
Wolthers & Associates Travel Team
    `

    const result = await resend.emails.send({
      from: 'Wolthers Travel <trips@trips.wolthers.com>',
      to: [tripCreatorEmail],
      subject: subject,
      html: html,
      text: text,
      reply_to: hostEmail // Allow direct replies to the host
    })

    if (result.error) {
      console.error('Failed to send alternative date notification:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error.message
      }, { status: 500 })
    }

    console.log(`✅ Alternative date notification sent to ${tripCreatorEmail} for trip ${tripCode}`)

    return NextResponse.json({
      success: true,
      message: 'Alternative date notification sent successfully'
    })

  } catch (error) {
    console.error('Error sending alternative date notification:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}