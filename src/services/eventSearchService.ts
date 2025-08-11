import { z } from 'zod'

// Enhanced event search schema with comprehensive details
export const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  organization: z.string().optional(),
  category: z.string().optional(),
  website: z.string().url().optional(),
  registrationUrl: z.string().url().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  location: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional()
    }).optional()
  }).optional(),
  estimatedCost: z.number().optional(),
  confidence: z.number().min(0).max(1).optional(),
  sources: z.array(z.string()).optional()
})

export type EnrichedEvent = z.infer<typeof EventSchema>

export async function searchEvents(query: string): Promise<EnrichedEvent[]> {
  // Combine multiple event search APIs for comprehensive results
  const [aiResults, eventbriteResults, googleResults] = await Promise.allSettled([
    fetchAIEvents(query),
    fetchEventbriteEvents(query),
    fetchGoogleEvents(query)
  ])

  const combinedResults: EnrichedEvent[] = [
    ...(aiResults.status === 'fulfilled' ? aiResults.value : []),
    ...(eventbriteResults.status === 'fulfilled' ? eventbriteResults.value : []),
    ...(googleResults.status === 'fulfilled' ? googleResults.value : [])
  ]

  // Remove duplicates and sort by confidence
  return Array.from(
    new Map(
      combinedResults
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .map(event => [event.id, event])
    ).values()
  )
}

async function fetchAIEvents(query: string): Promise<EnrichedEvent[]> {
  try {
    const response = await fetch('/api/ai/search-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchQuery: query })
    })

    if (!response.ok) {
      console.log('AI search API response not ok:', response.status)
      return []
    }
    
    const data = await response.json()
    console.log('AI search API response:', data)
    
    // Convert API response format to EnrichedEvent format
    const events = data.events || []
    return events.map((event: any) => ({
      id: `ai-${Date.now()}-${Math.random()}`,
      name: event.name || 'Unknown Event',
      description: event.description || '',
      organization: event.organization || '',
      website: event.website || '',
      registrationUrl: event.registrationUrl || '',
      startDate: parseDateFromString(event.dates),
      endDate: parseDateFromString(event.dates, true),
      location: {
        name: event.location || '',
        city: extractCity(event.location || ''),
        country: extractCountry(event.location || '')
      },
      confidence: event.confidence || 0.5,
      sources: ['ai-search']
    }))
  } catch (error) {
    console.error('AI search error:', error)
    return []
  }
}

function parseDateFromString(dateString?: string, isEndDate = false): string | undefined {
  if (!dateString) return undefined
  
  // Try to extract dates from various formats like "November 14-15, 2025" or "March 15, 2025"
  const yearMatch = dateString.match(/20\d{2}/)
  const year = yearMatch ? yearMatch[0] : '2025'
  
  // Look for month-day patterns
  const monthDayMatch = dateString.match(/([A-Za-z]+)\s+(\d{1,2})(?:-(\d{1,2}))?/)
  if (monthDayMatch) {
    const month = monthDayMatch[1]
    const startDay = monthDayMatch[2]
    const endDay = monthDayMatch[3]
    
    const day = isEndDate && endDay ? endDay : startDay
    
    try {
      const date = new Date(`${month} ${day}, ${year}`)
      return date.toISOString()
    } catch {
      return undefined
    }
  }
  
  return undefined
}

function extractCity(location: string): string {
  // Extract city from location strings like "Congress Center Basel, Switzerland"
  const parts = location.split(',')
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim()
  }
  return ''
}

function extractCountry(location: string): string {
  // Extract country from location strings
  const parts = location.split(',')
  if (parts.length >= 1) {
    return parts[parts.length - 1].trim()
  }
  return ''
}

async function fetchEventbriteEvents(query: string): Promise<EnrichedEvent[]> {
  // TODO: Implement Eventbrite API integration with error handling
  try {
    const response = await fetch(`/api/external/eventbrite?query=${encodeURIComponent(query)}`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

async function fetchGoogleEvents(query: string): Promise<EnrichedEvent[]> {
  // TODO: Implement Google Events API integration with error handling
  try {
    const response = await fetch(`/api/external/google-events?query=${encodeURIComponent(query)}`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}