/**
 * Overview Tab Component
 * 
 * Provides enhanced editing capabilities for basic trip information
 * with real-time validation and progressive save functionality.
 */

import React, { useState, useCallback } from 'react'
import { Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react'
import type { TripCard } from '@/types'
import type { TabValidationState } from '@/types/enhanced-modal'

interface OverviewTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'overview', updates: any) => void
  validationState: TabValidationState
}

export function OverviewTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState 
}: OverviewTabProps) {
  const [formData, setFormData] = useState({
    title: trip.title,
    description: trip.subject || '',
    startDate: trip.startDate.toISOString().split('T')[0],
    endDate: trip.endDate.toISOString().split('T')[0],
    status: trip.status,
    priority: 'medium',
    budget: '',
    currency: 'DKK',
    notes: ''
  })

  const handleFieldChange = useCallback((field: string, value: any) => {
    const updatedFormData = {
      ...formData,
      [field]: value
    }
    setFormData(updatedFormData)
    
    // Notify parent of changes
    onUpdate('overview', {
      trip: updatedFormData
    })
  }, [formData, onUpdate])

  const getFieldError = (field: string): string | null => {
    return validationState.fieldStates[field]?.errors[0] || null
  }

  const getFieldWarning = (field: string): string | null => {
    return validationState.fieldStates[field]?.warnings[0] || null
  }

  const isFieldValid = (field: string): boolean => {
    return validationState.fieldStates[field]?.isValid !== false
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Trip Overview
        </h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{trip.duration} days</span>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Two-column layout for larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Trip Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trip Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 ${
                    isFieldValid('title')
                      ? 'border-gray-300 dark:border-[#2a2a2a] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                      : 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                  }`}
                  placeholder="Enter trip title..."
                />
                {getFieldError('title') && (
                  <div className="flex items-center space-x-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-red-500">{getFieldError('title')}</span>
                  </div>
                )}
              </div>

              {/* Trip Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Budget
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleFieldChange('budget', e.target.value)}
                    placeholder="0"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    className="w-20 px-2 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="DKK">DKK</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 ${
                      isFieldValid('startDate')
                        ? 'border-gray-300 dark:border-[#2a2a2a] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        : 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 ${
                      isFieldValid('endDate')
                        ? 'border-gray-300 dark:border-[#2a2a2a] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        : 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  placeholder="Brief description of the trip purpose and goals..."
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  placeholder="Any special requirements, considerations, or notes..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trip Statistics */}
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111]">
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-golden-400">
                  {trip.duration}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Days
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-golden-400">
                  {trip.wolthersStaff.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Staff
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-golden-400">
                  {trip.visitCount || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Visits
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-golden-400">
                  {trip.vehicles.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Vehicles
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      {!validationState.isValid && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="font-medium text-red-800 dark:text-red-200">
              Please fix the following issues:
            </span>
          </div>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {Object.entries(validationState.errors).map(([field, errors]) =>
              errors.map((error, index) => (
                <li key={`${field}-${index}`} className="list-disc list-inside">
                  {error}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}