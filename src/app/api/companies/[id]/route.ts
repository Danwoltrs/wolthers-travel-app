import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resolvedParams = await params
    
    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        *,
        company_locations!company_locations_company_id_fkey (
          id,
          name,
          address_line1,
          address_line2,
          city,
          state_province,
          postal_code,
          country,
          is_headquarters,
          phone,
          email,
          contact_person,
          latitude,
          longitude,
          notes,
          is_active
        ),
        users!users_company_id_fkey (
          id,
          full_name,
          email,
          phone,
          whatsapp,
          user_type,
          last_login_at
        )
      `)
      .eq('id', resolvedParams.id)
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
      .eq('company_id', resolvedParams.id)
      .eq('period_type', 'all_time')
      .single()

    // Get recent documents
    const { data: documents, error: docsError } = await supabase
      .from('company_documents')
      .select('*')
      .eq('company_id', resolvedParams.id)
      .eq('is_folder', false)
      .order('created_at', { ascending: false })
      .limit(10)

    // Add computed is_active field for users/staff (all users are active by default)
    const staffWithStatus = company.users?.map(user => ({
      ...user,
      is_active: true, // All users are considered active since no deletion/ban system exists
    })) || []

    const companyDetail = {
      ...company,
      locations: company.company_locations || [],
      staff: staffWithStatus,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const resolvedParams = await params
    
    const body = await request.json()
    
    // Remove fields that shouldn't be updated
    const { id, created_at, trip_count, total_cost_usd, last_visit_date, ...updateData } = body
    
    // Set updated_at
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', resolvedParams.id)
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
      .eq('id', resolvedParams.id)

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