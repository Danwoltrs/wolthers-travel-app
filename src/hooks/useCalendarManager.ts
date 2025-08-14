/**
 * useCalendarManager Hook
 * 
 * Manages calendar state, drag-and-drop operations, activity management,
 * and integration with Supabase for the Schedule tab calendar interface.
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import { useProgressiveSave } from '@/hooks/useProgressiveSave'
import type { 
  EnhancedActivity, 
  EnhancedItineraryDay, 
  CalendarViewSettings,
  ActivityConflict
} from '@/types/enhanced-modal'
import type { Trip, Activity, ItineraryDay } from '@/types'

interface UseCalendarManagerProps {
  trip: Trip
  onUpdate?: (updates: any) => void
}

export function useCalendarManager({ trip, onUpdate }: UseCalendarManagerProps) {
  const { user } = useAuth()
  
  // Progressive save functionality
  const { 
    saveStatus, 
    scheduleAutoSave, 
    saveNow 
  } = useProgressiveSave({ 
    tripId: trip.id || '',
    onRealtimeUpdate: (event) => {
      // Handle real-time updates from other users
      console.log('Real-time update:', event)
      // Refresh data if necessary
      if (event.type === 'activity_updated' || event.type === 'trip_modified') {
        loadTripData()
      }
    }
  })
  
  // Calendar state
  const [itineraryDays, setItineraryDays] = useState<EnhancedItineraryDay[]>([])
  const [calendarSettings, setCalendarSettings] = useState<CalendarViewSettings>({
    viewType: 'day',
    timeSlotDuration: 30,
    startHour: 8,
    endHour: 20,
    showWeekends: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load trip data and activities
  const loadTripData = useCallback(async () => {
    if (!trip.id) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch itinerary days with activities
      const { data: daysData, error: daysError } = await supabase
        .from('itinerary_days')
        .select(`
          *,
          activities (
            *,
            activity_participants (
              user_id,
              users (name, email)
            )
          )
        `)
        .eq('trip_id', trip.id)
        .order('date', { ascending: true })

      if (daysError) throw daysError

      // Transform data to enhanced format
      const enhancedDays: EnhancedItineraryDay[] = (daysData || []).map((day) => ({
        ...day,
        isEditing: false,
        activities: (day.activities || []).map((activity: Activity) => ({
          ...activity,
          dragId: `activity-${activity.id}`,
          isEditing: false,
          isSelected: false,
          conflicts: [], // TODO: Calculate conflicts
          validation: {
            isValid: true,
            errors: {},
            warnings: {},
            fieldStates: {}
          }
        })),
        validation: {
          isValid: true,
          errors: {},
          warnings: {},
          fieldStates: {}
        }
      }))

      setItineraryDays(enhancedDays)
    } catch (err) {
      console.error('Error loading trip data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trip data')
    } finally {
      setIsLoading(false)
    }
  }, [trip.id, supabase])

  // Load data on mount
  useEffect(() => {
    loadTripData()
  }, [loadTripData])

  // Move activity to new day and time
  const moveActivity = useCallback(async (activityId: string, newDayId: string, newTimeSlot: string) => {
    try {
      // Find the activity
      const currentDay = itineraryDays.find(day => 
        day.activities.some(activity => activity.id === activityId)
      )
      const activity = currentDay?.activities.find(a => a.id === activityId)
      
      if (!activity || !currentDay) return

      // Update activity in database
      const { error } = await supabase
        .from('activities')
        .update({ 
          itinerary_day_id: newDayId,
          time: newTimeSlot 
        })
        .eq('id', activityId)

      if (error) throw error

      // Update local state
      setItineraryDays(prevDays => {
        return prevDays.map(day => {
          if (day.id === currentDay.id) {
            // Remove from current day
            return {
              ...day,
              activities: day.activities.filter(a => a.id !== activityId)
            }
          } else if (day.id === newDayId) {
            // Add to new day
            return {
              ...day,
              activities: [...day.activities, { ...activity, time: newTimeSlot, itinerary_day_id: newDayId }]
            }
          }
          return day
        })
      })

      // Schedule auto-save for the moved activity
      scheduleAutoSave(activityId, { dayId: newDayId, timeSlot: newTimeSlot })
      
      onUpdate?.({ type: 'activity_moved', activityId, newDayId, newTimeSlot })
    } catch (err) {
      console.error('Error moving activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to move activity')
    }
  }, [itineraryDays, supabase, onUpdate, scheduleAutoSave])

  // Save or update activity
  const saveActivity = useCallback(async (activityData: Partial<EnhancedActivity>) => {
    try {
      if (activityData.id) {
        // Update existing activity
        const { error } = await supabase
          .from('activities')
          .update({
            title: activityData.title,
            description: activityData.description,
            type: activityData.type,
            time: activityData.time,
            duration: activityData.duration,
            location: activityData.location,
            status: activityData.status,
            requires_confirmation: activityData.requiresConfirmation,
            is_private: activityData.isPrivate,
            notes: activityData.notes
          })
          .eq('id', activityData.id)

        if (error) throw error

        // Update local state
        setItineraryDays(prevDays => 
          prevDays.map(day => ({
            ...day,
            activities: day.activities.map(activity => 
              activity.id === activityData.id 
                ? { ...activity, ...activityData }
                : activity
            )
          }))
        )
      } else {
        // Create new activity
        const { data: newActivity, error } = await supabase
          .from('activities')
          .insert({
            trip_id: trip.id,
            itinerary_day_id: activityData.dayId,
            title: activityData.title,
            description: activityData.description,
            type: activityData.type,
            time: activityData.time,
            duration: activityData.duration,
            location: activityData.location,
            status: activityData.status,
            requires_confirmation: activityData.requiresConfirmation,
            is_private: activityData.isPrivate,
            notes: activityData.notes
          })
          .select()
          .single()

        if (error) throw error

        // Add to local state
        const enhancedActivity: EnhancedActivity = {
          ...newActivity,
          dragId: `activity-${newActivity.id}`,
          isEditing: false,
          isSelected: false,
          conflicts: [],
          validation: {
            isValid: true,
            errors: {},
            warnings: {},
            fieldStates: {}
          }
        }

        setItineraryDays(prevDays => 
          prevDays.map(day => 
            day.id === activityData.dayId
              ? { ...day, activities: [...day.activities, enhancedActivity] }
              : day
          )
        )
      }

      // Schedule auto-save for the activity
      if (activityData.id) {
        scheduleAutoSave(activityData.id, activityData)
      }
      
      onUpdate?.({ type: 'activity_saved', activity: activityData })
    } catch (err) {
      console.error('Error saving activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to save activity')
    }
  }, [trip.id, supabase, onUpdate, scheduleAutoSave])

  // Delete activity
  const deleteActivity = useCallback(async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)

      if (error) throw error

      // Remove from local state
      setItineraryDays(prevDays => 
        prevDays.map(day => ({
          ...day,
          activities: day.activities.filter(activity => activity.id !== activityId)
        }))
      )

      onUpdate?.({ type: 'activity_deleted', activityId })
    } catch (err) {
      console.error('Error deleting activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete activity')
    }
  }, [supabase, onUpdate])

  // Extend trip dates
  const extendTripDates = useCallback(async (direction: 'before' | 'after', days: number) => {
    try {
      // Calculate new dates
      const currentStart = new Date(trip.startDate)
      const currentEnd = new Date(trip.endDate)
      
      let newStartDate = currentStart
      let newEndDate = currentEnd

      if (direction === 'before') {
        newStartDate = new Date(currentStart)
        newStartDate.setDate(newStartDate.getDate() - days)
      } else {
        newEndDate = new Date(currentEnd)
        newEndDate.setDate(newEndDate.getDate() + days)
      }

      // Update trip dates
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          start_date: newStartDate.toISOString().split('T')[0],
          end_date: newEndDate.toISOString().split('T')[0]
        })
        .eq('id', trip.id)

      if (tripError) throw tripError

      // Create new itinerary days
      const newDays = []
      const currentDate = new Date(newStartDate)

      while (currentDate <= newEndDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        
        // Check if day already exists
        const existingDay = itineraryDays.find(day => 
          new Date(day.date).toDateString() === currentDate.toDateString()
        )

        if (!existingDay) {
          const { data: newDay, error: dayError } = await supabase
            .from('itinerary_days')
            .insert({
              trip_id: trip.id,
              date: dateStr,
              day_number: Math.floor((currentDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
              title: `Day ${Math.floor((currentDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}`,
              description: ''
            })
            .select()
            .single()

          if (dayError) throw dayError

          newDays.push({
            ...newDay,
            isEditing: false,
            activities: [],
            validation: {
              isValid: true,
              errors: {},
              warnings: {},
              fieldStates: {}
            }
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Reload data to get all days in correct order
      await loadTripData()

      onUpdate?.({ type: 'dates_extended', direction, days, newStartDate, newEndDate })
    } catch (err) {
      console.error('Error extending trip dates:', err)
      setError(err instanceof Error ? err.message : 'Failed to extend trip dates')
    }
  }, [trip, supabase, itineraryDays, loadTripData, onUpdate])

  // Update calendar settings
  const updateCalendarSettings = useCallback((updates: Partial<CalendarViewSettings>) => {
    setCalendarSettings(prev => ({ ...prev, ...updates }))
  }, [])

  // Detect activity conflicts
  const detectConflicts = useCallback((activity: EnhancedActivity): ActivityConflict[] => {
    const conflicts: ActivityConflict[] = []
    const activityDay = itineraryDays.find(day => 
      day.activities.some(a => a.id === activity.id)
    )

    if (!activityDay) return conflicts

    // Check for time overlaps
    const activityStart = new Date(`2000-01-01 ${activity.time}`)
    const activityEnd = new Date(activityStart.getTime() + (activity.duration || 60) * 60000)

    activityDay.activities.forEach(otherActivity => {
      if (otherActivity.id === activity.id) return

      const otherStart = new Date(`2000-01-01 ${otherActivity.time}`)
      const otherEnd = new Date(otherStart.getTime() + (otherActivity.duration || 60) * 60000)

      if (activityStart < otherEnd && activityEnd > otherStart) {
        conflicts.push({
          type: 'time_overlap',
          severity: 'high',
          description: `Overlaps with "${otherActivity.title}" (${otherActivity.time})`,
          conflictingActivityId: otherActivity.id,
          suggestedResolution: 'Adjust time or duration'
        })
      }
    })

    return conflicts
  }, [itineraryDays])

  return {
    // State
    itineraryDays,
    calendarSettings,
    isLoading,
    error,
    saveStatus,

    // Actions
    moveActivity,
    saveActivity,
    deleteActivity,
    extendTripDates,
    updateCalendarSettings,
    detectConflicts,
    refreshData: loadTripData,
    
    // Progressive save
    saveNow,
    scheduleAutoSave
  }
}