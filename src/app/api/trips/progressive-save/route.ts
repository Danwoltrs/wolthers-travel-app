import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { makeTripSlug } from '@/lib/tripCodeGenerator'

interface ProgressiveSaveRequest {
  tripId?: string
  currentStep: number
  stepData: any
  completionPercentage: number
  tripType: string
  accessCode?: string
  clientTempId?: string  // For idempotent creation
}

interface ProgressiveSaveResponse {
  success: boolean
  tripId: string
  accessCode: string
  continueUrl: string
  savedAt: string
  message: string
}

export async function POST(request: NextRequest) {
  let body: ProgressiveSaveRequest | undefined = undefined
  let user: any = null
  
  console.log('🔥 Progressive save API called')
  console.log('🍪 Cookies:', request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })))
  console.log('🔑 Auth header present:', !!request.headers.get('authorization'))
  
  try {
    
    // Authentication logic (same as trips route)
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
      console.log('🎫 Token found, attempting authentication...')
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        console.log('✅ Token decoded successfully, user ID:', decoded.userId)
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
          console.log('👤 User authenticated:', userData.email)
        } else {
          console.error('❌ User lookup failed:', userError)
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

    try {
      body = await request.json()
      console.log('📋 Request body parsed:', { 
        hasTripId: !!body.tripId, 
        currentStep: body.currentStep, 
        tripType: body.tripType,
        hasStepData: !!body.stepData,
        accessCode: body.accessCode
      })
    } catch (parseError) {
      console.error('🚨 Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { tripId, currentStep, stepData, completionPercentage, tripType, accessCode: providedAccessCode, clientTempId } = body

    if (!stepData || typeof currentStep !== 'number' || !tripType) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()

    let finalTripId = tripId
    let accessCode = ''
    let isNewTrip = false

    if (tripId) {
      // Check if user has permission to edit this trip
      const { data: existingTrip, error: tripError } = await supabase
        .from('trips')
        .select(`
          id, 
          creator_id, 
          access_code,
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

      accessCode = existingTrip.access_code || ''

      // Update existing trip
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          completion_step: currentStep,
          step_data: stepData,
          creation_status: getCreationStatus(currentStep),
          last_edited_at: now,
          last_edited_by: user.id,
          is_draft: currentStep < 5, // Draft until final step (5)
        })
        .eq('id', tripId)

      if (updateError) {
        console.error('Failed to update trip:', updateError)
        return NextResponse.json(
          { 
            error: 'Failed to save progress', 
            details: updateError.message, 
            code: updateError.code 
          },
          { status: 500 }
        )
      }

      // Update hotels, flights, and meetings for existing trip
      await updateTripExtendedData(supabase, tripId, stepData, user.id, now)

    } else {
      // IMPROVED IDEMPOTENT CREATION: Multiple strategies to prevent duplicates
      if (clientTempId) {
        console.log('🔍 Checking for existing trip with clientTempId:', clientTempId)
        
        // Strategy 1: Check by clientTempId in metadata
        const { data: existingTripByTempId, error: tempIdError } = await supabase
          .from('trips')
          .select('id, access_code, completion_step')
          .eq('metadata->client_temp_id', clientTempId)
          .eq('creator_id', user.id)
          .single()
        
        if (!tempIdError && existingTripByTempId) {
          finalTripId = existingTripByTempId.id
          accessCode = existingTripByTempId.access_code || ''
          console.log('♾️ Found existing trip by clientTempId:', clientTempId, 'tripId:', finalTripId, 'accessCode:', accessCode)
          
          // Update existing trip with new step data and prevent regression
          const updateStep = Math.max(currentStep, existingTripByTempId.completion_step || 0)
          
          const { error: updateError } = await supabase
            .from('trips')
            .update({
              completion_step: updateStep,
              step_data: stepData,
              creation_status: getCreationStatus(updateStep),
              last_edited_at: now,
              last_edited_by: user.id,
              is_draft: updateStep < 5,
            })
            .eq('id', finalTripId)
          
          if (updateError) {
            console.error('⚠️ Failed to update existing trip by clientTempId:', updateError)
          } else {
            console.log('✅ Successfully updated existing trip')
            
            // Update extended data for existing trip
            await updateTripExtendedData(supabase, finalTripId, stepData, user.id, now)
            
            // Skip trip creation - return early with existing trip
            const response: ProgressiveSaveResponse = {
              success: true,
              tripId: finalTripId,
              accessCode: accessCode,
              continueUrl: accessCode ? `/trips/continue/${accessCode}` : '',
              savedAt: now,
              message: `Progress saved at step ${currentStep} (existing trip updated)`
            }
            
            // Still update draft entry
            await updateTripDraftEntry(supabase, finalTripId, currentStep, stepData, completionPercentage, tripType, accessCode, user.id, now)
            
            return NextResponse.json(response)
          }
        } else if (tempIdError && tempIdError.code !== 'PGRST116') {
          console.error('⚠️ Error checking for existing trip by tempId:', tempIdError)
        }
      }
      
      // Strategy 2: Additional check for recent drafts by user and trip type
      if (!finalTripId && currentStep >= 3) {
        console.log('🔍 Checking for recent similar trips to prevent duplicates...')
        
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data: recentTrips } = await supabase
          .from('trips')
          .select('id, access_code, title, created_at')
          .eq('creator_id', user.id)
          .eq('trip_type', tripType)
          .eq('status', 'planning')
          .gte('created_at', fiveMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(3)
        
        if (recentTrips && recentTrips.length > 0) {
          console.log(`🔍 Found ${recentTrips.length} recent similar trips in last 5 minutes`)
          
          // If we have a title to match against, use most recently created trip
          const tripData = extractTripData(stepData, currentStep)
          if (tripData.title && recentTrips.some(trip => trip.title === tripData.title)) {
            const matchingTrip = recentTrips.find(trip => trip.title === tripData.title)
            if (matchingTrip) {
              finalTripId = matchingTrip.id
              accessCode = matchingTrip.access_code || ''
              console.log('♾️ Found recent matching trip by title:', tripData.title, 'tripId:', finalTripId)
              
              // Update the recent trip instead of creating new one
              const { error: updateError } = await supabase
                .from('trips')
                .update({
                  completion_step: currentStep,
                  step_data: stepData,
                  creation_status: getCreationStatus(currentStep),
                  last_edited_at: now,
                  last_edited_by: user.id,
                  is_draft: currentStep < 5,
                  // Update metadata with clientTempId for future idempotency
                  metadata: {
                    ...((matchingTrip as any).metadata || {}),
                    ...(clientTempId ? { client_temp_id: clientTempId } : {})
                  }
                })
                .eq('id', finalTripId)
              
              if (!updateError) {
                console.log('✅ Successfully updated recent matching trip')
                await updateTripExtendedData(supabase, finalTripId, stepData, user.id, now)
                
                const response: ProgressiveSaveResponse = {
                  success: true,
                  tripId: finalTripId,
                  accessCode: accessCode,
                  continueUrl: accessCode ? `/trips/continue/${accessCode}` : '',
                  savedAt: now,
                  message: `Progress saved at step ${currentStep} (recent trip updated)`
                }
                
                await updateTripDraftEntry(supabase, finalTripId, currentStep, stepData, completionPercentage, tripType, accessCode, user.id, now)
                
                return NextResponse.json(response)
              }
            }
          }
        }
      }
      
      // Create new trip when reaching step 3 (basic information) and no existing trip found
      if (currentStep >= 3 && !finalTripId) {
        // IMPROVED ACCESS CODE PRIORITY LOGIC
        console.log('🎫 Access code generation - analyzing priority sources:')
        console.log('  - stepData.accessCode (predefined):', stepData.accessCode)
        console.log('  - providedAccessCode (request):', providedAccessCode)
        console.log('  - stepData.eventCode:', stepData.eventCode)
        console.log('  - stepData.selectedConvention:', stepData.selectedConvention?.name)
        
        // Priority 1: Predefined accessCode from frontend (for SCTA-25, NCA-26, etc.)
        if (stepData.accessCode && typeof stepData.accessCode === 'string' && stepData.accessCode.trim()) {
          accessCode = stepData.accessCode.trim()
          console.log('✅ Using predefined accessCode from stepData:', accessCode)
        }
        // Priority 2: Provided accessCode in request  
        else if (providedAccessCode && typeof providedAccessCode === 'string' && providedAccessCode.trim()) {
          accessCode = providedAccessCode.trim()
          console.log('✅ Using providedAccessCode from request:', accessCode)
        }
        // Priority 3: Generate business-logic based code
        else {
          console.log('🔄 No predefined code found, generating business logic code...')
          
          const tripData = extractTripData(stepData, currentStep)
          const companies = stepData.companies || []
          const startDate = new Date(tripData.start_date || new Date())
          
          // For predefined events (conventions), use event-based code
          let eventCode = stepData.eventCode
          if (stepData.selectedConvention?.is_predefined && stepData.selectedConvention?.name) {
            eventCode = stepData.selectedConvention.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()
          }
          
          const baseSlug = makeTripSlug({
            trip_type: mapTripType(tripType),
            companies: companies,
            month: startDate.getMonth() + 1,
            year: startDate.getFullYear(),
            code: eventCode,
            title: tripData.title
          })
          
          // Ensure uniqueness using database function
          const { data: uniqueSlug } = await supabase
            .rpc('generate_unique_trip_slug', {
              base_slug: baseSlug,
              creator_user_id: user.id
            })
          
          accessCode = uniqueSlug || baseSlug
          console.log('✅ Generated unique code:', accessCode)
        }
        
        console.log('🎫 Final access code to use:', accessCode)
        isNewTrip = true

        // Extract basic trip information from stepData
        const tripData = extractTripData(stepData, currentStep)

        // Prepare metadata with client temp ID for idempotency
        const metadata = {
          ...(stepData.metadata || {}),
          ...(clientTempId ? { client_temp_id: clientTempId } : {})
        }
        
        // Extract year from start date for database
        const tripYear = new Date(tripData.start_date || new Date()).getFullYear()
        
        const { data: newTrip, error: createError } = await supabase
          .from('trips')
          .insert({
            title: tripData.title || `New ${tripType} Trip`,
            description: tripData.description || '',
            trip_type: tripType,
            status: 'planning',
            start_date: tripData.start_date || new Date().toISOString().split('T')[0],
            end_date: tripData.end_date || new Date().toISOString().split('T')[0],
            creator_id: user.id,
            access_code: accessCode,
            slug: accessCode, // Use access code as slug
            year: tripYear,
            creation_status: getCreationStatus(currentStep),
            completion_step: currentStep,
            step_data: stepData,
            is_draft: currentStep < 5, // Draft until final step (5)
            last_edited_at: now,
            last_edited_by: user.id,
            progress_percentage: completionPercentage,
            metadata: metadata,
          })
          .select('id')
          .single()

        if (createError || !newTrip) {
          console.error('Failed to create trip:', createError)
          return NextResponse.json(
            { 
              error: 'Failed to create trip', 
              details: createError?.message, 
              code: createError?.code 
            },
            { status: 500 }
          )
        }

        finalTripId = newTrip.id

        // Also create trip participants for Wolthers staff if they exist in step data
        if (stepData.wolthersStaff && Array.isArray(stepData.wolthersStaff) && stepData.wolthersStaff.length > 0) {
          console.log('👥 Creating trip participants for Wolthers staff:', stepData.wolthersStaff.length)
          
          const participantInserts = stepData.wolthersStaff.map((staff: any) => ({
            trip_id: finalTripId,
            user_id: staff.id,
            company_id: '840783f4-866d-4bdb-9b5d-5d0facf62db0', // Wolthers & Associates company ID
            role: 'staff',
            is_partial: false,
            created_at: now,
            updated_at: now
          }))

          const { error: participantsError } = await supabase
            .from('trip_participants')
            .insert(participantInserts)

          if (participantsError) {
            console.error('⚠️ Failed to create trip participants:', participantsError)
            // Don't fail the trip creation, just log the error
          } else {
            console.log('✅ Trip participants created successfully')
          }
        }

        // Save hotels data if it exists
        if (stepData.hotels && Array.isArray(stepData.hotels) && stepData.hotels.length > 0) {
          console.log('🏨 Creating hotel bookings:', stepData.hotels.length)
          
          const hotelInserts = stepData.hotels.map((hotel: any) => ({
            trip_id: finalTripId,
            hotel_name: hotel.name || hotel.hotelName,
            hotel_address: hotel.address || hotel.hotelAddress,
            check_in_date: hotel.checkInDate || hotel.checkIn,
            check_out_date: hotel.checkOutDate || hotel.checkOut,
            cost_amount: hotel.cost ? parseFloat(hotel.cost) : null,
            cost_currency: 'USD',
            room_type: hotel.roomType,
            guest_names: hotel.guestNames || [],
            booking_status: 'pending',
            created_at: now,
            updated_at: now,
            created_by: user.id,
            updated_by: user.id
          }))

          const { error: hotelsError } = await supabase
            .from('trip_hotels')
            .insert(hotelInserts)

          if (hotelsError) {
            console.error('⚠️ Failed to create hotel bookings:', hotelsError)
          } else {
            console.log('✅ Hotel bookings created successfully')
          }
        }

        // Save flights data if it exists
        if (stepData.flights && Array.isArray(stepData.flights) && stepData.flights.length > 0) {
          console.log('✈️ Creating flight bookings:', stepData.flights.length)
          
          const flightInserts = stepData.flights.map((flight: any) => ({
            trip_id: finalTripId,
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
            booking_status: 'pending',
            created_at: now,
            updated_at: now,
            created_by: user.id,
            updated_by: user.id
          }))

          const { error: flightsError } = await supabase
            .from('trip_flights')
            .insert(flightInserts)

          if (flightsError) {
            console.error('⚠️ Failed to create flight bookings:', flightsError)
          } else {
            console.log('✅ Flight bookings created successfully')
          }
        }

        // Save meetings data if it exists
        if (stepData.meetings && Array.isArray(stepData.meetings) && stepData.meetings.length > 0) {
          console.log('🤝 Creating meetings:', stepData.meetings.length)
          
          for (const meeting of stepData.meetings) {
            // First create the meeting
            const { data: newMeeting, error: meetingError } = await supabase
              .from('trip_meetings')
              .insert({
                trip_id: finalTripId,
                title: meeting.title,
                meeting_type: meeting.type || 'meeting',
                meeting_date: meeting.date,
                start_time: meeting.startTime || '09:00',
                end_time: meeting.endTime,
                location: meeting.location,
                description: meeting.description,
                agenda: meeting.agenda,
                priority_level: meeting.priority || 'medium',
                meeting_status: 'scheduled',
                is_supplier_meeting: meeting.isSupplierMeeting || false,
                supplier_company_name: meeting.supplierCompany,
                created_at: now,
                updated_at: now,
                created_by: user.id,
                updated_by: user.id
              })
              .select('id')
              .single()

            if (meetingError) {
              console.error('⚠️ Failed to create meeting:', meetingError)
              continue
            }

            // Create attendees for this meeting if they exist
            if (meeting.attendees && Array.isArray(meeting.attendees) && meeting.attendees.length > 0) {
              const attendeeInserts = meeting.attendees.map((attendee: any) => ({
                meeting_id: newMeeting.id,
                attendee_name: attendee.name || attendee,
                attendee_email: attendee.email,
                attendee_company: attendee.company,
                attendee_title: attendee.title,
                is_external: true,
                attendance_status: 'invited',
                created_at: now,
                updated_at: now
              }))

              const { error: attendeesError } = await supabase
                .from('meeting_attendees')
                .insert(attendeeInserts)

              if (attendeesError) {
                console.error('⚠️ Failed to create meeting attendees:', attendeesError)
              }
            }
          }
          
          console.log('✅ Meetings created successfully')
        }
      }
    }

    // Update or create trip draft entry
    if (finalTripId) {
      await updateTripDraftEntry(supabase, finalTripId, currentStep, stepData, completionPercentage, tripType, accessCode, user.id, now)
    }

    const response: ProgressiveSaveResponse = {
      success: true,
      tripId: finalTripId || '',
      accessCode: accessCode,
      continueUrl: accessCode ? `/trips/continue/${accessCode}` : '',
      savedAt: now,
      message: isNewTrip ? 
        'Trip created successfully! You can continue editing later using the provided link.' :
        `Progress saved at step ${currentStep}`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('🚨 Progressive save error:', error)
    console.error('🔍 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('📝 Request body received:', body)
    console.error('👤 User data:', user)
    console.error('🔗 Auth header:', request.headers.get('authorization')?.substring(0, 20) + '...')
    console.error('🌍 Request URL:', request.url)
    console.error('📡 Request method:', request.method)
    
    // Enhanced error response for debugging
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      timestamp: new Date().toISOString(),
      // Add context for debugging in production
      context: {
        hasUser: !!user,
        hasAuthHeader: !!request.headers.get('authorization'),
        requestUrl: request.url,
        bodyReceived: !!body
      }
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Helper function to generate unique access code
async function generateAccessCode(supabase: any): Promise<string> {
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    // Generate a random code (e.g., "AMS_BER_QA_1208")
    const code = [
      generateRandomString(3).toUpperCase(),
      generateRandomString(3).toUpperCase(),
      generateRandomString(2).toUpperCase(),
      Math.floor(Math.random() * 9000 + 1000)
    ].join('_')

    // Check if code already exists
    const { data: existing } = await supabase
      .from('trips')
      .select('id')
      .eq('access_code', code)
      .single()

    if (!existing) {
      return code
    }

    attempts++
  }

  // Fallback to UUID-based code
  return 'TRIP_' + Math.random().toString(36).substr(2, 9).toUpperCase()
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Function to validate custom access code
async function validateCustomAccessCode(supabase: any, code: string): Promise<boolean> {
  // Validate code format first - allow flexible formats
  const tripCodeRegex = /^[A-Z0-9_-]{2,20}$/
  if (!tripCodeRegex.test(code)) {
    return false
  }

  // Check if code already exists
  const { data: existing } = await supabase
    .from('trips')
    .select('id')
    .eq('access_code', code)
    .single()

  return !existing
}

// Helper function to determine creation status based on step
function getCreationStatus(step: number): string {
  if (step <= 1) return 'draft'
  if (step === 2) return 'step1_completed'
  if (step === 3) return 'step2_completed'
  if (step === 4) return 'step3_completed'
  return 'published'
}

// Helper function to extract trip data from step data
function extractTripData(stepData: any, currentStep: number): any {
  const data: any = {}

  // The stepData is actually the full formData object
  if (stepData.title) {
    data.title = stepData.title
  }
  
  if (stepData.description) {
    data.description = stepData.description
  }
  
  // Handle dates - they could be Date objects or strings
  // Ensure dates are stored as UTC midnight to avoid timezone issues
  if (stepData.startDate) {
    if (stepData.startDate instanceof Date) {
      // Create a new date at UTC midnight to avoid timezone shifts
      const utcDate = new Date(Date.UTC(
        stepData.startDate.getFullYear(),
        stepData.startDate.getMonth(),
        stepData.startDate.getDate()
      ))
      data.start_date = utcDate.toISOString().split('T')[0]
    } else if (typeof stepData.startDate === 'string') {
      // If it's already a string, parse and normalize to UTC date
      const date = new Date(stepData.startDate)
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ))
      data.start_date = utcDate.toISOString().split('T')[0]
    }
  }
  
  if (stepData.endDate) {
    if (stepData.endDate instanceof Date) {
      // Create a new date at UTC midnight to avoid timezone shifts
      const utcDate = new Date(Date.UTC(
        stepData.endDate.getFullYear(),
        stepData.endDate.getMonth(),
        stepData.endDate.getDate()
      ))
      data.end_date = utcDate.toISOString().split('T')[0]
    } else if (typeof stepData.endDate === 'string') {
      // If it's already a string, parse and normalize to UTC date
      const date = new Date(stepData.endDate)
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ))
      data.end_date = utcDate.toISOString().split('T')[0]
    }
  }

  // Fallback to legacy structure for backward compatibility
  if (stepData.basic) {
    data.title = stepData.basic.title || data.title
    data.description = stepData.basic.description || data.description
    data.start_date = stepData.basic.startDate || data.start_date
    data.end_date = stepData.basic.endDate || data.end_date
  }

  if (stepData.dates) {
    data.start_date = stepData.dates.startDate || data.start_date
    data.end_date = stepData.dates.endDate || data.end_date
  }

  return data
}

// Helper function to map old trip types to new slug system
function mapTripType(tripType: string): 'conference' | 'event' | 'business' | 'client_visit' {
  switch (tripType.toLowerCase()) {
    case 'conference':
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

// Helper function to update hotels, flights, and meetings for existing trips
async function updateTripExtendedData(supabase: any, tripId: string, stepData: any, userId: string, now: string) {
  try {
    console.log('🔄 Updating extended trip data for trip:', tripId)

    // Clear existing data and re-insert (simpler than trying to diff/update)
    await supabase.from('trip_hotels').delete().eq('trip_id', tripId)
    await supabase.from('trip_flights').delete().eq('trip_id', tripId)
    
    // Delete meetings and their related data (cascading delete will handle attendees)
    await supabase.from('trip_meetings').delete().eq('trip_id', tripId)

    // Re-insert hotels
    if (stepData.hotels && Array.isArray(stepData.hotels) && stepData.hotels.length > 0) {
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
        booking_status: 'pending',
        created_at: now,
        updated_at: now,
        created_by: userId,
        updated_by: userId
      }))

      await supabase.from('trip_hotels').insert(hotelInserts)
    }

    // Re-insert flights
    if (stepData.flights && Array.isArray(stepData.flights) && stepData.flights.length > 0) {
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
        booking_status: 'pending',
        created_at: now,
        updated_at: now,
        created_by: userId,
        updated_by: userId
      }))

      await supabase.from('trip_flights').insert(flightInserts)
    }

    // Re-insert meetings
    if (stepData.meetings && Array.isArray(stepData.meetings) && stepData.meetings.length > 0) {
      for (const meeting of stepData.meetings) {
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
            meeting_status: 'scheduled',
            is_supplier_meeting: meeting.isSupplierMeeting || false,
            supplier_company_name: meeting.supplierCompany,
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId
          })
          .select('id')
          .single()

        if (!meetingError && newMeeting && meeting.attendees && Array.isArray(meeting.attendees)) {
          const attendeeInserts = meeting.attendees.map((attendee: any) => ({
            meeting_id: newMeeting.id,
            attendee_name: attendee.name || attendee,
            attendee_email: attendee.email,
            attendee_company: attendee.company,
            attendee_title: attendee.title,
            is_external: true,
            attendance_status: 'invited',
            created_at: now,
            updated_at: now
          }))

          await supabase.from('meeting_attendees').insert(attendeeInserts)
        }
      }
    }

    console.log('✅ Extended trip data updated successfully')
  } catch (error) {
    console.error('⚠️ Failed to update extended trip data:', error)
    // Don't throw error - this shouldn't fail the entire save operation
  }
}

// Helper function to update or create trip draft entry
async function updateTripDraftEntry(
  supabase: any, 
  tripId: string, 
  currentStep: number, 
  stepData: any, 
  completionPercentage: number, 
  tripType: string, 
  accessCode: string, 
  userId: string, 
  now: string
) {
  try {
    console.log('📝 Updating trip draft entry for tripId:', tripId)
    
    // First try to update existing draft by trip_id
    const { data: existingDraft, error: findError } = await supabase
      .from('trip_drafts')
      .select('id')
      .eq('trip_id', tripId)
      .single()

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('⚠️ Error finding existing draft:', findError)
    }

    if (existingDraft) {
      // Update existing draft
      const { error: updateError } = await supabase
        .from('trip_drafts')
        .update({
          current_step: currentStep,
          draft_data: stepData,
          completion_percentage: completionPercentage,
          last_accessed_at: now,
          updated_at: now,
        })
        .eq('trip_id', tripId)

      if (updateError) {
        console.error('⚠️ Failed to update existing draft:', updateError)
      } else {
        console.log('✅ Trip draft updated successfully')
      }
    } else {
      // Create new draft
      const { error: insertError } = await supabase
        .from('trip_drafts')
        .insert({
          creator_id: userId,
          trip_type: tripType,
          trip_id: tripId,
          current_step: currentStep,
          draft_data: stepData,
          completion_percentage: completionPercentage,
          last_accessed_at: now,
          updated_at: now,
          access_token: accessCode ? `trip_${accessCode}` : null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })

      if (insertError) {
        console.error('⚠️ Failed to create new draft:', insertError)
      } else {
        console.log('✅ Trip draft created successfully')
      }
    }
  } catch (draftError) {
    console.error('⚠️ Draft operation failed:', draftError)
    // Don't fail the request if draft update fails
  }
}