import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface CompanyLocationParams {
  params: Promise<{
    companyId: string
  }>
}

export async function GET(request: NextRequest, segmentData: CompanyLocationParams) {
  console.log('📍 Company locations API called')
  
  try {
    // Await the params since they're now a Promise in Next.js 15
    const { companyId } = await segmentData.params
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

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

    console.log('👤 User authenticated:', user.email, 'fetching locations for company:', companyId)

    const supabase = createServerSupabaseClient()
    
    // Get company details first
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, name, email, phone')
      .eq('id', companyId)
      .single()

    if (companyError || !companyData) {
      console.error('❌ Company not found:', companyError)
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get locations for the company
    const { data: locationsData, error: locationsError } = await supabase
      .from('company_locations')
      .select(`
        id,
        location_name,
        address_line_1,
        address_line_2,
        city,
        state_province,
        postal_code,
        country,
        location_type,
        is_primary_location,
        is_meeting_location,
        phone,
        email,
        contact_person,
        meeting_room_capacity,
        has_presentation_facilities,
        has_catering,
        parking_availability,
        accessibility_notes,
        latitude,
        longitude,
        notes,
        created_at,
        updated_at
      `)
      .eq('company_id', companyId)
      .order('is_primary_location', { ascending: false })
      .order('location_name', { ascending: true })

    if (locationsError) {
      console.error('❌ Failed to fetch company locations:', locationsError)
      return NextResponse.json(
        { error: 'Failed to fetch company locations', details: locationsError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${locationsData?.length || 0} locations for company ${companyData.name}`)

    // Filter only meeting-capable locations by default, unless specified otherwise
    const meetingLocationsOnly = request.nextUrl.searchParams.get('meeting_only') !== 'false'
    const filteredLocations = meetingLocationsOnly 
      ? locationsData?.filter(loc => loc.is_meeting_location) || []
      : locationsData || []

    const response = {
      company: companyData,
      locations: filteredLocations,
      total: filteredLocations.length,
      total_all_locations: locationsData?.length || 0
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('🚨 Company locations API error:', error)
    
    const errorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}