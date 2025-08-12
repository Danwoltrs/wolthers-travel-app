import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, X, Plus, Save, AlertCircle, CheckCircle } from 'lucide-react'
import StepIndicator from './StepIndicator'
import TripTypeSelection, { TripType } from './TripTypeSelection'
import ConventionSearchStep from './ConventionSearchStep'
import BasicInfoStep from './BasicInfoStep'
import EnhancedItineraryBuilderStep from './EnhancedItineraryBuilderStep'
import TeamVehicleStep from './TeamVehicleStep'
import ReviewStep from './ReviewStep'
import type { Company, User, Vehicle, Activity, ItineraryDay } from '@/types'

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
  estimatedBudget?: number
  
  // Step 2: Itinerary
  itineraryDays: ItineraryDay[]
  
  // Step 3: Team & Vehicles
  wolthersStaff: User[]
  drivers: User[]
  vehicles: Vehicle[]
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
  estimatedBudget: undefined,
  itineraryDays: [],
  wolthersStaff: [],
  drivers: [],
  vehicles: []
}

// Dynamic steps based on trip type
const getStepsForTripType = (tripType: TripType | null) => {
  if (tripType === 'convention') {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' },
      { id: 2, name: 'Event Search', description: 'Find your convention or event' },
      { id: 3, name: 'Basic Information', description: 'Trip details and attendees' },
      { id: 4, name: 'Team & Travel', description: 'Staff and travel arrangements' },
      { id: 5, name: 'Review & Create', description: 'Review and finalize trip' }
    ]
  } else if (tripType === 'in_land') {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' },
      { id: 2, name: 'Basic Information', description: 'Trip details and companies' },
      { id: 3, name: 'Itinerary Builder', description: 'Create daily activities with AI' },
      { id: 4, name: 'Team & Vehicles', description: 'Assign staff and transportation' },
      { id: 5, name: 'Review & Create', description: 'Review and finalize trip' }
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveDataRef = useRef<string>('')

  // Progressive save function
  const saveProgress = async (stepData: TripFormData, step: number, showNotification = false) => {
    if (!formData.tripType) return
    
    // Don't save if data hasn't changed
    const currentDataString = JSON.stringify({ stepData, step })
    if (currentDataString === lastSaveDataRef.current && saveStatus.tripId) {
      return
    }
    
    setSaveStatus(prev => ({ ...prev, isSaving: true, error: null }))
    
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('/api/trips/progressive-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tripId: saveStatus.tripId,
          currentStep: step,
          stepData: stepData,
          completionPercentage: Math.round((step / steps.length) * 100),
          tripType: formData.tripType
        })
      })

      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`)
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

  // Auto-save when form data changes
  useEffect(() => {
    if (!isOpen || !formData.tripType || currentStep < 2) return
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveProgress(formData, currentStep)
    }, 2000) // Auto-save after 2 seconds of no changes
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, currentStep, isOpen])
  
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
    setFormData(prev => ({ ...prev, ...data }))
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
      // TODO: Submit form data to API
      console.log('Submitting trip:', formData)
      
      // Mock successful creation
      const newTrip = {
        id: `trip-${Date.now()}`,
        ...formData,
        createdAt: new Date()
      }
      
      onTripCreated?.(newTrip)
      handleClose()
    } catch (error) {
      console.error('Error creating trip:', error)
      alert('Failed to create trip. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = async () => {
    // Save progress before closing if we have meaningful data
    if (formData.tripType && (currentStep > 2 || (currentStep === 2 && (formData.title || formData.companies.length > 0)))) {
      await saveProgress(formData, currentStep, false)
    }
    
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
          return formData.wolthersStaff.length > 0
        case 5:
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
          return formData.itineraryDays.length > 0
        case 4:
          return formData.wolthersStaff.length > 0
        case 5:
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
        <div className="bg-golden-400 dark:bg-[#09261d] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-pearl-200 dark:border-[#0a2e21] flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Plus className="w-6 h-6 text-white dark:text-golden-400" />
            <h2 className="text-lg md:text-xl font-semibold text-white dark:text-golden-400">
              <span className="hidden sm:inline">
                {resumeData ? 'Continue Trip Creation' : 'Create New Trip'}
              </span>
              <span className="sm:hidden">
                {resumeData ? 'Continue Trip' : 'New Trip'}
              </span>
            </h2>
            {/* Save Status Indicator */}
            <div className="flex items-center space-x-1 md:space-x-2">
              {saveStatus.isSaving && (
                <div className="flex items-center space-x-1 text-white/80 dark:text-golden-400/80">
                  <Save className="w-3 md:w-4 h-3 md:h-4 animate-pulse" />
                  <span className="text-xs md:text-sm hidden xs:inline">Saving...</span>
                </div>
              )}
              {saveStatus.lastSaved && !saveStatus.isSaving && !saveStatus.error && (
                <div className="flex items-center space-x-1 text-white/80 dark:text-golden-400/80">
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
          </div>
          <button
            onClick={handleClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator - Only show after trip type is selected */}
        {formData.tripType && (
          <div className="px-4 md:px-6 lg:px-8 py-3 md:py-6 border-b border-pearl-200 dark:border-[#2a2a2a] flex-shrink-0 bg-gray-50 dark:bg-[#0f1419]">
            <StepIndicator steps={steps} currentStep={currentStep} />
          </div>
        )}

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
        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 lg:py-10 min-h-0">
          {/* Step 1: Trip Type Selection */}
          {currentStep === 1 && (
            <TripTypeSelection
              selectedType={formData.tripType}
              onTypeSelect={(type) => updateFormData({ tripType: type })}
            />
          )}
          
          {/* Convention Trip Steps */}
          {formData.tripType === 'convention' && currentStep === 2 && (
            <ConventionSearchStep
              formData={formData as any}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 3 && (
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 4 && (
            <TeamVehicleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 5 && (
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
            <EnhancedItineraryBuilderStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 4 && (
            <TeamVehicleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 5 && (
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
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="px-3 md:px-4 py-2 text-sm md:text-base bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <span className="hidden sm:inline">Creating...</span>
                    <span className="sm:hidden">Create</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Create Trip</span>
                    <span className="sm:hidden">Create</span>
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