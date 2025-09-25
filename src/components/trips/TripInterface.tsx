'use client'

import React, { useState, useEffect } from 'react'
import { Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import WolthersLogo from './WolthersLogo'
import TripSquareButtons from './TripSquareButtons'
import TripHeader from './TripHeader'
import RouteMap from './RouteMap'
import TripActivities from './TripActivities'
import CommentsSection from './CommentsSection'
import TripNavigationBar from './TripNavigationBar'
import ReceiptScanModal from '../expenses/ReceiptScanModal'
import LoginModal from './LoginModal'
import { useDialogs } from '@/hooks/use-modal'
import { useAuth } from '@/contexts/AuthContext'
import { useTripDetails } from '@/hooks/useTrips'
import { useSingleTripNoteCount } from '@/hooks/useTripNoteCounts'
import type { Trip } from '@/types'

interface TripInterfaceProps {
  tripId: string
  isGuestAccess?: boolean
}

export default function TripInterface({ tripId, isGuestAccess = false }: TripInterfaceProps) {
  const [userTrips, setUserTrips] = useState<Trip[]>([])
  const [activeTab, setActiveTab] = useState(tripId)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mobileMenuHeight, setMobileMenuHeight] = useState(0)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { confirm } = useDialogs()
  const { isAuthenticated, user } = useAuth()
  
  // Use the hook to get trip details from Supabase
  const { trip: tripDetails, loading: tripLoading, error: tripError } = useTripDetails(tripId)
  
  // Get real-time note count for this trip - only when we have the actual trip UUID
  const { noteCount, refreshNoteCount } = useSingleTripNoteCount(tripDetails?.id || '')
  
  // Callback to handle note count changes from activity notes
  const handleActivityNoteCountChange = React.useCallback((activityId: string, newCount: number) => {
    console.log(`Activity ${activityId} note count changed to ${newCount}`)
    // Refresh the total trip note count
    refreshNoteCount()
  }, [refreshNoteCount])

  // Handle authentication flow for trip access
  useEffect(() => {
    // Give auth context time to initialize
    const timer = setTimeout(() => {
      setIsInitialLoad(false)
      
      // If we have an authentication error and we're not authenticated, show auth modal
      if (tripError === 'Authentication required to view trip' && !isAuthenticated) {
        setShowAuthModal(true)
      }
    }, 2000) // 2 second loading grace period

    return () => clearTimeout(timer)
  }, [tripError, isAuthenticated])

  // Close auth modal and reload when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && showAuthModal) {
      setShowAuthModal(false)
      // Reload the page to fetch trip data with authentication
      window.location.reload()
    }
  }, [isAuthenticated, showAuthModal])

  // Load user trips for navigation (simplified to avoid timeouts)
  useEffect(() => {
    const loadUserTrips = async () => {
      try {
        const { supabase } = await import('@/lib/supabase-client')
        
        // Simplified approach - just get a few recent trips to avoid timeout
        const { data: trips, error } = await supabase
          .from('trips')
          .select('id, title, description, start_date, end_date, status, access_code, trip_type, total_cost, creator_id, created_at')
          .eq('status', 'ongoing')
          .order('start_date', { ascending: false })
          .limit(5) // Limit to avoid timeouts
        
        if (trips && !error) {
          const convertedTrips = trips.map(dbTrip => {
            // Parse dates properly to avoid timezone conversion issues
            const parseDate = (dateStr: string) => {
              const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
              return new Date(year, month - 1, day)
            }
            
            return {
              id: dbTrip.id,
              title: dbTrip.title,
              description: dbTrip.description || '',
              subject: dbTrip.description || dbTrip.title,
              startDate: parseDate(dbTrip.start_date),
              endDate: parseDate(dbTrip.end_date),
              status: dbTrip.status,
              createdBy: dbTrip.creator_id,
              estimatedBudget: parseFloat(dbTrip.total_cost) || 0,
              actualCost: parseFloat(dbTrip.total_cost) || 0,
              tripCode: `${dbTrip.trip_type || 'TRIP'}-${dbTrip.id?.slice(0, 8)}`,
              isConvention: dbTrip.trip_type === 'convention',
              metadata: {},
              accessCode: dbTrip.access_code,
              createdAt: new Date(dbTrip.created_at)
            }
          })
          setUserTrips(convertedTrips)
        } else {
          setUserTrips([])
        }
      } catch (error) {
        console.error('Failed to load user trips:', error)
        setUserTrips([])
      }
    }

    // Only load if authenticated to avoid guest access issues
    if (isAuthenticated) {
      loadUserTrips()
    } else {
      setUserTrips([])
    }
  }, [isAuthenticated, tripId])

  // Convert database trip to frontend Trip interface format
  // Create a placeholder trip for authentication errors to show blurred background
  const trip: Trip | null = tripDetails ? (() => {
    // Parse dates properly to avoid timezone conversion issues
    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    
    return {
      id: tripDetails.id,
      title: tripDetails.title,
      description: tripDetails.description,
      subject: tripDetails.description || tripDetails.title,
      startDate: parseDate(tripDetails.start_date),
      endDate: parseDate(tripDetails.end_date),
      status: tripDetails.status,
      createdBy: tripDetails.creator_id,
      estimatedBudget: parseFloat(tripDetails.total_cost) || 0,
      actualCost: parseFloat(tripDetails.total_cost) || 0,
      tripCode: `${tripDetails.trip_type || 'TRIP'}-${tripDetails.id?.slice(0, 8)}`,
      isConvention: tripDetails.trip_type === 'convention',
      metadata: {},
      accessCode: tripDetails.access_code,
      createdAt: new Date(tripDetails.created_at)
    }
  })() : (tripError === 'Authentication required to view trip' ? {
    // Placeholder trip for authentication modal background
    id: tripId,
    title: 'Trip Details',
    description: 'Please sign in to view trip details',
    subject: 'Trip Details',
    startDate: new Date(),
    endDate: new Date(),
    status: 'planning' as any,
    createdBy: '',
    estimatedBudget: 0,
    actualCost: 0,
    tripCode: tripId,
    isConvention: false,
    metadata: {},
    accessCode: tripId,
    createdAt: new Date()
  } : null)

  // Process itinerary items from the database
  const activities = tripDetails?.itinerary_items || []
  
  // Check if there are any locations to show on map
  const hasLocations = activities.some(activity => 
    (activity.company_locations && activity.company_locations.latitude && activity.company_locations.longitude) ||
    activity.custom_location ||
    activity.location
  )

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

  // Show loading screen while fetching trip details or during initial auth check
  if (tripLoading || isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
          <div className="text-lg font-medium text-gray-600 dark:text-gray-300">
            {isInitialLoad ? 'Loading...' : 'Looking for trip...'}
          </div>
        </div>
      </div>
    )
  }

  // Show error screen if there was a non-authentication error fetching the trip
  if (tripError && tripError !== 'Authentication required to view trip') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-6xl">❌</div>
          <div className="text-lg font-medium text-red-600 dark:text-red-400">Error loading trip</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md">{tripError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show trip not found only after loading is complete and no error occurred (but not for auth errors)
  if (!trip && !tripLoading && tripError !== 'Authentication required to view trip') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-6xl">🔍</div>
          <div className="text-lg font-medium text-red-600 dark:text-red-400">Trip not found</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            The trip you're looking for might have been moved or doesn't exist.
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#F3EDE2] dark:bg-[#212121] ${showAuthModal ? 'blur-sm' : ''}`}>
      {/* Wolthers Logo Header */}
      <WolthersLogo 
        onMobileMenuToggle={setIsMobileMenuOpen}
        onMenuHeightChange={setMobileMenuHeight}
        onReceiptScanOpen={() => setIsReceiptModalOpen(true)}
        showReceiptButton={!isGuestAccess} // Show for authenticated users on trip pages
      />
      
      {/* Trip Navigation Bar - Always visible */}
      <TripNavigationBar 
        currentTripId={tripId}
        currentTrip={trip}
        userTrips={userTrips}
        isAuthenticated={isAuthenticated}
        isGuestAccess={isGuestAccess}
        isMobileMenuOpen={isMobileMenuOpen}
        mobileMenuHeight={mobileMenuHeight}
      />

      {/* Trip Square Buttons Navigation - Only show for authenticated users (not guests) and hidden on mobile */}
      {!isGuestAccess && (
        <div className={cn(
          "relative z-20 hidden md:block",
          userTrips.length > 1 ? "mt-12" : "mt-4"
        )}>
          <TripSquareButtons 
            currentTripId={tripId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onNewTrip={handleNewTrip}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}

      {/* Trip Content */}
      <div className={cn(
        "max-w-7xl mx-auto px-0 md:px-4 py-0 md:py-6",
        userTrips.length > 1 && !isGuestAccess && "pt-2"
      )}>
        {/* Trip Header */}
        <div className="mt-4 md:mt-6 px-4 md:px-0">
          <TripHeader trip={trip} tripData={tripDetails} />
        </div>

        {/* Map Section - Only show if there are locations */}
        {hasLocations && (
          <div className="mb-6 px-4 md:px-0">
            <RouteMap 
              itineraryDays={[]}
              tripTitle={trip.title}
              activities={activities}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
            />
          </div>
        )}

        {/* Activities Section - Full width on mobile */}
        <div className="mb-12">
          <TripActivities 
            activities={activities}
            loading={tripLoading}
            error={tripError}
            canEditTrip={!isGuestAccess && trip?.createdBy === user?.id}
            isAdmin={user?.role === 'global_admin'}
            tripStatus={trip?.status}
            tripId={tripId}
            onNoteCountChange={handleActivityNoteCountChange}
          />
        </div>
      </div>

      {/* Comments Section at Bottom */}
      <div className="bg-gradient-to-b from-[#E8DDD0] to-[#F3EDE2] dark:bg-gradient-to-b dark:from-[#1a1a1a] dark:to-[#1a1a1a] border-t border-[#D4C5B0] dark:border-[#2a2a2a] py-8">
        <div className="max-w-7xl mx-auto px-0 md:px-4">
          <CommentsSection 
            tripId={tripId} 
            isAuthenticated={isAuthenticated}
            isGuestAccess={isGuestAccess}
          />
        </div>
      </div>


      {/* Receipt Scan Modal */}
      <ReceiptScanModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        tripId={tripId}
        onExpenseAdded={() => {
          // Could refresh expenses or show success message
          console.log('Expenses added successfully')
        }}
      />

      {/* Authentication Modal */}
      <LoginModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="Please sign in to access this trip"
      />
    </div>
  )
}