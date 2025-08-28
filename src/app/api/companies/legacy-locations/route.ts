import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const companyName = searchParams.get('company')
    const fantasyName = searchParams.get('fantasy')
    const searchQuery = searchParams.get('search') // Manual search query

    // If manual search query is provided, use it directly
    if (searchQuery && searchQuery.trim().length >= 2) {
      const cleanQuery = searchQuery.trim()
      
      const { data: searchResults, error } = await supabase
        .from('legacy_clients')
        .select(`
          legacy_client_id,
          descricao,
          descricao_fantasia,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          pais,
          cep,
          telefone1,
          email
        `)
        .or(`descricao.ilike.%${cleanQuery}%,descricao_fantasia.ilike.%${cleanQuery}%,endereco.ilike.%${cleanQuery}%,cidade.ilike.%${cleanQuery}%`)
        .eq('ativo', true)
        .order('descricao')
        .limit(20)

      if (error) {
        console.error('Error searching legacy locations:', error)
        return NextResponse.json({ error: 'Failed to search locations' }, { status: 500 })
      }

      const locations = searchResults?.map(formatLocationData) || []
      return NextResponse.json({ locations, count: locations.length })
    }

    // Auto-suggest mode - only for exact company matches
    if (!companyName && !fantasyName) {
      return NextResponse.json({ locations: [], count: 0 })
    }

    // For auto-suggestions, be more restrictive - only exact fantasy name matches
    let searchFilter = ''
    if (fantasyName) {
      // Only find exact matches or very close matches for the fantasy name
      searchFilter = `descricao_fantasia.ilike.${fantasyName}`
    } else if (companyName) {
      // Extract the core company name for exact matching
      const coreNames = companyName
        .replace(/LTDA|S\/A|S\.A\.|SA|LTDA\.|LTD|CORP|CORPORATION|INC|LIMITED/gi, '')
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 4) // Only significant words
      
      if (coreNames.length > 0) {
        searchFilter = coreNames.map(name => `descricao.ilike.%${name}%`).join(',')
      }
    }

    if (!searchFilter) {
      return NextResponse.json({ locations: [], count: 0 })
    }

    const { data: relatedCompanies, error } = await supabase
      .from('legacy_clients')
      .select(`
        legacy_client_id,
        descricao,
        descricao_fantasia,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        pais,
        cep,
        telefone1,
        email
      `)
      .or(searchFilter)
      .eq('ativo', true)
      .order('descricao')
      .limit(10) // Limit auto-suggestions

    if (error) {
      console.error('Error fetching related legacy locations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch related locations' },
        { status: 500 }
      )
    }

    // Format locations for frontend
    const locations = relatedCompanies?.map(formatLocationData) || []

    return NextResponse.json({ 
      locations,
      count: locations.length 
    })

  } catch (error) {
    console.error('Error in legacy locations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to format location data
function formatLocationData(company: any) {
  return {
    id: company.legacy_client_id,
    name: company.descricao_fantasia || company.descricao,
    fullName: company.descricao,
    address: {
      street: company.endereco,
      number: company.numero,
      complement: company.complemento,
      neighborhood: company.bairro,
      city: company.cidade,
      state: company.uf,
      country: company.pais || 'Brasil',
      postalCode: company.cep
    },
    fullAddress: [
      company.endereco,
      company.numero,
      company.complemento,
      company.bairro,
      company.cidade,
      company.uf
    ].filter(Boolean).join(', '),
    contacts: {
      phone: company.telefone1,
      email: company.email
    }
  }
}