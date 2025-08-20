import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const types = searchParams.get('types')
    const category = searchParams.get('category')
    const active = searchParams.get('active')
    const sortBy = searchParams.get('sort') || 'name'
    const sortOrder = searchParams.get('order') || 'asc'

    // Build query
    let query = supabase
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

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,fantasy_name.ilike.%${search}%`)
    }

    if (types) {
      const typeArray = types.split(',')
      query = query.in('client_type', typeArray)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (active !== null) {
      // Assuming active companies are those with recent activity or staff
      // This logic can be adjusted based on business requirements
      if (active === 'true') {
        query = query.not('id', 'is', null) // Get all companies for now
      }
    }

    // Apply sorting
    const orderColumn = sortBy === 'name' ? 'name' : 
                        sortBy === 'created' ? 'created_at' : 
                        sortBy === 'staff_count' ? 'staff_count' : 'name'
    
    query = query.order(orderColumn, { ascending: sortOrder === 'asc', nullsFirst: false })

    const { data: companies, error } = await query

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies', details: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend expectations
    const transformedCompanies = companies?.map(company => ({
      ...company,
      staff_list: company.users || [],
      staff_count: company.users?.length || 0
    })) || []

    return NextResponse.json({ companies: transformedCompanies })
  } catch (error) {
    console.error('Error in companies API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const body = await request.json()
    
    // Remove fields that shouldn't be set on creation
    const { id, created_at, updated_at, staff_count, ...companyData } = body
    
    const { data, error } = await supabase
      .from('companies')
      .insert([companyData])
      .select()
      .single()

    if (error) {
      console.error('Error creating company:', error)
      return NextResponse.json(
        { error: 'Failed to create company', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in create company API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}