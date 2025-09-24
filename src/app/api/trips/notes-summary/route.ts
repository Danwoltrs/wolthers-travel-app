import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get search params
    const { searchParams } = new URL(request.url)
    const tripIds = searchParams.get('trip_ids')?.split(',') || []

    if (tripIds.length === 0) {
      return NextResponse.json({ error: 'No trip IDs provided' }, { status: 400 })
    }

    // Get note counts for all trips by joining activities and notes tables
    const { data: noteCounts, error: noteCountsError } = await supabase
      .from('activities')
      .select(`
        trip_id,
        activity_notes!inner (
          id
        )
      `)
      .in('trip_id', tripIds)
      
    if (noteCountsError) {
      console.error('Error fetching note counts:', noteCountsError)
      return NextResponse.json({ error: 'Failed to fetch note counts' }, { status: 500 })
    }

    // Aggregate note counts by trip
    const tripNoteCounts: Record<string, number> = {}
    
    // Initialize all trips with 0 count
    tripIds.forEach(id => {
      tripNoteCounts[id] = 0
    })
    
    // Count notes for each trip
    noteCounts.forEach(activity => {
      if (activity.activity_notes && Array.isArray(activity.activity_notes)) {
        const tripId = activity.trip_id
        if (!tripNoteCounts[tripId]) {
          tripNoteCounts[tripId] = 0
        }
        tripNoteCounts[tripId] += activity.activity_notes.length
      }
    })

    return NextResponse.json({
      success: true,
      data: tripNoteCounts
    })

  } catch (error) {
    console.error('Trip notes summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get note count for a single trip
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tripId } = body

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    // Get note count for single trip
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select(`
        id,
        activity_notes (
          id
        )
      `)
      .eq('trip_id', tripId)
      
    if (activitiesError) {
      console.error('Error fetching trip activities for note count:', activitiesError)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    // Count total notes for this trip
    let totalNotes = 0
    activities.forEach(activity => {
      if (activity.activity_notes && Array.isArray(activity.activity_notes)) {
        totalNotes += activity.activity_notes.length
      }
    })

    return NextResponse.json({
      success: true,
      tripId,
      notesCount: totalNotes
    })

  } catch (error) {
    console.error('Single trip notes summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}