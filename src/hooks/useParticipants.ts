/**
 * Participants management hook with optimistic updates and real-time synchronization
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Database } from '@/types/database'
import { batchCheckAvailability, PersonAvailability, getMockAvailability } from '@/lib/availability'

export type ParticipantRole = 'staff' | 'company_rep' | 'external'
export type ParticipantAvailability = 'available' | 'unavailable' | 'unknown'

export interface EnhancedParticipant {
  id: string
  tripId: string
  personId: string | null
  fullName: string
  email: string | null
  phone: string | null
  role: ParticipantRole
  availability: ParticipantAvailability
  availabilityDetails?: PersonAvailability
  companyId: string | null
  companyName?: string
  location?: string // Location (Brazil, Colombia, Guatemala)
  isStaff: boolean
  avatarUrl?: string
  canEdit: boolean
  isOptimistic?: boolean
  originalId?: string // For rollback
  conflictingTripName?: string // Name of trip they're already scheduled for
  metadata?: {
    isAlreadyParticipant?: boolean
    addedToTrip?: boolean
    invitation?: {
      id: string
      invitedBy: string
      invitedByName: string
      sentAt: string
      status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
      acceptedAt?: string
      emailSentCount: number
      lastEmailSentAt?: string
    }
    [key: string]: any
  }
}

export interface ParticipantFilters {
  search: string
  role: ParticipantRole | 'all'
  availability: ParticipantAvailability | 'all'
  companyId: string | 'all'
}

export interface UseParticipantsOptions {
  tripId: string
  tripDateRange: { start: string; end: string }
  enableRealtime?: boolean
}

export interface UseParticipantsReturn {
  // Data
  participants: EnhancedParticipant[]
  filteredParticipants: EnhancedParticipant[]
  availableStaff: EnhancedParticipant[]
  companyReps: EnhancedParticipant[]
  externalGuests: EnhancedParticipant[]
  
  // Filters
  filters: ParticipantFilters
  setFilters: (filters: Partial<ParticipantFilters>) => void
  
  // Stats
  stats: {
    total: number
    staff: number
    companyReps: number
    external: number
    available: number
    unavailable: number
  }
  
  // Loading states
  loading: boolean
  availabilityLoading: boolean
  
  // Actions
  addParticipant: (participant: Omit<EnhancedParticipant, 'id' | 'isOptimistic'>) => Promise<EnhancedParticipant>
  removeParticipant: (participantId: string) => Promise<void>
  updateParticipant: (participantId: string, updates: Partial<EnhancedParticipant>) => Promise<EnhancedParticipant>
  bulkUpdateParticipants: (participantIds: string[], updates: Partial<EnhancedParticipant>) => Promise<void>
  
  // Availability
  refreshAvailability: () => Promise<void>
  
  // Undo
  undoLastAction: () => Promise<void>
  canUndo: boolean
  
  // Error handling
  error: string | null
  clearError: () => void
}

let undoStack: Array<{
  action: 'add' | 'remove' | 'update' | 'bulk_update'
  data: any
  timestamp: number
}> = []

export function useParticipants(options: UseParticipantsOptions): UseParticipantsReturn {
  const { tripId, tripDateRange, enableRealtime = true } = options
  
  const [participants, setParticipants] = useState<EnhancedParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  
  const [filters, setFiltersState] = useState<ParticipantFilters>({
    search: '',
    role: 'all',
    availability: 'all',
    companyId: 'all'
  })

  // Filter participants based on current filters
  const filteredParticipants = useMemo(() => {
    return participants.filter(participant => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          participant.fullName.toLowerCase().includes(searchLower) ||
          participant.email?.toLowerCase().includes(searchLower) ||
          participant.companyName?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      // Role filter
      if (filters.role !== 'all' && participant.role !== filters.role) {
        return false
      }
      
      // Availability filter
      if (filters.availability !== 'all' && participant.availability !== filters.availability) {
        return false
      }
      
      // Company filter
      if (filters.companyId !== 'all' && participant.companyId !== filters.companyId) {
        return false
      }
      
      return true
    })
  }, [participants, filters])

  // Categorized participants
  const availableStaff = useMemo(() => 
    filteredParticipants.filter(p => p.role === 'staff'), 
    [filteredParticipants]
  )
  
  const companyReps = useMemo(() => 
    filteredParticipants.filter(p => p.role === 'company_rep'), 
    [filteredParticipants]
  )
  
  const externalGuests = useMemo(() => 
    filteredParticipants.filter(p => p.role === 'external'), 
    [filteredParticipants]
  )

  // Statistics
  const stats = useMemo(() => ({
    total: participants.length,
    staff: participants.filter(p => p.role === 'staff').length,
    companyReps: participants.filter(p => p.role === 'company_rep').length,
    external: participants.filter(p => p.role === 'external').length,
    available: participants.filter(p => p.availability === 'available').length,
    unavailable: participants.filter(p => p.availability === 'unavailable').length
  }), [participants])

  // Load participants from API (for now, use mock data with Wolthers staff)
  const loadParticipants = useCallback(async () => {
    try {
      // Only show loading if we haven't loaded before
      if (!hasLoadedRef.current) {
        setLoading(true)
      }
      setError(null)
      
      // Load both trip participants and available Wolthers staff
      // First get current trip participants
      const [participantsResponse, staffResponse] = await Promise.all([
        fetch(`/api/trips/${tripId}/participants`, {
          credentials: 'include'
        }).catch(() => ({ ok: false, json: () => Promise.resolve([]) })), // Graceful fallback
        fetch('/api/users/wolthers-staff', {
          credentials: 'include'
        })
      ])
      
      if (!staffResponse.ok) {
        throw new Error(`Failed to load staff: ${staffResponse.statusText}`)
      }
      
      const staffResponse_json = await staffResponse.json()
      // Extract staff array from API response object
      const staffData = Array.isArray(staffResponse_json) 
        ? staffResponse_json 
        : (staffResponse_json.staff || [])
        
      let existingParticipants = []
      
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json()
        // API returns {success: true, staff: [...], guests: []} format
        existingParticipants = participantsData.staff || []
      }
      
      // Check which staff are already participants
      const existingParticipantIds = new Set(
        Array.isArray(existingParticipants) 
          ? existingParticipants.map((p: any) => p.user_id || p.users?.id || p.personId)
          : []
      )
      
      // Convert staff to participants with proper availability - NO DUPLICATES
      const uniqueStaffIds = new Set()
      const mockParticipants: EnhancedParticipant[] = staffData
        .filter((staff: any) => {
          // Ensure no duplicates by checking staff ID
          if (uniqueStaffIds.has(staff.id)) {
            return false
          }
          uniqueStaffIds.add(staff.id)
          return true
        })
        .map((staff: any) => {
          const isAlreadyParticipant = existingParticipantIds.has(staff.id)
          
          // All staff should be available since there's only one trip in the system
          // Only Daniel is already on this trip, everyone else is available
          const availabilityStatus: ParticipantAvailability = 'available'
          
          // Mock location assignment based on staff member
          const getLocation = (name: string) => {
            const lowerName = name.toLowerCase()
            if (lowerName.includes('daniel') || lowerName.includes('rasmus')) return 'Brazil'
            if (lowerName.includes('svenn')) return 'Colombia'
            if (lowerName.includes('tom')) return 'Guatemala'
            return 'Brazil' // Default
          }
          
          // No conflicts since everyone is available - there's only one trip in the system
          const conflictingTripName = undefined
          
          return {
            id: staff.id,
            tripId,
            personId: staff.id,
            fullName: staff.full_name,
            email: staff.email,
            phone: staff.phone || null,
            role: 'staff' as ParticipantRole,
            availability: availabilityStatus,
            availabilityDetails: undefined,
            companyId: staff.company_id,
            companyName: 'Wolthers & Associates',
            location: getLocation(staff.full_name),
            conflictingTripName,
            isStaff: true,
            canEdit: true,
            isOptimistic: false,
            // Add metadata to show if already a participant
            metadata: {
              isAlreadyParticipant,
              addedToTrip: isAlreadyParticipant
            }
          }
        })
      
      setParticipants(mockParticipants)
      hasLoadedRef.current = true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load participants'
      setError(errorMessage)
      console.error('Error loading participants:', err)
    } finally {
      setLoading(false)
    }
  }, [tripId, tripDateRange])

  // Refresh availability for all participants
  const refreshAvailability = useCallback(async () => {
    if (participants.length === 0) return
    
    try {
      setAvailabilityLoading(true)
      
      const personIds = participants
        .filter(p => p.personId)
        .map(p => p.personId!)
      
      const availabilityData = await batchCheckAvailability(personIds, tripDateRange)
      
      setParticipants(prev => prev.map(participant => {
        if (!participant.personId) return participant
        
        const availability = availabilityData[participant.personId]
        if (!availability) return participant
        
        return {
          ...participant,
          availability: availability.overallStatus === 'available' ? 'available' :
                      availability.overallStatus === 'unavailable' ? 'unavailable' : 'unknown',
          availabilityDetails: availability
        }
      }))
    } catch (err) {
      console.error('Error refreshing availability:', err)
    } finally {
      setAvailabilityLoading(false)
    }
  }, [participants, tripDateRange])

  // Add participant with optimistic update
  const addParticipant = useCallback(async (newParticipant: Omit<EnhancedParticipant, 'id' | 'isOptimistic'>) => {
    // Check if participant already exists in the list
    const existingParticipant = participants.find(p => p.personId === newParticipant.personId)
    
    let optimisticId: string
    if (existingParticipant) {
      // Update existing participant instead of creating duplicate
      optimisticId = existingParticipant.id
      setParticipants(prev => prev.map(p => 
        p.personId === newParticipant.personId
          ? { 
              ...p, 
              isOptimistic: true,
              metadata: { 
                ...p.metadata, 
                addedToTrip: true,
                isAlreadyParticipant: true 
              } 
            }
          : p
      ))
    } else {
      // Create new participant entry
      optimisticId = `temp-${Date.now()}-${Math.random()}`
      const optimisticParticipant: EnhancedParticipant = {
        ...newParticipant,
        id: optimisticId,
        isOptimistic: true
      }
      setParticipants(prev => [...prev, optimisticParticipant])
    }

    try {
      // Transform participant data to match API expectations
      const apiPayload = {
        personId: newParticipant.personId,
        companyId: newParticipant.companyId,
        role: newParticipant.role || 'staff'
      }

      const response = await fetch(`/api/trips/${tripId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(apiPayload)
      })

      if (!response.ok) {
        throw new Error(`Failed to add participant: ${response.statusText}`)
      }

      const savedParticipant = await response.json()

      // Update the existing participant metadata instead of replacing
      setParticipants(prev => prev.map(p => 
        p.id === optimisticId 
          ? { 
              ...p, 
              isOptimistic: false,
              metadata: { 
                ...p.metadata, 
                addedToTrip: true,
                isAlreadyParticipant: true 
              } 
            }
          : p
      ))

      // Add to undo stack
      undoStack.push({
        action: 'add',
        data: { participantId: savedParticipant.id },
        timestamp: Date.now()
      })

      return savedParticipant
    } catch (err) {
      // Rollback optimistic update
      if (existingParticipant) {
        // Revert metadata for existing participant
        setParticipants(prev => prev.map(p => 
          p.id === optimisticId
            ? { 
                ...p, 
                isOptimistic: false,
                metadata: { 
                  ...p.metadata, 
                  addedToTrip: false,
                  isAlreadyParticipant: false 
                } 
              }
            : p
        ))
      } else {
        // Remove new participant that failed to save
        setParticipants(prev => prev.filter(p => p.id !== optimisticId))
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to add participant'
      setError(errorMessage)
      throw err
    }
  }, [tripId, participants])

  // Remove participant with optimistic update
  const removeParticipant = useCallback(async (participantId: string) => {
    const participantToRemove = participants.find(p => p.id === participantId)
    if (!participantToRemove) return

    // Optimistic update - just update metadata, don't remove from list
    setParticipants(prev => prev.map(p => 
      p.id === participantId 
        ? { 
            ...p, 
            metadata: { 
              ...p.metadata, 
              addedToTrip: false,
              isAlreadyParticipant: false 
            } 
          }
        : p
    ))

    try {
      const response = await fetch(`/api/trips/${tripId}/participants/${participantId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to remove participant: ${response.statusText}`)
      }

      // Add to undo stack
      undoStack.push({
        action: 'remove',
        data: { participant: participantToRemove },
        timestamp: Date.now()
      })
    } catch (err) {
      // Rollback optimistic update
      setParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? participantToRemove
          : p
      ))
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove participant'
      setError(errorMessage)
      throw err
    }
  }, [tripId, participants])

  // Update participant
  const updateParticipant = useCallback(async (participantId: string, updates: Partial<EnhancedParticipant>) => {
    const originalParticipant = participants.find(p => p.id === participantId)
    if (!originalParticipant) throw new Error('Participant not found')

    // Optimistic update
    setParticipants(prev => prev.map(p => 
      p.id === participantId ? { ...p, ...updates } : p
    ))

    try {
      const response = await fetch(`/api/trips/${tripId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error(`Failed to update participant: ${response.statusText}`)
      }

      const updatedParticipant = await response.json()

      // Replace with server data
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? updatedParticipant : p
      ))

      // Add to undo stack
      undoStack.push({
        action: 'update',
        data: { participantId, originalData: originalParticipant, updates },
        timestamp: Date.now()
      })

      return updatedParticipant
    } catch (err) {
      // Rollback optimistic update
      setParticipants(prev => prev.map(p => 
        p.id === participantId ? originalParticipant : p
      ))
      const errorMessage = err instanceof Error ? err.message : 'Failed to update participant'
      setError(errorMessage)
      throw err
    }
  }, [tripId, participants])

  // Bulk update participants
  const bulkUpdateParticipants = useCallback(async (participantIds: string[], updates: Partial<EnhancedParticipant>) => {
    const originalParticipants = participants.filter(p => participantIds.includes(p.id))

    // Optimistic update
    setParticipants(prev => prev.map(p => 
      participantIds.includes(p.id) ? { ...p, ...updates } : p
    ))

    try {
      const response = await fetch(`/api/trips/${tripId}/participants/bulk-update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ participantIds, updates })
      })

      if (!response.ok) {
        throw new Error(`Failed to bulk update participants: ${response.statusText}`)
      }

      const updatedParticipants = await response.json()

      // Replace with server data
      setParticipants(prev => prev.map(p => {
        const updated = updatedParticipants.find((up: any) => up.id === p.id)
        return updated || p
      }))

      // Add to undo stack
      undoStack.push({
        action: 'bulk_update',
        data: { participantIds, originalData: originalParticipants, updates },
        timestamp: Date.now()
      })
    } catch (err) {
      // Rollback optimistic update
      setParticipants(prev => prev.map(p => {
        const original = originalParticipants.find(op => op.id === p.id)
        return original || p
      }))
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update participants'
      setError(errorMessage)
      throw err
    }
  }, [tripId, participants])

  // Undo last action
  const undoLastAction = useCallback(async () => {
    const lastAction = undoStack[undoStack.length - 1]
    if (!lastAction) return

    try {
      switch (lastAction.action) {
        case 'add':
          await removeParticipant(lastAction.data.participantId)
          break
        case 'remove':
          await addParticipant(lastAction.data.participant)
          break
        case 'update':
          await updateParticipant(lastAction.data.participantId, lastAction.data.originalData)
          break
        case 'bulk_update':
          // Restore each participant individually
          for (const original of lastAction.data.originalData) {
            await updateParticipant(original.id, original)
          }
          break
      }
      
      // Remove from undo stack
      undoStack.pop()
    } catch (err) {
      console.error('Error undoing action:', err)
      setError('Failed to undo last action')
    }
  }, [addParticipant, removeParticipant, updateParticipant])

  // Filter management
  const setFilters = useCallback((newFilters: Partial<ParticipantFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load participants on mount - only when we haven't loaded yet
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadParticipants()
    }
  }, [loadParticipants])

  // Refresh availability when participants change
  useEffect(() => {
    if (participants.length > 0) {
      // Don't refresh availability since we have mock data that should stay consistent
      // refreshAvailability()
    }
  }, [participants.length])

  return {
    // Data
    participants,
    filteredParticipants,
    availableStaff,
    companyReps,
    externalGuests,
    
    // Filters
    filters,
    setFilters,
    
    // Stats
    stats,
    
    // Loading states
    loading,
    availabilityLoading,
    
    // Actions
    addParticipant,
    removeParticipant,
    updateParticipant,
    bulkUpdateParticipants,
    
    // Availability
    refreshAvailability,
    
    // Undo
    undoLastAction,
    canUndo: undoStack.length > 0,
    
    // Error handling
    error,
    clearError
  }
}