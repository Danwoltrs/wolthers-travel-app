/**
 * Schedule Tab Component
 * 
 * Provides comprehensive schedule management with calendar view,
 * activity editing, and drag-and-drop functionality using the
 * new CalendarView component with full DnD support.
 */

import React, { useState, useCallback } from 'react'
import { CalendarView, ActivityEditor } from '@/components/calendar'
import { useCalendarManager } from '@/hooks/useCalendarManager'
import type { TripCard, User, Company } from '@/types'
import type { TabValidationState, EnhancedActivity } from '@/types/enhanced-modal'

interface ScheduleTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'schedule', updates: any) => void
  validationState: TabValidationState
}

export function ScheduleTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState 
}: ScheduleTabProps) {
  const [editingActivity, setEditingActivity] = useState<EnhancedActivity | null>(null)
  const [showActivityEditor, setShowActivityEditor] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')

  // Calendar manager hook
  const {
    itineraryDays,
    calendarSettings,
    isLoading,
    error,
    moveActivity,
    saveActivity,
    deleteActivity,
    extendTripDates,
    updateCalendarSettings
  } = useCalendarManager({ 
    trip, 
    onUpdate: (updates) => onUpdate('schedule', updates)
  })

  // Mock data for available users and companies (in real app, fetch from props or API)
  const availableUsers: User[] = []
  const availableCompanies: Company[] = []

  // Handle activity editing
  const handleActivityEdit = useCallback((activity: EnhancedActivity) => {
    setEditingActivity(activity)
    setShowActivityEditor(true)
  }, [])

  // Handle activity addition
  const handleActivityAdd = useCallback((dayId: string, timeSlot: string) => {
    setEditingActivity(null)
    setSelectedDayId(dayId)
    setSelectedTimeSlot(timeSlot)
    setShowActivityEditor(true)
  }, [])

  // Handle activity save
  const handleActivitySave = useCallback(async (activityData: Partial<EnhancedActivity>) => {
    await saveActivity(activityData)
    setShowActivityEditor(false)
    setEditingActivity(null)
  }, [saveActivity])

  // Handle activity delete
  const handleActivityDelete = useCallback(async () => {
    if (editingActivity) {
      await deleteActivity(editingActivity.id)
      setShowActivityEditor(false)
      setEditingActivity(null)
    }
  }, [editingActivity, deleteActivity])

  // Close activity editor
  const handleCloseEditor = useCallback(() => {
    setShowActivityEditor(false)
    setEditingActivity(null)
    setSelectedDayId('')
    setSelectedTimeSlot('')
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
            Schedule Management
          </h3>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Calendar Interface */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a]">
          <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
        </div>
      ) : (
        <CalendarView
          trip={trip}
          itineraryDays={itineraryDays}
          calendarSettings={calendarSettings}
          onActivityMove={moveActivity}
          onActivityEdit={handleActivityEdit}
          onActivityDelete={deleteActivity}
          onActivityAdd={handleActivityAdd}
          onDateExtend={extendTripDates}
          onSettingsChange={updateCalendarSettings}
        />
      )}

      {/* Activity Editor Modal */}
      <ActivityEditor
        activity={editingActivity}
        dayId={selectedDayId}
        timeSlot={selectedTimeSlot}
        availableUsers={availableUsers}
        availableCompanies={availableCompanies}
        isOpen={showActivityEditor}
        onClose={handleCloseEditor}
        onSave={handleActivitySave}
        onDelete={editingActivity ? handleActivityDelete : undefined}
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {itineraryDays.reduce((sum, day) => sum + day.activities.filter(a => a.type === 'meeting').length, 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Meetings
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {itineraryDays.reduce((sum, day) => sum + day.activities.filter(a => a.type === 'visit').length, 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Visits
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {itineraryDays.reduce((sum, day) => sum + day.activities.filter(a => a.status === 'confirmed').length, 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Confirmed
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {itineraryDays.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Days
          </div>
        </div>
      </div>
    </div>
  )
}