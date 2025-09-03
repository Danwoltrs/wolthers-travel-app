/**
 * Schedule Tab Component
 * 
 * Provides comprehensive schedule management with calendar view,
 * activity editing, and drag-and-drop functionality using the
 * new CalendarView component with full DnD support.
 */

import React, { useState, useCallback } from 'react'
import { useActivityManager, type ActivityFormData, type Activity } from '@/hooks/useActivityManager'
import { OutlookCalendar } from '@/components/dashboard/OutlookCalendar'
import { calculateDuration } from '@/lib/utils'
import type { TripCard } from '@/types'

interface ScheduleTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'schedule', updates: any) => void
  validationState?: any
  onSyncCalendar?: () => void
}

export function ScheduleTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState,
  onSyncCalendar 
}: ScheduleTabProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [showActivityEditor, setShowActivityEditor] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [formData, setFormData] = useState<ActivityFormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    activity_date: '',
    end_date: '',
    type: 'meeting',
    location: '',
    host: '',
    cost: 0,
    currency: 'BRL',
    is_confirmed: false,
    notes: ''
  })

  // Use the activity manager hook with enhanced refresh capabilities
  const {
    activities,
    loading,
    error,
    saving,
    refreshing,
    createActivity,
    updateActivity,
    updateActivityDebounced,
    deleteActivity,
    getActivityStats,
    getActivitiesByDate,
    forceRefreshActivities
  } = useActivityManager(trip.id || '')

  // Handle activity editing
  const handleActivityEdit = useCallback((activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      title: activity.title || '',
      description: activity.description || '',
      start_time: activity.start_time || '',
      end_time: activity.end_time || '',
      activity_date: activity.activity_date || '',
      end_date: activity.end_date || activity.activity_date || '',
      type: activity.type || 'meeting',
      location: activity.location || '',
      host: activity.host || '',
      cost: activity.cost || 0,
      currency: (activity.currency as any) || 'BRL',
      is_confirmed: activity.is_confirmed || false,
      notes: activity.notes || ''
    })
    setShowActivityEditor(true)
  }, [])

  // Handle new activity creation
  const handleNewActivity = useCallback((timeSlot?: string, date?: string) => {
    setEditingActivity(null)
    setSelectedDate(date || '')
    
    // Calculate end time (1 hour after start time)
    let endTime = ''
    if (timeSlot) {
      const [hours, minutes] = timeSlot.split(':').map(Number)
      const endHour = hours + 1
      endTime = `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }
    
    const activityDate = date || (trip.startDate instanceof Date ? trip.startDate.toISOString().split('T')[0] : new Date(trip.startDate).toISOString().split('T')[0])
    setFormData({
      title: '',
      description: '',
      start_time: timeSlot || '',
      end_time: endTime,
      activity_date: activityDate,
      end_date: activityDate, // Default to same day, can be extended via UI
      type: 'meeting',
      location: '',
      host: '',
      cost: 0,
      currency: 'BRL',
      is_confirmed: false,
      notes: ''
    })
    setShowActivityEditor(true)
  }, [trip.startDate])

  // Handle trip extension
  const handleExtendTrip = useCallback(async (direction: 'before' | 'after' | 'remove-after' | 'remove-before') => {
    try {
      console.log(`📅 [ScheduleTab] ${direction === 'remove-after' || direction === 'remove-before' ? 'Removing day from' : 'Extending'} trip ${direction}`)
      
      // Show loading state
      setIsExtending(true)

      // Determine API parameters based on direction
      let apiDirection = direction
      let days = 1
      
      if (direction === 'remove-after') {
        apiDirection = 'after'
        days = -1 // Negative days for removal
      } else if (direction === 'remove-before') {
        apiDirection = 'before'
        days = -1 // Negative days for removal
      }

      // Call the extend trip API
      const response = await fetch(`/api/trips/${trip.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction: apiDirection, days }),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ [ScheduleTab] Trip ${direction === 'remove-after' || direction === 'remove-before' ? 'day removal' : 'extension'} successful:`, data)

      // Notify parent component to update trip data
      onUpdate('schedule', {
        schedule: {
          startDate: new Date(data.updatedTrip.start_date),
          endDate: new Date(data.updatedTrip.end_date)
        },
        trip: {
          startDate: new Date(data.updatedTrip.start_date),
          endDate: new Date(data.updatedTrip.end_date)
        }
      })

      // Force refresh activities to reflect new calendar structure
      console.log(`🔄 [ScheduleTab] Refreshing calendar after trip ${direction === 'remove-after' || direction === 'remove-before' ? 'day removal' : 'extension'}`)
      await forceRefreshActivities()
      
      console.log(`✅ [ScheduleTab] Trip ${direction === 'remove-after' || direction === 'remove-before' ? 'day removal' : 'extension'} and calendar refresh complete`)
    } catch (error: any) {
      console.error(`❌ [ScheduleTab] Trip ${direction === 'remove-after' || direction === 'remove-before' ? 'day removal' : 'extension'} failed:`, error)
      // Note: Error handling will be managed by useActivityManager
    } finally {
      setIsExtending(false)
    }
  }, [trip.id, onUpdate, forceRefreshActivities])

  // Handle activity save with simple loading approach
  const handleActivitySave = useCallback(async () => {
    try {
      if (editingActivity) {
        // Update existing activity
        console.log('💾 [ScheduleTab] Updating activity:', editingActivity.id, formData)
        const result = await updateActivity(editingActivity.id, formData)
        if (result) {
          console.log('✅ [ScheduleTab] Activity update successful')
          setShowActivityEditor(false)
          setEditingActivity(null)
        }
      } else {
        // Create new activity with loading + refresh
        console.log('💾 [ScheduleTab] Creating new activity:', {
          title: formData.title,
          date: formData.activity_date,
          time: formData.start_time
        })
        const result = await createActivity(formData)
        if (result) {
          console.log('✅ [ScheduleTab] Activity creation successful, closing modal')
          setShowActivityEditor(false)
        } else {
          console.error('❌ [ScheduleTab] Activity creation failed')
        }
      }
    } catch (error) {
      console.error('❌ [ScheduleTab] Activity save failed:', error)
    }
  }, [editingActivity, formData, updateActivity, createActivity])

  // Handle activity delete with simple loading approach
  const handleActivityDelete = useCallback(async () => {
    if (editingActivity) {
      try {
        console.log('🗑️ [ScheduleTab] Starting delete for activity:', {
          id: editingActivity.id,
          title: editingActivity.title,
          date: editingActivity.activity_date,
          time: editingActivity.start_time
        })
        const success = await deleteActivity(editingActivity.id)
        if (success) {
          console.log('✅ [ScheduleTab] Activity deletion successful, closing editor')
          setShowActivityEditor(false)
          setEditingActivity(null)
        } else {
          console.error('❌ [ScheduleTab] Delete operation failed')
        }
      } catch (error) {
        console.error('❌ [ScheduleTab] Activity deletion failed:', error)
      }
    } else {
      console.warn('🗑️ [ScheduleTab] No editing activity found for deletion')
    }
  }, [editingActivity, deleteActivity])

  // Close activity editor
  const handleCloseEditor = useCallback(() => {
    setShowActivityEditor(false)
    setEditingActivity(null)
  }, [])


  // Get activities grouped by date and statistics
  const activitiesByDate = getActivitiesByDate()
  const stats = getActivityStats()

  return (
    <div className="space-y-4 relative">
      {/* Loading Overlay */}
      {(refreshing || isExtending) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 shadow-xl border border-pearl-200 dark:border-[#2a2a2a]">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="text-lg font-medium text-gray-900 dark:text-golden-400">
                {isExtending ? 'Extending trip...' : 'Updating calendar...'}
              </p>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              Please wait while we sync your changes
            </p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <button
              onClick={forceRefreshActivities}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {saving && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {editingActivity ? 'Updating activity...' : 'Creating activity...'}
              </p>
            </div>
            <button
              onClick={forceRefreshActivities}
              className="px-2 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 transition-colors"
              title="Refresh calendar manually"
            >
              Refresh
            </button>
          </div>
        </div>
      )}


      {/* Outlook-Style Calendar with Loading Overlay */}
      <div className="relative">
        {(refreshing || isExtending) && (
          <div className="absolute inset-0 bg-white/70 dark:bg-[#1a1a1a]/70 rounded-lg flex items-center justify-center z-10">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 shadow-lg border border-pearl-200 dark:border-[#2a2a2a]">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                <p className="text-sm font-medium text-gray-900 dark:text-golden-400">
                  {isExtending ? 'Extending trip...' : 'Syncing calendar...'}
                </p>
              </div>
            </div>
          </div>
        )}
        <OutlookCalendar
          trip={trip}
          activities={activities}
          loading={loading}
          error={error}
          refreshing={refreshing}
          updateActivity={updateActivity}
          updateActivityDebounced={updateActivityDebounced}
          getActivitiesByDate={getActivitiesByDate}
          onExtendTrip={handleExtendTrip}
          onRemoveDay={async () => await handleExtendTrip('remove-after')}
          onRemoveFirstDay={async () => await handleExtendTrip('remove-before')}
          onActivityCreate={handleNewActivity}
          onActivityEdit={handleActivityEdit}
          forceRefreshActivities={forceRefreshActivities}
        />
      </div>

      {/* Activity Editor Modal */}
      {showActivityEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-lg p-6 w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] mx-0 sm:mx-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
                {editingActivity ? 'Edit Activity' : 'Add Activity'}
              </h3>
              {editingActivity && (
                <button
                  onClick={handleActivityDelete}
                  disabled={saving}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter activity title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter activity description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.activity_date}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setFormData(prev => ({ 
                        ...prev, 
                        activity_date: newStartDate,
                        // If end_date is before new start_date, update it
                        end_date: prev.end_date && prev.end_date < newStartDate ? newStartDate : prev.end_date
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date <span className="text-xs text-gray-500">(for multi-day events)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || formData.activity_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    min={formData.activity_date}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Type
                </label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                >
                  <option value="meeting">Meeting</option>
                  <option value="meal">Meal</option>
                  <option value="travel">Ground Transportation</option>
                  <option value="flight">Flight</option>
                  <option value="accommodation">Hotel / Accommodation</option>
                  <option value="event">Event / Conference</option>
                  <option value="break">Break / Free Time</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter location or address..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Host / Organizer
                </label>
                <input
                  type="text"
                  value={formData.host || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter host or organizer..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="DKK">DKK (kr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_confirmed}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_confirmed: e.target.checked }))}
                    className="rounded border-gray-300 dark:border-gray-600 text-emerald-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmed Activity
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseEditor}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleActivitySave}
                disabled={saving || refreshing || !formData.title.trim() || !formData.activity_date}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving || refreshing ? 'Saving...' : editingActivity ? 'Update Activity' : 'Add Activity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.meetings}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Meetings
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.visits}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Visits
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.confirmed}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Confirmed
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {calculateDuration(trip.startDate, trip.endDate)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Days
          </div>
        </div>
      </div>
    </div>
  )
}