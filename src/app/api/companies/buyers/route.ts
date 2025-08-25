import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get companies with buyer categories created in this webapp (no legacy_client_id)
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        users!users_company_id_fkey (
          id,
          full_name,
          email,
          user_type
        ),
        company_locations (
          id,
          name,
          is_headquarters,
          address_line1,
          address_line2,
          city,
          state_province,
          country,
          postal_code,
          phone,
          email,
          contact_person,
          is_active
        )
      `)
      .eq('category', 'buyer')
      .is('legacy_client_id', null) // Only show companies created in this webapp
      .order('name')

    if (error) {
      console.error('Error fetching buyer companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch buyer companies', details: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend expectations
    const transformedCompanies = companies?.map(company => ({
      ...company,
      staff_list: company.users || [],
      staff_count: company.users?.length || 0,
      company_type: company.category || company.client_type || 'buyer',
      locations: company.company_locations?.filter(loc => loc.is_active) || []
    })) || []

    return NextResponse.json({ 
      companies: transformedCompanies,
      count: transformedCompanies.length,
      message: transformedCompanies.length === 0 
        ? 'No buyer companies found. Add companies to see them here.'
        : `Found ${transformedCompanies.length} buyer companies`
    })
  } catch (error) {
    console.error('Error in buyers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}