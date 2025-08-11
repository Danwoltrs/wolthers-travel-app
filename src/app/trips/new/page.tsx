'use client'

import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import StepIndicator from '@/components/trips/StepIndicator'
import TripTypeSelection, { TripType } from '@/components/trips/TripTypeSelection'
import ConventionSearchStep from '@/components/trips/ConventionSearchStep'
import BasicInfoStep from '@/components/trips/BasicInfoStep'
import EnhancedItineraryBuilderStep from '@/components/trips/EnhancedItineraryBuilderStep'
import TeamVehicleStep from '@/components/trips/TeamVehicleStep'
import ReviewStep from '@/components/trips/ReviewStep'
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

export default function NewTripPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<TripFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      // Redirect to trip view page after successful creation
      window.location.href = '/trips/1' // Replace with actual trip ID
    } catch (error) {
      console.error('Error creating trip:', error)
    } finally {
      setIsSubmitting(false)
    }
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
    <div className="min-h-screen bg-pearl-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-sm text-latte-600 hover:text-sage-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="mt-4 text-3xl font-bold text-latte-800">
            Create New Trip
          </h1>
        </div>

        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Form Content */}
        <div className="mt-8 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm border border-pearl-200 dark:border-[#2a2a2a] p-6">
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

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="btn-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Trip'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}