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
    
    // Validate days parameter
    if (typeof days !== 'number') {
      return NextResponse.json({ 
        error: 'Days must be a number' 
      }, { status: 400 })
    }

    const isRemoval = days < 0
    const absoluteDays = Math.abs(days)
    console.log(`📅 [ExtendTrip] ${isRemoval ? 'Removing' : 'Adding'} ${absoluteDays} day(s) ${direction} trip:`, { tripId, direction, days })

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get current trip data
    const { data: currentTrip, error: tripError } = await supabase
      .from('trips')
      .select('start_date, end_date')
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
      if (isRemoval) {
        // Remove days from beginning (move start date forward)
        newStartDate.setDate(currentStartDate.getDate() + absoluteDays)
      } else {
        // Add days to beginning (move start date backward)
        newStartDate.setDate(currentStartDate.getDate() - absoluteDays)
      }
    } else {
      if (isRemoval) {
        // Remove days from end (move end date backward)
        newEndDate.setDate(currentEndDate.getDate() - absoluteDays)
      } else {
        // Add days to end (move end date forward)
        newEndDate.setDate(currentEndDate.getDate() + absoluteDays)
      }
    }
    
    // Format dates for database
    const newStartDateString = newStartDate.toISOString().split('T')[0]
    const newEndDateString = newEndDate.toISOString().split('T')[0]

    // Validate that trip still has at least one day
    if (newEndDate <= newStartDate) {
      return NextResponse.json({ 
        error: 'Cannot remove days: Trip must have at least one day' 
      }, { status: 400 })
    }
    
    // If removing days, delete activities that fall outside the new date range
    if (isRemoval) {
      const deletedDates: string[] = []
      
      if (direction === 'before') {
        // Removing days from start - collect dates being removed
        const currentStart = new Date(currentTrip.start_date + 'T00:00:00')
        for (let i = 0; i < absoluteDays; i++) {
          const dateToDelete = new Date(currentStart.getTime() + i * 24 * 60 * 60 * 1000)
          deletedDates.push(dateToDelete.toISOString().split('T')[0])
        }
      } else {
        // Removing days from end - collect dates being removed
        const currentEnd = new Date(currentTrip.end_date + 'T00:00:00')
        for (let i = absoluteDays - 1; i >= 0; i--) {
          const dateToDelete = new Date(currentEnd.getTime() - i * 24 * 60 * 60 * 1000)
          deletedDates.push(dateToDelete.toISOString().split('T')[0])
        }
      }
      
      console.log('🗑️ [ExtendTrip] Deleting activities on removed dates:', deletedDates)
      
      // Delete activities that fall on removed dates
      if (deletedDates.length > 0) {
        const { error: deleteError } = await supabase
          .from('activities')
          .delete()
          .eq('trip_id', tripId)
          .in('activity_date', deletedDates)
          
        if (deleteError) {
          console.error('Error deleting activities on removed dates:', deleteError)
          // Continue with trip update even if activity deletion fails
        } else {
          console.log('✅ [ExtendTrip] Successfully deleted activities on removed dates')
        }
      }
    }
    
    console.log('📅 [ExtendTrip] Date calculation:', {
      currentStart: currentTrip.start_date,
      currentEnd: currentTrip.end_date,
      newStart: newStartDateString,
      newEnd: newEndDateString,
      direction,
      days,
      operation: isRemoval ? 'removal' : 'addition'
    })

    // Update trip dates
    const { data: updatedTrip, error: updateError } = await supabase
      .from('trips')
      .update({
        start_date: newStartDateString,
        end_date: newEndDateString,
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

    console.log(`✅ [ExtendTrip] Successfully ${isRemoval ? 'removed' : 'added'} ${absoluteDays} day(s):`, {
      tripId,
      direction,
      days,
      operation: isRemoval ? 'removal' : 'addition',
      newStartDate: newStartDateString,
      newEndDate: newEndDateString
    })

    return NextResponse.json({
      success: true,
      message: isRemoval 
        ? `Successfully removed ${absoluteDays} day${absoluteDays > 1 ? 's' : ''} from ${direction === 'before' ? 'the beginning of' : 'the end of'} the trip`
        : `Successfully added ${absoluteDays} day${absoluteDays > 1 ? 's' : ''} ${direction} the trip`,
      updatedTrip: {
        start_date: newStartDateString,
        end_date: newEndDateString
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