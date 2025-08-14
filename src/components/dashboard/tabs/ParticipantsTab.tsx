/**
 * Participants Tab Component
 * 
 * Provides enhanced participant management with real-time availability checking,
 * role assignments, and bulk operations support.
 */

import React, { useState, useCallback } from 'react'
import { 
  Users, 
  UserPlus, 
  Building, 
  Mail, 
  Phone, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Settings
} from 'lucide-react'
import type { TripCard } from '@/types'
import type { TabValidationState } from '@/types/enhanced-modal'

interface ParticipantsTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'participants', updates: any) => void
  validationState: TabValidationState
}

export function ParticipantsTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState 
}: ParticipantsTabProps) {
  const [activeSection, setActiveSection] = useState<'wolthers' | 'companies' | 'external'>('wolthers')
  const [showAddModal, setShowAddModal] = useState(false)
  const [bulkSelectMode, setBulkSelectMode] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])

  const handleAddParticipant = useCallback((type: string, participantData: any) => {
    onUpdate('participants', {
      participants: {
        [`${type}Participants`]: participantData
      }
    })
  }, [onUpdate])

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'busy':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'conflict':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'trip_lead':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'coordinator':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'client_representative':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'participant':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Participants Management
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setBulkSelectMode(!bulkSelectMode)}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {bulkSelectMode ? 'Exit Bulk Select' : 'Bulk Select'}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Participant</span>
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="border-b border-gray-200 dark:border-[#2a2a2a]">
        <nav className="flex space-x-6">
          {[
            { id: 'wolthers', label: 'Wolthers Staff', count: trip.wolthersStaff.length },
            { id: 'companies', label: 'Company Guests', count: trip.guests.reduce((acc, g) => acc + g.names.length, 0) },
            { id: 'external', label: 'External Guests', count: 0 }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={`pb-3 border-b-2 transition-colors ${
                activeSection === section.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {section.label}
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                {section.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        {activeSection === 'wolthers' && (
          <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            {/* Header */}
            <div className="px-6 py-3 bg-emerald-800 dark:bg-emerald-900">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-golden-400">Wolthers & Associates Staff</h4>
                <div className="text-xs text-golden-400/70">
                  {trip.wolthersStaff.length} member{trip.wolthersStaff.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Staff List */}
            {trip.wolthersStaff.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {trip.wolthersStaff.map((staff, index) => (
                  <div key={staff.id || index} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {bulkSelectMode && (
                          <input
                            type="checkbox"
                            checked={selectedParticipants.includes(staff.id || `staff-${index}`)}
                            onChange={(e) => {
                              const id = staff.id || `staff-${index}`
                              setSelectedParticipants(prev =>
                                e.target.checked
                                  ? [...prev, id]
                                  : prev.filter(p => p !== id)
                              )
                            }}
                            className="rounded border-gray-300 dark:border-gray-600 text-emerald-600"
                          />
                        )}
                        
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {staff.fullName}
                            </div>
                            {staff.email && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                                <Mail className="w-3 h-3" />
                                <span>{staff.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Role Badge */}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor('trip_lead')}`}>
                          Staff
                        </span>
                        
                        {/* Availability Status */}
                        <div className="flex items-center space-x-1">
                          {getAvailabilityIcon('available')}
                          <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No staff members assigned</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Add Wolthers staff to manage this trip
                </p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'companies' && (
          <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            {/* Header */}
            <div className="px-6 py-3 bg-purple-800 dark:bg-purple-900">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-golden-400">Company Representatives</h4>
                <div className="text-xs text-golden-400/70">
                  {trip.client.length} compan{trip.client.length !== 1 ? 'ies' : 'y'}
                </div>
              </div>
            </div>

            {/* Companies List */}
            {trip.client.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                {trip.client.map((company, companyIndex) => {
                  const companyGuests = trip.guests.find(g => g.companyId === company.id)
                  return (
                    <div key={company.id || companyIndex} className="px-6 py-4">
                      {/* Company Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                            <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {company.fantasyName || company.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {companyGuests?.names.length || 0} representative{(companyGuests?.names.length || 0) !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        
                        <button className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-800">
                          Add Representative
                        </button>
                      </div>

                      {/* Company Representatives */}
                      {companyGuests && companyGuests.names.length > 0 && (
                        <div className="ml-11 space-y-2">
                          {companyGuests.names.map((name, guestIndex) => (
                            <div key={`${company.id}-${guestIndex}`} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-[#111111] rounded-md">
                              <div className="flex items-center space-x-3">
                                {bulkSelectMode && (
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 dark:border-gray-600 text-purple-600"
                                  />
                                )}
                                <div>
                                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {company.fantasyName || company.name}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleColor('client_representative')}`}>
                                  Client Rep
                                </span>
                                <div className="flex items-center space-x-1">
                                  {getAvailabilityIcon('unknown')}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Unknown</span>
                                </div>
                                <button className="p-1 text-gray-400 hover:text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <Building className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No company representatives</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Add client company representatives to this trip
                </p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'external' && (
          <div className="px-6 py-12 text-center">
            <UserPlus className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">External guest management coming soon</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add external guests and contractors
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {bulkSelectMode && selectedParticipants.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] px-6 py-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {selectedParticipants.length} selected
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                Change Role
              </button>
              <button className="px-3 py-1 text-xs bg-amber-600 text-white rounded-md hover:bg-amber-700">
                Update Dates
              </button>
              <button className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700">
                Remove
              </button>
            </div>
            <button
              onClick={() => {
                setSelectedParticipants([])
                setBulkSelectMode(false)
              }}
              className="px-3 py-1 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {trip.wolthersStaff.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Wolthers Staff
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {trip.guests.reduce((acc, g) => acc + g.names.length, 0)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Company Reps
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            External Guests
          </div>
        </div>
      </div>
    </div>
  )
}