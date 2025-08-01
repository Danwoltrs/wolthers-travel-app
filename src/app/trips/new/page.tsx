'use client'

import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import StepIndicator from '@/components/trips/StepIndicator'
import BasicInfoStep from '@/components/trips/BasicInfoStep'
import ItineraryBuilderStep from '@/components/trips/ItineraryBuilderStep'
import TeamVehicleStep from '@/components/trips/TeamVehicleStep'
import ReviewStep from '@/components/trips/ReviewStep'
import type { Company, User, Vehicle, Activity, ItineraryDay } from '@/types'

export interface TripFormData {
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

const steps = [
  { id: 1, name: 'Basic Information', description: 'Trip details and participants' },
  { id: 2, name: 'Itinerary Builder', description: 'Create daily activities' },
  { id: 3, name: 'Team & Vehicles', description: 'Assign staff and transportation' },
  { id: 4, name: 'Review & Create', description: 'Review and finalize trip' }
]

export default function NewTripPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<TripFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    switch (currentStep) {
      case 1:
        return formData.title && formData.companies.length > 0 && formData.startDate && formData.endDate
      case 2:
        return formData.itineraryDays.length > 0
      case 3:
        return formData.wolthersStaff.length > 0
      case 4:
        return true
      default:
        return false
    }
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
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-pearl-200 p-6">
          {currentStep === 1 && (
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 2 && (
            <ItineraryBuilderStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 3 && (
            <TeamVehicleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 4 && (
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