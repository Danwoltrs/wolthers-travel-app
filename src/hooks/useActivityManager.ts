/**
 * useActivityManager Hook
 * 
 * Manages trip activities with full Supabase CRUD operations,
 * real-time updates, and activity statistics calculations.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import type { Activity } from '@/types'

export interface ActivityFormData {
  title: string
  description?: string
  start_time?: string
  end_time?: string
  activity_date: string
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

  // Create new activity
  const createActivity = useCallback(async (activityData: ActivityFormData): Promise<Activity | null> => {
    if (!tripId) return null

    try {
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Force refresh to ensure consistency
      await loadActivities()
      return data
    } catch (err: any) {
      console.error('Error in createActivity:', err)
      setError(`Failed to create activity: ${err.message}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [tripId])

  // Update existing activity
  const updateActivity = useCallback(async (activityId: string, updates: Partial<ActivityFormData>): Promise<Activity | null> => {
    if (!activityId) return null

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/activities', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activityId, ...updates }),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()

      // Force refresh to ensure consistency
      await loadActivities()
      return data
    } catch (err: any) {
      console.error('Error in updateActivity:', err)
      setError(`Failed to update activity: ${err.message}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  // Delete activity
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    if (!activityId) return false

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/activities?id=${activityId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Force refresh to ensure consistency
      await loadActivities()
      return true
    } catch (err: any) {
      console.error('Error in deleteActivity:', err)
      setError(`Failed to delete activity: ${err.message}`)
      return false
    } finally {
      setSaving(false)
    }
  }, [])

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

  // Group activities by date
  const getActivitiesByDate = useCallback(() => {
    const grouped: Record<string, Activity[]> = {}
    activities.forEach(activity => {
      const date = activity.activity_date
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(activity)
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
            setActivities(prev => [...prev, payload.new as Activity])
          } else if (payload.eventType === 'UPDATE') {
            setActivities(prev => prev.map(activity => 
              activity.id === payload.new.id ? payload.new as Activity : activity
            ))
          } else if (payload.eventType === 'DELETE') {
            setActivities(prev => prev.filter(activity => activity.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [tripId, loadActivities])

  return {
    activities,
    loading,
    error,
    saving,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivityStats,
    getActivitiesByDate,
    refreshActivities: loadActivities
  }
}