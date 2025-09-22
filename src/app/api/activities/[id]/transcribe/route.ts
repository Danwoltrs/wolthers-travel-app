import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 })
    }

    // Validate file size (max 25MB for OpenAI Whisper)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ error: 'Audio file too large. Maximum size is 25MB.' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/m4a']
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json({ error: 'Unsupported audio format' }, { status: 400 })
    }

    try {
      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en', // You can make this configurable
        response_format: 'text'
      })

      // Optionally store the transcription in the database
      const { data: transcriptionRecord, error: dbError } = await supabase
        .from('activity_notes')
        .insert({
          itinerary_item_id: activityId,
          user_id: user.id,
          content: {
            type: 'audio_transcription',
            text: transcription,
            audio_duration: audioFile.size, // We'll store file size as a proxy for duration
            transcribed_at: new Date().toISOString()
          },
          is_private: false,
          created_by_name: user.user_metadata?.full_name || user.email
        })
        .select()
        .single()

      if (dbError) {
        console.warn('Could not save transcription to database:', dbError)
        // Continue anyway, just return the transcription
      }

      return NextResponse.json({
        transcription,
        success: true,
        id: transcriptionRecord?.id
      })

    } catch (transcriptionError) {
      console.error('OpenAI transcription error:', transcriptionError)
      return NextResponse.json({ 
        error: 'Failed to transcribe audio. Please try again.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in transcription endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Get all audio transcriptions for this activity
    const { data: transcriptions, error } = await supabase
      .from('activity_notes')
      .select('id, content, created_at, created_by_name, user_id')
      .eq('itinerary_item_id', activityId)
      .contains('content', { type: 'audio_transcription' })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transcriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch transcriptions' }, { status: 500 })
    }

    return NextResponse.json({ transcriptions: transcriptions || [] })

  } catch (error) {
    console.error('Error in transcriptions GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}