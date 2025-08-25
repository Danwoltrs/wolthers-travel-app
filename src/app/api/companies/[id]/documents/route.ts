import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get documents from trips this company participated in
    const { data: documents, error } = await supabase
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
        trips!inner (
          id,
          title,
          trip_code,
          trip_participants!inner (
            company_id
          )
        )
      `)
      .eq('trips.trip_participants.company_id', params.id)
      .eq('is_public', true) // Only public documents
      .order('uploaded_at', { ascending: false })

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

    return NextResponse.json({
      documents: transformedDocuments,
      count: transformedDocuments.length,
      message: transformedDocuments.length === 0 
        ? 'No documents available for this company'
        : `Found ${transformedDocuments.length} documents from trips`
    })
  } catch (error) {
    console.error('Error in company documents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}