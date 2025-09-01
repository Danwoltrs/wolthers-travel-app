/**
 * Queue Manager for Background Operations
 * 
 * Manages a persistent queue of operations that need to be synchronized
 * with the server. Supports offline storage, priority queuing, and
 * operation deduplication.
 */

export type OperationType = 'create' | 'update' | 'delete' | 'patch'
export type ResourceType = 'trip' | 'participant' | 'activity' | 'document' | 'expense'

export interface QueuedOperation {
  id: string
  type: OperationType
  resource: ResourceType
  resourceId?: string // For updates/deletes
  data?: any // Operation payload
  timestamp: number
  priority: number // Lower number = higher priority
  retryCount: number
  nextRetry?: number // When to retry this operation
  userId?: string
  dependencies?: string[] // Other operation IDs this depends on
}

export interface QueueStats {
  totalOperations: number
  pendingOperations: number
  failedOperations: number
  operationsByType: Record<string, number>
  oldestOperation?: number
}

const STORAGE_KEY = 'wolthers-sync-queue'
const MAX_QUEUE_SIZE = 1000

export class QueueManager {
  private queue: Map<string, QueuedOperation> = new Map()
  private storageKey: string

  constructor(storageKey: string = STORAGE_KEY) {
    this.storageKey = storageKey
    this.loadFromStorage()
  }

  /**
   * Add operation to queue
   */
  async enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const id = this.generateOperationId(operation)
    
    // Check for existing operation (deduplication)
    if (this.queue.has(id)) {
      console.log(`QueueManager: Operation ${id} already exists, updating...`)
      const existing = this.queue.get(id)!
      const updated = {
        ...existing,
        ...operation,
        id,
        timestamp: Date.now() // Update timestamp for deduplication
      }
      this.queue.set(id, updated)
    } else {
      const queuedOp: QueuedOperation = {
        ...operation,
        id,
        timestamp: Date.now(),
        retryCount: 0
      }
      
      this.queue.set(id, queuedOp)
      console.log(`QueueManager: Enqueued operation ${id} (${operation.type} ${operation.resource})`)
    }

    // Enforce queue size limit
    await this.enforceQueueLimit()
    
    // Persist to storage
    this.saveToStorage()

    return id
  }

  /**
   * Get operations to process (respects priority and retry delays)
   */
  async peek(limit: number = 10): Promise<QueuedOperation[]> {
    const now = Date.now()
    const operations: QueuedOperation[] = []
    
    // Filter operations that are ready to process
    const readyOps = Array.from(this.queue.values())
      .filter(op => {
        // Skip operations that are waiting for retry
        if (op.nextRetry && op.nextRetry > now) {
          return false
        }
        
        // Check dependencies
        if (op.dependencies && op.dependencies.length > 0) {
          const unfinishedDeps = op.dependencies.filter(depId => this.queue.has(depId))
          if (unfinishedDeps.length > 0) {
            return false
          }
        }
        
        return true
      })
      .sort((a, b) => {
        // Sort by priority first, then by timestamp
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }
        return a.timestamp - b.timestamp
      })
      .slice(0, limit)

    return readyOps
  }

  /**
   * Get specific operation by ID
   */
  async get(id: string): Promise<QueuedOperation | undefined> {
    return this.queue.get(id)
  }

  /**
   * Update existing operation
   */
  async update(operation: QueuedOperation): Promise<void> {
    if (this.queue.has(operation.id)) {
      this.queue.set(operation.id, operation)
      this.saveToStorage()
      console.log(`QueueManager: Updated operation ${operation.id}`)
    }
  }

  /**
   * Remove operation from queue
   */
  async remove(id: string): Promise<boolean> {
    const removed = this.queue.delete(id)
    if (removed) {
      this.saveToStorage()
      console.log(`QueueManager: Removed operation ${id}`)
    }
    return removed
  }

  /**
   * Remove multiple operations
   */
  async removeMultiple(ids: string[]): Promise<number> {
    let removed = 0
    ids.forEach(id => {
      if (this.queue.delete(id)) {
        removed++
      }
    })
    
    if (removed > 0) {
      this.saveToStorage()
      console.log(`QueueManager: Removed ${removed} operations`)
    }
    
    return removed
  }

  /**
   * Remove operations by resource ID
   */
  async removeByResourceId(resourceId: string): Promise<number> {
    const toRemove: string[] = []
    
    this.queue.forEach((op, id) => {
      if (op.resourceId === resourceId) {
        toRemove.push(id)
      }
    })

    return this.removeMultiple(toRemove)
  }

  /**
   * Clear entire queue
   */
  async clear(): Promise<void> {
    this.queue.clear()
    this.saveToStorage()
    console.log('QueueManager: Queue cleared')
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const now = Date.now()
    const operations = Array.from(this.queue.values())
    
    const operationsByType: Record<string, number> = {}
    let pendingOperations = 0
    let failedOperations = 0
    let oldestOperation: number | undefined

    operations.forEach(op => {
      const key = `${op.type}_${op.resource}`
      operationsByType[key] = (operationsByType[key] || 0) + 1
      
      if (op.nextRetry && op.nextRetry > now) {
        // Operation is waiting for retry
        if (op.retryCount > 0) {
          failedOperations++
        }
      } else {
        pendingOperations++
      }
      
      if (!oldestOperation || op.timestamp < oldestOperation) {
        oldestOperation = op.timestamp
      }
    })

    return {
      totalOperations: operations.length,
      pendingOperations,
      failedOperations,
      operationsByType,
      oldestOperation
    }
  }

  /**
   * Get operations by type and resource
   */
  async getByTypeAndResource(type: OperationType, resource: ResourceType): Promise<QueuedOperation[]> {
    return Array.from(this.queue.values())
      .filter(op => op.type === type && op.resource === resource)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Check if operation exists
   */
  async exists(type: OperationType, resource: ResourceType, resourceId?: string): Promise<boolean> {
    const id = this.generateOperationId({ type, resource, resourceId })
    return this.queue.has(id)
  }

  /**
   * Generate unique operation ID based on type, resource, and resourceId
   */
  private generateOperationId(operation: {
    type: OperationType
    resource: ResourceType
    resourceId?: string
    userId?: string
  }): string {
    const parts = [
      operation.type,
      operation.resource,
      operation.resourceId || 'new',
      operation.userId || 'system'
    ]
    return parts.join('_') + '_' + Date.now()
  }

  /**
   * Enforce queue size limits by removing oldest low-priority operations
   */
  private async enforceQueueLimit(): Promise<void> {
    if (this.queue.size <= MAX_QUEUE_SIZE) return

    const operations = Array.from(this.queue.values())
      .sort((a, b) => {
        // Sort by priority (higher priority = lower number)
        if (a.priority !== b.priority) {
          return b.priority - a.priority // Higher priority operations last
        }
        // Then by timestamp (older operations first for removal)
        return a.timestamp - b.timestamp
      })

    const toRemove = operations.slice(0, this.queue.size - MAX_QUEUE_SIZE)
    toRemove.forEach(op => {
      this.queue.delete(op.id)
      console.warn(`QueueManager: Removed old operation ${op.id} due to queue size limit`)
    })
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return

      const data = JSON.parse(stored)
      if (Array.isArray(data.operations)) {
        data.operations.forEach((op: QueuedOperation) => {
          // Validate operation structure
          if (op.id && op.type && op.resource && typeof op.timestamp === 'number') {
            this.queue.set(op.id, op)
          }
        })
        console.log(`QueueManager: Loaded ${this.queue.size} operations from storage`)
      }
    } catch (error) {
      console.error('QueueManager: Failed to load from storage:', error)
      // Clear corrupted storage
      localStorage.removeItem(this.storageKey)
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        operations: Array.from(this.queue.values()),
        timestamp: Date.now()
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('QueueManager: Failed to save to storage:', error)
      
      // If storage is full, try to make space by removing oldest operations
      if (error.name === 'QuotaExceededError') {
        const operations = Array.from(this.queue.values())
          .sort((a, b) => a.timestamp - b.timestamp)
        
        // Remove oldest 25% of operations
        const toRemove = Math.ceil(operations.length * 0.25)
        for (let i = 0; i < toRemove && i < operations.length; i++) {
          this.queue.delete(operations[i].id)
        }
        
        // Try saving again
        try {
          const data = {
            operations: Array.from(this.queue.values()),
            timestamp: Date.now()
          }
          localStorage.setItem(this.storageKey, JSON.stringify(data))
          console.log(`QueueManager: Removed ${toRemove} old operations to free storage space`)
        } catch (retryError) {
          console.error('QueueManager: Failed to save even after cleanup:', retryError)
        }
      }
    }
  }

  /**
   * Clean up expired retry operations
   */
  async cleanup(): Promise<number> {
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    const toRemove: string[] = []

    this.queue.forEach((op, id) => {
      // Remove operations older than maxAge that have failed multiple times
      if (now - op.timestamp > maxAge && op.retryCount > 3) {
        toRemove.push(id)
      }
    })

    const removed = await this.removeMultiple(toRemove)
    if (removed > 0) {
      console.log(`QueueManager: Cleaned up ${removed} expired operations`)
    }
    
    return removed
  }

  /**
   * Export queue for debugging
   */
  async export(): Promise<QueuedOperation[]> {
    return Array.from(this.queue.values())
  }
}