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
    const companyId = resolvedParams.id

    console.log(`[API] Fetching users for company ID: ${companyId}`)

    // First, verify the company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError) {
      console.error('Company not found:', companyError)
      return NextResponse.json(
        { error: 'Company not found', details: companyError.message },
        { status: 404 }
      )
    }

    console.log(`[API] Found company: ${company.name}`)

    // Fetch users for the specific company
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        user_type,
        last_login_at,
        created_at,
        company_id
      `)
      .eq('company_id', companyId)
      .order('full_name')

    if (error) {
      console.error('Error fetching company users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch company users', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[API] Found ${users?.length || 0} users for company ${company.name}`)

    // Add computed is_active field for each user (all users are active by default)
    const usersWithStatus = users?.map(user => ({
      ...user,
      is_active: true, // All users are considered active since no deletion/ban system exists
      last_login: user.last_login_at // Map to expected field name
    })) || []

    return NextResponse.json({
      users: usersWithStatus,
      staff: usersWithStatus, // Add staff field for compatibility with CompanyUsersManager
      count: usersWithStatus.length,
      companyName: company.name,
      message: usersWithStatus.length === 0 
        ? `No users found for ${company.name}. Users can be added through the user management system.`
        : `Found ${usersWithStatus.length} users for ${company.name}`
    })
  } catch (error) {
    console.error('Error in company users API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}