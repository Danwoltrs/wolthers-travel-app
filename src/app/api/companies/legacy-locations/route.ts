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

    if (!companyName && !fantasyName) {
      return NextResponse.json(
        { error: 'Company name or fantasy name is required' },
        { status: 400 }
      )
    }

    // Search for related companies by similar names
    let searchTerms: string[] = []
    
    if (companyName) {
      // Extract key words from company name for broader search
      const cleanName = companyName
        .replace(/LTDA|S\/A|S\.A\.|SA|LTDA\.|LTD|CORP|CORPORATION|INC|LIMITED/gi, '')
        .trim()
      
      // Split and get meaningful words (longer than 3 characters)
      const words = cleanName.split(/\s+/).filter(word => word.length > 3)
      searchTerms.push(...words)
    }
    
    if (fantasyName) {
      searchTerms.push(fantasyName)
    }

    // Remove duplicates and create search patterns
    const uniqueTerms = [...new Set(searchTerms)]
    const searchPatterns = uniqueTerms.map(term => `descricao.ilike.%${term}%,descricao_fantasia.ilike.%${term}%`)
    const searchQuery = searchPatterns.join(',')

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
      .or(searchQuery)
      .eq('ativo', true)
      .order('descricao')

    if (error) {
      console.error('Error fetching related legacy locations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch related locations' },
        { status: 500 }
      )
    }

    // Format locations for frontend
    const locations = relatedCompanies?.map(company => ({
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
    })) || []

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