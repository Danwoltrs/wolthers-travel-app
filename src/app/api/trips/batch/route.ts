/**
 * Batch API endpoint for trip operations
 * Handles multiple trip operations in a single request for efficient synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ConflictResolver } from '@/lib/sync/ConflictResolver'

interface BatchOperation {
  id: string
  type: 'create' | 'update' | 'delete' | 'patch'
  resourceId?: string
  data?: any
  timestamp: number
}

interface BatchRequest {
  operations: BatchOperation[]
}

interface BatchResult {
  operationId: string
  success: boolean
  error?: string
  conflicts?: any[]
  data?: any
}

export async function POST(request: NextRequest) {
  try {
    console.log('Batch API: Processing batch operations')
    
    const supabase = createServerSupabaseClient()
    const conflictResolver = new ConflictResolver('merge')
    
    // Parse request body
    let body: BatchRequest
    try {
      body = await request.json()
    } catch (error) {
      console.error('Batch API: Invalid JSON body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { operations } = body
    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json(
        { error: 'Operations array is required and cannot be empty' },
        { status: 400 }
      )
    }

    console.log(`Batch API: Processing ${operations.length} operations`)

    // Validate user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Batch API: Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Process operations in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 5
    const results: BatchResult[] = []
    
    for (let i = 0; i < operations.length; i += CONCURRENCY_LIMIT) {
      const batch = operations.slice(i, i + CONCURRENCY_LIMIT)
      const batchResults = await Promise.allSettled(
        batch.map(op => processOperation(supabase, conflictResolver, op, user.id))
      )
      
      // Convert Promise results to BatchResult format
      batchResults.forEach((result, index) => {
        const operation = batch[index]
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error(`Batch API: Operation ${operation.id} failed:`, result.reason)
          results.push({
            operationId: operation.id,
            success: false,
            error: result.reason instanceof Error ? result.reason.message : String(result.reason)
          })
        }
      })
    }

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length
    
    console.log(`Batch API: Completed - ${successCount} successful, ${errorCount} failed`)

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: operations.length,
        successful: successCount,
        failed: errorCount
      }
    })

  } catch (error) {
    console.error('Batch API: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process individual operation with conflict detection and resolution
 */
async function processOperation(
  supabase: any,
  conflictResolver: ConflictResolver,
  operation: BatchOperation,
  userId: string
): Promise<BatchResult> {
  const { id, type, resourceId, data, timestamp } = operation

  try {
    switch (type) {
      case 'create':
        return await handleCreateOperation(supabase, id, data, userId)
      
      case 'update':
        return await handleUpdateOperation(supabase, conflictResolver, id, resourceId!, data, timestamp, userId)
      
      case 'delete':
        return await handleDeleteOperation(supabase, id, resourceId!, userId)
      
      case 'patch':
        return await handlePatchOperation(supabase, conflictResolver, id, resourceId!, data, timestamp, userId)
      
      default:
        throw new Error(`Unsupported operation type: ${type}`)
    }
  } catch (error) {
    console.error(`Operation ${id} failed:`, error)
    return {
      operationId: id,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Handle create operation
 */
async function handleCreateOperation(
  supabase: any,
  operationId: string,
  tripData: any,
  userId: string
): Promise<BatchResult> {
  // Remove temporary ID if present
  const { id: tempId, ...cleanData } = tripData
  
  const { data, error } = await supabase
    .from('trips')
    .insert({
      ...cleanData,
      created_by: userId,
      updated_by: userId
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Create failed: ${error.message}`)
  }

  return {
    operationId,
    success: true,
    data
  }
}

/**
 * Handle update operation with conflict detection
 */
async function handleUpdateOperation(
  supabase: any,
  conflictResolver: ConflictResolver,
  operationId: string,
  tripId: string,
  updates: any,
  clientTimestamp: number,
  userId: string
): Promise<BatchResult> {
  // Get current server version
  const { data: currentTrip, error: fetchError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (fetchError) {
    throw new Error(`Trip not found: ${fetchError.message}`)
  }

  // Check for conflicts
  const serverTimestamp = new Date(currentTrip.updated_at).getTime()
  const conflictFields = ConflictResolver.detectConflicts(updates, currentTrip)
  
  let finalData = updates
  const conflicts: any[] = []

  if (conflictFields.length > 0 && serverTimestamp > clientTimestamp) {
    console.log(`Conflict detected for trip ${tripId}:`, conflictFields)
    
    // Attempt automatic conflict resolution
    const resolved = await conflictResolver.resolve(
      {
        id: operationId,
        type: 'update',
        resource: 'trip',
        resourceId: tripId,
        data: updates,
        timestamp: clientTimestamp,
        priority: 2,
        retryCount: 0
      },
      {
        clientVersion: updates,
        serverVersion: currentTrip,
        conflictFields,
        lastSyncTimestamp: clientTimestamp
      }
    )

    if (resolved) {
      finalData = resolved.data
      console.log(`Auto-resolved conflicts using ${resolved.strategy}`)
    } else {
      // Return conflict for manual resolution
      conflicts.push({
        fields: conflictFields,
        clientVersion: updates,
        serverVersion: currentTrip
      })
      
      return {
        operationId,
        success: false,
        conflicts,
        error: 'Conflict resolution required'
      }
    }
  }

  // Perform update
  const { data, error } = await supabase
    .from('trips')
    .update({
      ...finalData,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', tripId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Update failed: ${error.message}`)
  }

  return {
    operationId,
    success: true,
    data,
    conflicts: conflicts.length > 0 ? conflicts : undefined
  }
}

/**
 * Handle delete operation
 */
async function handleDeleteOperation(
  supabase: any,
  operationId: string,
  tripId: string,
  userId: string
): Promise<BatchResult> {
  // Soft delete by updating status
  const { data, error } = await supabase
    .from('trips')
    .update({
      status: 'cancelled',
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', tripId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }

  return {
    operationId,
    success: true,
    data
  }
}

/**
 * Handle patch operation (partial update without conflict detection)
 */
async function handlePatchOperation(
  supabase: any,
  conflictResolver: ConflictResolver,
  operationId: string,
  tripId: string,
  patches: any,
  clientTimestamp: number,
  userId: string
): Promise<BatchResult> {
  // Similar to update but less strict conflict handling
  const { data, error } = await supabase
    .from('trips')
    .update({
      ...patches,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', tripId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Patch failed: ${error.message}`)
  }

  return {
    operationId,
    success: true,
    data
  }
}

// Export method types for type safety
export type { BatchOperation, BatchRequest, BatchResult }