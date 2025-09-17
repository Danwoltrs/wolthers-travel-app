import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { processMeetingResponseToken, createMeetingResponseRecord } from '@/lib/meeting-response-tokens'
import { sendMeetingResponseNotification, MeetingResponseNotificationData } from '@/lib/resend'

/**
 * Handle meeting declination from hosts
 * POST /api/meetings/response/decline
 * 
 * This endpoint processes meeting decline responses from hosts
 * who click the "Decline" button in their invitation emails.
 */
export async function POST(request: NextRequest) {
  console.log('❌ Processing meeting decline request')
  
  try {
    const body = await request.json()
    const { token, message } = body

    if (!token) {
      console.error('❌ No token provided in meeting decline')
      return NextResponse.json(
        { error: 'Missing response token' },
        { status: 400 }
      )
    }

    // Validate the token
    const tokenValidation = processMeetingResponseToken(token)
    
    if (!tokenValidation.valid) {
      console.error('❌ Invalid token for meeting decline:', tokenValidation.error)
      return NextResponse.json(
        { 
          error: tokenValidation.expired ? 'Response link has expired' : 'Invalid response link',
          expired: tokenValidation.expired 
        },
        { status: 400 }
      )
    }

    const { data: tokenData } = tokenValidation

    if (tokenData!.responseType !== 'decline') {
      console.error('❌ Token is not for meeting decline:', tokenData!.responseType)
      return NextResponse.json(
        { error: 'Invalid response type for this endpoint' },
        { status: 400 }
      )
    }

    console.log('✅ Valid decline token:', {
      hostEmail: tokenData!.hostEmail,
      companyName: tokenData!.companyName,
      activityId: tokenData!.activityId
    })

    // Get meeting/activity details from database
    const supabase = createServerSupabaseClient()
    
    let meetingData: any = null
    let originalMeetingDate: Date | null = null
    let originalMeetingTime: string | null = null
    let hostName: string = tokenData!.hostEmail // Default fallback
    let tripId: string | null = null

    if (tokenData!.activityId) {
      // Get activity details
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select(`
          *,
          itinerary_days!inner(
            trip_id,
            trips!inner(
              title,
              created_by,
              users!inner(full_name, email)
            )
          )
        `)
        .eq('id', tokenData!.activityId)
        .single()

      if (activityError) {
        console.error('❌ Failed to fetch activity:', activityError)
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        )
      }

      meetingData = activity
      originalMeetingDate = new Date(activity.start_time)
      originalMeetingTime = new Date(activity.start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
      tripId = activity.itinerary_days.trip_id
      
      // Try to get host name from company contacts or use email
      const { data: contacts } = await supabase
        .from('company_contacts')
        .select('name')
        .eq('email', tokenData!.hostEmail)
        .limit(1)
        .single()
      
      if (contacts?.name) {
        hostName = contacts.name
      }

    } else if (tokenData!.meetingId) {
      // Get meeting details
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', tokenData!.meetingId)
        .single()

      if (meetingError) {
        console.error('❌ Failed to fetch meeting:', meetingError)
        return NextResponse.json(
          { error: 'Meeting not found' },
          { status: 404 }
        )
      }

      meetingData = meeting
      originalMeetingDate = new Date(meeting.date)
    }

    if (!meetingData) {
      console.error('❌ No meeting or activity data found')
      return NextResponse.json(
        { error: 'Meeting information not found' },
        { status: 404 }
      )
    }

    // Check if response already exists
    const { data: existingResponse } = await supabase
      .from('meeting_responses')
      .select('id, response_type, responded_at')
      .eq('host_email', tokenData!.hostEmail)
      .eq(tokenData!.activityId ? 'activity_id' : 'meeting_id', tokenData!.activityId || tokenData!.meetingId)
      .limit(1)
      .single()

    if (existingResponse) {
      console.log('⚠️ Response already exists:', existingResponse)
      return NextResponse.json(
        { 
          message: 'You have already responded to this meeting invitation',
          previousResponse: {
            type: existingResponse.response_type,
            respondedAt: existingResponse.responded_at
          }
        },
        { status: 200 }
      )
    }

    // Create response record
    const responseRecord = createMeetingResponseRecord(tokenData!, {
      responseMessage: message,
      originalMeetingDate,
      originalMeetingTime,
      tripId
    })

    // Set the host name we determined
    responseRecord.host_name = hostName

    // Insert response into database
    const { data: response, error: insertError } = await supabase
      .from('meeting_responses')
      .insert(responseRecord)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to insert meeting response:', insertError)
      return NextResponse.json(
        { error: 'Failed to record your response. Please try again.' },
        { status: 500 }
      )
    }

    console.log('✅ Meeting decline recorded:', response.id)

    // Send notification to organizer
    try {
      let organizerEmail = 'trips@trips.wolthers.com' // Default fallback
      let organizerName = 'Wolthers Team'
      let tripTitle = null
      let tripAccessCode = null

      // Get organizer information if activity exists
      if (tokenData!.activityId && meetingData.itinerary_days) {
        const tripCreator = meetingData.itinerary_days.trips.users
        if (tripCreator?.email) {
          organizerEmail = tripCreator.email
          organizerName = tripCreator.full_name || 'Wolthers Team'
          tripTitle = meetingData.itinerary_days.trips.title
          // Get trip access code if needed
          const { data: trip } = await supabase
            .from('trips')
            .select('access_code')
            .eq('id', meetingData.itinerary_days.trip_id)
            .single()
          tripAccessCode = trip?.access_code
        }
      }

      const notificationData: MeetingResponseNotificationData = {
        organizerName,
        organizerEmail,
        hostName,
        hostEmail: tokenData!.hostEmail,
        companyName: tokenData!.companyName,
        meetingTitle: meetingData.title,
        originalDate: originalMeetingDate?.toLocaleDateString() || 'Unknown',
        originalTime: originalMeetingTime || 'Unknown',
        responseType: 'decline',
        responseMessage: message,
        tripTitle,
        tripAccessCode,
        respondedAt: response.responded_at
      }

      const notificationResult = await sendMeetingResponseNotification(organizerEmail, notificationData)
      
      if (notificationResult.success) {
        console.log('✅ Notification sent to organizer:', organizerEmail)
        
        // Update response record to mark notification as sent
        await supabase
          .from('meeting_responses')
          .update({
            organizer_notified: true,
            organizer_notified_at: new Date().toISOString()
          })
          .eq('id', response.id)
      } else {
        console.error('❌ Failed to send notification to organizer:', notificationResult.error)
      }
    } catch (notificationError) {
      console.error('❌ Error sending organizer notification:', notificationError)
      // Continue processing - notification failure shouldn't break the response
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Meeting declined. We understand and will respect your decision.',
      response: {
        id: response.id,
        type: 'decline',
        hostName,
        companyName: tokenData!.companyName,
        meetingTitle: meetingData.title,
        originalDate: originalMeetingDate?.toLocaleDateString(),
        originalTime: originalMeetingTime,
        responseMessage: message,
        respondedAt: response.responded_at
      }
    })

  } catch (error) {
    console.error('❌ Error processing meeting decline:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

/**
 * Handle GET requests (for direct link access)
 * This allows hosts to decline meetings just by visiting the URL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { error: 'Missing response token' },
      { status: 400 }
    )
  }

  // Process the decline using the same logic as POST
  const mockBody = { token, message: 'Meeting declined via direct link' }
  const mockRequest = {
    ...request,
    json: async () => mockBody
  } as NextRequest

  return await POST(mockRequest)
}