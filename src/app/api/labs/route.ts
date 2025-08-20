import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const searchParams = request.nextUrl.searchParams
    
    const userId = searchParams.get('user_id') // For filtering user's lab access
    const includeStats = searchParams.get('include_stats') === 'true'

    // Build base query
    let query = supabase
      .from('labs')
      .select(`
        *,
        user_labs (
          id,
          role,
          users (
            id,
            full_name,
            email,
            user_type
          )
        )
      `)

    // Apply user filtering if provided
    if (userId) {
      const { data: userLabs } = await supabase
        .from('user_labs')
        .select('lab_id, role')
        .eq('user_id', userId)
      
      if (userLabs && userLabs.length > 0) {
        const allowedLabIds = userLabs.map(ul => ul.lab_id)
        query = query.in('id', allowedLabIds)
      } else {
        // User has no lab access
        return NextResponse.json({ labs: [] })
      }
    }

    query = query.order('is_main_office', { ascending: false }).order('name')

    const { data: labs, error } = await query

    if (error) {
      console.error('Error fetching labs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch labs', details: error.message },
        { status: 500 }
      )
    }

    // Add statistics if requested
    if (includeStats && labs) {
      for (const lab of labs) {
        // Get meeting count
        const { count: meetingCount } = await supabase
          .from('meetings')
          .select('id', { count: 'exact' })
          .eq('lab_id', lab.id)
        
        // Get document count
        const { count: documentCount } = await supabase
          .from('documents')
          .select('id', { count: 'exact' })
          .eq('lab_id', lab.id)
        
        // Get user count
        const userCount = lab.user_labs?.length || 0
        
        lab.stats = {
          meeting_count: meetingCount || 0,
          document_count: documentCount || 0,
          user_count: userCount
        }
      }
    }

    return NextResponse.json({ labs: labs || [] })
  } catch (error) {
    console.error('Error in labs API:', error)
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
    
    // Create lab record
    const { data: lab, error: labError } = await supabase
      .from('labs')
      .insert([{
        name: body.name,
        country: body.country,
        region: body.region,
        parent_lab_id: body.parent_lab_id,
        is_main_office: body.is_main_office || false
      }])
      .select()
      .single()

    if (labError) {
      console.error('Error creating lab:', labError)
      return NextResponse.json(
        { error: 'Failed to create lab', details: labError.message },
        { status: 500 }
      )
    }

    // Create initial user assignments if provided
    if (body.initial_users && body.initial_users.length > 0 && lab) {
      const userAssignments = body.initial_users.map((userId: string) => ({
        user_id: userId,
        lab_id: lab.id,
        role: 'member'
      }))
      
      const { error: assignmentError } = await supabase
        .from('user_labs')
        .insert(userAssignments)
      
      if (assignmentError) {
        console.error('Error creating user assignments:', assignmentError)
        // Don't fail the whole request, just log the error
      }
    }

    return NextResponse.json(lab, { status: 201 })
  } catch (error) {
    console.error('Error in create lab API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}