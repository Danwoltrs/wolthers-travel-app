import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id

    // Get activity details
    const { data: activity, error } = await supabase
      .from('activities')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        location,
        trip_id,
        activity_type,
        created_at,
        updated_at
      `)
      .eq('id', activityId)
      .single()

    if (error) {
      console.error('Error fetching activity:', error)
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(activity)

  } catch (error) {
    console.error('Error in activity GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}