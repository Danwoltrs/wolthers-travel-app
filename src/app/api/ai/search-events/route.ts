import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface EventSearchResult {
  name: string
  organization?: string
  website?: string
  location?: string
  dates?: string
  description?: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const { searchQuery } = await request.json()

    if (!searchQuery || searchQuery.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    const prompt = `You are an expert event researcher specializing in finding professional conferences, conventions, and industry events. 

Search for events related to: "${searchQuery}"

Please analyze this search query and provide information about relevant events, conferences, or conventions. Focus on:
1. Professional industry events (conferences, conventions, trade shows)
2. Annual recurring events that businesses typically attend
3. Events in the coffee, agriculture, or related industries if applicable
4. International business events and forums

For each event you find or can reasonably infer exists, provide:
- Event name (with intelligent naming like "NCA Convention 2025" or "Swiss Coffee Forum 2025")
- Organizing body/association
- Typical location or recent locations
- Usual timing (month, season, or specific dates if known)
- Brief description of the event's purpose/focus
- Official website if known
- Confidence level (0.1 to 1.0) based on how certain you are this event exists

Format your response as a JSON array of events. If you cannot find specific events, provide educated suggestions based on the industry or search terms.

Example format:
[
  {
    "name": "International Coffee Convention 2025",
    "organization": "World Coffee Association",
    "website": "https://worldcoffee.org/convention",
    "location": "Various international locations",
    "dates": "Usually October-November",
    "description": "Premier global coffee industry gathering for professionals worldwide",
    "confidence": 0.8
  }
]

Only return the JSON array, no other text.`

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    // Parse the AI response
    let events: EventSearchResult[] = []
    try {
      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          events = JSON.parse(jsonMatch[0])
        } else {
          // Try to parse the entire response as JSON
          events = JSON.parse(content.text)
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback: create a generic event based on search query
      events = [
        {
          name: `${searchQuery} Conference 2025`,
          organization: 'Found via AI Search',
          location: 'Various locations',
          dates: 'To be determined',
          description: `Professional event related to ${searchQuery}`,
          confidence: 0.3
        }
      ]
    }

    // Filter and validate results
    const validEvents = events.filter((event: any) => 
      event.name && 
      typeof event.name === 'string' && 
      event.name.trim().length > 0
    ).slice(0, 5) // Limit to 5 results

    return NextResponse.json({
      success: true,
      events: validEvents,
      searchQuery
    })

  } catch (error) {
    console.error('Event search error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search for events',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}