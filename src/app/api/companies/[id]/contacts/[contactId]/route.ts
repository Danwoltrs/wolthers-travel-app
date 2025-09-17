import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// PUT - Update a company contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    console.log(`[API] Updating contact ${params.contactId} for company ${params.id}`)

    const body = await request.json()
    const { name, role, email, phone } = body

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

    const updateData = {
      name: name.trim(),
      role: role?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      updated_by: '550e8400-e29b-41d4-a716-446655440001', // TODO: Get from auth
      updated_at: new Date().toISOString()
    }

    const { data: contact, error } = await supabase
      .from('company_contacts')
      .update(updateData)
      .eq('id', params.contactId)
      .eq('company_id', params.id) // Ensure the contact belongs to this company
      .select()
      .single()

    if (error) {
      console.error('Error updating company contact:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Unexpected error in PUT /api/companies/[id]/contacts/[contactId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a company contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contactId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    console.log(`[API] Deleting contact ${params.contactId} for company ${params.id}`)

    const { data: contact, error } = await supabase
      .from('company_contacts')
      .delete()
      .eq('id', params.contactId)
      .eq('company_id', params.id) // Ensure the contact belongs to this company
      .select()
      .single()

    if (error) {
      console.error('Error deleting company contact:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/companies/[id]/contacts/[contactId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}