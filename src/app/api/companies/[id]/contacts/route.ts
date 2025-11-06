import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// GET - Fetch all contacts for a company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    console.log(`[API] Fetching contacts for company ID: ${params.id}`)

    const { data: contacts, error } = await supabase
      .from('company_contacts')
      .select('*')
      .eq('company_id', params.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching company contacts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Unexpected error in GET /api/companies/[id]/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new contact for a company
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    console.log(`[API] Creating contact for company ID: ${params.id}`)

    const body = await request.json()
    const { name, role, title, email, phone, whatsapp, department, is_primary, contact_type, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate phone format if provided
    if (phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone format' }, { status: 400 })
    }

    const contactData = {
      company_id: params.id,
      name: name.trim(),
      title: title?.trim() || role?.trim() || null, // Accept either title or role field
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      department: department?.trim() || null,
      is_primary: is_primary || false,
      contact_type: contact_type || 'business',
      notes: notes?.trim() || null
    }

    const { data: contact, error } = await supabase
      .from('company_contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      console.error('Error creating company contact:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/companies/[id]/contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}