import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const searchParams = request.nextUrl.searchParams
    
    const companyId = searchParams.get('company_id')
    const labId = searchParams.get('lab_id')
    const userId = searchParams.get('user_id')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build base query
    let query = supabase
      .from('meetings')
      .select(`
        *,
        companies (
          id,
          name,
          fantasy_name,
          category
        ),
        labs (
          id,
          name,
          country
        ),
        users!meetings_created_by_fkey (
          id,
          full_name,
          email
        ),
        meeting_participants (
          id,
          role,
          users (
            id,
            full_name,
            email,
            company_id
          ),
          companies (
            id,
            name,
            fantasy_name
          )
        ),
        documents (
          id,
          filename,
          original_filename,
          file_type,
          document_type,
          created_at
        )
      `)

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    if (labId) {
      query = query.eq('lab_id', labId)
    }
    
    if (fromDate) {
      query = query.gte('date', fromDate)
    }
    
    if (toDate) {
      query = query.lte('date', toDate)
    }

    // Apply user filtering for permission control
    if (userId) {
      // Get meetings where user participated or has access through lab membership
      const { data: userMeetings } = await supabase
        .from('meeting_participants')
        .select('meeting_id')
        .eq('user_id', userId)
      
      const { data: userLabs } = await supabase
        .from('user_labs')
        .select('lab_id, labs (is_main_office)')
        .eq('user_id', userId)
      
      const allowedMeetingIds = userMeetings?.map(m => m.meeting_id) || []
      const hasMainOfficeAccess = userLabs?.some(ul => ul.labs?.is_main_office)
      
      if (!hasMainOfficeAccess && allowedMeetingIds.length > 0) {
        query = query.in('id', allowedMeetingIds)
      } else if (!hasMainOfficeAccess) {
        // User has no access to any meetings
        return NextResponse.json({ meetings: [] })
      }
      // If user has main office access, they can see all meetings
    }

    query = query
      .order('date', { ascending: false })
      .limit(limit)

    const { data: meetings, error } = await query

    if (error) {
      console.error('Error fetching meetings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch meetings', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ meetings: meetings || [] })
  } catch (error) {
    console.error('Error in meetings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    // Create meeting record
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert([{
        title: body.title,
        date: body.date,
        location: body.location,
        company_id: body.company_id,
        lab_id: body.lab_id,
        meeting_type: body.meeting_type || 'business_visit',
        created_by: body.created_by
      }])
      .select()
      .single()

    if (meetingError) {
      console.error('Error creating meeting:', meetingError)
      return NextResponse.json(
        { error: 'Failed to create meeting', details: meetingError.message },
        { status: 500 }
      )
    }

    // Create participant records
    if (body.participants && body.participants.length > 0 && meeting) {
      const participants = body.participants.map((p: any) => ({
        meeting_id: meeting.id,
        user_id: p.user_id,
        company_id: p.company_id,
        role: p.role || 'attendee'
      }))
      
      const { error: participantsError } = await supabase
        .from('meeting_participants')
        .insert(participants)
      
      if (participantsError) {
        console.error('Error creating participants:', participantsError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('Error in create meeting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}