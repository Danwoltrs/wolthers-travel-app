import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: any = null
  
  try {
    // Authentication logic (same as other API endpoints)
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

    const resolvedParams = await params
    const activityId = resolvedParams.id

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get activity details with trip information and verify user has access
    const { data: activity, error } = await supabase
      .from('itinerary_items')
      .select(`
        *,
        trips!inner (
          id,
          title,
          access_code,
          trip_participants!inner (
            user_id
          )
        )
      `)
      .eq('id', activityId)
      .eq('trips.trip_participants.user_id', user.id)
      .single()

    // If not found via trip participation, check activity-specific participation
    if (error) {
      const { data: activityWithAccess, error: activityError } = await supabase
        .from('itinerary_items')
        .select(`
          *,
          activity_participants!inner (
            participant_id
          )
        `)
        .eq('id', activityId)
        .eq('activity_participants.participant_id', user.id)
        .single()

      if (activityError) {
        console.error('Error fetching activity:', error, activityError)
        return NextResponse.json({ error: 'Activity not found or access denied' }, { status: 404 })
      }

      return NextResponse.json(activityWithAccess)
    }

    return NextResponse.json(activity)

  } catch (error) {
    console.error('Error in activity GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}