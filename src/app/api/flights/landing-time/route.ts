import { NextRequest, NextResponse } from 'next/server'

// Airport buffer times in minutes for different airport types
const AIRPORT_BUFFER_TIMES = {
  // International airports - longer buffer for customs/immigration
  international: {
    small: 45,      // Small international airports
    medium: 60,     // Medium-sized international hubs  
    large: 90,      // Major international hubs
    major_hub: 120  // Largest international hubs (JFK, LAX, CDG, etc.)
  },
  // Domestic airports - shorter buffer times
  domestic: {
    small: 30,
    medium: 45,
    large: 60,
    major_hub: 75
  }
}

// Airport classifications for buffer time calculation
const AIRPORT_CLASSIFICATIONS = {
  // Major international hubs
  'JFK': { type: 'international', size: 'major_hub' },
  'LAX': { type: 'international', size: 'major_hub' },
  'CDG': { type: 'international', size: 'major_hub' },
  'LHR': { type: 'international', size: 'major_hub' },
  'FRA': { type: 'international', size: 'major_hub' },
  'AMS': { type: 'international', size: 'major_hub' },
  'DXB': { type: 'international', size: 'major_hub' },
  
  // Large international airports
  'MIA': { type: 'international', size: 'large' },
  'ATL': { type: 'international', size: 'large' },
  'ORD': { type: 'international', size: 'large' },
  'DFW': { type: 'international', size: 'large' },
  'MAD': { type: 'international', size: 'large' },
  'FCO': { type: 'international', size: 'large' },
  'DOH': { type: 'international', size: 'large' },
  'IST': { type: 'international', size: 'large' },
  
  // Brazilian airports (GRU is destination, so incoming flights are international)
  'GRU': { type: 'international', size: 'large' },  // São Paulo/Guarulhos
  'GIG': { type: 'international', size: 'large' },  // Rio de Janeiro/Galeão
  'BSB': { type: 'international', size: 'medium' }, // Brasília
  'CGH': { type: 'domestic', size: 'large' },       // São Paulo/Congonhas (mainly domestic)
  'SDU': { type: 'domestic', size: 'medium' },      // Rio de Janeiro/Santos Dumont
  
  // Default for unlisted airports
  'default_international': { type: 'international', size: 'medium' },
  'default_domestic': { type: 'domestic', size: 'medium' }
}

interface LandingTimeRequest {
  arrivalTime: string      // Format: "HH:MM" (24-hour format)
  arrivalDate: string      // Format: "YYYY-MM-DD"
  departureAirport?: string // Airport code (e.g., "JFK")
  arrivalAirport?: string   // Airport code (e.g., "GRU") 
  flightType?: 'international' | 'domestic' // Override automatic detection
  customBufferMinutes?: number // Custom buffer time override
}

interface LandingTimeResponse {
  // Input information
  scheduledArrival: {
    date: string
    time: string
    datetime: string
  }
  
  // Calculated landing time (arrival + buffer)
  estimatedLandingTime: {
    date: string
    time: string  
    datetime: string
  }
  
  // Buffer calculation details
  bufferCalculation: {
    bufferMinutes: number
    bufferReason: string
    airportClassification?: {
      departureAirport?: string
      arrivalAirport?: string
      flightType: 'international' | 'domestic'
      airportSize: string
    }
  }
  
  // Practical pickup time recommendation
  recommendedPickupTime: {
    date: string
    time: string
    datetime: string
    pickupBufferMinutes: number // Additional buffer for pickup coordination
  }
}

function getAirportClassification(airportCode: string) {
  return AIRPORT_CLASSIFICATIONS[airportCode.toUpperCase()] || null
}

function determineFlightType(departureAirport?: string, arrivalAirport?: string): 'international' | 'domestic' {
  if (!departureAirport || !arrivalAirport) {
    return 'international' // Default to international for unknown routes
  }
  
  // Brazilian airport codes for domestic determination
  const brazilianAirports = ['GRU', 'GIG', 'BSB', 'CGH', 'SDU', 'SSA', 'FOR', 'REC', 'BEL', 'MAO']
  
  const departureIsBrazilian = brazilianAirports.includes(departureAirport.toUpperCase())
  const arrivalIsBrazilian = brazilianAirports.includes(arrivalAirport.toUpperCase())
  
  // If both airports are Brazilian, it's domestic
  if (departureIsBrazilian && arrivalIsBrazilian) {
    return 'domestic'
  }
  
  return 'international'
}

function calculateBufferTime(
  departureAirport?: string,
  arrivalAirport?: string,
  flightTypeOverride?: 'international' | 'domestic',
  customBufferMinutes?: number
): { bufferMinutes: number; bufferReason: string; airportClassification?: any } {
  
  // Use custom buffer if provided
  if (customBufferMinutes && customBufferMinutes > 0) {
    return {
      bufferMinutes: customBufferMinutes,
      bufferReason: `Custom buffer time specified: ${customBufferMinutes} minutes`
    }
  }
  
  // Determine flight type
  const flightType = flightTypeOverride || determineFlightType(departureAirport, arrivalAirport)
  
  // Get airport classification (prioritize arrival airport since that's where delay occurs)
  const arrivalClassification = arrivalAirport ? getAirportClassification(arrivalAirport) : null
  const departureClassification = departureAirport ? getAirportClassification(departureAirport) : null
  
  let classification = arrivalClassification || departureClassification
  
  // Use default if no classification found
  if (!classification) {
    classification = flightType === 'international' 
      ? AIRPORT_CLASSIFICATIONS.default_international 
      : AIRPORT_CLASSIFICATIONS.default_domestic
  }
  
  // Calculate buffer time based on classification
  const bufferMinutes = AIRPORT_BUFFER_TIMES[classification.type][classification.size]
  
  const airportClassification = {
    departureAirport,
    arrivalAirport,
    flightType,
    airportSize: classification.size
  }
  
  const bufferReason = `${flightType} flight buffer (${classification.size} ${classification.type} airport): ${bufferMinutes} minutes for customs/immigration/baggage`
  
  return {
    bufferMinutes,
    bufferReason,
    airportClassification
  }
}

function addMinutesToTime(dateStr: string, timeStr: string, minutesToAdd: number): { date: string; time: string; datetime: string } {
  // Parse the date and time
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  
  // Create date object
  const datetime = new Date(year, month - 1, day, hours, minutes)
  
  // Add minutes
  datetime.setMinutes(datetime.getMinutes() + minutesToAdd)
  
  // Format the result
  const resultDate = datetime.toISOString().split('T')[0]
  const resultTime = datetime.toTimeString().slice(0, 5) // HH:MM format
  const resultDatetime = datetime.toISOString()
  
  return {
    date: resultDate,
    time: resultTime,
    datetime: resultDatetime
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      arrivalTime, 
      arrivalDate, 
      departureAirport, 
      arrivalAirport, 
      flightType,
      customBufferMinutes 
    }: LandingTimeRequest = body

    // Validate required fields
    if (!arrivalTime || !arrivalDate) {
      return NextResponse.json(
        { error: 'arrivalTime and arrivalDate are required' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(arrivalTime)) {
      return NextResponse.json(
        { error: 'arrivalTime must be in HH:MM format (24-hour)' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(arrivalDate)) {
      return NextResponse.json(
        { error: 'arrivalDate must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    console.log('🛬 [LandingTime] Calculating landing time for:', {
      arrivalDate,
      arrivalTime,
      departureAirport,
      arrivalAirport,
      flightType,
      customBufferMinutes
    })

    // Calculate buffer time
    const bufferCalculation = calculateBufferTime(
      departureAirport,
      arrivalAirport,
      flightType,
      customBufferMinutes
    )

    // Create scheduled arrival datetime
    const scheduledArrival = {
      date: arrivalDate,
      time: arrivalTime,
      datetime: new Date(`${arrivalDate}T${arrivalTime}:00`).toISOString()
    }

    // Calculate estimated landing time (arrival + buffer)
    const estimatedLandingTime = addMinutesToTime(
      arrivalDate,
      arrivalTime,
      bufferCalculation.bufferMinutes
    )

    // Calculate recommended pickup time (landing + additional 15 minutes for coordination)
    const pickupBufferMinutes = 15
    const recommendedPickupTime = addMinutesToTime(
      estimatedLandingTime.date,
      estimatedLandingTime.time,
      pickupBufferMinutes
    )

    const response: LandingTimeResponse = {
      scheduledArrival,
      estimatedLandingTime,
      bufferCalculation,
      recommendedPickupTime: {
        ...recommendedPickupTime,
        pickupBufferMinutes
      }
    }

    console.log('✅ [LandingTime] Calculation successful:', {
      scheduledArrival: scheduledArrival.datetime,
      estimatedLanding: estimatedLandingTime.datetime,
      recommendedPickup: recommendedPickupTime.datetime,
      totalBuffer: bufferCalculation.bufferMinutes + pickupBufferMinutes
    })

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ [LandingTime] Calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error during landing time calculation' },
      { status: 500 }
    )
  }
}

// GET method for testing and documentation
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const arrivalTime = searchParams.get('arrivalTime')
  const arrivalDate = searchParams.get('arrivalDate')
  
  if (!arrivalTime || !arrivalDate) {
    return NextResponse.json(
      {
        message: 'Flight Landing Time Calculation API',
        description: 'Calculates estimated landing time and recommended pickup time based on flight arrival and airport buffer times',
        usage: 'POST /api/flights/landing-time',
        required_params: ['arrivalTime (HH:MM)', 'arrivalDate (YYYY-MM-DD)'],
        optional_params: [
          'departureAirport (airport code)',
          'arrivalAirport (airport code)', 
          'flightType (international|domestic)',
          'customBufferMinutes (number)'
        ],
        example_request: {
          arrivalTime: '14:30',
          arrivalDate: '2024-09-16', 
          departureAirport: 'JFK',
          arrivalAirport: 'GRU',
          flightType: 'international'
        },
        example_response: {
          scheduledArrival: {
            date: '2024-09-16',
            time: '14:30',
            datetime: '2024-09-16T14:30:00.000Z'
          },
          estimatedLandingTime: {
            date: '2024-09-16', 
            time: '16:00',
            datetime: '2024-09-16T16:00:00.000Z'
          },
          recommendedPickupTime: {
            date: '2024-09-16',
            time: '16:15', 
            datetime: '2024-09-16T16:15:00.000Z',
            pickupBufferMinutes: 15
          },
          bufferCalculation: {
            bufferMinutes: 90,
            bufferReason: 'international flight buffer (large international airport): 90 minutes for customs/immigration/baggage'
          }
        },
        airport_buffer_times: AIRPORT_BUFFER_TIMES,
        supported_airports: Object.keys(AIRPORT_CLASSIFICATIONS)
      },
      { status: 200 }
    )
  }

  // Handle GET request with query parameters (for testing)
  const departureAirport = searchParams.get('departureAirport') || undefined
  const arrivalAirport = searchParams.get('arrivalAirport') || undefined
  const flightType = searchParams.get('flightType') as 'international' | 'domestic' | undefined
  const customBufferMinutes = searchParams.get('customBufferMinutes') 
    ? parseInt(searchParams.get('customBufferMinutes')!, 10) 
    : undefined

  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({
      arrivalTime,
      arrivalDate,
      departureAirport,
      arrivalAirport,
      flightType,
      customBufferMinutes
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  }))
}