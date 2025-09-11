import { NextRequest, NextResponse } from 'next/server'
import { sendTripCreationEmails, type TripCreationEmailData } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { 
      tripTitle, 
      tripAccessCode, 
      tripStartDate, 
      tripEndDate, 
      createdBy, 
      participants, 
      companies 
    } = await request.json()

    // Validate required fields
    if (!tripTitle || !tripAccessCode || !tripStartDate || !tripEndDate || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: tripTitle, tripAccessCode, tripStartDate, tripEndDate, createdBy' 
      }, { status: 400 })
    }

    const emailData: TripCreationEmailData = {
      tripTitle,
      tripAccessCode,
      tripStartDate,
      tripEndDate,
      createdBy,
      participants: participants || [],
      companies: companies || []
    }

    const result = await sendTripCreationEmails(emailData)

    if (result.success) {
      console.log(`✅ Trip invitation emails sent successfully for trip ${tripAccessCode}`)
      return NextResponse.json({ 
        success: true,
        message: 'Trip invitation emails sent successfully'
      })
    } else {
      console.error(`❌ Some trip invitation emails failed for trip ${tripAccessCode}:`, result.errors)
      return NextResponse.json({ 
        success: false, 
        error: 'Some emails failed to send',
        errors: result.errors
      }, { status: 207 }) // 207 Multi-Status for partial success
    }

  } catch (error) {
    console.error('Error sending trip invitation emails:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}