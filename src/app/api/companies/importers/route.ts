import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get companies with importer categories
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        users!users_company_id_fkey (
          id,
          full_name,
          email,
          user_type
        )
      `)
      .or('category.eq.importer_roaster,category.eq.importer,client_type.eq.importer')
      .order('name')

    if (error) {
      console.error('Error fetching importer companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch importer companies', details: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend expectations
    const transformedCompanies = companies?.map(company => ({
      ...company,
      staff_list: company.users || [],
      staff_count: company.users?.length || 0,
      company_type: company.category || company.client_type || 'importer'
    })) || []

    return NextResponse.json({ 
      companies: transformedCompanies,
      count: transformedCompanies.length,
      message: transformedCompanies.length === 0 
        ? 'No importer companies found. Add companies to see them here.'
        : `Found ${transformedCompanies.length} importer companies`
    })
  } catch (error) {
    console.error('Error in importers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}