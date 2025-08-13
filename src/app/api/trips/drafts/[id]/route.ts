import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('DELETE /api/trips/drafts/[id] called')
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
        const supabase = createServerSupabaseClient()
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()

        if (!userError && userData) {
          user = userData
          console.log('👤 User authenticated:', userData.email)
        } else {
          console.error('❌ User lookup failed:', userError)
        }
      } catch (jwtError) {
        console.log('🔄 JWT verification failed, trying Supabase session authentication...')
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
              console.log('👤 User authenticated via Supabase session:', userData.email)
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
    const draftId = resolvedParams.id
    console.log('Draft ID from params:', draftId)

    if (!draftId) {
      console.log('No draft ID provided')
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client for database operations
    const supabase = createServerSupabaseClient()

    // Verify the draft belongs to the user
    console.log('🔍 Looking for draft with ID:', draftId, 'for user:', user.email)
    const { data: draft, error: verifyError } = await supabase
      .from('trip_drafts')
      .select('creator_id, trip_id')
      .eq('id', draftId)
      .single()

    if (verifyError || !draft) {
      console.error('❌ Draft not found:', verifyError)
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found draft, creator_id:', draft.creator_id, 'user.id:', user.id)
    if (draft.creator_id !== user.id) {
      console.error('❌ Permission denied - user does not own draft')
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete the draft
    console.log('🗑️ Deleting draft with ID:', draftId)
    const { error: deleteError } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('id', draftId)

    if (deleteError) {
      console.error('❌ Failed to delete draft:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete draft' },
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