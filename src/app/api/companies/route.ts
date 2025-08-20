import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Company } from '@/types/company'

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
    const active = searchParams.get('active')
    const recentTrips = searchParams.get('recent_trips')
    const minTrips = searchParams.get('min_trips')
    const maxTrips = searchParams.get('max_trips')
    const tags = searchParams.get('tags')
    const certs = searchParams.get('certs')
    const sortBy = searchParams.get('sort') || 'name'
    const sortOrder = searchParams.get('order') || 'asc'

    // Build query
    let query = supabase
      .from('companies')
      .select(`
        *,
        company_locations!company_locations_company_id_fkey (
          id,
          location_name,
          city,
          country,
          is_primary_location
        )
      `)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,primary_contact_name.ilike.%${search}%`)
    }

    if (types) {
      const typeArray = types.split(',')
      query = query.in('company_type', typeArray)
    }

    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    if (recentTrips === 'true') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      query = query.gte('last_visit_date', thirtyDaysAgo.toISOString())
    }

    if (minTrips) {
      query = query.gte('trip_count', parseInt(minTrips))
    }

    if (maxTrips) {
      query = query.lte('trip_count', parseInt(maxTrips))
    }

    if (tags) {
      const tagArray = tags.split(',')
      query = query.contains('tags', tagArray)
    }

    if (certs) {
      const certArray = certs.split(',')
      query = query.contains('industry_certifications', certArray)
    }

    // Apply sorting
    const orderColumn = sortBy === 'last_visit' ? 'last_visit_date' : 
                        sortBy === 'trip_count' ? 'trip_count' :
                        sortBy === 'total_cost' ? 'total_cost_usd' : 'name'
    
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
      primary_location: company.company_locations?.find((loc: any) => loc.is_primary_location) || null,
      staff_count: 0, // TODO: Add staff count from company_staff table
      document_count: 0 // TODO: Add document count from company_documents table
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
    const { id, created_at, updated_at, trip_count, total_cost_usd, last_visit_date, ...companyData } = body
    
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