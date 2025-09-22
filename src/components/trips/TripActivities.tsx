'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronRight, Calendar, Plus, FileText, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import MeetingNotesModal from './MeetingNotesModal'

interface TripActivitiesProps {
  activities: any[]
  loading: boolean
  error: string | null
  canEditTrip?: boolean
  isAdmin?: boolean
  tripStatus?: string
}


// Helper function to generate ICS calendar file for a day
const generateDayICSContent = (activities: any[], date: string, dayIndex: number) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string) => {
    return text.replace(/([\\;,\n])/g, '\\$1')
  }

  // Parse date properly to avoid timezone conversion issues
  const [year, month, day] = date.split('-').map(Number)
  const dayDate = new Date(year, month - 1, day)
  const formattedDate = dayDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'long', 
    day: 'numeric' 
  })

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wolthers & Associates//Trip Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  activities.forEach((activity) => {
    const startTime = activity.start_time || '09:00:00'
    const endTime = activity.end_time || '10:00:00'
    
    const startDateTime = new Date(`${activity.activity_date}T${startTime}`)
    const endDateTime = new Date(`${activity.activity_date}T${endTime}`)

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${activity.id}@wolthers-travel.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDateTime)}`,
      `DTEND:${formatDate(endDateTime)}`,
      `SUMMARY:${escapeText(activity.title)}`,
      `DESCRIPTION:${escapeText(activity.description || '')}`,
      `LOCATION:${escapeText(activity.location || activity.custom_location || '')}`,
      `CATEGORIES:Day ${dayIndex + 1} - ${formattedDate}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    )
  })

  icsContent.push('END:VCALENDAR')
  return icsContent.join('\r\n')
}

const downloadICSFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

const getConfirmationIcon = (isConfirmed: boolean) => {
  if (isConfirmed) {
    return <CheckCircle className="w-3 h-3 text-green-500" />
  }
  return <Circle className="w-3 h-3 text-gray-400" />
}

export default function TripActivities({ activities, loading, error, canEditTrip = false, isAdmin = false, tripStatus = 'upcoming' }: TripActivitiesProps) {
  // Initialize with all activities and notes collapsed by default
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(() => {
    const allActivityIds = new Set<string>()
    activities.forEach(activity => allActivityIds.add(activity.id))
    return allActivityIds
  })
  const [collapsedNotes, setCollapsedNotes] = useState<Set<string>>(() => {
    const allActivityIds = new Set<string>()
    activities.forEach(activity => allActivityIds.add(activity.id))
    return allActivityIds
  })
  
  // Note modal state
  const [selectedActivity, setSelectedActivity] = useState<any>(null)
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [activityNoteCounts, setActivityNoteCounts] = useState<Record<string, number>>({})

  // Refs for auto-scrolling to current day
  const currentDayRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  // Auto-scroll to current day for ongoing trips
  useEffect(() => {
    if (tripStatus === 'ongoing' && !hasScrolled.current && currentDayRef.current) {
      setTimeout(() => {
        currentDayRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        hasScrolled.current = true
      }, 500) // Small delay to ensure layout is complete
    }
  }, [tripStatus, activities])

  // Helper functions to determine day and activity status
  const getDayStatus = (date: string) => {
    const today = new Date()
    // Parse date properly to avoid timezone conversion issues
    const [year, month, day] = date.split('-').map(Number)
    const dayDate = new Date(year, month - 1, day)
    
    today.setHours(0, 0, 0, 0)
    dayDate.setHours(0, 0, 0, 0)
    
    if (dayDate < today) return 'past'
    if (dayDate.getTime() === today.getTime()) return 'current'
    return 'future'
  }

  const getActivityStatus = (activity: any) => {
    const now = new Date()
    // Parse activity date properly to avoid timezone conversion issues
    const [year, month, day] = activity.activity_date.split('-').map(Number)
    const activityDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    activityDate.setHours(0, 0, 0, 0)

    // If activity is on a different day
    if (activityDate < today) return 'past'
    if (activityDate > today) return 'future'
    
    // If activity is today, check the time
    if (activity.start_time) {
      const [hours, minutes] = activity.start_time.split(':').map(Number)
      // Parse activity date properly to avoid timezone conversion issues
      const [year, month, day] = activity.activity_date.split('-').map(Number)
      const activityDateTime = new Date(year, month - 1, day)
      activityDateTime.setHours(hours, minutes, 0, 0)
      
      if (activityDateTime < now) return 'past'
      // Consider current if within 1 hour of start time
      const timeDiff = activityDateTime.getTime() - now.getTime()
      if (timeDiff <= 60 * 60 * 1000 && timeDiff >= -30 * 60 * 1000) return 'current'
    }
    
    return 'future'
  }

  const toggleDay = (date: string) => {
    const newCollapsed = new Set(collapsedDays)
    if (newCollapsed.has(date)) {
      newCollapsed.delete(date)
    } else {
      newCollapsed.add(date)
    }
    setCollapsedDays(newCollapsed)
  }

  const toggleActivity = (activityId: string) => {
    const newCollapsed = new Set(collapsedActivities)
    if (newCollapsed.has(activityId)) {
      newCollapsed.delete(activityId)
    } else {
      newCollapsed.add(activityId)
    }
    setCollapsedActivities(newCollapsed)
  }

  const toggleNotes = (activityId: string) => {
    const newCollapsed = new Set(collapsedNotes)
    if (newCollapsed.has(activityId)) {
      newCollapsed.delete(activityId)
    } else {
      newCollapsed.add(activityId)
    }
    setCollapsedNotes(newCollapsed)
  }

  const handleExportDayToCalendar = (date: string, dayActivities: any[], dayIndex: number) => {
    const icsContent = generateDayICSContent(dayActivities, date, dayIndex)
    // Parse date properly to avoid timezone conversion issues
    const [year, month, day] = date.split('-').map(Number)
    const dayDate = new Date(year, month - 1, day)
    const formattedDate = dayDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).replace(' ', '_')
    const filename = `day_${dayIndex + 1}_${formattedDate}.ics`
    downloadICSFile(icsContent, filename)
  }

  // Load note counts for all activities
  useEffect(() => {
    const loadNoteCounts = async () => {
      const counts: Record<string, number> = {}
      
      for (const activity of activities) {
        try {
          const response = await fetch(`/api/activities/${activity.id}/notes`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            // Count public notes only for the indicator
            counts[activity.id] = data.notes?.filter((note: any) => !note.is_private).length || 0
          }
        } catch (error) {
          console.error(`Error loading note count for activity ${activity.id}:`, error)
          counts[activity.id] = 0
        }
      }
      
      setActivityNoteCounts(counts)
    }

    if (activities.length > 0) {
      loadNoteCounts()
    }
  }, [activities])

  const openNotesModal = (activity: any) => {
    setSelectedActivity(activity)
    setIsNotesModalOpen(true)
  }

  const closeNotesModal = () => {
    setSelectedActivity(null)
    setIsNotesModalOpen(false)
    
    // Refresh note counts when modal closes
    if (selectedActivity) {
      const refreshNoteCounts = async () => {
        try {
          const response = await fetch(`/api/activities/${selectedActivity.id}/notes`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            const count = data.notes?.filter((note: any) => !note.is_private).length || 0
            setActivityNoteCounts(prev => ({ ...prev, [selectedActivity.id]: count }))
          }
        } catch (error) {
          console.error('Error refreshing note count:', error)
        }
      }
      
      refreshNoteCounts()
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-[#D4C5B0] dark:border-[#2a2a2a] p-8">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-gray-500 dark:text-gray-400">Loading activities...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-[#D4C5B0] dark:border-[#2a2a2a] p-8">
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-4" />
          <div className="text-red-500 dark:text-red-400">Failed to load activities</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error}</div>
        </div>
      </div>
    )
  }

  // Group activities by date
  const groupedActivities = activities.reduce((acc: any, item: any) => {
    const date = item.activity_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {})

  // Sort activities within each day by time
  Object.keys(groupedActivities).forEach(date => {
    groupedActivities[date].sort((a: any, b: any) => {
      const timeA = a.start_time || '00:00:00'
      const timeB = b.start_time || '00:00:00'
      return timeA.localeCompare(timeB)
    })
  })

  // Sort dates
  const sortedDates = Object.keys(groupedActivities).sort()

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-[#D4C5B0] dark:border-[#2a2a2a] p-8">
        <div className="text-center">
          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 dark:text-gray-400">No activities scheduled yet</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {sortedDates.map((date, dayIndex) => {
        const dayActivities = groupedActivities[date]
        // Parse date properly to avoid timezone conversion issues
        const [year, month, day] = date.split('-').map(Number)
        const dayDate = new Date(year, month - 1, day)
        const isToday = dayDate.toDateString() === new Date().toDateString()
        const isDayCollapsed = collapsedDays.has(date)
        const dayStatus = getDayStatus(date)
        
        return (
          <div 
            key={date}
            ref={dayStatus === 'current' ? currentDayRef : null}
            className={cn(
              "bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-[#D4C5B0] dark:border-[#2a2a2a] overflow-hidden",
              dayStatus === 'past' && "opacity-80",
              dayStatus === 'current' && "ring-2 ring-amber-500 ring-opacity-50",
              dayStatus === 'future' && "ring-2 ring-emerald-500 ring-opacity-30"
            )}
          >
            {/* Day Header */}
            <button 
              onClick={() => toggleDay(date)}
              className={cn(
                "w-full px-6 py-3 border-b border-[#D4C5B0] dark:border-[#2a2a2a] text-white transition-colors",
                dayStatus === 'past' && "bg-gray-500 hover:bg-gray-600",
                dayStatus === 'current' && "bg-amber-600 hover:bg-amber-700",
                dayStatus === 'future' && "bg-emerald-600 hover:bg-emerald-700",
                isDayCollapsed && "border-b-0"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-16 h-8 rounded-full bg-white/20 text-white border border-white/30">
                    <span className="font-semibold text-xs">
                      Day {dayIndex + 1}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white text-sm">
                      {dayDate.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className="text-xs text-white/80">
                      {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExportDayToCalendar(date, dayActivities, dayIndex)
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors cursor-pointer"
                    title="Add day to calendar"
                  >
                    <Calendar className="w-3 h-3" />
                    Add Day to Calendar
                  </div>
                  {dayStatus === 'current' && (
                    <div className="text-xs font-medium text-amber-200 bg-amber-800/50 px-2 py-1 rounded-full">
                      Today
                    </div>
                  )}
                  {isDayCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-white/80" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white/80" />
                  )}
                </div>
              </div>
            </button>

            {/* Activities List */}
            {!isDayCollapsed && (
              <div className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {dayActivities.map((activity: any, index: number) => {
                  const startTime = activity.start_time ? activity.start_time.slice(0, 5) : ''
                  const isActivityCollapsed = collapsedActivities.has(activity.id)
                  const hasNotes = activity.meeting_notes && activity.meeting_notes.length > 0
                  const areNotesCollapsed = collapsedNotes.has(activity.id)
                  const activityStatus = getActivityStatus(activity)
                  const noteCount = activityNoteCounts[activity.id] || 0
                  
                  return (
                    <div 
                      key={activity.id} 
                      className={cn(
                        "bg-white dark:bg-[#1a1a1a]",
                        activityStatus === 'past' && "opacity-75"
                      )}
                    >
                      {/* Activity Header */}
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleActivity(activity.id)}
                          className="flex-1 p-4 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors text-left"
                        >
                          <div className="flex items-center gap-4">
                            {/* Time */}
                            <div className="flex-shrink-0 w-16">
                              <div className={cn(
                                "text-sm font-mono",
                                activityStatus === 'past' && "text-gray-600 dark:text-gray-400",
                                activityStatus === 'current' && "text-amber-600 dark:text-amber-400 font-semibold",
                                activityStatus === 'future' && "text-emerald-600 dark:text-emerald-400"
                              )}>
                                {startTime}
                              </div>
                            </div>

                            {/* Activity Summary */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                    {activity.title}
                                  </h4>
                                  {hasNotes && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                      ({activity.meeting_notes.length} {activity.meeting_notes.length === 1 ? 'note' : 'notes'})
                                    </span>
                                  )}
                                </div>
                                {/* Confirmation Status - Only show to trip creators/admins and not for past events */}
                                {(canEditTrip || isAdmin) && activityStatus !== 'past' && (
                                  <div className="flex items-center gap-1 ml-2">
                                    {getConfirmationIcon(activity.is_confirmed)}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {activity.is_confirmed ? 'Confirmed' : 'Pending'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {activity.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {activity.description}
                                </p>
                              )}
                            </div>

                            {/* Collapse Icon */}
                            {isActivityCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {/* Notes Button - Outside the main button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openNotesModal(activity)
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors mr-4",
                            noteCount > 0
                              ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40"
                              : "bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333333]"
                          )}
                          title={noteCount > 0 ? `View ${noteCount} notes` : "Add note"}
                        >
                          {noteCount > 0 ? (
                            <>
                              <FileText className="w-3 h-3" />
                              <span>{noteCount}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Note</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Activity Details */}
                      {!isActivityCollapsed && hasNotes && (
                        <div className="px-4 pb-4 pl-20">
                          {/* Meeting Notes */}
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleNotes(activity.id)
                              }}
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2"
                            >
                              {areNotesCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              Notes ({activity.meeting_notes.length})
                            </button>
                            
                            {!areNotesCollapsed && (
                              <div className="p-3 bg-gray-50 dark:bg-[#111111] rounded-lg">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {activity.meeting_notes[0].content}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* End of Coffee Trip */}
      <div className="flex justify-center py-8">
        <p className="text-amber-500 dark:text-amber-400 text-xl font-serif italic">
          End of Coffee Trip
        </p>
      </div>

      {/* Meeting Notes Modal */}
      {selectedActivity && (
        <MeetingNotesModal
          activity={selectedActivity}
          tripType="in_land" // TODO: Get this from trip data
          isOpen={isNotesModalOpen}
          onClose={closeNotesModal}
        />
      )}
    </div>
  )
}