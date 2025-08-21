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

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const requestData = await request.json()
    const {
      action,
      documentIds = [],
      folderIds = [],
      options = {}
    } = requestData

    if (documentIds.length === 0 && folderIds.length === 0) {
      return NextResponse.json({ error: 'No items specified' }, { status: 400 })
    }

    // Combine all item IDs
    const allItemIds = [...documentIds, ...folderIds]

    // Verify user has access to all items
    const accessCheck = await verifyBulkAccess(supabase, user.id, allItemIds, action)
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied', 
        details: `No access to ${accessCheck.deniedItems.length} items`
      }, { status: 403 })
    }

    let results = {}
    
    switch (action) {
      case 'download':
        results = await bulkDownload(supabase, user.id, documentIds)
        break
      
      case 'delete':
        results = await bulkDelete(supabase, user.id, allItemIds, options)
        break
      
      case 'move':
        results = await bulkMove(supabase, user.id, allItemIds, options)
        break
      
      case 'share':
        results = await bulkShare(supabase, user.id, documentIds, options)
        break
      
      case 'tag':
        results = await bulkTag(supabase, user.id, allItemIds, options)
        break
      
      case 'categorize':
        results = await bulkCategorize(supabase, user.id, documentIds, options)
        break
      
      case 'export':
        results = await bulkExport(supabase, user.id, documentIds, options)
        break
      
      case 'update_metadata':
        results = await bulkUpdateMetadata(supabase, user.id, documentIds, options)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Log bulk action
    await supabase
      .from('company_access_logs')
      .insert([{
        company_id: null, // Will be set based on documents
        user_id: user.id,
        document_id: null,
        action_type: `bulk_${action}`,
        action_details: {
          action,
          item_count: allItemIds.length,
          document_count: documentIds.length,
          folder_count: folderIds.length,
          options: options,
          results_summary: {
            success: results.successCount || 0,
            errors: results.errorCount || 0
          }
        }
      }])

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Error in bulk operations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function verifyBulkAccess(
  supabase: any, 
  userId: string, 
  itemIds: string[], 
  action: string
): Promise<{ hasAccess: boolean; deniedItems: string[] }> {
  try {
    // Get user permissions
    const { data: user } = await supabase
      .from('users')
      .select('company_id, is_global_admin')
      .eq('id', userId)
      .single()

    const isWolthersStaff = user?.is_global_admin || user?.company_id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'

    // Get all items
    const { data: items, error } = await supabase
      .from('company_documents')
      .select('id, created_by, company_id, supplier_id, is_folder')
      .in('id', itemIds)

    if (error || !items) {
      return { hasAccess: false, deniedItems: itemIds }
    }

    const deniedItems = []

    for (const item of items) {
      let hasItemAccess = false

      if (isWolthersStaff) {
        hasItemAccess = true
      } else if (item.created_by === userId) {
        hasItemAccess = true
      } else if (action === 'download' || action === 'share') {
        // Check if user has read access
        if (user?.company_id === item.supplier_id) {
          hasItemAccess = true
        }
      }

      if (!hasItemAccess) {
        deniedItems.push(item.id)
      }
    }

    return {
      hasAccess: deniedItems.length === 0,
      deniedItems
    }

  } catch (error) {
    console.error('Error verifying bulk access:', error)
    return { hasAccess: false, deniedItems: itemIds }
  }
}

async function bulkDownload(
  supabase: any,
  userId: string,
  documentIds: string[]
): Promise<any> {
  try {
    const results = []
    const errors = []

    // Get document details
    const { data: documents, error } = await supabase
      .from('company_documents')
      .select('id, file_name, file_path, file_size')
      .in('id', documentIds)
      .eq('is_folder', false)

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    // Generate signed URLs for download
    for (const doc of documents) {
      try {
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('documents')
          .createSignedUrl(doc.file_path, 3600) // 1 hour

        if (urlError) {
          errors.push({
            documentId: doc.id,
            filename: doc.file_name,
            error: urlError.message
          })
        } else {
          results.push({
            documentId: doc.id,
            filename: doc.file_name,
            downloadUrl: signedUrl.signedUrl,
            size: doc.file_size
          })

          // Update download count
          await supabase
            .from('company_documents')
            .update({
              download_count: supabase.raw('download_count + 1'),
              last_accessed_at: new Date().toISOString(),
              last_accessed_by: userId
            })
            .eq('id', doc.id)
        }
      } catch (docError) {
        errors.push({
          documentId: doc.id,
          filename: doc.file_name,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        })
      }
    }

    // Create zip file for bulk download (if more than one file)
    let zipUrl = null
    if (results.length > 1) {
      zipUrl = await createBulkDownloadZip(supabase, results, userId)
    }

    return {
      downloads: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: results.length,
      errorCount: errors.length,
      zipDownloadUrl: zipUrl,
      totalSize: results.reduce((sum, item) => sum + (item.size || 0), 0)
    }

  } catch (error) {
    console.error('Error in bulkDownload:', error)
    throw error
  }
}

async function bulkDelete(
  supabase: any,
  userId: string,
  itemIds: string[],
  options: { confirmDelete?: boolean; deleteEmptyFolders?: boolean }
): Promise<any> {
  try {
    if (!options.confirmDelete) {
      return {
        error: 'Delete confirmation required',
        requiresConfirmation: true,
        itemCount: itemIds.length
      }
    }

    const results = []
    const errors = []

    // Get items to delete
    const { data: items, error } = await supabase
      .from('company_documents')
      .select('*')
      .in('id', itemIds)

    if (error) {
      throw new Error(`Failed to fetch items: ${error.message}`)
    }

    // Separate folders and documents
    const folders = items.filter(item => item.is_folder)
    const documents = items.filter(item => !item.is_folder)

    // Delete documents first
    for (const doc of documents) {
      try {
        // Delete from storage
        if (doc.file_path) {
          const { error: storageError } = await supabase.storage
            .from('documents')
            .remove([doc.file_path])

          if (storageError) {
            console.warn(`Storage deletion failed for ${doc.id}:`, storageError)
          }
        }

        // Delete thumbnail if exists
        if (doc.thumbnail_url) {
          const thumbnailPath = extractStoragePathFromUrl(doc.thumbnail_url)
          if (thumbnailPath) {
            await supabase.storage.from('documents').remove([thumbnailPath])
          }
        }

        // Delete document record
        const { error: deleteError } = await supabase
          .from('company_documents')
          .delete()
          .eq('id', doc.id)

        if (deleteError) {
          errors.push({
            itemId: doc.id,
            filename: doc.file_name,
            error: deleteError.message
          })
        } else {
          results.push({
            itemId: doc.id,
            filename: doc.file_name,
            type: 'document'
          })
        }

      } catch (docError) {
        errors.push({
          itemId: doc.id,
          filename: doc.file_name,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        })
      }
    }

    // Delete folders (recursively if needed)
    for (const folder of folders) {
      try {
        const deleteResult = await deleteFolderRecursively(supabase, folder.id)
        results.push({
          itemId: folder.id,
          filename: folder.folder_name,
          type: 'folder',
          deletedItems: deleteResult.deletedCount
        })

      } catch (folderError) {
        errors.push({
          itemId: folder.id,
          filename: folder.folder_name,
          error: folderError instanceof Error ? folderError.message : 'Unknown error'
        })
      }
    }

    // Clean up empty parent folders if requested
    if (options.deleteEmptyFolders) {
      const parentFolders = [...new Set(items.map(item => item.parent_folder_id).filter(Boolean))]
      for (const parentId of parentFolders) {
        await cleanupEmptyFolders(supabase, parentId)
      }
    }

    return {
      deletedItems: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: results.length,
      errorCount: errors.length
    }

  } catch (error) {
    console.error('Error in bulkDelete:', error)
    throw error
  }
}

async function bulkMove(
  supabase: any,
  userId: string,
  itemIds: string[],
  options: { targetFolderId?: string; targetSupplierId?: string; targetYear?: number }
): Promise<any> {
  try {
    const results = []
    const errors = []

    const updateData: any = {
      updated_by: userId,
      updated_at: new Date().toISOString()
    }

    if (options.targetFolderId) {
      updateData.parent_folder_id = options.targetFolderId
    }

    if (options.targetSupplierId) {
      updateData.supplier_id = options.targetSupplierId
    }

    if (options.targetYear) {
      updateData.document_year = options.targetYear
    }

    // Move items
    for (const itemId of itemIds) {
      try {
        const { data: movedItem, error: moveError } = await supabase
          .from('company_documents')
          .update(updateData)
          .eq('id', itemId)
          .select('id, file_name, folder_name, is_folder')
          .single()

        if (moveError) {
          errors.push({
            itemId,
            error: moveError.message
          })
        } else {
          results.push({
            itemId,
            filename: movedItem.is_folder ? movedItem.folder_name : movedItem.file_name,
            type: movedItem.is_folder ? 'folder' : 'document'
          })

          // Auto-organize if moving to new supplier
          if (options.targetSupplierId && !movedItem.is_folder) {
            try {
              await supabase.rpc('auto_organize_document', {
                p_document_id: itemId,
                p_supplier_id: options.targetSupplierId
              })
            } catch (orgError) {
              console.warn('Auto-organization failed:', orgError)
            }
          }
        }

      } catch (itemError) {
        errors.push({
          itemId,
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        })
      }
    }

    return {
      movedItems: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: results.length,
      errorCount: errors.length
    }

  } catch (error) {
    console.error('Error in bulkMove:', error)
    throw error
  }
}

async function bulkShare(
  supabase: any,
  userId: string,
  documentIds: string[],
  options: {
    emails?: string[]
    userIds?: string[]
    accessLevel?: string
    expirationDate?: string
    message?: string
  }
): Promise<any> {
  try {
    const results = []
    const errors = []

    for (const docId of documentIds) {
      try {
        // Use the existing share functionality for each document
        const shareResult = await shareDocument(supabase, {
          documentId: docId,
          emails: options.emails || [],
          userIds: options.userIds || [],
          accessLevel: options.accessLevel || 'view',
          expirationDate: options.expirationDate,
          message: options.message,
          sharedBy: userId
        })

        results.push({
          documentId: docId,
          shareResult
        })

      } catch (docError) {
        errors.push({
          documentId: docId,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        })
      }
    }

    return {
      sharedDocuments: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: results.length,
      errorCount: errors.length
    }

  } catch (error) {
    console.error('Error in bulkShare:', error)
    throw error
  }
}

async function bulkTag(
  supabase: any,
  userId: string,
  itemIds: string[],
  options: { tags?: string[]; addTags?: string[]; removeTags?: string[]; replaceTags?: boolean }
): Promise<any> {
  try {
    const results = []
    const errors = []

    for (const itemId of itemIds) {
      try {
        let newTags: string[]

        if (options.replaceTags && options.tags) {
          // Replace all tags
          newTags = options.tags
        } else {
          // Get current tags
          const { data: item, error: fetchError } = await supabase
            .from('company_documents')
            .select('tags')
            .eq('id', itemId)
            .single()

          if (fetchError) {
            errors.push({ itemId, error: fetchError.message })
            continue
          }

          let currentTags = item.tags || []

          // Add new tags
          if (options.addTags) {
            currentTags = [...new Set([...currentTags, ...options.addTags])]
          }

          // Remove tags
          if (options.removeTags) {
            currentTags = currentTags.filter(tag => !options.removeTags!.includes(tag))
          }

          newTags = currentTags
        }

        // Update tags
        const { data: updatedItem, error: updateError } = await supabase
          .from('company_documents')
          .update({
            tags: newTags,
            updated_by: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', itemId)
          .select('id, file_name, folder_name, is_folder, tags')
          .single()

        if (updateError) {
          errors.push({ itemId, error: updateError.message })
        } else {
          results.push({
            itemId,
            filename: updatedItem.is_folder ? updatedItem.folder_name : updatedItem.file_name,
            type: updatedItem.is_folder ? 'folder' : 'document',
            tags: updatedItem.tags
          })
        }

      } catch (itemError) {
        errors.push({
          itemId,
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        })
      }
    }

    return {
      taggedItems: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: results.length,
      errorCount: errors.length
    }

  } catch (error) {
    console.error('Error in bulkTag:', error)
    throw error
  }
}

async function bulkCategorize(
  supabase: any,
  userId: string,
  documentIds: string[],
  options: { category: string; autoDetect?: boolean }
): Promise<any> {
  try {
    const results = []
    const errors = []

    for (const docId of documentIds) {
      try {
        let category = options.category

        if (options.autoDetect) {
          // Use the categorization function
          category = await supabase.rpc('categorize_document', {
            p_document_id: docId
          })
        }

        const { data: updatedDoc, error: updateError } = await supabase
          .from('company_documents')
          .update({
            document_category: category,
            updated_by: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', docId)
          .select('id, file_name, document_category')
          .single()

        if (updateError) {
          errors.push({ documentId: docId, error: updateError.message })
        } else {
          results.push({
            documentId: docId,
            filename: updatedDoc.file_name,
            oldCategory: options.category,
            newCategory: updatedDoc.document_category
          })
        }

      } catch (docError) {
        errors.push({
          documentId: docId,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        })
      }
    }

    return {
      categorizedDocuments: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: results.length,
      errorCount: errors.length
    }

  } catch (error) {
    console.error('Error in bulkCategorize:', error)
    throw error
  }
}

async function bulkExport(
  supabase: any,
  userId: string,
  documentIds: string[],
  options: { format?: 'zip' | 'csv' | 'json'; includeMetadata?: boolean }
): Promise<any> {
  try {
    const format = options.format || 'zip'

    if (format === 'zip') {
      // Create downloadable zip
      const zipUrl = await createExportZip(supabase, documentIds, userId, options.includeMetadata)
      return {
        exportUrl: zipUrl,
        format,
        documentCount: documentIds.length,
        includesMetadata: options.includeMetadata
      }

    } else if (format === 'csv' || format === 'json') {
      // Export metadata only
      const metadata = await exportDocumentMetadata(supabase, documentIds, format)
      return {
        exportData: metadata,
        format,
        documentCount: documentIds.length
      }
    }

  } catch (error) {
    console.error('Error in bulkExport:', error)
    throw error
  }
}

async function bulkUpdateMetadata(
  supabase: any,
  userId: string,
  documentIds: string[],
  options: { metadata: any; mergeMetadata?: boolean }
): Promise<any> {
  try {
    const results = []
    const errors = []

    for (const docId of documentIds) {
      try {
        let updateData: any = {
          updated_by: userId,
          updated_at: new Date().toISOString()
        }

        if (options.mergeMetadata) {
          // Get existing metadata and merge
          const { data: doc, error: fetchError } = await supabase
            .from('company_documents')
            .select('crop_metadata, quality_metadata, contract_metadata')
            .eq('id', docId)
            .single()

          if (fetchError) {
            errors.push({ documentId: docId, error: fetchError.message })
            continue
          }

          // Merge metadata
          updateData.crop_metadata = { ...doc.crop_metadata, ...options.metadata.cropMetadata }
          updateData.quality_metadata = { ...doc.quality_metadata, ...options.metadata.qualityMetadata }
          updateData.contract_metadata = { ...doc.contract_metadata, ...options.metadata.contractMetadata }

        } else {
          // Replace metadata
          if (options.metadata.cropMetadata) {
            updateData.crop_metadata = options.metadata.cropMetadata
          }
          if (options.metadata.qualityMetadata) {
            updateData.quality_metadata = options.metadata.qualityMetadata
          }
          if (options.metadata.contractMetadata) {
            updateData.contract_metadata = options.metadata.contractMetadata
          }
        }

        // Apply other metadata updates
        if (options.metadata.urgencyLevel) {
          updateData.urgency_level = options.metadata.urgencyLevel
        }
        if (options.metadata.qualityGrade) {
          updateData.quality_grade = options.metadata.qualityGrade
        }

        const { data: updatedDoc, error: updateError } = await supabase
          .from('company_documents')
          .update(updateData)
          .eq('id', docId)
          .select('id, file_name')
          .single()

        if (updateError) {
          errors.push({ documentId: docId, error: updateError.message })
        } else {
          results.push({
            documentId: docId,
            filename: updatedDoc.file_name
          })
        }

      } catch (docError) {
        errors.push({
          documentId: docId,
          error: docError instanceof Error ? docError.message : 'Unknown error'
        })
      }
    }

    return {
      updatedDocuments: results,
      errors: errors.length > 0 ? errors : undefined,
      successCount: results.length,
      errorCount: errors.length
    }

  } catch (error) {
    console.error('Error in bulkUpdateMetadata:', error)
    throw error
  }
}

// Helper functions
async function deleteFolderRecursively(supabase: any, folderId: string): Promise<{ deletedCount: number }> {
  let deletedCount = 0

  // Get all children
  const { data: children, error } = await supabase
    .from('company_documents')
    .select('*')
    .eq('parent_folder_id', folderId)

  if (error) {
    throw error
  }

  // Delete children recursively
  for (const child of children) {
    if (child.is_folder) {
      const childResult = await deleteFolderRecursively(supabase, child.id)
      deletedCount += childResult.deletedCount
    } else {
      // Delete file from storage
      if (child.file_path) {
        await supabase.storage.from('documents').remove([child.file_path])
      }
      deletedCount++
    }

    // Delete the child record
    await supabase
      .from('company_documents')
      .delete()
      .eq('id', child.id)
  }

  // Delete the folder itself
  await supabase
    .from('company_documents')
    .delete()
    .eq('id', folderId)

  deletedCount++

  return { deletedCount }
}

async function cleanupEmptyFolders(supabase: any, folderId: string) {
  const { data: children } = await supabase
    .from('company_documents')
    .select('id')
    .eq('parent_folder_id', folderId)
    .limit(1)

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

    if (folder?.parent_folder_id) {
      await cleanupEmptyFolders(supabase, folder.parent_folder_id)
    }
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

// Placeholder implementations
async function createBulkDownloadZip(supabase: any, downloads: any[], userId: string): Promise<string> {
  // This would create a zip file with all the downloads
  // For now, return a placeholder URL
  return `/api/documents/coffee-supply/bulk/download-zip?session=${Date.now()}`
}

async function shareDocument(supabase: any, options: any): Promise<any> {
  // This would call the existing share functionality
  return { shared: true, recipients: options.emails.length + options.userIds.length }
}

async function createExportZip(supabase: any, documentIds: string[], userId: string, includeMetadata?: boolean): Promise<string> {
  // This would create an export zip with documents and optionally metadata
  return `/api/documents/coffee-supply/bulk/export-zip?session=${Date.now()}&metadata=${includeMetadata}`
}

async function exportDocumentMetadata(supabase: any, documentIds: string[], format: string): Promise<any> {
  const { data: documents, error } = await supabase
    .from('company_documents')
    .select(`
      id, file_name, document_category, document_year, urgency_level,
      crop_metadata, quality_metadata, contract_metadata,
      created_at, updated_at
    `)
    .in('id', documentIds)

  if (error) {
    throw error
  }

  return format === 'json' ? documents : convertToCSV(documents)
}

function convertToCSV(data: any[]): string {
  if (!data.length) return ''

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(',')
    )
  ].join('\n')

  return csvContent
}