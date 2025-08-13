import React, { useState, useEffect } from 'react'
import { TripFormData } from './TripCreationModal'
import { Users, Car, UserCheck, AlertTriangle } from 'lucide-react'
import type { User, Vehicle } from '@/types'
import { UserRole, VehicleStatus } from '@/types'
import MultiSelectSearch, { MultiSelectOption } from '@/components/ui/MultiSelectSearch'
import { useWolthersStaff } from '@/hooks/useWolthersStaff'
import { useBulkAvailabilityCheck } from '@/hooks/useAvailabilityCheck'

interface TeamVehicleStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}


export default function TeamVehicleStep({ formData, updateFormData }: TeamVehicleStepProps) {
  const { staff, loading, error } = useWolthersStaff()
  const { checkMultiple, getResult, loading: checkingAvailability, error: availabilityError } = useBulkAvailabilityCheck()
  const [conflicts, setConflicts] = useState<Map<string, any>>(new Map())
  const [showConflictWarning, setShowConflictWarning] = useState(false)

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
      const startDate = formData.startDate.toISOString().split('T')[0]
      const endDate = formData.endDate.toISOString().split('T')[0]
      
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Team Assignment */}
      <div>
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
        </div>
      </div>

      {/* Right Column - Driver Assignment & Vehicles */}
      <div className="space-y-6">
        {/* Driver Assignment */}
        <div>
          <div className="flex items-center mb-4">
            <UserCheck className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Driver Assignment
            </h3>
          </div>
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Driver assignment coming soon. Selected team members can serve as drivers when needed.
            </p>
          </div>
        </div>

        {/* Vehicles */}
        <div>
          <div className="flex items-center mb-4">
            <Car className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-md font-medium text-gray-900 dark:text-white">
              Transportation
            </h3>
          </div>
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Vehicle assignment available soon. Support for both company vehicles and rental options coming.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}