import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user: any = null
  
  try {
    const { id: tripId } = await params

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

    // Get direction from request body
    const { direction, days = 1 } = await request.json()
    
    if (!direction || !['before', 'after'].includes(direction)) {
      return NextResponse.json({ 
        error: 'Direction is required and must be "before" or "after"' 
      }, { status: 400 })
    }

    console.log('📅 [ExtendTrip] Extending trip:', { tripId, direction, days })

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get current trip data
    const { data: currentTrip, error: tripError } = await supabase
      .from('trips')
      .select('start_date, end_date, duration')
      .eq('id', tripId)
      .single()

    if (tripError || !currentTrip) {
      console.error('Error fetching trip:', tripError)
      return NextResponse.json({ 
        error: 'Trip not found or access denied' 
      }, { status: 404 })
    }

    // Calculate new dates
    const currentStartDate = new Date(currentTrip.start_date + 'T00:00:00')
    const currentEndDate = new Date(currentTrip.end_date + 'T00:00:00')
    
    let newStartDate = new Date(currentStartDate)
    let newEndDate = new Date(currentEndDate)
    
    if (direction === 'before') {
      newStartDate.setDate(currentStartDate.getDate() - days)
    } else {
      newEndDate.setDate(currentEndDate.getDate() + days)
    }
    
    // Calculate new duration
    const newDuration = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Format dates for database
    const newStartDateString = newStartDate.toISOString().split('T')[0]
    const newEndDateString = newEndDate.toISOString().split('T')[0]

    console.log('📅 [ExtendTrip] Date calculation:', {
      currentStart: currentTrip.start_date,
      currentEnd: currentTrip.end_date,
      currentDuration: currentTrip.duration,
      newStart: newStartDateString,
      newEnd: newEndDateString,
      newDuration
    })

    // Update trip dates
    const { data: updatedTrip, error: updateError } = await supabase
      .from('trips')
      .update({
        start_date: newStartDateString,
        end_date: newEndDateString,
        duration: newDuration,
        updated_at: new Date().toISOString()
      })
      .eq('id', tripId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating trip:', updateError)
      return NextResponse.json({ 
        error: 'Failed to extend trip dates', 
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ [ExtendTrip] Successfully extended trip:', {
      tripId,
      direction,
      daysAdded: days,
      newDuration: newDuration
    })

    return NextResponse.json({
      success: true,
      message: `Successfully added ${days} day${days > 1 ? 's' : ''} ${direction} the trip`,
      updatedTrip: {
        start_date: newStartDateString,
        end_date: newEndDateString,
        duration: newDuration
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}