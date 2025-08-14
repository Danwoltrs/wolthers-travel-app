import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export async function POST(request: NextRequest) {
  try {
    // Get session and user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create server-side Supabase client (bypasses RLS for service role)
    const supabase = createSupabaseServiceClient()

    // Get the request body
    const activityData = await request.json()

    // Get user from database to ensure we have the correct user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, user_type, is_global_admin')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      console.error('User lookup error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare activity data with server-side user ID
    const newActivity = {
      ...activityData,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert the activity using service role (bypasses RLS)
    const { data: activity, error: createError } = await supabase
      .from('activities')
      .insert([newActivity])
      .select()
      .single()

    if (createError) {
      console.error('Error creating activity:', createError)
      return NextResponse.json({ 
        error: 'Failed to create activity', 
        details: createError.message 
      }, { status: 500 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get session and user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get the request body
    const { activityId, ...updates } = await request.json()

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }

    // Update the activity
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data: activity, error: updateError } = await supabase
      .from('activities')
      .update(updateData)
      .eq('id', activityId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating activity:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update activity', 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get session and user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get activity ID from URL
    const url = new URL(request.url)
    const activityId = url.searchParams.get('id')

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }

    // Delete the activity
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)

    if (deleteError) {
      console.error('Error deleting activity:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete activity', 
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}