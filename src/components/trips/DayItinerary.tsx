'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, MapPin, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import ActivityNotes from './ActivityNotes'
import type { ItineraryDay, Activity } from '@/types'

interface DayItineraryProps {
  day: ItineraryDay
  isExpanded: boolean
  onToggle: () => void
  isToday?: boolean
}

export default function DayItinerary({ day, isExpanded, onToggle, isToday = false }: DayItineraryProps) {
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  
  const today = new Date()
  const isPastDay = day.date < today && !isToday
  const isFutureDay = day.date > today

  const toggleActivity = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(activityId)) {
        newSet.delete(activityId)
      } else {
        newSet.add(activityId)
      }
      return newSet
    })
  }

  const getActivityStatus = (activity: Activity, dayIsPast: boolean, dayIsToday: boolean) => {
    if (dayIsPast) return 'past'
    if (!dayIsToday) return 'future'
    
    // Check if current meeting by time
    const now = new Date()
    const [hours, minutes] = activity.time.split(':').map(Number)
    const activityTime = new Date()
    activityTime.setHours(hours, minutes, 0, 0)
    
    const activityEndTime = new Date(activityTime)
    if (activity.durationMinutes) {
      activityEndTime.setMinutes(activityEndTime.getMinutes() + activity.durationMinutes)
    } else {
      activityEndTime.setHours(activityEndTime.getHours() + 1) // Default 1 hour
    }
    
    if (now >= activityTime && now <= activityEndTime) {
      return 'current'
    } else if (now > activityEndTime) {
      return 'past'
    } else {
      return 'future'
    }
  }

  const getActivityStyles = (status: string, isOdd: boolean) => {
    const baseStyles = 'border-l-4 pl-4 py-3 transition-colors'
    
    if (status === 'past') {
      return cn(baseStyles, 'border-gray-300 bg-gray-50 text-gray-600')
    }
    
    if (status === 'current') {
      return cn(baseStyles, 'border-amber-400 bg-amber-50 text-amber-900')
    }
    
    // Future activities with alternating backgrounds
    return cn(baseStyles, 'border-emerald-400', {
      'bg-white': isOdd,
      'bg-emerald-50': !isOdd
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDayHeaderStyles = () => {
    if (isPastDay) {
      return 'bg-gray-100 text-gray-600 border-gray-200'
    }
    
    if (isToday) {
      return 'bg-amber-100 text-amber-900 border-amber-200'
    }
    
    return 'bg-emerald-100 text-emerald-900 border-emerald-200'
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Day Header */}
      <div 
        className={cn(
          'px-6 py-4 border-b cursor-pointer transition-colors hover:opacity-90',
          getDayHeaderStyles()
        )}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="p-1 rounded-full hover:bg-white/20 transition-colors">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <h3 className="text-lg font-semibold">
                {formatDate(day.date)}
              </h3>
              {isToday && (
                <span className="px-2 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                  TODAY
                </span>
              )}
            </div>
          </div>
          
          <div className="text-sm font-medium">
            {day.activities.length} activities
          </div>
        </div>
        
        {day.notes && (
          <p className="mt-2 text-sm opacity-90">{day.notes}</p>
        )}
      </div>

      {/* Activities */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {day.activities.map((activity, index) => {
            const activityStatus = getActivityStatus(activity, isPastDay, isToday)
            const isActivityExpanded = expandedActivities.has(activity.id)
            const isOdd = index % 2 === 1
            
            return (
              <div key={activity.id}>
                <div 
                  className={cn(
                    getActivityStyles(activityStatus, isOdd),
                    'cursor-pointer hover:bg-opacity-80'
                  )}
                  onClick={() => toggleActivity(activity.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>{activity.time}</span>
                        {activity.durationMinutes && (
                          <span className="text-gray-500">
                            ({activity.durationMinutes}min)
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {activity.title}
                        </h4>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {activity.attendees.length > 0 && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {activity.attendees.length}
                        </div>
                      )}
                      
                      <ChevronRight className={cn(
                        'w-4 h-4 transition-transform',
                        isActivityExpanded && 'rotate-90'
                      )} />
                    </div>
                  </div>
                </div>
                
                {isActivityExpanded && (
                  <ActivityNotes 
                    activity={activity}
                    onClose={() => toggleActivity(activity.id)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}