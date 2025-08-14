/**
 * CalendarHeader Component
 * 
 * Calendar controls and navigation with view settings, filters,
 * and activity management tools.
 */

import React, { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  Settings, 
  Filter, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Timeline
} from 'lucide-react'
import type { CalendarViewSettings } from '@/types/enhanced-modal'
import type { Trip } from '@/types'

interface CalendarHeaderProps {
  trip: Trip
  calendarSettings: CalendarViewSettings
  onSettingsChange: (settings: Partial<CalendarViewSettings>) => void
  totalActivities: number
  totalDays: number
}

export function CalendarHeader({
  trip,
  calendarSettings,
  onSettingsChange,
  totalActivities,
  totalDays
}: CalendarHeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const viewTypeOptions = [
    { value: 'day', label: 'Day', icon: Calendar },
    { value: 'week', label: 'Week', icon: Grid3X3 },
    { value: 'timeline', label: 'Timeline', icon: Timeline }
  ] as const

  const timeSlotOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' }
  ] as const

  return (
    <div className="px-6 py-4 bg-emerald-800 dark:bg-emerald-900 border-b border-emerald-700">
      <div className="flex items-center justify-between">
        {/* Left Side - Trip Info */}
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="font-medium text-golden-400">Trip Schedule</h3>
            <div className="flex items-center space-x-4 text-xs text-golden-400/70">
              <span>{totalDays} days</span>
              <span>•</span>
              <span>{totalActivities} activities</span>
              <span>•</span>
              <span>
                {new Date(trip.startDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} - {new Date(trip.endDate).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Controls */}
        <div className="flex items-center space-x-3">
          {/* View Type Toggle */}
          <div className="flex rounded-lg border border-emerald-600 overflow-hidden">
            {viewTypeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => onSettingsChange({ viewType: option.value })}
                  className={`px-3 py-1.5 text-xs flex items-center space-x-1.5 transition-colors ${
                    calendarSettings.viewType === option.value
                      ? 'bg-golden-400 text-emerald-900'
                      : 'text-golden-400 hover:bg-emerald-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>

          {/* Time Slot Duration */}
          <div className="relative">
            <select
              value={calendarSettings.timeSlotDuration}
              onChange={(e) => onSettingsChange({ timeSlotDuration: Number(e.target.value) as 15 | 30 | 60 })}
              className="appearance-none bg-emerald-700 text-golden-400 text-xs px-3 py-1.5 rounded border border-emerald-600 focus:outline-none focus:ring-2 focus:ring-golden-400"
            >
              {timeSlotOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-golden-400 pointer-events-none" />
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${
              showSettings 
                ? 'bg-golden-400 text-emerald-900' 
                : 'text-golden-400 hover:bg-emerald-700'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded transition-colors ${
              showFilters 
                ? 'bg-golden-400 text-emerald-900' 
                : 'text-golden-400 hover:bg-emerald-700'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Add Activity Button */}
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-golden-400 text-emerald-900 rounded text-xs font-medium hover:bg-golden-300 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 p-4 bg-emerald-700/50 rounded-lg border border-emerald-600">
          <h4 className="text-sm font-medium text-golden-400 mb-3">Calendar Settings</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Hour */}
            <div>
              <label className="block text-xs text-golden-400/70 mb-1">Start Hour</label>
              <select
                value={calendarSettings.startHour}
                onChange={(e) => onSettingsChange({ startHour: Number(e.target.value) })}
                className="w-full bg-emerald-800 text-golden-400 text-xs px-2 py-1 rounded border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-golden-400"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            {/* End Hour */}
            <div>
              <label className="block text-xs text-golden-400/70 mb-1">End Hour</label>
              <select
                value={calendarSettings.endHour}
                onChange={(e) => onSettingsChange({ endHour: Number(e.target.value) })}
                className="w-full bg-emerald-800 text-golden-400 text-xs px-2 py-1 rounded border border-emerald-600 focus:outline-none focus:ring-1 focus:ring-golden-400"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            {/* Show Weekends */}
            <div>
              <label className="flex items-center space-x-2 text-xs text-golden-400">
                <input
                  type="checkbox"
                  checked={calendarSettings.showWeekends}
                  onChange={(e) => onSettingsChange({ showWeekends: e.target.checked })}
                  className="rounded border-emerald-600 text-golden-400 focus:ring-golden-400"
                />
                <span>Show Weekends</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="mt-4 p-4 bg-emerald-700/50 rounded-lg border border-emerald-600">
          <h4 className="text-sm font-medium text-golden-400 mb-3">Activity Filters</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Activity Type Filters */}
            {['meeting', 'visit', 'travel', 'meal', 'event'].map((type) => (
              <label key={type} className="flex items-center space-x-2 text-xs text-golden-400">
                <input
                  type="checkbox"
                  className="rounded border-emerald-600 text-golden-400 focus:ring-golden-400"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center space-x-4">
            {/* Status Filters */}
            <div className="flex items-center space-x-3">
              <span className="text-xs text-golden-400/70">Status:</span>
              {['confirmed', 'pending', 'cancelled'].map((status) => (
                <label key={status} className="flex items-center space-x-1 text-xs text-golden-400">
                  <input
                    type="checkbox"
                    className="rounded border-emerald-600 text-golden-400 focus:ring-golden-400"
                  />
                  <span className="capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}