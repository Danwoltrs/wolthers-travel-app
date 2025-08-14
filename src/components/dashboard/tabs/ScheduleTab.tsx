/**
 * Schedule Tab Component
 * 
 * Provides comprehensive schedule management with calendar view,
 * activity editing, and drag-and-drop functionality using the
 * new CalendarView component with full DnD support.
 */

import React, { useState, useCallback } from 'react'
import { useActivityManager, type ActivityFormData } from '@/hooks/useActivityManager'
import type { TripCard, Activity } from '@/types'

interface ScheduleTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'schedule', updates: any) => void
  validationState?: any
}

export function ScheduleTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState 
}: ScheduleTabProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [showActivityEditor, setShowActivityEditor] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [formData, setFormData] = useState<ActivityFormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    activity_date: '',
    type: 'meeting',
    location: '',
    host: '',
    cost: 0,
    currency: 'BRL',
    is_confirmed: false,
    notes: ''
  })

  // Use the activity manager hook
  const {
    activities,
    loading,
    error,
    saving,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivityStats,
    getActivitiesByDate
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
  const handleNewActivity = useCallback((date?: string) => {
    setEditingActivity(null)
    setSelectedDate(date || '')
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      activity_date: date || new Date(trip.startDate).toISOString().split('T')[0],
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

  // Handle activity save
  const handleActivitySave = useCallback(async () => {
    if (editingActivity) {
      // Update existing activity
      const result = await updateActivity(editingActivity.id, formData)
      if (result) {
        setShowActivityEditor(false)
        setEditingActivity(null)
      }
    } else {
      // Create new activity
      const result = await createActivity(formData)
      if (result) {
        setShowActivityEditor(false)
      }
    }
  }, [editingActivity, formData, updateActivity, createActivity])

  // Handle activity delete
  const handleActivityDelete = useCallback(async () => {
    if (editingActivity) {
      const success = await deleteActivity(editingActivity.id)
      if (success) {
        setShowActivityEditor(false)
        setEditingActivity(null)
      }
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

      {/* Schedule Interface */}
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="bg-emerald-800 dark:bg-emerald-900 text-golden-400 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Trip Schedule</h4>
              <p className="text-sm text-golden-400/70">
                {trip.duration} days • {trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              {loading && (
                <p className="text-xs text-golden-400/50 mt-1">Loading activities...</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleNewActivity()}
                disabled={saving}
                className="bg-golden-400 text-gray-900 px-3 py-1.5 rounded text-sm font-medium hover:bg-golden-300 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : '+ Add Activity'}
              </button>
            </div>
          </div>
        </div>

        {/* Daily Schedule Cards */}
        <div className="space-y-4">
          {Array.from({ length: trip.duration || 3 }, (_, index) => {
            const currentDate = new Date(trip.startDate.getTime() + index * 24 * 60 * 60 * 1000)
            const dateString = currentDate.toISOString().split('T')[0]
            const dayActivities = activitiesByDate[dateString] || []
            
            return (
              <div key={index} className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-[#2a2a2a] px-4 py-2 flex justify-between items-center">
                  <h5 className="font-medium text-gray-900 dark:text-golden-400">
                    Day {index + 1} - {currentDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h5>
                  <button 
                    onClick={() => handleNewActivity(dateString)}
                    disabled={saving}
                    className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">Loading activities...</p>
                    </div>
                  ) : dayActivities.length > 0 ? (
                    <div className="space-y-3">
                      {dayActivities.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg hover:bg-gray-100 dark:hover:bg-[#333] cursor-pointer"
                          onClick={() => handleActivityEdit(activity)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {activity.title}
                              </span>
                              {activity.is_confirmed && (
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {activity.start_time && activity.end_time ? 
                                `${activity.start_time} - ${activity.end_time}` : 
                                activity.start_time || 'No time set'
                              }
                              {activity.location && ` • ${activity.location}`}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              activity.type === 'meeting' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              activity.type === 'meal' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                              activity.type === 'flight' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                              activity.type === 'accommodation' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {activity.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p className="text-sm">No activities scheduled</p>
                      <button 
                        onClick={() => handleNewActivity(dateString)}
                        disabled={saving}
                        className="mt-2 text-emerald-600 dark:text-golden-400 hover:text-emerald-700 dark:hover:text-golden-300 text-sm font-medium disabled:opacity-50"
                      >
                        + Add first activity
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Days Section */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-golden-400 transition-colors">
            <span className="text-lg">+</span>
            <span className="text-sm font-medium">Add Days Before Trip</span>
          </button>
          <button className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 dark:border-[#2a2a2a] rounded-lg text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-golden-400 transition-colors">
            <span className="text-lg">+</span>
            <span className="text-sm font-medium">Add Days After Trip</span>
          </button>
        </div>
      </div>

      {/* Activity Editor Modal */}
      {showActivityEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.activity_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, activity_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  required
                />
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
                disabled={saving || !formData.title.trim() || !formData.activity_date}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingActivity ? 'Update Activity' : 'Add Activity'}
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
            {trip.duration || 3}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Days
          </div>
        </div>
      </div>
    </div>
  )
}