import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface ItineraryInput {
  tripTitle: string
  companies: Array<{
    name: string
    locations?: Array<{
      name: string
      city?: string
      address?: string
    }>
  }>
  startDate: string
  endDate: string
  rawItinerary?: string // Excel data or manual text input
  preferences?: {
    meetingTypes?: string[]
    timePreferences?: string
    additionalNotes?: string
  }
}

interface ProcessedActivity {
  time: string
  type: 'meeting' | 'visit' | 'travel' | 'meal' | 'hotel'
  title: string
  description?: string
  company?: string
  location?: string
  duration?: number
  suggestions?: {
    original: string
    improved: string
    reason: string
  }
}

interface ProcessedDay {
  date: string
  activities: ProcessedActivity[]
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const input: ItineraryInput = await request.json()

    if (!input.tripTitle || !input.startDate || !input.endDate) {
      return NextResponse.json(
        { error: 'Trip title, start date, and end date are required' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    const companiesText = input.companies.map(company => {
      const locations = company.locations?.map(loc => 
        `${loc.name}${loc.city ? ` in ${loc.city}` : ''}${loc.address ? ` (${loc.address})` : ''}`
      ).join(', ') || 'Location not specified'
      
      return `${company.name}: ${locations}`
    }).join('\n')

    const prompt = `You are an expert travel itinerary optimizer specializing in business trips. Your task is to process and improve a business trip itinerary.

Trip Details:
- Title: ${input.tripTitle}
- Duration: ${input.startDate} to ${input.endDate}
- Companies to visit:
${companiesText}

${input.rawItinerary ? `Raw Itinerary Input:
${input.rawItinerary}` : 'No specific itinerary provided - please suggest a professional business itinerary.'}

${input.preferences?.additionalNotes ? `Additional Notes: ${input.preferences.additionalNotes}` : ''}

Please process this information and provide an optimized daily itinerary with the following improvements:

1. **Time Formatting**: Convert all times to consistent 24-hour format (e.g., "14:00")
2. **Grammar & Punctuation**: Correct any grammar, spelling, or punctuation errors
3. **Location Suggestions**: For each company visit, suggest specific locations if multiple are available
4. **Activity Sequencing**: Optimize the order of activities for travel efficiency
5. **Professional Formatting**: Ensure all entries are professional and clear

For each activity, determine the appropriate type:
- "meeting": Formal business meetings or discussions
- "visit": Company tours, facility visits, or informal visits
- "travel": Transportation between locations
- "meal": Breakfast, lunch, dinner, or coffee meetings
- "hotel": Check-in, check-out, or accommodation-related

Return your response as a JSON object with this exact structure:
{
  "success": true,
  "processedItinerary": [
    {
      "date": "2025-01-15",
      "activities": [
        {
          "time": "09:00",
          "type": "meeting",
          "title": "Meeting with Company X Management",
          "description": "Quarterly business review and partnership discussion",
          "company": "Company X",
          "location": "Company X Headquarters, São Paulo",
          "duration": 120,
          "suggestions": {
            "original": "meet company x at 9am",
            "improved": "Meeting with Company X Management",
            "reason": "Improved professionalism and clarity"
          }
        }
      ],
      "notes": "Consider traffic patterns when traveling between locations"
    }
  ],
  "recommendations": [
    "Schedule buffer time between meetings",
    "Consider local traffic patterns",
    "Confirm meeting locations in advance"
  ]
}

Only return the JSON response, no other text.`

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    // Parse the AI response
    let result: any = {}
    try {
      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0])
        } else {
          result = JSON.parse(content.text)
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      
      // Fallback response
      result = {
        success: true,
        processedItinerary: [{
          date: input.startDate,
          activities: [{
            time: "09:00",
            type: "meeting",
            title: `Business meeting for ${input.tripTitle}`,
            description: "AI processing unavailable - please review and edit manually",
            duration: 120
          }],
          notes: "Please review and customize this itinerary"
        }],
        recommendations: [
          "AI processing was unavailable",
          "Please review and edit the itinerary manually",
          "Add specific company locations and meeting details"
        ]
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Itinerary generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate itinerary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}