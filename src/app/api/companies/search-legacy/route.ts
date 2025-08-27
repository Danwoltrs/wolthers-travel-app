import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = query.trim().toLowerCase()

    // Search legacy clients table for matching companies
    const { data: legacyResults, error } = await supabase
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
        telefone2,
        email,
        email_contratos,
        pessoa,
        grupo1,
        grupo2,
        ativo
      `)
      .or(`descricao.ilike.%${searchTerm}%,descricao_fantasia.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%,grupo1.ilike.%${searchTerm}%,grupo2.ilike.%${searchTerm}%`)
      .eq('ativo', true)
      .order('descricao')
      .limit(limit)

    if (error) {
      console.error('Legacy search error:', error)
      return NextResponse.json(
        { error: 'Failed to search legacy companies' },
        { status: 500 }
      )
    }

    // Format results for frontend
    const results = legacyResults?.map(company => ({
      id: company.legacy_client_id,
      name: company.descricao,
      fantasyName: company.descricao_fantasia,
      city: company.cidade,
      state: company.uf,
      country: company.pais || 'Brasil',
      businessType: company.pessoa,
      group1: company.grupo1,
      group2: company.grupo2,
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
      contacts: {
        phone1: company.telefone1,
        phone2: company.telefone2,
        email: company.email,
        contractEmail: company.email_contratos
      },
      // Full address string for display
      fullAddress: [
        company.endereco,
        company.numero,
        company.bairro,
        company.cidade,
        company.uf
      ].filter(Boolean).join(', '),
      // Display name with fantasy name if available
      displayName: company.descricao_fantasia 
        ? `${company.descricao_fantasia} (${company.descricao})`
        : company.descricao,
      // Location info for display
      location: [company.cidade, company.uf].filter(Boolean).join(', ')
    })) || []

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Legacy company search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}