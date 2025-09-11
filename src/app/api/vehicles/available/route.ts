import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const body = await request.json()
    const { startDate, endDate, participantCount } = body

    // Get available vehicles (not assigned to other trips during this period)
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        model,
        year,
        color,
        license_plate,
        seating_capacity,
        vehicle_type,
        is_available,
        image_url,
        current_mileage
      `)
      .eq('is_available', true)
      .order('model', { ascending: true })

    if (error) {
      console.error('Error fetching available vehicles:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
    }

    // TODO: Filter out vehicles that are already assigned to trips during the specified date range
    // For now, return all available vehicles

    return NextResponse.json({ vehicles: vehicles || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get all available vehicles
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        id,
        model,
        year,
        color,
        license_plate,
        seating_capacity,
        vehicle_type,
        is_available,
        image_url,
        current_mileage
      `)
      .eq('is_available', true)
      .order('model', { ascending: true })

    if (error) {
      console.error('Error fetching available vehicles:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
    }

    return NextResponse.json({ vehicles: vehicles || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}