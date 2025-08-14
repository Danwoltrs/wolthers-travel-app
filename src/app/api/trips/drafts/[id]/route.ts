import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient, createSupabaseServiceClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('='.repeat(60))
    console.log('DELETE /api/trips/drafts/[id] called at', new Date().toISOString())
    console.log('Request URL:', request.url)
    let user: any = null
    
    // Authentication logic matching the progressive-save endpoint
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    console.log('🔑 Auth header present:', !!authHeader)
    console.log('🍪 Cookie token present:', !!cookieToken)
    
    // Try Authorization header first, then cookie
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }
    
    if (token) {
      console.log('🎫 Token found, attempting authentication...')
      const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'

      try {
        const decoded = verify(token, secret) as any
        console.log('✅ Token decoded successfully, user ID:', decoded.userId)
        const supabase = createSupabaseServiceClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
          console.log('👤 User authenticated:', userData.email, 'Role:', userData.role || userData.user_type)
        } else {
          console.error('❌ User lookup failed:', userError)
        }
      } catch (jwtError) {
        console.log('🔄 JWT verification failed, trying Supabase session authentication...')
        // Try Supabase session authentication - use service client to bypass RLS
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
              console.log('👤 User authenticated via Supabase session:', userData.email, 'Role:', userData.role || userData.user_type)
            }
          }
        }
      }
    }
    
    if (!user) {
      console.error('❌ Authentication failed - no valid user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const paramId = resolvedParams.id
    console.log('Param ID from URL:', paramId)

    if (!paramId) {
      console.log('No ID provided')
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase service client for database operations (bypasses RLS)
    const supabase = createSupabaseServiceClient()

    // First, check if this is a draft ID or a trip ID
    // Try to find it as a draft ID first
    console.log('🔍 Looking for draft with ID:', paramId, 'for user:', user.email)
    let { data: draft, error: verifyError } = await supabase
      .from('trip_drafts')
      .select(`
        *,
        users!creator_id (
          id,
          email,
          company_id
        )
      `)
      .eq('id', paramId)
      .single()
    
    // If not found as draft ID, try to find it by trip_id
    if (!draft) {
      console.log('🔄 Not found as draft ID, trying as trip_id:', paramId)
      const { data: draftByTripId, error: tripError } = await supabase
        .from('trip_drafts')
        .select(`
          *,
          users!creator_id (
            id,
            email,
            company_id
          )
        `)
        .eq('trip_id', paramId)
        .single()
      
      if (draftByTripId) {
        draft = draftByTripId
        verifyError = null
        console.log('✅ Found draft by trip_id, draft_id:', draft.id)
      } else {
        verifyError = tripError
      }
    }

    if (verifyError || !draft) {
      console.error('❌ Draft not found:', verifyError)
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found draft, creator_id:', draft.creator_id, 'user.id:', user.id)
    console.log('User role:', user.role || user.user_type, 'Company ID:', user.company_id)
    console.log('Draft creator company:', draft.users?.company_id)
    
    // Authorization: Allow deletion if user is draft creator OR company admin in same company OR global admin
    const userRole = user.role || user.user_type
    const canDelete = 
      draft.creator_id === user.id || 
      (userRole === 'company_admin' && user.company_id === draft.users?.company_id) ||
      user.is_global_admin === true

    if (!canDelete) {
      console.error('❌ Permission denied - user cannot delete this draft')
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete the draft using the actual draft ID
    const draftIdToDelete = draft.id
    console.log('🗑️ Deleting draft with ID:', draftIdToDelete, '(trip_id:', draft.trip_id, ')')
    const { error: deleteError, count } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('id', draftIdToDelete)
      .select()

    if (deleteError) {
      console.error('❌ Failed to delete draft:', deleteError)
      console.error('Delete error details:', {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint
      })
      return NextResponse.json(
        { error: `Failed to delete draft: ${deleteError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    console.log('✅ Draft deleted successfully')
    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    })

  } catch (error) {
    console.error('Delete draft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}