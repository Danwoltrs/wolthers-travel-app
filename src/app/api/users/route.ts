import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 })
    }

    // Verify the current user has permission to view users
    // First, get the current user from the token or session
    let currentUser = null
    
    // Try to verify via our auth API
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
        headers: {
          'Cookie': request.headers.get('Cookie') || '',
          'Authorization': authHeader || '',
        },
      })
      
      if (response.ok) {
        const sessionData = await response.json()
        currentUser = sessionData.user
      }
    } catch (error) {
      console.error('Failed to verify session:', error)
    }

    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
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