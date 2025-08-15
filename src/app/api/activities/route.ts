import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  let user: any = null
  
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
    
    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
      try {
        const decoded = verify(token, secret) as any
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get trip ID from query params
    const url = new URL(request.url)
    const tripId = url.searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Fetch activities for the trip
    const { data: activities, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .order('activity_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (fetchError) {
      console.error('Error fetching activities:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to fetch activities', 
        details: fetchError.message 
      }, { status: 500 })
    }

    return NextResponse.json(activities || [])
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  let user: any = null
  
  try {
    // Authentication logic (same as progressive-save route)
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
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        const supabase = createSupabaseServiceClient()
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
        const supabaseClient = createSupabaseServiceClient()
        
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create server-side Supabase client (bypasses RLS for service role)
    const supabase = createSupabaseServiceClient()

    // Get the request body
    const activityData = await request.json()

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
  let user: any = null
  
  try {
    // Authentication logic (same as POST)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
      try {
        const decoded = verify(token, secret) as any
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
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
  console.log('🗑️ [API] DELETE request received')
  let user: any = null
  
  try {
    // Authentication logic (same as POST)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    console.log('🗑️ [API] Auth check - Header:', !!authHeader, 'Cookie:', !!cookieToken)
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
      try {
        const decoded = verify(token, secret) as any
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
          console.log('🗑️ [API] User authenticated via JWT:', userData.email)
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
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
              console.log('🗑️ [API] User authenticated via Supabase:', userData.email)
            }
          }
        }
      }
    }

    if (!user) {
      console.error('🗑️ [API] Authentication failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get activity ID from URL
    const url = new URL(request.url)
    const activityId = url.searchParams.get('id')

    console.log('🗑️ [API] Activity ID from URL:', activityId)

    if (!activityId) {
      console.error('🗑️ [API] No activity ID provided')
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }

    console.log('🗑️ [API] Attempting to delete activity:', activityId)

    // Delete the activity
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)

    if (deleteError) {
      console.error('🗑️ [API] Supabase delete error:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete activity', 
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('🗑️ [API] Delete successful for activity:', activityId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('🗑️ [API] API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}