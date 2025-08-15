/**
 * useActivityManager Hook
 * 
 * Manages trip activities with full Supabase CRUD operations,
 * real-time updates, and activity statistics calculations.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
// Database Activity type that matches Supabase schema
export interface Activity {
  id: string
  trip_id: string
  title: string
  description?: string
  activity_date: string
  start_time?: string
  end_time?: string
  end_date?: string
  type: 'meeting' | 'meal' | 'travel' | 'flight' | 'accommodation' | 'event' | 'break' | 'other'
  location?: string
  host?: string
  cost?: number
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'DKK'
  is_confirmed?: boolean
  status?: string
  notes?: string
  priority_level?: string
  meeting_id?: string
  hotel_id?: string
  flight_id?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

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
      
      // Debug: Check for any Thursday 4 PM activities
      const thursdayActivities = data?.filter((a: any) => a.activity_date?.includes('2025-10-02')) || []
      if (thursdayActivities.length > 0) {
        console.log('🔍 [useActivityManager] Thursday (Oct 2) activities found:', thursdayActivities.map((a: any) => ({
          title: a.title,
          time: a.start_time,
          date: a.activity_date
        })))
      }
      
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
      // Track optimistic operation
      optimisticOperationsRef.current.add(tempId)
      
      // Optimistic update - add to UI immediately
      setActivities(prev => {
        console.log('🔄 Optimistic create - adding activity:', tempId)
        return [...prev, optimisticActivity]
      })
      
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
        setActivities(prev => {
          console.log('🔄 Reverting failed create:', tempId)
          return prev.filter(activity => activity.id !== tempId)
        })
        optimisticOperationsRef.current.delete(tempId)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('🔄 Create success - replacing temp with real:', tempId, '->', data.id)

      // Replace optimistic activity with real one immediately (don't wait for subscription)
      setActivities(prev => prev.map(activity => 
        activity.id === tempId ? data : activity
      ))
      
      // Remove from optimistic tracking after a brief delay to let subscription settle
      setTimeout(() => {
        optimisticOperationsRef.current.delete(tempId)
      }, 200)

      return data
    } catch (err: any) {
      console.error('Error in createActivity:', err)
      optimisticOperationsRef.current.delete(tempId)
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
      // Track optimistic operation
      optimisticOperationsRef.current.add(activityId)
      
      // Optimistic update - update UI immediately
      const optimisticActivity = { ...currentActivity, ...validatedUpdates, updated_at: new Date().toISOString() }
      setActivities(prev => {
        console.log('🔄 Optimistic update - updating activity:', activityId)
        return prev.map(activity => 
          activity.id === activityId ? optimisticActivity : activity
        )
      })

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
        setActivities(prev => {
          console.log('🔄 Reverting failed update:', activityId)
          return prev.map(activity => 
            activity.id === activityId ? currentActivity : activity
          )
        })
        optimisticOperationsRef.current.delete(activityId)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('🔄 Update success:', activityId)
      
      // Update with real data immediately (don't wait for subscription)
      setActivities(prev => prev.map(activity => 
        activity.id === activityId ? data : activity
      ))
      
      // Remove from optimistic tracking after a brief delay to let subscription settle
      setTimeout(() => {
        optimisticOperationsRef.current.delete(activityId)
      }, 200)
      
      return data
    } catch (err: any) {
      console.error('Error in updateActivity:', err)
      optimisticOperationsRef.current.delete(activityId)
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

    // Track optimistic operation (but don't clear until API completes)
    optimisticOperationsRef.current.add(activityId)
    
    // Optimistic update - update UI immediately with visual feedback
    const optimisticActivity = { ...currentActivity, ...validatedUpdates, updated_at: new Date().toISOString() }
    setActivities(prev => {
      console.log('🔄 Optimistic debounced update - updating activity:', activityId)
      return prev.map(activity => 
        activity.id === activityId ? optimisticActivity : activity
      )
    })

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
          setActivities(prev => {
            console.log('🔄 Reverting failed debounced update:', activityId)
            return prev.map(activity => 
              activity.id === activityId ? currentActivity : activity
            )
          })
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Debounced update failed:', errorData.error)
          setError(`Failed to update activity: ${errorData.error}`)
        } else {
          const data = await response.json()
          console.log('🔄 Debounced update success:', activityId)
          
          // Update with real data immediately
          setActivities(prev => prev.map(activity => 
            activity.id === activityId ? data : activity
          ))
        }
        
        // Remove from optimistic tracking after a brief delay
        setTimeout(() => {
          optimisticOperationsRef.current.delete(activityId)
        }, 200)
      } catch (err: any) {
        console.error('Error in updateActivityDebounced:', err)
        setError(`Failed to update activity: ${err.message}`)
        // Revert optimistic update on error
        setActivities(prev => {
          console.log('🔄 Reverting failed debounced update (catch):', activityId)
          return prev.map(activity => 
            activity.id === activityId ? currentActivity : activity
          )
        })
        optimisticOperationsRef.current.delete(activityId)
      }
    }, delay)
  }, [activities])

  // Delete activity with optimistic updates
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    console.log('🗑️ [useActivityManager] deleteActivity called with ID:', activityId)
    
    if (!activityId) {
      console.warn('🗑️ [useActivityManager] No activity ID provided')
      return false
    }

    // Find the activity for potential rollback
    const activityToDelete = activities.find(a => a.id === activityId)
    if (!activityToDelete) {
      console.warn('🗑️ [useActivityManager] Activity not found in local state:', activityId)
      return false
    }

    console.log('🗑️ [useActivityManager] Found activity to delete:', {
      id: activityToDelete.id,
      title: activityToDelete.title,
      date: activityToDelete.activity_date,
      time: activityToDelete.start_time
    })

    try {
      // Track optimistic operation
      optimisticOperationsRef.current.add(activityId)
      console.log('🗑️ [useActivityManager] Added to optimistic operations tracking')
      
      // Optimistic update - remove from UI immediately
      setActivities(prev => {
        console.log('🔄 [useActivityManager] Optimistic delete - removing activity:', activityId)
        console.log('🔄 [useActivityManager] Activities before delete:', prev.length)
        const filtered = prev.filter(activity => activity.id !== activityId)
        console.log('🔄 [useActivityManager] Activities after delete:', filtered.length)
        return filtered
      })
      
      setSaving(true)
      setError(null)

      console.log('🗑️ [useActivityManager] Making DELETE API call to:', `/api/activities?id=${activityId}`)
      const response = await fetch(`/api/activities?id=${activityId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      console.log('🗑️ [useActivityManager] DELETE API response status:', response.status)

      if (!response.ok) {
        console.error('🗑️ [useActivityManager] DELETE API failed with status:', response.status)
        // Revert optimistic update on error
        setActivities(prev => {
          console.log('🔄 [useActivityManager] Reverting failed delete:', activityId)
          return [...prev, activityToDelete].sort((a, b) => 
            new Date(a.activity_date + ' ' + (a.start_time || '00:00')).getTime() - 
            new Date(b.activity_date + ' ' + (b.start_time || '00:00')).getTime()
          )
        })
        optimisticOperationsRef.current.delete(activityId)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const responseData = await response.json()
      console.log('🔄 [useActivityManager] Delete success:', activityId, 'Response:', responseData)
      
      // Remove from optimistic tracking after a brief delay to let subscription settle
      setTimeout(() => {
        console.log('🗑️ [useActivityManager] Removing from optimistic tracking:', activityId)
        optimisticOperationsRef.current.delete(activityId)
      }, 200)
      
      return true
    } catch (err: any) {
      console.error('❌ [useActivityManager] Error in deleteActivity:', err)
      optimisticOperationsRef.current.delete(activityId)
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
      
      console.log(`📅 Processing activity: ${activity.title}`, {
        activity_date: activity.activity_date,
        end_date: activity.end_date,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isMultiDay: startDate.getTime() !== endDate.getTime()
      })
      
      // For single-day activities or activities ending same day
      if (startDate.getTime() === endDate.getTime()) {
        const date = activity.activity_date
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(activity)
        console.log(`📍 Added single-day activity to ${date}`)
      } else {
        // For multi-day activities, add to all days they span
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split('T')[0]
          if (!grouped[dateString]) {
            grouped[dateString] = []
          }
          grouped[dateString].push(activity)
          console.log(`📍 Added multi-day activity to ${dateString}`)
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    })
    
    console.log('📋 Final grouped activities:', Object.keys(grouped).map(date => ({
      date,
      count: grouped[date].length,
      activities: grouped[date].map(a => a.title)
    })))
    
    return grouped
  }, [activities])

  // Track optimistic operations to prevent subscription conflicts
  const optimisticOperationsRef = useRef<Set<string>>(new Set())
  const pendingCreatesRef = useRef<Map<string, string>>(new Map()) // tempId -> real id when received

  // Set up real-time subscription
  useEffect(() => {
    if (!tripId) return

    // Initial load
    loadActivities()

    // Set up real-time subscription with improved handling
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
          console.log('🔄 Real-time activity update:', payload.eventType, payload)
          
          // Add slight delay to ensure optimistic updates are processed first
          setTimeout(() => {
            if (payload.eventType === 'INSERT') {
              setActivities(prev => {
                // Check if we have a temp activity that should be replaced
                const tempActivity = prev.find(activity => 
                  activity.id.startsWith('temp-') && 
                  activity.title === payload.new.title &&
                  activity.activity_date === payload.new.activity_date &&
                  activity.start_time === payload.new.start_time
                )
                
                if (tempActivity) {
                  // Replace temp activity with real one
                  console.log('🔄 Replacing temp activity:', tempActivity.id, 'with real:', payload.new.id)
                  optimisticOperationsRef.current.delete(tempActivity.id)
                  return prev.map(activity => 
                    activity.id === tempActivity.id ? payload.new as Activity : activity
                  )
                }
                
                // Check if we already have this real activity
                const existingActivity = prev.find(activity => activity.id === payload.new.id)
                if (existingActivity) {
                  // Update existing activity (shouldn't happen for INSERT but handle gracefully)
                  return prev.map(activity => 
                    activity.id === payload.new.id ? payload.new as Activity : activity
                  )
                } else {
                  // Add new activity (from other users or external sources)
                  console.log('🔄 Adding new activity from subscription:', payload.new.id)
                  return [...prev, payload.new as Activity]
                }
              })
            } else if (payload.eventType === 'UPDATE') {
              setActivities(prev => {
                // Don't apply subscription updates if we have a pending optimistic operation
                if (optimisticOperationsRef.current.has(payload.new.id)) {
                  console.log('🔄 Skipping subscription update for optimistic operation:', payload.new.id)
                  return prev
                }
                
                const existingActivity = prev.find(activity => activity.id === payload.new.id)
                if (existingActivity) {
                  console.log('🔄 Updating activity from subscription:', payload.new.id)
                  return prev.map(activity => 
                    activity.id === payload.new.id ? payload.new as Activity : activity
                  )
                } else {
                  // Activity doesn't exist locally, add it (might be from another user)
                  console.log('🔄 Adding updated activity from subscription:', payload.new.id)
                  return [...prev, payload.new as Activity]
                }
              })
            } else if (payload.eventType === 'DELETE') {
              setActivities(prev => {
                console.log('🔄 Removing activity from subscription:', payload.old.id)
                return prev.filter(activity => activity.id !== payload.old.id)
              })
            }
          }, 50) // 50ms delay to let optimistic updates settle
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      // Clean up debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      // Clear optimistic operations tracking
      optimisticOperationsRef.current.clear()
      pendingCreatesRef.current.clear()
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