'use client'

import React from 'react'
import type { Trip } from '@/types'

interface TripHeaderProps {
  trip: Trip
}

export default function TripHeader({ trip }: TripHeaderProps) {
  // Mock data for guests and vehicles - replace with actual data
  const mockGuests = [
    { companyId: '1', companyName: 'Acme Coffee Co.', names: ['John Smith', 'Sarah Johnson'] },
    { companyId: '2', companyName: 'Bean & Beyond', names: ['Mike Wilson', 'Lisa Chen'] }
  ]

  const mockWolthersStaff = ['Erik Wolthers', 'Anna Møller']

  const mockVehicles = [
    { id: '1', make: 'Toyota', model: 'Land Cruiser', licensePlate: 'ABC-123', driver: 'Carlos Rodriguez' },
    { id: '2', make: 'Ford', model: 'Transit', licensePlate: 'XYZ-789', driver: 'Maria Santos' }
  ]

  // Flatten all guest names for compact display
  const allGuestNames = mockGuests.flatMap(group => group.names)
  const allVehicles = mockVehicles.map(vehicle => `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`)
  const allDrivers = mockVehicles.map(vehicle => vehicle.driver)

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm p-4 mb-6 border border-[#D4C5B0] dark:border-[#2a2a2a]">
      {/* Enhanced Description */}
      {trip.description && (
        <>
          <p className="text-gray-800 dark:text-gray-200 text-base font-medium leading-relaxed mb-4">{trip.description}</p>
          <hr className="border-[#D4C5B0] dark:border-gray-600 mb-4" />
        </>
      )}

      {/* Two Column Layout with Separator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm relative">
        {/* Left Side - People */}
        <div className="space-y-2">
          {/* Guests Row */}
          <div className="flex items-start lg:items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2 mt-0">Guests:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {allGuestNames.join(', ')}
            </span>
          </div>

          {/* Wolthers Staff Row */}
          <div className="flex items-start lg:items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2 mt-0">Wolthers Staff:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {mockWolthersStaff.join(', ')}
            </span>
          </div>
        </div>

        {/* Vertical Separator Line - Hidden on mobile */}
        <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-[#D4C5B0] dark:bg-gray-600 transform -translate-x-1/2"></div>

        {/* Right Side - Vehicles & Drivers */}
        <div className="space-y-2">
          {/* Vehicles Row */}
          <div className="flex items-start lg:items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2 mt-0">Vehicles:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {allVehicles.join(', ')}
            </span>
          </div>

          {/* Drivers Row */}
          <div className="flex items-start lg:items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2 mt-0">Drivers:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {allDrivers.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}