import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ParticipantEmailService } from '@/services/participant-email-service'
import { sendTripCreationNotificationEmails, sendHostVisitConfirmationEmail } from '@/lib/resend'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Create Trip API] Starting trip creation...')
    
    // Authentication
    const authCookie = request.cookies.get('auth-token')
    if (!authCookie) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(authCookie.value, JWT_SECRET) as { userId: string }
    const userId = decoded.userId

    console.log('✅ [Create Trip API] User authenticated:', userId)

    const supabase = createServerSupabaseClient()

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, companies(name)')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [Create Trip API] User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('👤 [Create Trip API] User found:', user.email)

    // Parse request body
    const tripData = await request.json()
    console.log('📝 [Create Trip API] Trip data received:', {
      title: tripData.title,
      type: tripData.tripType,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      staffCount: tripData.participants?.length || 0,
      companiesCount: tripData.companies?.length || 0
    })

    // Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: tripData.title,
        access_code: tripData.accessCode,
        trip_type: tripData.tripType,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        created_by: userId,
        status: 'planning',
        step_data: {
          basicInfo: {
            title: tripData.title,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            type: tripData.tripType
          },
          participants: tripData.participants || [],
          companies: tripData.companies || [],
          activities: tripData.activities || [],
          accommodation: tripData.accommodation,
          transportation: tripData.transportation,
          vehicle: tripData.vehicle,
          driver: tripData.driver
        }
      })
      .select()
      .single()

    if (tripError) {
      console.error('❌ [Create Trip API] Failed to create trip:', tripError)
      return NextResponse.json({ 
        error: 'Failed to create trip', 
        details: tripError.message 
      }, { status: 500 })
    }

    console.log('✅ [Create Trip API] Trip created:', trip.id)

    // Create trip participants for Wolthers staff
    if (tripData.participants && tripData.participants.length > 0) {
      const participantInserts = tripData.participants.map((participant: any) => ({
        trip_id: trip.id,
        user_id: participant.id,
        role: 'staff',
        email_sent: false,
        join_date: tripData.startDate,
        leave_date: tripData.endDate
      }))

      const { error: participantsError } = await supabase
        .from('trip_participants')
        .insert(participantInserts)

      if (participantsError) {
        console.error('⚠️ [Create Trip API] Failed to add participants:', participantsError)
      } else {
        console.log('✅ [Create Trip API] Added trip participants:', participantInserts.length)
      }
    }

    // Create external company participants (hosts/guests)
    if (tripData.companies && tripData.companies.length > 0) {
      for (const company of tripData.companies) {
        if (company.selectedContacts && company.selectedContacts.length > 0) {
          for (const contact of company.selectedContacts) {
            // Try to find existing user first
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('email', contact.email)
              .single()

            let participantUserId = existingUser?.id

            // If no existing user, create a guest entry
            if (!participantUserId) {
              participantUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }

            await supabase
              .from('trip_participants')
              .insert({
                trip_id: trip.id,
                user_id: participantUserId,
                role: 'host',
                email_sent: false,
                join_date: tripData.startDate,
                leave_date: tripData.endDate,
                guest_name: existingUser ? null : contact.name,
                guest_email: existingUser ? null : contact.email,
                guest_company: existingUser ? null : company.name,
                company_id: company.id
              })
          }
        }
      }
      console.log('✅ [Create Trip API] Added external company participants')
    }

    // Create calendar activities
    if (tripData.activities && tripData.activities.length > 0) {
      // First create itinerary days
      const uniqueDates = [...new Set(tripData.activities.map((activity: any) => 
        new Date(activity.start_time).toISOString().split('T')[0]
      ))]

      for (const date of uniqueDates) {
        const { data: itineraryDay } = await supabase
          .from('itinerary_days')
          .insert({
            trip_id: trip.id,
            date: date,
            day_number: uniqueDates.indexOf(date) + 1,
            notes: null
          })
          .select()
          .single()

        // Add activities for this day
        const dayActivities = tripData.activities.filter((activity: any) => 
          new Date(activity.start_time).toISOString().split('T')[0] === date
        )

        for (const activity of dayActivities) {
          await supabase
            .from('activities')
            .insert({
              itinerary_day_id: itineraryDay.id,
              title: activity.title,
              start_time: activity.start_time,
              duration_minutes: activity.duration_minutes || 60,
              location: activity.location,
              description: activity.description,
              type: activity.type || 'meeting',
              company_id: activity.company_id
            })
        }
      }
      console.log('✅ [Create Trip API] Created calendar activities')
    }

    // Send trip creation notification emails
    try {
      console.log('📧 [Create Trip API] Email sending temporarily disabled for debugging...')
      
      // TEMPORARY DEBUG: Skip email sending to isolate the error
      console.log('✅ [Create Trip API] Skipping emails - trip creation successful')
    } catch (emailError) {
      console.error('❌ [Create Trip API] Email sending failed:', emailError)
      // Don't fail the trip creation if emails fail
    }

    // Original email code (commented out for debugging)
    /*
    try {
      console.log('📧 [Create Trip API] Sending trip creation notification emails...')
      
    */

    console.log('🎉 [Create Trip API] Trip creation completed successfully!')

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        title: trip.title,
        access_code: trip.access_code,
        continueUrl: `/trips/${trip.access_code}`
      }
    })

  } catch (error) {
    console.error('💥 [Create Trip API] Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}