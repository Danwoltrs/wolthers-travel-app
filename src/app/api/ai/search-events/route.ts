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

    const prompt = `You are an expert event researcher with access to current web information. Search for events related to: "${searchQuery}"

Your task is to find REAL, CURRENT events with ACTUAL dates and details. Focus on:

1. **Current Year Events (2025)**: Find events happening in 2025 with specific dates
2. **Professional Events**: Conferences, conventions, trade shows, forums
3. **Real Websites & Registration**: Include actual registration URLs when found
4. **Specific Venues**: Real venues, not just cities
5. **Accurate Dates**: Specific dates like "March 15-17, 2025", not vague timing

Search Strategy:
- Look for official event websites
- Check event organizer websites and announcements
- Find registration pages with actual dates
- Look for recent press releases or announcements
- Check industry association calendars

For each REAL event you find, provide:
- Event name with year (e.g., "Swiss Coffee Dinner 2025")
- Organizing body/association
- SPECIFIC dates (e.g., "November 14-15, 2025" not "Usually November")
- Exact venue name and location
- Official website URL (must be real and current)
- Registration URL if available
- Brief description of what the event covers
- Confidence level (0.8-1.0 for confirmed events with specific dates)

IMPORTANT: 
- Only include events you can verify with specific information
- If you find actual dates, include them precisely
- If registration is open, include registration URLs
- Prioritize events with confirmed 2025 dates
- If no current events found, suggest likely upcoming ones but mark confidence lower

Return as JSON array. Example:
[
  {
    "name": "Swiss Coffee Forum 2025",
    "organization": "Swiss Coffee Trade Association",
    "website": "https://www.sc-ta.ch/events/forum-2025/",
    "location": "Congress Center Basel, Switzerland",
    "dates": "November 14-15, 2025",
    "description": "Annual gathering of Swiss coffee industry professionals",
    "registrationUrl": "https://www.sc-ta.ch/register/",
    "confidence": 0.95
  }
]

Only return the JSON array, no other text.`

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 3000,
      temperature: 0.1,
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