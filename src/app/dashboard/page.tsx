'use client'

import React, { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import TripCard from '@/components/dashboard/TripCard'
import QuickViewModal from '@/components/dashboard/QuickViewModal'
import TripCreationModal from '@/components/trips/TripCreationModal'
import DraftTripsSection from '@/components/dashboard/DraftTripsSection'
import AuthDebug from '@/components/debug/AuthDebug'
import type { TripCard as TripCardType } from '@/types'
import { cn, getTripStatus } from '@/lib/utils'
import { useTrips } from '@/hooks/useTrips'
import { useRequireAuth } from '@/contexts/AuthContext'

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth()
  const [selectedTrip, setSelectedTrip] = useState<TripCardType | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showTripCreationModal, setShowTripCreationModal] = useState(false)
  const [resumeData, setResumeData] = useState<any>(null)
  const { trips, loading, error, isOffline } = useTrips()

  // Listen for menu state changes (this would need to be coordinated with Header component)
  // This useEffect must be called unconditionally to maintain hooks order
  React.useEffect(() => {
    const handleMenuToggle = (event: CustomEvent) => {
      setIsMenuOpen(event.detail.isOpen)
    }
    
    window.addEventListener('menuToggle', handleMenuToggle as EventListener)
    return () => window.removeEventListener('menuToggle', handleMenuToggle as EventListener)
  }, [])

  // Show loading while checking authentication
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-40 xl:pt-40 pb-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-golden-600 dark:text-golden-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Separate and sort trips by calculated status (based on current date)
  const ongoingTrips = trips.filter(trip => {
    const calculatedStatus = getTripStatus(trip.startDate, trip.endDate)
    return calculatedStatus === 'ongoing'
  })
  
  const upcomingTrips = trips
    .filter(trip => {
      const calculatedStatus = getTripStatus(trip.startDate, trip.endDate)
      return calculatedStatus === 'upcoming'
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // Sort by closest date first
  
  // Combine ongoing (first) and upcoming (sorted by date) trips
  const currentTrips = [...ongoingTrips, ...upcomingTrips]
  
  const pastTrips = trips.filter(trip => {
    const calculatedStatus = getTripStatus(trip.startDate, trip.endDate)
    return calculatedStatus === 'completed'
  })

  const handleTripClick = (trip: TripCardType) => {
    // Open quick view modal first, then user can choose to view full details
    setSelectedTrip(trip)
  }

  const handleCreateTrip = () => {
    setResumeData(null) // Clear any resume data
    setShowTripCreationModal(true)
  }

  const handleContinueTrip = (draftData: any) => {
    setResumeData(draftData)
    setShowTripCreationModal(true)
  }

  const handleTripCreated = (trip: any) => {
    // Optionally refresh trips data here
    console.log('Trip created:', trip)
    // You might want to call a refresh function from useTrips hook
  }

  const closeModal = () => {
    setSelectedTrip(null)
  }

  // Handle loading and error states within the main render to maintain hooks order
  if (loading) {
    return (
      <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-40 xl:pt-40 pb-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-golden-600 dark:text-golden-400" />
          <p className="text-gray-600 dark:text-gray-400">Loading trips...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-40 xl:pt-40 pb-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Error loading trips</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-40 xl:pt-40 pb-8 transition-colors duration-300">
      {/* Fixed Add Trip Button fine-tuned positioning */}
      <div className="fixed left-[calc(max(2rem,(100vw-80rem)/2)+2rem+30px)] top-[calc(160px+72px+24px+2px)] z-40 hidden xl:block">
        <div
          onClick={handleCreateTrip}
          className="bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 hover:scale-105 w-[60px] h-[420px]"
        >
          <Plus className="w-8 h-8 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
        </div>
      </div>

      {/* Mobile Fixed Add Trip Button */}
      <div className={cn(
        "fixed left-0 right-0 z-50 px-10 sm:px-12 md:px-20 lg:px-20 xl:hidden transition-all duration-300",
        isMenuOpen ? "top-[520px]" : "top-[125px]"
      )}>
        <div
          onClick={handleCreateTrip}
          className="bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 w-full h-[50px]"
        >
          <Plus className="w-6 h-6 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
          <span className="ml-2 text-sm font-medium text-gray-600 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300">Add New Trip</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 xl:pt-0">
        
        {/* Debug info - temporary */}
        <AuthDebug />
        
        {/* Draft Trips Section */}
        <DraftTripsSection onContinueTrip={handleContinueTrip} />
        
        {/* Offline indicator */}
        {isOffline && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You're offline. Showing cached trips from your last sync.
              </p>
            </div>
          </div>
        )}

        {/* Current & Upcoming Trips */}
        <div className="mb-12">
          {/* Section Header with Color-Coded Lane */}
          <div className="section-lane-current mb-6">
            <h2 className="text-xl font-semibold text-golden-800 dark:text-amber-200">
              Current & Upcoming Trips
            </h2>
            <p className="text-sm text-golden-700 dark:text-amber-300 mt-1">
              Active and scheduled travel itineraries
            </p>
          </div>

          {currentTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-x-6 md:gap-y-6 lg:gap-x-6 lg:gap-y-6 xl:gap-8 justify-items-center xl:justify-items-stretch justify-center xl:justify-start place-items-center xl:place-items-stretch md:max-w-3xl lg:max-w-3xl xl:max-w-none md:mx-auto lg:mx-auto xl:mx-0 [&>*:nth-child(odd):last-child]:md:col-span-2 [&>*:nth-child(odd):last-child]:lg:col-span-2 [&>*:nth-child(odd):last-child]:xl:col-span-1 [&>*:nth-child(odd):last-child]:md:justify-self-center [&>*:nth-child(odd):last-child]:lg:justify-self-center [&>*:nth-child(odd):last-child]:xl:justify-self-stretch">
              {currentTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-green-400">
              <p>No current or upcoming trips</p>
              <p className="text-sm mt-1">Click the "+" button to create your first trip</p>
            </div>
          )}
        </div>

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <div>
            {/* Section Header with Color-Coded Lane */}
            <div className="section-lane-past mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-green-200">
                Past Trips
              </h2>
              <p className="text-sm text-gray-600 dark:text-green-400 mt-1">
                Completed travel itineraries and archived trips
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-x-6 md:gap-y-6 lg:gap-x-6 lg:gap-y-6 xl:gap-8 justify-items-center xl:justify-items-stretch justify-center xl:justify-start place-items-center xl:place-items-stretch md:max-w-3xl lg:max-w-3xl xl:max-w-none md:mx-auto lg:mx-auto xl:mx-0 [&>*:nth-child(odd):last-child]:md:col-span-2 [&>*:nth-child(odd):last-child]:lg:col-span-2 [&>*:nth-child(odd):last-child]:xl:col-span-1 [&>*:nth-child(odd):last-child]:md:justify-self-center [&>*:nth-child(odd):last-child]:lg:justify-self-center [&>*:nth-child(odd):last-child]:xl:justify-self-stretch">
              {pastTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip)}
                  isPast={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick View Modal */}
        {selectedTrip && (
          <QuickViewModal
            trip={selectedTrip}
            isOpen={!!selectedTrip}
            onClose={closeModal}
          />
        )}

        {/* Trip Creation Modal */}
        <TripCreationModal
          isOpen={showTripCreationModal}
          onClose={() => {
            setShowTripCreationModal(false)
            setResumeData(null)
          }}
          onTripCreated={handleTripCreated}
          resumeData={resumeData}
        />
      </div>
    </div>
  )
}