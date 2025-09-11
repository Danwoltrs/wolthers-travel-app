/**
 * useActivityManager Hook
 * 
 * Manages trip activities with full Supabase CRUD operations,
 * real-time updates, and activity statistics calculations.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'

// Activity participant interface for many-to-many relationship
export interface ActivityParticipant {
  id: string
  activity_id: string
  participant_id: string
  role: 'attendee' | 'organizer' | 'optional'
  attendance_status: 'invited' | 'confirmed' | 'declined' | 'attended'
  user_id?: string
  user_name?: string
  user_email?: string
  company_name?: string
  is_partial?: boolean
  participation_start_date?: string
  participation_end_date?: string
}

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
  // New multi-participant support fields
  visibility_level?: 'all' | 'specific' | 'private'
  assigned_team_ids?: string[]
  activity_type?: 'meeting' | 'travel' | 'meal' | 'accommodation' | 'free_time'
  company_id?: string
  company_name?: string
  is_parallel_allowed?: boolean
  branch_id?: string
  visibleToCompanies?: string[]
  // Participant information (populated from join)
  participants?: ActivityParticipant[]
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
  branch_id?: string
  visibleToCompanies?: string[]
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
    if (!tripId) {
      console.log('🚫 [useActivityManager] No tripId provided, skipping load')
      return
    }

    try {
      console.log('🔄 [useActivityManager] Starting activity load for trip:', tripId)
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/activities?tripId=${tripId}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ [useActivityManager] API error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      console.log('📋 [useActivityManager] Activities loaded via API:', {
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
      
      console.log('✅ [useActivityManager] Setting activities state:', {
        count: uniqueActivities.length,
        activities: uniqueActivities.map(a => ({
          id: a.id,
          title: a.title,
          date: a.activity_date
        }))
      })
      
      setActivities(uniqueActivities)
    } catch (err: any) {
      console.error('❌ [useActivityManager] Error in loadActivities:', err)
      setError(`Failed to load activities: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  // Create new activity with optimistic updates + refresh approach
  const createActivity = useCallback(async (activityData: ActivityFormData): Promise<Activity | null> => {
    if (!tripId) {
      console.warn('🚫 [CreateActivity] No tripId provided')
      return null
    }

    try {
      console.log('📝 [CreateActivity] Starting activity creation:', {
        tripId,
        title: activityData.title,
        date: activityData.activity_date,
        time: activityData.start_time
      })
      
      setSaving(true)
      setRefreshing(true)
      setError(null)

      // Create optimistic activity for immediate UI feedback
      const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const optimisticActivity: Activity = {
        id: optimisticId,
        trip_id: tripId,
        title: activityData.title,
        description: activityData.description,
        activity_date: activityData.activity_date,
        start_time: activityData.start_time,
        end_time: activityData.end_time,
        end_date: activityData.end_date,
        type: activityData.type,
        location: activityData.location,
        host: activityData.host,
        cost: activityData.cost,
        currency: activityData.currency,
        is_confirmed: activityData.is_confirmed,
        notes: activityData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Add optimistic activity to state immediately
      console.log('🔄 [CreateActivity] Adding optimistic activity to state')
      setActivities(prev => {
        // Check if activity already exists to prevent duplicates
        const exists = prev.find(a => 
          a.title === activityData.title && 
          a.activity_date === activityData.activity_date && 
          a.start_time === activityData.start_time
        )
        if (exists) {
          console.log('⚠️ [CreateActivity] Similar activity exists, not adding optimistic update')
          return prev
        }
        return [...prev, optimisticActivity]
      })

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
        // Remove optimistic activity on error
        console.error('❌ [CreateActivity] API call failed, removing optimistic activity')
        setActivities(prev => prev.filter(a => a.id !== optimisticId))
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ [CreateActivity] API call successful:', data.id)

      // Replace optimistic activity with real data
      console.log('🔄 [CreateActivity] Replacing optimistic activity with real data')
      setActivities(prev => prev.map(a => 
        a.id === optimisticId ? data : a
      ))
      
      // Also refresh to ensure consistency
      console.log('🔄 [CreateActivity] Force refreshing activities for consistency')
      setTimeout(() => {
        loadActivities()
      }, 500) // Small delay to let optimistic update render first
      
      console.log('✅ [CreateActivity] Activity creation complete')
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

  // Delete activity with optimistic updates + refresh approach
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    console.log('🗑️ [DeleteActivity] Starting activity deletion:', activityId)
    
    if (!activityId) {
      console.warn('🚫 [DeleteActivity] No activity ID provided')
      return false
    }

    // Find the activity for optimistic removal
    const activityToDelete = activities.find(a => a.id === activityId)
    if (!activityToDelete) {
      console.warn('⚠️ [DeleteActivity] Activity not found in local state:', activityId)
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
      setRefreshing(true)
      setError(null)

      // Optimistically remove activity from state
      console.log('🔄 [DeleteActivity] Optimistically removing activity from state')
      setActivities(prev => prev.filter(a => a.id !== activityId))

      console.log('🌍 [DeleteActivity] Making DELETE API call')
      const response = await fetch(`/api/activities?id=${activityId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      console.log('📈 [DeleteActivity] API response status:', response.status)

      if (!response.ok) {
        // Restore activity on API failure
        console.error('❌ [DeleteActivity] API call failed, restoring activity')
        setActivities(prev => {
          // Only restore if not already present
          const exists = prev.find(a => a.id === activityId)
          return exists ? prev : [...prev, activityToDelete]
        })
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const responseData = await response.json()
      console.log('✅ [DeleteActivity] API call successful:', responseData)
      
      // Verify deletion with a delayed refresh for consistency
      console.log('🔄 [DeleteActivity] Scheduling verification refresh')
      setTimeout(() => {
        loadActivities()
      }, 300) // Small delay to let optimistic update take effect
      
      console.log('✅ [DeleteActivity] Activity deletion complete')
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

  // Calculate activity statistics based on business rules
  const getActivityStats = useCallback((): ActivityStats => {
    // Meetings: Only meetings and meals count as meetings (NOT flights, drives, logistics)
    const meetingActivities = activities.filter(a => {
      // Exclude flights, travel, accommodation, and logistics regardless of type
      const title = (a.title || '').toLowerCase()
      const description = (a.description || '').toLowerCase()
      
      // Flight/travel indicators (exclude from meetings)
      const travelKeywords = [
        'flight', 'fly', 'plane', 'airplane', 'aircraft', 'airline', 
        'departure', 'arrival', 'takeoff', 'landing', 'airport',
        'drive', 'driving', 'car', 'taxi', 'uber', 'transfer',
        'check-in', 'check-out', 'hotel', 'accommodation', 'lodging'
      ]
      
      // Check if this is a travel/logistics activity
      const isTravelActivity = travelKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      )
      
      if (isTravelActivity) {
        return false
      }
      
      // Only count meetings and meals as meetings
      return a.type === 'meeting' || a.type === 'meal'
    })
    
    // Visits: Meetings at client/supplier locations (not hotel conferences)
    // Identify visits by location keywords or specific patterns
    const visitActivities = activities.filter(a => {
      // Only consider meetings and meals for visits
      if (a.type !== 'meeting' && a.type !== 'meal') {
        return false
      }
      
      // Check location for visit indicators (client/supplier premises)
      const location = (a.location || '').toLowerCase()
      const title = (a.title || '').toLowerCase()
      const description = (a.description || '').toLowerCase()
      
      // Exclude travel/logistics activities from visits (same as meetings)
      const travelKeywords = [
        'flight', 'fly', 'plane', 'airplane', 'aircraft', 'airline', 
        'departure', 'arrival', 'takeoff', 'landing', 'airport',
        'drive', 'driving', 'car', 'taxi', 'uber', 'transfer',
        'check-in', 'check-out', 'hotel', 'accommodation', 'lodging'
      ]
      
      const isTravelActivity = travelKeywords.some(keyword => 
        title.includes(keyword) || description.includes(keyword)
      )
      
      if (isTravelActivity) {
        return false
      }
      
      // Visit indicators: company offices, factories, farms, specific locations
      const visitKeywords = [
        'cooxupe', 'guaxupe', 'factory', 'farm', 'office', 'headquarters', 
        'facility', 'plantation', 'mill', 'warehouse', 'roastery', 'roaster',
        'cooperative', 'fazenda', 'sitio', 'empresa'
      ]
      
      // Hotel/conference indicators (NOT visits)
      const conferenceKeywords = [
        'hotel', 'conference', 'convention', 'center', 'ballroom', 
        'meeting room', 'conference room', 'seminar', 'symposium'
      ]
      
      // Check if it's a conference setting (exclude from visits)
      const isConference = conferenceKeywords.some(keyword => 
        location.includes(keyword) || title.includes(keyword) || description.includes(keyword)
      )
      
      if (isConference) {
        return false
      }
      
      // Check if it's a visit to client/supplier location
      const isVisit = visitKeywords.some(keyword => 
        location.includes(keyword) || title.includes(keyword) || description.includes(keyword)
      )
      
      return isVisit
    })
    
    const stats = {
      totalActivities: activities.length,
      meetings: meetingActivities.length,
      visits: visitActivities.length,
      confirmed: activities.filter(a => a.is_confirmed).length,
      days: new Set(activities.map(a => a.activity_date)).size
    }
    
    return stats
  }, [activities])

  // Group activities by date (including multi-day spanning)
  const getActivitiesByDate = useCallback(() => {
    const grouped: Record<string, Activity[]> = {}
    
    console.log('🔍 [getActivitiesByDate] Starting grouping with', activities.length, 'activities')
    
    activities.forEach(activity => {
      // Validate date fields before creating Date objects
      if (!activity.activity_date) {
        console.warn(`⚠️ Activity ${activity.title} has no activity_date, skipping`)
        return
      }

      const startDate = new Date(activity.activity_date + 'T00:00:00')
      const endDate = new Date((activity.end_date || activity.activity_date) + 'T00:00:00')
      
      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn(`⚠️ Activity ${activity.title} has invalid dates:`, {
          activity_date: activity.activity_date,
          end_date: activity.end_date
        })
        return
      }
      
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

  // **NEW**: Force refresh activities with UI state verification and race condition prevention
  const forceRefreshActivities = useCallback(async () => {
    console.log('🔄 [ForceRefresh] Forcing activities refresh')
    
    // Prevent concurrent refreshes
    if (refreshing) {
      console.log('⚠️ [ForceRefresh] Already refreshing, skipping')
      return
    }
    
    try {
      await loadActivities()
      
      // Additional verification after refresh with state consistency check
      setTimeout(() => {
        console.log('🔍 [ForceRefresh] Post-refresh state verification:', {
          activitiesCount: activities.length,
          loading,
          error
        })
        
        // Check for common state inconsistencies
        if (loading && activities.length > 0) {
          console.warn('⚠️ [ForceRefresh] State inconsistency detected: loading=true but activities exist')
        }
        
        console.log('✅ [ForceRefresh] Post-refresh verification complete')
      }, 200)
    } catch (error) {
      console.error('❌ [ForceRefresh] Force refresh failed:', error)
      setError('Failed to refresh activities. Please try again.')
    }
  }, [loadActivities, refreshing, activities.length, loading, error])

  // **NEW**: State validation helper to catch race conditions
  const validateState = useCallback(() => {
    const issues = []
    
    if (loading && activities.length > 0 && !refreshing) {
      issues.push('Loading state inconsistency: loading=true with existing activities')
    }
    
    if (saving && !loading && !refreshing) {
      issues.push('Saving without loading/refreshing state')
    }
    
    if (error && (loading || refreshing)) {
      issues.push('Error state with active loading/refreshing')
    }
    
    if (issues.length > 0) {
      console.warn('⚠️ [useActivityManager] State validation issues detected:', issues)
    }
    
    return issues.length === 0
  }, [loading, activities.length, refreshing, saving, error])

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
    forceRefreshActivities, // **NEW**: Exposed for emergency refresh
    validateState // **NEW**: State validation helper for debugging
  }
}