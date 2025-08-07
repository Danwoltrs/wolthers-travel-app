'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import WolthersLogo from './WolthersLogo'
import TripSquareButtons from './TripSquareButtons'
import TripHeader from './TripHeader'
import RouteMap from './RouteMap'
import TripActivities from './TripActivities'
import CommentsSection from './CommentsSection'
import TripNavigationBar from './TripNavigationBar'
import { useDialogs } from '@/hooks/use-modal'
import { useAuth } from '@/contexts/AuthContext'
import { useTripDetails } from '@/hooks/useTrips'
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
  const { confirm } = useDialogs()
  const { isAuthenticated, user } = useAuth()
  
  // Use the hook to get trip details from Supabase
  const { trip: tripDetails, loading: tripLoading, error: tripError } = useTripDetails(tripId)

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
          const convertedTrips = trips.map(dbTrip => ({
            id: dbTrip.id,
            title: dbTrip.title,
            description: dbTrip.description || '',
            subject: dbTrip.description || dbTrip.title,
            startDate: new Date(dbTrip.start_date),
            endDate: new Date(dbTrip.end_date),
            status: dbTrip.status,
            createdBy: dbTrip.creator_id,
            estimatedBudget: parseFloat(dbTrip.total_cost) || 0,
            actualCost: parseFloat(dbTrip.total_cost) || 0,
            tripCode: `${dbTrip.trip_type || 'TRIP'}-${dbTrip.id?.slice(0, 8)}`,
            isConvention: dbTrip.trip_type === 'convention',
            metadata: {},
            accessCode: dbTrip.access_code,
            createdAt: new Date(dbTrip.created_at)
          }))
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
  const trip: Trip | null = tripDetails ? {
    id: tripDetails.id,
    title: tripDetails.title,
    description: tripDetails.description,
    subject: tripDetails.description || tripDetails.title,
    startDate: new Date(tripDetails.start_date),
    endDate: new Date(tripDetails.end_date),
    status: tripDetails.status,
    createdBy: tripDetails.creator_id,
    estimatedBudget: parseFloat(tripDetails.total_cost) || 0,
    actualCost: parseFloat(tripDetails.total_cost) || 0,
    tripCode: `${tripDetails.trip_type || 'TRIP'}-${tripDetails.id?.slice(0, 8)}`,
    isConvention: tripDetails.trip_type === 'convention',
    metadata: {},
    accessCode: tripDetails.access_code,
    createdAt: new Date(tripDetails.created_at)
  } : null

  // Process itinerary items from the database
  const activities = tripDetails?.itinerary_items || []
  
  // Check if there are any locations to show on map
  const hasLocations = activities.some(activity => 
    (activity.company_locations && activity.company_locations.latitude && activity.company_locations.longitude) ||
    activity.custom_location
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

  if (tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-300">Loading trip...</div>
      </div>
    )
  }

  if (tripError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="text-lg font-medium text-red-600 dark:text-red-400">Error loading trip: {tripError}</div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="text-lg font-medium text-red-600 dark:text-red-400">Trip not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3EDE2] dark:bg-[#212121]">
      {/* Wolthers Logo Header */}
      <WolthersLogo 
        onMobileMenuToggle={setIsMobileMenuOpen}
        onMenuHeightChange={setMobileMenuHeight}
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
        "max-w-7xl mx-auto px-4 py-6",
        userTrips.length > 1 && !isGuestAccess && "pt-2"
      )}>
        {/* Trip Header */}
        <div className="mt-36 md:mt-6">
          <TripHeader trip={trip} />
        </div>

        {/* Map Section - Only show if there are locations */}
        {hasLocations && (
          <div className="mb-6">
            <RouteMap 
              itineraryDays={[]}
              tripTitle={trip.title}
              activities={activities}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
            />
          </div>
        )}

        {/* Activities Section */}
        <div className="mb-12">
          <TripActivities 
            activities={activities}
            loading={tripLoading}
            error={tripError}
            canEditTrip={!isGuestAccess && trip?.createdBy === user?.id}
            isAdmin={user?.role === 'global_admin'}
            tripStatus={trip?.status}
          />
        </div>
      </div>

      {/* Comments Section at Bottom */}
      <div className="bg-gradient-to-b from-[#E8DDD0] to-[#F3EDE2] dark:bg-gradient-to-b dark:from-[#1a1a1a] dark:to-[#1a1a1a] border-t border-[#D4C5B0] dark:border-[#2a2a2a] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <CommentsSection 
            tripId={tripId} 
            isAuthenticated={isAuthenticated}
            isGuestAccess={isGuestAccess}
          />
        </div>
      </div>
    </div>
  )
}