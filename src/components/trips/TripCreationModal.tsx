import React, { useState } from 'react'
import { ArrowLeft, ArrowRight, X, Plus } from 'lucide-react'
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

interface TripCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onTripCreated?: (trip: any) => void
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

export default function TripCreationModal({ isOpen, onClose, onTripCreated }: TripCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<TripFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const steps = getStepsForTripType(formData.tripType)

  const updateFormData = (data: Partial<TripFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
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

  const handleClose = () => {
    setFormData(initialFormData)
    setCurrentStep(1)
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-pearl-200 dark:border-[#2a2a2a] w-full max-w-5xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-3 md:px-6 py-4 flex items-center justify-between border-b border-pearl-200 dark:border-[#0a2e21]">
          <div className="flex items-center space-x-3">
            <Plus className="w-6 h-6 text-white dark:text-golden-400" />
            <h2 className="text-xl font-semibold text-white dark:text-golden-400">
              Create New Trip
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-3 md:px-6 py-4 border-b border-pearl-200 dark:border-[#2a2a2a]">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 max-h-[calc(95vh-200px)]">
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
        <div className="border-t border-pearl-200 dark:border-[#2a2a2a] px-3 md:px-6 py-4 flex justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Trip'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}