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

    } else {
      // Idempotent creation: check if trip already exists with client temp ID
      if (clientTempId) {
        const { data: existingTrip } = await supabase
          .from('trips')
          .select('id, access_code')
          .eq('metadata->client_temp_id', clientTempId)
          .eq('creator_id', user.id)
          .single()
        
        if (existingTrip) {
          finalTripId = existingTrip.id
          accessCode = existingTrip.access_code || ''
          console.log('♾️ Found existing trip with client temp ID:', clientTempId, 'tripId:', finalTripId)
          
          // Update existing trip with new step data
          const { error: updateError } = await supabase
            .from('trips')
            .update({
              completion_step: currentStep,
              step_data: stepData,
              creation_status: getCreationStatus(currentStep),
              last_edited_at: now,
              last_edited_by: user.id,
              is_draft: currentStep < 5,
            })
            .eq('id', finalTripId)
          
          if (updateError) {
            console.error('Failed to update existing trip:', updateError)
          }
        }
      }
      
      // Create new trip when reaching step 3 (basic information) and no existing trip found
      if (currentStep >= 3 && !finalTripId) {
        // Generate smart slug using new business logic
        console.log('🎫 Access code logic - provided:', providedAccessCode, 'stepData.accessCode:', stepData.accessCode)
        
        if (providedAccessCode || stepData.accessCode) {
          accessCode = providedAccessCode || stepData.accessCode
        } else {
          // Generate business-logic based slug
          const tripData = extractTripData(stepData, currentStep)
          const companies = stepData.companies || []
          const startDate = new Date(tripData.start_date || new Date())
          
          const baseSlug = makeTripSlug({
            trip_type: mapTripType(tripType),
            companies: companies,
            month: startDate.getMonth() + 1,
            year: startDate.getFullYear(),
            code: stepData.eventCode,
            title: tripData.title
          })
          
          // Ensure uniqueness using database function
          const { data: uniqueSlug } = await supabase
            .rpc('generate_unique_trip_slug', {
              base_slug: baseSlug,
              creator_user_id: user.id
            })
          
          accessCode = uniqueSlug || baseSlug
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
      }
    }

    // Update or create trip draft entry
    if (finalTripId) {
      try {
        // First try to update existing draft by trip_id
        const { data: existingDraft, error: findError } = await supabase
          .from('trip_drafts')
          .select('id')
          .eq('trip_id', finalTripId)
          .single()

        if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error finding existing draft:', findError)
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
            .eq('trip_id', finalTripId)

          if (updateError) {
            console.error('Failed to update existing draft:', updateError)
          }
        } else {
          // Create new draft
          const { error: insertError } = await supabase
            .from('trip_drafts')
            .insert({
              creator_id: user.id,
              trip_type: tripType,
              trip_id: finalTripId,
              current_step: currentStep,
              draft_data: stepData,
              completion_percentage: completionPercentage,
              last_accessed_at: now,
              updated_at: now,
              access_token: accessCode ? `trip_${accessCode}` : null,
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            })

          if (insertError) {
            console.error('Failed to create new draft:', insertError)
          }
        }
      } catch (draftError) {
        console.error('Draft operation failed:', draftError)
        // Don't fail the request if draft update fails
      }
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