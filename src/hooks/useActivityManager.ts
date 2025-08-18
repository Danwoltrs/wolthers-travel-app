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
  const [refreshing, setRefreshing] = useState(false) // New: Loading state for refresh operations
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
      
      // Debug: Check for any Thursday activities and duplicates
      const thursdayActivities = data?.filter((a: any) => a.activity_date?.includes('2025-10-02')) || []
      if (thursdayActivities.length > 0) {
        console.log('🔍 [useActivityManager] Thursday (Oct 2) activities found:', thursdayActivities.length, 'activities')
        
        // Show test activities with full details
        const testActivities = thursdayActivities.filter((a: any) => a.title?.toLowerCase().includes('test'))
        if (testActivities.length > 0) {
          console.log('🔍 [useActivityManager] Test activities on Thursday:', testActivities.map((a: any) => ({
            id: a.id,
            title: a.title,
            activity_date: a.activity_date,
            start_time: a.start_time,
            end_time: a.end_time
          })))
        }
        
        // Check for duplicates
        const titles = thursdayActivities.map((a: any) => a.title)
        const uniqueTitles = [...new Set(titles)]
        if (titles.length !== uniqueTitles.length) {
          console.warn('⚠️ [useActivityManager] Duplicate activities detected!')
          console.log('All titles:', titles)
          console.log('Unique titles:', uniqueTitles)
        }
      }
      
      // Deduplicate activities by ID before setting
      const uniqueActivities = data?.reduce((acc: any[], activity: any) => {
        if (!acc.find(a => a.id === activity.id)) {
          acc.push(activity)
        }
        return acc
      }, []) || []
      
      if ((data?.length || 0) !== uniqueActivities.length) {
        console.warn('⚠️ [useActivityManager] Removed', (data?.length || 0) - uniqueActivities.length, 'duplicate activities')
      }
      
      setActivities(uniqueActivities)
    } catch (err: any) {
      console.error('Error in loadActivities:', err)
      setError(`Failed to load activities: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  // Create new activity with simple loading + refresh approach
  const createActivity = useCallback(async (activityData: ActivityFormData): Promise<Activity | null> => {
    if (!tripId) return null

    try {
      console.log('📝 [CreateActivity] Starting activity creation:', {
        title: activityData.title,
        date: activityData.activity_date,
        time: activityData.start_time
      })
      
      setSaving(true)
      setRefreshing(true) // Show loading state
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ [CreateActivity] API call successful:', data.id)

      // Force refresh activities to show the new activity
      console.log('🔄 [CreateActivity] Refreshing activities to show new activity')
      await loadActivities()
      
      console.log('✅ [CreateActivity] Activity creation and refresh complete')
      return data
    } catch (err: any) {
      console.error('❌ [CreateActivity] Error:', err)
      setError(`Failed to create activity: ${err.message}`)
      return null
    } finally {
      setSaving(false)
      setRefreshing(false)
    }
  }, [tripId, loadActivities])

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
  const cleanupTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())
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

  // Delete activity with simple loading + refresh approach
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    console.log('🗑️ [DeleteActivity] Starting activity deletion:', activityId)
    
    if (!activityId) {
      console.warn('🗑️ [DeleteActivity] No activity ID provided')
      return false
    }

    // Find the activity for logging
    const activityToDelete = activities.find(a => a.id === activityId)
    if (!activityToDelete) {
      console.warn('🗑️ [DeleteActivity] Activity not found in local state:', activityId)
      return false
    }

    console.log('🗑️ [DeleteActivity] Found activity to delete:', {
      id: activityToDelete.id,
      title: activityToDelete.title,
      date: activityToDelete.activity_date,
      time: activityToDelete.start_time
    })

    try {
      setSaving(true)
      setRefreshing(true) // Show loading state
      setError(null)

      console.log('🗑️ [DeleteActivity] Making DELETE API call')
      const response = await fetch(`/api/activities?id=${activityId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      console.log('🗑️ [DeleteActivity] API response status:', response.status)

      if (!response.ok) {
        console.error('🗑️ [DeleteActivity] API call failed with status:', response.status)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const responseData = await response.json()
      console.log('✅ [DeleteActivity] API call successful:', responseData)
      
      // Force refresh activities to reflect the deletion
      console.log('🔄 [DeleteActivity] Refreshing activities to reflect deletion')
      await loadActivities()
      
      console.log('✅ [DeleteActivity] Activity deletion and refresh complete')
      return true
    } catch (err: any) {
      console.error('❌ [DeleteActivity] Error:', err)
      setError(`Failed to delete activity: ${err.message}`)
      return false
    } finally {
      setSaving(false)
      setRefreshing(false)
    }
  }, [activities, loadActivities])

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

  // Track optimistic operations (simplified)
  const optimisticOperationsRef = useRef<Set<string>>(new Set())

  // Simplified setup with just initial load - no complex real-time subscriptions
  useEffect(() => {
    if (!tripId) return

    console.log('🔄 [useActivityManager] Loading activities for trip:', tripId)
    loadActivities()

    return () => {
      // Clean up debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      console.log('🧹 [useActivityManager] Cleanup completed for trip:', tripId)
    }
  }, [tripId, loadActivities])

  // **NEW**: Force refresh activities with UI state verification
  const forceRefreshActivities = useCallback(async () => {
    console.log('🔄 [ForceRefresh] Forcing activities refresh')
    try {
      await loadActivities()
      
      // Additional verification after refresh
      setTimeout(() => {
        console.log('🔍 [ForceRefresh] Post-refresh verification complete')
      }, 200)
    } catch (error) {
      console.error('❌ [ForceRefresh] Force refresh failed:', error)
      setError('Failed to refresh activities. Please try again.')
    }
  }, [loadActivities])

  return {
    activities,
    loading,
    error,
    saving,
    refreshing, // New: Expose refreshing state for loading overlays
    createActivity,
    updateActivity,
    updateActivityDebounced,
    deleteActivity,
    getActivityStats,
    getActivitiesByDate,
    refreshActivities: loadActivities,
    forceRefreshActivities // **NEW**: Exposed for emergency refresh
  }
}