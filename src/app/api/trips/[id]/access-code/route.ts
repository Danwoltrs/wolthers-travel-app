import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tripId = params.id
    const { accessCode } = await request.json()

    // Validate input
    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      )
    }

    // Authentication logic (same as other endpoints)
    let user: any = null
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

    const supabase = createServerSupabaseClient()

    // Check if trip exists and user has permission to edit it
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, creator_id, access_code')
      .eq('id', tripId)
      .single()

    if (tripError) {
      console.error('Error fetching trip:', tripError)
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check permission: user must be trip creator or company admin
    const canEdit = trip.creator_id === user.id || user.role === 'company_admin'
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Check if the new access code is already in use by another trip
    if (accessCode !== trip.access_code) {
      const { data: existingTrip, error: checkError } = await supabase
        .from('trips')
        .select('id')
        .eq('access_code', accessCode)
        .neq('id', tripId)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        console.error('Error checking access code uniqueness:', checkError)
        return NextResponse.json(
          { error: 'Failed to validate access code' },
          { status: 500 }
        )
      }

      if (existingTrip) {
        return NextResponse.json(
          { error: 'This access code is already in use by another trip' },
          { status: 409 }
        )
      }
    }

    // Update the trip access code
    const { error: updateError } = await supabase
      .from('trips')
      .update({ access_code: accessCode })
      .eq('id', tripId)

    if (updateError) {
      console.error('Error updating trip access code:', updateError)
      return NextResponse.json(
        { error: 'Failed to update access code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Access code updated successfully',
      accessCode
    })

  } catch (error) {
    console.error('Error in PATCH /api/trips/[id]/access-code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}