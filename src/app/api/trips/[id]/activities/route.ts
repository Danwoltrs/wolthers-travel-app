import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerSupabaseClient()
    
    // Fetch activities for the trip
    const { data: activities, error } = await supabase
      .from('activities')
      .select('activity_date, start_time, end_time, location, type, title')
      .eq('trip_id', id)
      .order('activity_date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) {
      console.error('Error fetching trip activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }
    
    // Transform the data to match the expected interface
    const formattedActivities = activities?.map(activity => ({
      activity_date: activity.activity_date,
      start_time: activity.start_time,
      end_time: activity.end_time,
      location: activity.location || '',
      type: activity.type || 'meeting',
      activity_title: activity.title || ''
    })) || []
    
    return NextResponse.json({
      activities: formattedActivities
    })
    
  } catch (error) {
    console.error('Trip activities API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}