import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Use the same authentication logic as working APIs (coffee-supply pattern)
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      console.log('🔑 Wolthers Staff API: No auth-token cookie found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the JWT token (same as working APIs)
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    let user: any = null
    
    try {
      const decoded = verify(authToken, secret) as any
      console.log('🔑 Wolthers Staff API: JWT Token decoded successfully:', { userId: decoded.userId })
      
      // Get user from database using service role client (bypasses RLS)
      const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: userData, error: userError } = await serviceSupabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (userError) {
        console.log('🔑 Wolthers Staff API: Database query failed:', userError)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }
      
      if (!userData) {
        console.log('🔑 Wolthers Staff API: No user data found')
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }

      user = userData
      console.log('🔑 Wolthers Staff API: Successfully authenticated user:', user.email)
      
    } catch (jwtError) {
      console.log('🔑 Wolthers Staff API: JWT verification failed:', jwtError.message)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log(`🔍 Wolthers staff API called by: ${user.email}`)
    
    // Use service role client to bypass RLS (reuse the same client)
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get all users with company information using service role
    const { data: allUsers, error: allUsersError } = await serviceSupabase
      .from('users')
      .select(`
        id, 
        email, 
        full_name,
        title,
        phone,
        whatsapp,
        user_type, 
        company_id,
        last_login_at,
        companies!company_id (
          id,
          name
        )
      `)
      .order('full_name')

    console.log(`📊 Service role query - Users found: ${allUsers?.length || 0}`)
    console.log(`❌ Service role query error:`, allUsersError)

    if (allUsersError) {
      console.error('🚨 Database error in Wolthers staff API:', allUsersError)
      return NextResponse.json(
        { error: 'Database error', details: allUsersError.message },
        { status: 500 }
      )
    }

    if (!allUsers) {
      console.warn('⚠️ No users returned from service role query')
      return NextResponse.json({ staff: [] })
    }

    // Filter Wolthers staff - include admin types from Wolthers company, wolthers_staff types, and current user
    const wolthersCompanyId = '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    const wolthersStaff = allUsers.filter(user => {
      const isWolthersStaff = user.user_type === 'wolthers_staff'
      const isWolthersCompanyAdmin = user.user_type === 'admin' && 
        user.companies?.name?.includes('Wolthers')
      const isWolthersCompanyMember = user.company_id === wolthersCompanyId
      const isCurrentUser = user.id === user.id // Always include current user if they match other criteria
      
      console.log(`🔎 Filtering user ${user.full_name}: type="${user.user_type}", company="${user.companies?.name || 'none'}", company_id="${user.company_id}", isWolthersStaff=${isWolthersStaff}, isWolthersCompanyAdmin=${isWolthersCompanyAdmin}, isWolthersCompanyMember=${isWolthersCompanyMember}`)
      
      return isWolthersStaff || isWolthersCompanyAdmin || isWolthersCompanyMember
    })

    console.log(`👥 Wolthers staff found: ${wolthersStaff.length}`)
    console.log(`📈 Staff members:`, wolthersStaff.map(s => ({ name: s.full_name, email: s.email, type: s.user_type })))

    return NextResponse.json({ 
      staff: wolthersStaff,
      count: wolthersStaff.length,
      message: `Found ${wolthersStaff.length} Wolthers staff members`
    })

  } catch (error) {
    console.error('💥 Wolthers staff API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}