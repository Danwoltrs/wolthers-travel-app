import React, { useState, useEffect, useMemo } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Clock, MapPin, Wand2, Loader2, Plus, AlertCircle, Navigation } from 'lucide-react'
import { OutlookCalendar } from '@/components/dashboard/OutlookCalendar'
import { useActivityManager, type Activity, type ActivityFormData } from '@/hooks/useActivityManager'
import type { TripCard } from '@/types'
import ActivitySplitModal from './ActivitySplitModal'
import { loadGoogleMapsAPI, geocodeLocation, optimizeRoute, calculateTravelTime, formatDuration, type Location } from '@/lib/google-maps-utils'
import { detectLocationFromAddress, getRegionByCity } from '@/lib/brazilian-locations'

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

      // Group locations by coffee regions for better travel optimization
      console.log('🗺️ [AI Itinerary] Grouping companies by coffee regions...')
      const locationsByRegion = new Map<string, (Location & { company: any })[]>()
      
      for (const location of locations) {
        const company = location.company
        let region = 'Other'
        
        // Try to detect coffee region from company address/city
        const address = company.address || `${company.city || ''} ${company.state || ''}`.trim()
        if (address) {
          const detectedLocation = detectLocationFromAddress(address)
          if (detectedLocation?.coffeeRegion) {
            region = detectedLocation.coffeeRegion
          } else if (company.city) {
            const cityRegion = getRegionByCity(company.city, company.state)
            if (cityRegion && cityRegion !== 'Brasil') {
              region = cityRegion
            }
          }
        }
        
        if (!locationsByRegion.has(region)) {
          locationsByRegion.set(region, [])
        }
        locationsByRegion.get(region)!.push(location)
        
        console.log(`📍 [AI Itinerary] ${company.name} assigned to region: ${region}`)
      }
      
      // Optimize route within each region, then combine regions efficiently
      console.log('🚗 [AI Itinerary] Optimizing travel route by regions...')
      let optimizedLocations: (Location & { company: any })[] = []
      
      const regionNames = Array.from(locationsByRegion.keys()).sort()
      for (const regionName of regionNames) {
        const regionLocations = locationsByRegion.get(regionName)!
        if (regionLocations.length > 1) {
          // Optimize within region
          const optimizedRegionLocations = await optimizeRoute(regionLocations)
          optimizedLocations.push(...optimizedRegionLocations)
        } else {
          optimizedLocations.push(...regionLocations)
        }
        console.log(`🗺️ [AI Itinerary] Optimized ${regionLocations.length} companies in ${regionName}`)
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
        
        // Add travel time from previous location (except for first location)
        if (i > 0) {
          const travelMinutes = Math.ceil(travelTimes[i - 1] / 60) + 30 // Add 30min buffer
          currentTime += travelMinutes
          
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

        // Create visit activity
        const startTime = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`
        const visitDuration = 4 * 60 // 4 hours default
        const endTimeMinutes = currentTime + visitDuration
        const endTime = `${Math.floor(endTimeMinutes / 60).toString().padStart(2, '0')}:${(endTimeMinutes % 60).toString().padStart(2, '0')}`

        const travelNote = i > 0 ? `\n🚗 Travel time from previous location: ${formatDuration(travelTimes[i - 1])}` : ''
        
        const activity: ActivityFormData = {
          title: `Visit ${company.fantasy_name || company.name}`,
          description: `Business meeting and facility tour at ${company.name}${travelNote}`,
          activity_date: currentDate.toISOString().split('T')[0], // Fix: use activity_date not date
          start_time: startTime, // Fix: use start_time not startTime
          end_time: endTime, // Fix: use end_time not endTime
          location: location.address || location.name,
          type: 'meeting', // Fix: use type not activityType
          notes: `🏢 Host company visit\n📍 Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}${travelNote}`,
          is_confirmed: false
        }

        generatedActivities.push(activity)
        console.log(`📅 [AI Itinerary] Created activity: ${activity.title} on ${activity.activity_date} from ${startTime} to ${endTime}`)
        
        // Update current time for next activity
        currentTime = endTimeMinutes + 60 // Add 1 hour break
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
                Creating optimized itinerary with Google Maps travel time calculations...
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                {hostCompanies.length} Host Companies
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300">
                Route Optimization
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
                Smart Scheduling
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