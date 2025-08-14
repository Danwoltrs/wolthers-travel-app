/**
 * useProgressiveSave Hook
 * 
 * Provides progressive save functionality for calendar activities
 * with debouncing, conflict resolution, and real-time updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSupabase } from '@/hooks/useSupabase'
import type { 
  ProgressiveSaveRequest, 
  ProgressiveSaveResponse, 
  SaveStatus,
  RealtimeUpdateEvent
} from '@/types/enhanced-modal'

interface UseProgressiveSaveProps {
  tripId: string
  autoSaveDelay?: number
  onRealtimeUpdate?: (event: RealtimeUpdateEvent) => void
}

export function useProgressiveSave({ 
  tripId, 
  autoSaveDelay = 2000,
  onRealtimeUpdate 
}: UseProgressiveSaveProps) {
  const { supabase } = useSupabase()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    status: 'idle',
    error: null
  })
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingChangesRef = useRef<Map<string, any>>(new Map())

  // Set up real-time subscription
  useEffect(() => {
    if (!tripId || !onRealtimeUpdate) return

    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          const event: RealtimeUpdateEvent = {
            type: 'activity_updated',
            tripId,
            entityId: payload.new?.id || payload.old?.id,
            data: payload.new || payload.old,
            timestamp: new Date(),
            userId: 'system' // In real app, get from auth context
          }
          onRealtimeUpdate(event)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_days',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          const event: RealtimeUpdateEvent = {
            type: 'trip_modified',
            tripId,
            entityId: payload.new?.id || payload.old?.id,
            data: payload.new || payload.old,
            timestamp: new Date(),
            userId: 'system'
          }
          onRealtimeUpdate(event)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tripId, supabase, onRealtimeUpdate])

  // Progressive save function
  const progressiveSave = useCallback(async (request: ProgressiveSaveRequest): Promise<ProgressiveSaveResponse> => {
    setSaveStatus(prev => ({ ...prev, isSaving: true, status: 'saving', error: null }))

    try {
      const response = await fetch('/api/trips/progressive-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`)
      }

      const result: ProgressiveSaveResponse = await response.json()

      if (result.success) {
        setSaveStatus({
          isSaving: false,
          status: 'success',
          error: null
        })
      } else {
        setSaveStatus({
          isSaving: false,
          status: 'error',
          error: result.error || 'Save failed'
        })
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      setSaveStatus({
        isSaving: false,
        status: 'error',
        error: errorMessage
      })

      return {
        success: false,
        savedData: {},
        validation: {
          isValid: false,
          errors: { general: [errorMessage] },
          warnings: {},
          fieldStates: {}
        },
        conflicts: [],
        timestamp: new Date(),
        error: errorMessage
      }
    }
  }, [])

  // Auto-save with debouncing
  const scheduleAutoSave = useCallback((entityId: string, data: any) => {
    // Store pending changes
    pendingChangesRef.current.set(entityId, data)

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Schedule new save
    saveTimeoutRef.current = setTimeout(async () => {
      const pendingChanges = Array.from(pendingChangesRef.current.entries())
      
      if (pendingChanges.length === 0) return

      // Prepare progressive save request
      const request: ProgressiveSaveRequest = {
        tripId,
        tab: 'schedule',
        formData: {
          schedule: {
            originalStartDate: new Date(),
            originalEndDate: new Date(),
            startDate: new Date(),
            endDate: new Date(),
            itineraryDays: [],
            dragDropState: {
              draggedActivity: null,
              dropTarget: null,
              isDragging: false,
              dragPreview: null
            },
            calendarView: {
              viewType: 'day',
              timeSlotDuration: 30,
              startHour: 8,
              endHour: 20,
              showWeekends: true
            }
          }
        },
        options: {
          isAutoSave: true,
          validationLevel: 'basic',
          conflictResolution: 'merge'
        }
      }

      await progressiveSave(request)
      
      // Clear pending changes after save
      pendingChangesRef.current.clear()
    }, autoSaveDelay)
  }, [tripId, autoSaveDelay, progressiveSave])

  // Manual save
  const saveNow = useCallback(async (data: any) => {
    const request: ProgressiveSaveRequest = {
      tripId,
      tab: 'schedule',
      formData: data,
      options: {
        isAutoSave: false,
        validationLevel: 'full',
        conflictResolution: 'prompt'
      }
    }

    return await progressiveSave(request)
  }, [tripId, progressiveSave])

  // Clear pending saves
  const clearPendingSaves = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    pendingChangesRef.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingSaves()
    }
  }, [clearPendingSaves])

  return {
    saveStatus,
    scheduleAutoSave,
    saveNow,
    clearPendingSaves,
    hasPendingChanges: pendingChangesRef.current.size > 0
  }
}