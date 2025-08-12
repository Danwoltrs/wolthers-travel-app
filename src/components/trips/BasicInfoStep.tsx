import React, { useState } from 'react'
import { Plus, X, Calendar, Users, Hash } from 'lucide-react'
import { TripFormData } from './TripCreationModal'
import { ClientType } from '@/types'
import type { Company, User } from '@/types'
import CompanyCreationModal from './CompanyCreationModal'
import UserCreationModal from './UserCreationModal'
import { generateTripCode } from '@/lib/tripCodeGenerator'
import { useTripCodeValidation } from '@/hooks/useTripCodeValidation'
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface BasicInfoStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

// Mock data - will be replaced with API calls
const availableCompanies: Company[] = [
  {
    id: '1',
    name: 'Cooxupe Coffee Cooperative',
    fantasyName: 'Cooxupe',
    email: 'contact@cooxupe.com.br',
    clientType: ClientType.EXPORTERS_COOPS,
    totalTripCostsThisYear: 15000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Swiss Coffee Trading AG',
    fantasyName: 'Swiss Coffee',
    email: 'info@swisscoffee.ch',
    clientType: ClientType.EXPORTERS_COOPS,
    totalTripCostsThisYear: 25000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Brasil Coffee Exports',
    fantasyName: 'BCE',
    email: 'export@bce.com.br',
    clientType: ClientType.EXPORTERS_COOPS,
    totalTripCostsThisYear: 18000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {
  const { 
    code, 
    setCode, 
    generateTripCode: generateCustomTripCode, 
    validationResult 
  } = useTripCodeValidation(
    formData.accessCode || '', 
    formData
  )

  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedCompanyForUser, setSelectedCompanyForUser] = useState<string | undefined>()

  const filteredCompanies = availableCompanies.filter(
    company => 
      !formData.companies.some(c => c.id === company.id) &&
      (company.name.toLowerCase().includes(companySearch.toLowerCase()) ||
       company.fantasyName?.toLowerCase().includes(companySearch.toLowerCase()))
  )

  const addCompany = (company: Company) => {
    updateFormData({ companies: [...formData.companies, company] })
    setCompanySearch('')
    setShowCompanyDropdown(false)
  }

  const removeCompany = (companyId: string) => {
    updateFormData({ 
      companies: formData.companies.filter(c => c.id !== companyId),
      participants: formData.participants.filter(p => p.companyId !== companyId)
    })
  }

  const handleCompanyCreated = (company: Company) => {
    updateFormData({ companies: [...formData.companies, company] })
    setShowCompanyModal(false)
  }

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
        <h2 className="text-lg font-medium text-latte-800 mb-4">
          Basic Trip Information
        </h2>
      </div>

      {/* Trip Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-latte-700">
          Trip Title *
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-pearl-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 hover:border-pearl-400 transition-all duration-200 sm:text-sm px-3 py-2"
              placeholder={formData.title ? "" : "e.g., NCA Convention 2025"}
            />
          </div>
          {formData.startDate && (
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center">
                <Hash className="w-4 h-4 text-gray-400 mr-1" />
                <input
                  type="text"
                  id="accessCode"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    updateFormData({ accessCode: e.target.value.toUpperCase() })
                  }}
                  className={`
                    w-40 px-2 py-1 text-sm font-mono border-none outline-none
                    ${validationResult.isValid ? 'text-gray-800' : 'text-red-600'}
                    placeholder-gray-400
                  `}
                  placeholder={code || "Generating..."}
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
        <label htmlFor="subject" className="block text-sm font-medium text-latte-700">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => updateFormData({ subject: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-pearl-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 hover:border-pearl-400 transition-all duration-200 sm:text-sm px-3 py-2"
          placeholder={formData.subject ? "" : "Brief description of the trip purpose"}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-latte-700">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-pearl-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 hover:border-pearl-400 transition-all duration-200 sm:text-sm px-3 py-2"
          placeholder={formData.description ? "" : "Detailed description of the trip"}
        />
      </div>

      {/* Companies */}
      <div>
        <label className="block text-sm font-medium text-latte-700 mb-2">
          Companies (Optional)
        </label>
        
        {/* Selected Companies */}
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.companies.map(company => (
            <div
              key={company.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-sage-100 text-sage-800 border border-sage-200"
            >
              <span>{company.fantasyName || company.name}</span>
              <button
                onClick={() => removeCompany(company.id)}
                className="ml-2 hover:text-sage-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Company */}
        <div className="relative">
          <div className="flex items-center">
            <input
              type="text"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value)
                setShowCompanyDropdown(true)
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              placeholder={companySearch ? "" : "Search for companies..."}
              className="flex-1 rounded-lg border border-pearl-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 hover:border-pearl-400 transition-all duration-200 sm:text-sm px-3 py-2"
            />
            <button
              type="button"
              onClick={() => setShowCompanyModal(true)}
              className="ml-2 btn-secondary"
              title="Add new company"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Company Dropdown */}
          {showCompanyDropdown && companySearch && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => addCompany(company)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {company.fantasyName || company.name}
                    </div>
                    {company.fantasyName && (
                      <div className="text-sm text-gray-500 dark:text-latte-400">
                        {company.name}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500 dark:text-latte-400">
                  No companies found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-latte-700">
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
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
            />
            <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-latte-400 pointer-events-none" />
          </div>
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-latte-700">
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
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm px-3 py-2"
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

      {/* Participants Section */}
      {formData.companies.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-latte-700 mb-2">
            Participants
          </label>
          
          {/* Selected Participants */}
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.participants.map(participant => {
              const company = formData.companies.find(c => c.id === participant.companyId)
              return (
                <div
                  key={participant.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                >
                  <Users className="w-3 h-3 mr-1" />
                  <span>{participant.fullName}</span>
                  {company && (
                    <span className="text-blue-600 text-xs ml-1">
                      ({company.fantasyName || company.name})
                    </span>
                  )}
                  <button
                    onClick={() => removeParticipant(participant.id)}
                    className="ml-2 hover:text-blue-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add Participants by Company */}
          <div className="space-y-3">
            {formData.companies.map(company => {
              const companyParticipants = formData.participants.filter(p => p.companyId === company.id)
              return (
                <div key={company.id} className="border border-pearl-200 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {company.fantasyName || company.name}
                    </h4>
                    <button
                      onClick={() => openUserModalForCompany(company.id)}
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Contact
                    </button>
                  </div>
                  
                  {companyParticipants.length > 0 ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {companyParticipants.length} contact{companyParticipants.length !== 1 ? 's' : ''} added
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No contacts added yet
                    </div>
                  )}
                </div>
              )
            })}
            
            {/* Add general participant not tied to a company */}
            <button
              onClick={() => openUserModalForCompany()}
              className="w-full text-left p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-emerald-300 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add general participant (not tied to a company)
            </button>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <CompanyCreationModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onCompanyCreated={handleCompanyCreated}
        searchTerm={companySearch}
      />
      
      <UserCreationModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setSelectedCompanyForUser(undefined)
        }}
        onUserCreated={handleUserCreated}
        preSelectedCompanyId={selectedCompanyForUser}
        availableCompanies={formData.companies}
      />
    </div>
  )
}