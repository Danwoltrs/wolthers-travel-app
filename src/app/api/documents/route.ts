import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const searchParams = request.nextUrl.searchParams
    
    const companyId = searchParams.get('company_id')
    const labId = searchParams.get('lab_id')
    const meetingId = searchParams.get('meeting_id')
    const userId = searchParams.get('user_id') // Current user for permission filtering
    const documentType = searchParams.get('document_type')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build base query
    let query = supabase
      .from('documents')
      .select(`
        *,
        meetings (
          id,
          title,
          date,
          companies (id, name, fantasy_name)
        ),
        users!documents_uploaded_by_fkey (
          id,
          full_name,
          email
        )
      `)

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    if (labId) {
      query = query.eq('lab_id', labId)
    }
    
    if (meetingId) {
      query = query.eq('meeting_id', meetingId)
    }
    
    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    // Apply permission filtering if userId provided
    if (userId) {
      // Get user's permissions through document_permissions table or meeting participation
      const { data: userPermissions } = await supabase
        .from('document_permissions')
        .select('document_id')
        .eq('user_id', userId)
      
      const { data: userMeetings } = await supabase
        .from('meeting_participants')
        .select('meeting_id')
        .eq('user_id', userId)
      
      const allowedDocumentIds = userPermissions?.map(p => p.document_id) || []
      const allowedMeetingIds = userMeetings?.map(m => m.meeting_id) || []
      
      if (allowedDocumentIds.length > 0 || allowedMeetingIds.length > 0) {
        query = query.or(
          `id.in.(${allowedDocumentIds.join(',')}),meeting_id.in.(${allowedMeetingIds.join(',')})`
        )
      }
      
      // Always allow Brazil lab (main office) to see all documents
      const { data: userLabs } = await supabase
        .from('user_labs')
        .select('labs (is_main_office)')
        .eq('user_id', userId)
      
      const hasMainOfficeAccess = userLabs?.some(ul => ul.labs?.is_main_office)
      if (!hasMainOfficeAccess && allowedDocumentIds.length === 0 && allowedMeetingIds.length === 0) {
        // User has no permissions, return empty result
        return NextResponse.json({ documents: [] })
      }
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error('Error in documents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = await request.json()
    
    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert([{
        filename: body.filename,
        original_filename: body.original_filename,
        file_type: body.file_type,
        file_size: body.file_size,
        storage_path: body.storage_path,
        meeting_id: body.meeting_id,
        company_id: body.company_id,
        lab_id: body.lab_id,
        uploaded_by: body.uploaded_by,
        document_type: body.document_type || 'meeting_document'
      }])
      .select()
      .single()

    if (docError) {
      console.error('Error creating document:', docError)
      return NextResponse.json(
        { error: 'Failed to create document', details: docError.message },
        { status: 500 }
      )
    }

    // Create permissions based on meeting participants if meeting_id provided
    if (body.meeting_id && document) {
      const { data: participants } = await supabase
        .from('meeting_participants')
        .select('user_id, company_id')
        .eq('meeting_id', body.meeting_id)
      
      if (participants && participants.length > 0) {
        const permissions = participants.map(p => ({
          document_id: document.id,
          user_id: p.user_id,
          company_id: p.company_id,
          access_level: 'read',
          granted_by: body.uploaded_by
        }))
        
        await supabase
          .from('document_permissions')
          .insert(permissions)
      }
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error in create document API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}