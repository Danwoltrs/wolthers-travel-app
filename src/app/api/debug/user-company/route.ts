import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Find Daniel's user record
    const { data: daniel, error: danielError } = await supabase
      .from('users')
      .select('id, email, full_name, company_id')
      .eq('email', 'daniel@wolthers.com')
      .single()

    if (danielError) {
      return NextResponse.json({ error: 'Daniel not found', details: danielError.message })
    }

    // Find Wolthers company
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, category')
      .ilike('name', '%wolthers%')
      
    if (companiesError) {
      return NextResponse.json({ error: 'Companies query failed', details: companiesError.message })
    }

    return NextResponse.json({
      daniel: daniel,
      wolthersCompanies: companies,
      message: 'Debug info for user-company assignment'
    })
    
  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    const { userId, companyId } = body
    
    // Update Daniel's company_id
    const { data, error } = await supabase
      .from('users')
      .update({ company_id: companyId })
      .eq('id', userId)
      .select()

    if (error) {
      return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      updatedUser: data[0],
      message: 'User company assignment updated'
    })
    
  } catch (error) {
    console.error('Update API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}