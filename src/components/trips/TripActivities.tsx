'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, Circle, AlertCircle, ChevronDown, ChevronRight, Calendar, Plus, FileText, Users, Trash2, User, MessageSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import SimpleNotesModal from '../notes/SimpleNotesModal'
import { useAuth } from '@/contexts/AuthContext'
import { useDialogs } from '@/hooks/use-modal'
import { formatNotePreview } from '@/lib/note-utils'

interface TripActivitiesProps {
  activities: any[]
  loading: boolean
  error: string | null
  canEditTrip?: boolean
  isAdmin?: boolean
  tripStatus?: string
  tripId?: string
  onNoteCountChange?: (activityId: string, count: number) => void
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

export default function TripActivities({ activities, loading, error, canEditTrip = false, isAdmin = false, tripStatus = 'upcoming', tripId, onNoteCountChange }: TripActivitiesProps) {
  const { user } = useAuth()
  const { confirm } = useDialogs()
  
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
  const [activityNotes, setActivityNotes] = useState<Record<string, any[]>>({})

  // Refs for auto-scrolling to current day
  const currentDayRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  // Auto-scroll to current day on mobile (always scroll to current day regardless of trip status)
  useEffect(() => {
    if (!hasScrolled.current && currentDayRef.current) {
      // Add longer delay on mobile to ensure everything is loaded
      const isMobile = window.innerWidth < 768
      const delay = isMobile ? 1000 : 500
      
      setTimeout(() => {
        currentDayRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
        hasScrolled.current = true
      }, delay)
    }
  }, [activities]) // Remove tripStatus dependency to always scroll

  // Helper functions to determine day and activity status
  const getDayStatus = (date: string) => {
    // For future trips, show all activities as future/active
    if (tripStatus === 'upcoming' || tripStatus === 'planning' || tripStatus === 'confirmed') {
      const today = new Date()
      const [year, month, day] = date.split('-').map(Number)
      const dayDate = new Date(year, month - 1, day)
      
      today.setHours(0, 0, 0, 0)
      dayDate.setHours(0, 0, 0, 0)
      
      if (dayDate.getTime() === today.getTime()) return 'current'
      return 'future' // Show all dates as future for upcoming trips
    }
    
    // For ongoing/completed trips, use actual date comparison
    const today = new Date()
    const [year, month, day] = date.split('-').map(Number)
    const dayDate = new Date(year, month - 1, day)
    
    today.setHours(0, 0, 0, 0)
    dayDate.setHours(0, 0, 0, 0)
    
    if (dayDate < today) return 'past'
    if (dayDate.getTime() === today.getTime()) return 'current'
    return 'future'
  }

  const getActivityStatus = (activity: any) => {
    // For future trips, show all activities as future/active
    if (tripStatus === 'upcoming' || tripStatus === 'planning' || tripStatus === 'confirmed') {
      const today = new Date()
      const [year, month, day] = activity.activity_date.split('-').map(Number)
      const activityDate = new Date(year, month - 1, day)
      
      today.setHours(0, 0, 0, 0)
      activityDate.setHours(0, 0, 0, 0)
      
      if (activityDate.getTime() === today.getTime()) return 'current'
      return 'future' // Show all activities as future for upcoming trips
    }

    // For ongoing/completed trips, use actual date and time comparison
    const now = new Date()
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

  // Auto-expand all notes when showing activity details
  const showActivityWithNotes = (activityId: string) => {
    // First expand the activity
    const newCollapsedActivities = new Set(collapsedActivities)
    newCollapsedActivities.delete(activityId)
    setCollapsedActivities(newCollapsedActivities)
    
    // Then expand the notes
    const newCollapsedNotes = new Set(collapsedNotes)
    newCollapsedNotes.delete(activityId)
    setCollapsedNotes(newCollapsedNotes)
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

  // Load note counts and detailed notes for all activities
  useEffect(() => {
    const loadNotesData = async () => {
      const counts: Record<string, number> = {}
      const notes: Record<string, any[]> = {}
      
      for (const activity of activities) {
        try {
          const response = await fetch(`/api/activities/${activity.id}/notes`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            const allNotes = data.notes || []
            notes[activity.id] = allNotes
            // Count all notes for the indicator
            counts[activity.id] = allNotes.length
          }
        } catch (error) {
          console.error(`Error loading notes for activity ${activity.id}:`, error)
          counts[activity.id] = 0
          notes[activity.id] = []
        }
      }
      
      setActivityNoteCounts(counts)
      setActivityNotes(notes)
    }

    if (activities.length > 0) {
      loadNotesData()
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
      const refreshNotesData = async () => {
        try {
          const response = await fetch(`/api/activities/${selectedActivity.id}/notes`, {
            credentials: 'include'
          })
          
          if (response.ok) {
            const data = await response.json()
            const allNotes = data.notes || []
            setActivityNoteCounts(prev => ({ ...prev, [selectedActivity.id]: allNotes.length }))
            setActivityNotes(prev => ({ ...prev, [selectedActivity.id]: allNotes }))
          }
        } catch (error) {
          console.error('Error refreshing notes data:', error)
        }
      }
      
      refreshNotesData()
    }
  }

  const deleteNote = async (activityId: string, noteId: string) => {
    try {
      const response = await fetch(`/api/activities/${activityId}/notes?note_id=${noteId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Refresh notes data after deletion
        const refreshResponse = await fetch(`/api/activities/${activityId}/notes`, {
          credentials: 'include'
        })
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          const allNotes = data.notes || []
          setActivityNoteCounts(prev => ({ ...prev, [activityId]: allNotes.length }))
          setActivityNotes(prev => ({ ...prev, [activityId]: allNotes }))
        }
      } else {
        console.error('Failed to delete note')
        alert('Failed to delete note. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Failed to delete note. Please try again.')
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
    <div className="space-y-2 md:space-y-4">

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
              "bg-white dark:bg-[#1a1a1a] rounded-none md:rounded-lg shadow-lg border-0 md:border border-[#D4C5B0] dark:border-[#2a2a2a] overflow-hidden",
              dayStatus === 'past' && "opacity-80",
              dayStatus === 'current' && "ring-2 ring-amber-500 ring-opacity-50",
              dayStatus === 'future' && "ring-2 ring-emerald-500 ring-opacity-30"
            )}
          >
            {/* Day Header */}
            <button 
              onClick={() => toggleDay(date)}
              className={cn(
                "w-full px-3 md:px-6 py-3 border-b border-[#D4C5B0] dark:border-[#2a2a2a] text-white transition-colors",
                dayStatus === 'past' && "bg-gray-500 hover:bg-gray-600",
                dayStatus === 'current' && "bg-amber-600 hover:bg-amber-700",
                dayStatus === 'future' && "bg-emerald-600 hover:bg-emerald-700",
                isDayCollapsed && "border-b-0"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex items-center justify-center w-12 md:w-16 h-6 md:h-8 rounded-full bg-white/20 text-white border border-white/30">
                    <span className="font-semibold text-xs">
                      Day {dayIndex + 1}
                    </span>
                  </div>
                  <div className="text-left">
                    {/* Mobile: Compact format "Mon, Sep 22" */}
                    <h3 className="md:hidden font-semibold text-white text-sm">
                      {dayDate.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </h3>
                    {/* Desktop: Full format "Monday, September 22" */}
                    <h3 className="hidden md:block font-semibold text-white text-sm">
                      {dayDate.toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className="hidden md:block text-xs text-white/80">
                      {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  {/* Mobile: Just calendar icon with + */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExportDayToCalendar(date, dayActivities, dayIndex)
                    }}
                    className="md:hidden p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors cursor-pointer"
                    title="Add day to calendar"
                  >
                    <Calendar className="w-4 h-4" />
                  </div>
                  {/* Desktop: Full button with text */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExportDayToCalendar(date, dayActivities, dayIndex)
                    }}
                    className="hidden md:flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors cursor-pointer"
                    title="Add day to calendar"
                  >
                    <Calendar className="w-3 h-3" />
                    Add Day to Calendar
                  </div>
                  {/* Hide "Today" badge on mobile as requested */}
                  {dayStatus === 'current' && (
                    <div className="hidden md:block text-xs font-medium text-amber-200 bg-amber-800/50 px-2 py-1 rounded-full">
                      Today
                    </div>
                  )}
                  {isDayCollapsed ? (
                    <ChevronRight className="w-4 md:w-5 h-4 md:h-5 text-white/80" />
                  ) : (
                    <ChevronDown className="w-4 md:w-5 h-4 md:h-5 text-white/80" />
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
                  const noteCount = activityNoteCounts[activity.id] || 0
                  const hasNotes = noteCount > 0
                  const areNotesCollapsed = collapsedNotes.has(activity.id)
                  const activityStatus = getActivityStatus(activity)
                  
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
                          className="flex-1 p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-[#111111] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            {/* Time */}
                            <div className="flex-shrink-0 w-12 md:w-16">
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
                            <div className="flex-1 min-w-0 pr-2 md:pr-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[180px] md:max-w-none">
                                    {activity.title}
                                  </h4>
                                  {hasNotes && (
                                    <span className="hidden md:inline text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                      ({noteCount} {noteCount === 1 ? 'note' : 'notes'})
                                    </span>
                                  )}
                                </div>
                                {/* Confirmation Status - Only show to trip creators/admins and not for past events */}
                                {(canEditTrip || isAdmin) && activityStatus !== 'past' && (
                                  <div className="hidden md:flex items-center gap-1 ml-2">
                                    {getConfirmationIcon(activity.is_confirmed)}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {activity.is_confirmed ? 'Confirmed' : 'Pending'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {activity.description && (
                                <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400 truncate">
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
                            "flex items-center gap-1 rounded text-xs font-medium transition-colors",
                            "px-1.5 py-1 mr-2 md:px-2 md:py-1 md:mr-4", // Smaller on mobile
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
                              <span className="hidden md:inline">Note</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Activity Details with Smart Notes Summary */}
                      {!isActivityCollapsed && noteCount > 0 && (
                        <div className="px-4 pb-4 pl-20">
                          {/* Meeting Notes with Smart Summary */}
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                showActivityWithNotes(activity.id)
                              }}
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-3"
                            >
                              {areNotesCollapsed ? (
                                <ChevronRight className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                              <MessageSquare className="w-3 h-3" />
                              Notes ({noteCount})
                            </button>
                            
                            {areNotesCollapsed ? (
                              // Show note summaries when collapsed
                              <div className="space-y-2 ml-5">
                                {(activityNotes[activity.id] || []).slice(0, 3).map((note: any) => {
                                  const preview = formatNotePreview(note)
                                  
                                  return (
                                    <div 
                                      key={note.id}
                                      className="p-2 bg-gray-50 dark:bg-[#111111] rounded border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#0a0a0a] transition-colors"
                                    >
                                      <div className="flex items-start gap-2">
                                        <div 
                                          className="flex-1 min-w-0 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            showActivityWithNotes(activity.id)
                                          }}
                                        >
                                          <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                            {preview.summary}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            <span>{preview.timeAgo}</span>
                                            {preview.hasTranscript && (
                                              <>
                                                <span>•</span>
                                                <MessageSquare className="w-3 h-3" />
                                                <span>Transcript</span>
                                              </>
                                            )}
                                            {preview.mediaInfo && (
                                              <>
                                                <span>•</span>
                                                <span>{preview.mediaInfo}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openNotesModal(activity)
                                          }}
                                          className="flex-shrink-0 p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded transition-colors text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                          title="Open full note editor"
                                        >
                                          <FileText className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                                {noteCount > 3 && (
                                  <div 
                                    className="text-xs text-gray-500 dark:text-gray-400 italic cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      showActivityWithNotes(activity.id)
                                    }}
                                  >
                                    +{noteCount - 3} more notes...
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Show full notes when expanded
                              <div className="space-y-3 ml-5">
                                {(activityNotes[activity.id] || []).map((note: any, index: number) => {
                                  const isOwner = user && note.user_id === user.id
                                  const preview = formatNotePreview(note)

                                  return (
                                    <div 
                                      key={note.id}
                                      className="p-3 bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-200 dark:border-[#2a2a2a]"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <User className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                              {isOwner ? 'You' : (note.created_by_name || 'Anonymous')}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <Clock className="w-3 h-3 text-gray-400" />
                                            <span className="text-xs text-gray-400">
                                              {preview.timeAgo}
                                            </span>
                                            {preview.hasTranscript && (
                                              <>
                                                <span className="text-xs text-gray-400">•</span>
                                                <MessageSquare className="w-3 h-3 text-emerald-500" />
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                                  Has transcript
                                                </span>
                                              </>
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                            {preview.summary}
                                          </div>
                                          {preview.mediaInfo && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                              <FileText className="w-3 h-3" />
                                              {preview.mediaInfo}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openNotesModal(activity)
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 rounded transition-colors"
                                            title="View full note"
                                          >
                                            <FileText className="w-3 h-3" />
                                            <span>View</span>
                                          </button>
                                          
                                          {isOwner && (
                                            <button
                                              onClick={async (e) => {
                                                e.stopPropagation()
                                                const shouldDelete = await confirm(
                                                  'Are you sure you want to delete this note?',
                                                  'Delete Note',
                                                  'warning'
                                                )
                                                if (shouldDelete) {
                                                  deleteNote(activity.id, note.id)
                                                }
                                              }}
                                              className="flex-shrink-0 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                              title="Delete note"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
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

      {/* Simple Notes Modal */}
      {selectedActivity && (
        <SimpleNotesModal
          isOpen={isNotesModalOpen}
          onClose={closeNotesModal}
          activityId={selectedActivity.id}
          activityTitle={selectedActivity.title}
          meetingDate={selectedActivity.activity_date ? new Date(selectedActivity.activity_date) : new Date()}
          companies={[]} // TODO: Pass company information from trip context
          tripId={tripId}
          onNoteCountChange={(newCount) => {
            // Update the note count for this specific activity
            if (onNoteCountChange) {
              onNoteCountChange(selectedActivity.id, newCount)
            }
            // Refresh the activity notes data to show updated counts
            const refreshNotesData = async () => {
              try {
                const response = await fetch(`/api/activities/${selectedActivity.id}/notes`, {
                  credentials: 'include'
                })
                
                if (response.ok) {
                  const data = await response.json()
                  const allNotes = data.notes || []
                  setActivityNoteCounts(prev => ({ ...prev, [selectedActivity.id]: allNotes.length }))
                  setActivityNotes(prev => ({ ...prev, [selectedActivity.id]: allNotes }))
                }
              } catch (error) {
                console.error('Error refreshing notes data:', error)
              }
            }
            refreshNotesData()
          }}
        />
      )}
    </div>
  )
}