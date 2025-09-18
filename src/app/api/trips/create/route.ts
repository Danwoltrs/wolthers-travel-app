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
      companiesCount: tripData.companies?.length || 0,
      activitiesCount: tripData.activities?.length || 0,
      generatedActivitiesCount: tripData.generatedActivities?.length || 0,
      hasVehicle: !!tripData.vehicle,
      hasDriver: !!tripData.driver,
      hasVehicles: !!(tripData.vehicles?.length),
      hasDrivers: !!(tripData.drivers?.length)
    })

    // Debug log the full structure for critical data
    if (tripData.generatedActivities?.length > 0) {
      console.log('📅 [Create Trip API] Generated activities sample:', tripData.generatedActivities.slice(0, 2))
    }
    if (tripData.participants?.length > 0) {
      console.log('👥 [Create Trip API] Participants sample:', tripData.participants.slice(0, 2))
    }

    // Generate access code with priority system (same as progressive save)
    let accessCode = tripData.accessCode
    console.log('🎫 [Create Trip API] Access code generation - analyzing priority sources:')
    console.log('  - tripData.accessCode (predefined):', tripData.accessCode)
    console.log('  - Request body accessCode:', tripData.accessCode)
    
    // Priority 1: Use predefined accessCode if provided (for SCTA-25, NCA-26, BLASER-SEP25, etc.)
    if (tripData.accessCode && typeof tripData.accessCode === 'string' && tripData.accessCode.trim()) {
      accessCode = tripData.accessCode.trim()
      console.log('✅ [Create Trip API] Using predefined accessCode:', accessCode)
    }
    // Priority 2: Generate if no predefined code found
    else {
      console.log('🔄 [Create Trip API] No predefined code found, generating...')
      
      // Import the same logic as progressive save
      const { makeTripSlug } = await import('@/lib/tripCodeGenerator')
      
      const companies = tripData.companies || []
      const startDate = new Date(tripData.startDate || new Date())
      
      // Use the same business logic as progressive save
      const baseSlug = makeTripSlug({
        trip_type: mapTripType(tripData.tripType || 'business'),
        companies: companies,
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear(),
        code: null, // No predefined code
        title: tripData.title
      })
      
      // Ensure uniqueness using database function
      try {
        const { data: uniqueSlug } = await supabase
          .rpc('generate_unique_trip_slug', {
            base_slug: baseSlug,
            creator_user_id: userId
          })
        
        accessCode = uniqueSlug || baseSlug
        console.log('✅ [Create Trip API] Generated unique code:', accessCode)
      } catch (error) {
        console.warn('⚠️ [Create Trip API] Database slug generation failed, using fallback:', error)
        // Fallback to simple generation
        const codeBase = tripData.title ? tripData.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase() : 'TRIP'
        const dateCode = new Date().getMonth().toString().padStart(2, '0') + new Date().getDate().toString().padStart(2, '0')
        const randomCode = Math.floor(Math.random() * 999).toString().padStart(3, '0')
        accessCode = `${codeBase}_${dateCode}_${randomCode}`
        console.log('⚠️ [Create Trip API] Using fallback code:', accessCode)
      }
    }
    
    console.log('🎫 [Create Trip API] Final access code to use:', accessCode)

    // Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: tripData.title,
        access_code: accessCode,
        trip_type: tripData.tripType,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        creator_id: userId,
        status: 'confirmed', // Mark as confirmed since all data is being added
        completion_step: 6, // Mark as completed since all data is being added
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
    
    // Force update status and completion_step to override database defaults
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        status: 'confirmed', // Override default 'planning'
        completion_step: 6   // Override default 0
      })
      .eq('id', trip.id)

    if (updateError) {
      console.error('⚠️ [Create Trip API] Failed to update status/completion:', updateError)
    } else {
      console.log('✅ [Create Trip API] Updated trip status to confirmed and completion_step to 6')
    }

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
        console.error('⚠️ [Create Trip API] Participant insert data sample:', participantInserts.slice(0, 2))
        // Don't fail the trip creation, but log the error for debugging
      } else {
        console.log('✅ [Create Trip API] Added trip participants:', participantInserts.length)
      }
    }

    // Create external company participants (hosts/guests)
    if (tripData.companies && tripData.companies.length > 0) {
      for (const company of tripData.companies) {
        // Handle both selectedContacts (guests) and representatives (hosts) 
        const contacts = company.selectedContacts || company.representatives || []
        
        if (contacts && contacts.length > 0) {
          console.log(`👤 [Create Trip API] Creating participants for ${company.name || company.fantasy_name}:`, contacts.length)
          
          for (const contact of contacts) {
            // Try to find existing user first
            const { data: existingUser } = await supabase
              .from('users')
              .select('id')
              .eq('email', contact.email)
              .single()

            let participantUserId = existingUser?.id

            // If no existing user, create a guest entry with UUID
            if (!participantUserId) {
              // Use crypto.randomUUID() for better uniqueness
              participantUserId = crypto.randomUUID()
            }

            // Determine role based on company context or explicit role
            const role = contact.role || (company.isHost || company.role === 'host' ? 'host' : 'guest')

            const participantData = {
              trip_id: trip.id,
              user_id: participantUserId,
              role: role,
              email_sent: false,
              participation_start_date: tripData.startDate,
              participation_end_date: tripData.endDate,
              guest_name: existingUser ? null : (contact.name || contact.full_name),
              guest_email: existingUser ? null : contact.email,
              guest_company: existingUser ? null : (company.name || company.fantasy_name),
              company_id: company.id
            }

            const { error: participantError } = await supabase
              .from('trip_participants')
              .insert(participantData)

            if (participantError) {
              console.error(`⚠️ [Create Trip API] Failed to add participant ${contact.name || contact.email}:`, participantError)
              // Don't fail the trip creation, just log the error
            } else {
              console.log(`✅ [Create Trip API] Added participant ${contact.name || contact.email} for ${company.name || company.fantasy_name}`)
            }
          }
        }
      }
      console.log('✅ [Create Trip API] Processed external company participants')
    }

    // Create calendar activities - use generatedActivities from calendar step
    const activitiesToCreate = tripData.generatedActivities || tripData.activities || []
    if (activitiesToCreate.length > 0) {
      console.log('📅 [Create Trip API] Creating calendar activities:', activitiesToCreate.length)
      
      const activityInserts = activitiesToCreate.map((activity: any) => ({
        trip_id: trip.id,
        title: activity.title,
        description: activity.description || '',
        activity_date: activity.activity_date || new Date(activity.start_time).toISOString().split('T')[0],
        start_time: activity.start_time,
        end_time: activity.end_time,
        location: activity.location || '',
        type: activity.type || 'meeting',
        activity_type: activity.activity_type || activity.type || 'meeting',
        priority_level: activity.priority || 'medium',
        notes: activity.notes || '',
        visibility_level: activity.visibility_level || 'all',
        is_confirmed: activity.is_confirmed || false,
        company_id: activity.company_id || null,
        company_name: activity.company_name || null,
        host: activity.host || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: activitiesError } = await supabase
        .from('activities')
        .insert(activityInserts)

      if (activitiesError) {
        console.error('❌ [Create Trip API] Failed to create calendar activities:', activitiesError)
        console.error('❌ [Create Trip API] Activity insert data sample:', activityInserts.slice(0, 2))
        // Don't fail the trip creation, but log the error for debugging
      } else {
        console.log('✅ [Create Trip API] Created calendar activities successfully')
      }
    }

    // Create vehicle assignments - handle both single and array formats
    const vehicles = tripData.vehicles || (tripData.vehicle ? [tripData.vehicle] : [])
    const drivers = tripData.drivers || (tripData.driver ? [tripData.driver] : [])
    
    if (vehicles.length > 0 || drivers.length > 0) {
      console.log('🚗 [Create Trip API] Creating vehicle/driver assignments...', { 
        vehicles: vehicles.length, 
        drivers: drivers.length 
      })
      
      const vehicleInserts = []
      
      // If we have both vehicles and drivers, pair them up
      if (vehicles.length > 0 && drivers.length > 0) {
        const maxLength = Math.max(vehicles.length, drivers.length)
        for (let i = 0; i < maxLength; i++) {
          const vehicle = vehicles[i % vehicles.length]
          const driver = drivers[i % drivers.length]
          
          vehicleInserts.push({
            id: crypto.randomUUID(),
            trip_id: trip.id,
            vehicle_id: vehicle.id,
            driver_id: driver.id,
            assigned_from: tripData.startDate,
            assigned_to: tripData.endDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      } else if (vehicles.length > 0) {
        // Only vehicles, no drivers
        for (const vehicle of vehicles) {
          vehicleInserts.push({
            id: crypto.randomUUID(),
            trip_id: trip.id,
            vehicle_id: vehicle.id,
            driver_id: null,
            assigned_from: tripData.startDate,
            assigned_to: tripData.endDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      } else if (drivers.length > 0) {
        // Only drivers, no vehicles
        for (const driver of drivers) {
          vehicleInserts.push({
            id: crypto.randomUUID(),
            trip_id: trip.id,
            vehicle_id: null,
            driver_id: driver.id,
            assigned_from: tripData.startDate,
            assigned_to: tripData.endDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      }
      
      if (vehicleInserts.length > 0) {
        const { error: vehicleError } = await supabase
          .from('trip_vehicles')
          .insert(vehicleInserts)
        
        if (vehicleError) {
          console.error('⚠️ [Create Trip API] Failed to create vehicle/driver assignments:', vehicleError)
          console.error('⚠️ [Create Trip API] Vehicle insert data sample:', vehicleInserts.slice(0, 2))
          // Don't fail the trip creation, but log the error for debugging
        } else {
          console.log('✅ [Create Trip API] Vehicle/driver assignments created successfully')
        }
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

// Helper function to map trip types for slug generation
function mapTripType(tripType: string): 'conference' | 'event' | 'business' | 'client_visit' {
  switch (tripType?.toLowerCase()) {
    case 'conference':
    case 'convention':
      return 'conference'
    case 'event':
      return 'event'
    case 'client_visit':
    case 'client-visit':
      return 'client_visit'
    case 'business':
    default:
      return 'business'
  }
}