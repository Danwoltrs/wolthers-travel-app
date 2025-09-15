import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'
import { verifySessionToken, extractBearerToken } from '@/lib/jwt-utils'
import { sendTripCancellationEmails, TripCancellationEmailData } from '@/lib/resend'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params

    let user: any = null
    
    // Try JWT token authentication first (Microsoft OAuth and Email/Password)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = extractBearerToken(authHeader)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      // Try custom JWT token first
      const decoded = verifySessionToken(token)
      if (decoded) {
        // Get user from database with service role (bypasses RLS)
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
          console.log('🔑 JWT Auth: Successfully authenticated user:', user.email)
        }
      } else {
        // If JWT verification fails, try Supabase session token
        console.log('🔑 JWT verification failed, trying Supabase session...')
        try {
          const supabaseClient = createSupabaseServiceClient()
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
          
          if (!sessionError && supabaseUser) {
            // Get full user profile from database
            const { data: userData, error: userError } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()

            if (!userError && userData) {
              user = userData
              console.log('🔑 Supabase Auth: Successfully authenticated user:', user.email)
            }
          }
        } catch (supabaseError) {
          console.log('🔑 Supabase authentication also failed:', supabaseError)
        }
      }
    }
    
    // If both methods failed, return unauthorized
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('🔍 API: Trip details request for:', { tripId, userEmail: user.email })

    // Use service client for database queries to bypass RLS
    const supabase = createServerSupabaseClient()
    
    // Determine if tripId is a UUID or an access code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId)
    
    let tripQuery
    if (isUUID) {
      // Query by ID
      tripQuery = supabase
        .from('trips')
        .select(`
          *,
          trip_participants (
            trip_id,
            user_id,
            company_id,
            role,
            users!trip_participants_user_id_fkey (id, full_name, email),
            companies (id, name, fantasy_name)
          ),
          trip_vehicles (
            trip_id,
            vehicle_id,
            driver_id,
            vehicles (id, model, license_plate),
            users!trip_vehicles_driver_id_fkey (id, full_name, email)
          ),
          trip_hotels (
            id,
            hotel_name,
            hotel_address,
            check_in_date,
            check_out_date,
            nights_count,
            cost_amount,
            cost_currency,
            room_type,
            guest_names,
            booking_status
          ),
          trip_flights (
            id,
            flight_type,
            airline,
            flight_number,
            departure_airport,
            departure_city,
            departure_date,
            departure_time,
            arrival_airport,
            arrival_city,
            arrival_date,
            arrival_time,
            cost_amount,
            cost_currency,
            passenger_names,
            booking_status
          ),
          trip_meetings (
            id,
            title,
            meeting_type,
            meeting_date,
            start_time,
            end_time,
            location,
            description,
            agenda,
            priority_level,
            meeting_status,
            is_supplier_meeting,
            supplier_company_name,
            meeting_attendees (
              id,
              attendee_name,
              attendee_email,
              attendee_company,
              attendee_title,
              attendance_status
            )
          )
        `)
        .eq('id', tripId)
        .single()
    } else {
      // Query by access code
      tripQuery = supabase
        .from('trips')
        .select(`
          *,
          trip_participants (
            trip_id,
            user_id,
            company_id,
            role,
            users!trip_participants_user_id_fkey (id, full_name, email),
            companies (id, name, fantasy_name)
          ),
          trip_vehicles (
            trip_id,
            vehicle_id,
            driver_id,
            vehicles (id, model, license_plate),
            users!trip_vehicles_driver_id_fkey (id, full_name, email)
          ),
          trip_hotels (
            id,
            hotel_name,
            hotel_address,
            check_in_date,
            check_out_date,
            nights_count,
            cost_amount,
            cost_currency,
            room_type,
            guest_names,
            booking_status
          ),
          trip_flights (
            id,
            flight_type,
            airline,
            flight_number,
            departure_airport,
            departure_city,
            departure_date,
            departure_time,
            arrival_airport,
            arrival_city,
            arrival_date,
            arrival_time,
            cost_amount,
            cost_currency,
            passenger_names,
            booking_status
          ),
          trip_meetings (
            id,
            title,
            meeting_type,
            meeting_date,
            start_time,
            end_time,
            location,
            description,
            agenda,
            priority_level,
            meeting_status,
            is_supplier_meeting,
            supplier_company_name,
            meeting_attendees (
              id,
              attendee_name,
              attendee_email,
              attendee_company,
              attendee_title,
              attendance_status
            )
          )
        `)
        .eq('access_code', tripId)
        .single()
    }

    const { data: tripData, error: tripError } = await tripQuery

    if (tripError) {
      console.error('Trip query error:', tripError)
      return NextResponse.json(
        { error: `Failed to fetch trip details - ${tripError.message}` },
        { status: 404 }
      )
    }

    if (!tripData) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this trip
    const hasAccess = user.can_view_all_trips || 
                     (user.can_view_company_trips && tripData.trip_participants?.some((p: any) => 
                       p.users?.email?.split('@')[1] === user.email?.split('@')[1])) ||
                     tripData.trip_participants?.some((p: any) => p.user_id === user.id)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this trip' },
        { status: 403 }
      )
    }

    // Load activities (modern approach) and itinerary items (legacy support)
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripData.id)
      .order('activity_date', { ascending: true })
      .order('start_time', { ascending: true })

    const { data: itineraryData, error: itineraryError } = await supabase
      .from('itinerary_items')
      .select(`
        *,
        meeting_notes (*),
        company_locations (
          id,
          name,
          latitude,
          longitude,
          city,
          country,
          address_line1
        )
      `)
      .eq('trip_id', tripData.id)
      .order('activity_date, start_time')

    if (activitiesError) {
      console.warn('Error loading activities:', activitiesError)
    }
    if (itineraryError) {
      console.warn('Error loading itinerary items:', itineraryError)
    }

    // Combine the data - prioritize activities if available, fall back to itinerary_items
    tripData.itinerary_items = activitiesData && activitiesData.length > 0 ? activitiesData : (itineraryData || [])
    tripData.activities = activitiesData || []

    console.log(`✅ API: Returning trip details for ${user.email}:`, {
      tripId: tripData.id,
      title: tripData.title,
      activities: activitiesData?.length || 0,
      itineraryItems: itineraryData?.length || 0,
      usingActivities: activitiesData && activitiesData.length > 0
    })

    return NextResponse.json({
      trip: tripData,
      user: {
        id: user.id,
        email: user.email,
        permissions: {
          view_all_trips: user.can_view_all_trips,
          view_company_trips: user.can_view_company_trips,
          is_global_admin: user.is_global_admin
        }
      }
    })

  } catch (error) {
    console.error('❌ API: Trip details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params
    console.log('🗑️ [TripDelete] Starting trip deletion process for:', tripId)

    // Parse request body to check if email notifications should be sent
    let shouldSendEmails = false
    let cancellationReason = ''
    
    try {
      const body = await request.json()
      shouldSendEmails = body.sendNotifications || false
      cancellationReason = body.reason || ''
      console.log('📧 [TripDelete] Email notifications requested:', shouldSendEmails)
      if (cancellationReason) {
        console.log('📝 [TripDelete] Cancellation reason:', cancellationReason)
      }
    } catch (parseError) {
      // Body parsing failed, proceed without email notifications
      console.log('📧 [TripDelete] No request body or invalid JSON, proceeding without email notifications')
    }

    let user: any = null
    
    // Try JWT token authentication first (Microsoft OAuth and Email/Password)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = extractBearerToken(authHeader)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      // Try custom JWT token first
      const decoded = verifySessionToken(token)
      if (decoded) {
        // Get user from database with service role (bypasses RLS)
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
          console.log('🔑 [TripDelete] JWT Auth: Successfully authenticated user:', user.email)
        }
      } else {
        // If JWT verification fails, try Supabase session token
        console.log('🔑 [TripDelete] JWT verification failed, trying Supabase session...')
        try {
          const supabase = createServerSupabaseClient()
          const { data: { user: supabaseUser }, error: sessionError } = await supabase.auth.getUser(token)
          
          if (!sessionError && supabaseUser) {
            // Get full user profile from database
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()

            if (!userError && userData) {
              user = userData
              console.log('🔑 [TripDelete] Supabase Auth: Successfully authenticated user:', user.email)
            }
          }
        } catch (supabaseError) {
          console.log('🔑 [TripDelete] Supabase authentication also failed:', supabaseError)
        }
      }
    }
    
    // If both methods failed, return unauthorized
    if (!user) {
      console.error('❌ [TripDelete] Authentication failed - no valid user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('👤 [TripDelete] User authenticated, proceeding with deletion')

    // Use service client for database queries to bypass RLS
    const supabase = createServerSupabaseClient()
    
    // Get the trip to validate user permissions
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        creator_id, 
        access_code, 
        status, 
        title,
        start_date,
        end_date
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      console.error('❌ [TripDelete] Trip not found:', tripError)
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    console.log('📋 [TripDelete] Found trip:', { 
      id: trip.id, 
      title: trip.title, 
      status: trip.status, 
      creator_id: trip.creator_id 
    })

    // Check permissions - user must be creator or have admin permissions
    const hasPermission = 
      trip.creator_id === user.id ||
      user.is_global_admin ||
      (user.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0') // Wolthers staff

    if (!hasPermission) {
      console.error('❌ [TripDelete] User lacks permission to delete trip')
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this trip' },
        { status: 403 }
      )
    }

    console.log('✅ [TripDelete] Permission check passed')

    // Set trip status to 'cancelled' instead of hard delete to preserve data integrity
    // This allows for potential recovery and maintains audit trails
    const { data: cancelledTrip, error: updateError } = await supabase
      .from('trips')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        last_edited_by: user.id,
        last_edited_at: new Date().toISOString()
      })
      .eq('id', tripId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ [TripDelete] Failed to cancel trip:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel trip: ' + updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ [TripDelete] Trip status updated to cancelled:', cancelledTrip.status)

    // Send email notifications if requested
    if (shouldSendEmails) {
      try {
        console.log('📧 [TripDelete] Gathering stakeholders for email notifications...')
        
        // Get trip participants (Wolthers staff and company representatives)
        const { data: participantsData, error: participantsError } = await supabase
          .from('trip_participants')
          .select(`
            user_id,
            company_id,
            role,
            guest_name,
            guest_email,
            users!trip_participants_user_id_fkey (id, full_name, email),
            companies (id, name, fantasy_name)
          `)
          .eq('trip_id', tripId)

        if (participantsError) {
          console.error('⚠️ [TripDelete] Failed to get participants for email:', participantsError)
        }

        // Collect stakeholders for email notifications
        const stakeholders: Array<{ name: string; email: string; role?: string }> = []

        if (participantsData) {
          for (const participant of participantsData) {
            let email = null
            let name = null
            let role = 'Team Member'

            // Handle user accounts
            if (participant.users && participant.users.email) {
              email = participant.users.email
              name = participant.users.full_name || participant.users.email
              role = participant.role || (participant.companies ? 'Company Representative' : 'Team Member')
            }
            // Handle selected host representatives (guest entries)
            else if (participant.role === 'representative' && participant.guest_email) {
              email = participant.guest_email
              name = participant.guest_name || 'Host Representative'
              role = 'Host Representative'
            }

            if (email) {
              stakeholders.push({ name, email, role })
              console.log(`📧 [TripDelete] Added stakeholder: ${name} (${email}) - ${role}`)
            }
          }
        }

        // Add the user who cancelled the trip if not already in the list
        const cancellerInList = stakeholders.some(s => s.email === user.email)
        if (!cancellerInList && user.email) {
          stakeholders.push({
            name: user.full_name || user.email,
            email: user.email,
            role: 'Trip Manager'
          })
        }

        if (stakeholders.length > 0) {
          const emailData: TripCancellationEmailData = {
            tripTitle: trip.title,
            tripAccessCode: trip.access_code || trip.id,
            tripStartDate: trip.start_date,
            tripEndDate: trip.end_date,
            cancelledBy: user.full_name || user.name || user.email,
            cancellationReason: cancellationReason || undefined,
            stakeholders
          }

          console.log(`📧 [TripDelete] Sending cancellation emails to ${stakeholders.length} stakeholders`)
          
          const emailResult = await sendTripCancellationEmails(emailData)
          
          if (emailResult.success) {
            console.log('✅ [TripDelete] All cancellation emails sent successfully')
          } else {
            console.warn(`⚠️ [TripDelete] Some emails failed to send:`, emailResult.errors)
          }
        } else {
          console.log('📧 [TripDelete] No stakeholders found to notify')
        }
      } catch (emailError) {
        console.error('❌ [TripDelete] Email notification failed:', emailError)
        // Don't fail the entire deletion for email errors
      }
    }

    // Optionally, perform any additional cancellation tasks here:
    // - Cancel associated bookings
    // - Update dependent records
    
    console.log('🎉 [TripDelete] Trip cancellation completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Trip cancelled successfully',
      trip: {
        id: trip.id,
        access_code: trip.access_code || trip.id,
        status: 'cancelled',
        title: trip.title,
        last_edited_at: new Date().toISOString(),
        last_edited_by: user.id
      }
    })

  } catch (error) {
    console.error('💥 [TripDelete] Unexpected error during deletion:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during trip deletion',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}