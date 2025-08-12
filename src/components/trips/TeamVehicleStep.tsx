import React from 'react'
import { TripFormData } from './TripCreationModal'
import { Users, Car, UserCheck } from 'lucide-react'
import type { User, Vehicle } from '@/types'
import { UserRole, VehicleStatus } from '@/types'
import MultiSelectSearch, { MultiSelectOption } from '@/components/ui/MultiSelectSearch'
import { useWolthersStaff } from '@/hooks/useWolthersStaff'

interface TeamVehicleStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}


export default function TeamVehicleStep({ formData, updateFormData }: TeamVehicleStepProps) {
  const { staff, loading, error } = useWolthersStaff()

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

  // Convert Supabase staff data to MultiSelectOption format
  const staffOptions: MultiSelectOption[] = staff.map(member => ({
    id: member.id,
    label: member.full_name,
    sublabel: member.email
  }))

  // Handle team assignment changes
  const handleTeamChange = (selectedIds: string[]) => {
    const selectedStaff = staff.filter(member => selectedIds.includes(member.id))
    
    // Convert to User format for form data
    const formattedStaff: User[] = selectedStaff.map(member => ({
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: UserRole.WOLTHERS_STAFF,
      permissions: {},
      isActive: true,
      createdAt: new Date()
    }))

    updateFormData({
      wolthersStaff: formattedStaff
    })
  }

  const selectedStaffIds = formData.wolthersStaff.map(s => s.id)

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
          {formData.wolthersStaff.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>{formData.wolthersStaff.length}</strong> team member{formData.wolthersStaff.length !== 1 ? 's' : ''} selected
              </p>
            </div>
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