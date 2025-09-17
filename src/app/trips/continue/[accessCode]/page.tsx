'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Clock, User, Calendar, Building2 } from 'lucide-react'
import TripCreationModal from '@/components/trips/TripCreationModal'
import { TripFormData } from '@/components/trips/TripCreationModal'

interface ContinueTripData {
  success: boolean
  trip?: any
  draft?: any
  currentStep: number
  canEdit: boolean
  permissions: string[]
  message: string
}

export default function ContinueTripPage() {
  const params = useParams()
  const router = useRouter()
  const accessCode = params?.accessCode as string

  const [tripData, setTripData] = useState<ContinueTripData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (accessCode) {
      loadTripData()
    }
  }, [accessCode])

  const loadTripData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/continue/${accessCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Use cookie-based authentication
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: ContinueTripData = await response.json()
      
      if (!data.success) {
        setError(data.message || 'Failed to load trip')
        return
      }

      setTripData(data)

    } catch (error) {
      console.error('Failed to load trip:', error)
      setError(error instanceof Error ? error.message : 'Failed to load trip')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueEditing = () => {
    // Open the trip creation modal directly with the loaded data
    setShowModal(true)
  }
  
  // Convert trip data back to TripFormData format
  const convertToFormData = (tripOrDraft: any): TripFormData => {
    const trip = tripOrDraft.trip || tripOrDraft
    const stepData = trip?.step_data || {}

    console.log('🔄 [Continue Trip] Converting trip data to form data:', {
      hasTrip: !!trip,
      title: trip?.title,
      type: trip?.trip_type,
      startDate: trip?.start_date,
      endDate: trip?.end_date,
      hasStepData: !!stepData,
      stepDataKeys: Object.keys(stepData)
    })

    // Combine trip data with stepData (stepData takes precedence for form fields)
    return {
      tripType: trip?.trip_type || stepData?.tripType || 'in_land',
      title: stepData?.title || trip?.title || '',
      description: stepData?.description || trip?.description || '',
      subject: stepData?.subject || trip?.subject || '',
      startDate: stepData?.startDate ? new Date(stepData.startDate) :
                 (trip?.start_date ? new Date(trip.start_date) : new Date()),
      endDate: stepData?.endDate ? new Date(stepData.endDate) :
               (trip?.end_date ? new Date(trip.end_date) : new Date()),
      accessCode: stepData?.accessCode || trip?.access_code || accessCode,

      // Form-specific data from stepData
      companies: stepData?.companies || [],
      hostCompanies: stepData?.hostCompanies || [],
      participants: stepData?.participants || stepData?.wolthersStaff || [],
      wolthersStaff: stepData?.wolthersStaff || stepData?.participants || [],
      participantsWithDates: stepData?.participantsWithDates || [],
      drivers: stepData?.drivers || [],
      vehicles: stepData?.vehicles || [],

      // Location and itinerary data
      startingPoint: stepData?.startingPoint || 'santos',
      endingPoint: stepData?.endingPoint || '',
      customStartingPoint: stepData?.customStartingPoint || '',
      customEndingPoint: stepData?.customEndingPoint || '',

      // Flight and destination data
      flightInfo: stepData?.flightInfo || null,
      destinationAddress: stepData?.destinationAddress || '',
      nextDestination: stepData?.nextDestination || 'hotel',

      // Generated activities and itinerary
      generatedActivities: stepData?.generatedActivities || [],
      itineraryDays: stepData?.itineraryDays || [],

      // Meeting and booking data
      meetings: stepData?.meetings || [],
      hotels: stepData?.hotels || [],
      flights: stepData?.flights || [],

      // Additional metadata
      estimatedBudget: stepData?.estimatedBudget || trip?.estimated_budget,
      notes: stepData?.notes || '',

      // Convention-specific data
      selectedConvention: stepData?.selectedConvention || null,
      eventCode: stepData?.eventCode || '',

      // Vehicle assignments (legacy support)
      vehicleAssignments: stepData?.vehicleAssignments || []
    }
  }

  const handleTripCreated = (trip: any) => {
    // Redirect to the trip page or dashboard
    router.push('/dashboard')
  }

  const handleModalClose = () => {
    setShowModal(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getProgressPercentage = (step: number) => {
    // Assuming 5 total steps
    return Math.round((step / 5) * 100)
  }

  const getStepName = (step: number, tripType?: string) => {
    if (tripType === 'convention') {
      const steps = ['Trip Type', 'Event Search', 'Basic Information', 'Team & Travel', 'Review & Create']
      return steps[step - 1] || 'Unknown Step'
    } else if (tripType === 'in_land') {
      const steps = ['Trip Type', 'Basic Information', 'Itinerary Builder', 'Team & Vehicles', 'Review & Create']
      return steps[step - 1] || 'Unknown Step'
    }
    return 'Step ' + step
  }

  // Convert trip/draft data to TripFormData format
  const getFormDataFromTrip = (): TripFormData => {
    if (!tripData) {
      return {
        tripType: null,
        title: '',
        description: '',
        subject: '',
        companies: [],
        participants: [],
        startDate: null,
        endDate: null,
        estimatedBudget: undefined,
        itineraryDays: [],
        wolthersStaff: [],
        drivers: [],
        vehicles: []
      }
    }

    const trip = tripData.trip
    const draft = tripData.draft
    const stepData = trip?.step_data || draft?.draft_data || {}

    return {
      tripType: trip?.trip_type || draft?.trip_type || null,
      title: trip?.title || stepData.title || '',
      description: trip?.description || stepData.description || '',
      subject: trip?.subject || stepData.subject || '',
      companies: stepData.companies || [],
      participants: stepData.participants || [],
      startDate: trip?.start_date ? new Date(trip.start_date) : (stepData.startDate ? new Date(stepData.startDate) : null),
      endDate: trip?.end_date ? new Date(trip.end_date) : (stepData.endDate ? new Date(stepData.endDate) : null),
      estimatedBudget: trip?.estimated_budget || stepData.estimatedBudget,
      itineraryDays: stepData.itineraryDays || [],
      wolthersStaff: stepData.wolthersStaff || [],
      drivers: stepData.drivers || [],
      vehicles: stepData.vehicles || []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trip...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Trip Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!tripData) {
    return null
  }

  const trip = tripData.trip
  const progressPercentage = getProgressPercentage(tripData.currentStep)
  const stepName = getStepName(tripData.currentStep, trip?.trip_type)

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <span>Continue Trip Creation</span>
              <span className="mx-2">•</span>
              <span>Access Code: {accessCode}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {trip?.title || 'Untitled Trip'}
            </h1>
            {trip?.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {trip.description}
              </p>
            )}
          </div>

          {/* Trip Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Creation Progress
              </h2>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                <span>Step {tripData.currentStep} of 5</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stepName}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {progressPercentage}% complete
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Trip Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {trip?.start_date && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Start Date</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(trip.start_date)}
                    </p>
                  </div>
                </div>
              )}

              {trip?.end_date && (
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">End Date</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(trip.end_date)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Trip Type</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {trip?.trip_type?.replace('_', ' ') || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {trip?.is_draft ? 'Draft' : 'Active'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Ready to Continue?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {tripData.canEdit 
                  ? `Pick up where you left off at step ${tripData.currentStep}.`
                  : 'You have view-only access to this trip.'
                }
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {tripData.canEdit ? (
                  <button
                    onClick={handleContinueEditing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    Continue Editing
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <div className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg">
                    View-only access - Contact trip creator to request edit permissions
                  </div>
                )}
                
                <button
                  onClick={() => router.push('/dashboard')}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View in Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Creation Modal */}
      {showModal && (
        <TripCreationModal
          isOpen={showModal}
          onClose={handleModalClose}
          onTripCreated={handleTripCreated}
          resumeData={{
            tripId: trip?.id,
            formData: convertToFormData(tripData),
            currentStep: tripData.currentStep
          }}
        />
      )}
    </>
  )
}