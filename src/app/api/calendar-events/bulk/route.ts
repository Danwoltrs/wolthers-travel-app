import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface BulkCalendarEventRequest {
  operation: 'create' | 'update' | 'delete'
  tripId: string
  events: Array<{
    id?: string // Required for update/delete
    type: 'flight' | 'hotel' | 'meeting' | 'business_meeting' | 'presentation' | 'lunch' | 'dinner'
    title: string
    date: string
    startTime?: string
    endTime?: string
    location?: string
    description?: string
    // Cost tracking
    costPerPerson?: { [participantId: string]: any }
    costBreakdown?: any
    costCurrency?: string
    totalEstimatedCost?: number
    // Company location
    companyLocationId?: string
    // Flight specific
    flightData?: any
    // Hotel specific
    hotelData?: any
    // Meeting specific
    attendees?: Array<any>
    agenda?: string
    priority?: 'low' | 'medium' | 'high'
    isSupplierMeeting?: boolean
    supplierCompany?: string
  }>
}

interface BulkCalendarEventResponse {
  success: boolean
  operation: string
  results: {
    processed: number
    successful: number
    failed: number
    details: Array<{
      eventIndex: number
      eventId?: string
      success: boolean
      error?: string
    }>
  }
  tripId: string
}

export async function POST(request: NextRequest) {
  console.log('📅 Bulk calendar events API called')
  
  try {
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let user = null
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

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: BulkCalendarEventRequest = await request.json()
    const { operation, tripId, events } = body

    if (!operation || !tripId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: operation, tripId, events' },
        { status: 400 }
      )
    }

    console.log(`👤 User ${user.email} performing bulk ${operation} on ${events.length} calendar events for trip ${tripId}`)

    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()

    // Verify user has permission to modify this trip
    const { data: tripData, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        creator_id, 
        trip_access_permissions (user_id, permission_type, expires_at)
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !tripData) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const hasPermission = 
      tripData.creator_id === user.id ||
      user.is_global_admin ||
      tripData.trip_access_permissions?.some((perm: any) => 
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

    // Process events
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      details: [] as Array<{
        eventIndex: number
        eventId?: string
        success: boolean
        error?: string
      }>
    }

    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      results.processed++

      try {
        let eventResult: any = null

        switch (operation) {
          case 'create':
            eventResult = await createCalendarEvent(supabase, tripId, event, user.id, now)
            break
          case 'update':
            if (!event.id) {
              throw new Error('Event ID required for update operation')
            }
            eventResult = await updateCalendarEvent(supabase, event.id, event, user.id, now)
            break
          case 'delete':
            if (!event.id) {
              throw new Error('Event ID required for delete operation')
            }
            eventResult = await deleteCalendarEvent(supabase, event.id)
            break
          default:
            throw new Error(`Unknown operation: ${operation}`)
        }

        results.successful++
        results.details.push({
          eventIndex: i,
          eventId: eventResult?.id || event.id,
          success: true
        })

      } catch (error) {
        results.failed++
        results.details.push({
          eventIndex: i,
          eventId: event.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`❌ Failed to process event ${i}:`, error)
      }
    }

    console.log(`✅ Bulk operation completed: ${results.successful}/${results.processed} successful`)

    const response: BulkCalendarEventResponse = {
      success: results.failed === 0,
      operation,
      results,
      tripId
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('🚨 Bulk calendar events API error:', error)
    
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// Helper function to create calendar events
async function createCalendarEvent(supabase: any, tripId: string, event: any, userId: string, now: string) {
  switch (event.type) {
    case 'flight':
      if (!event.flightData) {
        throw new Error('Flight data required for flight events')
      }
      return await supabase
        .from('trip_flights')
        .insert({
          trip_id: tripId,
          ...event.flightData,
          cost_per_person: event.costPerPerson || {},
          cost_breakdown: event.costBreakdown || {},
          cost_currency: event.costCurrency || 'USD',
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId
        })
        .select('id')
        .single()

    case 'hotel':
      if (!event.hotelData) {
        throw new Error('Hotel data required for hotel events')
      }
      return await supabase
        .from('trip_hotels')
        .insert({
          trip_id: tripId,
          ...event.hotelData,
          cost_per_person: event.costPerPerson || {},
          cost_breakdown: event.costBreakdown || {},
          cost_currency: event.costCurrency || 'USD',
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId
        })
        .select('id')
        .single()

    case 'meeting':
    case 'business_meeting':
    case 'presentation':
    case 'lunch':
    case 'dinner':
      const { data: newMeeting, error: meetingError } = await supabase
        .from('trip_meetings')
        .insert({
          trip_id: tripId,
          title: event.title,
          meeting_type: event.type === 'business_meeting' ? 'meeting' : event.type,
          meeting_date: event.date,
          start_time: event.startTime || '09:00',
          end_time: event.endTime,
          location: event.location,
          description: event.description,
          agenda: event.agenda,
          priority_level: event.priority || 'medium',
          meeting_status: 'scheduled',
          is_supplier_meeting: event.isSupplierMeeting || false,
          supplier_company_name: event.supplierCompany,
          cost_per_person: event.costPerPerson || {},
          cost_breakdown: event.costBreakdown || {},
          cost_currency: event.costCurrency || 'USD',
          company_location_id: event.companyLocationId,
          created_at: now,
          updated_at: now,
          created_by: userId,
          updated_by: userId
        })
        .select('id')
        .single()

      if (!meetingError && newMeeting && event.attendees && Array.isArray(event.attendees)) {
        const attendeeInserts = event.attendees.map((attendee: any) => ({
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

      return newMeeting

    default:
      throw new Error(`Unknown event type: ${event.type}`)
  }
}

// Helper function to update calendar events
async function updateCalendarEvent(supabase: any, eventId: string, event: any, userId: string, now: string) {
  // Implementation would depend on event type and table
  // This is a simplified version - in practice you'd need to determine the table based on event type
  throw new Error('Update operation not yet implemented')
}

// Helper function to delete calendar events
async function deleteCalendarEvent(supabase: any, eventId: string) {
  // Implementation would depend on event type and table
  // This is a simplified version - in practice you'd need to determine the table based on event type
  throw new Error('Delete operation not yet implemented')
}