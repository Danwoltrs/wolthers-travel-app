import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Skip auth check for now since we're using server client with service role

    // Fetch external drivers
    const { data: drivers, error } = await supabase
      .from('external_drivers')
      .select(`
        id,
        full_name,
        cpf_rg,
        cnh_number,
        cnh_category,
        cnh_expiry_date,
        whatsapp,
        email,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error fetching external drivers:', error)
      return NextResponse.json({ error: 'Failed to fetch external drivers' }, { status: 500 })
    }

    return NextResponse.json({ drivers: drivers || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Skip auth check for now since we're using server client with service role

    // For now, skip user verification since we're using service role
    // TODO: Add proper authentication when cookie/session handling is implemented

    const body = await request.json()
    
    // Validate required fields
    if (!body.full_name || !body.cpf_rg || !body.cnh_number || !body.whatsapp || !body.cnh_category) {
      return NextResponse.json({ 
        error: 'Missing required fields: full_name, cpf_rg, cnh_number, whatsapp, cnh_category' 
      }, { status: 400 })
    }

    // Prepare driver data
    const driverData = {
      full_name: body.full_name.trim(),
      cpf_rg: body.cpf_rg.trim(),
      cnh_number: body.cnh_number.trim(),
      cnh_category: body.cnh_category,
      cnh_expiry_date: body.cnh_expiry_date || null,
      whatsapp: body.whatsapp.trim(),
      email: body.email?.trim() || null,
      is_active: true,
      created_by: null // TODO: Set actual user ID when auth is implemented
    }

    // Insert external driver
    const { data: driver, error } = await supabase
      .from('external_drivers')
      .insert([driverData])
      .select(`
        id,
        full_name,
        cpf_rg,
        cnh_number,
        cnh_category,
        cnh_expiry_date,
        whatsapp,
        email,
        is_active,
        created_at
      `)
      .single()

    if (error) {
      console.error('Error creating external driver:', error)
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('cpf_rg')) {
          return NextResponse.json({ error: 'CPF/RG already exists' }, { status: 400 })
        }
        if (error.message.includes('cnh_number')) {
          return NextResponse.json({ error: 'CNH number already exists' }, { status: 400 })
        }
        if (error.message.includes('whatsapp')) {
          return NextResponse.json({ error: 'WhatsApp number already exists' }, { status: 400 })
        }
      }
      
      return NextResponse.json({ error: 'Failed to create external driver' }, { status: 500 })
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Skip auth check for now since we're using server client with service role

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 })
    }

    // Update external driver
    const { data: driver, error } = await supabase
      .from('external_drivers')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        full_name,
        cpf_rg,
        cnh_number,
        cnh_category,
        cnh_expiry_date,
        whatsapp,
        email,
        is_active,
        created_at
      `)
      .single()

    if (error) {
      console.error('Error updating external driver:', error)
      return NextResponse.json({ error: 'Failed to update external driver' }, { status: 500 })
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}