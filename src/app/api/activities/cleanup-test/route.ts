import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  let user: any = null
  
  try {
    // Authentication logic (same as activities route)
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

    // Get trip ID from request body
    const { tripId } = await request.json()
    
    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    console.log('🧹 [CleanupTest] Starting test activity cleanup for trip:', tripId)

    // Find test activities (case-insensitive search for "test" in title)
    const { data: testActivities, error: findError } = await supabase
      .from('activities')
      .select('id, title, activity_date, start_time')
      .eq('trip_id', tripId)
      .ilike('title', '%test%')

    if (findError) {
      console.error('Error finding test activities:', findError)
      return NextResponse.json({ 
        error: 'Failed to find test activities', 
        details: findError.message 
      }, { status: 500 })
    }

    console.log('🔍 [CleanupTest] Found test activities:', testActivities?.map(a => ({
      id: a.id,
      title: a.title,
      date: a.activity_date,
      time: a.start_time
    })))

    if (!testActivities || testActivities.length === 0) {
      return NextResponse.json({ 
        message: 'No test activities found to clean up',
        deletedCount: 0
      })
    }

    // Delete all test activities
    const testActivityIds = testActivities.map(a => a.id)
    const { error: deleteError } = await supabase
      .from('activities')
      .delete()
      .in('id', testActivityIds)

    if (deleteError) {
      console.error('Error deleting test activities:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete test activities', 
        details: deleteError.message 
      }, { status: 500 })
    }

    console.log('✅ [CleanupTest] Successfully deleted', testActivities.length, 'test activities')

    return NextResponse.json({ 
      message: `Successfully cleaned up ${testActivities.length} test activities`,
      deletedCount: testActivities.length,
      deletedActivities: testActivities.map(a => ({
        id: a.id,
        title: a.title,
        date: a.activity_date,
        time: a.start_time
      }))
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}