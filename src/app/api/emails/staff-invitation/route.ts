import { NextRequest, NextResponse } from 'next/server'
import { sendStaffInvitationEmail, type StaffInvitationEmailData } from '@/lib/resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, inviterName, inviterEmail, newStaffName, role, tripTitle, whatsApp } = await request.json()

    // Validate required fields
    if (!email || !inviterName || !inviterEmail || !newStaffName || !role) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: email, inviterName, inviterEmail, newStaffName, role' 
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    const emailData: StaffInvitationEmailData = {
      inviterName,
      inviterEmail,
      newStaffName,
      role,
      tripTitle,
      whatsApp
    }

    const result = await sendStaffInvitationEmail(email, emailData)

    if (result.success) {
      console.log(`✅ Staff invitation email sent successfully to ${email}`)
      return NextResponse.json({ 
        success: true,
        message: 'Staff invitation email sent successfully'
      })
    } else {
      console.error(`❌ Failed to send staff invitation email to ${email}:`, result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error || 'Failed to send email'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error sending staff invitation email:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}