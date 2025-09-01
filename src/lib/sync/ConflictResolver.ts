/**
 * Conflict Resolution Manager
 * 
 * Handles conflicts that arise when multiple clients or the server
 * have different versions of the same data. Provides strategies for
 * automatic resolution and user prompts when needed.
 */

import type { QueuedOperation } from './QueueManager'
import type { TripCard } from '@/types'

export type ConflictStrategy = 'server_wins' | 'client_wins' | 'merge' | 'prompt_user'

export interface ConflictData {
  clientVersion: any
  serverVersion: any
  lastSyncTimestamp?: number
  conflictFields: string[]
}

export interface ResolvedConflict {
  data: any
  strategy: ConflictStrategy
  mergedFields?: string[]
  userChoice?: boolean
}

export interface ConflictResolutionRule {
  resource: string
  field: string
  strategy: ConflictStrategy
  customResolver?: (clientValue: any, serverValue: any, context: any) => any
}

export class ConflictResolver {
  private defaultStrategy: ConflictStrategy
  private rules: Map<string, ConflictResolutionRule[]> = new Map()
  private userPromptCallback?: (conflict: ConflictData, operation: QueuedOperation) => Promise<ResolvedConflict>

  constructor(defaultStrategy: ConflictStrategy = 'merge') {
    this.defaultStrategy = defaultStrategy
    this.setupDefaultRules()
  }

  /**
   * Register a callback for user prompts
   */
  setUserPromptCallback(
    callback: (conflict: ConflictData, operation: QueuedOperation) => Promise<ResolvedConflict>
  ): void {
    this.userPromptCallback = callback
  }

  /**
   * Add conflict resolution rule
   */
  addRule(rule: ConflictResolutionRule): void {
    const key = `${rule.resource}_${rule.field}`
    if (!this.rules.has(rule.resource)) {
      this.rules.set(rule.resource, [])
    }
    
    const rules = this.rules.get(rule.resource)!
    // Remove existing rule for same field
    const existingIndex = rules.findIndex(r => r.field === rule.field)
    if (existingIndex > -1) {
      rules.splice(existingIndex, 1)
    }
    
    rules.push(rule)
    console.log(`ConflictResolver: Added rule for ${rule.resource}.${rule.field}`)
  }

  /**
   * Resolve conflict between client and server data
   */
  async resolve(
    operation: QueuedOperation,
    conflictData: ConflictData
  ): Promise<ResolvedConflict | null> {
    console.log(`ConflictResolver: Resolving conflict for ${operation.type} ${operation.resource}`)

    const { clientVersion, serverVersion, conflictFields } = conflictData
    
    try {
      // Apply field-specific rules first
      const resolvedData = await this.applyFieldRules(
        operation.resource,
        clientVersion,
        serverVersion,
        conflictFields
      )

      if (resolvedData) {
        return resolvedData
      }

      // Fall back to strategy-based resolution
      return this.applyStrategyResolution(
        operation,
        clientVersion,
        serverVersion,
        conflictFields
      )

    } catch (error) {
      console.error('ConflictResolver: Resolution failed:', error)
      return null
    }
  }

  /**
   * Apply field-specific resolution rules
   */
  private async applyFieldRules(
    resource: string,
    clientData: any,
    serverData: any,
    conflictFields: string[]
  ): Promise<ResolvedConflict | null> {
    const resourceRules = this.rules.get(resource)
    if (!resourceRules || resourceRules.length === 0) {
      return null
    }

    let resolvedData = { ...clientData }
    const mergedFields: string[] = []
    let usedStrategy: ConflictStrategy = this.defaultStrategy

    for (const field of conflictFields) {
      const rule = resourceRules.find(r => r.field === field)
      if (!rule) continue

      const clientValue = this.getNestedValue(clientData, field)
      const serverValue = this.getNestedValue(serverData, field)

      let resolvedValue: any

      if (rule.customResolver) {
        // Use custom resolver
        resolvedValue = rule.customResolver(clientValue, serverValue, { 
          clientData, 
          serverData, 
          field 
        })
      } else {
        // Use strategy-based resolution
        resolvedValue = this.resolveFieldValue(
          clientValue,
          serverValue,
          rule.strategy
        )
        usedStrategy = rule.strategy
      }

      this.setNestedValue(resolvedData, field, resolvedValue)
      mergedFields.push(field)
    }

    if (mergedFields.length > 0) {
      return {
        data: resolvedData,
        strategy: usedStrategy,
        mergedFields
      }
    }

    return null
  }

  /**
   * Apply strategy-based conflict resolution
   */
  private async applyStrategyResolution(
    operation: QueuedOperation,
    clientData: any,
    serverData: any,
    conflictFields: string[]
  ): Promise<ResolvedConflict | null> {
    const strategy = this.getStrategyForOperation(operation)

    switch (strategy) {
      case 'server_wins':
        return {
          data: serverData,
          strategy: 'server_wins'
        }

      case 'client_wins':
        return {
          data: clientData,
          strategy: 'client_wins'
        }

      case 'merge':
        return {
          data: this.mergeData(clientData, serverData, conflictFields),
          strategy: 'merge',
          mergedFields: conflictFields
        }

      case 'prompt_user':
        if (this.userPromptCallback) {
          return this.userPromptCallback(
            { clientVersion: clientData, serverVersion: serverData, conflictFields },
            operation
          )
        } else {
          // Fall back to merge if no user prompt available
          return {
            data: this.mergeData(clientData, serverData, conflictFields),
            strategy: 'merge',
            mergedFields: conflictFields
          }
        }

      default:
        return null
    }
  }

  /**
   * Resolve individual field value based on strategy
   */
  private resolveFieldValue(
    clientValue: any,
    serverValue: any,
    strategy: ConflictStrategy
  ): any {
    switch (strategy) {
      case 'server_wins':
        return serverValue
      case 'client_wins':
        return clientValue
      case 'merge':
        return this.mergeValues(clientValue, serverValue)
      default:
        return clientValue
    }
  }

  /**
   * Merge two values intelligently
   */
  private mergeValues(clientValue: any, serverValue: any): any {
    // Handle null/undefined
    if (clientValue == null) return serverValue
    if (serverValue == null) return clientValue

    // Handle arrays
    if (Array.isArray(clientValue) && Array.isArray(serverValue)) {
      return this.mergeArrays(clientValue, serverValue)
    }

    // Handle objects
    if (typeof clientValue === 'object' && typeof serverValue === 'object') {
      return this.mergeObjects(clientValue, serverValue)
    }

    // Handle primitives - prefer newer timestamp or client value
    if (typeof clientValue === typeof serverValue) {
      // For strings, prefer non-empty value
      if (typeof clientValue === 'string') {
        return clientValue.trim() || serverValue
      }
      
      // For numbers, prefer non-zero value or larger value
      if (typeof clientValue === 'number') {
        return clientValue || serverValue
      }
      
      // For booleans, prefer client value (user intention)
      return clientValue
    }

    // Type mismatch - prefer client value
    return clientValue
  }

  /**
   * Merge two arrays by combining unique items
   */
  private mergeArrays(clientArray: any[], serverArray: any[]): any[] {
    if (!Array.isArray(clientArray)) return serverArray
    if (!Array.isArray(serverArray)) return clientArray

    // Simple merge for primitive arrays
    if (clientArray.every(item => typeof item !== 'object')) {
      return Array.from(new Set([...serverArray, ...clientArray]))
    }

    // Complex merge for object arrays (by id if available)
    const merged = [...serverArray]
    
    clientArray.forEach(clientItem => {
      if (typeof clientItem === 'object' && clientItem.id) {
        const serverIndex = merged.findIndex(item => 
          item && typeof item === 'object' && item.id === clientItem.id
        )
        
        if (serverIndex > -1) {
          // Merge existing item
          merged[serverIndex] = this.mergeObjects(merged[serverIndex], clientItem)
        } else {
          // Add new item
          merged.push(clientItem)
        }
      } else {
        // For non-id objects, just add if not duplicate
        const isDuplicate = merged.some(item => 
          JSON.stringify(item) === JSON.stringify(clientItem)
        )
        if (!isDuplicate) {
          merged.push(clientItem)
        }
      }
    })

    return merged
  }

  /**
   * Merge two objects recursively
   */
  private mergeObjects(clientObj: any, serverObj: any): any {
    if (!clientObj) return serverObj
    if (!serverObj) return clientObj

    const merged = { ...serverObj }

    Object.keys(clientObj).forEach(key => {
      if (clientObj[key] !== undefined) {
        if (serverObj[key] === undefined) {
          // Client has new property
          merged[key] = clientObj[key]
        } else {
          // Both have property - merge recursively
          merged[key] = this.mergeValues(clientObj[key], serverObj[key])
        }
      }
    })

    return merged
  }

  /**
   * Merge complete data objects
   */
  private mergeData(clientData: any, serverData: any, conflictFields: string[]): any {
    let merged = { ...serverData }

    // Apply client changes for non-conflicting fields
    Object.keys(clientData).forEach(key => {
      if (!conflictFields.includes(key)) {
        merged[key] = clientData[key]
      }
    })

    // Merge conflicting fields
    conflictFields.forEach(field => {
      const clientValue = this.getNestedValue(clientData, field)
      const serverValue = this.getNestedValue(serverData, field)
      const mergedValue = this.mergeValues(clientValue, serverValue)
      this.setNestedValue(merged, field, mergedValue)
    })

    return merged
  }

  /**
   * Get strategy for specific operation
   */
  private getStrategyForOperation(operation: QueuedOperation): ConflictStrategy {
    // Operation-specific strategy logic
    switch (operation.type) {
      case 'create':
        // For creates, prefer client data (user intention)
        return 'client_wins'
      
      case 'delete':
        // For deletes, prefer client action
        return 'client_wins'
      
      case 'update':
        // For updates, merge when possible
        return 'merge'
      
      default:
        return this.defaultStrategy
    }
  }

  /**
   * Get nested object value by dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj)
  }

  /**
   * Set nested object value by dot notation path
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      return current[key]
    }, obj)
    
    target[lastKey] = value
  }

  /**
   * Setup default resolution rules for common scenarios
   */
  private setupDefaultRules(): void {
    // Trip-specific rules
    this.addRule({
      resource: 'trip',
      field: 'title',
      strategy: 'client_wins' // User's title changes take priority
    })

    this.addRule({
      resource: 'trip',
      field: 'participants',
      strategy: 'merge', // Merge participant lists
      customResolver: (clientParticipants, serverParticipants) => {
        if (!Array.isArray(clientParticipants)) return serverParticipants
        if (!Array.isArray(serverParticipants)) return clientParticipants
        
        // Merge by user ID
        const merged = [...serverParticipants]
        clientParticipants.forEach((clientP: any) => {
          if (clientP?.id) {
            const existingIndex = merged.findIndex((serverP: any) => serverP?.id === clientP.id)
            if (existingIndex > -1) {
              // Update existing participant
              merged[existingIndex] = { ...merged[existingIndex], ...clientP }
            } else {
              // Add new participant
              merged.push(clientP)
            }
          }
        })
        return merged
      }
    })

    this.addRule({
      resource: 'trip',
      field: 'status',
      strategy: 'server_wins' // Status changes from server take priority
    })

    this.addRule({
      resource: 'trip',
      field: 'startDate',
      strategy: 'prompt_user' // Date changes should be confirmed by user
    })

    this.addRule({
      resource: 'trip',
      field: 'endDate',
      strategy: 'prompt_user' // Date changes should be confirmed by user
    })

    // Activity-specific rules
    this.addRule({
      resource: 'activity',
      field: 'notes',
      strategy: 'merge', // Merge notes content
      customResolver: (clientNotes, serverNotes) => {
        if (!clientNotes) return serverNotes
        if (!serverNotes) return clientNotes
        
        // Simple merge - combine unique notes
        const clientNotesArray = Array.isArray(clientNotes) ? clientNotes : [clientNotes]
        const serverNotesArray = Array.isArray(serverNotes) ? serverNotes : [serverNotes]
        
        return [...serverNotesArray, ...clientNotesArray].filter((note, index, arr) => 
          arr.findIndex(n => JSON.stringify(n) === JSON.stringify(note)) === index
        )
      }
    })

    console.log('ConflictResolver: Default rules configured')
  }

  /**
   * Detect conflicts between two data objects
   */
  static detectConflicts(
    clientData: any,
    serverData: any,
    ignoreFields: string[] = ['updated_at', 'modified_at', 'version']
  ): string[] {
    const conflicts: string[] = []

    if (!clientData || !serverData) return conflicts

    const allKeys = new Set([
      ...Object.keys(clientData),
      ...Object.keys(serverData)
    ])

    allKeys.forEach(key => {
      if (ignoreFields.includes(key)) return

      const clientValue = clientData[key]
      const serverValue = serverData[key]

      // Skip if values are identical
      if (JSON.stringify(clientValue) === JSON.stringify(serverValue)) return

      // Skip if one is undefined (not a conflict, just new data)
      if (clientValue === undefined || serverValue === undefined) return

      conflicts.push(key)
    })

    return conflicts
  }

  /**
   * Get conflict summary for logging/debugging
   */
  getConflictSummary(
    operation: QueuedOperation,
    conflictData: ConflictData,
    resolution: ResolvedConflict
  ): string {
    const { conflictFields } = conflictData
    const { strategy, mergedFields } = resolution

    return `Resolved ${conflictFields.length} conflicts for ${operation.type} ${operation.resource} ` +
           `using ${strategy}${mergedFields ? ` (merged: ${mergedFields.join(', ')})` : ''}`
  }
}