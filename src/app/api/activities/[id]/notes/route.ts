import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const activityId = params.id

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Get all notes for this activity that the user can access
    const { data: notes, error } = await supabase
      .from('meeting_notes')
      .select(`
        id,
        user_id,
        content,
        note_type,
        created_at,
        updated_at
      `)
      .eq('activity_id', activityId)
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
  { params }: { params: { id: string } }
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

    const activityId = params.id
    const body = await request.json()
    const { content, note_type = 'general' } = body

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Content is required and must be an object' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Check if user already has a note for this activity with the same note type
    const { data: existingNote, error: checkError } = await supabase
      .from('meeting_notes')
      .select('id, content')
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .eq('note_type', note_type)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing note:', checkError)
      return NextResponse.json({ error: 'Failed to check existing note' }, { status: 500 })
    }

    let noteResult

    if (existingNote) {
      // Update existing note
      const { data: updatedNote, error: updateError } = await supabase
        .from('meeting_notes')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingNote.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating note:', updateError)
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
      }

      noteResult = updatedNote
    } else {
      // Create new note
      const { data: newNote, error: insertError } = await supabase
        .from('meeting_notes')
        .insert({
          activity_id: activityId,
          user_id: user.id,
          content,
          note_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating note:', insertError)
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
      }

      noteResult = newNote
    }

    return NextResponse.json(noteResult)

  } catch (error) {
    console.error('Error in notes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const activityId = params.id
    const body = await request.json()
    const { note_id, content } = body

    if (!note_id || !content) {
      return NextResponse.json({ error: 'Note ID and content are required' }, { status: 400 })
    }

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Verify user owns this note
    const { data: note, error: fetchError } = await supabase
      .from('meeting_notes')
      .select('id, content, user_id')
      .eq('id', note_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !note) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 })
    }

    // Update note
    const { data: updatedNote, error: updateError } = await supabase
      .from('meeting_notes')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', note_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating note:', updateError)
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
    }

    return NextResponse.json(updatedNote)

  } catch (error) {
    console.error('Error in notes PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      .from('meeting_notes')
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