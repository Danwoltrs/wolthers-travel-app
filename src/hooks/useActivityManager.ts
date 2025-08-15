/**
 * useActivityManager Hook
 * 
 * Manages trip activities with full Supabase CRUD operations,
 * real-time updates, and activity statistics calculations.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import type { Activity } from '@/types'

export interface ActivityFormData {
  title: string
  description?: string
  start_time?: string
  end_time?: string
  activity_date: string
  end_date?: string  // For multi-day activities like flights and hotels
  type: 'meeting' | 'meal' | 'travel' | 'flight' | 'accommodation' | 'event' | 'break' | 'other'
  location?: string
  host?: string
  cost?: number
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'DKK'
  is_confirmed?: boolean
  notes?: string
}

export interface ActivityStats {
  totalActivities: number
  meetings: number
  visits: number
  confirmed: number
  days: number
}

export function useActivityManager(tripId: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  // Load activities via API
  const loadActivities = useCallback(async () => {
    if (!tripId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/activities?tripId=${tripId}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      console.log('📋 Activities loaded via API:', {
        tripId,
        count: data?.length || 0,
        activities: data?.map((a: any) => ({
          id: a.id,
          title: a.title,
          date: a.activity_date,
          time: a.start_time
        }))
      })
      setActivities(data || [])
    } catch (err: any) {
      console.error('Error in loadActivities:', err)
      setError(`Failed to load activities: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  // Create new activity with optimistic updates
  const createActivity = useCallback(async (activityData: ActivityFormData): Promise<Activity | null> => {
    if (!tripId) return null

    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const optimisticActivity = {
      id: tempId,
      ...activityData,
      trip_id: tripId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Set defaults for required fields
      end_date: activityData.end_date || activityData.activity_date,
      cost: activityData.cost || 0,
      currency: activityData.currency || 'BRL',
      is_confirmed: activityData.is_confirmed || false,
      status: 'scheduled'
    } as Activity

    try {
      // Optimistic update - add to UI immediately
      setActivities(prev => [...prev, optimisticActivity])
      
      setSaving(true)
      setError(null)

      const newActivity = {
        ...activityData,
        trip_id: tripId
      }

      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newActivity),
        credentials: 'include'
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setActivities(prev => prev.filter(activity => activity.id !== tempId))
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Replace optimistic activity with real one
      setActivities(prev => prev.map(activity => 
        activity.id === tempId ? data : activity
      ))

      return data
    } catch (err: any) {
      console.error('Error in createActivity:', err)
      setError(`Failed to create activity: ${err.message}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [tripId])

  // Update existing activity with optimistic updates
  const updateActivity = useCallback(async (activityId: string, updates: Partial<ActivityFormData>): Promise<Activity | null> => {
    if (!activityId) return null

    // Find the current activity for optimistic update
    const currentActivity = activities.find(a => a.id === activityId)
    if (!currentActivity) return null

    // Validate date constraints before applying updates
    const validatedUpdates = { ...updates }
    if (validatedUpdates.end_date && validatedUpdates.activity_date && validatedUpdates.end_date < validatedUpdates.activity_date) {
      console.warn('Fixing invalid end_date that was before activity_date')
      validatedUpdates.end_date = validatedUpdates.activity_date
    } else if (validatedUpdates.end_date && currentActivity.activity_date && validatedUpdates.end_date < currentActivity.activity_date) {
      console.warn('Fixing invalid end_date that was before existing activity_date')
      validatedUpdates.end_date = currentActivity.activity_date
    } else if (validatedUpdates.activity_date && currentActivity.end_date && validatedUpdates.activity_date > currentActivity.end_date) {
      console.warn('Fixing invalid activity_date that was after existing end_date')
      validatedUpdates.end_date = validatedUpdates.activity_date
    }

    try {
      // Optimistic update - update UI immediately
      const optimisticActivity = { ...currentActivity, ...validatedUpdates }
      setActivities(prev => prev.map(activity => 
        activity.id === activityId ? optimisticActivity : activity
      ))

      setSaving(true)
      setError(null)

      const response = await fetch('/api/activities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId, ...validatedUpdates }),
        credentials: 'include'
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setActivities(prev => prev.map(activity => 
          activity.id === activityId ? currentActivity : activity
        ))
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      // Real-time subscription will handle the final update
      return data
    } catch (err: any) {
      console.error('Error in updateActivity:', err)
      setError(`Failed to update activity: ${err.message}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [activities])

  // Debounced update for drag/resize operations
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateActivityDebounced = useCallback(async (activityId: string, updates: Partial<ActivityFormData>, delay = 500): Promise<void> => {
    if (!activityId) return

    // Find the current activity for optimistic update
    const currentActivity = activities.find(a => a.id === activityId)
    if (!currentActivity) return

    // Validate date constraints before applying updates
    const validatedUpdates = { ...updates }
    if (validatedUpdates.end_date && validatedUpdates.activity_date && validatedUpdates.end_date < validatedUpdates.activity_date) {
      console.warn('Fixing invalid end_date that was before activity_date')
      validatedUpdates.end_date = validatedUpdates.activity_date
    } else if (validatedUpdates.end_date && currentActivity.activity_date && validatedUpdates.end_date < currentActivity.activity_date) {
      console.warn('Fixing invalid end_date that was before existing activity_date')
      validatedUpdates.end_date = currentActivity.activity_date
    } else if (validatedUpdates.activity_date && currentActivity.end_date && validatedUpdates.activity_date > currentActivity.end_date) {
      console.warn('Fixing invalid activity_date that was after existing end_date')
      validatedUpdates.end_date = validatedUpdates.activity_date
    }

    // Optimistic update - update UI immediately
    const optimisticActivity = { ...currentActivity, ...validatedUpdates }
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? optimisticActivity : activity
    ))

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout for API call
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        setError(null)

        const response = await fetch('/api/activities', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ activityId, ...validatedUpdates }),
          credentials: 'include'
        })

        if (!response.ok) {
          // Revert optimistic update on error
          setActivities(prev => prev.map(activity => 
            activity.id === activityId ? currentActivity : activity
          ))
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Debounced update failed:', errorData.error)
          setError(`Failed to update activity: ${errorData.error}`)
        }
        // Real-time subscription will handle the final update
      } catch (err: any) {
        console.error('Error in updateActivityDebounced:', err)
        setError(`Failed to update activity: ${err.message}`)
        // Revert optimistic update on error
        setActivities(prev => prev.map(activity => 
          activity.id === activityId ? currentActivity : activity
        ))
      }
    }, delay)
  }, [activities])

  // Delete activity with optimistic updates
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    if (!activityId) return false

    // Find the activity for potential rollback
    const activityToDelete = activities.find(a => a.id === activityId)
    if (!activityToDelete) return false

    try {
      // Optimistic update - remove from UI immediately
      setActivities(prev => prev.filter(activity => activity.id !== activityId))
      
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/activities?id=${activityId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setActivities(prev => [...prev, activityToDelete])
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Real-time subscription will handle the final update
      return true
    } catch (err: any) {
      console.error('Error in deleteActivity:', err)
      setError(`Failed to delete activity: ${err.message}`)
      return false
    } finally {
      setSaving(false)
    }
  }, [activities])

  // Calculate activity statistics
  const getActivityStats = useCallback((): ActivityStats => {
    const stats = {
      totalActivities: activities.length,
      meetings: activities.filter(a => a.type === 'meeting').length,
      visits: activities.filter(a => a.type === 'meeting' || a.type === 'event').length,
      confirmed: activities.filter(a => a.is_confirmed).length,
      days: new Set(activities.map(a => a.activity_date)).size
    }
    return stats
  }, [activities])

  // Group activities by date (including multi-day spanning)
  const getActivitiesByDate = useCallback(() => {
    const grouped: Record<string, Activity[]> = {}
    
    activities.forEach(activity => {
      const startDate = new Date(activity.activity_date + 'T00:00:00')
      const endDate = new Date((activity.end_date || activity.activity_date) + 'T00:00:00')
      
      // For single-day activities or activities ending same day
      if (startDate.getTime() === endDate.getTime()) {
        const date = activity.activity_date
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(activity)
      } else {
        // For multi-day activities, add to all days they span
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split('T')[0]
          if (!grouped[dateString]) {
            grouped[dateString] = []
          }
          grouped[dateString].push(activity)
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })
    
    return grouped
  }, [activities])

  // Set up real-time subscription
  useEffect(() => {
    if (!tripId) return

    // Initial load
    loadActivities()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`activities-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          console.log('Real-time activity update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setActivities(prev => {
              // Check if we already have this activity (optimistic or real)
              const existingActivity = prev.find(activity => activity.id === payload.new.id)
              
              if (existingActivity) {
                // If it's a temp ID from optimistic update, replace it
                if (existingActivity.id.startsWith('temp-')) {
                  return prev.map(activity => 
                    activity.id === existingActivity.id ? payload.new as Activity : activity
                  )
                }
                // If it's a real ID, update it (shouldn't happen for INSERT but just in case)
                return prev.map(activity => 
                  activity.id === payload.new.id ? payload.new as Activity : activity
                )
              } else {
                // Add new activity (from other users or external sources)
                return [...prev, payload.new as Activity]
              }
            })
          } else if (payload.eventType === 'UPDATE') {
            setActivities(prev => {
              // Only update if we don't have a temporary version being processed
              const existingActivity = prev.find(activity => activity.id === payload.new.id)
              if (existingActivity && !existingActivity.id.startsWith('temp-')) {
                return prev.map(activity => 
                  activity.id === payload.new.id ? payload.new as Activity : activity
                )
              }
              return prev
            })
          } else if (payload.eventType === 'DELETE') {
            setActivities(prev => prev.filter(activity => 
              activity.id !== payload.old.id && !activity.id.startsWith('temp-')
            ))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      // Clean up debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [tripId, loadActivities])

  return {
    activities,
    loading,
    error,
    saving,
    createActivity,
    updateActivity,
    updateActivityDebounced,
    deleteActivity,
    getActivityStats,
    getActivitiesByDate,
    refreshActivities: loadActivities
  }
}