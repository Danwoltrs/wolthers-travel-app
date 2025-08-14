import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface CompanyWithLocations {
  company_id: string
  company_name: string
  company_email: string | null
  company_phone: string | null
  location_count: number
  primary_location_id: string | null
  primary_location_name: string | null
  primary_location_address: string | null
}

export async function GET(request: NextRequest) {
  console.log('🏢 Companies with locations API called')
  
  try {
    // Authentication logic (same as other endpoints)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

    // Try Authorization header first, then cookie
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let user = null
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

    try {
      const decoded = verify(token, secret) as any
      const supabase = createServerSupabaseClient()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (!userError && userData) {
        user = userData
      }
    } catch (jwtError) {
      // Try Supabase session authentication
      const supabaseClient = createServerSupabaseClient()
      
      if (token && token.includes('.')) {
        const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(token)
        
        if (!sessionError && supabaseUser) {
          const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .single()

          if (!userError && userData) {
            user = userData
          }
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    console.log('👤 User authenticated:', user.email)

    // Use service role client to call the function
    const supabase = createServerSupabaseClient()
    
    // Call the database function to get companies with locations
    const { data: companiesData, error: companiesError } = await supabase
      .rpc('get_companies_with_locations')

    if (companiesError) {
      console.error('❌ Failed to fetch companies with locations:', companiesError)
      return NextResponse.json(
        { error: 'Failed to fetch companies with locations', details: companiesError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${companiesData?.length || 0} companies with location data`)

    const response = {
      companies: companiesData as CompanyWithLocations[],
      total: companiesData?.length || 0
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('🚨 Companies with locations API error:', error)
    
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}