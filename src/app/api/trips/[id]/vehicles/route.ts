import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface VehicleUpdateRequest {
  vehicles: Array<{
    id: string
    driver_id?: string
    notes?: string
  }>
  action: 'add' | 'remove' | 'replace'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const tripId = params.id
    const body: VehicleUpdateRequest = await request.json()
    const { vehicles, action } = body

    if (!vehicles || !Array.isArray(vehicles)) {
      return NextResponse.json(
        { error: 'Invalid vehicles data' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Check if user has permission to edit this trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select(`
        id, 
        creator_id,
        start_date,
        end_date,
        trip_access_permissions (user_id, permission_type, expires_at)
      `)
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const hasPermission = 
      trip.creator_id === user.id ||
      user.is_global_admin ||
      trip.trip_access_permissions?.some((perm: any) => 
        perm.user_id === user.id && 
        ['edit', 'admin'].includes(perm.permission_type) &&
        (!perm.expires_at || new Date(perm.expires_at) > new Date())
      )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    // Check for vehicle conflicts with overlap prevention
    for (const vehicle of vehicles) {
      if (action === 'add' || action === 'replace') {
        const { data: isAvailable } = await supabase
          .rpc('check_vehicle_availability', {
            vehicle_id: vehicle.id,
            trip_start_date: trip.start_date,
            trip_end_date: trip.end_date,
            exclude_trip_id: tripId
          })

        if (!isAvailable) {
          // Get vehicle info for better error message
          const { data: vehicleInfo } = await supabase
            .from('vehicles')
            .select('make, model, license_plate')
            .eq('id', vehicle.id)
            .single()

          const vehicleName = vehicleInfo 
            ? `${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.license_plate})`
            : 'Vehicle'

          return NextResponse.json(
            { 
              error: 'Vehicle has conflicting assignment',
              details: `${vehicleName} is already assigned to another trip during this period`
            },
            { status: 409 }
          )
        }
      }
    }

    if (action === 'replace') {
      // Remove all existing vehicle assignments
      await supabase
        .from('trip_vehicles')
        .delete()
        .eq('trip_id', tripId)
    }

    if (action === 'add' || action === 'replace') {
      // Add new vehicle assignments
      const vehicleInserts = vehicles.map(vehicle => ({
        trip_id: tripId,
        vehicle_id: vehicle.id,
        driver_id: vehicle.driver_id || null,
        notes: vehicle.notes || null,
        created_at: now,
        updated_at: now
      }))

      const { error: vehicleError } = await supabase
        .from('trip_vehicles')
        .insert(vehicleInserts)

      if (vehicleError) {
        console.error('Failed to add vehicle assignments:', vehicleError)
        return NextResponse.json(
          { error: 'Failed to add vehicle assignments', details: vehicleError.message },
          { status: 500 }
        )
      }
    } else if (action === 'remove') {
      // Remove specific vehicle assignments
      const vehicleIds = vehicles.map(v => v.id)
      await supabase
        .from('trip_vehicles')
        .delete()
        .eq('trip_id', tripId)
        .in('vehicle_id', vehicleIds)
    }

    // Update trip metadata
    const { error: updateError } = await supabase
      .from('trips')
      .update({
        last_edited_at: now,
        last_edited_by: user.id
      })
      .eq('id', tripId)

    if (updateError) {
      console.error('Failed to update trip metadata:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle assignments updated successfully'
    })

  } catch (error) {
    console.error('Vehicle update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch current vehicle assignments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const tripId = params.id

    const { data: vehicleAssignments, error } = await supabase
      .from('trip_vehicles')
      .select(`
        vehicle_id,
        driver_id,
        notes,
        vehicles (
          id,
          make,
          model,
          license_plate,
          year,
          status
        ),
        driver:users!driver_id (
          id,
          full_name,
          email
        )
      `)
      .eq('trip_id', tripId)

    if (error) {
      console.error('Error fetching vehicle assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vehicle assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      vehicles: vehicleAssignments || []
    })

  } catch (error) {
    console.error('Get vehicle assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}