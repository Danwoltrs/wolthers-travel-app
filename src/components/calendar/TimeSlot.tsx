/**
 * TimeSlot Component
 * 
 * Individual time slot component that serves as a drop zone for activities
 * with visual feedback and conflict detection.
 */

import React, { ReactNode } from 'react'
import { useDrop } from 'react-dnd'
import { Plus, AlertTriangle } from 'lucide-react'
import type { EnhancedActivity } from '@/types/enhanced-modal'

interface TimeSlotProps {
  dayId: string
  timeSlot: string
  activities: EnhancedActivity[]
  isDropTarget: boolean
  hasConflicts: boolean
  onDragOver: (dayId: string, timeSlot: string) => void
  onDrop: (dayId: string, timeSlot: string) => void
  onAddActivity: () => void
  children: ReactNode
}

const ACTIVITY_ITEM_TYPE = 'activity'

export function TimeSlot({
  dayId,
  timeSlot,
  activities,
  isDropTarget,
  hasConflicts,
  onDragOver,
  onDrop,
  onAddActivity,
  children
}: TimeSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ACTIVITY_ITEM_TYPE,
    drop: () => {
      onDrop(dayId, timeSlot)
    },
    hover: () => {
      onDragOver(dayId, timeSlot)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })

  const isEmpty = activities.length === 0
  const isActive = isOver && canDrop

  return (
    <div
      ref={drop}
      role="region"
      aria-label={`Time slot ${timeSlot}${isEmpty ? ', empty' : `, ${activities.length} activities`}${hasConflicts ? ', has conflicts' : ''}`}
      tabIndex={isEmpty ? 0 : -1}
      onKeyDown={(e) => {
        if (isEmpty && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onAddActivity()
        }
      }}
      className={`min-h-[60px] p-2 rounded-lg border-2 border-dashed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 dark:focus:ring-offset-[#111111] ${
        isEmpty 
          ? 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500'
          : 'border-transparent'
      } ${
        isActive 
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
          : ''
      } ${
        hasConflicts 
          ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
          : ''
      }`}
    >
      {/* Time Label */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {timeSlot}
        </div>
        
        {/* Conflict Indicator */}
        {hasConflicts && (
          <AlertTriangle className="w-3 h-3 text-red-500" />
        )}
        
        {/* Add Activity Button */}
        {isEmpty && (
          <button
            onClick={onAddActivity}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Activities */}
      <div className="space-y-1">
        {children}
      </div>

      {/* Empty State */}
      {isEmpty && !isActive && (
        <div 
          className="flex items-center justify-center h-10 text-gray-400 hover:text-emerald-500 cursor-pointer transition-colors group"
          onClick={onAddActivity}
        >
          <div className="flex items-center space-x-1 text-xs">
            <Plus className="w-3 h-3" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              Add activity
            </span>
          </div>
        </div>
      )}

      {/* Drop Zone Indicator */}
      {isActive && (
        <div className="flex items-center justify-center h-8 text-emerald-600 text-xs font-medium">
          Drop activity here
        </div>
      )}
    </div>
  )
}

// Export the item type for use in other components
export { ACTIVITY_ITEM_TYPE }