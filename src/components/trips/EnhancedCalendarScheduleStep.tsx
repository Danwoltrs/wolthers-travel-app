import React, { useState, useEffect, useMemo } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Clock, MapPin, Wand2, Loader2, Plus, AlertCircle, Navigation, X } from 'lucide-react'
import { OutlookCalendar } from '@/components/dashboard/OutlookCalendar'
import { useActivityManager, type Activity, type ActivityFormData } from '@/hooks/useActivityManager'
import type { TripCard } from '@/types'
import ActivitySplitModal from './ActivitySplitModal'
import { loadGoogleMapsAPI, geocodeLocation, optimizeRoute, calculateTravelTime, formatDuration, type Location } from '@/lib/google-maps-utils'
import { detectLocationFromAddress, getRegionByCity, calculateTravelTime as calculateLocalTravelTime, areCitiesInSameRegion, isSantosArea, isVarginhaArea, getOptimalMeetingDuration, getMaxMeetingsPerDay, extractCityFromAddress, areCompaniesInSameCity, getStartingPointStrategy, optimizeCompanyOrderByStartingPoint } from '@/lib/brazilian-locations'

interface CalendarScheduleStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

export default function CalendarScheduleStep({ formData, updateFormData }: CalendarScheduleStepProps) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [splitModalActivity, setSplitModalActivity] = useState<Activity | null>(null)

  // Get host companies and participants for activity assignment
  const hostCompanies = formData.hostCompanies || []
  const participants = formData.participants || []
  const buyerCompanies = formData.companies || []

  // Debug logging for AI generation
  console.log('📋 [Calendar Debug] Form data for AI generation:', {
    hostCompaniesCount: hostCompanies.length,
    hostCompanies: hostCompanies.map(hc => hc.name),
    hasStartDate: !!formData.startDate,
    hasEndDate: !!formData.endDate,
    hasGeneratedInitial
  })

  // Convert formData to TripCard format expected by OutlookCalendar
  const mockTrip: TripCard = useMemo(() => {
    const startDate = formData.startDate || new Date()
    const endDate = formData.endDate || new Date()
    
    return {
      id: 'temp-trip-' + Date.now(),
      title: formData.title || 'New Trip',
      description: formData.description || '',
      startDate: startDate, // Keep as Date object for OutlookCalendar
      endDate: endDate, // Keep as Date object for OutlookCalendar
      status: 'planning' as const,
      progress: 0,
      daysRemaining: Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      accessCode: formData.accessCode || 'TEMP-CODE',
      companies: formData.companies || [],
      staff: formData.participants || [],
      hotels: [],
      flights: []
    }
  }, [formData])

  // Initialize activity manager for this temporary trip
  const activityManager = useActivityManager(mockTrip.id)
  
  // For temp trips, use generatedActivities from formData instead of database activities
  const tempActivities = formData.generatedActivities || []
  const activities = mockTrip.id.startsWith('temp-trip-') ? tempActivities : activityManager.activities
  const loading = mockTrip.id.startsWith('temp-trip-') ? false : activityManager.loading
  const error = mockTrip.id.startsWith('temp-trip-') ? null : activityManager.error
  const refreshing = mockTrip.id.startsWith('temp-trip-') ? isGeneratingAI : activityManager.refreshing
  
  // Create a custom stats function for temp activities or use the manager's stats
  const getActivityStats = () => {
    if (mockTrip.id.startsWith('temp-trip-')) {
      // For temp trips, calculate stats from tempActivities
      const meetingActivities = tempActivities.filter(a => {
        const title = (a.title || '').toLowerCase()
        const description = (a.description || '').toLowerCase()
        
        // Exclude flights, travel, accommodation from meetings
        const travelKeywords = [
          'flight', 'fly', 'plane', 'airplane', 'aircraft', 'airline', 
          'departure', 'arrival', 'takeoff', 'landing', 'airport',
          'drive', 'driving', 'car', 'taxi', 'uber', 'transfer',
          'check-in', 'check-out', 'hotel', 'accommodation', 'lodging'
        ]
        
        const isTravelActivity = travelKeywords.some(keyword => 
          title.includes(keyword) || description.includes(keyword)
        )
        
        if (isTravelActivity) return false
        
        // Only count meetings and meals as meetings
        return a.type === 'meeting' || a.type === 'meal'
      })
      
      // Calculate drive distance from travel activities
      const driveActivities = tempActivities.filter(a => {
        const title = (a.title || '').toLowerCase()
        const type = a.type || ''
        
        const driveKeywords = ['drive', 'driving', 'car', 'taxi', 'uber', 'transfer']
        const isDriveActivity = type === 'travel' || driveKeywords.some(keyword => title.includes(keyword))
        
        const flightKeywords = ['flight', 'fly', 'plane', 'airplane', 'aircraft', 'airline', 'airport']
        const isFlightActivity = flightKeywords.some(keyword => title.includes(keyword))
        
        return isDriveActivity && !isFlightActivity
      })
      
      // Simple drive distance calculation for temp activities
      let totalDistanceValue = 0
      let hasValidDistances = false
      
      driveActivities.forEach(activity => {
        if (activity.notes) {
          const distanceMatch = activity.notes.match(/(\d+(?:\.\d+)?)\s*(km|kilometers|miles|mi)/i)
          if (distanceMatch) {
            const value = parseFloat(distanceMatch[1])
            const unit = distanceMatch[2].toLowerCase()
            const kmValue = unit.startsWith('mi') ? value * 1.60934 : value
            totalDistanceValue += kmValue
            hasValidDistances = true
          }
        }
      })
      
      const formatDistance = (km: number): string => {
        if (km === 0 || !hasValidDistances) return '0 km'
        return `${Math.round(km)} km`
      }
      
      return {
        totalActivities: tempActivities.length,
        meetings: meetingActivities.length,
        visits: 0, // Not calculated for temp trips
        confirmed: tempActivities.filter(a => a.is_confirmed).length,
        days: new Set(tempActivities.map(a => a.activity_date)).size,
        totalDriveDistance: formatDistance(totalDistanceValue),
        totalDriveTime: '0h', // Not calculated for temp trips
        driveActivities: driveActivities.length
      }
    } else {
      return activityManager.getActivityStats()
    }
  }
  
  // Debug logging for temp activities
  console.log('🔍 [Calendar Debug] Activity states:', {
    tripId: mockTrip.id,
    isTemp: mockTrip.id.startsWith('temp-trip-'),
    tempActivitiesCount: tempActivities.length,
    activitiesCount: activities.length,
    tempActivities: tempActivities.map(a => ({ id: a.id, title: a.title, date: a.activity_date, time: a.start_time })),
    formDataHasGenerated: !!formData.generatedActivities,
    isGeneratingAI
  })
  
  // For temp trips, create simplified versions of activity manager functions
  // DISABLE SAVING during temp trip creation - only update local state
  const updateActivity = mockTrip.id.startsWith('temp-trip-') 
    ? async (activityId: string, updates: Partial<ActivityFormData>) => {
        console.log('🔄 [Temp Trip] Simulating activity update (no save):', { activityId, updates })
        // Update activities in formData instead of database
        const currentActivities = formData.generatedActivities || []
        const updatedActivities = currentActivities.map(activity => 
          activity.id === activityId ? { ...activity, ...updates } : activity
        )
        updateFormData({ generatedActivities: updatedActivities })
        return null
      }
    : activityManager.updateActivity
    
  const updateActivityDebounced = mockTrip.id.startsWith('temp-trip-')
    ? async (activityId: string, updates: Partial<ActivityFormData>, delay?: number) => {
        console.log('🔄 [Temp Trip] Simulating debounced update (no save):', { activityId, updates })
        // Update activities in formData instead of database - no debouncing needed
        const currentActivities = formData.generatedActivities || []
        const updatedActivities = currentActivities.map(activity => 
          activity.id === activityId ? { ...activity, ...updates } : activity
        )
        updateFormData({ generatedActivities: updatedActivities })
      }
    : activityManager.updateActivityDebounced
    
  const createActivity = mockTrip.id.startsWith('temp-trip-')
    ? async (activityData: ActivityFormData) => {
        console.log('🔄 [Temp Trip] Simulating activity creation (no save):', activityData)
        // Create temp activity and add to formData
        const tempActivity = {
          id: `temp-activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: activityData.title,
          description: activityData.description || '',
          activity_date: activityData.activity_date,
          start_time: activityData.start_time,
          end_time: activityData.end_time,
          type: activityData.type as any,
          location: activityData.location,
          notes: activityData.notes,
          trip_id: mockTrip.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_confirmed: activityData.is_confirmed || false
        }
        
        const currentActivities = formData.generatedActivities || []
        updateFormData({ generatedActivities: [...currentActivities, tempActivity] })
        return tempActivity
      }
    : activityManager.createActivity
    
  const deleteActivity = mockTrip.id.startsWith('temp-trip-')
    ? async (activityId: string) => {
        console.log('🔄 [Temp Trip] Simulating activity deletion (no save):', activityId)
        const currentActivities = formData.generatedActivities || []
        const filteredActivities = currentActivities.filter(activity => activity.id !== activityId)
        updateFormData({ generatedActivities: filteredActivities })
      }
    : activityManager.deleteActivity
    
  const forceRefreshActivities = mockTrip.id.startsWith('temp-trip-')
    ? async () => {
        console.log('🔄 [Temp Trip] Simulating refresh (no database call)')
        // No-op for temp trips
      }
    : activityManager.forceRefreshActivities
  
  // Create getActivitiesByDate function for temp trips
  const getActivitiesByDate = () => {
    if (mockTrip.id.startsWith('temp-trip-')) {
      // Group temp activities by date
      return tempActivities.reduce((acc, activity) => {
        const date = activity.activity_date
        if (!acc[date]) acc[date] = []
        acc[date].push(activity)
        return acc
      }, {} as Record<string, Activity[]>)
    }
    return activityManager.getActivitiesByDate()
  }

  // Generate initial AI itinerary when component mounts and we have required data
  // Now includes automatic generation for temp trips during creation
  useEffect(() => {
    if (!hasGeneratedInitial && hostCompanies.length > 0 && formData.startDate && formData.endDate) {
      console.log('🤖 [AI Itinerary] Auto-generating itinerary with', hostCompanies.length, 'host companies')
      generateInitialAIItinerary()
      setHasGeneratedInitial(true)
    }
  }, [hostCompanies, formData.startDate, formData.endDate, hasGeneratedInitial, mockTrip.id])

  const generateInitialAIItinerary = async () => {
    if (!hostCompanies || hostCompanies.length === 0) {
      console.log('No host companies selected, skipping AI generation')
      return
    }

    setIsGeneratingAI(true)
    try {
      console.log('🗺️ [AI Itinerary] Starting Google Maps-optimized itinerary generation...')
      
      // Load Google Maps API
      await loadGoogleMapsAPI()
      
      // Geocode all host company locations
      const locations: (Location & { company: any })[] = []
      for (const hostCompany of hostCompanies) {
        const address = hostCompany.address || `${hostCompany.city || ''} ${hostCompany.state || ''}`.trim() || hostCompany.name
        console.log(`📍 [AI Itinerary] Geocoding: ${hostCompany.name} at ${address}`)
        
        const location = await geocodeLocation(address)
        if (location) {
          locations.push({
            ...location,
            company: hostCompany,
            name: hostCompany.fantasy_name || hostCompany.name
          })
          console.log(`✅ [AI Itinerary] Geocoded ${hostCompany.name}: ${location.lat}, ${location.lng}`)
        } else {
          console.warn(`⚠️ [AI Itinerary] Failed to geocode ${hostCompany.name}`)
          // Add fallback location
          locations.push({
            lat: -19.9167, lng: -43.9345, // Belo Horizonte fallback
            address: address,
            name: hostCompany.fantasy_name || hostCompany.name,
            company: hostCompany
          })
        }
      }

      // Enhanced starting point-aware optimization
      console.log('🎯 [AI Itinerary] Applying starting point optimization strategy...')
      const startingPointStrategy = getStartingPointStrategy(formData.startingPoint || 'santos')
      console.log(`📍 [AI Itinerary] Using ${startingPointStrategy.name} - ${startingPointStrategy.description}`)
      
      // Optimize company order based on starting point
      const optimizedCompanyData = optimizeCompanyOrderByStartingPoint(hostCompanies, formData.startingPoint || 'santos')
      console.log('🗺️ [AI Itinerary] Companies prioritized by starting point strategy:')
      optimizedCompanyData.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.company.name} (${item.city}) - Priority: ${item.priority}`)
      })
      
      // Group by city to minimize intra-city travel
      console.log('🏙️ [AI Itinerary] Grouping companies by city to eliminate unnecessary travel...')
      const companiesByCity = new Map<string, typeof optimizedCompanyData>()
      
      optimizedCompanyData.forEach(item => {
        const cityKey = item.city.toLowerCase().trim()
        if (!companiesByCity.has(cityKey)) {
          companiesByCity.set(cityKey, [])
        }
        companiesByCity.get(cityKey)!.push(item)
      })
      
      // Create optimized locations list respecting city grouping and starting point strategy
      console.log('🚗 [AI Itinerary] Creating optimized route with enhanced same-city logic...')
      let optimizedLocations: (Location & { company: any })[] = []
      
      // Process cities in priority order
      const processedCities = new Set<string>()
      for (const item of optimizedCompanyData) {
        const cityKey = item.city.toLowerCase().trim()
        if (processedCities.has(cityKey)) continue
        
        const cityCompanies = companiesByCity.get(cityKey) || []
        const cityLocations = cityCompanies.map(companyData => {
          const location = locations.find(loc => loc.company.id === companyData.company.id)
          return location
        }).filter(Boolean) as (Location & { company: any })[]
        
        if (cityLocations.length > 1) {
          // Multiple companies in same city - optimize within city
          console.log(`🏙️ [AI Itinerary] Optimizing ${cityLocations.length} companies within ${item.city}`)
          const optimizedCityLocations = await optimizeRoute(cityLocations)
          optimizedLocations.push(...optimizedCityLocations)
        } else if (cityLocations.length === 1) {
          optimizedLocations.push(cityLocations[0])
        }
        
        processedCities.add(cityKey)
        console.log(`✅ [AI Itinerary] Processed ${cityLocations.length} companies in ${item.city}`)
      }
      
      // Calculate travel times between consecutive locations
      const travelTimes: number[] = []
      for (let i = 0; i < optimizedLocations.length - 1; i++) {
        const travelInfo = await calculateTravelTime(optimizedLocations[i], optimizedLocations[i + 1])
        if (travelInfo) {
          travelTimes.push(travelInfo.duration.value) // seconds
          console.log(`🚗 [AI Itinerary] Travel time from ${optimizedLocations[i].name} to ${optimizedLocations[i + 1].name}: ${formatDuration(travelInfo.duration.value)}`)
        } else {
          travelTimes.push(3600) // Default 1 hour if calculation fails
        }
      }

      // Generate activities based on optimized route and travel times
      const tripDurationDays = Math.ceil((formData.endDate!.getTime() - formData.startDate!.getTime()) / (1000 * 60 * 60 * 24))
      const generatedActivities: ActivityFormData[] = []
      
      let currentDate = new Date(formData.startDate!)
      let currentTime = 9 * 60 // 9:00 AM in minutes
      let dayIndex = 0

      // Insert pickup activities based on starting point type
      console.log('🔍 [Debug] Checking pickup conditions:', {
        hasFlightInfo: !!formData.flightInfo,
        hasPickupGroups: !!formData.pickupGroups,
        startingPoint: formData.startingPoint,
        startingPointType: typeof formData.startingPoint,
        exactMatch: formData.startingPoint === 'gru_airport',
        multiCompanyMatch: formData.startingPoint === 'multi_company_pickup',
        flightInfo: formData.flightInfo,
        pickupGroupsCount: formData.pickupGroups?.length || 0
      })
      
      // Handle multi-company pickup groups
      if (formData.startingPoint === 'multi_company_pickup' && formData.pickupGroups && formData.pickupGroups.length > 0) {
        console.log('✈️ [AI Itinerary] Processing multi-company pickup groups')
        
        // Process each pickup group
        for (const pickupGroup of formData.pickupGroups) {
          if (!pickupGroup.flightInfo) continue
          
          console.log(`✈️ [AI Itinerary] Adding pickup for group: ${pickupGroup.name}`)
          
          const arrivalTime = pickupGroup.flightInfo.arrivalTime
          const [arrivalHour, arrivalMinute] = arrivalTime.split(':').map(Number)
          const arrivalInMinutes = arrivalHour * 60 + arrivalMinute
          
          // Schedule pickup 30 minutes after arrival
          const pickupTime = arrivalInMinutes + 30
          const pickupHour = Math.floor(pickupTime / 60)
          const pickupMinute = pickupTime % 60
          const pickupTimeStr = `${pickupHour.toString().padStart(2, '0')}:${pickupMinute.toString().padStart(2, '0')}`
          
          // Get guest names for this group
          const guestNames = pickupGroup.companies.flatMap((company: any) => 
            company.selectedContacts?.map((contact: any) => contact.name) || []
          )
          const guestsList = guestNames.length > 0 ? guestNames.join(', ') : `${pickupGroup.estimatedGuestCount} guests`
          
          // Determine drive duration based on destination
          const driveDuration = pickupGroup.destination?.type === 'hotel' ? 60 : 90 // 1h to hotel, 1.5h to office
          const driveEndTime = pickupTime + driveDuration
          const driveEndHour = Math.floor(driveEndTime / 60)
          const driveEndMinute = driveEndTime % 60
          const driveEndTimeStr = `${driveEndHour.toString().padStart(2, '0')}:${driveEndMinute.toString().padStart(2, '0')}`
          
          const destinationType = pickupGroup.destination?.type === 'hotel' ? 'Hotel Check-in' : 'Business Location'
          const destinationAddress = pickupGroup.destination?.address || (pickupGroup.destination?.type === 'hotel' ? 'Hotel' : 'Office')
          
          const pickupActivity: ActivityFormData = {
            title: `GRU Airport Pickup - ${pickupGroup.name}`,
            description: `Airport pickup for ${guestsList} and drive to ${destinationType}`,
            activity_date: pickupGroup.arrivalDate,
            start_time: pickupTimeStr,
            end_time: driveEndTimeStr,
            location: 'Guarulhos International Airport (GRU)',
            type: 'transport',
            notes: `✈️ Flight: ${pickupGroup.flightInfo.airline} ${pickupGroup.flightInfo.flightNumber}${pickupGroup.flightInfo.terminal ? ` (${pickupGroup.flightInfo.terminal})` : ''}\n🛬 Arrival: ${arrivalTime}\n🚗 Pickup: ${pickupTimeStr} (30 min buffer)\n👥 Guests: ${guestsList}\n📍 Destination: ${destinationAddress}\n⏱️ Drive time: ${driveDuration/60}h${pickupGroup.flightInfo.notes ? '\n📝 ' + pickupGroup.flightInfo.notes : ''}`,
            is_confirmed: false
          }
          
          generatedActivities.push(pickupActivity)
          
          // Create separate drive activity to destination
          const driveActivity: ActivityFormData = {
            title: `Drive to ${destinationType.replace(' Check-in', '')} - ${pickupGroup.name}`,
            description: `Drive from GRU Airport to ${destinationType} for ${pickupGroup.name}`,
            activity_date: pickupGroup.arrivalDate,
            start_time: pickupTimeStr,
            end_time: driveEndTimeStr,
            location: destinationAddress,
            type: 'transport',
            notes: `🚗 Drive from GRU Airport\n👥 Passengers: ${guestsList}\n📍 Destination: ${destinationAddress}\n⏱️ Estimated drive time: ${driveDuration/60}h`,
            is_confirmed: false
          }
          
          generatedActivities.push(driveActivity)
          
          console.log(`✈️ [AI Itinerary] Created pickup for ${pickupGroup.name}: ${pickupTimeStr}-${driveEndTimeStr} to ${destinationType}`)
        }
        
        // Update scheduling to start business meetings the next day after pickup
        console.log('📅 [AI Itinerary] Multi-company pickup detected, scheduling meetings for next day')
        dayIndex = 1
        currentDate = new Date(formData.startDate!)
        currentDate.setDate(currentDate.getDate() + 1)
        currentTime = 9 * 60 // Start business meetings at 9 AM next day
      }
      // Handle single GRU airport pickup (legacy support)
      else if (formData.startingPoint === 'gru_airport' && formData.flightInfo) {
        console.log('✈️ [AI Itinerary] Adding GRU Airport pickup activity')
        
        const arrivalTime = formData.flightInfo.arrivalTime
        const [arrivalHour, arrivalMinute] = arrivalTime.split(':').map(Number)
        const arrivalInMinutes = arrivalHour * 60 + arrivalMinute
        
        // Schedule pickup 30 minutes after arrival
        const pickupTime = arrivalInMinutes + 30
        const pickupHour = Math.floor(pickupTime / 60)
        const pickupMinute = pickupTime % 60
        const pickupTimeStr = `${pickupHour.toString().padStart(2, '0')}:${pickupMinute.toString().padStart(2, '0')}`
        
        // Determine drive duration based on destination
        const driveDuration = formData.nextDestination === 'hotel' ? 60 : 90 // 1h to hotel, 1.5h to office
        const driveEndTime = pickupTime + driveDuration
        const driveEndHour = Math.floor(driveEndTime / 60)
        const driveEndMinute = driveEndTime % 60
        const driveEndTimeStr = `${driveEndHour.toString().padStart(2, '0')}:${driveEndMinute.toString().padStart(2, '0')}`
        
        const destinationType = formData.nextDestination === 'hotel' ? 'Hotel Check-in' : 'Business Location'
        const destinationAddress = formData.destinationAddress || (formData.nextDestination === 'hotel' ? 'Hotel' : 'Office')
        
        const pickupActivity: ActivityFormData = {
          title: `GRU Airport Pickup - ${formData.flightInfo.passengerName}`,
          description: `Airport pickup and drive to ${destinationType}`,
          activity_date: formData.flightInfo.arrivalDate,
          start_time: pickupTimeStr,
          end_time: driveEndTimeStr,
          location: 'Guarulhos International Airport (GRU)',
          type: 'transport',
          notes: `✈️ Flight: ${formData.flightInfo.airline} ${formData.flightInfo.flightNumber}${formData.flightInfo.terminal ? ` (${formData.flightInfo.terminal})` : ''}\n🛬 Arrival: ${arrivalTime}\n🚗 Pickup: ${pickupTimeStr} (30 min buffer)\n📍 Destination: ${destinationAddress}\n⏱️ Drive time: ${driveDuration/60}h${formData.flightInfo.notes ? '\n📝 ' + formData.flightInfo.notes : ''}`,
          is_confirmed: false
        }
        
        generatedActivities.push(pickupActivity)
        
        // Create separate drive activity to destination
        const driveActivity: ActivityFormData = {
          title: `Drive to ${destinationType.replace(' Check-in', '')}`,
          description: `Drive from GRU Airport to ${destinationType}`,
          activity_date: formData.flightInfo.arrivalDate,
          start_time: pickupTimeStr,
          end_time: driveEndTimeStr,
          location: destinationAddress,
          type: 'transport',
          notes: `🚗 Drive from GRU Airport\n📍 Destination: ${destinationAddress}\n⏱️ Estimated drive time: ${driveDuration/60}h`,
          is_confirmed: false
        }
        
        generatedActivities.push(driveActivity)
        
        // Update current time and date for subsequent activities
        // Always schedule business meetings the next day after GRU arrival (matching progressive-save API)
        console.log('📅 [AI Itinerary] GRU arrival detected, scheduling meetings for next day')
        dayIndex = 1
        currentDate = new Date(formData.startDate!)
        currentDate.setDate(currentDate.getDate() + 1)
        currentTime = 9 * 60 // Start business meetings at 9 AM next day
        
        console.log(`✈️ [AI Itinerary] Created GRU pickup: ${pickupTimeStr}-${driveEndTimeStr} to ${destinationType}`)
      }

      // Calculate day distribution for proper scheduling across trip duration
      const availableDays = Math.max(tripDurationDays - (dayIndex > 0 ? dayIndex : 0), 1)
      const companiesPerDay = Math.ceil(optimizedLocations.length / availableDays)
      let companiesScheduledToday = 0
      
      console.log(`📊 [AI Itinerary] Day distribution: ${optimizedLocations.length} companies across ${availableDays} days = ${companiesPerDay} companies per day (starting from day ${dayIndex})`)

      for (let i = 0; i < optimizedLocations.length; i++) {
        const location = optimizedLocations[i]
        const company = location.company
        const currentCity = company.city || 'Unknown'
        const previousCity = i > 0 ? optimizedLocations[i - 1].company.city || 'Unknown' : null
        
        // Enhanced same-city logic: Add travel activity only when companies are in different cities
        if (i > 0 && previousCity) {
          const previousCompany = optimizedLocations[i - 1].company
          const currentCompany = location.company
          
          // Use enhanced same-city detection
          const isSameCity = areCompaniesInSameCity(previousCompany, currentCompany)
          
          console.log(`🏙️ [AI Itinerary] Checking travel between cities:`, {
            previous: { city: previousCity, company: previousCompany.name },
            current: { city: currentCity, company: currentCompany.name },
            isSameCity,
            willCreateTravel: !isSameCity
          })
          
          if (!isSameCity) {
            // Different cities - calculate travel time using Google Maps API first, fallback to local calculation
            let travelTimeHours = 0
            let travelMethod = 'estimated'
            
            try {
              // Try Google Maps API for accurate travel time
              const previousLocation = optimizedLocations[i - 1]
              const currentLocation = location
              const travelInfo = await calculateTravelTime(previousLocation, currentLocation)
              
              if (travelInfo) {
                travelTimeHours = travelInfo.duration.value / 3600 // Convert seconds to hours
                travelMethod = 'google_maps'
                console.log(`🗺️ [AI Itinerary] Google Maps travel time: ${previousCity} → ${currentCity}: ${travelTimeHours.toFixed(2)}h`)
              } else {
                throw new Error('Google Maps API failed')
              }
            } catch (error) {
              // Fallback to local calculation
              travelTimeHours = calculateLocalTravelTime(previousCity, currentCity)
              console.log(`📍 [AI Itinerary] Fallback local travel time: ${previousCity} → ${currentCity}: ${travelTimeHours.toFixed(2)}h`)
            }
            
            const travelMinutes = Math.ceil(travelTimeHours * 60)
            
            // Create travel activity for any travel time > 0.1 hours (6 minutes)
            if (travelTimeHours > 0.1) {
              // Store original time to check if we rescheduled
              const originalCurrentTime = currentTime
              
              // Check if drive would start after 8 PM (20:00 = 1200 minutes)
              let actualTravelStartTime = currentTime
              let travelDate = currentDate.toISOString().split('T')[0]
              
              if (currentTime >= 1200) { // 20:00 or later
                console.log(`🌙 [AI Itinerary] Drive would start at ${Math.floor(currentTime / 60)}:${String(currentTime % 60).padStart(2, '0')} (after 8 PM)`)
                console.log(`🌅 [AI Itinerary] Rescheduling drive to 8:00 AM next day`)
                
                // Schedule for 8:00 AM the next day instead
                const nextDay = new Date(currentDate)
                nextDay.setDate(nextDay.getDate() + 1)
                travelDate = nextDay.toISOString().split('T')[0]
                actualTravelStartTime = 480 // 8:00 AM in minutes (8 * 60)
                
                // Update currentDate and currentTime for next activities
                currentDate = nextDay
                currentTime = 480 // Start of new day at 8:00 AM
              }
              
              const travelStartTime = `${Math.floor(actualTravelStartTime / 60).toString().padStart(2, '0')}:${(actualTravelStartTime % 60).toString().padStart(2, '0')}`
              const travelEndTimeMinutes = actualTravelStartTime + travelMinutes
              
              // Ensure travel end time doesn't exceed 24:00 (1440 minutes)
              let finalTravelEndTime = travelEndTimeMinutes
              let finalTravelDate = travelDate
              
              if (travelEndTimeMinutes >= 1440) {
                // Travel extends to next day
                console.log(`⏰ [AI Itinerary] Travel extends past midnight, adjusting dates`)
                finalTravelEndTime = travelEndTimeMinutes % 1440
                const travelEndDay = new Date(travelDate)
                travelEndDay.setDate(travelEndDay.getDate() + 1)
                finalTravelDate = travelEndDay.toISOString().split('T')[0]
                
                // Note: This creates a multi-day travel activity that spans dates
                console.log(`📅 [AI Itinerary] Multi-day travel: ${travelDate} ${travelStartTime} → ${finalTravelDate} ${Math.floor(finalTravelEndTime / 60).toString().padStart(2, '0')}:${(finalTravelEndTime % 60).toString().padStart(2, '0')}`)
              }
              
              const travelEndTime = `${Math.floor(finalTravelEndTime / 60).toString().padStart(2, '0')}:${(finalTravelEndTime % 60).toString().padStart(2, '0')}`
              
              // Enhanced travel descriptions with duration included in title
              const strategy = getStartingPointStrategy(formData.startingPoint || 'santos')
              const travelTimeSeconds = travelMinutes * 60
              const formattedDuration = formatDuration(travelTimeSeconds) // Use formatDuration for proper h:min format
              let travelTitle = `Drive from ${previousCity} to ${currentCity} (${formattedDuration})`
              let travelDescription = `Travel from ${previousCity} to ${currentCity} (${formattedDuration} drive)`
              
              if (strategy.routingStrategy === 'port-inland' && isSantosArea(previousCity)) {
                travelDescription = `Drive inland from Santos port to ${currentCity} coffee region (${formattedDuration} drive)`
              } else if (strategy.routingStrategy === 'north-south') {
                travelDescription = `Continue south through coffee regions: ${previousCity} → ${currentCity} (${formattedDuration} drive)`
              } else if (strategy.routingStrategy === 'fly-drive') {
                travelDescription = `Rental car drive from ${previousCity} to ${currentCity} (${formattedDuration} drive)`
              } else if (strategy.routingStrategy === 'hub-spoke') {
                travelDescription = `Drive from ${previousCity} to ${currentCity} (${formattedDuration} drive each way)`
              }
              
              const travelActivity: ActivityFormData = {
                title: travelTitle,
                description: travelDescription,
                activity_date: travelDate, // Use calculated travel date (may be next day for overnight drives)
                start_time: travelStartTime,
                end_time: travelEndTime,
                location: `${previousCity} → ${currentCity}`,
                type: 'travel',
                notes: `🚗 Travel time: ${formattedDuration} (${travelMethod})\n🎯 Strategy: ${strategy.name}\n📍 Route: ${previousCity} to ${currentCity}\n🗺️ Starting point optimized routing\n⏱️ Duration: ${travelMinutes} minutes${originalCurrentTime >= 1200 ? '\n🌅 Rescheduled to next day (no overnight driving)' : ''}`,
                is_confirmed: false
              }
              
              generatedActivities.push(travelActivity)
              console.log(`🚗 [AI Itinerary] ✅ Created travel activity: ${previousCity} → ${currentCity} (${formattedDuration} via ${travelMethod})`)
              
              // Update current time to the end of travel
              // Use finalTravelEndTime to handle multi-day travel properly
              currentTime = finalTravelEndTime
            } else {
              // Very short travel (< 6 minutes) - just add buffer time
              currentTime += 15 // 15 minutes buffer for very short trips
              console.log(`🚙 [AI Itinerary] Very short travel: ${previousCity} → ${currentCity} (${travelTimeHours.toFixed(2)}h) - Buffer added`)
            }
          } else {
            // Same city - no travel activity needed, just add meeting buffer
            currentTime += 15 // 15 minutes buffer between same-city meetings
            console.log(`🏙️ [AI Itinerary] Same city detected: ${previousCompany.name} → ${currentCompany.name} in ${currentCity} (no travel activity)`)
          }
          
          // If travel pushes us past reasonable business hours (6 PM), move to next day
          if (currentTime > 18 * 60) {
            dayIndex++
            if (dayIndex >= tripDurationDays) {
              console.warn('⚠️ [AI Itinerary] Trip duration exceeded, truncating activities')
              break
            }
            currentDate = new Date(formData.startDate!)
            currentDate.setDate(currentDate.getDate() + dayIndex)
            currentTime = 9 * 60 // Start at 9 AM
          }
        }

        // Determine meeting duration using optimized logic
        const visitDuration = getOptimalMeetingDuration(currentCity) * 60 // Convert hours to minutes
        
        // Create visit activity
        const startTime = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`
        const endTimeMinutes = currentTime + visitDuration
        const endTime = `${Math.floor(endTimeMinutes / 60).toString().padStart(2, '0')}:${(endTimeMinutes % 60).toString().padStart(2, '0')}`

        // Enhanced meeting types based on starting point strategy and location
        const strategy = getStartingPointStrategy(formData.startingPoint || 'santos')
        let meetingType = '🏢 Business meeting & facility tour'
        let durationNote = ' (4h comprehensive visit)'
        
        if (isSantosArea(currentCity)) {
          meetingType = '🏭 Port & logistics meeting'
          durationNote = ' (2h focused meeting - walking distance)'
          if (strategy.routingStrategy === 'port-inland') {
            durationNote += ' - Starting point priority'
          }
        } else if (isVarginhaArea(currentCity)) {
          meetingType = '☕ Coffee region business visit'
          durationNote = ' (3h coffee region visit - short drives)'
        } else {
          // Customize meeting type based on region and strategy
          const region = getRegionByCity(currentCity, company.state)
          if (region.includes('Cerrado')) {
            meetingType = '🌾 Cerrado coffee producer visit'
            if (strategy.routingStrategy === 'north-south' || strategy.routingStrategy === 'fly-drive') {
              durationNote = ' (4h comprehensive visit - strategy optimized)'
            }
          } else if (region.includes('Mogiana')) {
            meetingType = '☕ Alta Mogiana specialty coffee visit'
          } else if (region.includes('Zona da Mata')) {
            meetingType = '🍃 Traditional coffee farm visit'
          } else if (currentCity.toLowerCase().includes('são paulo')) {
            meetingType = '🏙️ Metropolitan business meeting'
            if (strategy.routingStrategy === 'hub-spoke') {
              durationNote = ' (3h hub meeting - return same day)'
            }
          }
        }
        
        const activity: ActivityFormData = {
          title: `Visit ${company.fantasy_name || company.name}`,
          description: `${meetingType} at ${company.name}${durationNote}`,
          activity_date: currentDate.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          location: location.address || location.name,
          type: 'meeting',
          notes: `${meetingType}\n📍 ${currentCity} - Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}\n⏱️ Duration: ${visitDuration/60}h${durationNote}\n🎯 Strategy: ${strategy.name}\n🗺️ Starting point: ${formData.startingPoint || 'Santos'}`,
          is_confirmed: false
        }

        generatedActivities.push(activity)
        console.log(`📅 [AI Itinerary] Created activity: ${activity.title} on ${activity.activity_date} from ${startTime} to ${endTime} (${visitDuration/60}h)`)
        
        // Update current time for next activity (add 1h break between meetings)
        currentTime = endTimeMinutes + 60
        companiesScheduledToday++
        
        // Check if we should advance to the next day based on companies-per-day limit
        if (companiesScheduledToday >= companiesPerDay && i < optimizedLocations.length - 1) {
          console.log(`📅 [AI Itinerary] Reached daily limit of ${companiesPerDay} companies, advancing to next day`)
          dayIndex++
          if (dayIndex >= tripDurationDays) {
            console.warn('⚠️ [AI Itinerary] Trip duration exceeded, truncating remaining activities')
            break
          }
          currentDate = new Date(formData.startDate!)
          currentDate.setDate(currentDate.getDate() + dayIndex)
          currentTime = 9 * 60 // Start at 9 AM on the new day
          companiesScheduledToday = 0
          console.log(`🌅 [AI Itinerary] Advanced to day ${dayIndex + 1} (${currentDate.toISOString().split('T')[0]}) at 9:00 AM`)
        }
      }

      // Enhanced return journey logic - check if there's a company to visit in Santos instead of just driving
      const actualEndingPoint = formData.endingPoint || formData.startingPoint || 'santos'
      const lastLocation = optimizedLocations[optimizedLocations.length - 1]
      const lastCompany = lastLocation?.company
      
      console.log('🏁 [AI Itinerary] Return journey logic:', {
        formDataEndingPoint: formData.endingPoint,
        formDataStartingPoint: formData.startingPoint,
        calculatedEndingPoint: actualEndingPoint,
        lastLocationCity: lastCompany?.city,
        lastLocationName: lastLocation?.name
      })
      
      const shouldAddReturnActivity = actualEndingPoint && 
        actualEndingPoint !== 'gru_airport' && 
        optimizedLocations.length > 0
      
      if (shouldAddReturnActivity && lastCompany) {
        // Check if there's another company to visit in the return location (e.g., Santos)
        const returnCompaniesToVisit = hostCompanies.filter(company => {
          const companyCity = company.city || ''
          const returnCity = actualEndingPoint === 'santos' || actualEndingPoint === 'w&a_hq_santos' ? 'santos' : actualEndingPoint.toLowerCase()
          
          // Check if this company is in the return city and hasn't been visited yet
          const isInReturnCity = companyCity.toLowerCase().includes(returnCity) || 
                                 (returnCity === 'santos' && isSantosArea(companyCity))
          
          const alreadyVisited = optimizedLocations.some(loc => loc.company.id === company.id)
          
          return isInReturnCity && !alreadyVisited
        })
        
        console.log('🏢 [AI Itinerary] Companies to visit in return location:', {
          returnLocation: actualEndingPoint,
          companiesFound: returnCompaniesToVisit.length,
          companies: returnCompaniesToVisit.map(c => ({ name: c.name, city: c.city }))
        })
        
        if (returnCompaniesToVisit.length > 0) {
          // Visit the company instead of just driving back
          const companyToVisit = returnCompaniesToVisit[0] // Visit the first one
          const visitDuration = getOptimalMeetingDuration(companyToVisit.city || 'santos') * 60 // Convert hours to minutes
          
          // Add travel activity to the company location
          const lastLocationCity = lastCompany.city || 'Unknown'
          const returnCompanyCity = companyToVisit.city || 'Santos'
          
          if (!areCompaniesInSameCity(lastCompany, companyToVisit)) {
            // Different cities - need travel activity
            let travelTimeHours = 0
            let travelMethod = 'estimated'
            
            try {
              const travelInfo = await calculateTravelTime(lastLocation, {
                name: companyToVisit.name,
                address: companyToVisit.address || `${companyToVisit.city}, ${companyToVisit.state}, Brazil`,
                lat: 0,
                lng: 0
              })
              
              if (travelInfo) {
                travelTimeHours = travelInfo.duration.value / 3600
                travelMethod = 'google_maps'
              } else {
                travelTimeHours = calculateLocalTravelTime(lastLocationCity, returnCompanyCity)
              }
            } catch (error) {
              travelTimeHours = calculateLocalTravelTime(lastLocationCity, returnCompanyCity)
            }
            
            const travelMinutes = Math.ceil(travelTimeHours * 60)
            
            if (travelTimeHours > 0.1) { // Only add travel if > 6 minutes
              let travelStartTime = currentTime + 60 // 1 hour after last meeting
              let travelDate = currentDate.toISOString().split('T')[0]
              
              if (currentTime >= 1200) { // After 8 PM
                const nextDay = new Date(currentDate)
                nextDay.setDate(nextDay.getDate() + 1)
                travelDate = nextDay.toISOString().split('T')[0]
                travelStartTime = 480 // 8:00 AM next day
                currentDate = nextDay
                currentTime = 480
              }
              
              const travelStartTimeStr = `${Math.floor(travelStartTime / 60).toString().padStart(2, '0')}:${(travelStartTime % 60).toString().padStart(2, '0')}`
              const travelEndTime = travelStartTime + travelMinutes
              const travelEndTimeStr = `${Math.floor(travelEndTime / 60).toString().padStart(2, '0')}:${(travelEndTime % 60).toString().padStart(2, '0')}`
              
              const travelActivity: ActivityFormData = {
                title: `Drive from ${lastLocationCity} to ${returnCompanyCity} (${formatDuration(travelMinutes * 60)})`,
                description: `Travel from ${lastLocation.name} to ${companyToVisit.name} in ${returnCompanyCity}`,
                activity_date: travelDate,
                start_time: travelStartTimeStr,
                end_time: travelEndTimeStr,
                location: `${lastLocationCity} → ${returnCompanyCity}`,
                type: 'travel',
                notes: `🚗 Travel time: ${formatDuration(travelMinutes * 60)} (${travelMethod})\n📍 Route: ${lastLocation.name} to ${companyToVisit.name}\n🏁 Final destination visit`,
                is_confirmed: false
              }
              
              generatedActivities.push(travelActivity)
              currentTime = travelEndTime
              console.log(`🚗 [AI Itinerary] ✅ Added travel to final destination: ${lastLocationCity} → ${returnCompanyCity}`)
            }
          }
          
          // Add the company visit activity
          const visitStartTime = currentTime
          const visitStartTimeStr = `${Math.floor(visitStartTime / 60).toString().padStart(2, '0')}:${(visitStartTime % 60).toString().padStart(2, '0')}`
          const visitEndTime = visitStartTime + visitDuration
          const visitEndTimeStr = `${Math.floor(visitEndTime / 60).toString().padStart(2, '0')}:${(visitEndTime % 60).toString().padStart(2, '0')}`
          
          const visitActivity: ActivityFormData = {
            title: `Visit ${companyToVisit.fantasy_name || companyToVisit.name}`,
            description: `Business meeting at ${companyToVisit.name} in ${returnCompanyCity} (${visitDuration/60}h visit)`,
            activity_date: currentDate.toISOString().split('T')[0],
            start_time: visitStartTimeStr,
            end_time: visitEndTimeStr,
            location: companyToVisit.address || `${companyToVisit.city}, ${companyToVisit.state}, Brazil`,
            type: 'meeting',
            notes: `🏢 Business meeting\n📍 ${returnCompanyCity}\n⏱️ Duration: ${visitDuration/60}h\n🏁 Final destination company visit`,
            is_confirmed: false
          }
          
          generatedActivities.push(visitActivity)
          console.log(`🏢 [AI Itinerary] ✅ Added company visit in return location: ${companyToVisit.name} (${visitDuration/60}h)`)
          
        } else {
          // No companies to visit - just add return drive as before but only if different city
          if (!areCompaniesInSameCity(lastCompany, { city: actualEndingPoint === 'santos' ? 'Santos' : actualEndingPoint })) {
            let returnDestination = 'Destination'
            let returnLocationForAPI = ''
            
            if (actualEndingPoint === 'santos') {
              returnDestination = 'Santos'
              returnLocationForAPI = 'Santos, São Paulo, Brazil'
            } else if (actualEndingPoint === 'w&a_hq_santos') {
              returnDestination = 'W&A HQ Santos'
              returnLocationForAPI = 'Santos, São Paulo, Brazil'
            } else if (actualEndingPoint === 'guarulhos') {
              returnDestination = 'Guarulhos Area'
              returnLocationForAPI = 'Guarulhos, São Paulo, Brazil'
            } else if (formData.customEndingPoint) {
              returnDestination = formData.customEndingPoint
              returnLocationForAPI = formData.customEndingPoint
            } else {
              returnDestination = actualEndingPoint
              returnLocationForAPI = actualEndingPoint
            }
            
            // Calculate return travel time
            let returnTravelMinutes = 120 // Default 2 hours fallback
            
            try {
              const returnTravelInfo = await calculateTravelTime(lastLocation, {
                name: returnDestination,
                address: returnLocationForAPI,
                lat: 0,
                lng: 0
              })
              
              if (returnTravelInfo) {
                returnTravelMinutes = Math.ceil(returnTravelInfo.duration.value / 60)
              }
            } catch (error) {
              console.log('⚠️ [AI Itinerary] Could not calculate return travel time, using default 2 hours')
            }
            
            // Schedule return drive
            let returnStartTime = currentTime + 60 // 1 hour after last meeting
            let returnDate = currentDate
            if (returnStartTime >= 1200) { // After 8 PM
              returnDate = new Date(currentDate)
              returnDate.setDate(returnDate.getDate() + 1)
              returnStartTime = 480 // 8:00 AM next day
            }
            
            const returnStartTimeStr = `${Math.floor(returnStartTime / 60).toString().padStart(2, '0')}:${(returnStartTime % 60).toString().padStart(2, '0')}`
            const returnEndTime = returnStartTime + returnTravelMinutes
            const returnEndTimeStr = `${Math.floor(returnEndTime / 60).toString().padStart(2, '0')}:${(returnEndTime % 60).toString().padStart(2, '0')}`
            
            const returnActivity: ActivityFormData = {
              title: `Return Drive to ${returnDestination}`,
              description: `Drive back to ${returnDestination} from ${lastLocation.name} (${formatDuration(returnTravelMinutes * 60)})`,
              activity_date: returnDate.toISOString().split('T')[0],
              start_time: returnStartTimeStr,
              end_time: returnEndTimeStr,
              location: `${lastLocation.name} → ${returnDestination}`,
              type: 'travel',
              notes: `🏁 Return journey to trip starting point\n📍 Route: ${lastLocation.name} to ${returnDestination}\n⏱️ Duration: ${returnTravelMinutes} minutes\n🎯 Completing round trip`,
              is_confirmed: false
            }
            
            generatedActivities.push(returnActivity)
            console.log(`🏁 [AI Itinerary] ✅ Added return drive: ${lastLocation.name} → ${returnDestination}`)
          } else {
            console.log(`🏙️ [AI Itinerary] Last company already in return city (${lastCompany.city}), no return travel needed`)
          }
        }
      }

      console.log(`✅ [AI Itinerary] Generated ${generatedActivities.length} optimized activities`)

      // Store generated activities in formData for temporary trips during creation
      // For temp trips, we don't create real database activities but simulate them
      if (mockTrip.id.startsWith('temp-trip-')) {
        // Store activities in formData for later use during final trip creation
        const tempActivities = generatedActivities.map((activityData, index) => ({
          id: `temp-activity-${Date.now()}-${index}`,
          title: activityData.title,
          description: activityData.description || '',
          activity_date: activityData.activity_date, // Fixed field name
          start_time: activityData.start_time, // Fixed field name
          end_time: activityData.end_time, // Fixed field name
          type: activityData.type as any, // Fixed field name
          location: activityData.location,
          notes: activityData.notes,
          trip_id: mockTrip.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_confirmed: activityData.is_confirmed
        }))
        
        // Store in formData for trip creation
        updateFormData({ 
          generatedActivities: tempActivities 
        })
        
        console.log('✅ [AI Itinerary] Generated activities stored in formData for temp trip')
      } else {
        // For real trips, create activities in the database
        for (const activityData of generatedActivities) {
          await createActivity(activityData)
        }
      }

      setHasGeneratedInitial(true)
    } catch (error) {
      console.error('❌ [AI Itinerary] Error generating itinerary:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Handle extending trip (add days before or after)
  const handleExtendTrip = (direction: 'before' | 'after' | 'remove-before' | 'remove-after') => {
    if (!formData.startDate || !formData.endDate) return

    const newStartDate = new Date(formData.startDate)
    const newEndDate = new Date(formData.endDate)

    if (direction === 'before') {
      newStartDate.setDate(newStartDate.getDate() - 1)
    } else if (direction === 'after') {
      newEndDate.setDate(newEndDate.getDate() + 1)
    } else if (direction === 'remove-before') {
      // Remove day from beginning
      newStartDate.setDate(newStartDate.getDate() + 1)
    } else if (direction === 'remove-after') {
      // Remove day from end
      newEndDate.setDate(newEndDate.getDate() - 1)
    }

    // Ensure we don't create invalid date ranges
    if (newStartDate >= newEndDate) {
      console.warn('Cannot remove day: Trip must have at least one day')
      return
    }

    updateFormData({
      startDate: newStartDate,
      endDate: newEndDate
    })
  }

  // Handle activity creation from time slot click
  const handleActivityCreate = (timeSlot: string, date: string) => {
    console.log('🎯 [Trip Creation] handleActivityCreate called:', { timeSlot, date })
    
    const newActivity = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      activity_date: date,
      start_time: timeSlot,
      end_time: timeSlot,
      location: '',
      activity_type: 'meeting',
      priority: 'medium',
      notes: '',
      visibility_level: 'all',
      trip_id: mockTrip.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Activity
    
    console.log('📝 [Trip Creation] Setting selectedActivity for editing:', newActivity)
    setSelectedActivity(newActivity)
  }

  // Handle activity editing
  const handleActivityEdit = (activity: Activity) => {
    setSelectedActivity(activity)
  }

  // Handle activity splitting
  const handleActivitySplit = (activity: Activity) => {
    setSplitModalActivity(activity)
  }

  return (
    <div className="space-y-6">

      {/* AI Generation Status */}
      {isGeneratingAI && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2 flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Itinerary Generation</span>
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Creating starting point-optimized itinerary with enhanced same-city logic...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                Starting: {formData.startingPoint || 'Santos'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                {hostCompanies.length} Host Companies
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                {formData.startDate && formData.endDate 
                  ? Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  : 1} Days
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                Smart City Grouping
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Component */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] overflow-x-auto">
        <OutlookCalendar 
          trip={mockTrip}
          activities={activities}
          loading={loading || isGeneratingAI}
          error={error}
          refreshing={refreshing}
          updateActivity={updateActivity}
          updateActivityDebounced={updateActivityDebounced}
          getActivitiesByDate={getActivitiesByDate}
          onExtendTrip={handleExtendTrip}
          onActivityCreate={handleActivityCreate}
          onActivityEdit={handleActivityEdit}
          onActivitySplit={handleActivitySplit}
          forceRefreshActivities={forceRefreshActivities}
        />
      </div>

      {/* Summary Statistics */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Itinerary Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Meetings:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{getActivityStats().meetings}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Drive Distance:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{getActivityStats().totalDriveDistance}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Companies:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{hostCompanies.length}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Team:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{participants.length}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Days:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              {formData.startDate && formData.endDate 
                ? Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                : 1}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Split Modal */}
      {splitModalActivity && (
        <ActivitySplitModal
          activity={splitModalActivity}
          onClose={() => setSplitModalActivity(null)}
          onSplit={async (splitData) => {
            // Create two new activities based on the split data
            const originalActivity = splitModalActivity!
            
            // Create Activity A
            const activityA: ActivityFormData = {
              title: `${originalActivity.title} (Group A)`,
              description: originalActivity.description || '',
              date: originalActivity.activity_date,
              startTime: splitData.groupA.startTime,
              endTime: splitData.groupA.endTime,
              location: originalActivity.location || '',
              activityType: originalActivity.activity_type || 'meeting',
              priority: originalActivity.priority || 'medium',
              notes: `Split from: ${originalActivity.title}\nGroup A participants: ${splitData.groupA.participants.map(p => p.name).join(', ')}`,
              visibility_level: originalActivity.visibility_level || 'all'
            }

            // Create Activity B
            const activityB: ActivityFormData = {
              title: `${originalActivity.title} (Group B)`,
              description: originalActivity.description || '',
              date: splitData.splitType === 'sequential' ? splitData.groupB.date : originalActivity.activity_date,
              startTime: splitData.groupB.startTime,
              endTime: splitData.groupB.endTime,
              location: originalActivity.location || '',
              activityType: originalActivity.activity_type || 'meeting',
              priority: originalActivity.priority || 'medium',
              notes: `Split from: ${originalActivity.title}\nGroup B participants: ${splitData.groupB.participants.map(p => p.name).join(', ')}`,
              visibility_level: originalActivity.visibility_level || 'all'
            }

            try {
              // Create the new activities
              await createActivity(activityA)
              await createActivity(activityB)
              
              // Delete the original activity
              await deleteActivity(originalActivity.id)
              
              console.log('Activity successfully split into two groups')
            } catch (error) {
              console.error('Error splitting activity:', error)
            } finally {
              setSplitModalActivity(null)
            }
          }}
          participants={participants}
          companies={[...hostCompanies, ...buyerCompanies]}
        />
      )}

      {/* Comprehensive Activity Editor Modal - Based on QuickView ScheduleTab */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-lg p-6 w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] mx-0 sm:mx-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
                {selectedActivity.id.startsWith('temp-') ? 'Add Activity' : 'Edit Activity'}
              </h3>
              <button
                onClick={() => {
                  console.log('🚫 [Trip Creation] Closing activity editor')
                  setSelectedActivity(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  value={selectedActivity.title || ''}
                  onChange={(e) => {
                    setSelectedActivity(prev => prev ? { ...prev, title: e.target.value } : null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter activity title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedActivity.description || ''}
                  onChange={(e) => {
                    setSelectedActivity(prev => prev ? { ...prev, description: e.target.value } : null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter activity description..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={selectedActivity.activity_date || ''}
                    onChange={(e) => {
                      const newStartDate = e.target.value
                      setSelectedActivity(prev => prev ? { 
                        ...prev, 
                        activity_date: newStartDate,
                        // If end_date is before new start_date, update it
                        end_date: (prev.end_date && prev.end_date < newStartDate) ? newStartDate : prev.end_date
                      } : null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date <span className="text-xs text-gray-500">(for multi-day events)</span>
                  </label>
                  <input
                    type="date"
                    value={selectedActivity.end_date || selectedActivity.activity_date || ''}
                    onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, end_date: e.target.value } : null)}
                    min={selectedActivity.activity_date}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={selectedActivity.start_time || ''}
                    onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, start_time: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={selectedActivity.end_time || ''}
                    onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, end_time: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Activity Type
                </label>
                <select 
                  value={selectedActivity.type || 'meeting'}
                  onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                >
                  <option value="meeting">Meeting</option>
                  <option value="meal">Meal</option>
                  <option value="travel">Ground Transportation</option>
                  <option value="flight">Flight</option>
                  <option value="accommodation">Hotel / Accommodation</option>
                  <option value="event">Event / Conference</option>
                  <option value="break">Break / Free Time</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={selectedActivity.location || ''}
                  onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, location: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter location or address..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Host / Organizer
                </label>
                <input
                  type="text"
                  value={selectedActivity.host || ''}
                  onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, host: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Enter host or organizer..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedActivity.cost || 0}
                    onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, cost: parseFloat(e.target.value) || 0 } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Currency
                  </label>
                  <select 
                    value={selectedActivity.currency || 'BRL'}
                    onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, currency: e.target.value as any } : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="DKK">DKK (kr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedActivity.is_confirmed || false}
                    onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, is_confirmed: e.target.checked } : null)}
                    className="rounded border-gray-300 dark:border-gray-600 text-emerald-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmed Activity
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={selectedActivity.notes || ''}
                  onChange={(e) => setSelectedActivity(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  console.log('🚫 [Trip Creation] Cancelling activity creation/edit')
                  setSelectedActivity(null)
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('💾 [Trip Creation] Saving comprehensive activity:', selectedActivity)
                  
                  if (selectedActivity.id.startsWith('temp-')) {
                    // New activity - convert to proper format and add to formData.generatedActivities
                    const tempActivity = {
                      id: `temp-activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      title: selectedActivity.title || 'Untitled Activity',
                      description: selectedActivity.description || '',
                      activity_date: selectedActivity.activity_date || '',
                      start_time: selectedActivity.start_time || '',
                      end_time: selectedActivity.end_time || '',
                      type: selectedActivity.type as any,
                      location: selectedActivity.location || '',
                      host: selectedActivity.host || '',
                      cost: selectedActivity.cost || 0,
                      currency: selectedActivity.currency || 'BRL',
                      is_confirmed: selectedActivity.is_confirmed || false,
                      notes: selectedActivity.notes || '',
                      trip_id: mockTrip.id,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      end_date: selectedActivity.end_date || selectedActivity.activity_date
                    }
                    
                    const currentActivities = formData.generatedActivities || []
                    const updatedActivities = [...currentActivities, tempActivity]
                    
                    console.log('✅ [Trip Creation] Adding comprehensive activity to form data')
                    updateFormData({ generatedActivities: updatedActivities })
                  } else {
                    // Edit existing activity - update in formData.generatedActivities
                    const currentActivities = formData.generatedActivities || []
                    const updatedActivities = currentActivities.map(activity => 
                      activity.id === selectedActivity.id ? {
                        ...activity,
                        title: selectedActivity.title || activity.title,
                        description: selectedActivity.description || activity.description,
                        activity_date: selectedActivity.activity_date || activity.activity_date,
                        start_time: selectedActivity.start_time || activity.start_time,
                        end_time: selectedActivity.end_time || activity.end_time,
                        type: selectedActivity.type || activity.type,
                        location: selectedActivity.location || activity.location,
                        host: selectedActivity.host || activity.host || '',
                        cost: selectedActivity.cost || activity.cost || 0,
                        currency: selectedActivity.currency || activity.currency || 'BRL',
                        is_confirmed: selectedActivity.is_confirmed !== undefined ? selectedActivity.is_confirmed : activity.is_confirmed,
                        notes: selectedActivity.notes || activity.notes,
                        end_date: selectedActivity.end_date || selectedActivity.activity_date || activity.activity_date,
                        updated_at: new Date().toISOString()
                      } : activity
                    )
                    
                    console.log('✅ [Trip Creation] Updating existing activity in form data')
                    updateFormData({ generatedActivities: updatedActivities })
                  }
                  
                  setSelectedActivity(null)
                }}
                disabled={!selectedActivity.title?.trim() || !selectedActivity.activity_date}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {selectedActivity.id.startsWith('temp-') ? 'Add Activity' : 'Update Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}