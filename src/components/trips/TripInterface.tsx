'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import WolthersLogo from './WolthersLogo'
import TripSquareButtons from './TripSquareButtons'
import TripHeader from './TripHeader'
import RouteMap from './RouteMap'
import DayItinerary from './DayItinerary'
import CommentsSection from './CommentsSection'
import TripNavigationBar from './TripNavigationBar'
import { useDialogs } from '@/hooks/use-modal'
import { useAuth } from '@/contexts/AuthContext'
import type { Trip, ItineraryDay } from '@/types'

interface TripInterfaceProps {
  tripId: string
  isGuestAccess?: boolean
}

export default function TripInterface({ tripId, isGuestAccess = false }: TripInterfaceProps) {
  const [trip, setTrip] = useState<Trip | null>(null)
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([])
  const [userTrips, setUserTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState(tripId)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mobileMenuHeight, setMobileMenuHeight] = useState(0)
  const currentDayRef = useRef<HTMLDivElement>(null)
  const { confirm } = useDialogs()
  const { isAuthenticated } = useAuth()

  // Load user trips for navigation
  useEffect(() => {
    const loadUserTrips = async () => {
      
      // Load trips based on access patterns:
      // 1. Authenticated users: trips they own or participate in
      // 2. Guests: trips they have access codes for (from the same organization/owner)

      try {
        const { supabase } = await import('@/lib/supabase-client')
        
        let trips, error;
        
        if (isAuthenticated) {
          // For authenticated users, get trips they have access to
          const { data: { user: authUser } } = await supabase.auth.getUser()
          
          if (authUser) {
            // Get trips the user has access to - either as creator or participant
            // TODO: This should include trips where the user is a participant/attendee
            // For now, we'll use a broader approach to find trips the user can access
            
            // Method 1: Try to find trips by email in the users table
            const { data: userRecord } = await supabase
              .from('users')
              .select('id')
              .eq('email', authUser.email)
              .single()
            
            let userIdToQuery = authUser.id
            if (userRecord) {
              userIdToQuery = userRecord.id
              console.log('📧 Found user record with ID:', userIdToQuery)
            }
            
            // Method 2: Query trips where user has access
            // For now, this includes trips they created or from the same organization
            // First, try by their user ID
            let result = await supabase
              .from('trips')
              .select('*')
              .eq('creator_id', userIdToQuery)
              .eq('status', 'ongoing')
              .order('start_date', { ascending: true })
            trips = result.data
            error = result.error
            
            // If no trips found, try to get trips they might have access to
            // by checking if they have access to the current trip and getting trips from the same owner
            if (!trips || trips.length === 0) {
              
              // Get the current trip to find its owner
              const { data: currentTripData } = await supabase
                .from('trips')
                .select('creator_id')
                .eq('access_code', tripId)
                .single()
              
              if (currentTripData?.creator_id) {
                console.log('📋 Current trip owner found:', currentTripData.creator_id, 'getting their trips')
                const ownerTripsResult = await supabase
                  .from('trips')
                  .select('*')
                  .eq('creator_id', currentTripData.creator_id)
                  .eq('status', 'ongoing')
                  .order('start_date', { ascending: true })
                trips = ownerTripsResult.data
                error = ownerTripsResult.error
              }
            }
          } else {
            console.log('❌ No authenticated user found')
          }
        } else if (isGuestAccess) {
          // For guests, we need to find trips they might have access to
          // This is more complex as we need to determine what trips a guest can see
          
          
          // Strategy: For now, show trips from the same owner as the current trip
          // TODO: In the future, this could be based on participant lists, shared access, etc.
          
          // First find the current trip and its owner
          const { data: currentTripData } = await supabase
            .from('trips')
            .select('creator_id')
            .eq('access_code', tripId)
            .single()
          
          console.log('📋 Current trip data:', currentTripData)
          
          if (currentTripData?.creator_id) {
            // Get all ongoing/upcoming trips from that owner
            const result = await supabase
              .from('trips')
              .select('*')
              .eq('creator_id', currentTripData.creator_id)
              .eq('status', 'ongoing')
              .order('start_date', { ascending: true })
            trips = result.data
            error = result.error
          }
        }
        
        if (trips && !error) {
          const convertedTrips = trips.map(dbTrip => ({
            id: dbTrip.id,
            title: dbTrip.title,
            description: dbTrip.description,
            subject: dbTrip.subject || dbTrip.title,
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

    loadUserTrips()
  }, [isAuthenticated, isGuestAccess, tripId]) // Re-run when auth status or trip changes

  // Load trip data
  useEffect(() => {
    const loadTripData = async () => {
      try {
        setLoading(true)
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // First, try to find in mock data
        const mockTripData = require('@/lib/mockData').mockTripData
        const tripData = mockTripData.find((t: any) => 
          t.id === tripId || t.trip.accessCode === tripId
        )
        
        if (tripData) {
          setTrip(tripData.trip)
          setItineraryDays(tripData.itineraryDays)
          
          // Auto-expand current day
          const today = new Date()
          const currentDay = tripData.itineraryDays.find((day: any) => 
            day.date.toDateString() === today.toDateString()
          )
          if (currentDay) {
            setExpandedDays(new Set([currentDay.id]))
          }
        } else {
          // If not found in mock data, try to fetch from database
          const { supabase } = await import('@/lib/supabase-client')
          
          let dbTrip: any = null
          let error: any = null
          
          // First, try to get by access code using the guest access function
          try {
            const { data: accessCodeResult, error: accessError } = await supabase
              .rpc('get_trip_by_access_code', { p_access_code: tripId })
            
            if (accessCodeResult && !accessError) {
              dbTrip = accessCodeResult
            } else {
              error = accessError
            }
          } catch (accessCodeError) {
            console.warn('Access code lookup failed:', accessCodeError)
          }
          
          // If not found by access code and user is authenticated, try by ID
          if (!dbTrip && isAuthenticated) {
            try {
              const result = await supabase
                .from('trips')
                .select('*')
                .eq('id', tripId)
                .single()
              
              dbTrip = result.data
              error = result.error
            } catch (idError) {
              error = idError
            }
          }
          
          if (dbTrip && !error) {
            // Convert database trip to Trip interface
            const convertedTrip = {
              id: dbTrip.id,
              title: dbTrip.title,
              description: dbTrip.description,
              subject: dbTrip.subject || dbTrip.title, // fallback to title if no subject
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
            }
            
            setTrip(convertedTrip)
            
            // For now, use empty itinerary since we don't have the database structure set up
            setItineraryDays([])
          } else {
            console.error('Trip not found:', {
              tripId,
              error,
              errorMessage: error?.message,
              errorCode: error?.code,
              errorDetails: error?.details
            })
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-300">Loading trip...</div>
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