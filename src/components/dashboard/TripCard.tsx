import React, { useRef, useState, useMemo } from 'react'
import { Calendar, Users, Car, Clock, MapPin, Mail, TrendingUp, Route, Key, Check, CheckSquare, Trash2, CloudSun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { TripCard as TripCardType } from '@/types'
import { formatDateRange, cn, getTripProgress, getTripStatus, getTripStatusLabel, getTripProgressColor, formatTripDates } from '@/lib/utils'
import { useTripWeather } from '@/hooks/useTripWeather'
import { formatLocationStays } from '@/lib/trip-locations'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import { useDialogs } from '@/hooks/use-modal'
import { useTripActions } from '@/hooks/useSmartTrips'
// Removed framer-motion imports to fix tooltip interference

interface TripCardProps {
  trip: TripCardType
  onClick?: () => void
  isPast?: boolean
}

type VehiclePreview = {
  id: string
  label: string
  licensePlate?: string
}

type DriverPreview = {
  id: string
  fullName: string
  email?: string
}

function formatVehicleLabel(make?: string, model?: string, fallback?: string) {
  const cleanedMake = (make || '').trim()
  const cleanedModel = (model || '').trim()
  if (!cleanedMake && !cleanedModel) {
    return (fallback || '').trim()
  }
  if (!cleanedMake) {
    return cleanedModel || (fallback || '').trim()
  }
  if (!cleanedModel) {
    return cleanedMake
  }
  if (cleanedModel.toLowerCase().startsWith(cleanedMake.toLowerCase())) {
    return cleanedModel
  }
  const combined = `${cleanedMake} ${cleanedModel}`.trim()
  return combined || cleanedModel || cleanedMake
}

function normalizeVehicleRecord(input: any, fallbackId?: string): VehiclePreview | null {
  if (!input) {
    return null
  }

  const make = typeof input.make === 'string' ? input.make : undefined
  const modelSource = typeof input.model === 'string' ? input.model : undefined
  const fallbackName = typeof input.name === 'string' ? input.name : undefined
  const label = formatVehicleLabel(make, modelSource, fallbackName)

  if (!label) {
    return null
  }

  const licensePlate = input.licensePlate || input.license_plate || input.plate || undefined
  const rawId = input.id || input.vehicle_id || fallbackId || licensePlate || label

  return {
    id: String(rawId),
    label,
    licensePlate: licensePlate ? String(licensePlate) : undefined
  }
}

function normalizeDriverRecord(input: any, fallbackId?: string): DriverPreview | null {
  if (!input) {
    return null
  }

  const fullName = input.fullName || input.full_name || input.name || input.displayName || input.driver_name || ''
  if (!fullName) {
    return null
  }

  const email = input.email || input.contact_email || input.driver_email || undefined
  const rawId = input.id || input.driver_id || fallbackId || email || fullName

  return {
    id: String(rawId),
    fullName,
    email: email ? String(email) : undefined
  }
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>()
  const result: T[] = []
  items.forEach((item) => {
    const key = getKey(item)
    if (!key || seen.has(key)) {
      return
    }
    seen.add(key)
    result.push(item)
  })
  return result
}

export default function TripCard({ trip, onClick, isPast = false }: TripCardProps) {
  const ref = useRef(null)
  const router = useRouter()
  const [showCopied, setShowCopied] = useState(false)
  const [copiedPosition, setCopiedPosition] = useState({ x: 0, y: 0 })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { alert } = useDialogs()
  const { updateTripDetails, removeTrip } = useTripActions()
  
  // Check if this is a draft trip (planning status with is_draft flag)
  const isDraft = (trip as any).isDraft || (trip as any).status === 'draft' || (trip as any).isTripDraft || 
                  ((trip as any).status === 'planning' && (trip as any).is_draft !== false)
  
  // Use location data from trip directly for instant display
  const tripLocations = trip.locations || []
  const locationDetails = (trip as any).locationDetails || []
  const hasLocationData = locationDetails.length > 0 || tripLocations.length > 0
  
  // Only fetch weather data for non-draft trips with locations
  const shouldFetchWeather = !isDraft && hasLocationData
  const { locationStays, isLoading: weatherLoading, error: weatherError } = useTripWeather(
    shouldFetchWeather ? trip : { ...trip, id: '', activities: [] }
  )
  
  // Merge weather data into locationDetails from context
  const enrichedLocationDetails = locationDetails.map(location => {
    const weatherData = locationStays.find(stay => stay.city === location.city)
    return {
      ...location,
      weather: weatherData?.weather
    }
  })

  const vehicleAssignments = useMemo<any[]>(() => {
    const sources = [
      (trip as any).tripVehicles,
      (trip as any).trip_vehicles,
      (trip as any).vehicleAssignments,
      (trip as any).logistics?.vehicleAssignments,
      (trip as any).logistics?.vehicles
    ]

    return sources.reduce<any[]>((acc, source) => {
      if (Array.isArray(source)) {
        acc.push(...source)
      }
      return acc
    }, [])
  }, [trip])

  const vehiclesToDisplay = useMemo<VehiclePreview[]>(() => {
    const normalized: VehiclePreview[] = []

    if (Array.isArray(trip.vehicles)) {
      trip.vehicles.forEach((vehicle, index) => {
        const preview = normalizeVehicleRecord(vehicle, vehicle.id || `vehicle-${index}`)
        if (preview) {
          normalized.push(preview)
        }
      })
    }

    vehicleAssignments.forEach((assignment, index) => {
      const source = assignment?.vehicle || assignment?.vehicles || assignment
      const preview = normalizeVehicleRecord(
        source,
        assignment?.vehicle_id ? String(assignment.vehicle_id) : `assignment-${index}`
      )
      if (preview) {
        normalized.push(preview)
      }
    })

    return dedupeByKey(normalized, (vehicle) => `${vehicle.id}|${vehicle.label}|${vehicle.licensePlate || ''}`)
  }, [trip.vehicles, vehicleAssignments])

  const driversToDisplay = useMemo<DriverPreview[]>(() => {
    const normalized: DriverPreview[] = []

    if (Array.isArray(trip.drivers)) {
      trip.drivers.forEach((driver, index) => {
        const preview = normalizeDriverRecord(driver, driver.id || `driver-${index}`)
        if (preview) {
          normalized.push(preview)
        }
      })
    }

    vehicleAssignments.forEach((assignment, index) => {
      const candidateSources = [
        assignment?.driver,
        assignment?.users,
        assignment?.assigned_driver,
        assignment?.driverDetails,
        assignment?.driver_info
      ]

      let preview: DriverPreview | null = null
      for (const source of candidateSources) {
        preview = normalizeDriverRecord(
          source,
          source?.id || assignment?.driver_id || `driver-${index}`
        )
        if (preview) {
          break
        }
      }

      if (!preview && (assignment?.driver_name || assignment?.driver_email)) {
        preview = normalizeDriverRecord(
          {
            id: assignment?.driver_id,
            fullName: assignment?.driver_name,
            email: assignment?.driver_email
          },
          assignment?.driver_id || `driver-${index}`
        )
      }

      if (preview) {
        normalized.push(preview)
      }
    })

    return dedupeByKey(normalized, (driver) => `${driver.id}|${driver.fullName}`)
  }, [trip.drivers, vehicleAssignments])

  // Always calculate progress based on current date for real-time updates
  const progress = isDraft ? (trip as any).completionPercentage || 0 : getTripProgress(trip.startDate, trip.endDate)
  const tripStatus = getTripStatus(trip.startDate, trip.endDate, isDraft)
  const statusLabel = getTripStatusLabel(trip.startDate, trip.endDate, isDraft)
  const progressColor = isDraft ? 'amber' : getTripProgressColor(trip.startDate, trip.endDate)
  const { dateRange, duration } = formatTripDates(trip.startDate, trip.endDate)
  
  // Ensure draft trips always appear in "Current & Upcoming" section without date restrictions

  // Removed 3D tilt effect to fix tooltip interference

  const handleCopyAccessCode = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    if (!trip.accessCode) return
    
    // Capture mouse position
    setCopiedPosition({ x: e.clientX, y: e.clientY })
    
    try {
      await navigator.clipboard.writeText(trip.accessCode)
      // Show copied notification
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 1200) // Hide after 1.2 seconds
      
      console.log('Access code copied:', trip.accessCode)
    } catch (err) {
      console.error('Failed to copy access code:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = trip.accessCode || ''
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // Show copied notification even for fallback
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 1200)
    }
  }

  const handleFinalizeTrip = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    if (!isDraft) return
    
    try {
      // Optimistically update the trip status
      await updateTripDetails(trip.id, { 
        status: 'confirmed',
        isDraft: false
      })
      
      // Send finalize request to server
      const response = await fetch(`/api/trips/${trip.id}/finalize`, {
        method: 'PATCH',
        credentials: 'include'
      })
      
      if (!response.ok) {
        // Rollback the optimistic update if server request fails
        await updateTripDetails(trip.id, { 
          status: trip.status,
          isDraft: isDraft
        })
        
        const error = await response.json()
        await alert(`Failed to finalize trip: ${error.message || 'Unknown error'}`, 'Finalization Failed', 'error')
      }
    } catch (error) {
      console.error('Failed to finalize trip:', error)
      // Rollback optimistic update on error
      await updateTripDetails(trip.id, { 
        status: trip.status,
        isDraft: isDraft
      })
      await alert('Failed to finalize trip. Please try again.', 'Error', 'error')
    }
  }

  const handleDeleteDraft = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    
    if (!isDraft) return
    
    // Show confirmation modal instead of browser confirm
    setShowDeleteConfirm(true)
  }

  const confirmDeleteDraft = async () => {
    try {
      // Optimistically remove the trip from UI immediately
      await removeTrip(trip.id)
      setShowDeleteConfirm(false)
      
      // Check if this has a draft ID or if it's just a planning trip
      const hasDraftId = !!(trip as any).draftId
      
      let response: Response
      if (hasDraftId) {
        // Delete via draft endpoint
        const draftId = (trip as any).draftId
        console.log('Deleting draft with ID:', draftId)
        
        const mutationId = crypto.randomUUID()
        response = await fetch(`/api/trips/drafts/${draftId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientMutationId: mutationId })
        })
      } else {
        // Delete the actual trip
        console.log('Deleting trip with ID:', trip.id)
        
        response = await fetch(`/api/trips/${trip.id}/delete`, {
          method: 'DELETE',
          credentials: 'include'
        })
      }
      
      console.log('Delete response status:', response.status)
      
      if (!response.ok) {
        // Rollback: add the trip back to the UI
        const tripToRestore = { ...trip }
        // Note: In a real implementation, we'd need to restore it to the cache
        // For now, we'll show error and let user refresh
        const error = await response.json()
        console.error('Delete error:', error)
        await alert(`Failed to delete: ${error.error || 'Unknown error'}. Please refresh the page.`, 'Delete Failed', 'error')
      } else {
        console.log('Trip deleted successfully from server')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      await alert('Failed to delete. Please refresh the page.', 'Error', 'error')
    }
  }

  
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'rounded-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col w-full max-w-sm xl:max-w-none h-[420px]',
        'shadow-lg hover:shadow-2xl',
        'hover:-translate-y-1 hover:scale-[1.02]',
        isDraft 
          ? 'bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-600/50 shadow-amber-200/50 dark:shadow-amber-900/20 hover:shadow-amber-300/50 dark:hover:shadow-amber-900/40'
          : 'bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] dark:shadow-gray-900/20 dark:hover:shadow-gray-900/40',
        isPast ? 'opacity-80 hover:opacity-100 grayscale hover:grayscale-0' : ''
      )}
    >
        {/* Zone 1: Header - Golden/Amber Background */}
        <div className={cn(
          'px-4 py-3 relative h-14 flex items-center',
          isDraft 
            ? 'bg-amber-400 dark:bg-amber-800'
            : 'bg-golden-400 dark:bg-[#09261d]'
        )}>
          <h3 className={cn(
            'text-lg font-bold leading-tight drop-shadow-sm line-clamp-2 flex-1 pr-6',
            isDraft 
              ? 'text-amber-900 dark:text-amber-100'
              : 'text-white dark:text-golden-400'
          )} title={trip.title}>
            {trip.title}
          </h3>
          {trip.accessCode && (
            <button
              onClick={handleCopyAccessCode}
              className={cn(
                'absolute right-2 transition-colors p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10',
                isDraft
                  ? 'text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-200'
                  : 'text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300'
              )}
              title="Copy trip key"
            >
              <Key className="w-4 h-4" />
            </button>
          )}
        </div>
      
      {/* Zone 2: Progress Bar with Status Text */}
      <div className={cn(
        'h-6 relative overflow-hidden',
        isDraft 
          ? 'bg-amber-700 dark:bg-amber-900'
          : 'bg-emerald-900 dark:bg-[#111111]'
      )}>
        <div 
          className={cn(
            'absolute left-0 top-0 h-full transition-all duration-700 shadow-sm',
            isDraft 
              ? 'bg-amber-500 dark:bg-amber-600'
              : 'bg-emerald-700 dark:bg-[#123d32]'
          )}
          style={{ width: `${progress}%` }}
        />
        
        {/* Status Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white z-10">
            {isDraft ? statusLabel :
             tripStatus === 'ongoing' ? 'ONGOING' : 
             tripStatus === 'upcoming' ? statusLabel : 
             'COMPLETED'}
          </span>
        </div>
        
        {tripStatus === 'ongoing' && !isDraft && (
          <div className="absolute right-2 top-0 h-full flex items-center">
            <TrendingUp className="w-2 h-2 text-white z-10" />
          </div>
        )}
      </div>
      
      {/* Zone 3: Date and Client Section */}
      <div className={cn(
        'px-6 py-3 border-b h-16 flex flex-col justify-center',
        isDraft 
          ? 'bg-amber-25 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
          : 'bg-white dark:bg-[#1a1a1a] border-pearl-200 dark:border-[#2a2a2a]'
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className={cn(
            'flex items-center text-xs font-medium',
            isDraft 
              ? 'text-amber-900 dark:text-amber-200'
              : 'text-gray-900 dark:text-gray-200'
          )}>
            <Calendar className={cn(
              'w-3 h-3 mr-2 flex-shrink-0',
              isDraft 
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-golden-500 dark:text-[#0E3D2F]'
            )} />
            {dateRange}
          </div>
          <span className={cn(
            'text-xs font-medium',
            isDraft 
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-gray-500 dark:text-gray-400'
          )}>{duration}</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          {isDraft ? (
            <span className={cn(
              'text-sm font-medium',
              isDraft 
                ? 'text-amber-800 dark:text-amber-300'
                : 'text-gray-900 dark:text-gray-200'
            )}>
              {(trip as any).tripType ? (trip as any).tripType.replace('_', ' ').toUpperCase() + ' Trip' : 'New Trip'}
            </span>
          ) : (
            trip.client?.map((company, index) => (
              <span key={company.id} className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {company.fantasyName || company.name}
                {index < trip.client.length - 1 && <span className="text-gray-600 dark:text-gray-400">,</span>}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Zone 4: Location & Weather Information - White Background */}
      <div className={cn(
        'px-6 py-3 border-b h-32 flex flex-col justify-start',
        isDraft 
          ? 'bg-amber-25 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
          : 'bg-white dark:bg-[#1a1a1a] border-pearl-100 dark:border-[#2a2a2a]'
      )}>
        {isDraft ? (
          // For draft trips, show trip type or placeholder
          <div className="space-y-2">
            <div className="flex items-center">
              <MapPin className={cn(
                'w-4 h-4 mr-2 flex-shrink-0',
                'text-amber-600 dark:text-amber-400'
              )} />
              <span className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Locations & Weather
              </span>
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-400 italic">
              Complete trip creation to see location details
            </div>
          </div>
        ) : (
          // For regular trips, show location and weather data
          <div className="space-y-1 overflow-hidden">
              {!hasLocationData ? (
                <div className="text-xs text-pearl-600 dark:text-gray-400 italic">
                  No meetings scheduled
                </div>
              ) : enrichedLocationDetails.length > 0 ? (
                // Show location details in format: "City: X nights Y°C icon" (show up to 6 lines with better wrapping)
                enrichedLocationDetails.slice(0, 6).map((location: any, index: number) => (
                  <div key={index} className="text-xs text-pearl-600 dark:text-gray-400 break-words">
                    <span className="font-medium">{location.city}</span>
                    <span>: {location.nights} night{location.nights !== 1 ? 's' : ''}</span>
                    {location.weather && (
                      <span> {location.weather.temperature}°C {location.weather.icon}</span>
                    )}
                  </div>
                ))
              ) : weatherLoading && shouldFetchWeather ? (
                <div className="text-xs text-pearl-600 dark:text-gray-400">
                  {tripLocations.slice(0, 2).map((city, index) => (
                    <div key={index} className="truncate">
                      {city} • Loading weather...
                    </div>
                  ))}
                </div>
              ) : locationStays.length > 0 ? (
                locationStays.slice(0, 2).map((stay, index) => (
                  <div key={index} className="text-xs text-pearl-600 dark:text-gray-400 truncate">
                    <span className="font-medium">{stay.city}</span>
                    <span className="mx-1">•</span>
                    <span>{stay.nights} night{stay.nights !== 1 ? 's' : ''}</span>
                    {stay.weather && (
                      <>
                        <span className="mx-1">•</span>
                        <span>
                          {stay.weather.temperature}°C
                        </span>
                        <span className="ml-1">{stay.weather.icon}</span>
                      </>
                    )}
                    {stay.weatherError && (
                      <>
                        <span className="mx-1">•</span>
                        <span>weather unavailable</span>
                      </>
                    )}
                  </div>
                ))
              ) : hasLocationData ? (
                // Show locations without weather if weather fetch failed
                tripLocations.slice(0, 2).map((city, index) => (
                  <div key={index} className="text-xs text-pearl-600 dark:text-gray-400 truncate">
                    <span className="font-medium">{city}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-pearl-600 dark:text-gray-400 italic">
                  No meetings scheduled
                </div>
              )}
              {enrichedLocationDetails.length > 6 && (
                <div className="text-xs text-pearl-600 dark:text-gray-400">
                  +{enrichedLocationDetails.length - 6} more locations
                </div>
              )}
          </div>
        )}
      </div>

      {/* Zone 5: Team & Logistics - Very Light Golden Background */}
      <div className="bg-golden-50 dark:bg-[#111111] px-6 py-3 h-[132px] flex flex-col justify-between space-y-2">
        {/* Wolthers Team Section */}
        <div>
          <div className="flex items-center mb-1">
            <Users className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
            <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Wolthers Team Attending</span>
          </div>
          <div className="flex flex-wrap gap-x-2 min-h-[2rem]">
            {trip.wolthersStaff?.length > 0 ? (
              <>
                {trip.wolthersStaff.slice(0, 3).map((staff, index) => (
                  <span key={staff.id} className="text-xs text-pearl-700 dark:text-gray-400">
                    {staff.fullName}
                    {index < Math.min(trip.wolthersStaff.length - 1, 2) && <span className="text-pearl-500 dark:text-gray-500">,</span>}
                  </span>
                ))}
                {trip.wolthersStaff.length > 3 && (
                  <span className="text-xs text-golden-600 dark:text-[#0E3D2F] font-medium">
                    +{trip.wolthersStaff.length - 3} more
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-pearl-500 dark:text-gray-500 italic">No team members assigned</span>
            )}
          </div>
        </div>
        
        {/* Fleet and Driver Section - Show for all trips */}
        <div className="grid grid-cols-2 gap-4">
          {/* Fleet Section */}
          <div>
            <div className="flex items-center mb-1">
              <Car className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
              <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Fleet</span>
            </div>
            <div className="space-y-1">
              {vehiclesToDisplay.length > 0 ? (
                <>
                  {vehiclesToDisplay.slice(0, 3).map((vehicle) => (
                    <div key={vehicle.id} className="text-xs text-pearl-700 dark:text-gray-400 truncate">
                      {vehicle.label}
                    </div>
                  ))}
                  {vehiclesToDisplay.length > 3 && (
                    <div className="text-xs text-golden-600 dark:text-[#0E3D2F] font-medium">
                      +{vehiclesToDisplay.length - 3} more
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-pearl-500 dark:text-gray-500 italic">No vehicles assigned</div>
              )}
            </div>
          </div>
          
          {/* Driver Section */}
          <div>
            <div className="flex items-center mb-1">
              <Users className="w-4 h-4 mr-2 text-golden-500 dark:text-[#0E3D2F] flex-shrink-0" />
              <span className="text-xs font-medium uppercase tracking-wide text-pearl-800 dark:text-gray-300">Driver</span>
            </div>
            <div className="space-y-1">
              {driversToDisplay.length > 0 ? (
                <>
                  {driversToDisplay.slice(0, 3).map((driver) => (
                    <div key={driver.id} className="text-xs text-pearl-700 dark:text-gray-400 truncate">
                      {driver.fullName}
                    </div>
                  ))}
                  {driversToDisplay.length > 3 && (
                    <div className="text-xs text-golden-600 dark:text-[#0E3D2F] font-medium">
                      +{driversToDisplay.length - 3} more
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-pearl-500 dark:text-gray-500 italic">No driver assigned</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zone 6: Footer Actions */}
      <div className={cn(
        'px-6 py-2 rounded-b-lg h-10 flex items-center justify-between',
        isDraft 
          ? 'bg-amber-50 dark:bg-amber-900/20'
          : 'bg-white dark:bg-[#1a1a1a]'
      )}>
        {isDraft ? (
          /* Draft Footer */
          <>
            <span className={cn(
              'text-xs',
              'text-amber-700 dark:text-amber-400'
            )}>
              Step {(trip as any).currentStep || 1} of 5
            </span>
            
            <div className="flex-1 flex justify-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (onClick) {
                    onClick(trip)
                  }
                }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                  'bg-amber-200 hover:bg-amber-300 text-amber-800',
                  'dark:bg-amber-800/30 dark:hover:bg-amber-700/40 dark:text-amber-200'
                )}
              >
                Continue
              </button>
              
              {((trip as any).currentStep || 1) >= 4 && (
                <button
                  onClick={handleFinalizeTrip}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                    'bg-green-200 hover:bg-green-300 text-green-800',
                    'dark:bg-green-800/30 dark:hover:bg-green-700/40 dark:text-green-200'
                  )}
                  title="Finalize trip"
                >
                  <CheckSquare className="w-3 h-3" />
                  Finalize
                </button>
              )}
              
              <button
                onClick={handleDeleteDraft}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                  'bg-red-200 hover:bg-red-300 text-red-800',
                  'dark:bg-red-800/30 dark:hover:bg-red-700/40 dark:text-red-200'
                )}
                title="Delete draft"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            <span className={cn(
              'text-xs',
              'text-amber-600 dark:text-amber-500'
            )}>
              {progress}% Complete
            </span>
          </>
        ) : (
          /* Regular Trip Footer */
          <>
            {/* Key Meetings Count - Left */}
            <span className="text-xs text-pearl-600 dark:text-gray-400">
              {trip.visitCount || 0} meeting{(trip.visitCount || 0) !== 1 ? 's' : ''}
            </span>
            
            {/* Status Indicator - Center */}
            <div className="flex-1 flex justify-center">
              {tripStatus === 'ongoing' && (
                <span className="text-xs text-pearl-600 dark:text-gray-400">
                  {progress}% complete
                </span>
              )}
              {tripStatus === 'upcoming' && (
                <span className="text-xs text-pearl-600 dark:text-gray-400">
                  {statusLabel}
                </span>
              )}
              {tripStatus === 'completed' && (
                <span className="text-xs text-pearl-600 dark:text-gray-400">
                  Completed
                </span>
              )}
            </div>
            
            {/* Actions - Right */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-pearl-500 dark:text-gray-500 hover:text-golden-600 dark:hover:text-[#0E3D2F] transition-colors">
                {trip.notesCount && trip.notesCount > 0 
                  ? `${trip.notesCount} note${trip.notesCount > 1 ? 's' : ''}`
                  : 'No notes'
                }
              </span>
            </div>
          </>
        )}
      </div>

      {/* Copy Notification Overlay */}
      {showCopied && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            left: copiedPosition.x - 50,
            top: copiedPosition.y - 40,
          }}
        >
          <div className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in zoom-in duration-200">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Key copied</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteDraft}
        title="Delete Draft Trip"
        message="Are you sure you want to delete this draft trip? This action cannot be undone and all progress will be lost."
        confirmText="Delete Draft"
        cancelText="Keep Draft"
        variant="danger"
        icon={<Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />}
      />

    </div>
  )
}
