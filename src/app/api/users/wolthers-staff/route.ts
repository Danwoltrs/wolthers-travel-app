import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Authentication logic (same as other protected routes)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
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
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`🔍 Wolthers staff API called by: ${user.email}`)
    
    // Use service role client to bypass RLS
    const supabase = createServerSupabaseClient()
    
    // Get all users with company information using service role
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select(`
        id, 
        email, 
        full_name, 
        phone, 
        user_type, 
        company_id,
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

    // Filter Wolthers staff - include admin types from Wolthers company and wolthers_staff types
    const wolthersStaff = allUsers.filter(user => {
      const isWolthersStaff = user.user_type === 'wolthers_staff'
      const isWolthersCompanyAdmin = user.user_type === 'admin' && 
        user.companies?.name?.includes('Wolthers')
      
      console.log(`🔎 Filtering user ${user.full_name}: type="${user.user_type}", company="${user.companies?.name || 'none'}", isWolthersStaff=${isWolthersStaff}, isWolthersCompanyAdmin=${isWolthersCompanyAdmin}`)
      
      return isWolthersStaff || isWolthersCompanyAdmin
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