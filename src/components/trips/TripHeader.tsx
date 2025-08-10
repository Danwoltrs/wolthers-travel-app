'use client'

import React from 'react'
import type { Trip } from '@/types'

interface TripHeaderProps {
  trip: Trip
  tripData?: any
}

export default function TripHeader({ trip, tripData }: TripHeaderProps) {
  // Extract real data from tripData or fall back to trip data
  const participants = tripData?.trip_participants || []
  const vehicles = tripData?.trip_vehicles || []
  
  // Process participants to get guests and Wolthers staff
  const guestParticipants = participants.filter((p: any) => 
    p.role === 'client_representative' || 
    p.role === 'participant' || 
    p.role === 'guest'
  )
  
  const wolthersStaff = participants.filter((p: any) => 
    p.role === 'trip_lead' || 
    p.role === 'coordinator' ||
    p.role === 'business_development' ||
    p.role === 'account_manager'
  )
  
  // Extract guest names grouped by company
  const guestsByCompany = guestParticipants.reduce((acc: any, p: any) => {
    const companyName = p.companies?.name || p.companies?.fantasy_name || 'Unknown Company'
    const userName = p.users?.full_name || 'Unknown Guest'
    
    if (!acc[companyName]) {
      acc[companyName] = []
    }
    acc[companyName].push(userName)
    return acc
  }, {})
  
  // Format guest display
  const guestGroups = Object.entries(guestsByCompany).map(([company, names]) => ({
    companyName: company,
    names: names as string[]
  }))
  
  // Extract Wolthers staff names
  const wolthersStaffNames = wolthersStaff.map((p: any) => p.users?.full_name || 'Unknown Staff')
  
  // Extract vehicle and driver information
  const vehicleInfo = vehicles.map((v: any) => {
    const vehicleModel = v.vehicles?.model || 'Unknown Vehicle'
    const licensePlate = v.vehicles?.license_plate || ''
    const driverName = v.users?.full_name || 'Unknown Driver'
    
    // Split model into make and model if possible
    const modelParts = vehicleModel.split(' ')
    const make = modelParts[0] || ''
    const model = modelParts.slice(1).join(' ') || vehicleModel
    
    return {
      make,
      model,
      licensePlate,
      driver: driverName,
      display: licensePlate ? `${vehicleModel} (${licensePlate})` : vehicleModel
    }
  })
  
  // Flatten all guest names for compact display
  const allGuestNames = guestGroups.flatMap(group => group.names)
  const allVehicles = vehicleInfo.map(v => v.display)
  const allDrivers = vehicleInfo.map(v => v.driver)
  
  // Fallback to mock data if no real data available
  const displayGuestNames = allGuestNames.length > 0 ? allGuestNames : ['No guests assigned']
  const displayWolthersStaff = wolthersStaffNames.length > 0 ? wolthersStaffNames : ['No staff assigned']
  const displayVehicles = allVehicles.length > 0 ? allVehicles : ['No vehicles assigned']
  const displayDrivers = allDrivers.length > 0 ? allDrivers : ['No drivers assigned']

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
              {displayGuestNames.join(', ')}
            </span>
          </div>

          {/* Wolthers Staff Row */}
          <div className="flex items-start lg:items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2 mt-0">Wolthers Staff:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {displayWolthersStaff.join(', ')}
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
              {displayVehicles.join(', ')}
            </span>
          </div>

          {/* Drivers Row */}
          <div className="flex items-start lg:items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-2 mt-0">Drivers:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {displayDrivers.join(', ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}