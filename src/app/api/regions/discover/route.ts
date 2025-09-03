import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get all unique regions from companies table
    const { data: regions, error } = await supabase
      .from('companies')
      .select('region, country, city, state')
      .eq('category', 'supplier')
      .not('region', 'is', null)
      .not('country', 'is', null)

    if (error) {
      console.error('Failed to fetch regions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch regions' },
        { status: 500 }
      )
    }

    // Group regions by country and create dynamic region objects
    const regionMap = new Map()
    
    regions?.forEach((company) => {
      const regionKey = `${company.region.toLowerCase().replace(/\s+/g, '_')}_${company.country.toLowerCase()}`
      
      if (!regionMap.has(regionKey)) {
        // Get company count for this region
        regionMap.set(regionKey, {
          id: regionKey,
          name: company.region,
          country: company.country,
          state: company.state,
          cities: new Set([company.city]),
          companiesCount: 1,
          description: `Coffee region in ${company.country}`,
          characteristics: getRegionCharacteristics(company.region, company.country)
        })
      } else {
        const existingRegion = regionMap.get(regionKey)
        existingRegion.cities.add(company.city)
        existingRegion.companiesCount++
      }
    })

    // Convert to array and format for frontend
    const dynamicRegions = Array.from(regionMap.values()).map(region => ({
      ...region,
      mainCities: Array.from(region.cities).slice(0, 5), // Limit to 5 cities
      estimatedCompanies: region.companiesCount,
      cities: undefined // Remove the Set object
    }))

    console.log(`Discovered ${dynamicRegions.length} dynamic regions`)

    return NextResponse.json({
      success: true,
      dynamicRegions,
      totalRegions: dynamicRegions.length
    })

  } catch (error) {
    console.error('Region discovery error:', error)
    return NextResponse.json(
      { error: 'Failed to discover regions' },
      { status: 500 }
    )
  }
}

// Helper function to provide region-specific characteristics
function getRegionCharacteristics(region: string, country: string): string {
  const regionLower = region.toLowerCase()
  
  // Brazil-specific regions
  if (country === 'Brazil') {
    if (regionLower.includes('sul de minas')) {
      return 'Sweet coffees, cooperatives, traditional processing'
    }
    if (regionLower.includes('mogiana')) {
      return 'High altitude, specialty coffees, family farms'
    }
    if (regionLower.includes('cerrado')) {
      return 'Large farms, mechanization, certified coffees'
    }
    if (regionLower.includes('matas de minas')) {
      return 'Mountain coffees, natural processing, small producers'
    }
    if (regionLower.includes('santos')) {
      return 'Export services, logistics, port facilities'
    }
    return 'Brazilian coffee region with diverse processing methods'
  }
  
  // Colombia-specific regions
  if (country === 'Colombia') {
    if (regionLower.includes('huila')) {
      return 'High altitude, washed processing, fruity profiles'
    }
    if (regionLower.includes('nariño')) {
      return 'Extreme altitude, complex acidity, unique terroir'
    }
    if (regionLower.includes('tolima')) {
      return 'Diverse microclimates, specialty processing'
    }
    if (regionLower.includes('cauca')) {
      return 'High altitude, indigenous communities, specialty focus'
    }
    return 'Colombian coffee region known for high quality arabica'
  }
  
  // Central America regions
  const centralAmericaCountries = ['Guatemala', 'Honduras', 'Costa Rica', 'Nicaragua', 'El Salvador', 'Panama']
  if (centralAmericaCountries.includes(country)) {
    return `${country} coffee region with distinct terroir and processing methods`
  }
  
  return `Coffee region known for unique characteristics and quality`
}