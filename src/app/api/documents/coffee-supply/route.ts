import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verify } from 'jsonwebtoken'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Use the same authentication logic as working APIs
    const authToken = request.cookies.get('auth-token')?.value
    
    if (!authToken) {
      console.log('🔑 Coffee Supply API: No auth-token cookie found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the JWT token (same as working APIs)
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'fallback-secret'
    let user: any = null
    
    try {
      const decoded = verify(authToken, secret) as any
      console.log('🔑 Coffee Supply API: JWT Token decoded successfully:', { userId: decoded.userId })
      
      // Get user from database using server client
      const supabase = createServerSupabaseClient()
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single()

      if (userError) {
        console.log('🔑 Coffee Supply API: Database query failed:', userError)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }
      
      if (!userData) {
        console.log('🔑 Coffee Supply API: No user data found')
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }

      user = userData
      console.log('🔑 Coffee Supply API: Successfully authenticated user:', user.email)
      
    } catch (jwtError) {
      console.log('🔑 Coffee Supply API: JWT verification failed:', jwtError.message)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Use service role client for database queries (bypasses RLS)
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
    const searchParams = request.nextUrl.searchParams

    // Parameters for supplier document management
    const action = searchParams.get('action') || 'suppliers' // suppliers, documents, search
    const supplierId = searchParams.get('supplier_id')
    const year = searchParams.get('year')
    const category = searchParams.get('category')
    const searchQuery = searchParams.get('q')
    const sortBy = searchParams.get('sort_by') || 'name'
    const sortDirection = searchParams.get('sort_direction') || 'asc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Trip-specific filtering parameters
    const tripId = searchParams.get('tripId') || searchParams.get('trip_id')
    const includeGeneral = searchParams.get('include_general') === 'true'
    
    // Filters
    const fileTypes = searchParams.get('file_types')?.split(',') || []
    const urgencyLevels = searchParams.get('urgency')?.split(',') || []
    const categories = searchParams.get('categories')?.split(',') || []
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    switch (action) {
      case 'suppliers':
        return await getSuppliers(serviceSupabase, { 
          sortBy, 
          sortDirection, 
          limit, 
          offset, 
          tripId, 
          includeAll: includeGeneral 
        })
      
      case 'documents':
        return await getDocuments(serviceSupabase, {
          supplierId,
          year: year ? parseInt(year) : undefined,
          category,
          searchQuery,
          sortBy,
          sortDirection,
          limit,
          offset,
          fileTypes,
          urgencyLevels,
          categories,
          dateFrom,
          dateTo,
          tripId,
          includeGeneral
        })
      
      case 'search':
        return await searchDocuments(serviceSupabase, {
          query: searchQuery || '',
          supplierId,
          limit,
          offset,
          fileTypes,
          categories,
          tripId
        })
      
      case 'crop-dashboard':
        return await getCropInformation(serviceSupabase, { 
          limit, 
          urgencyLevels,
          tripId 
        })
      
      case 'statistics':
        return await getDocumentStatistics(serviceSupabase, { 
          supplierId,
          tripId 
        })
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in coffee supply documents API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getSuppliers(
  supabase: any, 
  options: { 
    sortBy: string; 
    sortDirection: string; 
    limit: number; 
    offset: number;
    tripId?: string | null;
    includeAll?: boolean;
  }
) {
  try {
    // Use the new database function for trip-aware supplier filtering
    if (options.tripId) {
      const { data: companies, error: companiesError } = await supabase
        .rpc('get_trip_suppliers', {
          p_trip_id: options.tripId,
          p_include_all: options.includeAll || true,
          p_sort_by: options.sortBy === 'name' ? 'name' : options.sortBy,
          p_sort_direction: options.sortDirection,
          p_limit: options.limit,
          p_offset: options.offset
        })

      if (companiesError) {
        console.error('Error fetching trip suppliers:', companiesError)
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
      }

      const suppliers = companies?.map((company: any) => ({
        id: company.id,
        name: company.name,
        path: `/documents/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
        supplierId: company.id,
        itemCount: company.trip_documents || 0,
        documentCount: company.trip_documents || 0,
        folderCount: 1,
        totalSize: 0, // Would need aggregation
        lastModified: new Date(company.created_at),
        createdDate: new Date(company.created_at),
        subFolders: [], // Will be populated later if needed
        recentDocuments: [],
        supplierInfo: {
          id: company.id,
          name: company.fantasy_name || company.name,
          country: company.country || 'Unknown',
          contactPerson: '',
          email: '',
          relationshipStatus: 'active',
          supplierType: company.company_type || 'cooperative',
          certifications: [],
          primaryCrops: ['arabica'],
          qualityGrade: 'specialty'
        },
        // Trip-specific metadata
        tripDocumentCount: company.trip_documents || 0,
        hasRecentActivity: company.has_recent_activity || false
      })) || []

      return NextResponse.json({
        success: true,
        data: {
          suppliers,
          total: suppliers.length,
          context: options.tripId ? 'trip-filtered' : 'all'
        }
      })
    }

    // Fallback to original logic for non-trip contexts
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        fantasy_name,
        category,
        created_at
      `)
      .order(options.sortBy === 'name' ? 'name' : options.sortBy, { 
        ascending: options.sortDirection === 'asc' 
      })
      .range(options.offset, options.offset + options.limit - 1)

    if (companiesError) {
      console.error('Error fetching companies:', companiesError)
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }

    // Transform to frontend format with async subFolder loading
    const suppliers = await Promise.all(
      companies?.map(async (company: any) => {
        // Get document count for this company
        const { count } = await supabase
          .from('company_files')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id)

        return {
          id: company.id,
          name: company.name,
          path: `/documents/${company.name.toLowerCase().replace(/\s+/g, '-')}`,
          supplierId: company.id,
          itemCount: count || 0,
          documentCount: count || 0,
          folderCount: 1, // Basic implementation
          totalSize: 0, // Would need aggregation
          lastModified: new Date(company.created_at),
          createdDate: new Date(company.created_at),
          subFolders: await getYearFolders(supabase, company.id),
          recentDocuments: [],
          supplierInfo: {
            id: company.id,
            name: company.fantasy_name || company.name,
            country: 'Unknown', // Would need location data
            contactPerson: '',
            email: '',
            relationshipStatus: 'active',
            supplierType: company.category || 'cooperative',
            certifications: [],
            primaryCrops: ['arabica'],
            qualityGrade: 'specialty'
          }
        }
      }) || []
    )

    return NextResponse.json({
      success: true,
      data: {
        suppliers,
        total: companies?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in getSuppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

async function getYearFolders(supabase: any, supplierId: string) {
  try {
    // Group company files by year (extracted from created_at)
    const { data: files, error } = await supabase
      .from('company_files')
      .select('created_at')
      .eq('company_id', supplierId)
      .not('created_at', 'is', null)

    if (error) {
      console.error('Error fetching year folders:', error)
      return []
    }

    // Group by year
    const yearGroups = files?.reduce((acc: any, file: any) => {
      const year = new Date(file.created_at).getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(file)
      return acc
    }, {}) || {}

    return Object.keys(yearGroups).map((year: string) => ({
      id: `${supplierId}-${year}`,
      year: parseInt(year),
      path: `/documents/${supplierId}/${year}`,
      supplierId,
      itemCount: yearGroups[year].length,
      totalSize: 0, // Would need additional calculation
      lastModified: new Date(),
      documents: [],
      categories: []
    })).sort((a, b) => b.year - a.year) // Sort by year descending

  } catch (error) {
    console.error('Error in getYearFolders:', error)
    return []
  }
}

async function getDocuments(
  supabase: any,
  options: {
    supplierId?: string | null
    year?: number
    category?: string | null
    searchQuery?: string | null
    sortBy: string
    sortDirection: string
    limit: number
    offset: number
    fileTypes: string[]
    urgencyLevels: string[]
    categories: string[]
    dateFrom?: string | null
    dateTo?: string | null
    tripId?: string | null
    includeGeneral?: boolean
  }
) {
  try {
    // Use the new database function for trip-aware document filtering when tripId is provided
    if (options.tripId) {
      const { data: documents, error } = await supabase
        .rpc('get_trip_filtered_documents', {
          p_trip_id: options.tripId,
          p_supplier_id: options.supplierId,
          p_document_year: options.year,
          p_category: options.category,
          p_include_general: options.includeGeneral || false,
          p_sort_by: options.sortBy === 'dateModified' ? 'created_at' : 
                     options.sortBy === 'size' ? 'file_size' :
                     options.sortBy === 'kind' ? 'file_type' : 'file_name',
          p_sort_direction: options.sortDirection,
          p_limit: options.limit,
          p_offset: options.offset
        })

      if (error) {
        console.error('Error fetching trip documents:', error)
        return NextResponse.json({ error: 'Failed to fetch trip documents' }, { status: 500 })
      }

      // Transform trip documents to frontend format
      const transformedDocuments = documents?.map((doc: any) => ({
        id: doc.id,
        name: doc.file_name,
        path: doc.file_path,
        supplier: doc.supplier_name || 'Unknown',
        supplierId: options.supplierId || '',
        year: doc.document_year || doc.harvest_year || new Date(doc.created_at).getFullYear(),
        size: doc.file_size,
        lastModified: new Date(doc.updated_at || doc.created_at),
        createdDate: new Date(doc.created_at),
        createdBy: doc.creator_name || 'Unknown',
        createdById: doc.created_by,
        kind: getFileKind(doc.file_type, doc.file_name),
        extension: getFileExtension(doc.file_name),
        mimeType: doc.mime_type,
        isNew: isNewDocument(doc.created_at),
        isShared: doc.is_shared,
        tags: doc.tags || [],
        metadata: {
          ...doc.crop_metadata,
          ...doc.quality_metadata,
          version: '1.0',
          urgency: doc.urgency_level,
          tripAssociation: doc.trip_association_type,
          createdDuringTrip: doc.created_during_trip
        },
        accessLevel: 'team', // Based on your access control logic
        downloadUrl: `/api/documents/coffee-supply/${doc.id}/download`,
        previewUrl: doc.preview_url,
        thumbnailUrl: doc.thumbnail_url,
        // Trip-specific metadata
        tripId: doc.trip_id,
        createdDuringTrip: doc.created_during_trip,
        tripActivityId: doc.trip_activity_id,
        tripAssociationType: doc.trip_association_type
      })) || []

      return NextResponse.json({
        success: true,
        data: {
          documents: transformedDocuments,
          total: transformedDocuments.length,
          context: 'trip-filtered',
          tripId: options.tripId,
          includeGeneral: options.includeGeneral
        }
      })
    }

    // Fallback to original logic for non-trip contexts
    let query = supabase
      .from('company_files')
      .select(`
        id,
        file_name,
        file_size,
        mime_type,
        storage_path,
        category,
        description,
        tags,
        trip_id,
        created_at,
        updated_at,
        uploaded_by_id,
        companies:company_id (
          id,
          name,
          fantasy_name
        ),
        users:uploaded_by_id (
          id,
          full_name,
          email
        )
      `)
      .eq('is_archived', false)

    // Apply filters using correct column names
    if (options.supplierId) {
      query = query.eq('company_id', options.supplierId)
    }

    if (options.year) {
      // Filter by year from created_at since we don't have document_year
      const startOfYear = new Date(options.year, 0, 1).toISOString();
      const endOfYear = new Date(options.year + 1, 0, 1).toISOString();
      query = query.gte('created_at', startOfYear).lt('created_at', endOfYear)
    }

    if (options.category) {
      query = query.eq('category', options.category)
    }

    if (options.searchQuery) {
      query = query.textSearch('file_name', options.searchQuery)
    }

    if (options.fileTypes.length > 0) {
      query = query.in('mime_type', options.fileTypes)
    }

    if (options.categories.length > 0) {
      query = query.in('category', options.categories)
    }

    if (options.dateFrom) {
      query = query.gte('created_at', options.dateFrom)
    }

    if (options.dateTo) {
      query = query.lte('created_at', options.dateTo)
    }

    // Apply sorting using correct column names
    const sortColumn = options.sortBy === 'dateModified' ? 'updated_at' : 
                      options.sortBy === 'size' ? 'file_size' :
                      options.sortBy === 'kind' ? 'mime_type' : 'file_name'

    query = query.order(sortColumn, { ascending: options.sortDirection === 'asc' })
      .range(options.offset, options.offset + options.limit - 1)

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Transform to frontend format
    const transformedDocuments = documents?.map((doc: any) => ({
      id: doc.id,
      name: doc.file_name,
      path: doc.storage_path,
      supplier: doc.companies?.fantasy_name || doc.companies?.name || 'Unknown',
      supplierId: doc.companies?.id || '',
      year: new Date(doc.created_at).getFullYear(),
      size: doc.file_size,
      lastModified: new Date(doc.updated_at || doc.created_at),
      createdDate: new Date(doc.created_at),
      createdBy: doc.users?.full_name || 'Unknown',
      createdById: doc.uploaded_by_id,
      kind: getFileKind(doc.mime_type, doc.file_name),
      extension: getFileExtension(doc.file_name),
      mimeType: doc.mime_type,
      isNew: isNewDocument(doc.created_at),
      isShared: false, // Not available in current schema
      tags: doc.tags || [],
      metadata: {
        category: doc.category,
        description: doc.description,
        tags: doc.tags || [],
        version: '1.0'
      },
      accessLevel: 'team', // Based on your access control logic
      downloadUrl: `/api/documents/coffee-supply/${doc.id}/download`,
      previewUrl: null, // Not available in current schema
      thumbnailUrl: null // Not available in current schema
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        documents: transformedDocuments,
        total: transformedDocuments.length
      }
    })

  } catch (error) {
    console.error('Error in getDocuments:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

async function searchDocuments(
  supabase: any,
  options: {
    query: string
    supplierId?: string | null
    limit: number
    offset: number
    fileTypes: string[]
    categories: string[]
    tripId?: string | null
  }
) {
  try {
    const startTime = Date.now()
    
    // Search in documents with trip filtering
    let docQuery = supabase
      .from('company_files')
      .select(`
        id,
        file_name,
        storage_path,
        file_size,
        mime_type,
        category,
        created_at,
        trip_id,
        companies:company_id (name, fantasy_name)
      `)
      .eq('is_archived', false)
      .textSearch('file_name', options.query)

    // Apply trip filtering to search
    if (options.tripId) {
      docQuery = docQuery.eq('trip_id', options.tripId)
    }

    if (options.supplierId) {
      docQuery = docQuery.eq('company_id', options.supplierId)
    }

    if (options.fileTypes.length > 0) {
      docQuery = docQuery.in('mime_type', options.fileTypes)
    }

    if (options.categories.length > 0) {
      docQuery = docQuery.in('category', options.categories)
    }

    const { data: documents, error: docError } = await docQuery
      .limit(options.limit)
      .range(options.offset, options.offset + options.limit - 1)

    // Search in suppliers
    const { data: suppliers, error: supplierError } = await supabase
      .from('companies')
      .select('id, name, country')
      .textSearch('name', options.query)
      .eq('company_type', 'exporter_coop')
      .limit(10)

    if (docError || supplierError) {
      console.error('Search error:', docError || supplierError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const searchTime = Date.now() - startTime

    // Get search facets
    const facets = await getSearchFacets(supabase, options.query)

    return NextResponse.json({
      success: true,
      data: {
        documents: documents?.map(transformSearchResult) || [],
        folders: suppliers?.map(transformSupplierResult) || [],
        totalResults: (documents?.length || 0) + (suppliers?.length || 0),
        searchTime,
        facets
      }
    })

  } catch (error) {
    console.error('Error in searchDocuments:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

async function getCropInformation(
  supabase: any,
  options: { limit: number; urgencyLevels: string[]; tripId?: string | null }
) {
  try {
    // Query actual crop information from database using the correct table structure
    let query = supabase
      .from('company_files')
      .select(`
        id,
        file_name,
        file_size,
        mime_type,
        storage_path,
        category,
        description,
        tags,
        trip_id,
        created_at,
        updated_at,
        uploaded_by_id,
        companies:company_id (
          id,
          name,
          fantasy_name
        ),
        users:uploaded_by_id (
          id,
          full_name,
          email
        )
      `)
      .eq('is_archived', false)

    // Filter for crop-related categories if they exist
    // For now, we'll look for files that might be crop-related based on description or category
    // Note: The category column is a user-defined enum, we need to check what values exist
    
    // Apply trip filtering if provided
    if (options.tripId) {
      query = query.eq('trip_id', options.tripId)
    }

    // Order by most recent and limit results
    query = query
      .order('created_at', { ascending: false })
      .limit(options.limit)

    const { data: documents, error } = await query

    if (error) {
      console.error('Error fetching crop information:', error)
      return NextResponse.json({ error: 'Failed to fetch crop information' }, { status: 500 })
    }

    // Filter for crop-related documents (since we don't have specific crop categories)
    // Look for files that might contain crop-related keywords
    const cropKeywords = ['harvest', 'crop', 'quality', 'forecast', 'market', 'coffee', 'bean', 'arabica', 'robusta'];
    const cropDocuments = documents?.filter((doc: any) => {
      const fileName = (doc.file_name || '').toLowerCase();
      const description = (doc.description || '').toLowerCase();
      const tags = (doc.tags || []).join(' ').toLowerCase();
      const searchText = `${fileName} ${description} ${tags}`;
      
      return cropKeywords.some(keyword => searchText.includes(keyword));
    }) || [];

    // Transform to frontend format
    const cropInformation = cropDocuments.map((doc: any) => ({
      id: doc.id,
      title: doc.description || doc.file_name,
      filename: doc.file_name,
      supplier: doc.companies?.fantasy_name || doc.companies?.name || 'Unknown Supplier',
      supplierId: doc.companies?.id || '',
      sharedBy: doc.users?.full_name || 'System',
      sharedById: doc.uploaded_by_id,
      sharedDate: doc.created_at,
      size: doc.file_size || 0,
      fileType: getFileExtension(doc.file_name),
      category: inferCategoryFromFile(doc.file_name, doc.description, doc.tags),
      urgency: inferUrgencyFromFile(doc.file_name, doc.description, doc.tags),
      isRead: false, // This would need to be tracked separately per user
      downloadUrl: `/api/documents/coffee-supply/${doc.id}/download`,
      thumbnailUrl: null, // Not available in current schema
      previewData: {
        // Extract any relevant metadata from description or tags
        tags: doc.tags || []
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        cropInformation
      }
    })

  } catch (error) {
    console.error('Error in getCropInformation:', error)
    return NextResponse.json({ error: 'Failed to fetch crop information' }, { status: 500 })
  }
}

async function getDocumentStatistics(
  supabase: any,
  options: { supplierId?: string | null; tripId?: string | null }
) {
  try {
    let query = supabase
      .from('supplier_document_stats')
      .select('*')

    if (options.supplierId) {
      query = query.eq('supplier_id', options.supplierId)
    }

    const { data: stats, error } = await query

    if (error) {
      console.error('Error fetching statistics:', error)
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        statistics: stats || []
      }
    })

  } catch (error) {
    console.error('Error in getDocumentStatistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}

// Helper functions
function getFileKind(mimeType: string, fileName: string): string {
  if (mimeType?.includes('spreadsheet') || fileName.toLowerCase().endsWith('.xlsx')) {
    return 'Excel Spreadsheet'
  } else if (mimeType?.includes('pdf')) {
    return 'PDF Document'
  } else if (mimeType?.includes('text/csv')) {
    return 'CSV File'
  } else if (mimeType?.includes('image')) {
    return 'Image'
  } else {
    return 'Document'
  }
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

function isNewDocument(createdAt: string): boolean {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return new Date(createdAt) > sevenDaysAgo
}

function transformSearchResult(doc: any): any {
  return {
    id: doc.id,
    name: doc.file_name,
    path: doc.storage_path,
    supplier: doc.companies?.fantasy_name || doc.companies?.name || 'Unknown',
    size: doc.file_size,
    kind: getFileKind(doc.mime_type, doc.file_name),
    category: doc.category,
    urgency: inferUrgencyFromFile(doc.file_name, '', []), // Infer urgency since it's not in schema
    lastModified: new Date(doc.created_at)
  }
}

function transformSupplierResult(supplier: any): any {
  return {
    id: supplier.id,
    name: supplier.name,
    path: `/documents/${supplier.name.toLowerCase().replace(/\s+/g, '-')}`,
    country: supplier.country,
    type: 'supplier'
  }
}

async function getSearchFacets(supabase: any, query: string): Promise<any> {
  try {
    // Get facet counts for search results from the correct table
    const { data: categoryFacets } = await supabase
      .from('company_files')
      .select('category, count(*)')
      .textSearch('file_name', query)
      .group('category')

    const { data: typeFacets } = await supabase
      .from('company_files')
      .select('mime_type, count(*)')
      .textSearch('file_name', query)
      .group('mime_type')

    return {
      categories: categoryFacets?.map((item: any) => ({ category: item.category, count: item.count })) || [],
      fileTypes: typeFacets?.map((item: any) => ({ type: item.mime_type, count: item.count })) || []
    }
  } catch (error) {
    console.error('Error getting search facets:', error)
    return { categories: [], fileTypes: [] }
  }
}

// Helper function to infer category from file information
function inferCategoryFromFile(fileName: string, description: string, tags: string[]): string {
  const searchText = `${fileName} ${description} ${(tags || []).join(' ')}`.toLowerCase();
  
  if (searchText.includes('forecast') || searchText.includes('prediction')) {
    return 'forecast';
  }
  if (searchText.includes('harvest') || searchText.includes('crop report')) {
    return 'harvest-report';
  }
  if (searchText.includes('quality') || searchText.includes('analysis') || searchText.includes('grade')) {
    return 'quality-analysis';
  }
  if (searchText.includes('market') || searchText.includes('price') || searchText.includes('trading')) {
    return 'market-update';
  }
  
  return 'general';
}

// Helper function to infer urgency from file information
function inferUrgencyFromFile(fileName: string, description: string, tags: string[]): string {
  const searchText = `${fileName} ${description} ${(tags || []).join(' ')}`.toLowerCase();
  
  if (searchText.includes('urgent') || searchText.includes('critical') || searchText.includes('immediate')) {
    return 'critical';
  }
  if (searchText.includes('high') || searchText.includes('important') || searchText.includes('priority')) {
    return 'high';
  }
  if (searchText.includes('low') || searchText.includes('routine')) {
    return 'low';
  }
  
  return 'medium'; // Default urgency
}