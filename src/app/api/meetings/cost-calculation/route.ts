import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface CostCalculationRequest {
  eventType: 'flight' | 'hotel' | 'meeting' | 'business_meeting' | 'presentation' | 'lunch' | 'dinner'
  participants: Array<{
    id: string
    name: string
    type: 'wolthers_staff' | 'client' | 'external'
  }>
  costBreakdown: {
    [participantId: string]: {
      meals?: number
      transport?: number
      entertainment?: number
      materials?: number
      accommodation?: number
      other?: number
    }
  }
  currency?: string
  notes?: string
}

interface CostCalculationResponse {
  success: boolean
  calculation: {
    totalCost: number
    currency: string
    participantBreakdown: {
      [participantId: string]: {
        participantName: string
        participantType: string
        totalCost: number
        breakdown: {
          meals: number
          transport: number
          entertainment: number
          materials: number
          accommodation: number
          other: number
        }
      }
    }
    costByCategory: {
      meals: number
      transport: number
      entertainment: number
      materials: number
      accommodation: number
      other: number
    }
    participantCount: number
    averageCostPerParticipant: number
  }
  formattedForDatabase: {
    cost_per_person: any
    cost_breakdown: any
    total_estimated_cost: number
    cost_currency: string
  }
}

export async function POST(request: NextRequest) {
  console.log('💰 Meeting cost calculation API called')
  
  try {
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let user = null
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

    try {
      const decoded = verify(token, secret) as any
      const supabase = createServerSupabaseClient()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (!userError && userData) {
        user = userData
      }
    } catch (jwtError) {
      // Try Supabase session authentication
      const supabaseClient = createServerSupabaseClient()
      
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

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CostCalculationRequest = await request.json()
    const { eventType, participants, costBreakdown, currency = 'USD', notes } = body

    if (!eventType || !participants || !costBreakdown) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, participants, costBreakdown' },
        { status: 400 }
      )
    }

    console.log(`👤 User ${user.email} calculating costs for ${eventType} with ${participants.length} participants`)

    // Initialize calculation result
    let totalCost = 0
    const participantBreakdown: any = {}
    const costByCategory = {
      meals: 0,
      transport: 0,
      entertainment: 0,
      materials: 0,
      accommodation: 0,
      other: 0
    }

    // Process each participant's costs
    for (const participant of participants) {
      const participantCosts = costBreakdown[participant.id] || {}
      
      const participantTotal = Object.values(participantCosts).reduce((sum, cost) => sum + (cost || 0), 0)
      totalCost += participantTotal

      // Update category totals
      Object.keys(costByCategory).forEach(category => {
        const categoryKey = category as keyof typeof costByCategory
        costByCategory[categoryKey] += participantCosts[categoryKey] || 0
      })

      // Build participant breakdown
      participantBreakdown[participant.id] = {
        participantName: participant.name,
        participantType: participant.type,
        totalCost: participantTotal,
        breakdown: {
          meals: participantCosts.meals || 0,
          transport: participantCosts.transport || 0,
          entertainment: participantCosts.entertainment || 0,
          materials: participantCosts.materials || 0,
          accommodation: participantCosts.accommodation || 0,
          other: participantCosts.other || 0
        }
      }
    }

    const averageCostPerParticipant = participants.length > 0 ? totalCost / participants.length : 0

    // Format for database storage
    const costPerPersonFormatted: any = {}
    for (const participant of participants) {
      const participantCosts = costBreakdown[participant.id] || {}
      costPerPersonFormatted[participant.id] = {
        name: participant.name,
        type: participant.type,
        ...participantCosts
      }
    }

    const costBreakdownFormatted = {
      event_type: eventType,
      currency: currency,
      notes: notes,
      calculation_timestamp: new Date().toISOString(),
      calculated_by: user.id,
      category_totals: costByCategory,
      participant_count: participants.length,
      average_per_participant: averageCostPerParticipant
    }

    const response: CostCalculationResponse = {
      success: true,
      calculation: {
        totalCost,
        currency,
        participantBreakdown,
        costByCategory,
        participantCount: participants.length,
        averageCostPerParticipant
      },
      formattedForDatabase: {
        cost_per_person: costPerPersonFormatted,
        cost_breakdown: costBreakdownFormatted,
        total_estimated_cost: totalCost,
        cost_currency: currency
      }
    }

    console.log(`✅ Cost calculation completed: $${totalCost} ${currency} for ${participants.length} participants`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('🚨 Cost calculation API error:', error)
    
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}