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

    // Get all notes for this activity that the user can access
    const { data: notes, error } = await supabase
      .from('activity_notes')
      .select(`
        id,
        user_id,
        content,
        is_private,
        created_at,
        updated_at,
        created_by_name
      `)
      .eq('itinerary_item_id', activityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    // Return notes that user has access to via RLS policies
    return NextResponse.json({ notes: notes || [] })

  } catch (error) {
    console.error('Error in notes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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
    const body = await request.json()
    const { content, company_access } = body

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Content is required and must be an object' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    console.log('POST Notes - User:', user.id, user.email, 'Activity:', activityId)

    // First verify the user has access to this activity via trip participation OR activity participation
    console.log('🔍 Checking trip access for:', { userId: user.id, activityId })
    const { data: tripAccess, error: tripAccessError } = await supabase
      .from('itinerary_items')
      .select(`
        id,
        trip_id,
        trips!inner (
          id,
          access_code,
          trip_participants!inner (
            user_id
          )
        )
      `)
      .eq('id', activityId)
      .eq('trips.trip_participants.user_id', user.id)
      .maybeSingle()
    
    console.log('🔍 Trip access result:', { tripAccess, tripAccessError })

    // Check for activity-specific participation (for seminar attendees)
    console.log('🔍 Checking activity access for:', { activityId, userId: user.id })
    const { data: activityAccess, error: activityAccessError } = await supabase
      .from('activity_participants')
      .select('id, activity_id, participant_id')
      .eq('activity_id', activityId)
      .eq('participant_id', user.id)
      .maybeSingle()
    
    console.log('🔍 Activity access result:', { activityAccess, activityAccessError })

    // User must be either a trip participant OR an activity participant
    const hasAccess = (tripAccess && !tripAccessError) || (activityAccess && !activityAccessError)
    
    console.log('🔍 Final access check:', {
      hasAccess,
      tripAccessExists: !!tripAccess,
      tripAccessError,
      activityAccessExists: !!activityAccess,
      activityAccessError,
      userId: user.id,
      userEmail: user.email,
      activityId
    })
    
    if (!hasAccess) {
      console.error('User does not have access to this activity:', { 
        tripAccess: !!tripAccess, 
        tripAccessError: !!tripAccessError,
        activityAccess: !!activityAccess, 
        activityAccessError: !!activityAccessError,
        userId: user.id,
        activityId
      })
      return NextResponse.json({ 
        error: 'Access denied - you are not a participant in this trip or activity' 
      }, { status: 403 })
    }

    if (tripAccess) {
      console.log('Access verified for trip participant:', tripAccess.trips.access_code)
    } else {
      console.log('Access verified for activity participant:', activityId)
    }

    // Use upsert to handle the unique constraint properly
    const { data: noteResult, error: upsertError } = await supabase
      .from('activity_notes')
      .upsert({
        itinerary_item_id: activityId,
        user_id: user.id,
        content,
        is_private: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_name: user.full_name || user.email
      }, {
        onConflict: 'itinerary_item_id,user_id,is_private',
        ignoreDuplicates: false // This ensures updates happen on conflict
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting note:', upsertError)
      return NextResponse.json({ 
        error: 'Failed to save note', 
        details: upsertError.message 
      }, { status: 500 })
    }

    console.log('Note saved successfully:', noteResult.id)

    return NextResponse.json(noteResult)

  } catch (error) {
    console.error('Error in notes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const body = await request.json()
    const { note_id, content } = body

    if (!note_id || !content) {
      return NextResponse.json({ error: 'Note ID and content are required' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    console.log('PUT Notes - User:', user.id, user.email, 'Note ID:', note_id)

    // Verify user owns this note
    const { data: note, error: fetchError } = await supabase
      .from('activity_notes')
      .select('id, content, user_id')
      .eq('id', note_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !note) {
      console.error('Note not found:', fetchError)
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 })
    }

    // Update note
    const { data: updatedNote, error: updateError } = await supabase
      .from('activity_notes')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', note_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating note:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update note', 
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('Note updated successfully:', updatedNote.id)

    return NextResponse.json(updatedNote)

  } catch (error) {
    console.error('Error in notes PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const url = new URL(request.url)
    const noteId = url.searchParams.get('note_id')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Delete note (user can only delete their own notes due to RLS)
    const { error: deleteError } = await supabase
      .from('activity_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting note:', deleteError)
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in notes DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}