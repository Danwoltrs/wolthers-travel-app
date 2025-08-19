'use client'

import React, { useState } from 'react'
import { Edit2, Check, X, Key } from 'lucide-react'
import type { Trip } from '@/types'

interface TripHeaderProps {
  trip: Trip
  tripData?: any
}

export default function TripHeader({ trip, tripData }: TripHeaderProps) {
  const [isEditingAccessCode, setIsEditingAccessCode] = useState(false)
  const [newAccessCode, setNewAccessCode] = useState(trip.accessCode || '')
  const [isUpdating, setIsUpdating] = useState(false)
  
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
    p.users && (p.users.user_type === 'wolthers_staff' || p.users.email?.endsWith('@wolthers.com'))
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

  const handleStartEdit = () => {
    setNewAccessCode(trip.accessCode || '')
    setIsEditingAccessCode(true)
  }

  const handleCancelEdit = () => {
    setNewAccessCode(trip.accessCode || '')
    setIsEditingAccessCode(false)
  }

  const handleSaveAccessCode = async () => {
    if (!newAccessCode.trim()) {
      return
    }

    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('supabase-token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/trips/${trip.id}/access-code`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accessCode: newAccessCode.trim() })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update access code')
      }

      // Update the trip object (this would ideally trigger a re-fetch or state update)
      trip.accessCode = newAccessCode.trim()
      setIsEditingAccessCode(false)
      
      // Optionally show success message
      console.log('Access code updated successfully')
    } catch (error) {
      console.error('Failed to update access code:', error)
      // Optionally show error message to user
      alert('Failed to update access code. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm p-4 mb-6 border border-[#D4C5B0] dark:border-[#2a2a2a]">
      {/* Trip Key Code Section */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#D4C5B0] dark:border-gray-600">
        <div className="flex items-center gap-3">
          <Key className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trip Key:</span>
          
          {isEditingAccessCode ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newAccessCode}
                onChange={(e) => setNewAccessCode(e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
                disabled={isUpdating}
              />
              <button
                onClick={handleSaveAccessCode}
                disabled={isUpdating || !newAccessCode.trim()}
                className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded text-gray-800 dark:text-gray-200">
                {trip.accessCode || 'Not set'}
              </span>
              <button
                onClick={handleStartEdit}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Edit trip key"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

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