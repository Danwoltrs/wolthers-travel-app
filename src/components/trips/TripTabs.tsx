'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useDialogs } from '@/hooks/use-modal'

interface Trip {
  id: string
  title: string
  status: 'selected' | 'ongoing' | 'confirmed' | 'unconfirmed' | 'completed'
}

interface TripTabsProps {
  currentTripId: string
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function TripTabs({ currentTripId, activeTab, onTabChange }: TripTabsProps) {
  const { confirm } = useDialogs()
  // Mock trips data - replace with actual API call
  const mockTrips: Trip[] = [
    { id: '1', title: 'Guatemala Origins Tour', status: 'selected' },
    { id: '2', title: 'Colombia Harvest Visit', status: 'ongoing' },
    { id: '3', title: 'Costa Rica Farm Experience', status: 'confirmed' },
    { id: '4', title: 'Ethiopia Coffee Journey', status: 'unconfirmed' },
    { id: '5', title: 'Brazil Plantation Tour', status: 'completed' }
  ]

  const getTabStyles = (status: Trip['status'], isActive: boolean) => {
    const baseStyles = 'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer'
    
    if (isActive) {
      return cn(baseStyles, {
        'bg-emerald-800 text-white': status === 'selected',
        'bg-emerald-600 text-white': status === 'ongoing',
        'bg-orange-500 text-white': status === 'confirmed',
        'bg-gray-500 text-white': status === 'unconfirmed',
        'bg-gray-700 text-white': status === 'completed'
      })
    }

    return cn(baseStyles, {
      'bg-emerald-100 text-emerald-800 hover:bg-emerald-200': status === 'selected',
      'bg-emerald-100 text-emerald-700 hover:bg-emerald-200': status === 'ongoing',
      'bg-orange-100 text-orange-700 hover:bg-orange-200': status === 'confirmed',
      'bg-gray-100 text-gray-700 hover:bg-gray-200': status === 'unconfirmed',
      'bg-gray-100 text-gray-600 hover:bg-gray-200': status === 'completed'
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
    <div className="flex items-center space-x-2">
      {mockTrips.map((trip) => (
        <button
          key={trip.id}
          onClick={() => handleTabClick(trip.id)}
          className={getTabStyles(trip.status, trip.id === activeTab)}
        >
          {trip.title}
        </button>
      ))}
    </div>
  )
}