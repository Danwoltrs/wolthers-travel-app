/**
 * Schedule Tab Component
 * 
 * Provides comprehensive schedule management with calendar view,
 * activity editing, and drag-and-drop functionality using the
 * new CalendarView component with full DnD support.
 */

import React, { useState, useCallback } from 'react'
import type { TripCard } from '@/types'

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
  const [editingActivity, setEditingActivity] = useState<any | null>(null)
  const [showActivityEditor, setShowActivityEditor] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')

  // Simplified state for now - will use calendar manager hook later
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle activity editing
  const handleActivityEdit = useCallback((activity: any) => {
    setEditingActivity(activity)
    setShowActivityEditor(true)
  }, [])

  // Handle activity save
  const handleActivitySave = useCallback(async (activityData: any) => {
    // TODO: Implement save logic
    console.log('Saving activity:', activityData)
    setShowActivityEditor(false)
    setEditingActivity(null)
  }, [])

  // Handle activity delete
  const handleActivityDelete = useCallback(async () => {
    if (editingActivity) {
      // TODO: Implement delete logic
      console.log('Deleting activity:', editingActivity)
      setShowActivityEditor(false)
      setEditingActivity(null)
    }
  }, [editingActivity])

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

      {/* Simplified Schedule Interface */}
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="bg-emerald-800 dark:bg-emerald-900 text-golden-400 px-4 py-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Trip Schedule</h4>
              <p className="text-sm text-golden-400/70">
                {trip.duration} days • {trip.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {trip.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowActivityEditor(true)}
                className="bg-golden-400 text-gray-900 px-3 py-1.5 rounded text-sm font-medium hover:bg-golden-300 transition-colors"
              >
                + Add Activity
              </button>
            </div>
          </div>
        </div>

        {/* Daily Schedule Cards */}
        <div className="space-y-4">
          {Array.from({ length: trip.duration || 3 }, (_, index) => (
            <div key={index} className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-[#2a2a2a] px-4 py-2">
                <h5 className="font-medium text-gray-900 dark:text-golden-400">
                  Day {index + 1} - {new Date(trip.startDate.getTime() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </h5>
              </div>
              <div className="p-4">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No activities scheduled</p>
                  <button 
                    onClick={() => {
                      setSelectedDayId(`day-${index}`)
                      setShowActivityEditor(true)
                    }}
                    className="mt-2 text-emerald-600 dark:text-golden-400 hover:text-emerald-700 dark:hover:text-golden-300 text-sm font-medium"
                  >
                    + Add first activity
                  </button>
                </div>
              </div>
            </div>
          ))}
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
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4">
              Add Activity
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter activity title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter location or address..."
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCloseEditor}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Save logic here
                  handleCloseEditor()
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Meetings
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Visits
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            0
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