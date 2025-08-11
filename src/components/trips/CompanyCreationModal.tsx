import React, { useState } from 'react'
import { X, Building2, Mail, Phone, Globe, MapPin } from 'lucide-react'
import { ClientType } from '@/types'
import type { Company } from '@/types'

interface CompanyCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onCompanyCreated: (company: Company) => void
  searchTerm?: string
}

interface CompanyFormData {
  name: string
  fantasyName: string
  email: string
  phone: string
  website: string
  clientType: ClientType
  notes: string
  // Location fields
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

const initialFormData: CompanyFormData = {
  name: '',
  fantasyName: '',
  email: '',
  phone: '',
  website: '',
  clientType: ClientType.ROASTERS,
  notes: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'Brazil'
}

export default function CompanyCreationModal({ isOpen, onClose, onCompanyCreated, searchTerm }: CompanyCreationModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    ...initialFormData,
    fantasyName: searchTerm || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Basic Info, 2: Contact & Location

  if (!isOpen) return null

  const updateFormData = (updates: Partial<CompanyFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call
      const newCompany: Company = {
        id: `temp-${Date.now()}`, // Will be replaced by backend
        name: formData.name,
        fantasyName: formData.fantasyName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        clientType: formData.clientType,
        totalTripCostsThisYear: 0,
        staffCount: undefined,
        notes: formData.notes || undefined,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      onCompanyCreated(newCompany)
      handleClose()
    } catch (error) {
      console.error('Error creating company:', error)
      alert('Failed to create company. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      ...initialFormData,
      fantasyName: searchTerm || ''
    })
    setCurrentStep(1)
    onClose()
  }

  const canProceedToStep2 = formData.name.trim().length > 0

  const canSubmit = formData.name.trim().length > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-pearl-200 dark:border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-white dark:text-golden-400" />
            <h2 className="text-xl font-semibold text-white dark:text-golden-400">
              Add New Company
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white dark:text-golden-400 hover:text-gray-200 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 border-b border-pearl-200 dark:border-[#2a2a2a]">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 1 
                  ? 'bg-emerald-600 text-white' 
                  : currentStep > 1 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Basic Information</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#2a2a2a]"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === 2 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Contact & Location (Optional)</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Official Company Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                      placeholder="e.g., Cooperativa dos Cafeicultores de Guaxupé"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="fantasyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Brand/Fantasy Name
                    </label>
                    <input
                      type="text"
                      id="fantasyName"
                      value={formData.fantasyName}
                      onChange={(e) => updateFormData({ fantasyName: e.target.value })}
                      className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                      placeholder="e.g., Cooxupé"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="clientType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client Type
                  </label>
                  <select
                    id="clientType"
                    value={formData.clientType}
                    onChange={(e) => updateFormData({ clientType: e.target.value as ClientType })}
                    className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                  >
                    <option value={ClientType.ROASTERS}>Roasters</option>
                    <option value={ClientType.DEALERS_IMPORTERS}>Dealers/Importers</option>
                    <option value={ClientType.EXPORTERS_COOPS}>Exporters/Coops</option>
                    <option value={ClientType.SERVICE_PROVIDERS}>Service Providers</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => updateFormData({ notes: e.target.value })}
                    className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                    placeholder="Any additional information about this company..."
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Quick Setup:</strong> You only need to provide the company name to continue with trip creation. 
                    Contact details and location information can be added later from the company management page.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => updateFormData({ email: e.target.value })}
                          className="block w-full pl-10 pr-3 py-2 rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => updateFormData({ phone: e.target.value })}
                          className="block w-full pl-10 pr-3 py-2 rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="+55 11 9999-9999"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        id="website"
                        value={formData.website}
                        onChange={(e) => updateFormData({ website: e.target.value })}
                        className="block w-full pl-10 pr-3 py-2 rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="https://www.company.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
                    Primary Location
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        id="addressLine1"
                        value={formData.addressLine1}
                        onChange={(e) => updateFormData({ addressLine1: e.target.value })}
                        className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                        placeholder="Street address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={formData.city}
                          onChange={(e) => updateFormData({ city: e.target.value })}
                          className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                          placeholder="City"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          id="state"
                          value={formData.state}
                          onChange={(e) => updateFormData({ state: e.target.value })}
                          className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                          placeholder="State/Province"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-pearl-200 dark:border-[#2a2a2a] px-6 py-4 flex justify-between">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              {currentStep === 1 && (
                <>
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Company'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedToStep2}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Add Details
                  </button>
                </>
              )}
              
              {currentStep === 2 && (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Company'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}