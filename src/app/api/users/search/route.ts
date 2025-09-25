import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  let user: any = null
  
  try {
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
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
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
        }
      } catch (jwtError) {
        const supabaseClient = createSupabaseServiceClient()
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Create server-side Supabase client
    const supabase = createSupabaseServiceClient()

    // Search for users by name or email
    let queryBuilder = supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        companies (
          id,
          name
        )
      `)
      .limit(limit)

    if (query) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }

    const { data: users, error } = await queryBuilder

    if (error) {
      console.error('Error searching users:', error)
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
    }

    return NextResponse.json(users || [])

  } catch (error) {
    console.error('Error in users search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}