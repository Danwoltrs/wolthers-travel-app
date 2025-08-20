import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Authentication logic (same as other protected routes)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    // Try Authorization header first, then cookie
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
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

    console.log(`🔍 Drivers API called by: ${user.email}`)
    
    // Use service role client to bypass RLS
    const supabase = createServerSupabaseClient()
    
    // Get all users with driver user_type
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
      .eq('user_type', 'driver')
      .order('full_name')

    console.log(`📊 Service role query - Drivers found: ${allUsers?.length || 0}`)
    console.log(`❌ Service role query error:`, allUsersError)

    if (allUsersError) {
      console.error('🚨 Database error in Drivers API:', allUsersError)
      return NextResponse.json(
        { error: 'Database error', details: allUsersError.message },
        { status: 500 }
      )
    }

    if (!allUsers) {
      console.warn('⚠️ No drivers returned from service role query')
      return NextResponse.json({ drivers: [] })
    }

    const drivers = allUsers.filter(user => {
      const isDriver = user.user_type === 'driver'
      
      console.log(`🔎 Filtering driver ${user.full_name}: type="${user.user_type}", company="${user.companies?.name || 'none'}", company_id="${user.company_id}", isDriver=${isDriver}`)
      
      return isDriver
    })

    console.log(`👥 Drivers found: ${drivers.length}`)
    console.log(`📈 Driver members:`, drivers.map(d => ({ name: d.full_name, email: d.email, type: d.user_type })))

    return NextResponse.json({ 
      drivers: drivers,
      count: drivers.length,
      message: `Found ${drivers.length} drivers`
    })

  } catch (error) {
    console.error('💥 Drivers API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}