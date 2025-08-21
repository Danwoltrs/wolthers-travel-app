import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user information from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const supplierId = formData.get('supplier_id') as string
    const category = formData.get('category') as string || 'general'
    const year = formData.get('year') as string
    const tags = formData.get('tags') as string
    const metadata = formData.get('metadata') as string
    const autoOrganize = formData.get('auto_organize') === 'true'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    const uploadResults = []
    const errors = []

    for (const file of files) {
      try {
        const result = await uploadSingleDocument(supabase, file, {
          supplierId,
          category,
          year: year ? parseInt(year) : undefined,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          metadata: metadata ? JSON.parse(metadata) : {},
          autoOrganize,
          userId: user.id
        })
        uploadResults.push(result)
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        uploads: uploadResults,
        errors: errors.length > 0 ? errors : undefined,
        successCount: uploadResults.length,
        errorCount: errors.length
      }
    })

  } catch (error) {
    console.error('Error in document upload API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function uploadSingleDocument(
  supabase: any,
  file: File,
  options: {
    supplierId: string
    category: string
    year?: number
    tags: string[]
    metadata: any
    autoOrganize: boolean
    userId: string
  }
): Promise<any> {
  // Generate unique filename
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const fileExtension = file.name.split('.').pop()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `supplier-documents/${options.supplierId}/${timestamp}-${randomSuffix}-${sanitizedName}`

  // Upload file to Supabase Storage
  const { data: storageData, error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (storageError) {
    throw new Error(`File upload failed: ${storageError.message}`)
  }

  // Get file buffer for additional processing
  const fileBuffer = await file.arrayBuffer()
  const fileSize = file.size

  // Extract additional metadata based on file type
  const extractedMetadata = await extractFileMetadata(file, fileBuffer)
  const combinedMetadata = { ...options.metadata, ...extractedMetadata }

  // Determine document year
  const documentYear = options.year || 
                      extractedMetadata.year || 
                      new Date().getFullYear()

  // Create document record
  const documentData = {
    company_id: null, // This will be set based on supplier relationship
    supplier_id: options.supplierId,
    file_name: sanitizedName,
    file_path: storagePath,
    file_size: fileSize,
    file_type: file.type || 'application/octet-stream',
    mime_type: file.type || 'application/octet-stream',
    document_category: options.category,
    document_year: documentYear,
    harvest_year: extractedMetadata.harvestYear || documentYear,
    crop_season: extractedMetadata.cropSeason,
    crop_types: extractedMetadata.cropTypes || [],
    regions: extractedMetadata.regions || [],
    certifications: extractedMetadata.certifications || [],
    quality_grade: extractedMetadata.qualityGrade,
    urgency_level: determinePriority(options.category, extractedMetadata),
    tags: options.tags,
    description: extractedMetadata.description,
    access_level: 'internal',
    visible_to_company: false,
    visible_to_participants: true,
    crop_metadata: extractedMetadata.cropMetadata || {},
    contract_metadata: extractedMetadata.contractMetadata || {},
    quality_metadata: extractedMetadata.qualityMetadata || {},
    is_shared: false,
    created_by: options.userId,
    updated_by: options.userId
  }

  const { data: document, error: docError } = await supabase
    .from('company_documents')
    .insert([documentData])
    .select()
    .single()

  if (docError) {
    // Clean up uploaded file if document creation fails
    await supabase.storage.from('documents').remove([storagePath])
    throw new Error(`Document creation failed: ${docError.message}`)
  }

  // Auto-organize if requested
  if (options.autoOrganize) {
    try {
      await supabase.rpc('auto_organize_document', {
        p_document_id: document.id,
        p_supplier_id: options.supplierId
      })
    } catch (orgError) {
      console.warn('Auto-organization failed:', orgError)
      // Don't throw error as document is already created
    }
  }

  // Generate thumbnails for supported file types
  if (file.type.startsWith('image/') || file.type === 'application/pdf') {
    try {
      const thumbnailUrl = await generateThumbnail(supabase, storagePath, file.type)
      if (thumbnailUrl) {
        await supabase
          .from('company_documents')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', document.id)
      }
    } catch (thumbError) {
      console.warn('Thumbnail generation failed:', thumbError)
    }
  }

  // Log the upload action
  await supabase
    .from('company_access_logs')
    .insert([{
      company_id: null,
      user_id: options.userId,
      document_id: document.id,
      action_type: 'upload',
      action_details: {
        filename: sanitizedName,
        category: options.category,
        supplier_id: options.supplierId,
        auto_organized: options.autoOrganize
      }
    }])

  return {
    id: document.id,
    filename: sanitizedName,
    size: fileSize,
    type: file.type,
    category: options.category,
    year: documentYear,
    urgency: document.urgency_level,
    storagePath: storagePath,
    metadata: combinedMetadata
  }
}

async function extractFileMetadata(file: File, buffer: ArrayBuffer): Promise<any> {
  const metadata: any = {}

  try {
    // Extract metadata based on file type
    if (file.type === 'application/pdf') {
      metadata.extractedMetadata = await extractPDFMetadata(buffer)
    } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx')) {
      metadata.extractedMetadata = await extractSpreadsheetMetadata(buffer)
    } else if (file.type === 'text/csv') {
      metadata.extractedMetadata = await extractCSVMetadata(buffer)
    }

    // Extract information from filename
    const filenameMetadata = extractFilenameMetadata(file.name)
    Object.assign(metadata, filenameMetadata)

  } catch (error) {
    console.warn('Metadata extraction failed:', error)
  }

  return metadata
}

function extractFilenameMetadata(filename: string): any {
  const metadata: any = {}
  const lowerName = filename.toLowerCase()

  // Extract year from filename
  const yearMatch = filename.match(/\b(20\d{2})\b/)
  if (yearMatch) {
    metadata.year = parseInt(yearMatch[1])
  }

  // Extract season information
  const seasonMatch = lowerName.match(/(spring|summer|fall|autumn|winter|wet|dry|main|fly)/i)
  if (seasonMatch) {
    metadata.cropSeason = seasonMatch[1]
  }

  // Extract crop types
  if (lowerName.includes('arabica')) {
    metadata.cropTypes = [...(metadata.cropTypes || []), 'arabica']
  }
  if (lowerName.includes('robusta')) {
    metadata.cropTypes = [...(metadata.cropTypes || []), 'robusta']
  }

  // Extract regions (common coffee regions)
  const regions = ['antigua', 'huehuetenango', 'bourbon', 'typica', 'jamaica', 'kenya', 'ethiopia', 'colombia', 'brazil', 'guatemala', 'costa rica', 'honduras', 'nicaragua', 'panama']
  const foundRegions = regions.filter(region => lowerName.includes(region))
  if (foundRegions.length > 0) {
    metadata.regions = foundRegions
  }

  // Extract certifications
  const certifications = ['organic', 'fairtrade', 'rainforest', 'utz', 'bird friendly']
  const foundCertifications = certifications.filter(cert => lowerName.includes(cert))
  if (foundCertifications.length > 0) {
    metadata.certifications = foundCertifications
  }

  // Extract quality indicators
  if (lowerName.includes('specialty') || lowerName.includes('premium')) {
    metadata.qualityGrade = 'specialty'
  } else if (lowerName.includes('commercial')) {
    metadata.qualityGrade = 'commercial'
  }

  return metadata
}

async function extractPDFMetadata(buffer: ArrayBuffer): Promise<any> {
  // This would use a PDF parsing library like pdf-parse
  // For now, return placeholder metadata
  return {
    pageCount: 1,
    hasText: true,
    containsImages: false
  }
}

async function extractSpreadsheetMetadata(buffer: ArrayBuffer): Promise<any> {
  // This would use a library like xlsx to read spreadsheet metadata
  return {
    sheetCount: 1,
    hasCharts: false,
    hasFormulas: false
  }
}

async function extractCSVMetadata(buffer: ArrayBuffer): Promise<any> {
  try {
    const text = new TextDecoder().decode(buffer)
    const lines = text.split('\n')
    const rowCount = lines.length - 1 // Exclude header
    
    // Get column headers
    const headers = lines[0] ? lines[0].split(',').map(h => h.trim()) : []
    
    return {
      rowCount,
      columnCount: headers.length,
      headers: headers.slice(0, 10), // First 10 headers
      hasHeaders: headers.length > 0
    }
  } catch (error) {
    return {}
  }
}

function determinePriority(category: string, metadata: any): string {
  // Determine priority based on category and metadata
  if (category === 'crop_forecast' || metadata.urgency === 'critical') {
    return 'high'
  } else if (category === 'contract' || category === 'quality_analysis') {
    return 'medium'
  } else if (metadata.urgency === 'low' || category === 'correspondence') {
    return 'low'
  } else {
    return 'medium'
  }
}

async function generateThumbnail(supabase: any, storagePath: string, fileType: string): Promise<string | null> {
  try {
    // This would implement thumbnail generation
    // For now, return a placeholder URL
    const thumbnailPath = `thumbnails/${storagePath.replace(/\.[^/.]+$/, '')}_thumb.jpg`
    
    // In a real implementation, you would:
    // 1. Download the original file
    // 2. Generate a thumbnail using Sharp, Canvas, or similar
    // 3. Upload the thumbnail to storage
    // 4. Return the public URL
    
    return `/api/documents/coffee-supply/thumbnail/${encodeURIComponent(storagePath)}`
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return null
  }
}