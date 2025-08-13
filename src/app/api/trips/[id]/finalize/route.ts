import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
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
    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()

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
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

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

    // Can only finalize draft trips with planning status
    if (!existingTrip.is_draft || existingTrip.status !== 'planning') {
      return NextResponse.json(
        { error: 'Only draft trips with planning status can be finalized' },
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
      console.error('Failed to finalize trip:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to finalize trip', 
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    // Remove the draft entry since the trip is now finalized
    const { error: draftDeleteError } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('trip_id', tripId)

    if (draftDeleteError) {
      console.warn('Failed to clean up draft entry:', draftDeleteError)
      // Don't fail the request for this cleanup error
    }

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

    // Only migrate data if it doesn't already exist (avoid duplicates)
    
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

    // After successful migration, we could optionally clear the step_data
    // to reduce storage size, but keeping it for now for safety
    console.log('✅ Extended trip data finalized successfully')
    
  } catch (error) {
    console.error('⚠️ Failed to finalize extended trip data:', error)
    // Don't throw error - this shouldn't fail the entire finalization
  }
}