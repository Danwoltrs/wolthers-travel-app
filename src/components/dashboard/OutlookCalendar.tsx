/**
 * Outlook-style Calendar Component
 * 
 * Provides a comprehensive calendar view similar to Microsoft Outlook with:
 * - Time slots from 6 AM to 10 PM
 * - Day columns for trip duration
 * - Drag and drop functionality for activities
 * - Activity swapping and time reassignment
 * - Click-to-add functionality on time slots
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Plus, Clock, MapPin, User, Check } from 'lucide-react'
import type { TripCard, Activity } from '@/types'
import { useActivityManager, type ActivityFormData } from '@/hooks/useActivityManager'

interface OutlookCalendarProps {
  trip: TripCard
  onExtendTrip: (direction: 'before' | 'after') => void
  onActivityCreate: (timeSlot: string, date: string) => void
  onActivityEdit: (activity: Activity) => void
}

interface DragItem {
  type: string
  activity: Activity
  originalDate: string
  originalTime: string
}

interface TimeSlot {
  hour: number
  time: string
  display: string
}

interface CalendarDay {
  date: Date
  dateString: string
  dayName: string
  dayNumber: number
  monthName: string
}

const ITEM_TYPE = 'ACTIVITY'

// Generate time slots from 6 AM to 10 PM (24-hour format)
const TIME_SLOTS: TimeSlot[] = Array.from({ length: 16 }, (_, index) => {
  const hour = 6 + index
  const time = `${hour.toString().padStart(2, '0')}:00`
  const display = `${hour.toString().padStart(2, '0')}:00`
  return { hour, time, display }
})

function ActivityCard({ 
  activity, 
  onEdit,
  onResize
}: { 
  activity: Activity
  onEdit: (activity: Activity) => void 
  onResize?: (activity: Activity, newStartTime: string, newEndTime: string) => void
}) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState<'top' | 'bottom' | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: {
      type: ITEM_TYPE,
      activity,
      originalDate: activity.activity_date,
      originalTime: activity.start_time
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isResizing, // Prevent drag when resizing
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500 border-blue-600'
      case 'meal': return 'bg-orange-500 border-orange-600'
      case 'flight': return 'bg-purple-500 border-purple-600'
      case 'accommodation': return 'bg-green-500 border-green-600'
      case 'travel': return 'bg-gray-500 border-gray-600'
      case 'event': return 'bg-indigo-500 border-indigo-600'
      default: return 'bg-gray-500 border-gray-600'
    }
  }

  const duration = activity.start_time && activity.end_time ? 
    calculateDuration(activity.start_time, activity.end_time) : 1

  // Handle resize functionality
  const handleResizeStart = (type: 'top' | 'bottom', event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    setIsResizing(true)
    setResizeType(type)
    
    const startY = event.clientY
    const startTime = activity.start_time || '09:00'
    const endTime = activity.end_time || '10:00'
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY
      const hoursDelta = Math.round(deltaY / 60) // 60px = 1 hour
      
      if (hoursDelta === 0) return
      
      let newStartTime = startTime
      let newEndTime = endTime
      
      if (type === 'top') {
        // Resize from top (change start time)
        const startHour = parseInt(startTime.split(':')[0])
        const newStartHour = Math.max(6, Math.min(22, startHour + hoursDelta))
        newStartTime = `${newStartHour.toString().padStart(2, '0')}:00`
        
        // Ensure minimum 1 hour duration
        const endHour = parseInt(endTime.split(':')[0])
        if (newStartHour >= endHour) {
          newStartTime = `${Math.max(6, endHour - 1).toString().padStart(2, '0')}:00`
        }
      } else {
        // Resize from bottom (change end time)
        const endHour = parseInt(endTime.split(':')[0])
        const newEndHour = Math.max(7, Math.min(22, endHour + hoursDelta))
        newEndTime = `${newEndHour.toString().padStart(2, '0')}:00`
        
        // Ensure minimum 1 hour duration
        const startHour = parseInt(startTime.split(':')[0])
        if (newEndHour <= startHour) {
          newEndTime = `${Math.min(22, startHour + 1).toString().padStart(2, '0')}:00`
        }
      }
      
      // Update the activity if we have a resize handler
      if (onResize && (newStartTime !== startTime || newEndTime !== endTime)) {
        onResize(activity, newStartTime, newEndTime)
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeType(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div
      ref={(node) => {
        drag(node)
        if (cardRef.current !== node) {
          cardRef.current = node
        }
      }}
      onClick={() => !isResizing && onEdit(activity)}
      className={`
        relative cursor-pointer rounded-md border-l-4 p-2 text-white text-xs
        transition-all duration-200 hover:shadow-lg group
        ${getTypeColor(activity.type)}
        ${isDragging ? 'opacity-50 transform rotate-2' : 'opacity-100'}
        ${isResizing ? 'cursor-resizing' : ''}
      `}
      style={{
        height: `${Math.max(duration * 60 - 4, 40)}px`,
        minHeight: '40px'
      }}
    >
      {/* Top resize handle */}
      {onResize && (
        <div
          className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart('top', e)}
          style={{ zIndex: 10 }}
        >
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/50 rounded-full" />
        </div>
      )}
      
      {/* Bottom resize handle */}
      {onResize && (
        <div
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => handleResizeStart('bottom', e)}
          style={{ zIndex: 10 }}
        >
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/50 rounded-full" />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">
            {activity.title}
          </div>
          {activity.start_time && activity.end_time && (
            <div className="flex items-center space-x-1 mt-1 text-white/80">
              <Clock className="w-3 h-3" />
              <span className="text-xs">
                {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
              </span>
            </div>
          )}
          {activity.location && (
            <div className="flex items-center space-x-1 mt-1 text-white/80">
              <MapPin className="w-3 h-3" />
              <span className="text-xs truncate">{activity.location}</span>
            </div>
          )}
          {activity.host && (
            <div className="flex items-center space-x-1 mt-1 text-white/80">
              <User className="w-3 h-3" />
              <span className="text-xs truncate">{activity.host}</span>
            </div>
          )}
        </div>
        {activity.is_confirmed && (
          <Check className="w-3 h-3 text-white/90 flex-shrink-0 ml-1" />
        )}
      </div>
    </div>
  )
}

function TimeSlotComponent({ 
  timeSlot, 
  date, 
  activities, 
  onActivityCreate, 
  onActivityEdit,
  onActivityDrop,
  onActivityResize
}: {
  timeSlot: TimeSlot
  date: CalendarDay
  activities: Activity[]
  onActivityCreate: (timeSlot: string, date: string) => void
  onActivityEdit: (activity: Activity) => void
  onActivityDrop: (item: DragItem, targetDate: string, targetTime: string) => void
  onActivityResize?: (activity: Activity, newStartTime: string, newEndTime: string) => void
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      onActivityDrop(item, date.dateString, timeSlot.time)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  // Filter activities for this specific time slot
  const slotActivities = activities.filter(activity => {
    if (!activity.start_time) return false
    const activityHour = parseInt(activity.start_time.split(':')[0])
    return activityHour === timeSlot.hour
  })

  const handleSlotClick = () => {
    if (slotActivities.length === 0) {
      onActivityCreate(timeSlot.time, date.dateString)
    }
  }

  return (
    <div
      ref={drop}
      className={`
        relative border-b border-gray-200 dark:border-gray-700 min-h-[60px] p-1
        transition-colors duration-200
        ${isOver && canDrop ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
        ${slotActivities.length === 0 ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' : ''}
      `}
      onClick={handleSlotClick}
    >
      {slotActivities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <div className="space-y-1">
        {slotActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onEdit={onActivityEdit}
            onResize={onActivityResize}
          />
        ))}
      </div>
    </div>
  )
}

export function OutlookCalendar({ 
  trip, 
  onExtendTrip, 
  onActivityCreate, 
  onActivityEdit 
}: OutlookCalendarProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)

  const {
    activities,
    loading,
    error,
    updateActivity,
    getActivitiesByDate
  } = useActivityManager(trip.id || '')

  // Generate calendar days
  const calendarDays: CalendarDay[] = useMemo(() => {
    console.log('🗓️ Calendar Days Debug:', {
      tripId: trip.id,
      startDate: trip.startDate,
      startDateISO: trip.startDate.toISOString(),
      duration: trip.duration
    })
    
    return Array.from({ length: trip.duration || 3 }, (_, index) => {
      const date = new Date(trip.startDate.getTime() + index * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split('T')[0]
      
      console.log(`📅 Day ${index + 1}: ${dateString}`)
      
      return {
        date,
        dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' })
      }
    })
  }, [trip.startDate, trip.duration])

  const activitiesByDate = getActivitiesByDate()

  // Handle activity resize
  const handleActivityResize = useCallback(async (
    activity: Activity,
    newStartTime: string,
    newEndTime: string
  ) => {
    await updateActivity(activity.id, {
      start_time: newStartTime,
      end_time: newEndTime
    })
  }, [updateActivity])

  const handleActivityDrop = useCallback(async (
    item: DragItem, 
    targetDate: string, 
    targetTime: string
  ) => {
    const { activity } = item
    
    // Check if there's an activity in the target slot
    const targetActivities = activitiesByDate[targetDate] || []
    const targetSlotActivity = targetActivities.find(a => {
      if (!a.start_time) return false
      const activityHour = parseInt(a.start_time.split(':')[0])
      const targetHour = parseInt(targetTime.split(':')[0])
      return activityHour === targetHour
    })

    if (targetSlotActivity && targetSlotActivity.id !== activity.id) {
      // Swap activities
      await Promise.all([
        updateActivity(activity.id, {
          activity_date: targetDate,
          start_time: targetTime,
          end_time: targetTime.replace(/\d{2}:/, (match) => 
            `${(parseInt(match.slice(0, 2)) + 1).toString().padStart(2, '0')}:`
          )
        }),
        updateActivity(targetSlotActivity.id, {
          activity_date: item.originalDate,
          start_time: item.originalTime,
          end_time: item.originalTime.replace(/\d{2}:/, (match) => 
            `${(parseInt(match.slice(0, 2)) + 1).toString().padStart(2, '0')}:`
          )
        })
      ])
    } else {
      // Move activity to new slot
      await updateActivity(activity.id, {
        activity_date: targetDate,
        start_time: targetTime,
        end_time: targetTime.replace(/\d{2}:/, (match) => 
          `${(parseInt(match.slice(0, 2)) + 1).toString().padStart(2, '0')}:`
        )
      })
    }
  }, [activitiesByDate, updateActivity])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">Error loading calendar: {error}</div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-emerald-800 dark:bg-emerald-900 text-golden-400 px-4 py-2">
          <p className="text-sm text-golden-400/90 text-center">
            Drag activities to reschedule • Click empty slots to add activities
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="flex justify-center">
            <div className="inline-block min-w-max">
              {/* Day Headers */}
              <div className="grid border-b border-gray-200 dark:border-gray-700" style={{ 
                gridTemplateColumns: `120px repeat(${calendarDays.length}, 280px) 120px` 
              }}>
                {/* Time column header */}
                <div className="p-3 bg-gray-50 dark:bg-[#2a2a2a] border-r border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => onExtendTrip('before')}
                    className="w-full h-8 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Add day before trip"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Day columns */}
                {calendarDays.map((day, index) => (
                  <div
                    key={day.dateString}
                    className="p-3 bg-gray-50 dark:bg-[#2a2a2a] border-r border-gray-200 dark:border-gray-700 text-center"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {day.dayName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {day.monthName} {day.dayNumber}
                    </div>
                  </div>
                ))}

                {/* Add day after button */}
                <div className="p-3 bg-gray-50 dark:bg-[#2a2a2a] border-r border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => onExtendTrip('after')}
                    className="w-full h-8 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    title="Add day after trip"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Time Slots Grid */}
              {TIME_SLOTS.map((timeSlot) => (
                <div
                  key={timeSlot.time}
                  className="grid border-b border-gray-200 dark:border-gray-700"
                  style={{ 
                    gridTemplateColumns: `120px repeat(${calendarDays.length}, 280px) 120px` 
                  }}
                >
                  {/* Time label */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] border-r border-gray-200 dark:border-gray-700 text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {timeSlot.display}
                    </div>
                  </div>

                  {/* Day columns */}
                  {calendarDays.map((day) => (
                    <div
                      key={`${day.dateString}-${timeSlot.time}`}
                      className="border-r border-gray-200 dark:border-gray-700"
                    >
                      <TimeSlotComponent
                        timeSlot={timeSlot}
                        date={day}
                        activities={activitiesByDate[day.dateString] || []}
                        onActivityCreate={onActivityCreate}
                        onActivityEdit={onActivityEdit}
                        onActivityDrop={handleActivityDrop}
                        onActivityResize={handleActivityResize}
                      />
                    </div>
                  ))}

                  {/* Empty cell for add day after column */}
                  <div className="border-r border-gray-200 dark:border-gray-700" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}

// Utility functions
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startHours, startMinutes] = startTime.split(':').map(Number)
  const [endHours, endMinutes] = endTime.split(':').map(Number)
  
  const startTotal = startHours + startMinutes / 60
  const endTotal = endHours + endMinutes / 60
  
  return Math.max(endTotal - startTotal, 1) // Minimum 1 hour
}