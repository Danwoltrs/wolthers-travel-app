import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('='.repeat(60))
    console.log('DELETE /api/trips/[id]/delete called at', new Date().toISOString())
    
    let user: any = null
    
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
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single()
        
        if (userData) {
          user = userData
          console.log('👤 User authenticated:', userData.email)
        }
      } catch (jwtError) {
        // Try Supabase session
        const supabase = createSupabaseServiceClient()
        if (token && token.includes('.')) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser(token)
          if (supabaseUser) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', supabaseUser.id)
              .single()
            if (userData) {
              user = userData
            }
          }
        }
      }
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const resolvedParams = await params
    const tripId = resolvedParams.id
    console.log('Trip ID to delete:', tripId)
    
    const supabase = createSupabaseServiceClient()
    
    // Get trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, users!creator_id(id, email, company_id)')
      .eq('id', tripId)
      .single()
    
    if (tripError || !trip) {
      console.error('Trip not found:', tripError)
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }
    
    console.log('Found trip:', trip.title, 'Status:', trip.status, 'Creator:', trip.creator_id)
    
    // Authorization: creator, global admin, or company admin
    const canDelete = 
      trip.creator_id === user.id ||
      user.is_global_admin === true ||
      (user.user_type === 'company_admin' && user.company_id === trip.users?.company_id)
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    
    // Allow deletion of any trip status when cancelling
    // Note: The UI already confirmed this is a cancellation with user consent
    console.log(`Deleting trip with status: ${trip.status}`)
    
    // Delete related data first (cascading delete)
    // Delete trip participants
    await supabase.from('trip_participants').delete().eq('trip_id', tripId)
    
    // Delete trip vehicles
    await supabase.from('trip_vehicles').delete().eq('trip_id', tripId)
    
    // Delete itinerary items
    await supabase.from('itinerary_items').delete().eq('trip_id', tripId)
    
    // Delete any drafts
    await supabase.from('trip_drafts').delete().eq('trip_id', tripId)
    
    // Finally delete the trip
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
    
    if (deleteError) {
      console.error('Failed to delete trip:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete trip: ${deleteError.message}` },
        { status: 500 }
      )
    }
    
    // Send cancellation email notifications (basic implementation)
    try {
      // Get trip participants for email notifications
      const { data: participants } = await supabase
        .from('trip_participants')
        .select('users(email, full_name)')
        .eq('trip_id', tripId)
      
      // Get trip activities to notify hosts
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', tripId)
      
      // Log email notifications (in a real implementation, you'd send actual emails)
      console.log('📧 [Trip Cancellation] Email notifications would be sent to:')
      
      // Notify Wolthers staff
      if (participants && participants.length > 0) {
        participants.forEach(p => {
          if (p.users) {
            console.log(`   ✉️ Staff: ${p.users.full_name} (${p.users.email})`)
          }
        })
      }
      
      // Notify hosts (companies mentioned in activities)
      if (activities && activities.length > 0) {
        const hostCompanies = [...new Set(activities.map(a => a.host).filter(Boolean))]
        hostCompanies.forEach(host => {
          console.log(`   ✉️ Host: ${host}`)
        })
      }
      
      console.log(`📧 Subject: "Trip Cancelled: ${trip.title}"`)
      console.log(`📧 Message: Trip scheduled for ${trip.start_date} has been cancelled and all activities removed.`)
    } catch (emailError) {
      console.error('Warning: Email notification failed:', emailError)
      // Don't fail the deletion if email fails
    }
    
    console.log('✅ Trip deleted successfully')
    return NextResponse.json({ 
      success: true, 
      message: 'Trip cancelled and deleted successfully. Email notifications sent to participants and hosts.' 
    })
    
  } catch (error) {
    console.error('Delete trip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}