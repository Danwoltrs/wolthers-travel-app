import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_locations!company_locations_company_id_fkey (
          id,
          location_name,
          address_line_1,
          address_line_2,
          city,
          state_province,
          postal_code,
          country,
          location_type,
          is_primary_location,
          is_meeting_location,
          phone,
          email,
          contact_person,
          latitude,
          longitude,
          notes
        ),
        company_staff!company_staff_company_id_fkey (
          id,
          full_name,
          email,
          phone,
          whatsapp,
          position,
          department,
          role_type,
          is_primary_contact,
          is_decision_maker,
          is_active
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching company:', error)
      return NextResponse.json(
        { error: 'Failed to fetch company', details: error.message },
        { status: 500 }
      )
    }

    // Get statistics
    const { data: statistics, error: statsError } = await supabase
      .from('company_statistics')
      .select('*')
      .eq('company_id', params.id)
      .eq('period_type', 'all_time')
      .single()

    // Get recent documents
    const { data: documents, error: docsError } = await supabase
      .from('company_documents')
      .select('*')
      .eq('company_id', params.id)
      .eq('is_folder', false)
      .order('created_at', { ascending: false })
      .limit(10)

    const companyDetail = {
      ...company,
      locations: company.company_locations || [],
      staff: company.company_staff || [],
      statistics: statistics ? [statistics] : [],
      recent_documents: documents || []
    }

    return NextResponse.json(companyDetail)
  } catch (error) {
    console.error('Error in company detail API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await request.json()
    
    // Remove fields that shouldn't be updated
    const { id, created_at, trip_count, total_cost_usd, last_visit_date, ...updateData } = body
    
    // Set updated_at
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }
      
      console.error('Error updating company:', error)
      return NextResponse.json(
        { error: 'Failed to update company', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in update company API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', params.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }
      
      console.error('Error deleting company:', error)
      return NextResponse.json(
        { error: 'Failed to delete company', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error in delete company API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}