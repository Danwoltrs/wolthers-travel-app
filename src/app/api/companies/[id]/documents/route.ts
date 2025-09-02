import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: companyId } = await params
    
    // Validate companyId
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    // First, get company details to determine type (buyer/supplier)
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, category')
      .eq('id', companyId)
      .single()

    if (companyError) {
      console.error('Error fetching company:', companyError)
      return NextResponse.json(
        { error: 'Company not found', details: companyError.message },
        { status: 404 }
      )
    }

    let documentsQuery

    if (company.category === 'buyer') {
      // For Buyers: All files and ALL trip notes from meetings they participated in (including all 5 notes from Cooxupe meetings)
      documentsQuery = supabase
        .from('trip_documents')
        .select(`
          id,
          filename,
          file_path,
          file_size,
          file_type,
          uploaded_at,
          description,
          is_public,
          trip_id,
          document_type,
          uploaded_by,
          trips!inner (
            id,
            title,
            trip_code,
            trip_participants!inner (
              company_id,
              is_meeting_attendee
            )
          )
        `)
        .eq('trips.trip_participants.company_id', companyId)
        .eq('trips.trip_participants.is_meeting_attendee', true) // Only meetings they attended
        .eq('is_public', true)
        .order('uploaded_at', { ascending: false })
        
    } else if (company.category === 'supplier') {
      // For Suppliers: Files they sent to us + trip notes from meetings we had with them
      documentsQuery = supabase
        .from('trip_documents')
        .select(`
          id,
          filename,
          file_path,
          file_size,
          file_type,
          uploaded_at,
          description,
          is_public,
          trip_id,
          document_type,
          uploaded_by,
          trips!inner (
            id,
            title,
            trip_code,
            trip_participants!inner (
              company_id
            )
          )
        `)
        .eq('trips.trip_participants.company_id', companyId)
        .or(`uploaded_by.eq.${companyId},document_type.eq.trip_notes`) // Files they uploaded OR trip notes
        .eq('is_public', true)
        .order('uploaded_at', { ascending: false })
        
    } else {
      // For service providers (Wolthers) or other types: all documents they have access to
      documentsQuery = supabase
        .from('trip_documents')
        .select(`
          id,
          filename,
          file_path,
          file_size,
          file_type,
          uploaded_at,
          description,
          is_public,
          trip_id,
          document_type,
          uploaded_by,
          trips!inner (
            id,
            title,
            trip_code,
            trip_participants!inner (
              company_id
            )
          )
        `)
        .eq('trips.trip_participants.company_id', companyId)
        .eq('is_public', true)
        .order('uploaded_at', { ascending: false })
    }

    const { data: documents, error } = await documentsQuery

    if (error) {
      console.error('Error fetching company documents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch company documents', details: error.message },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedDocuments = documents?.map(doc => ({
      ...doc,
      trip_title: doc.trips?.title,
      trip_code: doc.trips?.trip_code,
      file_size_mb: doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) : null
    })) || []

    const permissionMessage = company.category === 'buyer' 
      ? 'documents and all meeting notes from meetings attended'
      : company.category === 'supplier'
      ? 'documents sent and trip notes from meetings'
      : 'accessible documents from trips'

    return NextResponse.json({
      documents: transformedDocuments,
      count: transformedDocuments.length,
      company_category: company.category,
      message: transformedDocuments.length === 0 
        ? `No ${permissionMessage} available for this company`
        : `Found ${transformedDocuments.length} ${permissionMessage}`
    })
  } catch (error) {
    console.error('Error in company documents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}