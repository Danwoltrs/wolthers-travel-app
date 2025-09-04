import React, { useState, useEffect, useMemo } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Clock, MapPin, Wand2, Loader2, Plus, AlertCircle } from 'lucide-react'
import { OutlookCalendar } from '@/components/dashboard/OutlookCalendar'
import { useActivityManager, type Activity, type ActivityFormData } from '@/hooks/useActivityManager'
import type { TripCard } from '@/types'
import { ActivitySplitModal } from './ActivitySplitModal'

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
    staff: formData.participants || [],
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
    if (!hasGeneratedInitial && hostCompanies.length > 0 && formData.startDate && formData.endDate) {
      generateInitialAIItinerary()
      setHasGeneratedInitial(true)
    }
  }, [hostCompanies, formData.startDate, formData.endDate, hasGeneratedInitial])

  const generateInitialAIItinerary = async () => {
    if (!hostCompanies || hostCompanies.length === 0) {
      console.log('No host companies selected, skipping AI generation')
      return
    }

    setIsGeneratingAI(true)
    try {
      // Generate activities based on host companies
      const generatedActivities: ActivityFormData[] = []

      hostCompanies.forEach((hostCompany, index) => {
        // Create a visit activity for each host company
        const dayIndex = index % Math.max(1, Math.ceil((formData.endDate!.getTime() - formData.startDate!.getTime()) / (1000 * 60 * 60 * 24)))
        const activityDate = new Date(formData.startDate!)
        activityDate.setDate(activityDate.getDate() + dayIndex)

        const activity: ActivityFormData = {
          title: `Visit ${hostCompany.name}`,
          description: `Business meeting and facility tour at ${hostCompany.name}`,
          date: activityDate.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '13:00',
          location: hostCompany.address || hostCompany.name,
          activityType: 'meeting',
          priority: 'high',
          notes: `Host company visit - ${hostCompany.name}`,
          visibility_level: 'all'
        }

        generatedActivities.push(activity)
      })

      // Create activities in the database
      for (const activityData of generatedActivities) {
        await createActivity(activityData)
      }

      setHasGeneratedInitial(true)
    } catch (error) {
      console.error('Error generating AI itinerary:', error)
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-2">
          Calendar Schedule
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Create your itinerary by adding activities to the calendar below.
        </p>
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
                Generate an optimized itinerary based on your host companies.
              </p>
            </div>
            <button
              onClick={generateInitialAIItinerary}
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