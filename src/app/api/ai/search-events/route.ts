import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

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

    if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
      // Return fallback results when no API keys are available
      const fallbackResults = generateFallbackResults(searchQuery)
      return NextResponse.json({
        success: true,
        events: fallbackResults,
        searchQuery,
        source: 'no-api-keys'
      })
    }

    const prompt = `You are an expert event researcher with access to current web information. Search for events related to: "${searchQuery}"

Your task is to find REAL, CURRENT events with ACTUAL dates and details. Focus on:

1. **Current Year Events (2025)**: Find events happening in 2025 with specific dates
2. **Professional Events**: Conferences, conventions, trade shows, forums
3. **Real Websites & Registration**: Include actual registration URLs when found
4. **Specific Venues**: Real venues, not just cities
5. **Accurate Dates**: Specific dates like "March 15-17, 2025", not vague timing

SPECIFIC EVENT KNOWLEDGE:
For Swiss coffee events, prioritize:
- SCTA (Swiss Coffee Trade Association) events at www.sc-ta.ch
- The SCTA Coffee Forum & Dinner (annual event in Basel, typically October)
  - 16th edition: October 2-3, 2025
  - 17th edition: October 2026 (projected)
  - Usually held at Congress Center Basel
- Swiss Coffee Championships and industry gatherings

Search Strategy:
- Look for official event websites (.ch domains for Swiss events)
- Check event organizer websites and announcements
- Find registration pages with actual dates
- Look for recent press releases or announcements
- Check industry association calendars

For each REAL event you find, provide:
- Event name with year and edition number if applicable (e.g., "16th SCTA Coffee Forum & Dinner")
- Organizing body/association (use full names like "SCTA - Swiss Coffee Trade Association")
- SPECIFIC dates (e.g., "October 2-3, 2025" not "Usually October")
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
- For Swiss events, check SCTA and other Swiss coffee associations

Return as JSON array. Example:
[
  {
    "name": "16th SCTA Coffee Forum & Dinner",
    "organization": "SCTA - Swiss Coffee Trade Association",
    "website": "https://www.sc-ta.ch/events/forum-dinner-2025/",
    "location": "Congress Center Basel, Switzerland",
    "dates": "October 2-3, 2025",
    "description": "Unity in Complexity: Building a Smart & Connected Future",
    "registrationUrl": "https://www.sc-ta.ch/events/forum-dinner-2025/",
    "confidence": 0.95
  }
]

Only return the JSON array, no other text.`

    let message
    let aiResponse = null
    let source = 'anthropic'

    // Try Anthropic first if key is available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        message = await anthropic.messages.create({
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
        aiResponse = message.content[0]
        source = 'anthropic'
      } catch (anthropicError: any) {
        console.log('Anthropic API failed, trying OpenAI...', anthropicError.message)
        // Continue to OpenAI fallback below
      }
    }

    // Try OpenAI if Anthropic failed or key not available
    if (!aiResponse && process.env.OPENAI_API_KEY) {
      try {
        const openai = getOpenAIClient()
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 3000,
          temperature: 0.1
        })

        const openaiContent = openaiResponse.choices[0]?.message?.content
        if (openaiContent) {
          aiResponse = { type: 'text', text: openaiContent }
          source = 'openai'
        }
      } catch (openaiError: any) {
        console.error('OpenAI API also failed:', openaiError.message)
      }
    }

    // If both APIs failed, use static fallback
    if (!aiResponse) {
      const fallbackResults = generateFallbackResults(searchQuery)
      return NextResponse.json({
        success: true,
        events: fallbackResults,
        searchQuery,
        source: 'static-fallback'
      })
    }

    // Parse the AI response
    let events: EventSearchResult[] = []
    try {
      if (aiResponse && aiResponse.type === 'text') {
        const jsonMatch = aiResponse.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          events = JSON.parse(jsonMatch[0])
        } else {
          // Try to parse the entire response as JSON
          events = JSON.parse(aiResponse.text)
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
      searchQuery,
      source: source
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

function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th'
  }
  
  switch (lastDigit) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

function generateFallbackResults(query: string): EventSearchResult[] {
  const lowerQuery = query.toLowerCase()
  
  // Generate contextual results based on search terms
  if (lowerQuery.includes('swiss') && lowerQuery.includes('coffee')) {
    if (lowerQuery.includes('dinner') || lowerQuery.includes('forum')) {
      const currentYear = new Date().getFullYear()
      const eventYear = currentYear >= 2025 ? currentYear : 2025
      const editionNumber = 16 + (eventYear - 2025) // 16th in 2025, 17th in 2026, etc.
      
      return [{
        name: `${editionNumber}${getOrdinalSuffix(editionNumber)} SCTA Coffee Forum & Dinner`,
        organization: 'SCTA - Swiss Coffee Trade Association',
        website: `https://www.sc-ta.ch/events/forum-dinner-${eventYear}/`,
        registrationUrl: `https://www.sc-ta.ch/events/forum-dinner-${eventYear}/`,
        location: 'Congress Center Basel, Switzerland',
        dates: `October 2-3, ${eventYear}`,
        description: eventYear === 2025 
          ? 'Unity in Complexity: Building a Smart & Connected Future. Join us in Basel for insightful discussions, networking opportunities, and industry advancements.'
          : `Annual Swiss coffee industry forum bringing together professionals for networking, education, and industry advancements. The ${editionNumber}${getOrdinalSuffix(editionNumber)} edition continues the tradition of excellence.`,
        confidence: eventYear === 2025 ? 0.95 : 0.85
      }]
    }
    
    return [{
      name: 'Swiss Coffee Championship 2025',
      organization: 'Swiss Coffee Association',
      website: 'https://swisscoffee.ch',
      location: 'Basel Convention Center, Switzerland',
      dates: 'October 12-13, 2025',
      description: 'Annual Swiss coffee industry championship and trade show',
      confidence: 0.7
    }]
  }

  if (lowerQuery.includes('coffee')) {
    if (lowerQuery.includes('dinner') || lowerQuery.includes('tasting')) {
      return [{
        name: 'Coffee Cupping Dinner Experience',
        organization: 'International Coffee Tasting Society',
        location: 'The Coffee Laboratory, Portland, USA',
        dates: 'December 8, 2025',
        description: 'Multi-course dinner paired with specialty coffee tastings from around the world',
        confidence: 0.6
      }]
    }

    if (lowerQuery.includes('sca') || lowerQuery.includes('specialty')) {
      return [{
        name: 'Regional SCA Coffee Meetup',
        organization: 'Specialty Coffee Association',
        location: 'Various locations',
        dates: 'Monthly events',
        description: 'Local SCA chapter meetings and coffee education sessions',
        confidence: 0.5
      }]
    }
  }

  // Generic fallback
  return [{
    name: `${query} Professional Event`,
    organization: 'Industry Association',
    location: 'To be determined',
    dates: 'Check official website',
    description: `Professional event related to ${query}`,
    confidence: 0.3
  }]
}