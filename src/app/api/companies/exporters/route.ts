import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get companies with exporter categories
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
      .or('category.eq.exporter,category.eq.producer,category.eq.cooperative,client_type.eq.exporter,client_type.eq.producer,client_type.eq.cooperative')
      .order('name')

    if (error) {
      console.error('Error fetching exporter companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch exporter companies', details: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend expectations
    const transformedCompanies = companies?.map(company => ({
      ...company,
      staff_list: company.users || [],
      staff_count: company.users?.length || 0,
      company_type: company.category || company.client_type || 'exporter'
    })) || []

    return NextResponse.json({ 
      companies: transformedCompanies,
      count: transformedCompanies.length,
      message: transformedCompanies.length === 0 
        ? 'No exporter/producer/cooperative companies found. Add companies to see them here.'
        : `Found ${transformedCompanies.length} exporter/producer companies`
    })
  } catch (error) {
    console.error('Error in exporters API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}