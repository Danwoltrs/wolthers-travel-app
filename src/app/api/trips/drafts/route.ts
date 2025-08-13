import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Authentication logic - support both header and cookie auth
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
        const supabase = createServerSupabaseClient()
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
        const supabaseClient = createServerSupabaseClient()
        
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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get draft trips
    let draftsQuery = supabase
      .from('trip_drafts')
      .select(`
        *,
        users!inner (id, companyId),
        trips (
          id,
          title,
          access_code,
          start_date,
          end_date
        )
      `)
      .order('updated_at', { ascending: false })

    // If the user is not a company admin, only show their own drafts
    if (user.role !== 'company_admin') {
      draftsQuery = draftsQuery.eq('creator_id', user.id)
    } else if (user.companyId) {
      // If company admin, show drafts from their company
      draftsQuery = draftsQuery.eq('users.companyId', user.companyId)
    }

    const { data: drafts, error: draftsError } = await draftsQuery

    if (draftsError) {
      console.error('Failed to fetch drafts:', draftsError)
      return NextResponse.json(
        { error: 'Failed to fetch draft trips' },
        { status: 500 }
      )
    }

    // Process drafts to include trip data
    const processedDrafts = drafts?.map(draft => {
      const trip = draft.trips
      let title = 'Untitled Trip'
      
      if (trip?.title) {
        title = trip.title
      } else if (draft.draft_data?.title) {
        title = draft.draft_data.title
      } else if (draft.draft_data?.basic?.title) {
        title = draft.draft_data.basic.title
      } else if (draft.trip_type) {
        title = `${draft.trip_type.replace('_', ' ').toUpperCase()} Trip`
      }

      return {
        id: draft.id,
        trip_id: draft.trip_id,
        title,
        trip_type: draft.trip_type,
        current_step: draft.current_step,
        completion_percentage: draft.completion_percentage || Math.round((draft.current_step / 5) * 100),
        created_at: draft.created_at,
        updated_at: draft.updated_at,
        last_accessed_at: draft.last_accessed_at,
        access_code: trip?.access_code || draft.access_token?.replace('trip_', ''),
        draft_data: draft.draft_data,
        expires_at: draft.expires_at,
        start_date: trip?.start_date || draft.draft_data?.startDate || draft.draft_data?.basic?.startDate || new Date().toISOString(),
        end_date: trip?.end_date || draft.draft_data?.endDate || draft.draft_data?.basic?.endDate || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString()
      }
    }) || []

    return NextResponse.json({
      success: true,
      drafts: processedDrafts
    })

  } catch (error) {
    console.error('Get drafts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove drafts that are no longer needed
export async function DELETE(request: NextRequest) {
  console.log('🗑️ DELETE draft endpoint called')
  
  try {
    // Get draft ID from query params
    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('draftId')

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting draft ID:', draftId)

    // Authentication logic - support both header and cookie auth
    let user: any = null
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
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        console.log('JWT auth failed, trying Supabase session auth')
        // Fallback to Supabase session authentication
        try {
          const supabaseClient = createServerSupabaseClient()
          
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
        } catch (fallbackError) {
          console.error('Fallback auth also failed:', fallbackError)
        }
      }
    }
    
    if (!user) {
      console.log('Authentication failed - no user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.email)

    const supabase = createServerSupabaseClient()

    // Try to find the draft in trip_drafts table first
    let draft: any = null
    let isDraftTable = true
    
    const { data: draftFromDrafts, error: draftError } = await supabase
      .from('trip_drafts')
      .select('creator_id, trip_id, users!inner (id, companyId)')
      .eq('id', draftId)
      .single()

    if (draftFromDrafts && !draftError) {
      draft = draftFromDrafts
      console.log('Found draft in trip_drafts table')
    } else {
      console.log('Draft not in trip_drafts, checking trips table')
      // If not found in trip_drafts, check trips table with planning status and is_draft flag
      const { data: draftFromTrips, error: tripError } = await supabase
        .from('trips')
        .select(`
          id,
          creator_id,
          status,
          is_draft,
          users!inner (id, companyId)
        `)
        .eq('id', draftId)
        .eq('status', 'planning')
        .eq('is_draft', true)
        .single()

      if (draftFromTrips && !tripError) {
        draft = {
          creator_id: draftFromTrips.creator_id,
          trip_id: draftFromTrips.id,
          users: draftFromTrips.users
        }
        isDraftTable = false
        console.log('Found draft in trips table')
      }
    }

    if (!draft) {
      console.log('Draft not found in either table')
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    // Allow deletion if:
    // 1. User is the draft creator
    // 2. User is a company admin in the same company as the draft creator
    const canDelete = 
      draft.creator_id === user.id || 
      (user.role === 'company_admin' && user.companyId === draft.users.companyId)

    if (!canDelete) {
      console.log('Permission denied for user:', user.id, 'to delete draft created by:', draft.creator_id)
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    console.log('Deleting from', isDraftTable ? 'trip_drafts' : 'trips', 'table')

    // Delete the draft from the appropriate table
    if (isDraftTable) {
      // Delete from trip_drafts table
      const { error: deleteError } = await supabase
        .from('trip_drafts')
        .delete()
        .eq('id', draftId)

      if (deleteError) {
        console.error('Failed to delete draft from trip_drafts:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete draft' },
          { status: 500 }
        )
      }
      
      console.log('Successfully deleted from trip_drafts')
      
      // Also delete the associated trip if it exists
      if (draft.trip_id) {
        const { error: tripDeleteError } = await supabase
          .from('trips')
          .delete()
          .eq('id', draft.trip_id)
          .eq('is_draft', true)
        
        if (tripDeleteError) {
          console.warn('Failed to delete associated trip:', tripDeleteError)
        } else {
          console.log('Successfully deleted associated trip')
        }
      }
    } else {
      // Delete from trips table (draft trip stored directly in trips table)
      const { error: deleteError } = await supabase
        .from('trips')
        .delete()
        .eq('id', draftId)
        .eq('is_draft', true)

      if (deleteError) {
        console.error('Failed to delete draft trip:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete draft trip' },
          { status: 500 }
        )
      }
      
      console.log('Successfully deleted from trips table')
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    })

  } catch (error) {
    console.error('Delete draft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}