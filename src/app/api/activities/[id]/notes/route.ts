import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id

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
        created_by_name,
        note_attachments (
          id,
          file_name,
          file_type,
          file_size,
          file_path,
          uploaded_at
        )
      `)
      .eq('itinerary_item_id', activityId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notes:', error)
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
    }

    // Filter notes based on privacy and user access
    const filteredNotes = notes?.filter(note => {
      // User can always see their own notes
      if (note.user_id === user.id) return true
      
      // User can see public notes if they have access to the activity
      if (!note.is_private) return true
      
      // Private notes are only visible to their creator
      return false
    }) || []

    return NextResponse.json({ notes: filteredNotes })

  } catch (error) {
    console.error('Error in notes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id
    const body = await request.json()
    const { content, is_private = false, created_by_name } = body

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Content is required and must be an object' }, { status: 400 })
    }

    // Check if user already has a note for this activity with the same privacy setting
    const { data: existingNote, error: checkError } = await supabase
      .from('activity_notes')
      .select('id, content')
      .eq('itinerary_item_id', activityId)
      .eq('user_id', user.id)
      .eq('is_private', is_private)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing note:', checkError)
      return NextResponse.json({ error: 'Failed to check existing note' }, { status: 500 })
    }

    let noteResult

    if (existingNote) {
      // Update existing note
      const { data: updatedNote, error: updateError } = await supabase
        .from('activity_notes')
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

      // Save to history
      await supabase
        .from('note_history')
        .insert({
          note_id: existingNote.id,
          previous_content: existingNote.content,
          edited_by: user.id
        })

      noteResult = updatedNote
    } else {
      // Create new note
      const { data: newNote, error: insertError } = await supabase
        .from('activity_notes')
        .insert({
          itinerary_item_id: activityId,
          user_id: user.id,
          content,
          is_private,
          created_by_name: created_by_name || user.user_metadata?.full_name || user.email
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
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id
    const body = await request.json()
    const { note_id, content } = body

    if (!note_id || !content) {
      return NextResponse.json({ error: 'Note ID and content are required' }, { status: 400 })
    }

    // Verify user owns this note
    const { data: note, error: fetchError } = await supabase
      .from('activity_notes')
      .select('id, content, user_id')
      .eq('id', note_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !note) {
      return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 })
    }

    // Save current content to history
    await supabase
      .from('note_history')
      .insert({
        note_id: note.id,
        previous_content: note.content,
        edited_by: user.id
      })

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
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const noteId = url.searchParams.get('note_id')

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

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