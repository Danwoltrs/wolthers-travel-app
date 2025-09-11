/**
 * CalendarView Component
 * 
 * Main calendar interface with drag-and-drop functionality, time slots,
 * and comprehensive activity management for the Schedule tab.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { OptimizedDndProvider } from '@/components/shared/OptimizedDndProvider'
import { CalendarHeader } from './CalendarHeader'
import { TimeSlot } from './TimeSlot'
import { ActivityCard } from './ActivityCard'
import { DateExtension } from './DateExtension'
import type { 
  EnhancedActivity, 
  EnhancedItineraryDay, 
  CalendarViewSettings,
  DragDropState,
  DropTarget
} from '@/types/enhanced-modal'
import type { Trip } from '@/types'
import type { ActivityStats } from '@/hooks/useActivityManager'

interface CalendarViewProps {
  trip: Trip
  itineraryDays: EnhancedItineraryDay[]
  calendarSettings: CalendarViewSettings
  onActivityMove: (activityId: string, newDayId: string, newTimeSlot: string) => void
  onActivityEdit: (activity: EnhancedActivity) => void
  onActivityDelete: (activityId: string) => void
  onActivityAdd: (dayId: string, timeSlot: string) => void
  onDateExtend: (direction: 'before' | 'after', days: number) => void
  onSettingsChange: (settings: Partial<CalendarViewSettings>) => void
  getActivityStats?: () => ActivityStats
}

export function CalendarView({
  trip,
  itineraryDays,
  calendarSettings,
  onActivityMove,
  onActivityEdit,
  onActivityDelete,
  onActivityAdd,
  onDateExtend,
  onSettingsChange,
  getActivityStats
}: CalendarViewProps) {
  const [dragState, setDragState] = useState<DragDropState>({
    draggedActivity: null,
    dropTarget: null,
    isDragging: false,
    dragPreview: null
  })

  // Generate time slots based on settings
  const timeSlots = useMemo(() => {
    const slots = []
    const { startHour, endHour, timeSlotDuration } = calendarSettings
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    
    return slots
  }, [calendarSettings.startHour, calendarSettings.endHour, calendarSettings.timeSlotDuration])

  // Handle drag start
  const handleDragStart = useCallback((activity: EnhancedActivity) => {
    setDragState(prev => ({
      ...prev,
      draggedActivity: activity,
      isDragging: true,
      dragPreview: {
        activity,
        newTime: activity.time || '',
        potentialConflicts: []
      }
    }))
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((dayId: string, timeSlot: string) => {
    if (!dragState.draggedActivity) return

    const dropTarget: DropTarget = {
      dayId,
      timeSlot,
      position: 0, // Will be calculated based on activities in that slot
      isValid: true // TODO: Add validation logic
    }

    setDragState(prev => ({
      ...prev,
      dropTarget
    }))
  }, [dragState.draggedActivity])

  // Handle drop
  const handleDrop = useCallback((dayId: string, timeSlot: string) => {
    if (!dragState.draggedActivity) return

    const activity = dragState.draggedActivity
    onActivityMove(activity.id, dayId, timeSlot)

    setDragState({
      draggedActivity: null,
      dropTarget: null,
      isDragging: false,
      dragPreview: null
    })
  }, [dragState.draggedActivity, onActivityMove])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDragState({
      draggedActivity: null,
      dropTarget: null,
      isDragging: false,
      dragPreview: null
    })
  }, [])

  // Get activities for a specific day and time slot
  const getActivitiesForSlot = useCallback((dayId: string, timeSlot: string) => {
    const day = itineraryDays.find(d => d.id === dayId)
    if (!day) return []

    return day.activities.filter(activity => {
      if (!activity.time) return false
      
      // Simple time matching - in a real implementation, you'd want more sophisticated logic
      const activityTime = activity.time.substring(0, 5) // Get HH:mm format
      return activityTime === timeSlot
    })
  }, [itineraryDays])

  // Check if a slot has conflicts
  const hasConflicts = useCallback((dayId: string, timeSlot: string) => {
    const activities = getActivitiesForSlot(dayId, timeSlot)
    return activities.some(activity => activity.conflicts && activity.conflicts.length > 0)
  }, [getActivitiesForSlot])

  // Performance optimizations are now handled by OptimizedDndProvider

  return (
    <OptimizedDndProvider>
      <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        {/* Calendar Header */}
        <CalendarHeader
          trip={trip}
          calendarSettings={calendarSettings}
          onSettingsChange={onSettingsChange}
          activityStats={getActivityStats ? getActivityStats() : {
            totalActivities: itineraryDays.reduce((sum, day) => sum + day.activities.length, 0),
            meetings: 0,
            visits: 0,
            confirmed: 0,
            days: itineraryDays.length,
            totalDriveDistance: '0 km',
            totalDriveTime: '0h',
            driveActivities: 0
          }}
          totalDays={itineraryDays.length}
        />

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full">
            {/* Date Extension - Before Trip */}
            <DateExtension
              direction="before"
              onExtend={(days) => onDateExtend('before', days)}
            />

            {/* Days and Time Slots Grid */}
            <div className={`grid gap-4 p-4 ${
              calendarSettings.viewType === 'day' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : calendarSettings.viewType === 'week'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}>
              {itineraryDays.map((day, dayIndex) => (
                <div
                  key={day.id}
                  className="bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden"
                >
                  {/* Day Header */}
                  <div className="px-4 py-3 bg-emerald-800 dark:bg-emerald-900 border-b border-emerald-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-golden-400">
                          Day {dayIndex + 1}
                        </h4>
                        <p className="text-sm text-golden-400/70">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-xs text-golden-400/70">
                        {day.activities.length} activities
                      </div>
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className={`p-2 space-y-1 overflow-y-auto ${
                    calendarSettings.viewType === 'timeline' 
                      ? 'max-h-48 sm:max-h-64' 
                      : 'max-h-96'
                  }`}>
                    {timeSlots.map((timeSlot) => {
                      const slotActivities = getActivitiesForSlot(day.id, timeSlot)
                      const isDropTarget = dragState.dropTarget?.dayId === day.id && 
                                          dragState.dropTarget?.timeSlot === timeSlot
                      const hasSlotConflicts = hasConflicts(day.id, timeSlot)

                      return (
                        <TimeSlot
                          key={`${day.id}-${timeSlot}`}
                          dayId={day.id}
                          timeSlot={timeSlot}
                          activities={slotActivities}
                          isDropTarget={isDropTarget}
                          hasConflicts={hasSlotConflicts}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onAddActivity={() => onActivityAdd(day.id, timeSlot)}
                        >
                          {slotActivities.map((activity) => (
                            <ActivityCard
                              key={activity.id}
                              activity={activity}
                              isDragging={dragState.draggedActivity?.id === activity.id}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onEdit={() => onActivityEdit(activity)}
                              onDelete={() => onActivityDelete(activity.id)}
                            />
                          ))}
                        </TimeSlot>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Date Extension - After Trip */}
            <DateExtension
              direction="after"
              onExtend={(days) => onDateExtend('after', days)}
            />
          </div>
        </div>

        {/* Drag Preview */}
        {dragState.isDragging && dragState.dragPreview && (
          <div className="fixed pointer-events-none z-50 opacity-80">
            <ActivityCard
              activity={dragState.dragPreview.activity}
              isDragging={true}
              isPreview={true}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </div>
    </OptimizedDndProvider>
  )
}