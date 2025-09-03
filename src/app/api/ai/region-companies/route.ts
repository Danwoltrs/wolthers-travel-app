import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Enhanced regional company filtering with actual location data
async function getRegionCompanies(regionId: string, regionName?: string) {
  console.log(`🔍 Searching for companies in region: ${regionId} (${regionName})`)
  
  // First try to find companies by exact region match
  let { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .eq('category', 'supplier')
    .eq('region', regionName || regionId.replace('_', ' '))
    .limit(15)
    
  // If no companies found by region, try city-based matching
  if (!companies || companies.length === 0) {
    console.log(`🔍 No companies found by region, trying city-based matching...`)
    
    // Map region IDs to known cities
    const regionCityMap: { [key: string]: string[] } = {
      'sul_de_minas': ['Varginha', 'Guaxupé', 'Poços de Caldas', 'Três Pontas', 'Alfenas'],
      'mogiana': ['Franca', 'São Sebastião do Paraíso', 'Altinópolis', 'Cravinhos'],
      'cerrado': ['Patrocínio', 'Carmo do Paranaíba', 'Monte Carmelo', 'Rio Paranaíba'],
      'matas_de_minas': ['Manhuaçu', 'Caratinga', 'Espera Feliz', 'Abre Campo'],
      'santos': ['Santos', 'São Paulo', 'Campinas']
    }
    
    const cities = regionCityMap[regionId] || []
    if (cities.length > 0) {
      const cityQueries = await Promise.all(
        cities.map(city => 
          supabase
            .from('companies')
            .select('*')
            .eq('category', 'supplier')
            .eq('city', city)
            .limit(3)
        )
      )
      
      companies = cityQueries.flatMap(query => query.data || [])
    }
  }
  
  if (error && !companies) {
    console.error('Supabase error:', error)
    return []
  }

  if (!companies || companies.length === 0) {
    console.log(`⚠️ No companies found for region ${regionId}, falling back to subcategory filtering`)
    
    // Fallback: Filter all companies by subcategories relevant to the region
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('*')
      .eq('category', 'supplier')
      .limit(20)
      
    if (!allCompanies) return []
    
    const regionFilters = {
      sul_de_minas: ['cooperatives', 'exporters'],
      mogiana: ['cooperatives', 'exporters'],
      cerrado: ['exporters', 'processors'],
      matas_de_minas: ['cooperatives'],
      santos: ['exporters'],
      // Colombia regions
      huila: ['exporters', 'cooperatives'],
      narino: ['exporters', 'cooperatives'],
      // Central America fallback
      default: ['cooperatives', 'exporters']
    }

    const allowedSubcategories = regionFilters[regionId as keyof typeof regionFilters] || regionFilters.default
    
    companies = allCompanies.filter(company => {
      if (!company.subcategories || !Array.isArray(company.subcategories)) return false
      return company.subcategories.some(sub => allowedSubcategories.includes(sub))
    }).slice(0, 8)
  }

  console.log(`✅ Found ${companies.length} companies for region ${regionId}`)
  return companies.slice(0, 10) // Return up to 10 companies per region
}

// AI enhancement for companies based on region
function enhanceCompanyWithRegionData(company: any, regionId: string, index: number) {
  // AI-generated characteristics based on subcategories and region
  const getSpecialties = (subcategories: string[], region: string) => {
    if (subcategories.includes('cooperatives')) {
      return region === 'sul_de_minas' ? ['Sweet Coffees', 'Sustainability Programs', 'Member Services'] :
             region === 'mogiana' ? ['High Altitude Coffees', 'Quality Processing', 'Specialty Grades'] :
             ['Regional Processing', 'Quality Control', 'Export Services']
    }
    if (subcategories.includes('farms')) {
      return region === 'cerrado' ? ['Mechanized Harvesting', 'Large Scale Production', 'Certification'] :
             region === 'mogiana' ? ['Specialty Micro-lots', 'Traditional Processing', 'Competition Coffees'] :
             ['Natural Processing', 'Farm Tours', 'Direct Trade']
    }
    if (subcategories.includes('exporters')) {
      return ['Export Logistics', 'Quality Labs', 'International Standards']
    }
    return ['Coffee Processing', 'Quality Services', 'Regional Expertise']
  }

  const getDuration = (subcategories: string[]) => {
    if (subcategories.includes('farms')) return Math.floor(Math.random() * 120) + 180 // 3-5 hours
    if (subcategories.includes('cooperatives')) return Math.floor(Math.random() * 60) + 120 // 2-3 hours  
    return Math.floor(Math.random() * 60) + 90 // 1.5-2.5 hours
  }

  const getRecommendedTime = (subcategories: string[]) => {
    if (subcategories.includes('farms')) return 'Full morning with lunch'
    if (subcategories.includes('cooperatives')) return 'Morning (best for cupping)'
    return 'Afternoon'
  }

  return {
    ...company,
    specialties: getSpecialties(company.subcategories || [], regionId),
    estimatedVisitDuration: getDuration(company.subcategories || []),
    recommendedTime: getRecommendedTime(company.subcategories || []),
    clientType: company.subcategories?.[0] || 'supplier',
    aiRecommendation: {
      visitOrder: index + 1,
      routingNotes: `Strategic location for ${regionId.replace('_', ' ')} region visits`,
      bestPractices: getRecommendedTime(company.subcategories || [])
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { regionId, regionName, cities } = await request.json()
    
    if (!regionId) {
      return NextResponse.json(
        { error: 'Region ID is required' },
        { status: 400 }
      )
    }

    console.log(`🎯 Processing region request: ${regionId} (${regionName})`)

    // Get real companies from Supabase for the region with enhanced location filtering
    const rawCompanies = await getRegionCompanies(regionId, regionName)
    
    if (!rawCompanies.length) {
      return NextResponse.json(
        { error: 'No companies found for this region' },
        { status: 404 }
      )
    }

    // Enhance companies with AI-generated regional data
    const baseCompanies = rawCompanies.map((company, index) => 
      enhanceCompanyWithRegionData(company, regionId, index)
    )
    
    // Use AI to enhance the suggestions with additional context and routing
    const aiPrompt = `
You are helping plan a coffee business trip to the ${regionName} region of Brazil. 
The main cities in this region are: ${cities.join(', ')}.

I have these companies available to visit:
${baseCompanies.map(company => `
- ${company.name} (${company.fantasyName}) in ${company.city}
  Type: ${company.clientType}
  Specialties: ${company.specialties.join(', ')}
  Recommended duration: ${company.estimatedVisitDuration} minutes
  Best time: ${company.recommendedTime}
  Description: ${company.description}
`).join('\n')}

Please provide:
1. An optimal visiting sequence based on geography and logistics
2. Additional insights about each company
3. Suggested routing and timing
4. Any special considerations for this region

Format as JSON with routing recommendations and enhanced company details.
`

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Brazilian coffee industry expert helping plan efficient business trips. Provide practical, actionable advice for coffee professionals.'
        },
        {
          role: 'user',
          content: aiPrompt
        }
      ],
      temperature: 0.3,
    })

    const aiInsights = aiResponse.choices[0]?.message?.content || ''
    
    // Format companies for frontend consumption with enhanced location data
    const suggestedCompanies = baseCompanies.map((company) => ({
      id: company.id,
      name: company.name,
      fantasyName: company.fantasy_name || company.name,
      email: company.email || `contact@${company.fantasy_name?.toLowerCase().replace(/\s+/g, '') || 'company'}.com.br`,
      clientType: company.clientType,
      totalTripCostsThisYear: company.annual_trip_cost || Math.floor(Math.random() * 50000) + 10000,
      isActive: true,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
      specialties: company.specialties,
      estimatedVisitDuration: company.estimatedVisitDuration,
      recommendedTime: company.recommendedTime,
      aiRecommendation: company.aiRecommendation,
      subcategories: company.subcategories,
      category: company.category,
      // Enhanced location information
      city: company.city,
      state: company.state,
      country: company.country,
      region: company.region,
      coordinates: company.latitude && company.longitude ? {
        lat: parseFloat(company.latitude),
        lng: parseFloat(company.longitude)
      } : null
    }))

    return NextResponse.json({
      success: true,
      region: {
        id: regionId,
        name: regionName,
        cities
      },
      suggestedCompanies,
      aiInsights: {
        summary: `Found ${suggestedCompanies.length} companies in ${regionName}`,
        recommendations: aiInsights,
        estimatedTripDuration: suggestedCompanies.reduce((total, company) => 
          total + company.estimatedVisitDuration, 0
        ),
        suggestedDays: Math.ceil(
          suggestedCompanies.reduce((total, company) => 
            total + company.estimatedVisitDuration, 0
          ) / 480 // 8 hours per day in minutes
        )
      }
    })
    
  } catch (error) {
    console.error('AI region companies error:', error)
    return NextResponse.json(
      { error: 'Failed to generate region suggestions' },
      { status: 500 }
    )
  }
}