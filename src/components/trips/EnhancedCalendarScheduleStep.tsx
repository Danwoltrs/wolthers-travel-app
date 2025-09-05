import React, { useState, useEffect, useMemo } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Clock, MapPin, Wand2, Loader2, Plus, AlertCircle, Navigation } from 'lucide-react'
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
  const updateActivity = activityManager.updateActivity
  const updateActivityDebounced = activityManager.updateActivityDebounced
  const createActivity = activityManager.createActivity
  const deleteActivity = activityManager.deleteActivity
  const forceRefreshActivities = activityManager.forceRefreshActivities
  
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
          
          if (!isSameCity) {
            // Different cities - calculate travel time
            const localTravelHours = calculateLocalTravelTime(previousCity, currentCity)
            const travelMinutes = Math.ceil(localTravelHours * 60)
            
            // Only create travel activity if there's significant travel time (> 10 minutes)
            if (localTravelHours > 0.15) {
              const travelStartTime = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`
              const travelEndTimeMinutes = currentTime + travelMinutes
              const travelEndTime = `${Math.floor(travelEndTimeMinutes / 60).toString().padStart(2, '0')}:${(travelEndTimeMinutes % 60).toString().padStart(2, '0')}`
              
              // Enhanced travel descriptions based on starting point strategy
              const strategy = getStartingPointStrategy(formData.startingPoint || 'santos')
              let travelDescription = `Travel from ${previousCity} to ${currentCity} (${localTravelHours}h drive)`
              
              if (strategy.routingStrategy === 'port-inland' && isSantosArea(previousCity)) {
                travelDescription = `Drive inland from Santos port to ${currentCity} coffee region (${localTravelHours}h)`
              } else if (strategy.routingStrategy === 'north-south') {
                travelDescription = `Continue south through coffee regions: ${previousCity} → ${currentCity} (${localTravelHours}h)`
              } else if (strategy.routingStrategy === 'fly-drive') {
                travelDescription = `Rental car drive from ${previousCity} to ${currentCity} (${localTravelHours}h)`
              } else if (strategy.routingStrategy === 'hub-spoke') {
                travelDescription = `Day trip from São Paulo hub to ${currentCity} (${localTravelHours}h each way)`
              }
              
              const travelActivity: ActivityFormData = {
                title: `${localTravelHours <= 0.5 ? 'Short Drive' : 'Drive'} to ${currentCity}`,
                description: travelDescription,
                activity_date: currentDate.toISOString().split('T')[0],
                start_time: travelStartTime,
                end_time: travelEndTime,
                location: `${previousCity} → ${currentCity}`,
                type: 'travel',
                notes: `🚗 Travel time: ${localTravelHours} hours\n🎯 Strategy: ${strategy.name}\n📍 Route: ${previousCity} to ${currentCity}\n🗺️ Starting point optimized routing`,
                is_confirmed: false
              }
              
              generatedActivities.push(travelActivity)
              console.log(`🚗 [AI Itinerary] Created travel activity: ${previousCity} → ${currentCity} (${localTravelHours}h) - Different cities`)
              
              currentTime = travelEndTimeMinutes
            } else {
              // Short travel - just add buffer time
              currentTime += 30 // 30 minutes buffer for short trips
              console.log(`🚙 [AI Itinerary] Short travel: ${previousCity} → ${currentCity} (${localTravelHours}h) - Buffer added`)
            }
          } else {
            // Same city - no travel activity needed, just add meeting buffer
            currentTime += 15 // 15 minutes buffer between same-city meetings
            console.log(`🏙️ [AI Itinerary] Same city: ${previousCompany.name} → ${currentCompany.name} in ${currentCity} (no travel activity)`)
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
  const handleExtendTrip = (direction: 'before' | 'after') => {
    if (!formData.startDate || !formData.endDate) return

    const newStartDate = new Date(formData.startDate)
    const newEndDate = new Date(formData.endDate)

    if (direction === 'before') {
      newStartDate.setDate(newStartDate.getDate() - 1)
    } else {
      newEndDate.setDate(newEndDate.getDate() + 1)
    }

    updateFormData({
      startDate: newStartDate,
      endDate: newEndDate
    })
  }

  // Handle activity creation from time slot click
  const handleActivityCreate = (timeSlot: string, date: string) => {
    setSelectedActivity({
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
    } as Activity)
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
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
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
            <span className="text-blue-700 dark:text-blue-300 font-medium">Activities:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">{activities.length}</span>
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
    </div>
  )
}