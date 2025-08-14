/**
 * ActivityCard Component
 * 
 * Draggable activity component with Nordic design, conflict indicators,
 * and action buttons for editing and deletion.
 */

import React from 'react'
import { useDrag } from 'react-dnd'
import { 
  MapPin, 
  Users, 
  Clock, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { ACTIVITY_ITEM_TYPE } from './TimeSlot'
import type { EnhancedActivity } from '@/types/enhanced-modal'

interface ActivityCardProps {
  activity: EnhancedActivity
  isDragging: boolean
  isPreview?: boolean
  onDragStart: (activity: EnhancedActivity) => void
  onDragEnd: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ActivityCard({
  activity,
  isDragging,
  isPreview = false,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete
}: ActivityCardProps) {
  const [{ opacity }, drag] = useDrag({
    type: ACTIVITY_ITEM_TYPE,
    item: { id: activity.id, activity },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    }),
    begin: () => {
      onDragStart(activity)
    },
    end: () => {
      onDragEnd()
    }
  })

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700'
      case 'visit':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700'
      case 'travel':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700'
      case 'meal':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700'
      case 'event':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-700'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'confirmed':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-3 h-3 text-red-500" />
      default:
        return <Clock className="w-3 h-3 text-amber-500" />
    }
  }

  const hasConflicts = activity.conflicts && activity.conflicts.length > 0
  const typeColorClasses = getActivityTypeColor(activity.type || 'default')

  return (
    <div
      ref={drag}
      style={{ opacity }}
      tabIndex={0}
      role="button"
      aria-label={`Activity: ${activity.title}. Time: ${activity.time}. ${hasConflicts ? 'Has conflicts.' : ''} Press Enter to edit or Space to select.`}
      aria-describedby={`activity-${activity.id}-details`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onEdit()
        } else if (e.key === ' ') {
          e.preventDefault()
          // Toggle selection (would need to be implemented in parent)
        } else if (e.key === 'Delete') {
          onDelete()
        }
      }}
      className={`relative group cursor-move transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:focus:ring-offset-[#1a1a1a] ${
        isDragging ? 'scale-105 shadow-lg' : 'hover:shadow-md'
      } ${
        isPreview ? 'scale-110 shadow-xl' : ''
      }`}
    >
      <div className={`p-3 rounded-lg border-2 bg-white dark:bg-[#1a1a1a] ${typeColorClasses} ${
        hasConflicts ? 'ring-2 ring-red-400' : ''
      }`}>
        {/* Activity Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
              {activity.title}
            </h5>
            {activity.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {activity.description}
              </p>
            )}
          </div>
          
          {/* Status and Conflicts */}
          <div className="flex items-center space-x-1 ml-2">
            {hasConflicts && (
              <AlertTriangle className="w-3 h-3 text-red-500" />
            )}
            {getStatusIcon()}
          </div>
        </div>

        {/* Activity Details */}
        <div id={`activity-${activity.id}-details`} className="space-y-1">
          {/* Time and Duration */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{activity.time}</span>
              {activity.duration && (
                <span className="text-gray-500">({activity.duration}m)</span>
              )}
            </div>
            
            {activity.type && (
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                getActivityTypeColor(activity.type).split(' ').slice(0, 2).join(' ')
              }`}>
                {activity.type}
              </span>
            )}
          </div>

          {/* Location */}
          {activity.location && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{activity.location}</span>
            </div>
          )}

          {/* Participants */}
          {activity.participants && activity.participants.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3" />
              <span>{activity.participants.length} participants</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isPreview && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white/80 dark:bg-gray-800/80 rounded"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="p-1 text-gray-400 hover:text-red-500 bg-white/80 dark:bg-gray-800/80 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Conflict Indicator */}
        {hasConflicts && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        )}

        {/* Selection Indicator */}
        {activity.isSelected && (
          <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg pointer-events-none"></div>
        )}

        {/* Editing Indicator */}
        {activity.isEditing && (
          <div className="absolute inset-0 border-2 border-golden-400 rounded-lg pointer-events-none animate-pulse"></div>
        )}
      </div>
    </div>
  )
}