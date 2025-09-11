import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('🎯 [Finalize API] Trip finalization request received')
    let user: any = null
    
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    // Try Authorization header first, then cookie
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
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        // Try Supabase session authentication
        const supabaseClient = createServerSupabaseClient()
        
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: tripId } = await params
    console.log('📋 [Finalize API] Trip ID to finalize:', tripId)
    
    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()
    console.log('🕐 [Finalize API] Finalization timestamp:', now)

    // Check if user has permission to edit this trip
    const { data: existingTrip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        creator_id, 
        status,
        is_draft,
        trip_access_permissions (user_id, permission_type, expires_at)
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !existingTrip) {
      console.error('❌ [Finalize API] Trip not found or error:', tripError)
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    console.log('✅ [Finalize API] Trip found:', {
      id: existingTrip.id,
      status: existingTrip.status,
      is_draft: existingTrip.is_draft,
      creator_id: existingTrip.creator_id
    })

    // Check permissions
    const hasPermission = 
      existingTrip.creator_id === user.id ||
      user.is_global_admin ||
      existingTrip.trip_access_permissions?.some((perm: any) => 
        perm.user_id === user.id && 
        ['edit', 'admin'].includes(perm.permission_type) &&
        (!perm.expires_at || new Date(perm.expires_at) > new Date())
      )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Can only finalize trips with planning status (both draft and regular planning trips)
    if (existingTrip.status !== 'planning') {
      return NextResponse.json(
        { error: 'Only trips with planning status can be finalized' },
        { status: 400 }
      )
    }

    // Get the trip's step_data to migrate to normalized tables
    const { data: tripWithStepData, error: stepDataError } = await supabase
      .from('trips')
      .select('step_data')
      .eq('id', tripId)
      .single()

    if (stepDataError || !tripWithStepData) {
      console.error('Failed to get trip step data:', stepDataError)
      // Continue with finalization even if we can't get step data
    }

    // Migrate step data to normalized tables if available
    if (tripWithStepData?.step_data) {
      console.log('📦 Finalizing trip - migrating step data to normalized tables')
      await finalizeExtendedTripData(supabase, tripId, tripWithStepData.step_data, user.id, now)
    }

    // Update trip to finalized status
    console.log('🔄 [Finalize API] Updating trip to finalized status...')
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        status: 'confirmed',
        is_draft: false,
        completion_step: 5,
        creation_status: 'published',
        last_edited_at: now,
        last_edited_by: user.id,
        progress_percentage: 100
      })
      .eq('id', tripId)

    if (updateError) {
      console.error('❌ [Finalize API] Failed to finalize trip:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to finalize trip', 
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ [Finalize API] Trip status updated successfully to confirmed')

    // Remove the draft entry since the trip is now finalized
    const { error: draftDeleteError } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('trip_id', tripId)

    if (draftDeleteError) {
      console.warn('Failed to clean up draft entry:', draftDeleteError)
      // Don't fail the request for this cleanup error
    }

    console.log('🎉 [Finalize API] Trip finalization completed successfully!')
    console.log('📋 [Finalize API] Final trip ID:', tripId)
    
    return NextResponse.json({
      success: true,
      message: 'Trip finalized successfully',
      tripId: tripId
    })

  } catch (error) {
    console.error('Finalize trip error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to finalize extended trip data from step_data to normalized tables
async function finalizeExtendedTripData(supabase: any, tripId: string, stepData: any, userId: string, now: string) {
  try {
    console.log('🔄 Finalizing extended trip data for trip:', tripId)

    // Ensure we don't duplicate data if it was already saved during progressive save
    // Check if we already have data in the normalized tables
    const { data: existingHotels } = await supabase
      .from('trip_hotels')
      .select('id')
      .eq('trip_id', tripId)
      .limit(1)

    const { data: existingFlights } = await supabase
      .from('trip_flights')
      .select('id')
      .eq('trip_id', tripId)
      .limit(1)

    const { data: existingMeetings } = await supabase
      .from('trip_meetings')
      .select('id')
      .eq('trip_id', tripId)
      .limit(1)

    const { data: existingActivities } = await supabase
      .from('activities')
      .select('id')
      .eq('trip_id', tripId)
      .limit(1)

    // Only migrate data if it doesn't already exist (avoid duplicates)
    
    // Insert generated activities if they don't exist (from AI itinerary generation)
    if (!existingActivities || existingActivities.length === 0) {
      if (stepData.generatedActivities && Array.isArray(stepData.generatedActivities) && stepData.generatedActivities.length > 0) {
        console.log('📅 Migrating generated activities to normalized table')
        
        const activityInserts = stepData.generatedActivities.map((activity: any) => ({
          trip_id: tripId,
          title: activity.title,
          description: activity.description || '',
          activity_date: activity.activity_date,
          start_time: activity.start_time,
          end_time: activity.end_time,
          location: activity.location || '',
          activity_type: activity.type || 'meeting',
          priority: activity.priority || 'medium',
          notes: activity.notes || '',
          visibility_level: activity.visibility_level || 'all',
          is_confirmed: activity.is_confirmed || false,
          created_at: now,
          updated_at: now
        }))

        const { error: activitiesError } = await supabase
          .from('activities')
          .insert(activityInserts)

        if (activitiesError) {
          console.error('⚠️ Failed to migrate generated activities:', activitiesError)
        } else {
          console.log('✅ Generated activities migrated successfully')
        }
      }
    }
    
    // Insert hotels if they don't exist
    if (!existingHotels || existingHotels.length === 0) {
      if (stepData.hotels && Array.isArray(stepData.hotels) && stepData.hotels.length > 0) {
        console.log('🏨 Migrating hotel bookings to normalized table')
        
        const hotelInserts = stepData.hotels.map((hotel: any) => ({
          trip_id: tripId,
          hotel_name: hotel.name || hotel.hotelName,
          hotel_address: hotel.address || hotel.hotelAddress,
          check_in_date: hotel.checkInDate || hotel.checkIn,
          check_out_date: hotel.checkOutDate || hotel.checkOut,
          cost_amount: hotel.cost ? parseFloat(hotel.cost) : null,
          cost_currency: 'USD',
          room_type: hotel.roomType,
          guest_names: hotel.guestNames || [],
          booking_status: 'confirmed', // Finalized trips have confirmed bookings
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId
        }))

        const { error: hotelsError } = await supabase
          .from('trip_hotels')
          .insert(hotelInserts)

        if (hotelsError) {
          console.error('⚠️ Failed to migrate hotel bookings:', hotelsError)
        } else {
          console.log('✅ Hotel bookings migrated successfully')
        }
      }
    }

    // Insert flights if they don't exist
    if (!existingFlights || existingFlights.length === 0) {
      if (stepData.flights && Array.isArray(stepData.flights) && stepData.flights.length > 0) {
        console.log('✈️ Migrating flight bookings to normalized table')
        
        const flightInserts = stepData.flights.map((flight: any) => ({
          trip_id: tripId,
          flight_type: flight.type || 'outbound',
          airline: flight.airline,
          flight_number: flight.flightNumber,
          departure_airport: flight.departure?.airport || '',
          departure_city: flight.departure?.city || '',
          departure_date: flight.departure?.date,
          departure_time: flight.departure?.time || '00:00',
          arrival_airport: flight.arrival?.airport || '',
          arrival_city: flight.arrival?.city || '',
          arrival_date: flight.arrival?.date,
          arrival_time: flight.arrival?.time || '00:00',
          cost_amount: flight.cost ? parseFloat(flight.cost) : null,
          cost_currency: 'USD',
          passenger_names: flight.passengerNames || [],
          booking_status: 'confirmed', // Finalized trips have confirmed bookings
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId
        }))

        const { error: flightsError } = await supabase
          .from('trip_flights')
          .insert(flightInserts)

        if (flightsError) {
          console.error('⚠️ Failed to migrate flight bookings:', flightsError)
        } else {
          console.log('✅ Flight bookings migrated successfully')
        }
      }
    }

    // Insert meetings if they don't exist
    if (!existingMeetings || existingMeetings.length === 0) {
      if (stepData.meetings && Array.isArray(stepData.meetings) && stepData.meetings.length > 0) {
        console.log('🤝 Migrating meetings to normalized table')
        
        for (const meeting of stepData.meetings) {
          // Create the meeting
          const { data: newMeeting, error: meetingError } = await supabase
            .from('trip_meetings')
            .insert({
              trip_id: tripId,
              title: meeting.title,
              meeting_type: meeting.type || 'meeting',
              meeting_date: meeting.date,
              start_time: meeting.startTime || '09:00',
              end_time: meeting.endTime,
              location: meeting.location,
              description: meeting.description,
              agenda: meeting.agenda,
              priority_level: meeting.priority || 'medium',
              meeting_status: 'confirmed', // Finalized trips have confirmed meetings
              is_supplier_meeting: meeting.isSupplierMeeting || false,
              supplier_company_name: meeting.supplierCompany,
              created_at: now,
              updated_at: now,
              created_by: userId,
              updated_by: userId
            })
            .select('id')
            .single()

          if (meetingError) {
            console.error('⚠️ Failed to migrate meeting:', meetingError)
            continue
          }

          // Create attendees for this meeting if they exist
          if (newMeeting && meeting.attendees && Array.isArray(meeting.attendees) && meeting.attendees.length > 0) {
            const attendeeInserts = meeting.attendees.map((attendee: any) => ({
              meeting_id: newMeeting.id,
              attendee_name: attendee.name || attendee,
              attendee_email: attendee.email,
              attendee_company: attendee.company,
              attendee_title: attendee.title,
              is_external: true,
              attendance_status: 'confirmed', // Finalized meetings have confirmed attendees
              created_at: now,
              updated_at: now
            }))

            const { error: attendeesError } = await supabase
              .from('meeting_attendees')
              .insert(attendeeInserts)

            if (attendeesError) {
              console.error('⚠️ Failed to migrate meeting attendees:', attendeesError)
            }
          }
        }
        
        console.log('✅ Meetings migrated successfully')
      }
    }

    // Insert participants if they don't exist
    if (stepData.participants && Array.isArray(stepData.participants) && stepData.participants.length > 0) {
      console.log('👥 Migrating participants to normalized table')
      
      // Check if participants already exist
      const { data: existingParticipants } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', tripId)
        .limit(1)
      
      if (!existingParticipants || existingParticipants.length === 0) {
        const participantInserts = stepData.participants.map((participant: any) => ({
          trip_id: tripId,
          user_id: participant.user_id || participant.id,
          role: participant.role || 'participant',
          company_id: participant.company_id || participant.companyId,
          participation_status: 'confirmed',
          created_at: now,
          updated_at: now
        }))

        const { error: participantsError } = await supabase
          .from('trip_participants')
          .insert(participantInserts)

        if (participantsError) {
          console.error('⚠️ Failed to migrate participants:', participantsError)
        } else {
          console.log('✅ Participants migrated successfully')
        }
      }
    }

    // Handle guest information from flightInfo and companies
    if (stepData.flightInfo && stepData.flightInfo.passengerName && stepData.companies && Array.isArray(stepData.companies) && stepData.companies.length > 0) {
      console.log('👤 Migrating guest information from flight data')
      
      // Check if guest participants already exist
      const { data: existingGuests } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', tripId)
        .eq('role', 'guest')
        .limit(1)
      
      if (!existingGuests || existingGuests.length === 0) {
        // Create guest participant records for each company
        // Note: For guests, we'll create a placeholder user_id or use a special guest role approach
        const guestInserts = stepData.companies.map((company: any) => ({
          trip_id: tripId,
          user_id: userId, // Use the creator's ID for now since user_id is NOT NULL
          role: 'guest',
          company_id: company.id,
          guest_name: stepData.flightInfo.passengerName,
          created_at: now,
          updated_at: now
        }))

        const { error: guestError } = await supabase
          .from('trip_participants')
          .insert(guestInserts)

        if (guestError) {
          console.error('⚠️ Failed to migrate guest information:', guestError)
        } else {
          console.log('✅ Guest information migrated successfully')
        }
      }
    }

    // Insert Wolthers staff if they don't exist
    if (stepData.wolthersStaff && Array.isArray(stepData.wolthersStaff) && stepData.wolthersStaff.length > 0) {
      console.log('👥 Migrating Wolthers staff to participants table')
      
      const staffInserts = stepData.wolthersStaff.map((staff: any) => ({
        trip_id: tripId,
        user_id: staff.user_id || staff.id,
        role: 'wolthers_staff',
        company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0', // Wolthers company ID
        participation_status: 'confirmed',
        created_at: now,
        updated_at: now
      }))

      const { error: staffError } = await supabase
        .from('trip_participants')
        .upsert(staffInserts, { 
          onConflict: 'trip_id,user_id',
          ignoreDuplicates: false
        })

      if (staffError) {
        console.error('⚠️ Failed to migrate Wolthers staff:', staffError)
      } else {
        console.log('✅ Wolthers staff migrated successfully')
      }
    }

    // Insert vehicle assignments if they don't exist
    if (stepData.vehicleAssignments && Array.isArray(stepData.vehicleAssignments) && stepData.vehicleAssignments.length > 0) {
      console.log('🚗 Migrating vehicle assignments to normalized table')
      
      // Check if vehicle assignments already exist
      const { data: existingAssignments } = await supabase
        .from('trip_vehicles')
        .select('id')
        .eq('trip_id', tripId)
        .limit(1)
      
      if (!existingAssignments || existingAssignments.length === 0) {
        const assignmentInserts = stepData.vehicleAssignments.map((assignment: any) => ({
          trip_id: tripId,
          vehicle_id: assignment.vehicle_id || assignment.vehicleId,
          driver_id: assignment.driver_id || assignment.driverId,
          assigned_from: assignment.start_date || assignment.startDate || new Date().toISOString().split('T')[0],
          assigned_to: assignment.end_date || assignment.endDate || new Date().toISOString().split('T')[0],
          created_at: now,
          updated_at: now
        }))

        const { error: assignmentsError } = await supabase
          .from('trip_vehicles')
          .insert(assignmentInserts)

        if (assignmentsError) {
          console.error('⚠️ Failed to migrate vehicle assignments:', assignmentsError)
        } else {
          console.log('✅ Vehicle assignments migrated successfully')
        }
      }
    }

    // After successful migration, we could optionally clear the step_data
    // to reduce storage size, but keeping it for now for safety
    console.log('✅ Extended trip data finalized successfully')
    
  } catch (error) {
    console.error('⚠️ Failed to finalize extended trip data:', error)
    // Don't throw error - this shouldn't fail the entire finalization
  }
}