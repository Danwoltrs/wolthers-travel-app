/**
 * ActivityEditor Component
 * 
 * Modal component for adding and editing activities with comprehensive
 * form validation, conflict detection, and integration with trip data.
 */

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  AlertTriangle,
  Save,
  Calendar
} from 'lucide-react'
import type { EnhancedActivity, ActivityConflict } from '@/types/enhanced-modal'
import type { User, Company } from '@/types'

interface ActivityEditorProps {
  activity?: EnhancedActivity | null
  dayId: string
  timeSlot?: string
  availableUsers: User[]
  availableCompanies: Company[]
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Partial<EnhancedActivity>) => void
  onDelete?: () => void
}

export function ActivityEditor({
  activity,
  dayId,
  timeSlot,
  availableUsers,
  availableCompanies,
  isOpen,
  onClose,
  onSave,
  onDelete
}: ActivityEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meeting',
    time: timeSlot || '09:00',
    duration: 60,
    location: '',
    status: 'pending' as const,
    participants: [] as string[],
    requiresConfirmation: false,
    isPrivate: false,
    notes: ''
  })

  const [conflicts, setConflicts] = useState<ActivityConflict[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = Boolean(activity)

  // Initialize form with activity data
  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        type: activity.type || 'meeting',
        time: activity.time || '09:00',
        duration: activity.duration || 60,
        location: activity.location || '',
        status: activity.status || 'pending',
        participants: activity.participants || [],
        requiresConfirmation: activity.requiresConfirmation || false,
        isPrivate: activity.isPrivate || false,
        notes: activity.notes || ''
      })
      setConflicts(activity.conflicts || [])
    } else if (timeSlot) {
      setFormData(prev => ({ ...prev, time: timeSlot }))
    }
  }, [activity, timeSlot])

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.time) {
      newErrors.time = 'Time is required'
    }

    if (formData.duration < 5) {
      newErrors.duration = 'Duration must be at least 5 minutes'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const activityData: Partial<EnhancedActivity> = {
        ...formData,
        dayId,
        id: activity?.id,
        dragId: activity?.dragId || `activity-${Date.now()}`,
        isEditing: false,
        isSelected: false,
        validation: {
          isValid: true,
          errors: {},
          warnings: {},
          fieldStates: {}
        }
      }

      await onSave(activityData)
      onClose()
    } catch (error) {
      console.error('Failed to save activity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete
  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this activity?')) {
      onDelete()
      onClose()
    }
  }

  const activityTypes = [
    { value: 'meeting', label: 'Meeting', color: 'blue' },
    { value: 'visit', label: 'Visit', color: 'green' },
    { value: 'travel', label: 'Travel', color: 'purple' },
    { value: 'meal', label: 'Meal', color: 'orange' },
    { value: 'event', label: 'Event', color: 'pink' },
    { value: 'other', label: 'Other', color: 'gray' }
  ]

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-editor-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-xl w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 dark:bg-emerald-900 border-b border-emerald-700">
          <div className="flex items-center justify-between">
            <h3 id="activity-editor-title" className="text-lg font-semibold text-golden-400">
              {isEditing ? 'Edit Activity' : 'New Activity'}
            </h3>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="text-golden-400 hover:text-golden-300 transition-colors focus:outline-none focus:ring-2 focus:ring-golden-400 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Conflicts Detected</span>
                </div>
                <div className="mt-2 space-y-1">
                  {conflicts.map((conflict, index) => (
                    <p key={index} className="text-sm text-red-600 dark:text-red-400">
                      {conflict.description}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] ${
                    errors.title ? 'border-red-300' : 'border-gray-300 dark:border-[#2a2a2a]'
                  }`}
                  placeholder="Enter activity title"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a]"
                >
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a]"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time *
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] ${
                    errors.time ? 'border-red-300' : 'border-gray-300 dark:border-[#2a2a2a]'
                  }`}
                />
                {errors.time && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.time}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a] dark:border-[#2a2a2a] ${
                    errors.duration ? 'border-red-300' : 'border-gray-300 dark:border-[#2a2a2a]'
                  }`}
                />
                {errors.duration && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.duration}</p>
                )}
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a]"
                  placeholder="Enter location"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a]"
                placeholder="Enter activity description"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiresConfirmation}
                  onChange={(e) => setFormData(prev => ({ ...prev, requiresConfirmation: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Requires confirmation
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-400"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Private activity
                </span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:bg-[#1a1a1a]"
                placeholder="Additional notes"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#111111] border-t border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  Delete Activity
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isLoading ? 'Saving...' : 'Save Activity'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}