import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  let user: any = null
  
  try {
    // Authentication logic (same as other API endpoints)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
      try {
        const decoded = verify(token, secret) as any
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
          if (!sessionError && supabaseUser) {
            const { data: userData, error: userError } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()

            if (!userError && userData) {
              user = userData
            }
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      to, 
      subject, 
      activityTitle, 
      meetingDate, 
      content, 
      companies, 
      mediaEntries,
      attachments 
    } = body

    if (!to || !subject || !activityTitle) {
      return NextResponse.json({ 
        error: 'Missing required fields: to, subject, activityTitle' 
      }, { status: 400 })
    }

    // Format the meeting date
    const formatMeetingDateTime = (date: string | Date) => {
      const meetingDateTime = new Date(date)
      return meetingDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Build email content
    const emailContent = `
      <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              border-bottom: 2px solid #e5e7eb; 
              margin-bottom: 20px; 
              padding-bottom: 15px; 
            }
            .meta { 
              color: #6b7280; 
              font-size: 14px; 
              margin: 5px 0; 
            }
            .content { 
              margin: 20px 0; 
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
            }
            .companies { 
              background: #f0fdf4; 
              border: 1px solid #bbf7d0; 
              padding: 15px; 
              border-radius: 6px; 
              margin: 15px 0; 
            }
            .media-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
            .media-item { 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              padding: 15px; 
              margin: 15px 0; 
              background: #f9fafb; 
            }
            .transcript { 
              background: #eff6ff; 
              border-left: 4px solid #3b82f6; 
              padding: 12px; 
              margin: 10px 0; 
              font-style: italic;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${activityTitle}</h1>
            <div class="meta">Meeting Date: ${formatMeetingDateTime(meetingDate)}</div>
            <div class="meta">Notes sent by: ${user.full_name || user.email}</div>
            ${companies && companies.length > 0 ? `
            <div class="companies">
              <strong>Companies Present:</strong><br>
              ${companies.map((c: any) => `${c.name}${c.representatives ? ` (${c.representatives.map((r: any) => r.name).join(', ')})` : ''}`).join('<br>')}
            </div>` : ''}
          </div>
          
          <div class="content">
            ${content.html || content.plainText || 'No content available'}
          </div>
          
          ${mediaEntries && mediaEntries.length > 0 ? `
          <div class="media-section">
            <h2>Media Timeline</h2>
            ${mediaEntries.map((entry: any) => `
              <div class="media-item">
                <strong>${entry.type.toUpperCase()}</strong> - ${entry.relativeTime}<br>
                ${entry.description ? `<em>${entry.description}</em><br>` : ''}
                ${entry.type === 'transcript' && typeof entry.content === 'string' ? 
                  `<div class="transcript">"${entry.content}"</div>` : 
                  entry.type === 'image' ? 
                    `<p>📷 Image captured: ${entry.description || 'Untitled'}</p>` : 
                    `<p>🎵 Audio recording: ${entry.description || 'Untitled'}</p>`
                }
              </div>
            `).join('')}
          </div>` : ''}
          
          ${attachments && attachments.length > 0 ? `
          <div class="media-section">
            <h2>📎 File Attachments</h2>
            ${attachments.map((attachment: any) => `
              <div class="media-item">
                <strong>📄 ${attachment.name}</strong><br>
                <em>Size: ${attachment.size ? `${Math.round(attachment.size / 1024)}KB` : 'Unknown'}</em><br>
                <em>Uploaded by: ${attachment.uploadedBy || 'Unknown'}</em><br>
                <em>Date: ${attachment.uploadedAt ? new Date(attachment.uploadedAt).toLocaleDateString() : 'Unknown'}</em><br>
                <p><a href="${attachment.url}" target="_blank" style="color: #3b82f6; text-decoration: underline;">📥 Download File</a></p>
              </div>
            `).join('')}
          </div>` : ''}
          
          <div class="footer">
            Generated from Wolthers Travel App on ${new Date().toLocaleDateString()}<br>
            <a href="https://trips.wolthers.com">trips.wolthers.com</a>
          </div>
        </body>
      </html>
    `

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'trips@trips.wolthers.com',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: emailContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: error 
      }, { status: 500 })
    }

    console.log('Email sent successfully:', data)
    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}