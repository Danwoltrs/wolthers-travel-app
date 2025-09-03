import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ItineraryInput {
  tripTitle: string
  tripId?: string // Optional trip ID to create activities directly
  companies: Array<{
    id?: string
    name: string
    fantasyName?: string
    city?: string
    state?: string
    region?: string
    country?: string
    coordinates?: {
      lat: number
      lng: number
    }
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
    includeTransitTimes?: boolean
    optimizeRoute?: boolean
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

// Google Maps Distance Matrix API helper
async function calculateTransitTimes(companies: ItineraryInput['companies']): Promise<Map<string, Map<string, { duration: number; distance: number }>>> {
  const transitMap = new Map()
  
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.log('Google Maps API key not configured, skipping transit calculations')
    return transitMap
  }

  // Extract coordinates from companies
  const locations = companies
    .filter(company => company.coordinates)
    .map(company => ({
      id: company.id || company.name,
      name: company.name,
      lat: company.coordinates!.lat,
      lng: company.coordinates!.lng
    }))

  if (locations.length < 2) {
    console.log('Insufficient location data for transit calculations')
    return transitMap
  }

  try {
    // Calculate distance matrix between all locations
    const origins = locations.map(loc => `${loc.lat},${loc.lng}`)
    const destinations = origins

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?` +
      `origins=${encodeURIComponent(origins.join('|'))}` +
      `&destinations=${encodeURIComponent(destinations.join('|'))}` +
      `&mode=driving` +
      `&units=metric` +
      `&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status === 'OK') {
      data.rows.forEach((row: any, i: number) => {
        const originId = locations[i].id
        if (!transitMap.has(originId)) {
          transitMap.set(originId, new Map())
        }

        row.elements.forEach((element: any, j: number) => {
          if (element.status === 'OK') {
            const destinationId = locations[j].id
            transitMap.get(originId).set(destinationId, {
              duration: element.duration.value, // seconds
              distance: element.distance.value  // meters
            })
          }
        })
      })

      console.log(`✅ Calculated transit times for ${locations.length} locations`)
    } else {
      console.error('Google Maps API error:', data.error_message)
    }
  } catch (error) {
    console.error('Transit time calculation failed:', error)
  }

  return transitMap
}

// Route optimization helper
function optimizeCompanyOrder(companies: ItineraryInput['companies'], transitTimes: Map<string, Map<string, { duration: number; distance: number }>>): ItineraryInput['companies'] {
  if (companies.length <= 2 || transitTimes.size === 0) {
    return companies
  }

  // Simple nearest neighbor algorithm for route optimization
  const unvisited = [...companies]
  const optimizedOrder = []
  
  // Start with the first company
  let current = unvisited.shift()!
  optimizedOrder.push(current)

  while (unvisited.length > 0) {
    const currentId = current.id || current.name
    let nearestCompany = unvisited[0]
    let shortestTime = Infinity

    // Find the nearest unvisited company
    unvisited.forEach(company => {
      const companyId = company.id || company.name
      const transitData = transitTimes.get(currentId)?.get(companyId)
      
      if (transitData && transitData.duration < shortestTime) {
        shortestTime = transitData.duration
        nearestCompany = company
      }
    })

    // Remove from unvisited and add to optimized order
    const index = unvisited.indexOf(nearestCompany)
    unvisited.splice(index, 1)
    optimizedOrder.push(nearestCompany)
    current = nearestCompany
  }

  console.log(`🔄 Optimized company visit order based on travel times`)
  return optimizedOrder
}

// Create activities in database
async function createActivitiesFromItinerary(
  tripId: string, 
  processedItinerary: ProcessedDay[], 
  companies: ItineraryInput['companies'],
  transitTimes: Map<string, Map<string, { duration: number; distance: number }>>
): Promise<void> {
  if (!tripId) return

  const activities = []
  
  for (const day of processedItinerary) {
    for (const activity of day.activities) {
      // Find matching company
      const matchingCompany = companies.find(company => 
        activity.company && (
          company.name.toLowerCase().includes(activity.company.toLowerCase()) ||
          company.fantasyName?.toLowerCase().includes(activity.company.toLowerCase())
        )
      )

      activities.push({
        trip_id: tripId,
        title: activity.title,
        description: activity.description || '',
        activity_date: day.date,
        start_time: activity.time,
        end_time: addMinutesToTime(activity.time, activity.duration || 60),
        activity_type: activity.type,
        location: activity.location || '',
        company_id: matchingCompany?.id || null,
        company_name: matchingCompany?.name || activity.company || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }

  if (activities.length > 0) {
    const { error } = await supabase
      .from('trip_activities')
      .insert(activities)

    if (error) {
      console.error('Failed to create activities:', error)
    } else {
      console.log(`✅ Created ${activities.length} activities in database`)
    }
  }
}

// Helper function to add minutes to a time string
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

export async function POST(request: NextRequest) {
  try {
    const input: ItineraryInput = await request.json()

    console.log('🎯 AI Itinerary Generation Request:', {
      tripTitle: input.tripTitle,
      companies: input.companies?.length,
      includeTransit: input.preferences?.includeTransitTimes,
      optimizeRoute: input.preferences?.optimizeRoute,
      tripId: input.tripId
    })

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

    // Step 1: Calculate transit times if requested and coordinates are available
    let transitTimes = new Map()
    let optimizedCompanies = input.companies

    if (input.preferences?.includeTransitTimes) {
      console.log('🔄 Calculating transit times between locations...')
      transitTimes = await calculateTransitTimes(input.companies)
      
      if (input.preferences?.optimizeRoute && transitTimes.size > 0) {
        console.log('🗺️ Optimizing route based on transit times...')
        optimizedCompanies = optimizeCompanyOrder(input.companies, transitTimes)
      }
    }

    // Step 2: Build enhanced company text with location and transit info
    const companiesText = optimizedCompanies.map((company, index) => {
      let companyText = `${index + 1}. ${company.name}`
      
      if (company.fantasyName && company.fantasyName !== company.name) {
        companyText += ` (${company.fantasyName})`
      }
      
      if (company.city && company.state) {
        companyText += ` - ${company.city}, ${company.state}`
      }
      
      if (company.coordinates) {
        companyText += ` (Coordinates: ${company.coordinates.lat.toFixed(4)}, ${company.coordinates.lng.toFixed(4)})`
      }

      // Add transit time to next location if available
      if (index < optimizedCompanies.length - 1 && transitTimes.size > 0) {
        const currentId = company.id || company.name
        const nextCompany = optimizedCompanies[index + 1]
        const nextId = nextCompany.id || nextCompany.name
        const transitData = transitTimes.get(currentId)?.get(nextId)
        
        if (transitData) {
          const durationMinutes = Math.round(transitData.duration / 60)
          const distanceKm = Math.round(transitData.distance / 1000)
          companyText += `\n   → Travel to next location: ${durationMinutes} minutes (${distanceKm} km)`
        }
      }

      return companyText
    }).join('\n\n')

    const prompt = `You are an expert travel itinerary optimizer specializing in business trips. Your task is to process and improve a business trip itinerary with REAL TRANSIT TIME data.

Trip Details:
- Title: ${input.tripTitle}
- Duration: ${input.startDate} to ${input.endDate}
- Companies to visit (${input.preferences?.optimizeRoute ? 'OPTIMIZED ORDER based on Google Maps data' : 'in provided order'}):
${companiesText}

${transitTimes.size > 0 ? '✅ REAL TRANSIT TIMES have been calculated using Google Maps and are shown above.' : '⚠️ No transit time data available - use estimated times.'}

${input.rawItinerary ? `Raw Itinerary Input:
${input.rawItinerary}` : 'No specific itinerary provided - please suggest a professional business itinerary.'}

${input.preferences?.additionalNotes ? `Additional Notes: ${input.preferences.additionalNotes}` : ''}

Please process this information and provide an optimized daily itinerary with the following improvements:

1. **Time Formatting**: Convert all times to consistent 24-hour format (e.g., "14:00")
2. **Travel Time Integration**: ${transitTimes.size > 0 ? 'Use the REAL travel times shown above to schedule travel blocks between companies' : 'Estimate reasonable travel times between locations'}
3. **Grammar & Punctuation**: Correct any grammar, spelling, or punctuation errors
4. **Activity Sequencing**: ${input.preferences?.optimizeRoute ? 'The companies are already in optimized order - maintain this sequence' : 'Optimize the order of activities for travel efficiency'}
5. **Professional Formatting**: Ensure all entries are professional and clear
6. **Travel Activities**: Include specific "travel" type activities between company visits with accurate durations

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

    // Step 3: Create activities in database if tripId is provided
    if (input.tripId && result.processedItinerary) {
      console.log('💾 Creating activities in database for tripId:', input.tripId)
      try {
        await createActivitiesFromItinerary(
          input.tripId,
          result.processedItinerary,
          optimizedCompanies,
          transitTimes
        )
        
        // Add database creation success to result
        result.databaseCreated = true
        result.activitiesCount = result.processedItinerary.reduce((sum: number, day: any) => sum + day.activities.length, 0)
      } catch (dbError) {
        console.error('Failed to create activities in database:', dbError)
        result.databaseCreated = false
        result.databaseError = dbError instanceof Error ? dbError.message : 'Unknown database error'
      }
    }

    // Step 4: Add transit optimization metadata to response
    if (transitTimes.size > 0) {
      result.transitOptimization = {
        calculatedTransitTimes: true,
        routeOptimized: input.preferences?.optimizeRoute || false,
        locationsWithCoordinates: input.companies.filter(c => c.coordinates).length,
        totalLocations: input.companies.length
      }
    }

    console.log('✅ AI Itinerary Generation completed successfully')
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