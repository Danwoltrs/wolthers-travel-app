/**
 * Outlook-style Calendar Component
 * 
 * Provides a comprehensive calendar view similar to Microsoft Outlook with:
 * - Time slots from 4 AM to 10 PM
 * - Day columns for trip duration
 * - Drag and drop functionality for activities
 * - Activity swapping and time reassignment
 * - Click-to-add functionality on time slots
 */

import React, { useState, useCallback, useMemo, useRef, memo } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { Plus, Minus, Clock, MapPin, User, Check, RefreshCw, GitFork } from 'lucide-react'
import type { TripCard } from '@/types'
import { useActivityManager, type ActivityFormData, type Activity } from '@/hooks/useActivityManager'
import { OptimizedDndProvider } from '@/components/shared/OptimizedDndProvider'
import { calculateDuration } from '@/lib/utils'
import { recalculateTravelTimes, type TravelTimeUpdate } from '@/lib/travel-recalculation'

interface OutlookCalendarProps {
  trip: TripCard
  activities: Activity[]
  loading: boolean
  error: string | null
  refreshing: boolean
  updateActivity: (activityId: string, updates: Partial<ActivityFormData>) => Promise<Activity | null>
  updateActivityDebounced: (activityId: string, updates: Partial<ActivityFormData>, delay?: number) => Promise<void>
  getActivitiesByDate: () => Record<string, Activity[]>
  onExtendTrip: (direction: 'before' | 'after' | 'remove-before' | 'remove-after') => void
  onRemoveDay?: () => Promise<void>
  onRemoveFirstDay?: () => Promise<void>
  onActivityCreate: (timeSlot: string, date: string) => void
  onActivityEdit: (activity: Activity) => void
  onActivitySplit?: (activity: Activity) => void
  forceRefreshActivities?: () => Promise<void>
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

// Generate dynamic time slots based on activities - show early hours only when needed
function generateTimeSlots(activities: Activity[]): TimeSlot[] {
  // Default time range: 6 AM to 10 PM
  let startHour = 6
  let endHour = 22
  
  // Check if any activities start before 6 AM or after 10 PM
  activities.forEach(activity => {
    const activityHour = parseInt(activity.start_time.split(':')[0], 10)
    if (activityHour < startHour) {
      startHour = Math.max(4, activityHour) // Don't go earlier than 4 AM
    }
    if (activityHour > endHour) {
      endHour = Math.min(23, activityHour) // Don't go later than 11 PM
    }
  })
  
  const slots = []
  for (let hour = startHour; hour <= endHour; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`
    const display = `${hour.toString().padStart(2, '0')}:00`
    slots.push({ hour, time, display })
  }
  
  return slots
}


const ActivityCard = memo(function ActivityCard({ 
  activity, 
  onEdit,
  onResize,
  onSplit,
  displayDate,
  isOptimistic = false
}: { 
  activity: Activity
  onEdit: (activity: Activity) => void 
  onResize?: (activity: Activity, newStartTime: string, newEndTime: string, newStartDate?: string, newEndDate?: string) => void
  onSplit?: (activity: Activity) => void
  displayDate?: string // The date this card is being displayed on (for multi-day activities)
  isOptimistic?: boolean // Whether this is an optimistic update
}) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState<'top' | 'bottom' | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDragLoading, setIsDragLoading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: () => {
        // Enhanced drag start with loading state
        setIsUpdating(true)
        setIsDragLoading(true)
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
      canDrag: () => !isResizing, // Allow drag for temp activities, just prevent during resizing
      end: () => {
        // Enhanced end handling with proper state cleanup
        setTimeout(() => {
          setIsUpdating(false)
          setIsDragLoading(false)
        }, 800) // Slightly longer for better visual feedback
      }
    }),
    [activity.id, activity.activity_date, activity.start_time, isResizing, isOptimistic]
  )

  const getTypeColor = (type: string) => {
    // Debug: Log activity types to help troubleshoot color issues
    if (activity.title?.toLowerCase().includes('flight')) {
      console.log('🎨 [OutlookCalendar] Activity color debug:', {
        title: activity.title,
        type: type,
        normalizedType: type?.toLowerCase(),
        willUseColor: type?.toLowerCase() === 'flight' ? 'purple' : 'fallback'
      })
    }
    
    switch (type?.toLowerCase()) {
      case 'meeting': return 'bg-blue-500 border-blue-600'
      case 'meal': return 'bg-orange-500 border-orange-600'
      case 'flight': return 'bg-purple-500 border-purple-600'
      case 'accommodation': return 'bg-green-500 border-green-600'
      case 'travel': return 'bg-gray-500 border-gray-600'
      case 'event': return 'bg-indigo-500 border-indigo-600'
      case 'break': return 'bg-yellow-500 border-yellow-600'
      case 'other': return 'bg-teal-500 border-teal-600'
      default: return 'bg-emerald-500 border-emerald-600' // Default to brand color
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
      
      if (startHour < 4) {
        // Start before 4 AM, don't show on this day
        return null
      } else if (startHour >= 22) {
        // Start at or after 10 PM, show minimal block at 10 PM
        displayStartTime = '22:00'
        displayEndTime = '22:00'
        topOffset = (22 - 4) * 60
        duration = 1
      } else {
        // Normal start time within display range (4 AM - 10 PM)
        displayStartTime = activity.start_time || '19:00'
        displayEndTime = '23:00' // Extend to end of calendar for multi-day activities
        
        // Position relative to the start of this time slot (0px from slot top)
        // The minutes within the hour determine the offset within the 60px slot
        const minuteOffset = (startMinutes / 60) * 60  // Minutes within the hour
        topOffset = minuteOffset
        
        duration = (23 * 60 - timeToMinutes(displayStartTime)) / 15
      }
    } else if (isEndDay) {
      // Last day: show from 4 AM to end time
      const endHour = parseInt(activity.end_time?.split(':')[0] || '10')
      const endMinutes = parseInt(activity.end_time?.split(':')[1] || '0')
      
      displayStartTime = '04:00'
      topOffset = 0
      
      if (endHour > 22) {
        // End time is after 10 PM, truncate to 10 PM for display
        displayEndTime = '22:00'
      } else if (endHour < 4) {
        // End time is before 4 AM, don't show on this day
        return null
      } else {
        // End time is within display range, use actual end time
        displayEndTime = activity.end_time || '10:00'
      }
      duration = Math.max(0, (timeToMinutes(displayEndTime) - 4 * 60) / 15)
    } else {
      // Continuation day: show full day from 4 AM to 11 PM (end of calendar)
      displayStartTime = '04:00'
      displayEndTime = '23:00'
      topOffset = 0
      duration = (23 - 4) * 4 // 19 hours * 4 quarter-hours
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
        calculateTimeDuration(activity.start_time, activity.end_time) : 1
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
        while (totalStartMinutes < 4 * 60) { // Before 4 AM, go to previous day
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
        while (totalEndMinutes < 4 * 60) { // Before 4 AM, go to previous day
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
        ${getTypeColor(activity.type || 'default')}
        ${isDragging ? 'opacity-50 transform rotate-2' : isOptimistic ? 'opacity-75' : 'opacity-100'}
        ${isResizing ? 'cursor-resizing' : ''}
        ${isUpdating || isDragLoading ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        ${isOptimistic ? 'border-dashed' : ''}
        ${isDragLoading ? 'animate-pulse' : ''}
        md:!left-[4px] md:!right-[4px]
      `}
      style={{
        height: `${Math.max(duration * 15 - 2, 20)}px`,
        minHeight: '20px',
        position: 'absolute',
        top: `${topOffset}px`,
        left: '2px',
        right: '2px',
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
      {/* Fork/Split icon - positioned absolutely in top-right corner */}
      {onSplit && (
        <div
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ zIndex: 20 }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSplit(activity)
            }}
            className="w-5 h-5 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            title="Split/Fork Activity"
          >
            <GitFork className="w-3 h-3 text-white" />
          </button>
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
            {isDragLoading && !isOptimistic && (
              <span className="ml-1 px-1 py-0.5 bg-white/40 rounded text-xs animate-pulse">
                moving...
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
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.activity.id === nextProps.activity.id &&
    prevProps.activity.title === nextProps.activity.title &&
    prevProps.activity.start_time === nextProps.activity.start_time &&
    prevProps.activity.end_time === nextProps.activity.end_time &&
    prevProps.activity.activity_date === nextProps.activity.activity_date &&
    prevProps.activity.end_date === nextProps.activity.end_date &&
    prevProps.activity.location === nextProps.activity.location &&
    prevProps.activity.type === nextProps.activity.type &&
    prevProps.activity.is_confirmed === nextProps.activity.is_confirmed &&
    prevProps.displayDate === nextProps.displayDate &&
    prevProps.isOptimistic === nextProps.isOptimistic
  )
})

const TimeSlotComponent = memo(function TimeSlotComponent({ 
  timeSlot, 
  date, 
  activities, 
  onActivityCreate, 
  onActivityEdit,
  onActivityDrop,
  onActivityResize,
  onActivitySplit
}: {
  timeSlot: TimeSlot
  date: CalendarDay
  activities: Activity[]
  onActivityCreate: (timeSlot: string, date: string) => void
  onActivityEdit: (activity: Activity) => void
  onActivityDrop: (item: DragItem, targetDate: string, targetTime: string) => void
  onActivityResize?: (activity: Activity, newStartTime: string, newEndTime: string, newStartDate?: string, newEndDate?: string) => void
  onActivitySplit?: (activity: Activity) => void
}) {
  const [isProcessingDrop, setIsProcessingDrop] = useState(false)
  
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      drop: async (item: DragItem) => {
        setIsProcessingDrop(true)
        try {
          await onActivityDrop(item, date.dateString, timeSlot.time)
        } finally {
          // Clear processing state after a delay for visual feedback
          setTimeout(() => setIsProcessingDrop(false), 1000)
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [date.dateString, timeSlot.time, onActivityDrop]
  )

  // Debug: Show activities for key time slot
  if (timeSlot.hour === 14 && date.dateString.includes('2025-10-02')) {
    const testActivities = activities.filter(a => a.title?.toLowerCase().includes('test'))
    if (testActivities.length > 0) {
      console.log('🔍 [OutlookCalendar] Test activities for 14:00 Oct 2:', testActivities.map(a => a.title))
    }
  }

  // **SIMPLIFIED** Filter activities for this time slot hour and date
  const slotActivities = activities.filter(activity => {
    // Early return for activities without start_time
    if (!activity.start_time) {
      console.log('⚠️ [OutlookCalendar] Activity missing start_time:', { id: activity.id, title: activity.title })
      return false
    }
    
    // Debug optimistic activities
    if (activity.id.startsWith('temp-')) {
      console.log('🔄 [OutlookCalendar] Processing optimistic activity:', {
        tempId: activity.id,
        title: activity.title,
        activityDate: activity.activity_date,
        currentDisplayDate: date.dateString,
        startTime: activity.start_time
      })
    }
    
    // **SIMPLIFIED TIME PARSING** - Only handle HH:MM format
    const activityHour = parseActivityHour(activity.start_time)
    if (activityHour === null) {
      console.warn('❌ [OutlookCalendar] Could not parse start_time:', activity.start_time, 'for activity:', activity.title)
      return false
    }
    
    // **SIMPLIFIED DATE MATCHING** - Check date first
    const isMultiDay = activity.end_date && activity.end_date !== activity.activity_date
    if (!isActivityOnDate(activity, date.dateString)) {
      return false
    }
    
    // **SIMPLIFIED HOUR MATCHING** - Check if activity should show in this time slot
    const shouldShow = shouldActivityShowInSlot(activity, activityHour, timeSlot.hour, date.dateString)
    
    // Enhanced debug logging for key activities
    if (activity.title.toLowerCase().includes('pickup') || 
        activity.title.toLowerCase().includes('flight') ||
        activity.title.toLowerCase().includes('test') ||
        activity.title.toLowerCase().includes('drive') ||
        activity.title.toLowerCase().includes('bourbon')) {
      console.log(`🔍 [OutlookCalendar] Activity "${activity.title}" ${shouldShow ? '✅ WILL SHOW' : '❌ HIDDEN'} in slot ${timeSlot.hour}:00 on ${date.dateString}:`, {
        activityId: activity.id,
        activityDate: activity.activity_date,
        endDate: activity.end_date,
        startTime: activity.start_time,
        parsedHour: activityHour,
        timeSlotHour: timeSlot.hour,
        isMultiDay,
        shouldShow
      })
    }
    
    return shouldShow
  })

  const handleSlotClick = () => {
    console.log('🎯 TimeSlot clicked:', {
      time: timeSlot.time,
      date: date.dateString,
      hasActivities: slotActivities.length > 0,
      activitiesCount: slotActivities.length
    })
    
    if (slotActivities.length === 0) {
      console.log('📅 Creating new activity for empty slot')
      onActivityCreate(timeSlot.time, date.dateString)
    } else {
      console.log('⚠️ Slot has activities, not creating new one')
    }
  }

  return (
    <div
      ref={drop}
      className={`
        relative border-b border-gray-200 dark:border-gray-700 min-h-[50px] md:min-h-[60px] p-1
        transition-colors duration-200
        ${isOver && canDrop ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
        ${isProcessingDrop ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
        ${slotActivities.length === 0 ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' : ''}
      `}
      onClick={handleSlotClick}
    >
      {slotActivities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {isProcessingDrop ? (
            <div className="animate-spin h-4 w-4 border border-blue-500 border-t-transparent rounded-full" />
          ) : (
            <Plus className="w-4 h-4 text-gray-400" />
          )}
        </div>
      )}
      <div className="relative h-full">
        {slotActivities.map((activity) => (
          <ActivityCard
            key={`${activity.id}-${date.dateString}`}
            activity={activity}
            onEdit={onActivityEdit}
            onResize={onActivityResize}
            onSplit={onActivitySplit}
            displayDate={date.dateString}
            isOptimistic={activity.id.startsWith('temp-')}
          />
        ))}
      </div>
    </div>
  )
})

// Helper function to calculate dynamic column widths based on trip duration and browser width
function getCalendarDimensions(dayCount: number) {
  // Get available browser width, fallback for SSR
  const browserWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const isMobile = browserWidth < 768

  let timeColumn, addColumns

  if (isMobile) {
    // Mobile-optimized: much narrower time column, no add columns
    timeColumn = 50  // Very narrow time column on mobile
    addColumns = 0   // Remove add columns on mobile to save space
  } else {
    // Desktop: comfortable time column with add columns
    if (dayCount <= 3) {
      timeColumn = 80
      addColumns = 60
    } else if (dayCount <= 7) {
      timeColumn = 70
      addColumns = 50
    } else if (dayCount <= 14) {
      timeColumn = 60
      addColumns = 40
    } else {
      timeColumn = 50
      addColumns = 30
    }
  }

  // Calculate total minimum width
  const dayWidth = Math.max(80, (browserWidth - timeColumn - addColumns * 2) / dayCount)
  const totalMinWidth = timeColumn + (dayCount * dayWidth) + addColumns * 2

  // Mobile grid template: time column + flexible day columns (no add columns)
  // Desktop grid template: time column + flexible day columns + add columns
  const gridTemplate = isMobile
    ? `${timeColumn}px repeat(${dayCount}, 1fr)`
    : `${timeColumn}px repeat(${dayCount}, 1fr) ${addColumns}px`

  return {
    timeColumn,
    addColumns,
    dayWidth,
    totalWidth: totalMinWidth,
    gridTemplate,
    isMobile
  }
}

export function OutlookCalendar({ 
  trip,
  activities,
  loading,
  error,
  refreshing,
  updateActivity,
  updateActivityDebounced,
  getActivitiesByDate,
  onExtendTrip, 
  onRemoveDay,
  onRemoveFirstDay,
  onActivityCreate, 
  onActivityEdit,
  onActivitySplit,
  forceRefreshActivities
}: OutlookCalendarProps) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)

  // Generate calendar days - moved before usage
  const calendarDays: CalendarDay[] = useMemo(() => {
    // Ensure dates are Date objects, not strings
    const startDate = trip.startDate instanceof Date ? trip.startDate : new Date(trip.startDate)
    const endDate = trip.endDate instanceof Date ? trip.endDate : new Date(trip.endDate)
    
    return Array.from({ length: calculateDuration(startDate, endDate) }, (_, index) => {
      const date = new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split('T')[0]
      
      return {
        date,
        dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' })
      }
    })
  }, [trip.startDate, trip.endDate])

  // Get dynamic calendar dimensions based on trip duration
  const calendarDimensions = useMemo(() => 
    getCalendarDimensions(calendarDays.length), 
    [calendarDays.length]
  )

  // Generate dynamic time slots based on actual activities
  const timeSlots = useMemo(() => 
    generateTimeSlots(activities), 
    [activities]
  )

  const activitiesByDate = getActivitiesByDate()

  // **DEBUG SUMMARY**: Log activities overview to help troubleshoot calendar display
  React.useEffect(() => {
    if (activities.length > 0) {
      const activitiesWithTime = activities.filter(a => a.start_time)
      const activitiesWithoutTime = activities.filter(a => !a.start_time)
      
      console.log('📊 [OutlookCalendar] Activities Debug Summary:', {
        totalActivities: activities.length,
        activitiesWithTime: activitiesWithTime.length,
        activitiesWithoutTime: activitiesWithoutTime.length,
        activitiesByDate: Object.keys(activitiesByDate).reduce((acc, date) => {
          acc[date] = activitiesByDate[date].length
          return acc
        }, {} as Record<string, number>),
        sampleActivitiesWithTime: activitiesWithTime.slice(0, 3).map(a => ({
          id: a.id,
          title: a.title,
          date: a.activity_date,
          startTime: a.start_time,
          hour: parseActivityHour(a.start_time || '')
        })),
        activitiesWithoutTimeIds: activitiesWithoutTime.map(a => ({ id: a.id, title: a.title }))
      })
      
      // Check for specific test activities mentioned in the request
      const testActivities = activities.filter(a => 
        a.title?.toLowerCase().includes('randy') || 
        a.title?.toLowerCase().includes('gru') ||
        a.title?.toLowerCase().includes('santos') ||
        a.title?.toLowerCase().includes('bourbon') ||
        a.title?.toLowerCase().includes('poços')
      )
      
      if (testActivities.length > 0) {
        console.log('🎯 [OutlookCalendar] Found test activities:', testActivities.map(a => ({
          id: a.id,
          title: a.title,
          date: a.activity_date,
          startTime: a.start_time,
          endTime: a.end_time,
          parsedHour: parseActivityHour(a.start_time || ''),
          isOnCorrectDate: isActivityOnDate(a, a.activity_date)
        })))
      }
    }
  }, [activities, activitiesByDate])

  // Handle day removal - moved after calendarDays definition
  const handleRemoveDay = useCallback(async () => {
    if (calendarDays.length <= 1) {
      console.warn('Cannot remove day: Trip must have at least one day')
      return
    }

    const lastDay = calendarDays[calendarDays.length - 1]
    const lastDayActivities = activitiesByDate[lastDay.dateString] || []
    
    // Check if the last day has any activities
    if (lastDayActivities.length > 0) {
      // Show confirmation dialog or prevent removal
      const hasConfirmedActivities = lastDayActivities.some(activity => activity.is_confirmed)
      const activityNames = lastDayActivities.map(a => a.title).join(', ')
      
      const confirmMessage = hasConfirmedActivities 
        ? `The last day contains confirmed activities (${activityNames}). Remove anyway? This will delete all activities on this day.`
        : `The last day contains activities (${activityNames}). Remove anyway? This will delete all activities on this day.`
      
      if (!confirm(confirmMessage)) {
        return
      }
    }

    // Call the removal handler if provided, otherwise use extend trip with negative direction
    if (onRemoveDay) {
      await onRemoveDay()
    } else {
      // Fallback: use extend trip API with negative days (remove from end)
      await onExtendTrip('remove-after')
    }
  }, [calendarDays, activitiesByDate, onRemoveDay, onExtendTrip])

  // Handle first day removal with smart enable/disable logic
  const handleRemoveFirstDay = useCallback(async () => {
    if (calendarDays.length <= 1) {
      console.warn('Cannot remove day: Trip must have at least one day')
      return
    }

    const firstDay = calendarDays[0]
    const firstDayActivities = activitiesByDate[firstDay.dateString] || []
    
    // Check if the first day has any activities
    if (firstDayActivities.length > 0) {
      // Show confirmation dialog or prevent removal
      const hasConfirmedActivities = firstDayActivities.some(activity => activity.is_confirmed)
      const activityNames = firstDayActivities.map(a => a.title).join(', ')
      
      const confirmMessage = hasConfirmedActivities 
        ? `The first day contains confirmed activities (${activityNames}). Remove anyway? This will delete all activities on this day.`
        : `The first day contains activities (${activityNames}). Remove anyway? This will delete all activities on this day.`
      
      if (!confirm(confirmMessage)) {
        return
      }
    }

    // Call the removal handler if provided
    if (onRemoveFirstDay) {
      await onRemoveFirstDay()
    }
  }, [calendarDays, activitiesByDate, onRemoveFirstDay])

  // Check if first day can be removed (no activities on first day)
  const canRemoveFirstDay = useMemo(() => {
    if (calendarDays.length <= 1) return false
    const firstDay = calendarDays[0]
    const firstDayActivities = activitiesByDate[firstDay?.dateString] || []
    return firstDayActivities.length === 0
  }, [calendarDays, activitiesByDate])

  // Check if last day can be removed (no activities on last day)
  const canRemoveLastDay = useMemo(() => {
    if (calendarDays.length <= 1) return false
    const lastDay = calendarDays[calendarDays.length - 1]
    const lastDayActivities = activitiesByDate[lastDay?.dateString] || []
    return lastDayActivities.length === 0
  }, [calendarDays, activitiesByDate])

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
    
    // Calculate original duration to preserve it
    const calculateOriginalDuration = (startTime: string, endTime: string): number => {
      if (!startTime || !endTime) return 60 // Default 1 hour in minutes
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      const startTotalMinutes = startHours * 60 + startMinutes
      const endTotalMinutes = endHours * 60 + endMinutes
      return Math.max(endTotalMinutes - startTotalMinutes, 15) // Minimum 15 minutes
    }
    
    const originalDurationMinutes = calculateOriginalDuration(activity.start_time || '', activity.end_time || '')
    const newEndTime = addMinutesToTime(targetTime, originalDurationMinutes)
    
    // Check if there's an activity in the target slot hour
    const targetActivities = activitiesByDate[targetDate] || []
    const targetSlotActivity = targetActivities.find(a => {
      if (!a.start_time) return false
      const activityHour = parseInt(a.start_time.split(':')[0])
      const targetHour = parseInt(targetTime.split(':')[0])
      return activityHour === targetHour
    })

    if (targetSlotActivity && targetSlotActivity.id !== activity.id) {
      // Swap activities - preserve both durations
      const targetOriginalDurationMinutes = calculateOriginalDuration(
        targetSlotActivity.start_time || '',
        targetSlotActivity.end_time || ''
      )
      const swapEndTime = addMinutesToTime(item.originalTime, targetOriginalDurationMinutes)
      
      await Promise.all([
        updateActivity(activity.id, {
          activity_date: targetDate,
          start_time: targetTime,
          end_time: newEndTime
        }),
        updateActivity(targetSlotActivity.id, {
          activity_date: item.originalDate,
          start_time: item.originalTime,
          end_time: swapEndTime
        })
      ])
      
      // Recalculate travel times for both affected dates
      try {
        console.log('📋 [Travel Recalc] Recalculating travel times after activity swap...')
        const allActivities = Object.values(activitiesByDate).flat()
        
        const [updates1, updates2] = await Promise.allSettled([
          recalculateTravelTimes(allActivities, activity.id, targetDate, targetTime),
          recalculateTravelTimes(allActivities, targetSlotActivity.id, item.originalDate, item.originalTime)
        ])
        
        // Collect successful updates
        const allUpdates = []
        if (updates1.status === 'fulfilled') {
          allUpdates.push(...updates1.value)
        } else {
          console.error('❌ [Travel Recalc] Failed to recalculate travel times for moved activity:', updates1.reason)
        }
        
        if (updates2.status === 'fulfilled') {
          allUpdates.push(...updates2.value)
        } else {
          console.error('❌ [Travel Recalc] Failed to recalculate travel times for swapped activity:', updates2.reason)
        }
        
        // Apply travel time updates
        await Promise.allSettled(allUpdates.map(async (update) => {
          if (update.shouldCreate && update.travelDetails) {
            console.log(`➕ [Travel Recalc] Creating travel activity: ${update.travelDetails.fromLocation} → ${update.travelDetails.toLocation} (${Math.round(update.travelDetails.duration * 60)}min ${update.travelDetails.type})`)
            // Create new travel activity would go here
          } else if (update.shouldDelete) {
            console.log(`➖ [Travel Recalc] Removing obsolete travel activity: ${update.activityId}`)
            // Delete obsolete travel activity would go here
          }
        }))
        
        console.log(`✅ [Travel Recalc] Successfully processed ${allUpdates.length} travel time updates`)
        
      } catch (error) {
        console.error('❌ [Travel Recalc] Unexpected error during travel time recalculation:', error)
        // Activity swap was successful, just travel time calculation failed
        console.log('📋 [Travel Recalc] Activity swap completed successfully despite travel calculation error')
      }
    } else {
      // Move activity to new slot - preserve original duration
      await updateActivity(activity.id, {
        activity_date: targetDate,
        start_time: targetTime,
        end_time: newEndTime
      })
      
      // Recalculate travel times for the target date
      try {
        console.log('📋 [Travel Recalc] Recalculating travel times after activity move...')
        const allActivities = Object.values(activitiesByDate).flat()
        const updates = await recalculateTravelTimes(allActivities, activity.id, targetDate, targetTime)
        
        // Apply travel time updates
        await Promise.allSettled(updates.map(async (update) => {
          if (update.shouldCreate && update.travelDetails) {
            console.log(`➕ [Travel Recalc] Creating travel activity: ${update.travelDetails.fromLocation} → ${update.travelDetails.toLocation} (${Math.round(update.travelDetails.duration * 60)}min ${update.travelDetails.type})`)
            // Create new travel activity would go here
          } else if (update.shouldDelete) {
            console.log(`➖ [Travel Recalc] Removing obsolete travel activity: ${update.activityId}`)
            // Delete obsolete travel activity would go here
          }
        }))
        
        console.log(`✅ [Travel Recalc] Successfully processed ${updates.length} travel time updates`)
        
      } catch (error) {
        console.error('❌ [Travel Recalc] Error during travel time recalculation:', error)
        // Activity move was successful, just travel time calculation failed
        console.log('📋 [Travel Recalc] Activity move completed successfully despite travel calculation error')
      }
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
    <OptimizedDndProvider>
      <div className={`bg-white dark:bg-[#1a1a1a] overflow-hidden relative ${
        calendarDimensions.isMobile
          ? 'rounded-none border-0' // Full-width on mobile
          : 'rounded-lg border border-pearl-200 dark:border-[#2a2a2a]' // Normal container on desktop
      }`}>
        {/* Refreshing Overlay */}
        {refreshing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-[#1a1a1a]/80 rounded-lg flex items-center justify-center z-30">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 shadow-lg border border-pearl-200 dark:border-[#2a2a2a]">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                <p className="text-sm font-medium text-gray-900 dark:text-golden-400">
                  Updating calendar...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Calendar Header */}
        <div className="bg-emerald-800 dark:bg-emerald-900 text-golden-400 px-4 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-golden-400/90">
              Drag activities to reschedule • Click empty slots to add activities
            </p>
            <div className="flex items-center space-x-2">
              {/* Sync Calendar Button */}
              <button
                onClick={() => {
                  if (forceRefreshActivities) {
                    forceRefreshActivities()
                  }
                }}
                disabled={refreshing || !forceRefreshActivities}
                className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors bg-golden-400/20 text-golden-400 hover:bg-golden-400/30 hover:text-golden-300 disabled:opacity-50"
                title="Refresh calendar to sync latest changes"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
              
              {refreshing && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border border-golden-400 border-t-transparent"></div>
                  <span className="text-xs text-golden-400/70">Updating...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid - Full-width border-to-border layout with flexible columns */}
        <div className="overflow-x-auto overflow-y-visible">
          <div className="w-full">
            <div 
              className="w-full" 
              style={{
                minWidth: `${calendarDimensions.totalWidth}px`
              }}
            >
              {/* Day Headers - Dynamic Responsive Layout Based on Trip Duration */}
              <div className="grid gap-x-[3px] gap-y-px border-b border-gray-200 dark:border-gray-700" style={{
                gridTemplateColumns: calendarDimensions.gridTemplate
              }}>
                {/* Time column header */}
                <div className="p-1 md:p-2 lg:p-3 bg-gray-50 dark:bg-[#2a2a2a]">
                  {/* Hide add before button on mobile, show on desktop */}
                  {!calendarDimensions.isMobile && (
                    <button
                      onClick={() => onExtendTrip('before')}
                      className="w-full h-6 md:h-8 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Add day before trip"
                    >
                      <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  )}
                  {/* Mobile: Show minimal time indicator */}
                  {calendarDimensions.isMobile && (
                    <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                      Time
                    </div>
                  )}
                </div>

                {/* Day columns with dynamic responsive layout */}
                {calendarDays.map((day, index) => (
                  <div
                    key={day.dateString}
                    className={`bg-gray-50 dark:bg-[#2a2a2a] text-center ${
                      // Mobile-first padding with more aggressive optimization
                      calendarDimensions.isMobile
                        ? 'p-1'  // Minimal padding on mobile
                        : calendarDays.length <= 3 ? 'p-3 md:p-4' :
                          calendarDays.length <= 7 ? 'p-2 md:p-3' :
                          calendarDays.length <= 14 ? 'p-1 md:p-2' :
                          'p-1'
                    }`}
                  >
                    {/* Day header with inline remove buttons - improved for multi-day */}
                    <div className="flex items-center justify-between">
                      {/* Remove first day button - show only on first day if there are 2 or more days */}
                      {index === 0 && calendarDays.length > 1 ? (
                        <button
                          onClick={() => handleRemoveFirstDay()}
                          disabled={!canRemoveFirstDay}
                          className={`flex items-center justify-center border rounded transition-colors flex-shrink-0 ${
                            // Dynamic button sizes based on trip length
                            calendarDays.length <= 3 ? 'mr-2 w-5 h-5 md:w-6 md:h-6' :
                            calendarDays.length <= 7 ? 'mr-1 w-4 h-4 md:w-5 md:h-5' :
                            calendarDays.length <= 14 ? 'mr-1 w-3 h-3 md:w-4 md:h-4' :
                            'mr-0.5 w-3 h-3'
                          } ${
                            canRemoveFirstDay
                              ? 'border-red-300 dark:border-red-600 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 text-red-500 dark:text-red-400 cursor-pointer'
                              : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                          title={canRemoveFirstDay ? "Remove first day" : "Cannot remove day with activities"}
                        >
                          <Minus className="w-2 h-2 md:w-3 md:h-3" />
                        </button>
                      ) : (
                        // Dynamic spacer based on trip length
                        <div className={`flex-shrink-0 ${
                          calendarDays.length <= 3 ? 'w-5 h-5 md:w-6 md:h-6 mr-2' :
                          calendarDays.length <= 7 ? 'w-4 h-4 md:w-5 md:h-5 mr-1' :
                          calendarDays.length <= 14 ? 'w-3 h-3 md:w-4 md:h-4 mr-1' :
                          'w-3 h-3 mr-0.5'
                        }`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-gray-900 dark:text-gray-100 truncate ${
                          // Mobile-first text sizing
                          calendarDimensions.isMobile
                            ? 'text-xs'  // Very compact on mobile
                            : calendarDays.length <= 3 ? 'text-sm md:text-base lg:text-lg' :
                              calendarDays.length <= 7 ? 'text-xs md:text-sm lg:text-base' :
                              calendarDays.length <= 14 ? 'text-xs md:text-sm' :
                              'text-xs'
                        }`}>
                          {/* Mobile-first day name length */}
                          {calendarDimensions.isMobile
                            ? day.dayName.slice(0, 1)  // Single letter on mobile (M, T, W, etc.)
                            : calendarDays.length <= 7 ? day.dayName :
                              calendarDays.length <= 14 ? day.dayName.slice(0, 3) :
                              day.dayName.slice(0, 2)
                          }
                        </div>
                        <div className={`text-gray-500 dark:text-gray-400 truncate ${
                          calendarDimensions.isMobile
                            ? 'text-xs'  // Show day number only on mobile
                            : calendarDays.length <= 3 ? 'text-xs md:text-sm' :
                              calendarDays.length <= 7 ? 'text-xs md:text-sm' :
                              calendarDays.length <= 14 ? 'text-xs' :
                              'text-xs hidden md:block'
                        }`}>
                          {/* Mobile-first date format */}
                          {calendarDimensions.isMobile
                            ? `${day.dayNumber}`  // Just day number on mobile
                            : calendarDays.length <= 7
                              ? `${day.monthName} ${day.dayNumber}`
                              : calendarDays.length <= 14
                              ? `${day.monthName.slice(0, 3)} ${day.dayNumber}`
                              : `${day.dayNumber}`
                          }
                        </div>
                      </div>
                      {/* Remove last day button - show only on last day if there are 2 or more days */}
                      {index === calendarDays.length - 1 && calendarDays.length > 1 ? (
                        <button
                          onClick={() => handleRemoveDay()}
                          disabled={!canRemoveLastDay}
                          className={`flex items-center justify-center border rounded transition-colors flex-shrink-0 ${
                            // Dynamic button sizes based on trip length (matching first day button)
                            calendarDays.length <= 3 ? 'ml-2 w-5 h-5 md:w-6 md:h-6' :
                            calendarDays.length <= 7 ? 'ml-1 w-4 h-4 md:w-5 md:h-5' :
                            calendarDays.length <= 14 ? 'ml-1 w-3 h-3 md:w-4 md:h-4' :
                            'ml-0.5 w-3 h-3'
                          } ${
                            canRemoveLastDay
                              ? 'border-red-300 dark:border-red-600 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 text-red-500 dark:text-red-400 cursor-pointer'
                              : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                          title={canRemoveLastDay ? "Remove last day" : "Cannot remove day with activities"}
                        >
                          <Minus className="w-2 h-2 md:w-3 md:h-3" />
                        </button>
                      ) : (
                        // Dynamic spacer based on trip length (matching first day spacer)
                        <div className={`flex-shrink-0 ${
                          calendarDays.length <= 3 ? 'w-5 h-5 md:w-6 md:h-6 ml-2' :
                          calendarDays.length <= 7 ? 'w-4 h-4 md:w-5 md:h-5 ml-1' :
                          calendarDays.length <= 14 ? 'w-3 h-3 md:w-4 md:h-4 ml-1' :
                          'w-3 h-3 ml-0.5'
                        }`} />
                      )}
                    </div>
                  </div>
                ))}

                {/* Add day after button - Hide on mobile */}
                {!calendarDimensions.isMobile && (
                  <div className="p-2 md:p-3 bg-gray-50 dark:bg-[#2a2a2a]">
                    <button
                      onClick={() => onExtendTrip('after')}
                      className="w-full h-6 md:h-8 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Add day after trip"
                    >
                      <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Time Slots Grid with dynamic responsive layout */}
              <div className={refreshing ? 'opacity-50 pointer-events-none' : ''}>
                {timeSlots.map((timeSlot) => (
                  <div
                    key={timeSlot.time}
                    className="grid gap-x-[3px] gap-y-px border-b border-gray-200 dark:border-gray-700"
                    style={{ 
                      gridTemplateColumns: calendarDimensions.gridTemplate
                    }}
                  >
                    {/* Time label */}
                    <div className="px-1 md:px-2 lg:px-4 py-3 bg-gray-50 dark:bg-[#2a2a2a] text-center">
                      <div className={`font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap ${
                        calendarDimensions.isMobile ? 'text-xs' : 'text-xs md:text-sm'
                      }`}>
                        {/* Show abbreviated time on mobile */}
                        {calendarDimensions.isMobile
                          ? timeSlot.display.replace(':00', '')  // Show just hour number on mobile
                          : timeSlot.display
                        }
                      </div>
                    </div>

                    {/* Day columns with responsive design */}
                    {calendarDays.map((day) => (
                      <div
                        key={`${day.dateString}-${timeSlot.time}`}
                      >
                        <TimeSlotComponent
                          timeSlot={timeSlot}
                          date={day}
                          activities={activitiesByDate[day.dateString] || []}
                          onActivityCreate={onActivityCreate}
                          onActivityEdit={onActivityEdit}
                          onActivityDrop={handleActivityDrop}
                          onActivityResize={handleActivityResize}
                          onActivitySplit={onActivitySplit}
                        />
                      </div>
                    ))}

                    {/* Empty cell for add day after column - Hide on mobile */}
                    {!calendarDimensions.isMobile && <div />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OptimizedDndProvider>
  )
}

// **SIMPLIFIED UTILITY FUNCTIONS** for reliable activity filtering
function parseActivityHour(timeString: string): number | null {
  if (!timeString || typeof timeString !== 'string') return null
  
  try {
    // Handle standard HH:MM format (most common)
    if (timeString.includes(':')) {
      const hourStr = timeString.split(':')[0].trim()
      const hour = parseInt(hourStr, 10)
      return isNaN(hour) ? null : hour
    }
    
    // Handle plain number format
    const hour = parseInt(timeString.trim(), 10)
    return isNaN(hour) ? null : hour
  } catch (e) {
    console.error('Error parsing time string:', timeString, e)
    return null
  }
}

function isActivityOnDate(activity: Activity, targetDate: string): boolean {
  const isMultiDay = activity.end_date && activity.end_date !== activity.activity_date
  
  if (!isMultiDay) {
    // Single-day activity: exact date match
    return activity.activity_date === targetDate
  }
  
  // Multi-day activity: check if target date is within range
  const startDate = new Date(activity.activity_date + 'T00:00:00')
  const endDate = new Date((activity.end_date || activity.activity_date) + 'T00:00:00')
  const currentDate = new Date(targetDate + 'T00:00:00')
  
  return currentDate >= startDate && currentDate <= endDate
}

function shouldActivityShowInSlot(
  activity: Activity, 
  activityHour: number, 
  slotHour: number, 
  displayDate: string
): boolean {
  // Only show activities within calendar display range (4 AM - 10 PM)
  if (activityHour < 4 || activityHour >= 22) {
    return false
  }
  
  const isMultiDay = activity.end_date && activity.end_date !== activity.activity_date
  
  if (!isMultiDay) {
    // Single-day activity: show in the exact hour slot
    return activityHour === slotHour
  }
  
  // Multi-day activity logic
  const isStartDay = displayDate === activity.activity_date
  const isEndDay = displayDate === (activity.end_date || activity.activity_date)
  
  if (isStartDay) {
    // First day: show only in the activity's start hour
    return activityHour === slotHour
  }
  
  if (isEndDay) {
    // Last day: show in first visible slot (4 AM)
    return slotHour === 4
  }
  
  // Continuation day: show in first visible slot (4 AM)
  return slotHour === 4
}

// Utility functions
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function calculateTimeDuration(startTime: string, endTime: string): number {
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