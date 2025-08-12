import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface WolthersStaffMember {
  id: string
  email: string
  full_name: string
  phone?: string
  user_type: string
}

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Authentication logic - support both JWT and Supabase sessions
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

    console.log('🔍 Fetching Wolthers staff via API route...')
    const supabase = createServerSupabaseClient()
    
    // Server-side query with service role bypasses RLS
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

    console.log('📊 All users fetched via API:', allUsers?.length || 0)
    console.log('❌ API users error:', allUsersError)

    if (allUsersError) {
      console.error('🚨 API Database error:', allUsersError)
      throw new Error(`Database error: ${allUsersError.message}`)
    }

    if (!allUsers) {
      console.warn('⚠️ No users returned from API database')
      return NextResponse.json([])
    }

    // Filter Wolthers staff specifically
    const wolthersStaff = allUsers.filter(user => {
      const isWolthersStaff = user.user_type === 'wolthers_staff'
      const isWolthersCompanyAdmin = user.user_type === 'admin' && 
        user.companies?.name?.includes('Wolthers')
      
      console.log(`🔎 API checking user ${user.full_name}: type="${user.user_type}", company="${user.companies?.name || 'none'}", isWolthersStaff=${isWolthersStaff}, isWolthersCompanyAdmin=${isWolthersCompanyAdmin}`)
      
      return isWolthersStaff || isWolthersCompanyAdmin
    })

    console.log('👥 Wolthers staff via API:', wolthersStaff.length, 'members')

    // Return clean data matching the expected interface
    const staffData: WolthersStaffMember[] = wolthersStaff.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name || '',
      phone: user.phone || undefined,
      user_type: user.user_type
    }))

    return NextResponse.json(staffData)

  } catch (error) {
    console.error('❌ Wolthers staff API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch Wolthers staff',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}