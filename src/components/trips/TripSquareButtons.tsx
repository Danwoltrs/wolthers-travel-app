'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDialogs } from '@/hooks/use-modal'

interface Trip {
  id: string
  title: string
  status: 'selected' | 'ongoing' | 'confirmed' | 'unconfirmed' | 'completed'
}

interface TripSquareButtonsProps {
  currentTripId: string
  activeTab: string
  onTabChange: (tabId: string) => void
  onNewTrip: () => void
}

export default function TripSquareButtons({ 
  currentTripId, 
  activeTab, 
  onTabChange, 
  onNewTrip 
}: TripSquareButtonsProps) {
  const { confirm } = useDialogs()
  // Mock trips data - replace with actual API call
  const mockTrips: Trip[] = [
    { id: '1', title: 'Guatemala Origins Tour', status: 'selected' },
    { id: '2', title: 'Colombia Harvest Visit', status: 'ongoing' },
    { id: '3', title: 'Costa Rica Farm Experience', status: 'confirmed' },
    { id: '4', title: 'Ethiopia Coffee Journey', status: 'unconfirmed' },
    { id: '5', title: 'Brazil Plantation Tour', status: 'completed' }
  ]

  const getButtonStyles = (status: Trip['status'], isActive: boolean) => {
    const baseStyles = 'w-44 h-20 p-3 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center border shadow-sm hover:shadow-md'
    
    if (isActive) {
      return cn(baseStyles, {
        'bg-emerald-800 text-white border-emerald-800 shadow-lg': status === 'selected',
        'bg-emerald-600 text-white border-emerald-600 shadow-lg': status === 'ongoing',
        'bg-amber-500 text-white border-amber-500 shadow-lg': status === 'confirmed',
        'bg-gray-500 text-white border-gray-500 shadow-lg': status === 'unconfirmed',
        'bg-gray-700 text-white border-gray-700 shadow-lg': status === 'completed'
      })
    }

    return cn(baseStyles, {
      'bg-white text-emerald-800 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200': status === 'selected',
      'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200': status === 'ongoing',
      'bg-white text-amber-700 border-amber-100 hover:bg-amber-50 hover:border-amber-200': status === 'confirmed',
      'bg-white text-gray-700 border-gray-100 hover:bg-gray-50 hover:border-gray-200': status === 'unconfirmed',
      'bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:border-gray-200': status === 'completed'
    })
  }

  const handleTabClick = async (tripId: string) => {
    if (tripId !== currentTripId) {
      const shouldNavigate = await confirm(
        'Do you want to leave this trip page to view another trip?',
        'Switch Trip',
        'warning'
      )
      if (shouldNavigate) {
        window.location.href = `/trips/${tripId}`
      }
    } else {
      onTabChange(tripId)
    }
  }

  return (
    <div className="bg-white py-6 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-4 overflow-x-auto pb-2">
          {mockTrips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => handleTabClick(trip.id)}
              className={getButtonStyles(trip.status, trip.id === activeTab)}
            >
              <div className="truncate max-w-full">
                {trip.title}
              </div>
            </button>
          ))}
          
          {/* Add New Trip Button */}
          <button
            onClick={onNewTrip}
            className="w-20 h-20 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
            title="Create new trip"
          >
            <Plus className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  )
}