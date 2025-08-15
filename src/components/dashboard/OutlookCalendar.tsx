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

import React, { useState, useCallback, useMemo, useRef, memo } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Plus, Clock, MapPin, User, Check } from 'lucide-react'
import type { TripCard } from '@/types'
import { useActivityManager, type ActivityFormData, type Activity } from '@/hooks/useActivityManager'

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

// Generate hourly time slots from 6 AM to 10 PM for UI display
const TIME_SLOTS: TimeSlot[] = Array.from({ length: 17 }, (_, index) => {
  const hour = 6 + index
  const time = `${hour.toString().padStart(2, '0')}:00`
  const display = `${hour.toString().padStart(2, '0')}:00`
  return { hour, time, display }
})


const ActivityCard = memo(function ActivityCard({ 
  activity, 
  onEdit,
  onResize,
  displayDate,
  isOptimistic = false
}: { 
  activity: Activity
  onEdit: (activity: Activity) => void 
  onResize?: (activity: Activity, newStartTime: string, newEndTime: string, newStartDate?: string, newEndDate?: string) => void
  displayDate?: string // The date this card is being displayed on (for multi-day activities)
  isOptimistic?: boolean // Whether this is an optimistic update
}) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState<'top' | 'bottom' | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      // This replaces the deprecated 'begin' callback
      setIsUpdating(true)
      return {
        type: ITEM_TYPE,
        activity,
        originalDate: activity.activity_date,
        originalTime: activity.start_time
      } as DragItem
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isResizing && !isOptimistic, // Prevent drag when resizing or during optimistic updates
    end: () => {
      // Keep updating state for a brief moment to show feedback
      setTimeout(() => setIsUpdating(false), 500)
    }
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

  // Helper function to convert time to minutes
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Check if this is a multi-day activity
  const isMultiDay = activity.end_date && activity.end_date !== activity.activity_date
  const startDate = new Date(activity.activity_date + 'T00:00:00')
  const endDate = new Date((activity.end_date || activity.activity_date) + 'T00:00:00')
  const dayDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  
  // Determine what part of the multi-day activity this card represents
  const currentDisplayDate = displayDate || activity.activity_date
  const isStartDay = currentDisplayDate === activity.activity_date
  const isEndDay = currentDisplayDate === (activity.end_date || activity.activity_date)
  const isContinuationDay = isMultiDay && !isStartDay && !isEndDay
  
  
  // Calculate display times and position based on calendar view (6 AM - 10 PM)
  let displayStartTime = activity.start_time || '09:00'
  let displayEndTime = activity.end_time || '10:00'
  let topOffset = 0
  let duration = 1
  
  if (isMultiDay) {
    if (isStartDay) {
      // First day: show from start time, truncate at 10 PM
      const startHour = parseInt(activity.start_time?.split(':')[0] || '19')
      const startMinutes = parseInt(activity.start_time?.split(':')[1] || '0')
      
      if (startHour < 6) {
        // Start before 6 AM, don't show on this day
        return null
      } else if (startHour >= 22) {
        // Start at or after 10 PM, show minimal block at 10 PM
        displayStartTime = '22:00'
        displayEndTime = '22:00'
        topOffset = (22 - 6) * 60
        duration = 1
      } else {
        // Normal start time within display range (6 AM - 10 PM)
        displayStartTime = activity.start_time || '19:00'
        displayEndTime = '23:00' // Extend to end of calendar for multi-day activities
        
        // Position relative to the start of this time slot (0px from slot top)
        // The minutes within the hour determine the offset within the 60px slot
        const minuteOffset = (startMinutes / 60) * 60  // Minutes within the hour
        topOffset = minuteOffset
        
        duration = (23 * 60 - timeToMinutes(displayStartTime)) / 15
      }
    } else if (isEndDay) {
      // Last day: show from 6 AM to end time
      const endHour = parseInt(activity.end_time?.split(':')[0] || '10')
      const endMinutes = parseInt(activity.end_time?.split(':')[1] || '0')
      
      displayStartTime = '06:00'
      topOffset = 0
      
      if (endHour > 22) {
        // End time is after 10 PM, truncate to 10 PM for display
        displayEndTime = '22:00'
      } else if (endHour < 6) {
        // End time is before 6 AM, don't show on this day
        return null
      } else {
        // End time is within display range, use actual end time
        displayEndTime = activity.end_time || '10:00'
      }
      duration = Math.max(0, (timeToMinutes(displayEndTime) - 6 * 60) / 15)
    } else {
      // Continuation day: show full day from 6 AM to 11 PM (end of calendar)
      displayStartTime = '06:00'
      displayEndTime = '23:00'
      topOffset = 0
      duration = (23 - 6) * 4 // 17 hours * 4 quarter-hours
    }
  } else {
    // Single day activity
    const startHour = parseInt(activity.start_time?.split(':')[0] || '9')
    const startMinutes = parseInt(activity.start_time?.split(':')[1] || '0')
    
    if (startHour < 6 || startHour >= 22) {
      // Activity outside display range, don't show
      return null
    } else {
      // Position relative to the start of this time slot (0px from slot top)
      // The minutes within the hour determine the offset within the 60px slot
      const minuteOffset = (startMinutes / 60) * 60  // Minutes within the hour
      topOffset = minuteOffset
      
      duration = activity.start_time && activity.end_time ? 
        calculateDuration(activity.start_time, activity.end_time) : 1
    }
  }


  // Handle resize functionality with cross-day support
  const handleResizeStart = (type: 'top' | 'bottom', event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    setIsResizing(true)
    setResizeType(type)
    setIsUpdating(true)
    
    const startY = event.clientY
    const startTime = activity.start_time || '09:00'
    const endTime = activity.end_time || '10:00'
    const currentDate = activity.activity_date
    const currentEndDate = activity.end_date || activity.activity_date
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY
      // Calculate 15-minute increments (15px = 15 minutes, 4 * 15px = 60px = 1 hour)
      const quarterHoursDelta = Math.round(deltaY / 15)
      
      if (quarterHoursDelta === 0) return
      
      // Convert time to minutes for easier calculation
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }
      
      const minutesToTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
      }
      
      // Calculate date offset for cross-day operations
      const addDaysToDate = (dateString: string, days: number) => {
        const date = new Date(dateString + 'T00:00:00')
        date.setDate(date.getDate() + days)
        return date.toISOString().split('T')[0]
      }
      
      let newStartTime = startTime
      let newEndTime = endTime
      let newStartDate = currentDate
      let newEndDate = currentEndDate
      
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)
      
      if (type === 'top') {
        // Resize from top (change start time/date)
        let totalStartMinutes = startMinutes + quarterHoursDelta * 15
        let dayOffset = 0
        
        // Handle cross-day scenarios
        while (totalStartMinutes < 6 * 60) { // Before 6 AM, go to previous day
          totalStartMinutes += 24 * 60
          dayOffset -= 1
        }
        while (totalStartMinutes > 22 * 60) { // After 10 PM, go to next day
          totalStartMinutes -= 24 * 60
          dayOffset += 1
        }
        
        newStartTime = minutesToTime(totalStartMinutes)
        newStartDate = addDaysToDate(currentDate, dayOffset)
        
        // Ensure minimum 15-minute duration and proper date ordering
        const startDateObj = new Date(newStartDate + 'T' + newStartTime)
        const endDateObj = new Date(newEndDate + 'T' + newEndTime)
        
        if (startDateObj >= endDateObj) {
          // Adjust to maintain minimum duration - end must be after start
          const adjustedEnd = new Date(startDateObj.getTime() + 15 * 60 * 1000)
          newEndDate = adjustedEnd.toISOString().split('T')[0]
          newEndTime = adjustedEnd.toTimeString().substring(0, 5)
        }
        
        // Additional safety check: ensure end_date is never before activity_date
        if (newEndDate < newStartDate) {
          newEndDate = newStartDate
        }
      } else {
        // Resize from bottom (change end time/date) - Cross-day support
        let totalEndMinutes = endMinutes + quarterHoursDelta * 15
        let dayOffset = 0
        
        // Handle cross-day scenarios
        while (totalEndMinutes < 6 * 60) { // Before 6 AM, go to previous day
          totalEndMinutes += 24 * 60
          dayOffset -= 1
        }
        while (totalEndMinutes > 22 * 60) { // After 10 PM, go to next day
          totalEndMinutes -= 24 * 60
          dayOffset += 1
        }
        
        newEndTime = minutesToTime(totalEndMinutes)
        newEndDate = addDaysToDate(currentEndDate, dayOffset)
        
        // Ensure minimum 15-minute duration and proper date ordering
        const startDateObj = new Date(newStartDate + 'T' + newStartTime)
        const endDateObj = new Date(newEndDate + 'T' + newEndTime)
        
        if (endDateObj <= startDateObj) {
          // Adjust to maintain minimum duration - end must be after start
          const adjustedEnd = new Date(startDateObj.getTime() + 15 * 60 * 1000)
          newEndDate = adjustedEnd.toISOString().split('T')[0]
          newEndTime = adjustedEnd.toTimeString().substring(0, 5)
        }
        
        // Additional safety check: ensure end_date is never before activity_date
        if (newEndDate < newStartDate) {
          newEndDate = newStartDate
        }
      }
      
      // Update the activity if we have a resize handler
      if (onResize && (newStartTime !== startTime || newEndTime !== endTime || newStartDate !== currentDate || newEndDate !== currentEndDate)) {
        onResize(activity, newStartTime, newEndTime, newStartDate, newEndDate)
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeType(null)
      // Keep updating state for a brief moment to show feedback
      setTimeout(() => setIsUpdating(false), 300)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Don't render if activity is outside display range
  if (duration <= 0) {
    return null
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
        ${isDragging ? 'opacity-50 transform rotate-2' : isOptimistic ? 'opacity-75' : 'opacity-100'}
        ${isResizing ? 'cursor-resizing' : ''}
        ${isUpdating ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        ${isOptimistic ? 'border-dashed' : ''}
      `}
      style={{
        height: `${Math.max(duration * 15 - 2, 20)}px`,
        minHeight: '20px',
        position: 'absolute',
        top: `${topOffset}px`,
        left: '4px',
        right: '4px',
        zIndex: 1
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
            {isOptimistic && (
              <span className="ml-1 px-1 py-0.5 bg-white/30 rounded text-xs animate-pulse">
                saving...
              </span>
            )}
            {isMultiDay && (
              <span className="ml-1 px-1 py-0.5 bg-white/20 rounded text-xs">
                {isContinuationDay ? 'cont.' : isEndDay ? 'end' : `${dayDuration}d`}
              </span>
            )}
          </div>
          {activity.start_time && activity.end_time && (
            <div className="flex items-center space-x-1 mt-1 text-white/80">
              <Clock className="w-3 h-3" />
              <span className="text-xs">
                {/* Show actual activity times for multi-day, display times for single-day */}
                {isMultiDay ? (
                  isStartDay ? (
                    `${formatTime(activity.start_time || '00:00')} - ${formatTime(activity.end_time || '00:00')}`
                  ) : isEndDay ? (
                    `${formatTime(activity.start_time || '00:00')} - ${formatTime(activity.end_time || '00:00')}`
                  ) : (
                    `${formatTime(activity.start_time || '00:00')} - ${formatTime(activity.end_time || '00:00')} (cont.)`
                  )
                ) : (
                  `${formatTime(displayStartTime)} - ${formatTime(displayEndTime)}`
                )}
                {isMultiDay && isStartDay && (
                  <span className="ml-1 text-white/60">
                    ({new Date(activity.activity_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date((activity.end_date || activity.activity_date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                  </span>
                )}
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
})

const TimeSlotComponent = memo(function TimeSlotComponent({ 
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
  onActivityResize?: (activity: Activity, newStartTime: string, newEndTime: string, newStartDate?: string, newEndDate?: string) => void
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

  // Filter activities for this time slot hour and date
  const slotActivities = activities.filter(activity => {
    if (!activity.start_time) return false
    
    // Check if this is a multi-day activity
    const isMultiDay = activity.end_date && activity.end_date !== activity.activity_date
    const currentDisplayDate = date.dateString
    const isStartDay = currentDisplayDate === activity.activity_date
    const isEndDay = currentDisplayDate === (activity.end_date || activity.activity_date)
    const isContinuationDay = isMultiDay && !isStartDay && !isEndDay
    
    if (isMultiDay) {
      if (isStartDay) {
        // First day: only show if activity starts in this hour and within display range
        const startHour = parseInt(activity.start_time.split(':')[0])
        return startHour === timeSlot.hour && startHour >= 6 && startHour < 22
      } else if (isEndDay) {
        // Last day: only show if it's the 6 AM slot (start of day display)
        return timeSlot.hour === 6
      } else if (isContinuationDay) {
        // Continuation day: only show if it's the 6 AM slot (start of day display)
        return timeSlot.hour === 6
      }
      return false
    } else {
      // Single day activity: check if it starts in this hour and within display range
      const activityHour = parseInt(activity.start_time.split(':')[0])
      return activityHour === timeSlot.hour && activityHour >= 6 && activityHour < 22
    }
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
      <div className="relative h-full">
        {slotActivities.map((activity) => (
          <ActivityCard
            key={`${activity.id}-${date.dateString}`}
            activity={activity}
            onEdit={onActivityEdit}
            onResize={onActivityResize}
            displayDate={date.dateString}
            isOptimistic={activity.id.startsWith('temp-')}
          />
        ))}
      </div>
    </div>
  )
})

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
    updateActivityDebounced,
    getActivitiesByDate
  } = useActivityManager(trip.id || '')

  // Generate calendar days
  const calendarDays: CalendarDay[] = useMemo(() => {
    return Array.from({ length: trip.duration || 3 }, (_, index) => {
      const date = new Date(trip.startDate.getTime() + index * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split('T')[0]
      
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

  // Handle activity resize with debouncing and cross-day support
  const handleActivityResize = useCallback(async (
    activity: Activity,
    newStartTime: string,
    newEndTime: string,
    newStartDate?: string,
    newEndDate?: string
  ) => {
    // Prepare update data
    const updateData: any = {
      start_time: newStartTime,
      end_time: newEndTime
    }
    
    // Add date fields if they changed (for multi-day activities)
    if (newStartDate && newStartDate !== activity.activity_date) {
      updateData.activity_date = newStartDate
    }
    if (newEndDate && newEndDate !== (activity.end_date || activity.activity_date)) {
      updateData.end_date = newEndDate
    }
    
    // Use debounced update for resize operations to prevent excessive API calls
    await updateActivityDebounced(activity.id, updateData, 300) // 300ms delay for resize operations
  }, [updateActivityDebounced])

  const handleActivityDrop = useCallback(async (
    item: DragItem, 
    targetDate: string, 
    targetTime: string
  ) => {
    const { activity } = item
    
    // Check if there's an activity in the target slot hour
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
          end_time: addMinutesToTime(targetTime, 60) // Default 1 hour duration
        }),
        updateActivity(targetSlotActivity.id, {
          activity_date: item.originalDate,
          start_time: item.originalTime,
          end_time: addMinutesToTime(item.originalTime, 60) // Default 1 hour duration
        })
      ])
    } else {
      // Move activity to new slot
      await updateActivity(activity.id, {
        activity_date: targetDate,
        start_time: targetTime,
        end_time: addMinutesToTime(targetTime, 60) // Default 1 hour duration
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
  
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes
  
  const durationMinutes = Math.max(endTotalMinutes - startTotalMinutes, 15) // Minimum 15 minutes
  return durationMinutes / 15 // Return duration in 15-minute units
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number)
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60)
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}