import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET - Download document or get document details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'details'

    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user information
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('company_documents')
      .select(`
        *,
        companies:supplier_id (
          id,
          name,
          country
        ),
        users:created_by (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check access permissions
    if (!await hasDocumentAccess(supabase, user.id, document)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    switch (action) {
      case 'download':
        return await downloadDocument(supabase, document, user.id)
      
      case 'preview':
        return await getDocumentPreview(supabase, document)
      
      case 'thumbnail':
        return await getDocumentThumbnail(supabase, document)
      
      default:
        return await getDocumentDetails(document)
    }

  } catch (error) {
    console.error('Error in document API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id } = params
    
    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const updates = await request.json()

    // Get current document
    const { data: document, error: docError } = await supabase
      .from('company_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check edit permissions
    if (!await hasDocumentEditAccess(supabase, user.id, document)) {
      return NextResponse.json({ error: 'Edit access denied' }, { status: 403 })
    }

    // Prepare update data
    const updateData: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString()
    }

    // Apply allowed updates
    const allowedFields = [
      'file_name', 'description', 'tags', 'document_category', 
      'urgency_level', 'crop_season', 'harvest_year', 'crop_types',
      'regions', 'certifications', 'quality_grade', 'crop_metadata',
      'contract_metadata', 'quality_metadata', 'visible_to_company',
      'visible_to_participants', 'access_level'
    ]

    allowedFields.forEach(field => {
      if (updates.hasOwnProperty(field)) {
        updateData[field] = updates[field]
      }
    })

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('company_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Update failed', details: updateError.message },
        { status: 500 }
      )
    }

    // Log the update action
    await supabase
      .from('company_access_logs')
      .insert([{
        company_id: document.company_id,
        user_id: user.id,
        document_id: id,
        action_type: 'edit',
        action_details: {
          updated_fields: Object.keys(updateData),
          previous_values: allowedFields.reduce((prev: any, field) => {
            if (updates.hasOwnProperty(field)) {
              prev[field] = document[field]
            }
            return prev
          }, {})
        }
      }])

    return NextResponse.json({
      success: true,
      data: { document: updatedDocument }
    })

  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { id } = params
    
    // Authentication check
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get document details before deletion
    const { data: document, error: docError } = await supabase
      .from('company_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Check delete permissions (only Wolthers staff or document creator)
    if (!await hasDocumentDeleteAccess(supabase, user.id, document)) {
      return NextResponse.json({ error: 'Delete access denied' }, { status: 403 })
    }

    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path])

    if (storageError) {
      console.warn('Storage deletion failed:', storageError)
      // Continue with database deletion even if storage fails
    }

    // Delete thumbnail if exists
    if (document.thumbnail_url) {
      try {
        const thumbnailPath = extractStoragePathFromUrl(document.thumbnail_url)
        if (thumbnailPath) {
          await supabase.storage.from('documents').remove([thumbnailPath])
        }
      } catch (thumbError) {
        console.warn('Thumbnail deletion failed:', thumbError)
      }
    }

    // Log the deletion action before deleting the document
    await supabase
      .from('company_access_logs')
      .insert([{
        company_id: document.company_id,
        user_id: user.id,
        document_id: id,
        action_type: 'delete',
        action_details: {
          filename: document.file_name,
          category: document.document_category,
          supplier_id: document.supplier_id,
          file_path: document.file_path
        }
      }])

    // Delete document record
    const { error: deleteError } = await supabase
      .from('company_documents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Delete failed', details: deleteError.message },
        { status: 500 }
      )
    }

    // Check if parent folders are now empty and clean up
    if (document.parent_folder_id) {
      await cleanupEmptyFolders(supabase, document.parent_folder_id)
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Document deleted successfully',
        deletedDocument: {
          id: document.id,
          filename: document.file_name
        }
      }
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
async function hasDocumentAccess(supabase: any, userId: string, document: any): Promise<boolean> {
  try {
    // Check if user is Wolthers staff (always has access)
    const { data: user } = await supabase
      .from('users')
      .select('company_id, is_global_admin')
      .eq('id', userId)
      .single()

    if (user?.is_global_admin || user?.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0') {
      return true
    }

    // Check if user is from the supplier company
    if (document.visible_to_company && user?.company_id === document.supplier_id) {
      return true
    }

    // Check if user is a trip participant and document is visible to participants
    if (document.visible_to_participants && document.trip_id) {
      const { data: participation } = await supabase
        .from('trip_participants')
        .select('id')
        .eq('trip_id', document.trip_id)
        .eq('user_id', userId)
        .single()

      if (participation) {
        return true
      }
    }

    // Check if user created the document
    if (document.created_by === userId) {
      return true
    }

    return false

  } catch (error) {
    console.error('Error checking document access:', error)
    return false
  }
}

async function hasDocumentEditAccess(supabase: any, userId: string, document: any): Promise<boolean> {
  try {
    // Check if user is Wolthers staff (can edit everything)
    const { data: user } = await supabase
      .from('users')
      .select('company_id, is_global_admin')
      .eq('id', userId)
      .single()

    if (user?.is_global_admin || user?.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0') {
      return true
    }

    // Check if user created the document
    if (document.created_by === userId) {
      return true
    }

    return false

  } catch (error) {
    console.error('Error checking edit access:', error)
    return false
  }
}

async function hasDocumentDeleteAccess(supabase: any, userId: string, document: any): Promise<boolean> {
  try {
    // Only Wolthers staff or document creator can delete
    const { data: user } = await supabase
      .from('users')
      .select('company_id, is_global_admin')
      .eq('id', userId)
      .single()

    if (user?.is_global_admin || user?.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0') {
      return true
    }

    if (document.created_by === userId) {
      return true
    }

    return false

  } catch (error) {
    console.error('Error checking delete access:', error)
    return false
  }
}

async function downloadDocument(supabase: any, document: any, userId: string) {
  try {
    // Get signed URL for download
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 300) // 5 minutes

    if (urlError) {
      return NextResponse.json(
        { error: 'Download URL generation failed' },
        { status: 500 }
      )
    }

    // Update download count and last accessed info
    await supabase
      .from('company_documents')
      .update({
        download_count: (document.download_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
        last_accessed_by: userId
      })
      .eq('id', document.id)

    // Log download action
    await supabase
      .from('company_access_logs')
      .insert([{
        company_id: document.company_id,
        user_id: userId,
        document_id: document.id,
        action_type: 'download',
        action_details: {
          filename: document.file_name,
          file_size: document.file_size
        }
      }])

    return NextResponse.redirect(signedUrl.signedUrl)

  } catch (error) {
    console.error('Error in downloadDocument:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

async function getDocumentPreview(supabase: any, document: any) {
  try {
    if (document.preview_url) {
      return NextResponse.json({
        success: true,
        data: {
          previewUrl: document.preview_url,
          previewType: 'url'
        }
      })
    }

    // Generate preview based on file type
    let previewData = null
    
    if (document.file_type === 'text/csv' || document.file_type.includes('spreadsheet')) {
      previewData = await generateSpreadsheetPreview(supabase, document)
    } else if (document.file_type === 'application/pdf') {
      previewData = await generatePDFPreview(supabase, document)
    } else if (document.file_type.startsWith('image/')) {
      previewData = await generateImagePreview(supabase, document)
    }

    return NextResponse.json({
      success: true,
      data: {
        preview: previewData,
        previewType: 'data'
      }
    })

  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json({ error: 'Preview generation failed' }, { status: 500 })
  }
}

async function getDocumentThumbnail(supabase: any, document: any) {
  try {
    if (document.thumbnail_url) {
      const { data: signedUrl } = await supabase.storage
        .from('documents')
        .createSignedUrl(extractStoragePathFromUrl(document.thumbnail_url), 300)

      if (signedUrl) {
        return NextResponse.redirect(signedUrl.signedUrl)
      }
    }

    // Return placeholder thumbnail
    return NextResponse.json({
      success: true,
      data: {
        thumbnailUrl: `/api/documents/placeholder-thumbnail?type=${document.file_type}`
      }
    })

  } catch (error) {
    console.error('Error getting thumbnail:', error)
    return NextResponse.json({ error: 'Thumbnail failed' }, { status: 500 })
  }
}

async function getDocumentDetails(document: any) {
  return NextResponse.json({
    success: true,
    data: {
      document: {
        id: document.id,
        name: document.file_name,
        path: document.file_path,
        size: document.file_size,
        type: document.file_type,
        category: document.document_category,
        year: document.document_year,
        supplier: document.companies?.name,
        createdBy: document.users?.full_name,
        createdDate: document.created_at,
        lastModified: document.updated_at,
        downloadCount: document.download_count || 0,
        tags: document.tags || [],
        metadata: {
          ...document.crop_metadata,
          ...document.quality_metadata,
          ...document.contract_metadata
        },
        urgency: document.urgency_level,
        isShared: document.is_shared,
        accessLevel: document.access_level
      }
    }
  })
}

async function cleanupEmptyFolders(supabase: any, folderId: string) {
  try {
    // Check if folder has any children
    const { data: children, error } = await supabase
      .from('company_documents')
      .select('id')
      .eq('parent_folder_id', folderId)
      .limit(1)

    if (error) return

    // If no children, delete the folder and check parent
    if (!children || children.length === 0) {
      const { data: folder } = await supabase
        .from('company_documents')
        .select('parent_folder_id')
        .eq('id', folderId)
        .single()

      await supabase
        .from('company_documents')
        .delete()
        .eq('id', folderId)

      // Recursively check parent folder
      if (folder?.parent_folder_id) {
        await cleanupEmptyFolders(supabase, folder.parent_folder_id)
      }
    }

  } catch (error) {
    console.error('Error cleaning up folders:', error)
  }
}

function extractStoragePathFromUrl(url: string): string | null {
  try {
    const urlParts = url.split('/')
    const index = urlParts.findIndex(part => part === 'documents')
    if (index !== -1 && index < urlParts.length - 1) {
      return urlParts.slice(index + 1).join('/')
    }
    return null
  } catch {
    return null
  }
}

// Placeholder preview generation functions
async function generateSpreadsheetPreview(supabase: any, document: any): Promise<any> {
  // This would implement actual spreadsheet preview
  return {
    type: 'spreadsheet',
    sheets: ['Sheet1'],
    rowCount: 100,
    columnCount: 5,
    preview: 'Spreadsheet preview not yet implemented'
  }
}

async function generatePDFPreview(supabase: any, document: any): Promise<any> {
  return {
    type: 'pdf',
    pageCount: 1,
    preview: 'PDF preview not yet implemented'
  }
}

async function generateImagePreview(supabase: any, document: any): Promise<any> {
  return {
    type: 'image',
    dimensions: { width: 800, height: 600 },
    preview: 'Image preview not yet implemented'
  }
}