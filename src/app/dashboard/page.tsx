'use client'

import React, { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import TripCard from '@/components/dashboard/TripCard'
import QuickViewModal from '@/components/dashboard/QuickViewModal'
import TripCreationModal from '@/components/trips/TripCreationModal'
import AuthDebug from '@/components/debug/AuthDebug'
import type { TripCard as TripCardType } from '@/types'
import { cn, getTripStatus } from '@/lib/utils'
import { useTrips } from '@/hooks/useTrips'
import { useRequireAuth, useAuth } from '@/contexts/AuthContext'

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth()
  const { user } = useAuth() // Get user data for permission checks
  const [selectedTrip, setSelectedTrip] = useState<TripCardType | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showTripCreationModal, setShowTripCreationModal] = useState(false)
  const [resumeData, setResumeData] = useState<any>(null)
  const [draftTrips, setDraftTrips] = useState<any[]>([])
  const { trips, loading, error, isOffline, refetch } = useTrips()

  // Listen for menu state changes (this would need to be coordinated with Header component)
  // This useEffect must be called unconditionally to maintain hooks order
  React.useEffect(() => {
    const handleMenuToggle = (event: CustomEvent) => {
      setIsMenuOpen(event.detail.isOpen)
    }
    
    window.addEventListener('menuToggle', handleMenuToggle as EventListener)
    return () => window.removeEventListener('menuToggle', handleMenuToggle as EventListener)
  }, [])

  // Load draft trips
  React.useEffect(() => {
    if (isAuthenticated) {
      loadDraftTrips()
    }
  }, [isAuthenticated])

  const loadDraftTrips = async () => {
    try {
      const token = localStorage.getItem('auth-token') || sessionStorage.getItem('supabase-token')
      if (!token) return

      const response = await fetch('/api/trips/drafts', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include' // Include cookies for authentication
      })

      if (response.ok) {
        const data = await response.json()
        setDraftTrips(data.drafts || [])
      }
    } catch (error) {
      console.error('Failed to load draft trips:', error)
    }
  }

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
  
  // Helper function to convert draft to trip-like object
  const convertDraftToTrip = (draft: any) => ({
    id: draft.trip_id || draft.id, // Use trip_id if available, fallback to draft.id
    draftId: draft.id, // Always set the draft ID for deletion
    title: draft.title || 'Untitled Draft Trip',
    subject: draft.description || 'Draft trip in progress',
    client: [],
    guests: [],
    wolthersStaff: [],
    vehicles: [],
    drivers: [],
    startDate: new Date(draft.start_date || new Date().toISOString().split('T')[0]),
    endDate: new Date(draft.end_date || new Date().toISOString().split('T')[0]),
    duration: 1,
    status: 'draft' as any,
    tripType: draft.trip_type || 'unspecified',
    accessCode: draft.access_code,
    isDraft: true,
    currentStep: draft.current_step || 1,
    completionPercentage: draft.completion_percentage || 
      Math.round((draft.current_step || 1) / 5 * 100),
    createdAt: draft.created_at,
    updatedAt: draft.updated_at,
    draftInformation: {
      lastAccessed: draft.last_accessed_at,
      expiresAt: draft.expires_at
    }
  })

  // Convert drafts to trip format
  const draftTripsAsTrips = draftTrips.map(convertDraftToTrip)

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
  
  // Filter for draft trips (planning status with is_draft flag)
  const planningDraftTrips = trips.filter(trip => {
    return (trip as any).status === 'planning' && (trip as any).is_draft !== false
  })
  
  // Combine ongoing, upcoming, draft trips from main query, and additional draft trips
  // Ensure draft trips are always included in current trips
  const currentTrips = [
    ...ongoingTrips, 
    ...upcomingTrips,
    ...planningDraftTrips,
    ...draftTripsAsTrips.filter(draft => !trips.some(trip => trip.id === draft.id))
  ]
  
  const pastTrips = trips.filter(trip => {
    const calculatedStatus = getTripStatus(trip.startDate, trip.endDate)
    // Exclude draft trips from past trips
    const isDraftTrip = (trip as any).status === 'planning' && (trip as any).is_draft !== false
    return calculatedStatus === 'completed' && !isDraftTrip
  })

  const handleTripClick = (trip: TripCardType) => {
    // If it's a draft trip, open trip creation modal to continue
    if ((trip as any).isDraft) {
      const resumeData = {
        tripId: (trip as any).trip_id,
        formData: {
          tripType: (trip as any).tripType,
          title: trip.title,
          description: trip.subject || '',
          startDate: trip.startDate ? new Date(trip.startDate) : null,
          endDate: trip.endDate ? new Date(trip.endDate) : null,
          // Add other form data as needed
        },
        currentStep: (trip as any).currentStep || 1
      }
      setResumeData(resumeData)
      setShowTripCreationModal(true)
    } else {
      // Open quick view modal for regular trips
      setSelectedTrip(trip)
    }
  }

  // Check if user can create trips (Wolthers staff or external company admins)
  const canCreateTrips = React.useMemo(() => {
    if (!user) return false
    
    // Wolthers staff (global admins or company members) can always create trips
    const isWolthersStaff = user.isGlobalAdmin || user.companyId === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
    if (isWolthersStaff) return true
    
    // External company users can create trips only if they are admins
    return user.role === 'admin'
  }, [user])

  const handleCreateTrip = () => {
    setResumeData(null) // Clear any resume data
    setShowTripCreationModal(true)
  }

  const handleContinueTrip = (draftData: any) => {
    setResumeData(draftData)
    setShowTripCreationModal(true)
  }

  const handleTripCreated = (trip: any) => {
    // Refresh trips data to show the newly created trip
    console.log('Trip created:', trip)
    refetch()
  }

  const closeModal = () => {
    setSelectedTrip(null)
    // Refetch trip data to get updated participant information
    refetch()
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
    <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-20 xl:pt-40 pb-8 transition-colors duration-300">
      {/* Fixed Add Trip Button fine-tuned positioning - Only show for authorized users */}
      {canCreateTrips && (
        <div className="fixed left-[calc(50%-400px-160px)] top-[260px] xl:top-[260px] z-30 hidden xl:block">
          <div
            onClick={handleCreateTrip}
            className={cn(
              "bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 hover:scale-105 w-[60px]",
              currentTrips.length > 0 ? "h-[420px]" : "h-[190px]"
            )}
          >
            <Plus className="w-8 h-8 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
          </div>
        </div>
      )}

      {/* Mobile Add Trip Button - fixed position below header but behind modals - Only show for authorized users */}
      {canCreateTrips && (
        <div className="fixed top-[135px] left-[55px] right-[55px] xl:hidden z-20">
          <div
            onClick={handleCreateTrip}
            className="bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 w-full h-[50px]"
          >
            <Plus className="w-6 h-6 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
            <span className="ml-2 text-sm font-medium text-gray-600 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300">Add New Trip</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 xl:pt-0 mt-[90px] xl:mt-0">
        
        {/* Debug info - temporary */}
        <AuthDebug />
        
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
              {canCreateTrips ? (
                <p className="text-sm mt-1">Click the "+" button to create your first trip</p>
              ) : (
                <p className="text-sm mt-1">Your company administrator can request trips that will be reviewed by Wolthers staff</p>
              )}
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