import React from 'react'
import { TripFormData } from './TripCreationModal'
import { Users, Car, UserCheck } from 'lucide-react'
import type { User, Vehicle } from '@/types'
import { UserRole, VehicleStatus } from '@/types'

interface TeamVehicleStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

// Mock data
const mockStaff: User[] = [
  {
    id: '1',
    email: 'john.doe@wolthers.com',
    fullName: 'John Doe',
    role: UserRole.WOLTHERS_STAFF,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '2',
    email: 'jane.smith@wolthers.com',
    fullName: 'Jane Smith',
    role: UserRole.WOLTHERS_STAFF,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  },
  {
    id: '3',
    email: 'bob.wilson@wolthers.com',
    fullName: 'Bob Wilson',
    role: UserRole.DRIVER,
    permissions: {},
    isActive: true,
    createdAt: new Date()
  }
]

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Land Cruiser',
    year: 2022,
    color: 'White',
    licensePlate: 'ABC-1234',
    currentMileage: 25000,
    status: VehicleStatus.ACTIVE,
    createdAt: new Date()
  },
  {
    id: '2',
    make: 'Ford',
    model: 'Explorer',
    year: 2023,
    color: 'Black',
    licensePlate: 'XYZ-5678',
    currentMileage: 15000,
    status: VehicleStatus.ACTIVE,
    createdAt: new Date()
  }
]

export default function TeamVehicleStep({ formData, updateFormData }: TeamVehicleStepProps) {
  const toggleStaff = (user: User) => {
    const isSelected = formData.wolthersStaff.some(s => s.id === user.id)
    if (isSelected) {
      updateFormData({
        wolthersStaff: formData.wolthersStaff.filter(s => s.id !== user.id)
      })
    } else {
      updateFormData({
        wolthersStaff: [...formData.wolthersStaff, user]
      })
    }
  }

  const toggleDriver = (user: User) => {
    const isSelected = formData.drivers.some(d => d.id === user.id)
    if (isSelected) {
      updateFormData({
        drivers: formData.drivers.filter(d => d.id !== user.id)
      })
    } else {
      updateFormData({
        drivers: [...formData.drivers, user]
      })
    }
  }

  const toggleVehicle = (vehicle: Vehicle) => {
    const isSelected = formData.vehicles.some(v => v.id === vehicle.id)
    if (isSelected) {
      updateFormData({
        vehicles: formData.vehicles.filter(v => v.id !== vehicle.id)
      })
    } else {
      updateFormData({
        vehicles: [...formData.vehicles, vehicle]
      })
    }
  }

  const availableDrivers = mockStaff.filter(s => 
    s.role === UserRole.DRIVER || s.role === UserRole.WOLTHERS_STAFF
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Assign Team & Vehicles
        </h2>
      </div>

      {/* Wolthers Staff */}
      <div>
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            Wolthers Staff
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockStaff.filter(s => s.role === UserRole.WOLTHERS_STAFF).map(staff => (
            <label
              key={staff.id}
              className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={formData.wolthersStaff.some(s => s.id === staff.id)}
                onChange={() => toggleStaff(staff)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {staff.fullName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {staff.email}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Drivers */}
      <div>
        <div className="flex items-center mb-4">
          <UserCheck className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            Drivers
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableDrivers.map(driver => (
            <label
              key={driver.id}
              className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={formData.drivers.some(d => d.id === driver.id)}
                onChange={() => toggleDriver(driver)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {driver.fullName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {driver.role === UserRole.DRIVER ? 'Professional Driver' : 'Staff Member'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Vehicles */}
      <div>
        <div className="flex items-center mb-4">
          <Car className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-md font-medium text-gray-900 dark:text-white">
            Vehicles
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockVehicles.map(vehicle => (
            <label
              key={vehicle.id}
              className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <input
                type="checkbox"
                checked={formData.vehicles.some(v => v.id === vehicle.id)}
                onChange={() => toggleVehicle(vehicle)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {vehicle.licensePlate} • {vehicle.color} • {vehicle.currentMileage.toLocaleString()} km
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}