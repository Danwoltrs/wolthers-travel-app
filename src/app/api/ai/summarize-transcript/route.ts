import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { transcript, context } = body

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 })
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'AI summarization is not configured', 
        summary: 'AI summarization is currently unavailable. Please contact your administrator.'
      }, { status: 503 })
    }

    // Prepare the prompt for AI summarization
    const systemPrompt = `You are an expert meeting notes summarizer. Your task is to create concise, actionable summaries of meeting transcripts.

Guidelines:
1. Extract key points, decisions, and action items
2. Identify important insights and takeaways
3. Maintain professional tone
4. Keep summary focused and relevant
5. Include any mentioned dates, numbers, or specific details
6. If there are multiple speakers, identify different perspectives
7. Highlight any questions or unresolved issues
8. Do not use emojis or special characters - keep text professional and clean

Format the response as a clear, well-structured summary that someone who wasn't in the meeting could understand and act upon. Use only plain text formatting.`

    const userPrompt = `Please summarize the following meeting transcript:

${context?.activityTitle ? `Meeting: ${context.activityTitle}` : ''}
${context?.meetingDate ? `Date: ${new Date(context.meetingDate).toLocaleDateString()}` : ''}
${context?.companies && context.companies.length > 0 ? `Companies involved: ${context.companies.join(', ')}` : ''}

Transcript:
"${transcript}"

Please provide a comprehensive but concise summary.`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // More cost-effective model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500, // Limit response length for summaries
        temperature: 0.3, // Lower temperature for more focused summaries
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      
      // Fallback to a basic summary
      const basicSummary = generateBasicSummary(transcript)
      return NextResponse.json({ 
        summary: `AI summarization unavailable. Basic summary:\n\n${basicSummary}`,
        fallback: true
      })
    }

    const openaiResult = await openaiResponse.json()
    const summary = openaiResult.choices?.[0]?.message?.content || 'Unable to generate summary'

    console.log('AI summary generated successfully for user:', user.email)

    return NextResponse.json({ 
      summary,
      wordCount: transcript.split(' ').length,
      summaryLength: summary.split(' ').length
    })

  } catch (error) {
    console.error('Error in AI summarization:', error)
    
    // Try to get the transcript from the request for fallback
    try {
      const body = await request.json()
      const basicSummary = generateBasicSummary(body.transcript || '')
      return NextResponse.json({ 
        summary: `AI summarization failed. Basic summary:\n\n${basicSummary}`,
        error: 'AI service temporarily unavailable',
        fallback: true
      })
    } catch {
      return NextResponse.json({ 
        error: 'Failed to process transcript',
        summary: 'Unable to process the recording transcript. Please try again later.'
      }, { status: 500 })
    }
  }
}

// Fallback function for basic summarization when AI is unavailable
function generateBasicSummary(transcript: string): string {
  if (!transcript || transcript.length < 10) {
    return 'The recording was too short to summarize.'
  }

  // Basic text processing to create a simple summary
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = transcript.toLowerCase().split(/\s+/)
  
  // Count word frequency (simple approach)
  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '')
    if (cleanWord.length > 3) { // Ignore short words
      wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1
    }
  })
  
  // Get most frequent words
  const frequentWords = Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
  
  let summary = `Recording Duration: Approximately ${Math.round(transcript.length / 150)} minutes of speech\n\n`
  
  if (frequentWords.length > 0) {
    summary += `Key Topics Mentioned: ${frequentWords.join(', ')}\n\n`
  }
  
  // Take first few sentences as basic summary
  const summaryText = sentences.slice(0, Math.min(3, Math.ceil(sentences.length / 3))).join('. ')
  
  if (summaryText) {
    summary += `Content Overview: ${summaryText}...`
  } else {
    summary += 'The recording contains discussion that requires manual review.'
  }
  
  return summary
}