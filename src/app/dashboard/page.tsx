'use client'

import React, { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import TripCard from '@/components/dashboard/TripCard'
import QuickViewModal from '@/components/dashboard/QuickViewModal'
import TripCreationModal from '@/components/trips/TripCreationModal'
import CachePerformanceMonitor from '@/components/debug/CachePerformanceMonitor'
import SystemValidation from '@/components/admin/SystemValidation'
import PasswordChangePrompt from '@/components/auth/PasswordChangePrompt'
import UserPanel from '@/components/user/UserPanel'
import type { TripCard as TripCardType } from '@/types'
import { cn, getTripStatus } from '@/lib/utils'
import { useSmartTrips } from '@/hooks/useSmartTrips'
import { useRequireAuth, useAuth } from '@/contexts/AuthContext'
import { extractCityFromLocation } from '@/lib/geographical-intelligence'
import { useTripNoteCounts } from '@/hooks/useTripNoteCounts'

export default function Dashboard() {
    const { isAuthenticated, isLoading: authLoading } = useRequireAuth()
    const { user } = useAuth() // Get user data for permission checks
    const [selectedTrip, setSelectedTrip] = useState<TripCardType | null>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [showTripCreationModal, setShowTripCreationModal] = useState(false)
  const [resumeData, setResumeData] = useState<any>(null)
  const [draftTrips, setDraftTrips] = useState<any[]>([])
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [showUserPanel, setShowUserPanel] = useState(false)
    const { trips, loading, error, isOffline, refreshSilently, refetch, addTripOptimistically, deleteTripOptimistically } = useSmartTrips()
    
    // Get note counts for all trips - memoize tripIds to prevent infinite re-renders
    const tripIds = React.useMemo(() => trips.map(trip => trip.id), [trips])
    const { noteCounts, refreshNoteCounts } = useTripNoteCounts(tripIds)
    
    // Merge note counts with trip data
    const tripsWithNoteCounts = React.useMemo(() => {
        return trips.map(trip => ({
            ...trip,
            notesCount: noteCounts[trip.id] || 0
        }))
    }, [trips, noteCounts])

    // All useCallback hooks must be defined early and unconditionally
    const handleCreateTrip = React.useCallback(() => {
      setResumeData(null) // Clear any resume data
      setShowTripCreationModal(true)
    }, [])

    // Check if user can create trips (Wolthers staff or external company admins)
    // Must be called before any conditional returns to maintain hook order
    const canCreateTrips = React.useMemo(() => {
      if (!user) return false
      
      // Wolthers staff (global admins or company members) can always create trips
      const isWolthersStaff = user.is_global_admin || user.companyId === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
      if (isWolthersStaff) return true
      
      // External company users: Only buyer admins can request trips (suppliers cannot)
      if (user.user_type === 'admin' && user.company_category === 'buyer') {
        return true
      }
      
      return false
    }, [user])

    // Listen for menu state changes (this would need to be coordinated with Header component)
    // This useEffect must be called unconditionally to maintain hooks order
    React.useEffect(() => {
      const handleMenuToggle = (event: CustomEvent) => {
        setIsMenuOpen(event.detail.isOpen)
      }

      window.addEventListener('menuToggle', handleMenuToggle as EventListener)
      return () => window.removeEventListener('menuToggle', handleMenuToggle as EventListener)
    }, [])

    // Prevent background scrolling when trip overview modal is open
    React.useEffect(() => {
      const html = document.documentElement
      const body = document.body

      if (selectedTrip) {
        // Lock scroll on both the html and body elements
        html.style.overflow = 'hidden'
        body.style.overflow = 'hidden'
      } else {
        // Restore default scrolling
        html.style.overflow = ''
        body.style.overflow = ''
      }
    }, [selectedTrip])

  // Load draft trips
  React.useEffect(() => {
    if (isAuthenticated) {
      loadDraftTrips()
    }
  }, [isAuthenticated])

  // Show password change prompt for OTP login users
  React.useEffect(() => {
    if (user && (user as any).otp_login && isAuthenticated) {
      // Show prompt after a brief delay to allow dashboard to load
      const timer = setTimeout(() => {
        setShowPasswordPrompt(true)
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [user, isAuthenticated])

  // Open trip creation modal when triggered from Header
  React.useEffect(() => {
    const handleOpenTripCreation = () => {
      handleCreateTrip()
    }
    window.addEventListener('openTripCreation', handleOpenTripCreation as EventListener)
    return () => window.removeEventListener('openTripCreation', handleOpenTripCreation as EventListener)
  }, [handleCreateTrip])

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
  const ongoingTrips = tripsWithNoteCounts.filter(trip => {
    const calculatedStatus = getTripStatus(trip.startDate, trip.endDate)
    return calculatedStatus === 'ongoing'
  })
  
  const upcomingTrips = tripsWithNoteCounts
    .filter(trip => {
      const calculatedStatus = getTripStatus(trip.startDate, trip.endDate)
      return calculatedStatus === 'upcoming'
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) // Sort by closest date first
  
  // Filter for draft trips (planning status only - ignore is_draft flag for completed trips)
  const planningDraftTrips = tripsWithNoteCounts.filter(trip => {
    return (trip as any).status === 'planning'
  })
  
  // Combine ongoing, upcoming, draft trips from main query, and additional draft trips
  // Ensure draft trips are always included in current trips
  const allCurrentTrips = [
    ...ongoingTrips, 
    ...upcomingTrips,
    ...planningDraftTrips,
    ...draftTripsAsTrips.filter(draft => !tripsWithNoteCounts.some(trip => trip.id === draft.id))
  ]
  
  // Remove duplicates by ID to prevent duplicate cards
  const currentTrips = allCurrentTrips.filter((trip, index, array) => 
    array.findIndex(t => t.id === trip.id) === index
  )
  
  // Debug logging to help identify duplicate sources
  if (allCurrentTrips.length !== currentTrips.length) {
    console.log('🔍 Duplicate trips detected:')
    console.log('Before deduplication:', allCurrentTrips.length, 'trips')
    console.log('After deduplication:', currentTrips.length, 'trips')
    console.log('ongoingTrips:', ongoingTrips.length)
    console.log('upcomingTrips:', upcomingTrips.length) 
    console.log('planningDraftTrips:', planningDraftTrips.length)
    console.log('draftTripsAsTrips:', draftTripsAsTrips.length)
  }
  
  const pastTrips = tripsWithNoteCounts.filter(trip => {
    const calculatedStatus = getTripStatus(trip.startDate, trip.endDate)
    // Exclude only planning trips from past trips (completed trips should show regardless of is_draft flag)
    const isPlanningTrip = (trip as any).status === 'planning'
    return calculatedStatus === 'completed' && !isPlanningTrip
  })

  const handleTripClick = async (trip: TripCardType) => {
    // If it's a draft trip, open trip creation modal to continue
    if ((trip as any).isDraft || (trip as any).status === 'planning') {
      try {
        console.log('🔄 Loading draft trip data for:', trip.accessCode)
        
        // Get auth token for API call
        const token = localStorage.getItem('auth-token') || sessionStorage.getItem('supabase-token')
        
        // Use the existing continue endpoint to load complete draft data
        const response = await fetch(`/api/trips/continue/${trip.accessCode}`, {
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {},
          credentials: 'include'
        })
        
        if (response.ok) {
          const continueData = await response.json()
          console.log('✅ Draft data loaded:', continueData)
          
          // Use the complete draft data from the API or construct from trip data
          const tripData = continueData.trip || trip
          const draftData = continueData.draft
          
          // Properly construct formData from saved step_data, draft data, or trip data
          let formData = tripData?.step_data || draftData?.draft_data
          
          // If we have saved step_data, ensure dates are properly converted to Date objects
          if (formData && (formData.startDate || formData.endDate)) {
            formData = {
              ...formData,
              startDate: formData.startDate ? new Date(formData.startDate) : null,
              endDate: formData.endDate ? new Date(formData.endDate) : null
            }
          }
          
          // Fallback construction if no saved data available
          if (!formData) {
            formData = {
            tripType: draftData?.trip_type || tripData?.trip_type || trip.tripType,
            title: draftData?.title || tripData?.title || trip.title,
            description: draftData?.description || tripData?.description || trip.subject || '',
            subject: draftData?.subject || tripData?.subject || '',
            startDate: draftData?.startDate ? new Date(draftData.startDate) : 
                      tripData?.start_date ? new Date(tripData.start_date) :
                      trip.startDate ? new Date(trip.startDate) : null,
            endDate: draftData?.endDate ? new Date(draftData.endDate) :
                    tripData?.end_date ? new Date(tripData.end_date) :
                    trip.endDate ? new Date(trip.endDate) : null,
            accessCode: tripData?.access_code || trip.accessCode,
            companies: draftData?.companies || [],
            participants: draftData?.participants || [],
            wolthersStaff: draftData?.wolthersStaff || [],
            vehicles: draftData?.vehicles || [],
            itineraryDays: draftData?.itineraryDays || [],
            activities: draftData?.activities || []
            }
          }
          
          console.log('🔄 Resume data construction:', {
            hasStepData: !!tripData?.step_data,
            hasDraftData: !!draftData?.draft_data,
            formDataKeys: formData ? Object.keys(formData) : [],
            tripType: formData?.tripType,
            title: formData?.title,
            companiesCount: formData?.companies?.length || 0,
            participantsCount: formData?.participants?.length || 0
          })
          
          const resumeData = {
            tripId: continueData.trip?.id || trip.id,
            accessCode: trip.accessCode,
            formData: formData,
            currentStep: continueData.currentStep || 1,
            canEdit: continueData.canEdit
          }
          
          setResumeData(resumeData)
          setShowTripCreationModal(true)
        } else {
          console.warn('Failed to load draft data, using basic resume:', response.status)
          
          // Fallback to basic resume data constructed from trip card data
          const resumeData = {
            tripId: trip.id,
            accessCode: trip.accessCode,
            formData: {
              tripType: (trip as any).tripType || 'in_land',
              title: trip.title || '',
              description: trip.subject || '',
              subject: trip.subject || '',
              startDate: trip.startDate ? new Date(trip.startDate) : null,
              endDate: trip.endDate ? new Date(trip.endDate) : null,
              accessCode: trip.accessCode,
              companies: [],
              participants: [],
              wolthersStaff: [],
              vehicles: [],
              itineraryDays: [],
              activities: []
            },
            currentStep: (trip as any).currentStep || 1
          }
          
          setResumeData(resumeData)
          setShowTripCreationModal(true)
        }
      } catch (error) {
        console.error('Error loading draft trip:', error)
        
        // Fallback to basic resume data on error
        const resumeData = {
          tripId: trip.id,
          accessCode: trip.accessCode,
          formData: {
            tripType: (trip as any).tripType || 'in_land',
            title: trip.title || '',
            description: trip.subject || '',
            subject: trip.subject || '',
            startDate: trip.startDate ? new Date(trip.startDate) : null,
            endDate: trip.endDate ? new Date(trip.endDate) : null,
            accessCode: trip.accessCode,
            companies: [],
            participants: [],
            wolthersStaff: [],
            vehicles: [],
            itineraryDays: [],
            activities: []
          },
          currentStep: (trip as any).currentStep || 1
        }
        
        setResumeData(resumeData)
        setShowTripCreationModal(true)
      }
    } else {
      // Open quick view modal for regular trips
      setSelectedTrip(trip)
    }
  }



  const handleContinueTrip = (draftData: any) => {
    setResumeData(draftData)
    setShowTripCreationModal(true)
  }

  const handleTripUpdate = async (tripId: string, updates: any) => {
    console.log('📝 [Dashboard] Updating trip:', tripId, updates)
    
    try {
      // Call the progressive-save endpoint
      const response = await fetch('/api/trips/progressive-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tripId,
          stepNumber: 3, // TeamVehicle step for logistics
          stepData: {
            vehicles: updates.vehicles || [],
            drivers: updates.drivers || [],
            hotels: updates.hotels || [],
            equipment: updates.equipment || []
          },
          isComplete: true
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [Dashboard] Trip updated successfully:', result)
      
      // Refresh trips to show updated data
      await loadTrips()
      
      return result
    } catch (error) {
      console.error('❌ [Dashboard] Error updating trip:', error)
      throw error
    }
  }

  const handleTripCreated = async (trip: any) => {
    console.log('🎉 [Dashboard] Trip created callback triggered with data:', trip)
    
    // Close the modal first
    setShowTripCreationModal(false)
    setResumeData(null)
    console.log('✅ [Dashboard] Modal closed and resume data cleared')
    
    const toDate = (value: any) => {
      if (!value) return new Date()
      if (value instanceof Date) return value
      const parsed = new Date(value)
      return isNaN(parsed.getTime()) ? new Date() : parsed
    }

    const startDate = toDate(trip.startDate || (trip as any).start_date)
    const endDate = toDate(trip.endDate || (trip as any).end_date)

    const wolthersStaff = (trip.participants || []).map((participant: any) => ({
      id: participant.id,
      fullName: participant.full_name || participant.fullName || participant.name || participant.email,
      email: participant.email
    }))

    const guestCompanies = (trip.companies || []).filter((company: any) => !(company.isHost || company.role === 'host'))

    const clientCompanies = guestCompanies.map((company: any) => ({
      id: String(company.id || company.company_id || company.name || crypto.randomUUID()),
      name: company.name || company.fantasy_name || 'Guest Company',
      fantasyName: company.fantasy_name || company.name
    }))

    const guestSummaries = guestCompanies.map((company: any) => ({
      companyId: String(company.id || company.company_id || company.name || crypto.randomUUID()),
      names: (company.selectedContacts || company.participants || []).map((contact: any) => (
        contact.name || contact.full_name || contact.fullName || contact.email
      )).filter(Boolean)
    }))

    const vehicleAssignments = (trip.vehicleAssignments || []).filter((assignment: any) => assignment?.vehicle || assignment?.driver)

    const normalizedVehicles: Array<{ id: string; make: string; model: string; licensePlate?: string }> = []
    const vehiclesFromAssignments = vehicleAssignments.map((assignment: any) => assignment.vehicle).filter(Boolean)
    const vehiclesFromState = (trip.vehicles || []).filter(Boolean)
    const vehicleCandidates = [...vehiclesFromAssignments, ...vehiclesFromState]

    vehicleCandidates.forEach((vehicle: any) => {
      if (!vehicle) return
      const vehicleId = vehicle.id || vehicle.vehicle_id || vehicle.license_plate || vehicle.licensePlate || `vehicle-${crypto.randomUUID()}`
      if (normalizedVehicles.some(v => v.id === vehicleId)) return
      const modelText = vehicle.model || vehicle.name || ''
      const makeText = vehicle.make || (modelText.includes(' ') ? modelText.split(' ')[0] : modelText) || 'Vehicle'

      normalizedVehicles.push({
        id: vehicleId,
        make: makeText,
        model: modelText || makeText,
        licensePlate: vehicle.license_plate || vehicle.licensePlate || vehicle.plate || undefined
      })
    })

    const normalizedDrivers: Array<{ id: string; fullName: string; email?: string }> = []
    const driverCandidates = [
      ...vehicleAssignments.map((assignment: any) => assignment.driver).filter(Boolean),
      ...(trip.drivers || []).filter(Boolean)
    ]

    driverCandidates.forEach((driver: any) => {
      if (!driver) return
      const driverId = driver.id || driver.user_id || driver.email || `driver-${crypto.randomUUID()}`
      if (normalizedDrivers.some(d => d.id === driverId)) return
      normalizedDrivers.push({
        id: driverId,
        fullName: driver.full_name || driver.fullName || driver.name || driver.email || 'Driver',
        email: driver.email || undefined
      })
    })

    const rawActivities = (trip.generatedActivities || (trip as any).generated_activities || trip.activities || []) as any[]
    const meetingActivities = rawActivities.filter((activity: any) => {
      if (!activity) return false
      const type = (activity.type || activity.activity_type || '').toLowerCase()
      const title = (activity.title || '').toLowerCase()
      if (!activity.location) return false

      const travelKeywords = ['drive', 'return', 'flight', 'travel', 'transport', 'transfer', 'journey']
      if (travelKeywords.some(keyword => title.includes(keyword))) {
        return false
      }

      const validTypes = ['meeting', 'visit', 'company_visit', 'facility_tour', 'event']
      return validTypes.includes(type) || title.includes('visit') || title.includes('meeting')
    })

    const visitCount = meetingActivities.length

    const cityMap = new Map<string, { meetings: number; companies: Set<string> }>()
    meetingActivities.forEach((activity: any) => {
      const cityInfo = activity.location ? extractCityFromLocation(activity.location) : null
      const cityKey = cityInfo?.city || activity.location
      if (!cityKey) return
      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, { meetings: 0, companies: new Set<string>() })
      }
      const entry = cityMap.get(cityKey)!
      entry.meetings += 1
      if (activity.company_name) {
        entry.companies.add(activity.company_name)
      }
    })

    const locations = Array.from(cityMap.keys())
    const locationDetails = Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      nights: 1,
      meetings: data.meetings,
      companies: Array.from(data.companies)
    }))

    const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    const tripCard: TripCardType = {
      id: trip.id,
      title: trip.title || 'New Trip',
      subject: trip.subject || trip.description || '',
      client: clientCompanies as any,
      guests: guestSummaries as any,
      wolthersStaff: wolthersStaff as any,
      vehicles: normalizedVehicles as any,
      drivers: normalizedDrivers as any,
      startDate,
      endDate,
      duration,
      status: 'confirmed' as any,
      accessCode: trip.accessCode || trip.access_code,
      isDraft: false,
      progress: 100,
      notesCount: 0,
      visitCount,
      locations,
      locationDetails,
      activities: meetingActivities,
      allActivities: rawActivities
    }

    try {
      console.log('🚀 [Dashboard] Using optimistic update to add trip to cache')
      console.log('📦 [Dashboard] Trip card data:', tripCard)
      
      // Use optimistic update to immediately add the trip to the cache
      // This provides instant UI feedback without waiting for network requests
      if (addTripOptimistically) {
        await addTripOptimistically(tripCard)
        console.log('✅ [Dashboard] Trip added optimistically to cache')
        
        // Also refresh silently in the background to ensure data consistency
        setTimeout(async () => {
          try {
            console.log('🔄 [Dashboard] Background refresh to ensure consistency...')
            await refreshSilently()
            console.log('✅ [Dashboard] Background refresh successful')
          } catch (backgroundError) {
            console.warn('⚠️ [Dashboard] Background refresh failed, but optimistic update succeeded:', backgroundError)
          }
        }, 1000)
      } else {
        // Fallback to traditional refresh if optimistic updates unavailable
        console.warn('⚠️ [Dashboard] Optimistic updates not available, falling back to refresh')
        await refreshSilently()
      }
      
    } catch (error) {
      console.error('❌ [Dashboard] Trip creation handling failed:', error)
      
      // Fallback to force refresh if everything else fails
      try {
        console.log('🔄 [Dashboard] Falling back to force refresh...')
        await refetch()
        console.log('✅ [Dashboard] Force refresh successful')
      } catch (forceError) {
        console.error('💥 [Dashboard] All refresh attempts failed:', forceError)
        
        // Only use hard refresh as absolute last resort
        console.log('🔄 [Dashboard] Falling back to hard refresh in 2 seconds...')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    }
  }

  const closeModal = () => {
    setSelectedTrip(null)
    // Refresh trip data silently to get updated participant information
    // Add delay to avoid sync conflicts
    setTimeout(() => {
      refreshSilently()
      // Also refresh note counts to get latest notes
      refreshNoteCounts()
    }, 100)
  }

  const handlePasswordPromptClose = () => {
    setShowPasswordPrompt(false)
  }

  const handleOpenUserPanel = () => {
    setShowPasswordPrompt(false)
    setShowUserPanel(true)
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
    <div className="min-h-screen bg-beige-100 dark:bg-[#212121] pt-12 xl:pt-40 pb-8 transition-colors duration-300">
      {/* Desktop Add Trip Button fine-tuned positioning - Only show for authorized users */}
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 xl:pt-0 mt-[60px] xl:mt-0">
        
        {/* Debug info - temporary */}
        
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
            <div className="xl:block">
              {/* Mobile layout - button and cards on same line */}
              <div className="flex xl:hidden justify-center items-start">
                {/* Mobile Add Trip Button - positioned 20px left of centered trip cards */}
                {canCreateTrips && (
                  <div className="flex-shrink-0 mr-5">
                    <div
                      onClick={handleCreateTrip}
                      className="bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 hover:scale-105 w-[40px] h-[420px]"
                    >
                      <Plus className="w-6 h-6 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
                    </div>
                  </div>
                )}
                
                {/* Trip cards container - centered */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-x-6 md:gap-y-6 lg:gap-x-6 lg:gap-y-6 justify-items-center md:max-w-3xl lg:max-w-3xl">
                  {currentTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onClick={() => handleTripClick(trip)}
                    />
                  ))}
                </div>
              </div>
              
              {/* Desktop layout - original grid */}
              <div className="hidden xl:grid grid-cols-3 gap-8 justify-items-stretch">
                {currentTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onClick={() => handleTripClick(trip)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="xl:flex xl:justify-center">
              {/* Mobile layout - button and message on same line */}
              <div className="flex xl:hidden justify-center items-start">
                {/* Mobile Add Trip Button when no trips exist - positioned 20px left of centered message */}
                {canCreateTrips && (
                  <div className="flex-shrink-0 mr-5">
                    <div
                      onClick={handleCreateTrip}
                      className="bg-white dark:bg-[#123d32] rounded-lg shadow-lg hover:shadow-xl border-2 border-dashed border-gray-300 dark:border-[#123d32] hover:border-golden-400 dark:hover:border-golden-400 hover:bg-golden-50 dark:hover:bg-[#0E3D2F] transition-all duration-300 cursor-pointer flex items-center justify-center group transform hover:-translate-y-1 hover:scale-105 w-[40px] h-[190px]"
                    >
                      <Plus className="w-6 h-6 text-gray-400 dark:text-golden-400 group-hover:text-golden-600 dark:group-hover:text-golden-300 transition-colors" />
                    </div>
                  </div>
                )}
                
                <div className="text-center py-12 text-gray-500 dark:text-green-400">
                  <p>No current or upcoming trips</p>
                  {canCreateTrips ? (
                    <p className="text-sm mt-1">Click the "+" button to create your first trip</p>
                  ) : (
                    <p className="text-sm mt-1">Your company administrator can request trips that will be reviewed by Wolthers staff</p>
                  )}
                </div>
              </div>
              
              {/* Desktop layout - centered message */}
              <div className="hidden xl:block text-center py-12 text-gray-500 dark:text-green-400">
                <p>No current or upcoming trips</p>
                {canCreateTrips ? (
                  <p className="text-sm mt-1">Click the "+" button to create your first trip</p>
                ) : (
                  <p className="text-sm mt-1">Your company administrator can request trips that will be reviewed by Wolthers staff</p>
                )}
              </div>
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
            onSave={(updates) => handleTripUpdate(selectedTrip.id, updates)}
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

        {/* Password Change Prompt */}
        <PasswordChangePrompt
          isOpen={showPasswordPrompt}
          onClose={handlePasswordPromptClose}
          onOpenUserPanel={handleOpenUserPanel}
          userName={user?.name}
        />

        {/* User Panel */}
        <UserPanel
          isOpen={showUserPanel}
          onClose={() => setShowUserPanel(false)}
          focusPasswordChange={(user as any)?.otp_login}
        />

        {/* Development Tools */}
        <CachePerformanceMonitor />
        <SystemValidation />
      </div>
    </div>
  )
}