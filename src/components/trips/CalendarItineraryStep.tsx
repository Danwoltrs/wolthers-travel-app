import React, { useState, useEffect, useMemo } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Clock, MapPin, Wand2, Loader2, Plus, AlertCircle } from 'lucide-react'
import { OutlookCalendar } from '@/components/dashboard/OutlookCalendar'
import { useActivityManager, type Activity, type ActivityFormData } from '@/hooks/useActivityManager'
import type { TripCard } from '@/types'
import { OptimizedDndProvider } from '@/components/shared/OptimizedDndProvider'

interface CalendarItineraryStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

export default function CalendarItineraryStep({ formData, updateFormData }: CalendarItineraryStepProps) {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)

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
    companies: formData.companies || [],
    staff: formData.wolthersStaff || [],
    hotels: [],
    flights: []
  }), [formData])

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

  // Generate initial AI itinerary when component mounts and we have required data
  useEffect(() => {
    if (!hasGeneratedInitial && formData.companies && formData.companies.length > 0 && formData.startDate && formData.endDate) {
      generateInitialAIItinerary()
      setHasGeneratedInitial(true)
    }
  }, [formData.companies, formData.startDate, formData.endDate, hasGeneratedInitial])

  const generateInitialAIItinerary = async () => {
    if (!formData.companies || formData.companies.length === 0) {
      console.log('No companies selected, skipping AI generation')
      return
    }

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tripTitle: formData.title,
          companies: formData.companies,
          startDate: formData.startDate?.toISOString().split('T')[0],
          endDate: formData.endDate?.toISOString().split('T')[0],
          tripId: mockTrip.id,
          preferences: {
            additionalNotes: formData.description,
            includeTransitTimes: true,
            optimizeRoute: true
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Generated AI itinerary:', result)
        
        // The AI API should create activities directly in the database
        // Force refresh to load the new activities
        await forceRefreshActivities()
      } else {
        console.error('Failed to generate AI itinerary:', response.status)
      }
    } catch (error) {
      console.error('AI itinerary generation error:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleExtendTrip = (direction: 'before' | 'after') => {
    if (!formData.startDate || !formData.endDate) return

    const newStartDate = new Date(formData.startDate)
    const newEndDate = new Date(formData.endDate)

    if (direction === 'before') {
      newStartDate.setDate(newStartDate.getDate() - 1)
      updateFormData({ startDate: newStartDate })
    } else {
      newEndDate.setDate(newEndDate.getDate() + 1)
      updateFormData({ endDate: newEndDate })
    }
  }

  const handleActivityCreate = async (timeSlot: string, date: string) => {
    try {
      const newActivity = await createActivity({
        title: 'New Activity',
        description: '',
        activity_date: date,
        start_time: timeSlot,
        end_time: addHoursToTime(timeSlot, 1), // Default 1 hour duration
        activity_type: 'meeting' as const,
        location: '',
        company_id: null,
        trip_id: mockTrip.id
      })

      if (newActivity) {
        setSelectedActivity(newActivity)
      }
    } catch (error) {
      console.error('Failed to create activity:', error)
    }
  }

  const handleActivityEdit = (activity: Activity) => {
    setSelectedActivity(activity)
  }

  // Helper function to add hours to a time string
  const addHoursToTime = (timeStr: string, hours: number): string => {
    const [hoursStr, minutes] = timeStr.split(':')
    const currentHours = parseInt(hoursStr, 10)
    const newHours = (currentHours + hours) % 24
    return `${newHours.toString().padStart(2, '0')}:${minutes}`
  }

  // Calculate completion percentage based on activities created
  const completionPercentage = useMemo(() => {
    const totalDays = formData.startDate && formData.endDate 
      ? Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0
    
    const activitiesCount = activities.length
    const expectedActivitiesPerDay = 3 // Average activities per day
    const expectedTotal = totalDays * expectedActivitiesPerDay
    
    return Math.min(100, Math.round((activitiesCount / Math.max(expectedTotal, 1)) * 100))
  }, [activities.length, formData.startDate, formData.endDate])

  // Update form data with activities whenever activities change
  useEffect(() => {
    updateFormData({
      itinerary: activities.map(activity => ({
        id: activity.id,
        date: activity.activity_date,
        time: activity.start_time,
        title: activity.title,
        description: activity.description || '',
        location: activity.location || '',
        company: activity.company_name || '',
        duration: calculateDurationMinutes(activity.start_time, activity.end_time || addHoursToTime(activity.start_time, 1))
      }))
    })
  }, [activities])

  const calculateDurationMinutes = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes
    
    return endTotalMinutes - startTotalMinutes
  }

  return (
    <OptimizedDndProvider>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Build Your Itinerary
                </h3>
                <p className="text-sm text-gray-600">
                  Drag and drop activities to create your perfect trip schedule
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!hasGeneratedInitial && formData.companies && formData.companies.length > 0 && (
                <button
                  onClick={generateInitialAIItinerary}
                  disabled={isGeneratingAI}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              )}
              
              <div className="text-sm text-gray-600">
                Progress: {completionPercentage}%
              </div>
            </div>
          </div>
          
          {/* Status Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{activities.length}</div>
              <div className="text-sm text-gray-600">Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formData.companies?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formData.startDate && formData.endDate 
                  ? Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  : 0
                }
              </div>
              <div className="text-sm text-gray-600">Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formData.wolthersStaff?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Team Members</div>
            </div>
          </div>
        </div>

        {/* AI Generation Status */}
        {isGeneratingAI && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <h4 className="font-medium text-blue-900">Generating AI Itinerary</h4>
                <p className="text-sm text-blue-700">
                  Creating optimized activities based on your selected companies and dates...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGeneratingAI && activities.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Activities Yet</h4>
            <p className="text-gray-600 mb-4">
              {formData.companies && formData.companies.length > 0 
                ? "Click 'Generate AI Itinerary' to automatically create activities based on your selected companies."
                : "Select companies first, then generate an AI itinerary or add activities manually by clicking on time slots."}
            </p>
            {formData.companies && formData.companies.length === 0 && (
              <div className="flex items-center justify-center space-x-2 text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                <span>Go back to select companies for your trip first</span>
              </div>
            )}
          </div>
        )}

        {/* Calendar Component */}
        {(activities.length > 0 || isGeneratingAI) && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
              forceRefreshActivities={forceRefreshActivities}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-2">How to use the calendar:</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Click on any time slot to add a new activity</li>
            <li>• Drag activities between time slots and days to reschedule</li>
            <li>• Click on activities to edit their details</li>
            <li>• Use the + buttons to extend your trip by adding days</li>
            <li>• AI will automatically calculate travel times between locations</li>
          </ul>
        </div>
      </div>
    </OptimizedDndProvider>
  )
}