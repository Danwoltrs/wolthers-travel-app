import React, { useState } from 'react'
import { X, Calendar, Users, Hash } from 'lucide-react'
import { TripFormData } from './TripCreationModal'
import type { User } from '@/types'
import UserCreationModal from './UserCreationModal'
import { useTripCodeValidation } from '@/hooks/useTripCodeValidation'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

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
    formData.accessCode || '', 
    formData
  )
  
  // Initialize the code from formData if not already set
  React.useEffect(() => {
    if (formData.accessCode && !code) {
      console.log('🎯 Initializing access code:', formData.accessCode)
      setCode(formData.accessCode)
    }
  }, [formData.accessCode, code, setCode])

  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedCompanyForUser, setSelectedCompanyForUser] = useState<string | undefined>()


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


  const formatDateForInput = (date: Date | null): string => {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-emerald-300">
          Basic Trip Information
        </h2>
      </div>

      {/* Trip Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-emerald-200">
          Trip Title *
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-gray-400 dark:hover:border-[#3a3a3a] transition-all duration-200 sm:text-sm px-3 py-2"
              placeholder={formData.title ? "" : "e.g., NCA Convention 2025"}
            />
          </div>
          {(formData.startDate || formData.tripType === 'in_land') && (
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center">
                <Hash className="w-4 h-4 text-gray-400 mr-1" />
                <input
                  type="text"
                  id="accessCode"
                  value={code}
                  onChange={(e) => {
                    const newCode = e.target.value.toUpperCase()
                    setCode(newCode)
                    updateFormData({ accessCode: newCode })
                  }}
                  readOnly={false}
                  className={`
                    w-40 px-2 py-1 text-sm font-mono border-none outline-none
                    ${validationResult.isValid ? 'text-gray-800' : 'text-red-600'}
                    placeholder-gray-400
                  `}
                  placeholder={code || (formData.startDate ? "Generating..." : "Enter trip code")}
                  title="Editable Trip Code"
                />
                {validationResult.isChecking ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400 ml-1" />
                ) : validationResult.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 ml-1" />
                )}
              </div>
              {!validationResult.isValid && validationResult.message && (
                <div className="text-xs text-red-500 mt-1">
                  {validationResult.message}
                </div>
              )}
            </div>
          )}
        </div>
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


      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-emerald-200">
            Start Date *
          </label>
          <div className="mt-1 relative">
            <input
              type="date"
              id="startDate"
              value={formatDateForInput(formData.startDate)}
              onChange={(e) => {
                const inputDate = e.target.value.split('-');
                const newDate = new Date(parseInt(inputDate[0]), parseInt(inputDate[1]) - 1, parseInt(inputDate[2]));
                updateFormData({ startDate: newDate });
              }}
              className="block w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm px-3 py-2"
            />
            <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-latte-400 pointer-events-none" />
          </div>
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-emerald-200">
            End Date *
          </label>
          <div className="mt-1 relative">
            <input
              type="date"
              id="endDate"
              value={formatDateForInput(formData.endDate)}
              onChange={(e) => {
                const inputDate = e.target.value.split('-');
                const newDate = new Date(parseInt(inputDate[0]), parseInt(inputDate[1]) - 1, parseInt(inputDate[2]));
                updateFormData({ endDate: newDate });
              }}
              min={formatDateForInput(formData.startDate)}
              className="block w-full rounded-lg border border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm px-3 py-2"
            />
            <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-latte-400 pointer-events-none" />
          </div>
        </div>
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