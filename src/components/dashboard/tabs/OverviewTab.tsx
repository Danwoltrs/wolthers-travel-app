/**
 * Overview Tab Component
 * 
 * Provides enhanced editing capabilities for basic trip information
 * with real-time validation and progressive save functionality.
 */

import React, { useState, useCallback } from 'react'
import { Calendar, MapPin, Users, Clock, AlertCircle } from 'lucide-react'
import { calculateDuration } from '@/lib/utils'
import type { TripCard } from '@/types'
import type { TabValidationState } from '@/types/enhanced-modal'

interface OverviewTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'overview', updates: any) => void
  validationState: TabValidationState
  liveParticipantStats?: { 
    total: number; 
    staff: number; 
    guests: number;
    staffMembers: Array<{ id: string; fullName: string }>;
    guestMembers: Array<{ id: string; fullName: string }>;
  }
  mode?: 'view' | 'edit'
  activityStats?: { visits: number; meetings: number }
  groupedActivities?: Record<string, any[]>
  activitiesLoading?: boolean
  tripError?: any
  sortedDates?: string[]
}

export function OverviewTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState,
  liveParticipantStats,
  mode = 'edit',
  activityStats = { visits: 0, meetings: 0 },
  groupedActivities = {},
  activitiesLoading = false,
  tripError = null,
  sortedDates = []
}: OverviewTabProps) {
  const [formData, setFormData] = useState({
    title: trip.title,
    description: trip.subject || '',
    startDate: trip.startDate instanceof Date ? trip.startDate.toISOString().split('T')[0] : trip.startDate,
    endDate: trip.endDate instanceof Date ? trip.endDate.toISOString().split('T')[0] : trip.endDate,
    status: trip.status,
    priority: 'medium',
    budget: '',
    currency: 'BRL',
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

  // If in view mode, show the overview information
  if (mode === 'view') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
            Trip Overview
          </h3>
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{calculateDuration(trip.startDate, trip.endDate)} days</span>
          </div>
        </div>

        {/* Trip Information Display */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trip Title
                  </label>
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    {trip.title}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <div className="text-base text-gray-900 dark:text-gray-100 capitalize">
                    {trip.status}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration
                  </label>
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    {calculateDuration(trip.startDate, trip.endDate)} days
                  </div>
                </div>
              </div>

              {/* Right Column - Dates and Description */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <div className="text-base text-gray-900 dark:text-gray-100">
                      {trip.startDate instanceof Date ? 
                        trip.startDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 
                        new Date(trip.startDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      }
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <div className="text-base text-gray-900 dark:text-gray-100">
                      {trip.endDate instanceof Date ? 
                        trip.endDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 
                        new Date(trip.endDate).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <div className="text-base text-gray-900 dark:text-gray-100">
                    {trip.subject || 'No description available'}
                  </div>
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
                    {calculateDuration(trip.startDate, trip.endDate)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Days
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-golden-400">
                    {liveParticipantStats?.staff ?? trip.wolthersStaff.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Staff
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-golden-400">
                    {activityStats.visits}
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

        {/* Participants Overview */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-golden-400">Participants</h4>
          
          {/* Mobile: Simple text layout */}
          <div className="md:hidden">
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {/* Guest Companies */}
              {trip.client.length > 0 && (
                <span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">
                    {trip.client.map(company => company.fantasyName || company.name).join(', ')}:
                  </span>
                  {' '}
                  {trip.guests.map(guestGroup => guestGroup.names.join(', ')).join(', ')}
                </span>
              )}
              
              {/* Wolthers Staff */}
              {liveParticipantStats?.staffMembers && liveParticipantStats.staffMembers.length > 0 && (
                <>
                  {trip.client.length > 0 && ' | '}
                  <span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">Wolthers staff:</span>
                    {' '}
                    {liveParticipantStats.staffMembers.map(staff => staff.fullName).join(', ')}
                  </span>
                </>
              )}
              
              {/* Vehicles */}
              {trip.vehicles.length > 0 && (
                <>
                  {(trip.client.length > 0 || (liveParticipantStats?.staffMembers && liveParticipantStats.staffMembers.length > 0)) && ' | '}
                  <span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">Vehicles:</span>
                    {' '}
                    {trip.vehicles.map(vehicle => `${vehicle.make} ${vehicle.model}`).join(', ')}
                  </span>
                </>
              )}
              
              {/* Drivers */}
              {trip.drivers.length > 0 && (
                <>
                  {(trip.client.length > 0 || (liveParticipantStats?.staffMembers && liveParticipantStats.staffMembers.length > 0) || trip.vehicles.length > 0) && ' | '}
                  <span>
                    <span className="font-medium text-gray-900 dark:text-gray-200">Drivers:</span>
                    {' '}
                    {trip.drivers.map(driver => driver.fullName).join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Desktop: Flexible Card Layout */}
          <div className="hidden md:block">
            <div className="flex flex-wrap gap-4">
              {/* Company Cards - Flexible sizing */}
              {trip.client.map((company) => {
                const companyGuests = trip.guests.find(g => g.companyId === company.id)
                return (
                  <div key={company.id} className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-pearl-200 dark:border-[#2a2a2a] flex-1 min-w-[200px]">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                      {company.fantasyName || company.name}
                    </h4>
                    {companyGuests && (
                      <div className="space-y-1">
                        {companyGuests.names.map((name, index) => (
                          <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Combined Wolthers Staff, Vehicles & Drivers Card */}
              {((liveParticipantStats?.staffMembers && liveParticipantStats.staffMembers.length > 0) || trip.vehicles.length > 0 || trip.drivers.length > 0) && (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-pearl-200 dark:border-[#2a2a2a] flex-[2] min-w-[400px]">
                  <div className="grid grid-cols-3 gap-6 divide-x divide-gray-200 dark:divide-[#2a2a2a]">
                    {/* Wolthers Staff */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                        Wolthers Staff
                      </h4>
                      {liveParticipantStats?.staffMembers && liveParticipantStats.staffMembers.length > 0 ? (
                        <div className="space-y-1">
                          {liveParticipantStats.staffMembers.map((staff) => (
                            <div key={staff.id} className="text-sm text-gray-700 dark:text-gray-300">
                              {staff.fullName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No staff
                        </div>
                      )}
                    </div>
                    
                    {/* Vehicles */}
                    <div className="pl-6">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                        Vehicles
                      </h4>
                      {trip.vehicles.length > 0 ? (
                        <div className="space-y-1">
                          {trip.vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="text-sm text-gray-700 dark:text-gray-300">
                              {vehicle.make} {vehicle.model}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No vehicles
                        </div>
                      )}
                    </div>
                    
                    {/* Drivers */}
                    <div className="pl-6">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                        Drivers
                      </h4>
                      {trip.drivers.length > 0 ? (
                        <div className="space-y-1">
                          {trip.drivers.map((driver) => (
                            <div key={driver.id} className="text-sm text-gray-700 dark:text-gray-300">
                              {driver.fullName}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No drivers
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Separator Line */}
          <div className="border-t border-gray-200 dark:border-[#2a2a2a]"></div>
        </div>

        {/* Meetings & Visits */}
        {(activitiesLoading) ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading meeting details...</div>
          </div>
        ) : tripError ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
            <div className="text-sm text-red-500">Error loading meeting details</div>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">No activities scheduled yet</div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-golden-400">Activities</h4>
            
            {/* Small screens: Full width list layout */}
            <div className="block sm:hidden space-y-3">
              {sortedDates.map((date, dayIndex) => {
                const dayActivities = groupedActivities[date]
                const dayDate = new Date(date)
                
                return (
                  <div key={date}>
                    {/* Day Header - Full Width */}
                    <div className="bg-emerald-800 dark:bg-emerald-900 text-golden-400 px-3 py-3 -mx-3">
                      <h3 className="font-medium text-sm">
                        Day {dayIndex + 1} - {dayDate.toLocaleDateString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </h3>
                    </div>
                    
                    {/* Activities - Full Width */}
                    <div className="-mx-3">
                      {dayActivities.map((item: any, itemIndex: number) => {
                        const startTime = item.start_time ? item.start_time.slice(0, 5) : ''
                        const isEven = itemIndex % 2 === 0
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`px-3 py-3 ${
                              isEven 
                                ? 'bg-gray-50 dark:bg-[#1a1a1a]' 
                                : 'bg-gray-100 dark:bg-[#242424]'
                            }`}
                          >
                            <div className="flex gap-3">
                              <span className="text-gray-500 dark:text-gray-400 font-mono text-xs min-w-[2.5rem]">
                                {startTime}
                              </span>
                              <span className="text-gray-400 text-xs">-</span>
                              <div className="flex-1">
                                <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-tight">
                                  {item.title}
                                </p>
                                {item.host && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Host: {item.host}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden sm:block bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
              <div className="space-y-0">
                {sortedDates.map((date, dayIndex) => {
                  const dayActivities = groupedActivities[date]
                  const dayDate = new Date(date)
                  
                  return (
                    <div key={date} className="border-b border-gray-200 dark:border-[#2a2a2a] last:border-b-0">
                      {/* Day Header - Centered */}
                      <div className="px-4 py-2 bg-emerald-800 dark:bg-emerald-900 text-center">
                        <div className="text-sm font-medium text-golden-400">
                          Day {dayIndex + 1} - {dayDate.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      
                      {/* Activities for the Day */}
                      <div className="px-4 py-4 space-y-3">
                        {dayActivities.map((item: any, itemIndex: number) => {
                          const startTime = item.start_time ? item.start_time.slice(0, 5) : ''
                          const endTime = item.end_time ? item.end_time.slice(0, 5) : ''
                          const timeRange = startTime && endTime ? `${startTime}-${endTime}` : startTime
                          
                          return (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-start text-sm">
                              {/* Time */}
                              <div className="col-span-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                {timeRange}
                              </div>
                              
                              {/* Activity */}
                              <div className="col-span-10">
                                <div className="flex items-center gap-2">
                                  {item.is_confirmed && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                  )}
                                  <span className="text-gray-900 dark:text-gray-200 font-medium">
                                    {item.title}
                                  </span>
                                </div>
                                {item.host && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Host: {item.host}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 px-4 py-6 border-t border-gray-200 dark:border-[#2a2a2a]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                    {activityStats.visits}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Visits
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                    {activityStats.meetings}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Meetings
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                    {calculateDuration(trip.startDate, trip.endDate)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                    {trip.notesCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Notes
                  </div>
                </div>
              </div>
            </div>

            {/* Small screens: Summary Stats */}
            <div className="block sm:hidden bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] mt-4 p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                    {activityStats.visits}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Visits
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                    {activityStats.meetings}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Meetings
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                    {calculateDuration(trip.startDate, trip.endDate)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Days
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                    {trip.notesCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Notes
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Edit mode - show the existing form interface
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Trip Overview
        </h3>
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{calculateDuration(trip.startDate, trip.endDate)} days</span>
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
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="DKK">DKK</option>
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
                  {calculateDuration(trip.startDate, trip.endDate)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Days
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-golden-400">
                  {liveParticipantStats?.staff ?? trip.wolthersStaff.length}
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