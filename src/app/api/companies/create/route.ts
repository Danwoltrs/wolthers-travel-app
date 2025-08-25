import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    const { company, headquarters } = body
    
    // Validate required fields
    if (!company?.name || !headquarters?.address_line1 || !headquarters?.city || !headquarters?.country) {
      return NextResponse.json(
        { error: 'Missing required fields: company name, address, city, and country are required' },
        { status: 400 }
      )
    }

    // Validate subcategories
    if (!company?.subcategories || company.subcategories.length === 0) {
      return NextResponse.json(
        { error: 'At least one business/supplier type must be selected' },
        { status: 400 }
      )
    }

    // Start transaction by creating company first
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: company.name,
        fantasy_name: company.fantasy_name || company.name,
        category: company.category,
        subcategories: company.subcategories || [],
        legacy_client_id: company.legacy_company_id ? parseInt(company.legacy_company_id) : null,
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

    // Create headquarters location
    const { data: newLocation, error: locationError } = await supabase
      .from('company_locations')
      .insert({
        company_id: newCompany.id,
        name: headquarters.name || 'Head Office',
        is_headquarters: true,
        address_line1: headquarters.address_line1,
        address_line2: headquarters.address_line2 || null,
        city: headquarters.city,
        state_province: headquarters.state_province || null,
        country: headquarters.country,
        postal_code: headquarters.postal_code || null,
        phone: headquarters.phone || null,
        email: headquarters.email || null,
        contact_person: headquarters.contact_person || null,
        notes: headquarters.notes || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (locationError) {
      console.error('Error creating headquarters location:', locationError)
      
      // Rollback: delete the company since location creation failed
      await supabase
        .from('companies')
        .delete()
        .eq('id', newCompany.id)
      
      return NextResponse.json(
        { error: 'Failed to create headquarters location', details: locationError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: {
        ...newCompany,
        locations: [newLocation]
      },
      message: `${company.category === 'buyer' ? 'Buyer' : 'Supplier'} company created successfully`
    })

  } catch (error) {
    console.error('Error in create company API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}