import React, { useState, useEffect, useMemo } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Clock, MapPin, Wand2, Loader2, Plus, AlertCircle, Car, Route } from 'lucide-react'
import { OutlookCalendar } from '@/components/dashboard/OutlookCalendar'
import { useActivityManager, type Activity, type ActivityFormData } from '@/hooks/useActivityManager'
import type { TripCard, Company } from '@/types'
import { OptimizedDndProvider } from '@/components/shared/OptimizedDndProvider'

interface CalendarScheduleStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface TravelTimeData {
  fromLocation: string
  toLocation: string
  duration: number // minutes
  distance: number // kilometers
  mode: 'driving' | 'walking' | 'transit'
}

interface EnhancedActivity extends Activity {
  travelTimeBefore?: TravelTimeData
  participantIds?: string[] // Which participants attend this activity
  hostCompanyId?: string // Which host company this activity is at
  teamLeadId?: string // Wolthers team lead for this activity
}

export default function CalendarScheduleStep({ formData, updateFormData }: CalendarScheduleStepProps) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isCalculatingTravelTimes, setIsCalculatingTravelTimes] = useState(false)
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<EnhancedActivity | null>(null)
  const [travelOptimization, setTravelOptimization] = useState<'time' | 'distance'>('time')
  const [showTravelTimes, setShowTravelTimes] = useState(true)

  // Get host companies and participants for activity assignment
  const hostCompanies = formData.hostCompanies || []
  const participants = formData.participants || []
  const buyerCompanies = formData.companies || []

  // Convert formData to TripCard format expected by OutlookCalendar
  const mockTrip: TripCard = useMemo(() => ({
    id: 'temp-trip-' + Date.now(),
    title: formData.title || 'New Trip',
    description: formData.description || '',
    startDate: formData.startDate ? formData.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: 'planning' as const,
    progress: 0,
    daysRemaining: Math.ceil((new Date(formData.endDate || new Date()).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
    accessCode: formData.accessCode || 'TEMP-CODE',
    companies: hostCompanies, // Use host companies for calendar
    staff: participants,
    hotels: [],
    flights: []
  }), [formData, hostCompanies, participants])

  // Initialize activity manager for this temporary trip
  const {
    activities,
    loading,
    error,
    refreshing,
    updateActivity,
    updateActivityDebounced,
    getActivitiesByDate,
    createActivity,
    deleteActivity,
    forceRefreshActivities
  } = useActivityManager(mockTrip.id)

  // Google Maps API integration for travel time calculation
  const calculateTravelTime = async (origin: string, destination: string): Promise<TravelTimeData | null> => {
    try {
      // This would integrate with your existing Google Maps service
      const response = await fetch('/api/google-maps/distance-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          origins: [origin],
          destinations: [destination],
          mode: 'driving',
          units: 'metric'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate travel time')
      }

      const data = await response.json()
      
      if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0]
        return {
          fromLocation: origin,
          toLocation: destination,
          duration: Math.ceil(element.duration.value / 60), // Convert seconds to minutes
          distance: Math.ceil(element.distance.value / 1000), // Convert meters to kilometers
          mode: 'driving'
        }
      }

      return null
    } catch (error) {
      console.error('Error calculating travel time:', error)
      return null
    }
  }

  // Calculate travel times for all activities
  const calculateAllTravelTimes = async () => {
    if (activities.length < 2) return

    setIsCalculatingTravelTimes(true)
    
    try {
      const sortedActivities = [...activities].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`)
        const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`)
        return dateA.getTime() - dateB.getTime()
      })

      const updatedActivities: EnhancedActivity[] = []

      for (let i = 0; i < sortedActivities.length; i++) {
        const currentActivity = sortedActivities[i] as EnhancedActivity
        const previousActivity = i > 0 ? sortedActivities[i - 1] as EnhancedActivity : null

        if (previousActivity && previousActivity.location && currentActivity.location) {
          // Calculate travel time from previous activity to current one
          const travelTime = await calculateTravelTime(
            previousActivity.location,
            currentActivity.location
          )

          if (travelTime) {
            currentActivity.travelTimeBefore = travelTime
          }
        }

        updatedActivities.push(currentActivity)
      }

      // Update activities with travel time data
      for (const activity of updatedActivities) {
        if (activity.travelTimeBefore) {
          await updateActivity(activity.id, {
            travelTimeBefore: activity.travelTimeBefore
          })
        }
      }

    } catch (error) {
      console.error('Error calculating travel times:', error)
    } finally {
      setIsCalculatingTravelTimes(false)
    }
  }

  // Auto-generate travel time activities
  const insertTravelActivities = async () => {
    const sortedActivities = [...activities].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`)
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })

    for (let i = 1; i < sortedActivities.length; i++) {
      const currentActivity = sortedActivities[i] as EnhancedActivity
      const previousActivity = sortedActivities[i - 1] as EnhancedActivity

      if (currentActivity.travelTimeBefore && currentActivity.travelTimeBefore.duration > 15) {
        // Only create travel activities for trips longer than 15 minutes
        const travelStartTime = new Date(`${currentActivity.date}T${currentActivity.startTime || '00:00'}`)
        travelStartTime.setMinutes(travelStartTime.getMinutes() - currentActivity.travelTimeBefore.duration - 10) // 10min buffer

        const travelEndTime = new Date(travelStartTime)
        travelEndTime.setMinutes(travelEndTime.getMinutes() + currentActivity.travelTimeBefore.duration)

        const travelActivity: ActivityFormData = {
          title: `Travel to ${currentActivity.title}`,
          description: `Drive from ${currentActivity.travelTimeBefore.fromLocation} to ${currentActivity.travelTimeBefore.toLocation}`,
          date: currentActivity.date,
          startTime: travelStartTime.toTimeString().slice(0, 5),
          endTime: travelEndTime.toTimeString().slice(0, 5),
          location: `En route: ${currentActivity.travelTimeBefore.fromLocation} → ${currentActivity.travelTimeBefore.toLocation}`,
          activityType: 'travel',
          priority: 'medium',
          notes: `Distance: ${currentActivity.travelTimeBefore.distance}km, Duration: ${currentActivity.travelTimeBefore.duration}min`,
          visibility_level: 'all'
        }

        await createActivity(travelActivity)
      }
    }
  }

  // Generate AI-powered itinerary with travel optimization
  const generateAIItinerary = async () => {
    if (!formData.hostCompanies || formData.hostCompanies.length === 0) {
      return
    }

    setIsGeneratingAI(true)

    try {
      // Generate activities based on host companies and participant assignments
      const generatedActivities: ActivityFormData[] = []

      for (const hostCompany of formData.hostCompanies) {
        // Create a visit activity for each host company
        const visitDuration = 4 // Default 4 hours
        const startTime = '09:00'
        const endTime = '13:00'

        const activity: ActivityFormData = {
          title: `Visit ${hostCompany.name}`,
          description: `Business meeting and facility tour at ${hostCompany.name}`,
          date: formData.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          startTime,
          endTime,
          location: hostCompany.address || hostCompany.name,
          activityType: 'meeting',
          priority: 'high',
          notes: `Host company visit - ${hostCompany.name}`,
          visibility_level: 'all'
        }

        generatedActivities.push(activity)
      }

      // Create activities in batches to avoid overwhelming the system
      for (const activityData of generatedActivities) {
        await createActivity(activityData)
      }

      // Calculate travel times after activities are created
      setTimeout(async () => {
        await calculateAllTravelTimes()
        await insertTravelActivities()
      }, 1000)

      setHasGeneratedInitial(true)
    } catch (error) {
      console.error('Error generating AI itinerary:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Activity creation with participant assignment
  const createActivityWithParticipants = async (activityData: ActivityFormData & {
    participantIds?: string[]
    hostCompanyId?: string
    teamLeadId?: string
  }) => {
    const enhancedActivity: ActivityFormData = {
      ...activityData,
      // Store participant assignments in notes or custom fields
      notes: `${activityData.notes || ''}\nParticipants: ${activityData.participantIds?.join(', ') || 'All'}\nTeam Lead: ${activityData.teamLeadId || 'TBD'}\nHost Company: ${activityData.hostCompanyId || 'N/A'}`
    }

    return await createActivity(enhancedActivity)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
          Calendar Schedule with Travel Optimization
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Create your itinerary with AI-powered route optimization and automatic travel time calculations.
        </p>
      </div>

      {/* Travel Optimization Controls */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-medium text-gray-900 dark:text-golden-400">
            Travel Optimization Settings
          </h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowTravelTimes(!showTravelTimes)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                showTravelTimes 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-200 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300'
              }`}
            >
              {showTravelTimes ? 'Hide' : 'Show'} Travel Times
            </button>
            <button
              onClick={calculateAllTravelTimes}
              disabled={isCalculatingTravelTimes || activities.length < 2}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
            >
              {isCalculatingTravelTimes ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Route className="w-4 h-4" />
                  <span>Calculate Travel Times</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Optimization Priority
            </label>
            <select
              value={travelOptimization}
              onChange={(e) => setTravelOptimization(e.target.value as 'time' | 'distance')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
            >
              <option value="time">Minimize Travel Time</option>
              <option value="distance">Minimize Distance</option>
            </select>
          </div>
          <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Car className="w-5 h-5 mr-2" />
            Google Maps Integration
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={insertTravelActivities}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
            >
              Auto-Insert Travel Activities
            </button>
          </div>
        </div>
      </div>

      {/* AI Generation */}
      {!hasGeneratedInitial && hostCompanies.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2">
                AI Itinerary Generation
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Generate an optimized itinerary based on your host companies and participant assignments.
              </p>
            </div>
            <button
              onClick={generateAIItinerary}
              disabled={isGeneratingAI}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate AI Itinerary</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                Route Optimization
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Component with Travel Time Display */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        <OptimizedDndProvider>
          <OutlookCalendar 
            trip={mockTrip}
            showTimeConflicts={true}
            showTravelTimes={showTravelTimes}
            onActivityCreate={createActivityWithParticipants}
            onActivityUpdate={updateActivity}
            onActivityDelete={deleteActivity}
          />
        </OptimizedDndProvider>
      </div>

      {/* Participant Assignment Panel */}
      {selectedActivity && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
            Activity Participants & Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Participant Assignment */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                Participating Buyer Companies
              </h4>
              <div className="space-y-2">
                {buyerCompanies.map((company) => (
                  <label key={company.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {company.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Team Lead Assignment */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                Wolthers Team Lead
              </h4>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
                <option value="">Select team lead...</option>
                {participants.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name || staff.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}