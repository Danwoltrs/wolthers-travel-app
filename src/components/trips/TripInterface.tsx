'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import WolthersLogo from './WolthersLogo'
import TripSquareButtons from './TripSquareButtons'
import TripHeader from './TripHeader'
import RouteMap from './RouteMap'
import DayItinerary from './DayItinerary'
import CommentsSection from './CommentsSection'
import { mockTripData } from '@/lib/mockData'
import { useDialogs } from '@/hooks/use-modal'
import type { Trip, ItineraryDay } from '@/types'

interface TripInterfaceProps {
  tripId: string
}

export default function TripInterface({ tripId }: TripInterfaceProps) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState(tripId)
  const currentDayRef = useRef<HTMLDivElement>(null)
  const { confirm } = useDialogs()

  // Load trip data
  useEffect(() => {
    // Mock data loading - replace with actual API call
    const loadTripData = async () => {
      try {
        setLoading(true)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const tripData = mockTripData.find(t => t.id === tripId)
        if (tripData) {
          setTrip(tripData.trip)
          setItineraryDays(tripData.itineraryDays)
          
          // Auto-expand current day
          const today = new Date()
          const currentDay = tripData.itineraryDays.find(day => 
            day.date.toDateString() === today.toDateString()
          )
          if (currentDay) {
            setExpandedDays(new Set([currentDay.id]))
          }
        }
      } catch (error) {
        console.error('Failed to load trip data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTripData()
  }, [tripId])

  // Auto-scroll to current day
  useEffect(() => {
    if (!loading && currentDayRef.current) {
      setTimeout(() => {
        currentDayRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 100)
    }
  }, [loading])

  const handleDayToggle = (dayId: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(dayId)) {
        newSet.delete(dayId)
      } else {
        newSet.add(dayId)
      }
      return newSet
    })
  }

  const handleNewTrip = async () => {
    const shouldNavigate = await confirm(
      'Do you want to leave this trip page to create a new trip?',
      'Navigate to New Trip',
      'warning'
    )
    if (shouldNavigate) {
      window.location.href = '/trips/new'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg font-medium text-gray-600">Loading trip...</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg font-medium text-red-600">Trip not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Wolthers Logo Header */}
      <WolthersLogo />

      {/* Trip Square Buttons Navigation */}
      <div className="sticky top-0 z-50">
        <TripSquareButtons 
          currentTripId={tripId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNewTrip={handleNewTrip}
        />
      </div>

      {/* Trip Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Trip Header */}
        <TripHeader trip={trip} />

        {/* Map Section */}
        <div className="mb-8">
          <RouteMap 
            itineraryDays={itineraryDays}
            tripTitle={trip.title}
          />
        </div>

        {/* Itinerary Section */}
        <div className="mb-12">
          <div className="space-y-4">
            {itineraryDays.map((day) => {
              const isToday = day.date.toDateString() === new Date().toDateString()
              return (
                <div
                  key={day.id}
                  ref={isToday ? currentDayRef : undefined}
                >
                  <DayItinerary
                    day={day}
                    isExpanded={expandedDays.has(day.id)}
                    onToggle={() => handleDayToggle(day.id)}
                    isToday={isToday}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Comments Section at Bottom */}
      <div className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <CommentsSection tripId={tripId} />
        </div>
      </div>
    </div>
  )
}