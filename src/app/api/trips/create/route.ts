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
        creator_id: userId,
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
        participation_start_date: tripData.startDate,
        participation_end_date: tripData.endDate
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
                participation_start_date: tripData.startDate,
                participation_end_date: tripData.endDate,
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

    // Create vehicle assignments if vehicle and driver are specified
    if (tripData.vehicle || tripData.driver) {
      console.log('🚗 [Create Trip API] Creating vehicle assignment...')
      
      const vehicleAssignment = {
        trip_id: trip.id,
        vehicle_id: tripData.vehicle?.id || null,
        driver_id: tripData.driver?.id || null,
        assignment_type: 'company_vehicle',
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        status: 'assigned',
        notes: `Vehicle: ${tripData.vehicle?.name || 'Not specified'}, Driver: ${tripData.driver?.name || 'Not specified'}`
      }

      const { error: vehicleError } = await supabase
        .from('trip_vehicles')
        .insert(vehicleAssignment)

      if (vehicleError) {
        console.error('⚠️ [Create Trip API] Failed to create vehicle assignment:', vehicleError)
      } else {
        console.log('✅ [Create Trip API] Vehicle assignment created successfully')
      }
    }

    // Send trip creation notification emails
    try {
      console.log('📧 [Create Trip API] Sending trip creation notification emails...')
      
      // Prepare itinerary data for email template
      const { data: itineraryDays } = await supabase
        .from('itinerary_days')
        .select(`
          date,
          activities (
            title,
            start_time,
            duration_minutes,
            location,
            type,
            description
          )
        `)
        .eq('trip_id', trip.id)
        .order('date', { ascending: true })

      // Format itinerary for email
      const itinerary = itineraryDays?.map(day => ({
        date: day.date,
        activities: day.activities.map(activity => ({
          time: new Date(activity.start_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          title: activity.title,
          location: activity.location,
          duration: activity.duration_minutes ? `${activity.duration_minutes} minutes` : undefined
        }))
      })) || []

      // Get participants for email
      const staffParticipants = (tripData.participants || []).map((p: any) => ({
        name: p.full_name || p.name,
        email: p.email,
        role: 'staff'
      }))

      // Get company representatives for email
      const companyReps = (tripData.companies || []).flatMap((company: any) => 
        (company.selectedContacts || []).map((contact: any) => ({
          name: contact.name,
          email: contact.email,
          role: 'guest'
        }))
      )

      // Prepare email data
      const emailData = {
        tripTitle: trip.title,
        tripAccessCode: trip.access_code,
        tripStartDate: trip.start_date,
        tripEndDate: trip.end_date,
        createdBy: user.full_name,
        itinerary: itinerary,
        participants: staffParticipants,
        companies: (tripData.companies || []).map((company: any) => ({
          name: company.name,
          representatives: (company.selectedContacts || []).map((contact: any) => ({
            name: contact.name,
            email: contact.email
          }))
        }))
      }

      // Send the new trip creation notification emails
      const emailResult = await sendTripCreationNotificationEmails(emailData)

      if (emailResult.success) {
        console.log('✅ [Create Trip API] All trip creation notification emails sent successfully')
      } else {
        console.error('⚠️ [Create Trip API] Some notification emails failed:', emailResult.errors)
      }

      // Send separate host visit confirmation emails to host representatives
      if (tripData.hostCompanies && tripData.hostCompanies.length > 0) {
        console.log('📧 [Create Trip API] Sending host visit confirmation emails...')
        
        for (const hostCompany of tripData.hostCompanies) {
          if (hostCompany.representatives && hostCompany.representatives.length > 0) {
            // Find activities/visits scheduled with this host company
            const hostActivities = itinerary.flatMap(day => 
              day.activities.filter(activity => 
                activity.title.toLowerCase().includes('visit') && 
                (activity.title.toLowerCase().includes(hostCompany.name.toLowerCase()) ||
                 activity.title.toLowerCase().includes(hostCompany.fantasy_name?.toLowerCase() || ''))
              )
            )

            // Get visiting guest companies for this host
            const visitingGuests = (tripData.companies || [])
              .filter((company: any) => company.selectedContacts && company.selectedContacts.length > 0)
              .map((company: any) => company.name)

            // Send visit confirmation email to each host representative
            for (const representative of hostCompany.representatives) {
              if (representative.email) {
                try {
                  const hostEmailData = {
                    hostName: representative.name,
                    companyName: hostCompany.name,
                    visitDate: hostActivities.length > 0 ? hostActivities[0].time : trip.start_date,
                    visitTime: hostActivities.length > 0 ? hostActivities[0].time : '09:00',
                    guests: visitingGuests,
                    inviterName: user.full_name,
                    inviterEmail: user.email,
                    yesUrl: `${process.env.NEXT_PUBLIC_APP_URL}/visits/confirm?token=`,
                    noUrl: `${process.env.NEXT_PUBLIC_APP_URL}/visits/decline?token=`,
                    tripTitle: trip.title,
                    tripAccessCode: trip.access_code
                  }

                  await sendHostVisitConfirmationEmail(representative.email, hostEmailData)
                  
                  console.log(`✅ [Create Trip API] Sent visit confirmation to ${representative.name} at ${hostCompany.name}`)
                  
                  // Add delay between host emails to respect rate limits
                  await new Promise(resolve => setTimeout(resolve, 2000))
                  
                } catch (hostEmailError) {
                  console.error(`❌ [Create Trip API] Failed to send visit confirmation to ${representative.email}:`, hostEmailError)
                }
              }
            }
          }
        }
      }

    } catch (emailError) {
      console.error('❌ [Create Trip API] Email sending failed:', emailError)
      // Don't fail the trip creation if emails fail
    }

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