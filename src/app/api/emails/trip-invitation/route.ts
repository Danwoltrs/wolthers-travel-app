import { NextRequest, NextResponse } from 'next/server'
import { sendTripItineraryEmails, type TripItineraryEmailData } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { 
      tripTitle, 
      tripAccessCode, 
      tripStartDate, 
      tripEndDate, 
      createdBy, 
      participants, 
      companies,
      itinerary,
      vehicle,
      driver
    } = await request.json()

    // Validate required fields
    if (!tripTitle || !tripAccessCode || !tripStartDate || !tripEndDate || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: tripTitle, tripAccessCode, tripStartDate, tripEndDate, createdBy' 
      }, { status: 400 })
    }

    const emailData: TripItineraryEmailData = {
      tripTitle,
      tripAccessCode,
      tripStartDate,
      tripEndDate,
      createdBy,
      itinerary: itinerary || [],
      participants: participants || [],
      companies: companies || [],
      vehicle: vehicle || undefined,
      driver: driver || undefined
    }

    const result = await sendTripItineraryEmails(emailData)

    if (result.success) {
      console.log(`✅ Trip itinerary emails sent successfully for trip ${tripAccessCode}`)
      return NextResponse.json({ 
        success: true,
        message: 'Trip itinerary emails sent successfully'
      })
    } else {
      console.error(`❌ Some trip itinerary emails failed for trip ${tripAccessCode}:`, result.errors)
      return NextResponse.json({ 
        success: false, 
        error: 'Some emails failed to send',
        errors: result.errors
      }, { status: 207 }) // 207 Multi-Status for partial success
    }

  } catch (error) {
    console.error('Error sending trip itinerary emails:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}