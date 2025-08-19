import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { companyId } = params
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get company staff
    const { data: staff, error, count } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        job_title,
        is_primary_contact,
        company_id,
        companies!inner(
          id,
          name
        )
      `)
      .eq('company_id', companyId)
      .eq('role', 'client') // Only include client users, not staff
      .range(offset, offset + limit - 1)
      .order('is_primary_contact', { ascending: false }) // Primary contacts first
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch company staff' },
        { status: 500 }
      )
    }

    // Transform the data to flatten company information
    const transformedStaff = staff?.map(member => ({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
      job_title: member.job_title,
      is_primary_contact: member.is_primary_contact || false,
      company_id: member.company_id,
      company_name: member.companies?.name || ''
    })) || []

    return NextResponse.json({
      staff: transformedStaff,
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