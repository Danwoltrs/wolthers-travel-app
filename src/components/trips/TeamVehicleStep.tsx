import React, { useState, useEffect } from 'react'
import { TripFormData } from './TripCreationModal'
import { Users, Car, UserCheck, AlertTriangle, Calendar, Clock } from 'lucide-react'
import type { User, Vehicle } from '@/types'
import { UserRole, VehicleStatus } from '@/types'
import MultiSelectSearch, { MultiSelectOption } from '@/components/ui/MultiSelectSearch'
import { useWolthersStaff } from '@/hooks/useWolthersStaff'
import { useBulkAvailabilityCheck } from '@/hooks/useAvailabilityCheck'
import VehicleAllocationSection from './VehicleAllocationSection'

// Extended participant interface with date ranges
export interface ParticipantWithDates extends User {
  participationStartDate?: Date
  participationEndDate?: Date
  isPartial?: boolean
}

interface TeamVehicleStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}


export default function TeamVehicleStep({ formData, updateFormData }: TeamVehicleStepProps) {
  const { staff, loading, error } = useWolthersStaff()
  const { checkMultiple, getResult, loading: checkingAvailability, error: availabilityError } = useBulkAvailabilityCheck()
  const [conflicts, setConflicts] = useState<Map<string, any>>(new Map())
  const [showConflictWarning, setShowConflictWarning] = useState(false)
  const [participantsWithDates, setParticipantsWithDates] = useState<ParticipantWithDates[]>([])
  const [showDateRanges, setShowDateRanges] = useState(false)

  // Early return with fallback if there's an issue
  if (typeof window === 'undefined') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  // Convert Supabase staff data to MultiSelectOption format with safety checks
  const staffOptions: MultiSelectOption[] = (staff || []).map(member => ({
    id: member.id,
    label: member.full_name || member.email || 'Unknown',
    sublabel: member.email || ''
  }))

  // Check availability when dates or staff change
  useEffect(() => {
    if (formData.startDate && formData.endDate && (formData.wolthersStaff || []).length > 0) {
      const startDate = formData.startDate instanceof Date ? formData.startDate.toISOString().split('T')[0] : formData.startDate
      const endDate = formData.endDate instanceof Date ? formData.endDate.toISOString().split('T')[0] : formData.endDate
      
      const checks = (formData.wolthersStaff || []).map(staffMember => ({
        type: 'staff' as const,
        id: staffMember.id,
        startDate,
        endDate
      }))
      
      checkMultiple(checks).then(results => {
        const newConflicts = new Map()
        let hasConflicts = false
        
        ;(formData.wolthersStaff || []).forEach(staffMember => {
          const result = results.get(`staff-${staffMember.id}`)
          if (result && !result.available) {
            newConflicts.set(`staff-${staffMember.id}`, result.conflicts)
            hasConflicts = true
          }
        })
        
        setConflicts(newConflicts)
        setShowConflictWarning(hasConflicts)
      })
    }
  }, [formData.startDate, formData.endDate, formData.wolthersStaff, checkMultiple])

  // Handle team assignment changes with error handling
  const handleTeamChange = (selectedIds: string[]) => {
    try {
      const selectedStaff = (staff || []).filter(member => selectedIds.includes(member.id))
      
      // Convert to User format for form data
      const formattedStaff: User[] = selectedStaff.map(member => ({
        id: member.id,
        email: member.email || '',
        fullName: member.full_name || member.email || 'Unknown',
        role: UserRole.WOLTHERS_STAFF,
        permissions: {},
        isActive: true,
        createdAt: new Date()
      }))

      updateFormData({
        wolthersStaff: formattedStaff
      })
    } catch (error) {
      console.error('Error updating team assignment:', error)
    }
  }

  const selectedStaffIds = (formData.wolthersStaff || []).map(s => s.id)

  // Update participants with dates when staff changes
  useEffect(() => {
    if (formData.wolthersStaff && formData.wolthersStaff.length > 0) {
      setParticipantsWithDates(prevParticipants => {
        const newParticipants = formData.wolthersStaff!.map(staff => {
          // Check if this participant already has dates set
          const existingParticipant = prevParticipants.find(p => p.id === staff.id)
          return existingParticipant || {
            ...staff,
            participationStartDate: formData.startDate,
            participationEndDate: formData.endDate,
            isPartial: false
          }
        })
        return newParticipants
      })
    } else {
      setParticipantsWithDates([])
    }
  }, [formData.wolthersStaff, formData.startDate, formData.endDate])

  // Handle participant date range changes
  const handleParticipantDateChange = (participantId: string, field: 'participationStartDate' | 'participationEndDate', date: Date) => {
    setParticipantsWithDates(prev => 
      prev.map(participant => {
        if (participant.id === participantId) {
          const updated = { ...participant, [field]: date }
          // Determine if this is a partial participation
          const isPartial = updated.participationStartDate?.getTime() !== formData.startDate?.getTime() ||
                           updated.participationEndDate?.getTime() !== formData.endDate?.getTime()
          return { ...updated, isPartial }
        }
        return participant
      })
    )
  }

  // Handle partial participation toggle
  const handlePartialToggle = (participantId: string, isPartial: boolean) => {
    setParticipantsWithDates(prev =>
      prev.map(participant => {
        if (participant.id === participantId) {
          return {
            ...participant,
            isPartial,
            participationStartDate: isPartial ? participant.participationStartDate : formData.startDate,
            participationEndDate: isPartial ? participant.participationEndDate : formData.endDate
          }
        }
        return participant
      })
    )
  }

  // Update form data when participants with dates change
  useEffect(() => {
    updateFormData({
      participantsWithDates
    })
  }, [participantsWithDates])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading team members...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Error loading team members: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Column - Team Assignment */}
      <div className="h-full">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            Team Assignment
          </h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select all Wolthers staff members who will be part of this trip.
          </p>
          <MultiSelectSearch
            options={staffOptions}
            value={selectedStaffIds}
            onChange={handleTeamChange}
            placeholder="Select team members..."
            searchPlaceholder="Search staff members..."
            emptyMessage="No staff members found"
            className="w-full"
            maxDisplayItems={10}
          />
          {(formData.wolthersStaff || []).length > 0 && (
            <>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>{(formData.wolthersStaff || []).length}</strong> team member{(formData.wolthersStaff || []).length !== 1 ? 's' : ''} selected
                </p>
              </div>
              
              {/* Conflict Warning */}
              {showConflictWarning && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                        Schedule Conflicts Detected
                      </p>
                      <div className="text-xs text-red-700 dark:text-red-400 space-y-1">
                        {(formData.wolthersStaff || []).map(staffMember => {
                          const staffConflicts = conflicts.get(`staff-${staffMember.id}`)
                          if (!staffConflicts || staffConflicts.length === 0) return null
                          
                          return (
                            <div key={staffMember.id}>
                              <strong>{staffMember.fullName}</strong> is already assigned to:
                              {staffConflicts.map((conflict: any, index: number) => (
                                <div key={index} className="ml-2">
                                  • {conflict.title} ({conflict.startDate} to {conflict.endDate})
                                </div>
                              ))}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Availability Check Loading */}
              {checkingAvailability && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Checking staff availability...
                  </p>
                </div>
              )}
            </>
          )}
          
          {/* Participant Date Ranges Section */}
          {(formData.wolthersStaff || []).length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">
                    Participant Date Ranges
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDateRanges(!showDateRanges)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {showDateRanges ? 'Hide' : 'Customize'} Date Ranges
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                By default, all participants join for the entire trip. Enable partial participation to set custom date ranges.
              </p>
              
              {showDateRanges && (
                <div className="space-y-4">
                  {participantsWithDates.map(participant => (
                    <div key={participant.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {participant.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {participant.fullName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {participant.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-600 dark:text-gray-400">
                            Partial participation
                          </label>
                          <input
                            type="checkbox"
                            checked={participant.isPartial || false}
                            onChange={(e) => handlePartialToggle(participant.id, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      {participant.isPartial && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Join Date
                            </label>
                            <input
                              type="date"
                              value={participant.participationStartDate ? 
                                participant.participationStartDate.toISOString().split('T')[0] : 
                                formData.startDate?.toISOString().split('T')[0] || ''
                              }
                              onChange={(e) => handleParticipantDateChange(
                                participant.id, 
                                'participationStartDate', 
                                new Date(e.target.value)
                              )}
                              min={formData.startDate?.toISOString().split('T')[0]}
                              max={formData.endDate?.toISOString().split('T')[0]}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Leave Date
                            </label>
                            <input
                              type="date"
                              value={participant.participationEndDate ? 
                                participant.participationEndDate.toISOString().split('T')[0] : 
                                formData.endDate?.toISOString().split('T')[0] || ''
                              }
                              onChange={(e) => handleParticipantDateChange(
                                participant.id, 
                                'participationEndDate', 
                                new Date(e.target.value)
                              )}
                              min={participant.participationStartDate?.toISOString().split('T')[0] || 
                                   formData.startDate?.toISOString().split('T')[0]}
                              max={formData.endDate?.toISOString().split('T')[0]}
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                      
                      {!participant.isPartial && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Full trip participation ({formData.startDate?.toLocaleDateString()} - {formData.endDate?.toLocaleDateString()})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Driver Assignment & Vehicles */}
      <div className="space-y-6">
        {/* Vehicle Allocation */}
        <div>
          <div className="flex items-center mb-4">
            <Car className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Transportation & Vehicle Allocation
            </h3>
          </div>
          
          {formData.startDate && formData.endDate && (formData.wolthersStaff || []).length > 0 ? (
            <VehicleAllocationSection 
              formData={formData}
              updateFormData={updateFormData}
              participantsWithDates={participantsWithDates}
            />
          ) : (
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Please complete team selection and ensure trip dates are set to enable vehicle allocation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}