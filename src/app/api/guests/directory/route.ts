import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { verifySessionToken, extractBearerToken } from '@/lib/jwt-utils'

export async function GET(request: NextRequest) {
  try {
    let user: any = null
    
    // Authentication logic
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = extractBearerToken(authHeader)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      try {
        const decoded = verifySessionToken(token)
        if (decoded) {
          const supabase = createServerSupabaseClient()
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single()

          if (!userError && userData) {
            user = userData
          }
        }
      } catch (jwtError) {
        // Try Supabase session authentication
        const supabase = createServerSupabaseClient()
        
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser }, error: sessionError } = await supabase.auth.getUser(token)
          
          if (!sessionError && supabaseUser) {
            const { data: userData, error: userError } = await supabase
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

    // Check if user is Wolthers staff
    const isWolthersStaff = user.user_type === 'wolthers_staff' || 
                           user.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0' ||
                           user.is_global_admin

    if (!isWolthersStaff) {
      return NextResponse.json(
        { error: 'Access denied - Wolthers staff only' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const guestType = searchParams.get('type')

    const supabase = createServerSupabaseClient()

    let query = supabase
      .from('active_guest_directory')
      .select(`
        id,
        full_name,
        email,
        phone,
        company_name,
        job_title,
        guest_type,
        guest_category,
        total_trips_invited,
        total_trips_attended,
        last_trip_date,
        last_invited_date,
        engagement_score,
        tags,
        created_at
      `)
      .order('engagement_score', { ascending: false })
      .order('last_invited_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('guest_category', category)
    }

    if (guestType) {
      query = query.eq('guest_type', guestType)
    }

    const { data: guests, error: guestsError } = await query

    if (guestsError) {
      console.error('Failed to fetch guests:', guestsError)
      return NextResponse.json(
        { error: 'Failed to fetch guests' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('active_guest_directory')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`)
    }

    if (category) {
      countQuery = countQuery.eq('guest_category', category)
    }

    if (guestType) {
      countQuery = countQuery.eq('guest_type', guestType)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      guests: guests || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('❌ Guest directory error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint to add a new guest to the directory
export async function POST(request: NextRequest) {
  try {
    let user: any = null
    
    // Authentication logic (same as GET)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = extractBearerToken(authHeader)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      try {
        const decoded = verifySessionToken(token)
        if (decoded) {
          const supabase = createServerSupabaseClient()
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single()

          if (!userError && userData) {
            user = userData
          }
        }
      } catch (jwtError) {
        // Try Supabase session authentication
        const supabase = createServerSupabaseClient()
        
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser }, error: sessionError } = await supabase.auth.getUser(token)
          
          if (!sessionError && supabaseUser) {
            const { data: userData, error: userError } = await supabase
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

    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      company_name,
      job_title,
      guest_type = 'company_guest',
      guest_category,
      tags,
      dietary_restrictions,
      special_requirements,
      internal_notes
    } = body

    if (!full_name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Check if guest already exists
    const { data: existingGuest } = await supabase
      .from('guest_directory')
      .select('id')
      .eq('email', email)
      .single()

    if (existingGuest) {
      return NextResponse.json(
        { error: 'Guest with this email already exists' },
        { status: 409 }
      )
    }

    // Add new guest to directory
    const { data: newGuest, error: insertError } = await supabase
      .from('guest_directory')
      .insert({
        full_name,
        email,
        phone,
        company_name,
        job_title,
        guest_type,
        guest_category,
        tags: tags || [],
        dietary_restrictions,
        special_requirements,
        internal_notes,
        created_by: user.id,
        source: 'manual_entry'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create guest:', insertError)
      return NextResponse.json(
        { error: 'Failed to create guest' },
        { status: 500 }
      )
    }

    console.log(`✅ Guest added to directory:`, {
      guestId: newGuest.id,
      name: full_name,
      email,
      addedBy: user.full_name
    })

    return NextResponse.json({
      success: true,
      guest: newGuest
    })

  } catch (error) {
    console.error('❌ Add guest error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}