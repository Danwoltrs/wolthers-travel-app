import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/companies/[companyId]/locations
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: locations, error } = await supabase
      .from('company_locations')
      .select('*')
      .eq('company_id', params.companyId)
      .eq('is_active', true)
      .order('is_headquarters', { ascending: false })
      .order('name')

    if (error) {
      console.error('Error fetching locations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch locations', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      locations: locations || [],
      count: locations?.length || 0
    })

  } catch (error) {
    console.error('Error in locations GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/companies/[companyId]/locations
export async function POST(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.address_line1 || !body.city || !body.country) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address_line1, city, and country are required' },
        { status: 400 }
      )
    }

    // If this location is being set as headquarters, unset any existing headquarters
    if (body.is_headquarters) {
      await supabase
        .from('company_locations')
        .update({ is_headquarters: false })
        .eq('company_id', params.companyId)
        .eq('is_headquarters', true)
    }

    const { data: newLocation, error } = await supabase
      .from('company_locations')
      .insert({
        company_id: params.companyId,
        name: body.name,
        is_headquarters: body.is_headquarters || false,
        address_line1: body.address_line1,
        address_line2: body.address_line2 || null,
        city: body.city,
        state_province: body.state_province || null,
        country: body.country,
        postal_code: body.postal_code || null,
        phone: body.phone || null,
        email: body.email || null,
        contact_person: body.contact_person || null,
        notes: body.notes || null,
        is_active: true,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating location:', error)
      return NextResponse.json(
        { error: 'Failed to create location', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      location: newLocation,
      message: 'Location created successfully'
    })

  } catch (error) {
    console.error('Error in locations POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}