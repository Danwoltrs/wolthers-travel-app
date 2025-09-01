import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, X, Plus, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useDialogs } from '@/hooks/use-modal'
import TripTypeSelection, { TripType } from './TripTypeSelection'
import { CoffeeEventCarousel } from '../trip/CoffeeEventCarousel'
import BasicInfoStep from './BasicInfoStep'
import EnhancedItineraryBuilderStep from './EnhancedItineraryBuilderStep'
import MeetingAgendaStep from './MeetingAgendaStep'
import HotelBookingStep from './HotelBookingStep'
import FlightBookingStep from './FlightBookingStep'
import dynamic from 'next/dynamic'

// Dynamically import TeamVehicleStep to prevent SSR issues
const TeamVehicleStep = dynamic(() => import('./TeamVehicleStep'), {
  ssr: false,
  loading: () => (
    <div className="space-y-8">
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading team assignment...</div>
      </div>
    </div>
  )
})
import ReviewStep from './ReviewStep'
import type { 
  Company, 
  User, 
  Vehicle, 
  Activity, 
  ItineraryDay, 
  CalendarEvent, 
  CompanyWithLocations 
} from '@/types'

// Define additional data types for hotels, flights, and meetings
interface Hotel {
  id: string
  name: string
  address: string
  checkInDate: string
  checkOutDate: string
  nights: number
  cost?: number
  notes?: string
}

interface Flight {
  id: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    city: string
    date: string
    time: string
  }
  arrival: {
    airport: string
    city: string
    date: string
    time: string
  }
  cost?: number
  bookingReference?: string
  notes?: string
}

interface Meeting {
  id: string
  title: string
  type: 'conference_session' | 'networking' | 'presentation' | 'meeting' | 'other'
  date: string
  startTime: string
  endTime: string
  location: string
  attendees: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  notes?: string
}

export interface TripFormData {
  // Step 0: Trip Type
  tripType: TripType | null
  
  // Step 1: Basic Information
  title: string
  description: string
  subject: string
  companies: Company[]
  participants: User[]
  startDate: Date | null
  endDate: Date | null
  accessCode?: string  // Generated and optional trip code
  // Estimated Budget is now hidden and optional, commented out
  // estimatedBudget?: number
  
  // Step 2: Itinerary
  itineraryDays: ItineraryDay[]
  
  // Step 3: Team & Vehicles
  wolthersStaff: User[]
  vehicles: Vehicle[]
  
  // Step 4-6: Conference-specific data
  meetings?: CalendarEvent[]
  hotels?: Hotel[]
  flights?: Flight[]
  
  // Enhanced data for cost tracking and company integration
  companies?: CompanyWithLocations[]
}

interface SaveStatus {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  tripId?: string
  accessCode?: string
  continueUrl?: string
}

interface TripCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onTripCreated?: (trip: any) => void
  resumeData?: {
    tripId?: string
    formData: TripFormData
    currentStep: number
  }
}

const initialFormData: TripFormData = {
  tripType: null,
  title: '',
  description: '',
  subject: '',
  companies: [],
  participants: [],
  startDate: null,
  endDate: null,
  // Estimated Budget is hidden, commented out
  // estimatedBudget: undefined,
  itineraryDays: [],
  wolthersStaff: [],
  vehicles: [],
  meetings: [],
  hotels: [],
  flights: []
}

// Dynamic steps based on trip type
const getStepsForTripType = (tripType: TripType | null) => {
  if (tripType === 'convention') {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' },
      { id: 2, name: 'Event Search', description: 'Find your convention or event' },
      { id: 3, name: 'Basic Information', description: 'Trip details and attendees' },
      { id: 4, name: 'Meetings & Agenda', description: 'Plan conference sessions and meetings' },
      { id: 5, name: 'Hotels & Accommodation', description: 'Book hotels and lodging' },
      { id: 6, name: 'Flights & Travel', description: 'Arrange international flights and travel' },
      { id: 7, name: 'Team Assignment', description: 'Assign Wolthers staff and logistics' },
      { id: 8, name: 'Review & Create', description: 'Review and finalize trip' }
    ]
  } else if (tripType === 'in_land') {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' },
      { id: 2, name: 'Basic Information', description: 'Trip details and companies' },
      { id: 3, name: 'Meetings & Schedule', description: 'Plan meetings, visits, and appointments' },
      { id: 4, name: 'Itinerary Builder', description: 'Create daily activities and optimize routes' },
      { id: 5, name: 'Team & Vehicles', description: 'Assign staff and transportation' },
      { id: 6, name: 'Review & Create', description: 'Review and finalize trip' }
    ]
  } else {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' }
    ]
  }
}

export default function TripCreationModal({ isOpen, onClose, onTripCreated, resumeData }: TripCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(resumeData?.currentStep || 1)
  const [formData, setFormData] = useState<TripFormData>(resumeData?.formData || initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
    tripId: resumeData?.tripId
  })
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    // Get auto-save preference from localStorage, default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trip-creation-auto-save-enabled')
      return saved ? JSON.parse(saved) : true
    }
    return true
  })
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveDataRef = useRef<string>('')
  const { alert } = useDialogs()
  
  // Generate client temp ID for idempotent trip creation - use session storage to persist
  const clientTempIdRef = useRef<string>('')
  
  useEffect(() => {
    if (resumeData?.tripId) {
      clientTempIdRef.current = ''
    } else {
      // Check if we already have a temp ID in session storage
      const storedTempId = sessionStorage.getItem('trip-creation-temp-id')
      if (storedTempId) {
        clientTempIdRef.current = storedTempId
      } else {
        const newTempId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        clientTempIdRef.current = newTempId
        sessionStorage.setItem('trip-creation-temp-id', newTempId)
      }
    }
  }, [resumeData?.tripId])

  // Progressive save function
  const saveProgress = async (stepData: TripFormData, step: number, showNotification = false) => {
    if (!formData.tripType) return
    
    // For auto-save (showNotification = false), don't show UI notifications
    
    // Don't save if data hasn't changed
    const currentDataString = JSON.stringify({ stepData, step })
    if (currentDataString === lastSaveDataRef.current && saveStatus.tripId) {
      return
    }
    
    setSaveStatus(prev => ({ ...prev, isSaving: true, error: null }))
    
    try {
      // Use cookies for authentication instead of localStorage token
      // The httpOnly auth-token cookie will be sent automatically
      const response = await fetch('/api/trips/progressive-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          tripId: saveStatus.tripId,
          currentStep: step,
          stepData: stepData,
          completionPercentage: Math.round((step / steps.length) * 100),
          tripType: formData.tripType,
          accessCode: stepData.accessCode || formData.accessCode,
          clientTempId: clientTempIdRef.current
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('📋 Progressive save error response:', errorText)
        throw new Error(`Save failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      setSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        tripId: result.tripId,
        accessCode: result.accessCode,
        continueUrl: result.continueUrl,
        error: null
      }))
      
      lastSaveDataRef.current = currentDataString
      
      if (showNotification || (step === 3 && !saveStatus.tripId)) {
        setShowSaveNotification(true)
        setTimeout(() => setShowSaveNotification(false), 3000)
        
        // Show continuation URL for new trips
        if (step === 3 && result.continueUrl && !saveStatus.tripId) {
          console.log('Trip saved! Continue later at:', result.continueUrl)
        }
      }
      
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save progress'
      }))
    }
  }

  // Smart auto-save: Only update existing trips, never create new ones
  useEffect(() => {
    if (!autoSaveEnabled || !isOpen || !formData.tripType || currentStep < 3) {
      return
    }
    
    // Only auto-save if we already have a trip ID (from progressive save or resume)
    const existingTripId = saveStatus.tripId || resumeData?.tripId
    if (!existingTripId) {
      return // Don't auto-save until after first manual save creates the trip
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (only for updates)
    saveTimeoutRef.current = setTimeout(() => {
      if (existingTripId && !saveStatus.isSaving) {
        console.log('🔄 Auto-saving existing trip:', existingTripId)
        saveProgress(formData, currentStep, false) // false = don't show notification
      }
    }, 3000) // Auto-save after 3 seconds of no changes
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, currentStep, isOpen, autoSaveEnabled, saveStatus.tripId, saveStatus.isSaving])

  // Handle auto-save toggle change
  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled)
    localStorage.setItem('trip-creation-auto-save-enabled', JSON.stringify(enabled))
    
    if (!enabled && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  const steps = getStepsForTripType(formData.tripType)

  const updateFormData = (data: Partial<TripFormData>) => {
    // Special handling for predefined events
    if (data.selectedConvention && data.accessCode) {
      // When a predefined event is selected with an access code, preserve it
      console.log('🎯 Setting predefined event with access code:', data.accessCode)
      setFormData(prev => ({ ...prev, ...data }))
    } else {
      setFormData(prev => ({ ...prev, ...data }))
    }
  }

  const handleNext = async () => {
    if (currentStep < steps.length) {
      // Save progress before moving to next step
      await saveProgress(formData, currentStep, currentStep === 2) // Show notification on step 3 (when trip is created)
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // First save the final step data
      await saveProgress(formData, currentStep, false)
      
      // If we have a trip ID from progressive saves, finalize it
      if (saveStatus.tripId) {
        console.log('Finalizing existing trip:', saveStatus.tripId)
        
        const response = await fetch(`/api/trips/${saveStatus.tripId}/finalize`, {
          method: 'PATCH',
          credentials: 'include'
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to finalize trip')
        }
        
        const result = await response.json()
        console.log('Trip finalized successfully:', result)
        
        onTripCreated?.({ 
          id: saveStatus.tripId, 
          accessCode: saveStatus.accessCode,
          ...formData 
        })
        
        // Clear temp ID after successful creation
        sessionStorage.removeItem('trip-creation-temp-id')
      } else {
        // Create new trip directly if no progressive save occurred
        console.log('Creating new trip directly:', formData)
        
        const newTrip = {
          id: `trip-${Date.now()}`,
          ...formData,
          createdAt: new Date()
        }
        
        onTripCreated?.(newTrip)
      }
      
      handleClose()
    } catch (error) {
      console.error('Error finalizing trip:', error)
      await alert(`Failed to finalize trip: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Finalization Failed', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = async () => {
    // Save progress before closing if we have meaningful data
    if (formData.tripType && (currentStep > 2 || (currentStep === 2 && (formData.title || formData.companies.length > 0)))) {
      await saveProgress(formData, currentStep, false)
    }
    
    // Clear temp ID from session storage when modal is closed
    sessionStorage.removeItem('trip-creation-temp-id')
    
    setFormData(initialFormData)
    setCurrentStep(1)
    setSaveStatus({
      isSaving: false,
      lastSaved: null,
      error: null
    })
    onClose()
  }

  const canProceed = () => {
    if (!formData.tripType) {
      return currentStep === 1 ? false : formData.tripType !== null
    }

    if (formData.tripType === 'convention') {
      switch (currentStep) {
        case 1:
          return formData.tripType !== null
        case 2:
          return (formData as any).selectedConvention !== undefined
        case 3:
          return formData.title && formData.startDate && formData.endDate
        case 4:
          // Meetings & Agenda step - optional but allow proceeding
          return true
        case 5:
          // Hotels & Accommodation step - optional but allow proceeding
          return true
        case 6:
          // Flights & Travel step - optional but allow proceeding
          return true
        case 7:
          // Team Assignment step - require staff selection
          return formData.wolthersStaff.length > 0
        case 8:
          return true
        default:
          return false
      }
    } else if (formData.tripType === 'in_land') {
      switch (currentStep) {
        case 1:
          return formData.tripType !== null
        case 2:
          return formData.title && formData.companies.length > 0 && formData.startDate && formData.endDate
        case 3:
          // Meetings & Schedule step - for now, allow proceeding (implement validation later)
          return true
        case 4:
          return formData.itineraryDays.length > 0
        case 5:
          return formData.wolthersStaff.length > 0
        case 6:
          return true
        default:
          return false
      }
    }

    return false
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-none md:rounded-xl shadow-xl border-0 md:border border-pearl-200 dark:border-[#2a2a2a] w-full h-full md:h-auto md:max-w-7xl md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-pearl-200 dark:border-[#0a2e21] flex-shrink-0" style={{ backgroundColor: '#FBBF23' }}>
          <div className="flex items-center space-x-3">
            <Plus className="w-6 h-6" style={{ color: '#006D5B' }} />
            <h2 className="text-lg md:text-xl font-semibold" style={{ color: '#006D5B' }}>
              <span className="hidden sm:inline">
                {resumeData ? 'Continue Trip Creation' : 'Create New Trip'}
                {formData.tripType && currentStep > 1 && (
                  <span style={{ color: '#333333' }}> - {steps[currentStep - 1]?.name}</span>
                )}
              </span>
              <span className="sm:hidden">
                {resumeData ? 'Continue Trip' : 'New Trip'}
                {formData.tripType && currentStep > 1 && (
                  <span style={{ color: '#333333' }}> - {steps[currentStep - 1]?.name}</span>
                )}
              </span>
            </h2>
            {/* Save Status Indicator and Auto-save Toggle */}
            <div className="flex items-center space-x-1 md:space-x-3">
              {/* Save Status */}
              <div className="flex items-center space-x-1 md:space-x-2">
                {saveStatus.isSaving && (
                  <div className="flex items-center space-x-1" style={{ color: '#333333' }}>
                    <Save className="w-3 md:w-4 h-3 md:h-4 animate-pulse" />
                    <span className="text-xs md:text-sm hidden xs:inline">Saving...</span>
                  </div>
                )}
                {saveStatus.lastSaved && !saveStatus.isSaving && !saveStatus.error && (
                  <div className="flex items-center space-x-1" style={{ color: '#333333' }}>
                    <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />
                    <span className="text-xs md:text-sm hidden xs:inline">Saved {formatSaveTime(saveStatus.lastSaved)}</span>
                  </div>
                )}
                {saveStatus.error && (
                  <div className="flex items-center space-x-1 text-red-200">
                    <AlertCircle className="w-3 md:w-4 h-3 md:h-4" />
                    <span className="text-xs md:text-sm hidden xs:inline">Save failed</span>
                  </div>
                )}
              </div>

              {/* Auto-save Toggle - only show after step 3 when we can have a trip ID */}
              {currentStep >= 3 && (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <label className="flex items-center space-x-1 md:space-x-2 cursor-pointer" style={{ color: '#333333' }}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={(e) => handleAutoSaveToggle(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-6 md:w-8 h-3 md:h-4 rounded-full transition-colors ${
                        autoSaveEnabled 
                          ? 'bg-green-500' 
                          : 'bg-gray-400 dark:bg-gray-600'
                      }`}>
                        <div className={`w-2 md:w-3 h-2 md:h-3 bg-white rounded-full shadow-sm transition-transform transform ${
                          autoSaveEnabled ? 'translate-x-3 md:translate-x-4' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                    <span className="text-xs md:text-sm hidden sm:inline select-none">Auto-save</span>
                  </label>
                  {autoSaveEnabled && saveStatus.tripId && (
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" title="Auto-save active - Updates existing trip every 3 seconds"></div>
                  )}
                  {autoSaveEnabled && !saveStatus.tripId && (
                    <div className="w-1 h-1 bg-orange-400 rounded-full" title="Auto-save ready - Will activate after first manual save"></div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="transition-colors hover:opacity-80"
            style={{ color: '#006D5B' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>


        {/* Save Notification */}
        {showSaveNotification && (
          <div className="absolute top-20 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Progress saved successfully!</span>
            {saveStatus.continueUrl && currentStep === 3 && (
              <span className="text-xs opacity-90">You can continue later</span>
            )}
          </div>
        )}
        
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 lg:py-10 min-h-0 h-full">
          {/* Step 1: Trip Type Selection */}
          {currentStep === 1 && (
            <TripTypeSelection
              selectedType={formData.tripType}
              onTypeSelect={(type) => {
                updateFormData({ tripType: type })
                // Automatically proceed to next step
                setTimeout(() => {
                  setCurrentStep(2)
                }, 300) // Small delay for smooth transition
              }}
            />
          )}
          
          {/* Convention Trip Steps */}
          {formData.tripType === 'convention' && currentStep === 2 && (
            <CoffeeEventCarousel 
              formData={formData as any}
              updateFormData={updateFormData}
              onEventSelected={handleNext}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 3 && (
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 4 && (
            <MeetingAgendaStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 5 && (
            <HotelBookingStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 6 && (
            <FlightBookingStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 7 && (
            <TeamVehicleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 8 && (
            <ReviewStep formData={formData} />
          )}
          
          {/* In-land Trip Steps */}
          {formData.tripType === 'in_land' && currentStep === 2 && (
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Meetings & Schedule Planning
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Plan your meetings, client visits, facility tours, and appointments for this business trip.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="text-blue-600 dark:text-blue-400 mb-3">🤝</div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Client Meetings</h3>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Schedule meetings with clients, partners, and stakeholders along your route.
                      </p>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <div className="text-center">
                      <div className="text-green-600 dark:text-green-400 mb-3">🏭</div>
                      <h3 className="font-medium text-green-900 dark:text-green-300 mb-2">Facility Visits</h3>
                      <p className="text-green-700 dark:text-green-300 text-sm">
                        Plan tours of production facilities, warehouses, and business locations.
                      </p>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
                    <div className="text-center">
                      <div className="text-purple-600 dark:text-purple-400 mb-3">📋</div>
                      <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2">Business Appointments</h3>
                      <p className="text-purple-700 dark:text-purple-300 text-sm">
                        Organize business appointments, negotiations, and contract meetings.
                      </p>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
                    <div className="text-center">
                      <div className="text-orange-600 dark:text-orange-400 mb-3">📊</div>
                      <h3 className="font-medium text-orange-900 dark:text-orange-300 mb-2">Presentations</h3>
                      <p className="text-orange-700 dark:text-orange-300 text-sm">
                        Schedule presentations, demos, and business showcases with multiple companies.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Coming soon: Advanced meeting scheduler with calendar integration and automated routing optimization.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {formData.tripType === 'in_land' && currentStep === 4 && (
            <EnhancedItineraryBuilderStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 5 && (
            <TeamVehicleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 6 && (
            <ReviewStep formData={formData} />
          )}
        </div>

        {/* Footer - Navigation Buttons */}
        <div className="border-t border-pearl-200 dark:border-[#2a2a2a] px-4 md:px-6 lg:px-8 py-4 md:py-5 flex justify-between flex-shrink-0 bg-gray-50 dark:bg-[#0f1419] items-center">
          <div className="flex space-x-2 md:space-x-3">
            <button
              onClick={handleClose}
              className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Manual Save Button - hide on very small screens */}
            {currentStep > 1 && formData.tripType && (
              <button
                onClick={() => saveProgress(formData, currentStep, true)}
                disabled={saveStatus.isSaving}
                className="hidden xs:flex px-2 md:px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors items-center"
                title="Save progress"
              >
                {saveStatus.isSaving ? (
                  <Save className="w-4 h-4 animate-pulse" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="ml-1 hidden md:inline">Save</span>
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-3 md:px-4 py-2 text-sm md:text-base bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
                style={{
                  backgroundColor: !canProceed() ? '#9CA3AF' : '#059669'
                }}
                onMouseEnter={(e) => {
                  if (canProceed()) {
                    e.currentTarget.style.backgroundColor = '#FCC542'
                    e.currentTarget.style.color = '#006D5B'
                  }
                }}
                onMouseLeave={(e) => {
                  if (canProceed()) {
                    e.currentTarget.style.backgroundColor = '#059669'
                    e.currentTarget.style.color = 'white'
                  }
                }}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="px-3 md:px-4 py-2 text-sm md:text-base rounded-lg transition-colors"
                style={{
                  backgroundColor: (!canProceed() || isSubmitting) ? '#9CA3AF' : '#059669',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (canProceed() && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#FCC542'
                    e.currentTarget.style.color = '#006D5B'
                  }
                }}
                onMouseLeave={(e) => {
                  if (canProceed() && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#059669'
                    e.currentTarget.style.color = 'white'
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="hidden sm:inline">{saveStatus.tripId ? 'Finalizing...' : 'Creating...'}</span>
                    <span className="sm:hidden">{saveStatus.tripId ? 'Finalizing' : 'Creating'}</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{saveStatus.tripId ? 'Finalize Trip' : 'Create Trip'}</span>
                    <span className="sm:hidden">{saveStatus.tripId ? 'Finalize' : 'Create'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to format save time
function formatSaveTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  
  if (diffSecs < 60) {
    return 'just now'
  } else if (diffMins < 60) {
    return `${diffMins}m ago`
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}