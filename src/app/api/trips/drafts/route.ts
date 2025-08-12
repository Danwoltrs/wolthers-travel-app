import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Authentication logic (same as other endpoints)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
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

    // Get draft trips: 
    // 1. For the current user 
    // 2. For all users in the company if the user is a company admin
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

    // Process drafts to include trip data and enrich with calculated fields
    const processedDrafts = drafts?.map(draft => {
      const trip = draft.trips
      let title = 'Untitled Trip'
      
      // Try to get title from various sources
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
        start_date: trip?.start_date || draft.draft_data?.startDate || draft.draft_data?.basic?.startDate,
        end_date: trip?.end_date || draft.draft_data?.endDate || draft.draft_data?.basic?.endDate
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
  try {
    let user: any = null
    
    // Authentication logic (same as GET)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
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

    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('draftId')

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify the draft belongs to the user or can be deleted by a company admin
    const { data: draft, error: verifyError } = await supabase
      .from('trip_drafts')
      .select('creator_id, trip_id, users!inner (id, companyId)')
      .eq('id', draftId)
      .single()

    if (verifyError || !draft) {
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
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete the draft
    const { error: deleteError } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('id', draftId)

    if (deleteError) {
      console.error('Failed to delete draft:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      )
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