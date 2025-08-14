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

  // Load activities from Supabase
  const loadActivities = useCallback(async () => {
    if (!tripId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('trip_id', tripId)
        .order('activity_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (fetchError) {
        console.error('Error loading activities:', fetchError)
        setError(`Failed to load activities: ${fetchError.message}`)
        return
      }

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
    if (!tripId || !user) return null

    try {
      setSaving(true)
      setError(null)

      const newActivity = {
        ...activityData,
        trip_id: tripId,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error: createError } = await supabase
        .from('activities')
        .insert([newActivity])
        .select()
        .single()

      if (createError) {
        console.error('Error creating activity:', createError)
        setError(`Failed to create activity: ${createError.message}`)
        return null
      }

      // Update local state
      setActivities(prev => [...prev, data])
      return data
    } catch (err: any) {
      console.error('Error in createActivity:', err)
      setError(`Failed to create activity: ${err.message}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [tripId, user])

  // Update existing activity
  const updateActivity = useCallback(async (activityId: string, updates: Partial<ActivityFormData>): Promise<Activity | null> => {
    if (!activityId || !user) return null

    try {
      setSaving(true)
      setError(null)

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { data, error: updateError } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', activityId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating activity:', updateError)
        setError(`Failed to update activity: ${updateError.message}`)
        return null
      }

      // Update local state
      setActivities(prev => prev.map(activity => 
        activity.id === activityId ? data : activity
      ))
      return data
    } catch (err: any) {
      console.error('Error in updateActivity:', err)
      setError(`Failed to update activity: ${err.message}`)
      return null
    } finally {
      setSaving(false)
    }
  }, [user])

  // Delete activity
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    if (!activityId) return false

    try {
      setSaving(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)

      if (deleteError) {
        console.error('Error deleting activity:', deleteError)
        setError(`Failed to delete activity: ${deleteError.message}`)
        return false
      }

      // Update local state
      setActivities(prev => prev.filter(activity => activity.id !== activityId))
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