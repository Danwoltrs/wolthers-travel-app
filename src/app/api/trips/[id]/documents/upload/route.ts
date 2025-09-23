import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifySessionToken, extractBearerToken } from '@/lib/jwt-utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id: tripId } = await params

    console.log(`📄 Document Upload: Starting upload for trip ${tripId}`)

    // Authentication check using JWT tokens (same pattern as other endpoints)
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = extractBearerToken(authHeader)
      console.log(`📄 Document Upload: Using Authorization header token`)
    } else if (cookieToken) {
      token = cookieToken
      console.log(`📄 Document Upload: Using cookie token`)
    } else {
      console.log(`📄 Document Upload: No token found`)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify JWT token
    const decoded = verifySessionToken(token)
    if (!decoded?.userId) {
      console.log(`📄 Document Upload: JWT verification failed`)
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, company_id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      console.log(`📄 Document Upload: User lookup failed:`, userError)
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    console.log(`📄 Document Upload: Successfully authenticated user: ${user.email}`)

    // Determine if tripId is a UUID or an access code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tripId)

    console.log(`📄 Document Upload: Looking up trip with ${isUUID ? 'UUID' : 'access code'}: ${tripId}`)

    // Query trip by ID or access code with optimized field selection
    let tripQuery
    if (isUUID) {
      tripQuery = supabase
        .from('trips')
        .select('id, title, access_code, status, start_date')
        .eq('id', tripId)
        .maybeSingle() // Use maybeSingle() instead of single() for better error handling
    } else {
      tripQuery = supabase
        .from('trips')
        .select('id, title, access_code, status, start_date')
        .eq('access_code', tripId)
        .maybeSingle() // Use maybeSingle() instead of single() for better error handling
    }

    const { data: trip, error: tripError } = await tripQuery

    console.log(`📄 Document Upload: Trip lookup result:`, {
      found: !!trip,
      error: tripError?.message,
      tripTitle: trip?.title,
      lookupType: isUUID ? 'UUID' : 'access_code',
      lookupValue: tripId
    })

    if (tripError || !trip) {
      console.error(`📄 Document Upload: Trip lookup failed`, {
        lookupType: isUUID ? 'UUID' : 'access_code',
        lookupValue: tripId,
        error: tripError?.message || 'Trip not found',
        errorCode: tripError?.code,
        hint: tripError?.hint
      })

      // Return different error messages based on lookup type for better debugging
      const errorMessage = isUUID
        ? 'Trip not found. Please check the trip ID.'
        : 'Trip not found. Please check the trip access code.'

      return NextResponse.json({
        error: errorMessage,
        details: {
          lookupType: isUUID ? 'UUID' : 'access_code',
          lookupValue: tripId
        }
      }, { status: 404 })
    }

    console.log(`📄 Document Upload: Found trip: ${trip.title}`)

    // Check if user has access to this trip (use resolved trip.id, not original tripId)
    const { data: participant, error: participantError } = await supabase
      .from('trip_participants')
      .select('id, role')
      .eq('trip_id', trip.id)
      .eq('user_id', user.id)
      .maybeSingle() // Use maybeSingle() for better error handling

    if (participantError) {
      console.error(`📄 Document Upload: Error checking participant access:`, {
        tripId: trip.id,
        userId: user.id,
        error: participantError.message
      })
      return NextResponse.json({ error: 'Error verifying trip access' }, { status: 500 })
    }

    if (!participant) {
      console.log(`📄 Document Upload: User ${user.email} is not a participant in trip ${trip.id} (${trip.title})`)
      return NextResponse.json({ error: 'Access denied - not a trip participant' }, { status: 403 })
    }

    console.log(`📄 Document Upload: User ${user.email} has ${participant.role} access to trip ${trip.id} (${trip.title})`)

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const category = formData.get('category') as string || 'general'
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadResults = []
    const errors = []

    for (const file of files) {
      try {
        const result = await uploadTripDocument(supabase, file, {
          tripId: trip.id,
          category,
          description,
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          userId: user.id,
          tripTitle: trip.title,
          tripStartDate: trip.start_date
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
    console.error('Error in trip document upload API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function uploadTripDocument(
  supabase: any,
  file: File,
  options: {
    tripId: string
    category: string
    description?: string
    tags: string[]
    userId: string
    tripTitle?: string
    tripStartDate?: string
  }
): Promise<any> {
  // Get trip details for semantic folder structure
  const { data: tripData } = await supabase
    .from('trips')
    .select('title, start_date, access_code')
    .eq('id', options.tripId)
    .single()

  // Create semantic folder structure: seminar-name/2025/file.pdf
  const tripName = tripData?.title || options.tripTitle || 'unknown-trip'
  const tripYear = tripData?.start_date ? new Date(tripData.start_date).getFullYear() : new Date().getFullYear()
  const accessCode = tripData?.access_code || 'no-code'

  // Enhanced folder naming strategy for recurring conferences
  let folderName = tripName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()

  // For recurring conferences, include access code prefix for uniqueness
  // Example: "first-watch-supplier-summit" + "FWSS-SEP25" → "fwss-first-watch-supplier-summit"
  if (accessCode && accessCode !== 'no-code') {
    const codePrefix = accessCode.split('-')[0].toLowerCase() // Extract "FWSS" from "FWSS-SEP25"
    if (codePrefix.length >= 3) {
      folderName = `${codePrefix}-${folderName}`
    }
  }

  // Generate unique filename with timestamp to prevent conflicts
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const fileExtension = file.name.split('.').pop()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const uniqueFileName = `${timestamp}-${randomSuffix}-${sanitizedFileName}`

  // Enhanced semantic path: prefix-trip-name/year/unique-filename.ext
  const storagePath = `${folderName}/${tripYear}/${uniqueFileName}`

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

  // Extract coffee crop and supply information from the document
  const fileBuffer = await file.arrayBuffer()
  const extractedInfo = await extractCoffeeInfo(file, fileBuffer, sanitizedName)

  // Automatically determine category based on extracted info
  const autoCategory = determineCategoryFromContent(extractedInfo, options.category)

  // Create document record with extracted coffee information
  const documentData = {
    trip_id: options.tripId,
    filename: sanitizedName,
    original_filename: file.name,
    file_type: file.type || 'application/octet-stream',
    file_size: file.size,
    storage_path: storagePath,
    category: autoCategory,
    description: options.description || extractedInfo.autoDescription,
    tags: [...options.tags, ...extractedInfo.autoTags],
    uploaded_by: options.userId,
    document_type: 'trip_document',
    access_level: 'trip_participants', // Anyone who was at this trip can access
    is_shared: true,
    sharing_policy: 'trip_participants_only',
    visibility: 'trip_participants',
    // Coffee-specific metadata
    coffee_metadata: extractedInfo.coffeeMetadata,
    crop_numbers: extractedInfo.cropNumbers,
    supply_info: extractedInfo.supplyInfo,
    harvest_year: extractedInfo.harvestYear,
    crop_season: extractedInfo.cropSeason,
    regions: extractedInfo.regions,
    suppliers: extractedInfo.suppliers,
    quality_grades: extractedInfo.qualityGrades,
    certifications: extractedInfo.certifications,
    urgency_level: extractedInfo.urgencyLevel
  }

  const { data: document, error: docError } = await supabase
    .from('documents')
    .insert([documentData])
    .select()
    .single()

  if (docError) {
    console.error(`📄 Document Upload: Document creation failed:`, {
      error: docError.message,
      code: docError.code,
      details: docError.details,
      hint: docError.hint,
      tripId: options.tripId,
      filename: sanitizedName
    })

    // Clean up uploaded file if document creation fails
    const { error: deleteError } = await supabase.storage.from('documents').remove([storagePath])
    if (deleteError) {
      console.warn(`📄 Document Upload: Failed to clean up storage file after document creation failure:`, deleteError.message)
    }

    throw new Error(`Document creation failed: ${docError.message}`)
  }

  console.log(`📄 Document Upload: Successfully created document record with ID: ${document.id}`)

  // Create document permissions for all trip participants (anyone who was at this trip)
  const { data: participants } = await supabase
    .from('trip_participants')
    .select('user_id, role, users!inner(email, full_name)')
    .eq('trip_id', options.tripId)

  console.log(`📄 Document Upload: Granting access to ${participants?.length || 0} trip participants for trip ${options.tripId}`)

  if (participants && participants.length > 0) {
    // Log who gets access
    participants.forEach(p => {
      console.log(`   ✓ Access granted to: ${p.users?.email} (${p.role})`)
    })

    // Grant read access to all trip participants
    const permissions = participants.map(p => ({
      document_id: document.id,
      user_id: p.user_id,
      access_level: 'read', // All trip participants can read
      granted_by: options.userId,
      granted_at: new Date().toISOString()
    }))

    // Grant write access to uploader and trip organizers/staff
    const uploaderPermission = {
      document_id: document.id,
      user_id: options.userId,
      access_level: 'write', // Uploader can edit/delete
      granted_by: options.userId,
      granted_at: new Date().toISOString()
    }

    await supabase
      .from('document_permissions')
      .insert([uploaderPermission, ...permissions])

    console.log(`📄 Document Upload: Successfully created permissions for document ${document.id}`)
  } else {
    console.log(`⚠️ Document Upload: No participants found for trip ${options.tripId}`)
  }

  // Get public URL for the uploaded file
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(storagePath)

  // If coffee information was detected, automatically pull related crop & supply data
  if (extractedInfo.cropNumbers.length > 0 || extractedInfo.supplyInfo.length > 0) {
    try {
      await pullRelatedCoffeeData(supabase, document.id, extractedInfo, options.tripId)
    } catch (error) {
      console.warn('Failed to pull related coffee data:', error)
      // Don't fail the upload, just log the warning
    }
  }

  return {
    id: document.id,
    filename: sanitizedName,
    originalFilename: file.name,
    size: file.size,
    type: file.type,
    category: autoCategory,
    description: options.description || extractedInfo.autoDescription,
    tags: [...options.tags, ...extractedInfo.autoTags],
    storagePath: storagePath,
    downloadUrl: urlData.publicUrl,
    uploadedAt: new Date().toISOString(),
    // Coffee-specific return data
    coffeeInfo: {
      cropNumbers: extractedInfo.cropNumbers,
      supplyInfo: extractedInfo.supplyInfo,
      harvestYear: extractedInfo.harvestYear,
      regions: extractedInfo.regions,
      suppliers: extractedInfo.suppliers,
      autoRecognized: extractedInfo.cropNumbers.length > 0 || extractedInfo.supplyInfo.length > 0
    }
  }
}

async function extractCoffeeInfo(file: File, buffer: ArrayBuffer, filename: string): Promise<any> {
  const extractedInfo = {
    cropNumbers: [] as string[],
    supplyInfo: [] as string[],
    harvestYear: null as number | null,
    cropSeason: null as string | null,
    regions: [] as string[],
    suppliers: [] as string[],
    qualityGrades: [] as string[],
    certifications: [] as string[],
    urgencyLevel: 'medium' as string,
    autoTags: [] as string[],
    autoDescription: null as string | null,
    coffeeMetadata: {} as any
  }

  try {
    let textContent = ''

    // Extract text content based on file type
    if (file.type === 'application/pdf') {
      textContent = await extractPDFText(buffer)
    } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      textContent = await extractSpreadsheetText(buffer)
    } else if (file.type === 'text/csv') {
      textContent = new TextDecoder().decode(buffer)
    } else if (file.type === 'text/plain') {
      textContent = new TextDecoder().decode(buffer)
    }

    // Combine filename and content for analysis
    const combinedText = `${filename} ${textContent}`.toLowerCase()

    // Extract crop numbers (common patterns: LOT123, CROP-2024-001, C240001, etc.)
    const cropNumberPatterns = [
      /\b(?:lot|crop|batch|contract|ref)[:\s#-]*([a-z0-9-]{3,20})\b/gi,
      /\b[c|l|b][0-9]{2,6}\b/gi,
      /\b[0-9]{2,4}[-\/][0-9]{2,6}\b/gi,
      /\b(?:guatemala|honduras|nicaragua|colombia|brazil|ethiopia|kenya)[-\s][a-z0-9]{2,10}\b/gi
    ]

    cropNumberPatterns.forEach(pattern => {
      const matches = combinedText.match(pattern)
      if (matches) {
        extractedInfo.cropNumbers.push(...matches.map(m => m.trim().toUpperCase()))
      }
    })

    // Extract supply information
    const supplyPatterns = [
      /\b(?:supply|shipment|container|delivery)[:\s#-]*([a-z0-9-]{3,20})\b/gi,
      /\b(?:scl|spi|sup)[0-9]{3,8}\b/gi,
      /\b[s|d][0-9]{4,8}\b/gi
    ]

    supplyPatterns.forEach(pattern => {
      const matches = combinedText.match(pattern)
      if (matches) {
        extractedInfo.supplyInfo.push(...matches.map(m => m.trim().toUpperCase()))
      }
    })

    // Extract harvest year
    const yearMatch = combinedText.match(/\b(?:harvest|crop|year)[:\s]*(?:20)?(2[0-4]|1[5-9])\b/i)
    if (yearMatch) {
      const year = parseInt(yearMatch[1])
      extractedInfo.harvestYear = year > 50 ? 1900 + year : 2000 + year
    } else {
      // Fallback to any 4-digit year between 2015-2030
      const fallbackYear = combinedText.match(/\b(20[1-3][0-9])\b/)
      if (fallbackYear) {
        extractedInfo.harvestYear = parseInt(fallbackYear[1])
      }
    }

    // Extract crop season
    const seasonMatch = combinedText.match(/\b(spring|summer|fall|autumn|winter|wet|dry|main|fly|primera|segunda)\b/i)
    if (seasonMatch) {
      extractedInfo.cropSeason = seasonMatch[1].toLowerCase()
    }

    // Extract regions
    const coffeeRegions = [
      'antigua', 'huehuetenango', 'atitlan', 'fraijanes', 'coban', 'nuevo oriente', 'acatenango', 'san marcos',
      'copan', 'santa barbara', 'comayagua', 'el paraiso', 'la paz', 'marcala',
      'jinotega', 'nueva segovia', 'matagalpa', 'madriz', 'esteli',
      'narino', 'huila', 'cauca', 'valle', 'risaralda', 'quindio', 'caldas', 'tolima',
      'minas gerais', 'sao paulo', 'espirito santo', 'bahia', 'cerrado', 'sul de minas',
      'yirgacheffe', 'sidamo', 'harrar', 'limu', 'djimmah', 'lekempti',
      'nyeri', 'kirinyaga', 'murang\'a', 'kiambu', 'embu', 'nakuru'
    ]

    coffeeRegions.forEach(region => {
      if (combinedText.includes(region)) {
        extractedInfo.regions.push(region)
      }
    })

    // Extract suppliers/farms
    const supplierPatterns = [
      /\b(?:finca|farm|estate|plantation|cooperative|coop)[:\s]+([a-z\s]{3,30})\b/gi,
      /\b([a-z\s]{3,20})\s+(?:farm|estate|plantation|finca)\b/gi
    ]

    supplierPatterns.forEach(pattern => {
      const matches = combinedText.match(pattern)
      if (matches) {
        extractedInfo.suppliers.push(...matches.map(m => m.trim()))
      }
    })

    // Extract quality grades
    const qualityTerms = ['specialty', 'premium', 'commercial', 'gourmet', 'estate', 'micro-lot', 'single origin']
    qualityTerms.forEach(term => {
      if (combinedText.includes(term)) {
        extractedInfo.qualityGrades.push(term)
      }
    })

    // Extract certifications
    const certifications = ['organic', 'fairtrade', 'rainforest alliance', 'utz', 'bird friendly', '4c', 'cafe practices']
    certifications.forEach(cert => {
      if (combinedText.includes(cert)) {
        extractedInfo.certifications.push(cert)
      }
    })

    // Determine urgency level
    if (combinedText.includes('urgent') || combinedText.includes('critical') || combinedText.includes('immediate')) {
      extractedInfo.urgencyLevel = 'high'
    } else if (combinedText.includes('contract') || combinedText.includes('quality') || extractedInfo.cropNumbers.length > 0) {
      extractedInfo.urgencyLevel = 'medium'
    } else {
      extractedInfo.urgencyLevel = 'low'
    }

    // Generate auto tags
    if (extractedInfo.cropNumbers.length > 0) {
      extractedInfo.autoTags.push('crop-numbers', 'coffee-lots')
    }
    if (extractedInfo.supplyInfo.length > 0) {
      extractedInfo.autoTags.push('supply-chain', 'logistics')
    }
    if (extractedInfo.regions.length > 0) {
      extractedInfo.autoTags.push('regional-coffee', ...extractedInfo.regions.slice(0, 3))
    }
    if (extractedInfo.certifications.length > 0) {
      extractedInfo.autoTags.push('certified-coffee', ...extractedInfo.certifications.slice(0, 2))
    }

    // Generate auto description
    if (extractedInfo.cropNumbers.length > 0 || extractedInfo.supplyInfo.length > 0) {
      const parts = []
      if (extractedInfo.cropNumbers.length > 0) {
        parts.push(`Contains ${extractedInfo.cropNumbers.length} coffee crop number(s)`)
      }
      if (extractedInfo.supplyInfo.length > 0) {
        parts.push(`Supply chain reference(s) detected`)
      }
      if (extractedInfo.regions.length > 0) {
        parts.push(`From ${extractedInfo.regions.slice(0, 2).join(', ')} region(s)`)
      }
      extractedInfo.autoDescription = parts.join('; ')
    }

    // Store metadata
    extractedInfo.coffeeMetadata = {
      textExtracted: textContent.length > 0,
      patternsFound: extractedInfo.cropNumbers.length + extractedInfo.supplyInfo.length,
      confidence: calculateConfidence(extractedInfo),
      extractedAt: new Date().toISOString()
    }

  } catch (error) {
    console.warn('Coffee information extraction failed:', error)
  }

  // Remove duplicates
  extractedInfo.cropNumbers = [...new Set(extractedInfo.cropNumbers)]
  extractedInfo.supplyInfo = [...new Set(extractedInfo.supplyInfo)]
  extractedInfo.regions = [...new Set(extractedInfo.regions)]
  extractedInfo.suppliers = [...new Set(extractedInfo.suppliers)]
  extractedInfo.qualityGrades = [...new Set(extractedInfo.qualityGrades)]
  extractedInfo.certifications = [...new Set(extractedInfo.certifications)]
  extractedInfo.autoTags = [...new Set(extractedInfo.autoTags)]

  return extractedInfo
}

function determineCategoryFromContent(extractedInfo: any, originalCategory: string): string {
  // Auto-categorize based on extracted content
  if (extractedInfo.cropNumbers.length > 0) {
    return 'crop_analysis'
  }
  if (extractedInfo.supplyInfo.length > 0) {
    return 'supply_chain'
  }
  if (extractedInfo.qualityGrades.length > 0) {
    return 'quality_control'
  }
  if (extractedInfo.certifications.length > 0) {
    return 'certifications'
  }
  if (extractedInfo.suppliers.length > 0) {
    return 'supplier_info'
  }

  return originalCategory || 'general'
}

function calculateConfidence(extractedInfo: any): number {
  let score = 0
  if (extractedInfo.cropNumbers.length > 0) score += 40
  if (extractedInfo.supplyInfo.length > 0) score += 30
  if (extractedInfo.regions.length > 0) score += 20
  if (extractedInfo.harvestYear) score += 10

  return Math.min(score, 100)
}

async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  // Placeholder for PDF text extraction
  // In a real implementation, you would use a library like pdf-parse
  try {
    const text = new TextDecoder().decode(buffer.slice(0, 1000)) // Sample first 1KB
    return text.replace(/[^\x20-\x7E]/g, ' ') // Remove non-printable chars
  } catch {
    return ''
  }
}

async function extractSpreadsheetText(buffer: ArrayBuffer): Promise<string> {
  // Placeholder for spreadsheet text extraction
  // In a real implementation, you would use a library like xlsx
  try {
    const text = new TextDecoder().decode(buffer.slice(0, 2000)) // Sample first 2KB
    return text.replace(/[^\x20-\x7E]/g, ' ') // Remove non-printable chars
  } catch {
    return ''
  }
}

async function pullRelatedCoffeeData(supabase: any, documentId: string, extractedInfo: any, tripId: string): Promise<void> {
  try {
    // Look up related coffee data based on crop numbers and supply info
    const searchTerms = [...extractedInfo.cropNumbers, ...extractedInfo.supplyInfo]

    if (searchTerms.length === 0) return

    // Search for related company documents in coffee supply system
    const { data: relatedDocs } = await supabase
      .from('company_documents')
      .select('id, file_name, crop_numbers, supply_info, coffee_metadata')
      .or(searchTerms.map(term => `crop_numbers.cs.{${term}},supply_info.cs.{${term}}`).join(','))
      .limit(20)

    if (relatedDocs && relatedDocs.length > 0) {
      // Create document relationships
      const relationships = relatedDocs.map(doc => ({
        document_id: documentId,
        related_document_id: doc.id,
        relationship_type: 'coffee_supply_chain',
        confidence_score: calculateRelationshipConfidence(extractedInfo, doc),
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('document_relationships')
        .insert(relationships)

      // Log the automatic linking
      await supabase
        .from('company_access_logs')
        .insert([{
          trip_id: tripId,
          document_id: documentId,
          action_type: 'auto_link',
          action_details: {
            linked_documents: relatedDocs.length,
            search_terms: searchTerms,
            auto_recognized: true
          }
        }])
    }

    // Pull crop information from external coffee database (if available)
    for (const cropNumber of extractedInfo.cropNumbers) {
      try {
        const cropData = await fetchCropInformation(cropNumber)
        if (cropData) {
          // Store additional crop information
          await supabase
            .from('coffee_crop_data')
            .upsert({
              crop_number: cropNumber,
              document_id: documentId,
              trip_id: tripId,
              crop_data: cropData,
              last_updated: new Date().toISOString()
            })
        }
      } catch (error) {
        console.warn(`Failed to fetch crop data for ${cropNumber}:`, error)
      }
    }

  } catch (error) {
    console.error('Failed to pull related coffee data:', error)
    throw error
  }
}

function calculateRelationshipConfidence(extractedInfo: any, relatedDoc: any): number {
  let confidence = 0

  // Check for matching crop numbers
  const matchingCrops = extractedInfo.cropNumbers.filter(crop =>
    relatedDoc.crop_numbers && relatedDoc.crop_numbers.includes(crop)
  )
  confidence += matchingCrops.length * 30

  // Check for matching supply info
  const matchingSupply = extractedInfo.supplyInfo.filter(supply =>
    relatedDoc.supply_info && relatedDoc.supply_info.includes(supply)
  )
  confidence += matchingSupply.length * 25

  // Check for matching regions
  if (extractedInfo.regions.length > 0 && relatedDoc.regions) {
    const matchingRegions = extractedInfo.regions.filter(region =>
      relatedDoc.regions.includes(region)
    )
    confidence += matchingRegions.length * 15
  }

  return Math.min(confidence, 100)
}

async function fetchCropInformation(cropNumber: string): Promise<any | null> {
  try {
    // This would integrate with external coffee databases
    // For now, return placeholder data structure
    return {
      cropNumber,
      quality: 'Unknown',
      origin: 'Unknown',
      harvestDate: null,
      certifications: [],
      lastUpdated: new Date().toISOString(),
      source: 'auto_recognized'
    }
  } catch (error) {
    console.warn(`Failed to fetch external crop data for ${cropNumber}:`, error)
    return null
  }
}