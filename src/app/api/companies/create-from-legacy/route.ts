import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface CreateFromLegacyRequest {
  legacyClientId: number
  pic?: {
    name: string
    email: string
    whatsapp: string
    title: string
  }
  additionalLocations?: Array<{
    name: string
    address: string
    isHeadquarters?: boolean
  }>
  companyOverrides?: {
    name?: string
    fantasyName?: string
    category?: string
    subcategories?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body: CreateFromLegacyRequest = await request.json()
    
    const { legacyClientId, pic, additionalLocations, companyOverrides } = body

    if (!legacyClientId) {
      return NextResponse.json(
        { error: 'Legacy client ID is required' },
        { status: 400 }
      )
    }

    // Fetch legacy client data
    const { data: legacyClient, error: legacyError } = await supabase
      .from('legacy_clients')
      .select('*')
      .eq('legacy_client_id', legacyClientId)
      .eq('ativo', true)
      .single()

    if (legacyError || !legacyClient) {
      return NextResponse.json(
        { error: 'Legacy client not found' },
        { status: 404 }
      )
    }

    // Check if company already exists with this legacy ID
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name')
      .eq('legacy_client_id', legacyClientId)
      .single()

    if (existingCompany) {
      return NextResponse.json(
        { 
          error: 'Company already exists',
          existingCompany: existingCompany
        },
        { status: 409 }
      )
    }

    // Determine company category based on legacy data
    const category = determineCategory(legacyClient.grupo1, legacyClient.grupo2, legacyClient.pessoa)
    const subcategories = determineSubcategories(legacyClient.grupo1, legacyClient.grupo2)

    // Create new company
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: companyOverrides?.name || legacyClient.descricao,
        fantasy_name: companyOverrides?.fantasyName || legacyClient.descricao_fantasia || legacyClient.descricao,
        category: companyOverrides?.category || category,
        subcategories: companyOverrides?.subcategories || subcategories,
        legacy_client_id: legacyClientId,
        staff_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (companyError) {
      console.error('Error creating company:', companyError)
      return NextResponse.json(
        { error: 'Failed to create company', details: companyError.message },
        { status: 500 }
      )
    }

    // Geocode the main headquarters address
    const mainAddress = buildAddressString(legacyClient)
    let geocodedLocation = null

    if (mainAddress) {
      try {
        const geocodeResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/locations/geocode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: mainAddress })
        })

        if (geocodeResponse.ok) {
          geocodedLocation = await geocodeResponse.json()
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed, continuing without coordinates:', geocodeError)
      }
    }

    // Create headquarters location
    const { data: headquartersLocation, error: locationError } = await supabase
      .from('company_locations')
      .insert({
        company_id: newCompany.id,
        name: 'Sede Principal',
        is_headquarters: true,
        address_line1: legacyClient.endereco,
        address_line2: legacyClient.complemento,
        city: legacyClient.cidade,
        state_province: legacyClient.uf,
        country: legacyClient.pais || 'Brasil',
        postal_code: legacyClient.cep,
        cep: legacyClient.cep,
        phone: legacyClient.telefone1,
        email: legacyClient.email,
        contact_person: pic?.name || null,
        latitude: geocodedLocation?.latitude || null,
        longitude: geocodedLocation?.longitude || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (locationError) {
      console.error('Error creating headquarters location:', locationError)
      
      // Rollback company creation
      await supabase.from('companies').delete().eq('id', newCompany.id)
      
      return NextResponse.json(
        { error: 'Failed to create headquarters location', details: locationError.message },
        { status: 500 }
      )
    }

    // Create PIC record if provided
    let picRecord = null
    if (pic) {
      const { data: createdPic, error: picError } = await supabase
        .from('company_contacts')
        .insert({
          company_id: newCompany.id,
          name: pic.name,
          email: pic.email,
          phone: pic.whatsapp,
          title: pic.title,
          is_primary: true,
          contact_type: 'business',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (!picError) {
        picRecord = createdPic
      }
    }

    // Create additional locations if provided
    const additionalLocationRecords = []
    if (additionalLocations && additionalLocations.length > 0) {
      for (const location of additionalLocations) {
        try {
          // Geocode additional location
          let additionalGeocodedLocation = null
          const geocodeResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/locations/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: location.address })
          })

          if (geocodeResponse.ok) {
            additionalGeocodedLocation = await geocodeResponse.json()
          }

          const { data: additionalLocation } = await supabase
            .from('company_locations')
            .insert({
              company_id: newCompany.id,
              name: location.name,
              is_headquarters: location.isHeadquarters || false,
              address_line1: location.address,
              latitude: additionalGeocodedLocation?.latitude || null,
              longitude: additionalGeocodedLocation?.longitude || null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (additionalLocation) {
            additionalLocationRecords.push(additionalLocation)
          }
        } catch (error) {
          console.warn(`Failed to create additional location ${location.name}:`, error)
        }
      }
    }

    // Update legacy client to link with new company
    await supabase
      .from('legacy_clients')
      .update({ 
        company_id: newCompany.id,
        updated_at: new Date().toISOString()
      })
      .eq('legacy_client_id', legacyClientId)

    return NextResponse.json({
      success: true,
      company: {
        ...newCompany,
        locations: [headquartersLocation, ...additionalLocationRecords],
        pic: picRecord,
        legacyData: {
          businessType: legacyClient.pessoa,
          group1: legacyClient.grupo1,
          group2: legacyClient.grupo2,
          references: legacyClient.referencias,
          notes: legacyClient.obs
        }
      },
      message: 'Company created successfully from legacy data'
    })

  } catch (error) {
    console.error('Error in create-from-legacy API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildAddressString(legacyClient: any): string {
  return [
    legacyClient.endereco,
    legacyClient.numero,
    legacyClient.bairro,
    legacyClient.cidade,
    legacyClient.uf,
    legacyClient.pais || 'Brasil'
  ].filter(Boolean).join(', ')
}

function determineCategory(grupo1?: string, grupo2?: string, pessoa?: string): string {
  const group1Lower = grupo1?.toLowerCase() || ''
  const group2Lower = grupo2?.toLowerCase() || ''
  const pessoaLower = pessoa?.toLowerCase() || ''

  // Check for buyer indicators
  if (group1Lower.includes('roaster') || group2Lower.includes('roaster') ||
      group1Lower.includes('importer') || group2Lower.includes('importer')) {
    return 'buyer'
  }

  // Check for supplier indicators  
  if (group1Lower.includes('exporter') || group2Lower.includes('exporter') ||
      group1Lower.includes('coop') || group2Lower.includes('cooperative') ||
      group1Lower.includes('producer') || group2Lower.includes('producer')) {
    return 'supplier'
  }

  // Default to supplier for coffee supply chain
  return 'supplier'
}

function determineSubcategories(grupo1?: string, grupo2?: string): string[] {
  const subcategories: string[] = []
  const group1Lower = grupo1?.toLowerCase() || ''
  const group2Lower = grupo2?.toLowerCase() || ''

  // Check for buyer types (can be multiple)
  if (group1Lower.includes('roaster') || group2Lower.includes('roaster') || 
      group1Lower.includes('torref') || group2Lower.includes('torref')) {
    subcategories.push('roasters')
  }
  if (group1Lower.includes('importer') || group2Lower.includes('importer') ||
      group1Lower.includes('import') || group2Lower.includes('import')) {
    subcategories.push('importers')
  }

  // Check for supplier types (single selection)
  if (group1Lower.includes('exporter') || group2Lower.includes('exporter') ||
      group1Lower.includes('export') || group2Lower.includes('export')) {
    subcategories.push('exporters')
  }
  if (group1Lower.includes('coop') || group2Lower.includes('cooperative') ||
      group1Lower.includes('cooperat') || group2Lower.includes('cooperat')) {
    subcategories.push('cooperatives')
  }
  if (group1Lower.includes('producer') || group2Lower.includes('producer') ||
      group1Lower.includes('produtor') || group2Lower.includes('produtor') ||
      group1Lower.includes('fazend') || group2Lower.includes('fazend')) {
    subcategories.push('producers')
  }

  return subcategories.length > 0 ? subcategories : ['exporters']
}