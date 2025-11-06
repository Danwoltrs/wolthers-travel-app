import { NextRequest, NextResponse } from 'next/server'
import { sendStaffInvitationEmail, type StaffInvitationEmailData } from '@/lib/resend'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, inviterName, inviterEmail, newStaffName, role, tripTitle, tripAccessCode, whatsApp } = await request.json()

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

    // If no tripAccessCode provided, use a placeholder or skip email
    if (!tripAccessCode) {
      console.log(`⚠️ No tripAccessCode provided for staff invitation to ${email}, skipping email`)
      return NextResponse.json({
        success: true,
        message: 'Staff invitation email skipped (no trip code available yet)'
      })
    }

    const emailData: StaffInvitationEmailData = {
      tripAccessCode,
      inviterName,
      inviterEmail,
      newStaffName,
      role,
      tripTitle,
      whatsApp
    }

    await sendStaffInvitationEmail(email, emailData)
    console.log(`✅ Staff invitation email sent successfully to ${email}`)
    return NextResponse.json({
      success: true,
      message: 'Staff invitation email sent successfully'
    })

  } catch (error) {
    console.error('Error sending staff invitation email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}