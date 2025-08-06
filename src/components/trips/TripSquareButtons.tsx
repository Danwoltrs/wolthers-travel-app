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
  isAuthenticated?: boolean
}

export default function TripSquareButtons({ 
  currentTripId, 
  activeTab, 
  onTabChange, 
  onNewTrip,
  isAuthenticated = false 
}: TripSquareButtonsProps) {
  const { confirm } = useDialogs()
  // Mock trips data - replace with actual API call
  const allTrips: Trip[] = [
    { id: '1', title: 'Guatemala Origins Tour', status: 'selected' },
    { id: '2', title: 'Colombia Harvest Visit', status: 'ongoing' },
    { id: '3', title: 'Costa Rica Farm Experience', status: 'confirmed' },
    { id: '4', title: 'Ethiopia Coffee Journey', status: 'unconfirmed' },
    { id: '5', title: 'Brazil Plantation Tour', status: 'completed' }
  ]

  // Filter trips based on user authentication and access
  const mockTrips = isAuthenticated 
    ? allTrips // Authenticated users see all trips
    : allTrips.filter(trip => trip.id === currentTripId) // Guests only see current trip

  const getButtonStyles = (status: Trip['status'], isActive: boolean) => {
    const baseStyles = 'w-32 h-12 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer flex items-center justify-center text-center border shadow-sm hover:shadow-md truncate'
    
    if (isActive) {
      return cn(baseStyles, {
        'bg-emerald-800 dark:bg-emerald-700 text-white border-emerald-800 dark:border-emerald-700 shadow-lg': status === 'selected',
        'bg-emerald-600 dark:bg-emerald-600 text-white border-emerald-600 shadow-lg': status === 'ongoing',
        'bg-amber-500 dark:bg-amber-600 text-white border-amber-500 dark:border-amber-600 shadow-lg': status === 'confirmed',
        'bg-gray-500 dark:bg-gray-600 text-white border-gray-500 dark:border-gray-600 shadow-lg': status === 'unconfirmed',
        'bg-gray-700 dark:bg-gray-800 text-white border-gray-700 dark:border-gray-800 shadow-lg': status === 'completed'
      })
    }

    return cn(baseStyles, {
      'bg-white dark:bg-[#1a1a1a] text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700/60': status === 'selected',
      'bg-white dark:bg-[#1a1a1a] text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-700/60': status === 'ongoing',
      'bg-white dark:bg-[#1a1a1a] text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:border-amber-200 dark:hover:border-amber-700/60': status === 'confirmed',
      'bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-gray-800/20 hover:border-gray-200 dark:hover:border-gray-600/60': status === 'unconfirmed',
      'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-gray-800/20 hover:border-gray-200 dark:hover:border-gray-600/60': status === 'completed'
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
    <div className="bg-white dark:bg-[#1a1a1a] py-3 border-b border-gray-200 dark:border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
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
            className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-[#111111] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center justify-center transition-colors border border-gray-200 dark:border-[#2a2a2a] hover:border-gray-300 dark:hover:border-gray-600 shadow-sm hover:shadow-md"
            title="Create new trip"
          >
            <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}