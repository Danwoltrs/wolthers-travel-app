import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'

// Admin client with service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function GET(request: NextRequest) {
  try {
    let currentUser: any = null
    
    // Try JWT token authentication first (Microsoft OAuth)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        // Get user from database with service role (bypasses RLS)
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          currentUser = userData
          console.log('🔑 JWT Auth: Successfully authenticated user:', currentUser.email)
        }
      } catch (jwtError) {
        console.log('🔑 JWT verification failed, trying Supabase session...')
      }
    }

    // If JWT failed, try Supabase session authentication (Email/Password)
    if (!currentUser) {
      try {
        const supabaseClient = createSupabaseServiceClient()
        
        // Try to get session from Supabase auth header
        let authToken = null
        if (authHeader && authHeader.startsWith('Bearer ')) {
          authToken = authHeader.substring(7)
        }
        
        // Check if this might be a Supabase session token
        if (authToken && authToken.includes('.')) {
          // This looks like a Supabase JWT token, try to verify with Supabase
          const { data: { user: supabaseUser }, error: sessionError } = await supabaseClient.auth.getUser(authToken)
          
          if (!sessionError && supabaseUser) {
            // Get full user profile from database
            const { data: userData, error: userError } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()

            if (!userError && userData) {
              currentUser = userData
              console.log('🔑 Supabase Auth: Successfully authenticated user:', currentUser.email)
            }
          }
        }
      } catch (supabaseError) {
        console.log('🔑 Supabase authentication also failed:', supabaseError)
      }
    }
    
    // If both methods failed, return unauthorized
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has permission to view users
    const canViewAllUsers = currentUser.is_global_admin || currentUser.user_type === 'wolthers_staff'
    const canViewCompanyUsers = currentUser.user_type === 'admin' && currentUser.company_id

    if (!canViewAllUsers && !canViewCompanyUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Build query with admin client to bypass RLS
    let query = supabaseAdmin.from('users').select(`
      *,
      companies!users_company_id_fkey(name)
    `)

    // Apply filtering based on permissions
    if (!canViewAllUsers && currentUser.company_id) {
      query = query.eq('company_id', currentUser.company_id)
    }

    const { data: usersData, error: usersError } = await query.order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Add company_name field for compatibility
    const enrichedUsers = (usersData || []).map(user => ({
      ...user,
      company_name: user.companies?.name || 'Wolthers & Associates'
    }))

    return NextResponse.json({ 
      users: enrichedUsers,
      total: enrichedUsers.length 
    })

  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}