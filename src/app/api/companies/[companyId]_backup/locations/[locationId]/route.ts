import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/companies/[companyId]/locations/[locationId]
export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string; locationId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: location, error } = await supabase
      .from('company_locations')
      .select('*')
      .eq('company_id', params.companyId)
      .eq('id', params.locationId)
      .single()

    if (error) {
      console.error('Error fetching location:', error)
      return NextResponse.json(
        { error: 'Location not found', details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({ location })

  } catch (error) {
    console.error('Error in location GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/companies/[companyId]/locations/[locationId]
export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string; locationId: string } }
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
        .neq('id', params.locationId) // Don't update the current location yet
    }

    const { data: updatedLocation, error } = await supabase
      .from('company_locations')
      .update({
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
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', params.companyId)
      .eq('id', params.locationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating location:', error)
      return NextResponse.json(
        { error: 'Failed to update location', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      location: updatedLocation,
      message: 'Location updated successfully'
    })

  } catch (error) {
    console.error('Error in location PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[companyId]/locations/[locationId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { companyId: string; locationId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if this is a headquarters location
    const { data: location, error: fetchError } = await supabase
      .from('company_locations')
      .select('is_headquarters')
      .eq('company_id', params.companyId)
      .eq('id', params.locationId)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    if (location.is_headquarters) {
      return NextResponse.json(
        { error: 'Cannot delete headquarters location. Please designate another location as headquarters first.' },
        { status: 400 }
      )
    }

    // Soft delete by marking as inactive
    const { error } = await supabase
      .from('company_locations')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('company_id', params.companyId)
      .eq('id', params.locationId)

    if (error) {
      console.error('Error deleting location:', error)
      return NextResponse.json(
        { error: 'Failed to delete location', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    })

  } catch (error) {
    console.error('Error in location DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}