import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    let user: any = null
    
    // Authentication logic (same as other endpoints)
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

    const draftId = params.id

    if (!draftId) {
      return NextResponse.json(
        { error: 'Draft ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify the draft belongs to the user
    const { data: draft, error: verifyError } = await supabase
      .from('trip_drafts')
      .select('creator_id, trip_id')
      .eq('id', draftId)
      .single()

    if (verifyError || !draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      )
    }

    if (draft.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete the draft
    const { error: deleteError } = await supabase
      .from('trip_drafts')
      .delete()
      .eq('id', draftId)

    if (deleteError) {
      console.error('Failed to delete draft:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete draft' },
        { status: 500 }
      )
    }

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