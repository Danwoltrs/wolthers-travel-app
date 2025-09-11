import React, { useState } from 'react'
import { X, Calendar, Users, Hash } from 'lucide-react'
import { TripFormData } from './TripCreationModal'
import type { User } from '@/types'
import UserCreationModal from './UserCreationModal'
import { useTripCodeValidation } from '@/hooks/useTripCodeValidation'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import TravelDatePicker, { TravelDatePickerRef } from '@/components/ui/TravelDatePicker'

interface BasicInfoStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}


export default function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {

  // Check if this is a predefined event (from convention selection)
  // Also check if accessCode was set from event selection to prevent overwrites
  const isPredefinedEvent = (
    (formData as any)?.selectedConvention?.is_predefined === true ||
    ((formData as any)?.selectedConvention && formData.accessCode && formData.accessCode.includes('-'))
  )

  // Initialize the validation hook with proper predefined event handling
  const { 
    code, 
    setCode, 
    generateTripCode: generateCustomTripCode, 
    validationResult 
  } = useTripCodeValidation(
    formData.accessCode ? formData.accessCode.toUpperCase() : '', 
    formData
  )
  
  // Sync the code with formData changes, but avoid overwriting valid user input
  React.useEffect(() => {
    if (formData.accessCode && formData.accessCode !== code && !validationResult.isChecking) {
      const upperCaseCode = formData.accessCode.toUpperCase()
      console.log('🎯 Syncing access code from formData:', upperCaseCode)
      setCode(upperCaseCode)
    }
  }, [formData.accessCode, code, setCode, validationResult.isChecking])

  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedCompanyForUser, setSelectedCompanyForUser] = useState<string | undefined>()
  const datePickerRef = React.useRef<TravelDatePickerRef>(null)


  const handleUserCreated = (user: User) => {
    updateFormData({ participants: [...formData.participants, user] })
    setShowUserModal(false)
    setSelectedCompanyForUser(undefined)
  }

  const removeParticipant = (userId: string) => {
    updateFormData({ 
      participants: formData.participants.filter(p => p.id !== userId) 
    })
  }

  const openUserModalForCompany = (companyId?: string) => {
    setSelectedCompanyForUser(companyId)
    setShowUserModal(true)
  }



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-emerald-300">
          Basic Trip Information
        </h2>
      </div>

      {/* Trip Title, Travel Dates, and Trip Code on same line */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Trip Title */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-emerald-200">
            Trip Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Tab' && !e.shiftKey && formData.title.trim()) {
                e.preventDefault()
                datePickerRef.current?.openCalendar()
              }
            }}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-[#3a3a3a] transition-all duration-200 sm:text-sm px-3 py-2"
            placeholder="e.g., Coffee Farm Tour São Paulo"
          />
        </div>

        {/* Travel Date Range */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-emerald-200 mb-2">
            Travel Dates *
          </label>
          <TravelDatePicker
            ref={datePickerRef}
            startDate={formData.startDate}
            endDate={formData.endDate}
            onChange={(startDate, endDate) => {
              updateFormData({ 
                startDate: startDate, 
                endDate: endDate 
              })
            }}
            placeholder="Select your travel dates"
            required={true}
            autoFocus={false}
          />
        </div>

        {/* Trip Code */}
        {(formData.startDate || formData.tripType === 'in_land') && (
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-emerald-200">
              Trip Code *
            </label>
            <div className="relative">
              {/* Hash Icon */}
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Hash className="w-4 h-4 text-gray-400" />
              </div>
              {/* Trip Code Input */}
              <input
                type="text"
                id="accessCode"
                value={code.toUpperCase()}
                onChange={(e) => {
                  // Enforce uppercase letters, numbers, underscores, and dashes only
                  const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '')
                  // Limit to 20 characters
                  const trimmed = sanitized.substring(0, 20)
                  setCode(trimmed)
                  updateFormData({ accessCode: trimmed })
                }}
                maxLength={20}
                style={{ paddingLeft: '36px' }}
                className={`
                  w-full pr-10 py-2 rounded-lg border shadow-sm 
                  bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 
                  placeholder-gray-500 dark:placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                  hover:border-gray-400 dark:hover:border-[#3a3a3a] transition-all duration-200 
                  font-mono text-sm
                  ${validationResult.isChecking 
                    ? 'border-yellow-300 dark:border-yellow-700' 
                    : validationResult.isValid && code 
                      ? 'border-green-300 dark:border-green-700' 
                      : !validationResult.isValid && code
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-gray-300 dark:border-[#2a2a2a]'
                  }
                `}
                placeholder="COFFEE_SP"
                title="Trip Code: 2-20 characters, uppercase letters, numbers, underscores, and dashes only"
              />
              {/* Validation Icon */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                {validationResult.isChecking ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                ) : validationResult.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            {!validationResult.isValid && validationResult.message && (
              <div className="text-xs text-red-500 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {validationResult.message}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              2-20 characters: uppercase letters, numbers, underscores, and dashes only
            </div>
          </div>
        )}
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-emerald-200">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => updateFormData({ subject: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-[#3a3a3a] transition-all duration-200 sm:text-sm px-3 py-2"
          placeholder={formData.subject ? "" : "Brief description of the trip purpose"}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-emerald-200">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-[#3a3a3a] transition-all duration-200 sm:text-sm px-3 py-2"
          placeholder={formData.description ? "" : "Detailed description of the trip"}
        />
      </div>

      {/* Estimated Budget - Commented out */}
      {/* <div>
        <label htmlFor="budget" className="block text-sm font-medium text-latte-700">
          Estimated Budget (USD)
        </label>
        <div className="mt-1 relative">
          <span className="absolute left-3 top-2 text-gray-500 dark:text-latte-400">$</span>
          <input
            type="number"
            id="budget"
            value={formData.estimatedBudget || ''}
            onChange={(e) => updateFormData({ estimatedBudget: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm pl-8 pr-3 py-2"
            placeholder={formData.estimatedBudget ? "" : "0.00"}
            step="0.01"
          />
        </div>
      </div> */}

      {/* Participants are now handled in the Team & Vehicle Selection step */}
      
      {/* Modals */}
      <UserCreationModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setSelectedCompanyForUser(undefined)
        }}
        onUserCreated={handleUserCreated}
        preSelectedCompanyId={selectedCompanyForUser}
        availableCompanies={[]}
      />
    </div>
  )
}