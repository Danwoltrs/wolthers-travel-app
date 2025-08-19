import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let query = supabase
      .from('companies')
      .select(`
        id,
        name,
        company_type,
        email,
        phone,
        address,
        website,
        total_staff:users(count)
      `)

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%, company_type.ilike.%${search}%`)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)
    query = query.order('name', { ascending: true })

    const { data: companies, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
    }

    // Transform the data to include staff count properly
    const companiesWithStaffCount = companies?.map(company => ({
      ...company,
      company_name: company.name, // Map name to company_name for frontend consistency
      total_staff: company.total_staff?.[0]?.count || 0
    })) || []

    return NextResponse.json({
      companies: companiesWithStaffCount,
      total: count,
      pagination: {
        offset,
        limit,
        hasMore: count ? count > offset + limit : false
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}