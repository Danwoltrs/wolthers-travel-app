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

    // Get documents associated with this company
    // Since documents table doesn't have trip_id, we'll get documents directly by company_id
    documentsQuery = supabase
      .from('documents')
      .select(`
        id,
        filename,
        original_filename,
        file_type,
        file_size,
        storage_path,
        meeting_id,
        company_id,
        document_type,
        created_at,
        updated_at,
        uploaded_by
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

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
      file_path: doc.storage_path, // Map storage_path to file_path for frontend compatibility
      uploaded_at: doc.created_at, // Map created_at to uploaded_at for frontend compatibility
      file_size_mb: doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) : null
    })) || []

    return NextResponse.json({
      documents: transformedDocuments,
      count: transformedDocuments.length,
      company_category: company.category,
      message: transformedDocuments.length === 0 
        ? `No documents available for this company`
        : `Found ${transformedDocuments.length} documents for this company`
    })
  } catch (error) {
    console.error('Error in company documents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}