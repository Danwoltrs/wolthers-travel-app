'use client'

import { useState, useEffect } from 'react'
import { X, Building, ArrowLeft, ArrowRight, Plus, MapPin, Check, Search } from 'lucide-react'
import { UnifiedCompanyCreationModalProps, LegacyCompanyResult } from '@/types/company'
import LegacyCompanySearch from './LegacyCompanySearch'
import PICManagement, { PICData } from './PICManagement'
import NavigationLinks from './NavigationLinks'

enum CreationStep {
  SEARCH = 'search',
  COMPANY_INFO = 'company_info',
  PIC_MANAGEMENT = 'pic_management',
  ADDITIONAL_LOCATIONS = 'additional_locations',
  CONFIRMATION = 'confirmation'
}

interface AdditionalLocation {
  name: string
  address: string
  isHeadquarters: boolean
}

export default function UnifiedCompanyCreationModal({
  isOpen,
  onClose,
  onCompanyCreated,
  companyType = 'supplier',
  initialSearch = '',
  context = 'standalone'
}: UnifiedCompanyCreationModalProps) {
  const [currentStep, setCurrentStep] = useState<CreationStep>(CreationStep.SEARCH)
  const [selectedLegacy, setSelectedLegacy] = useState<LegacyCompanyResult | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form data
  const [companyData, setCompanyData] = useState({
    name: '',
    fantasyName: '',
    category: companyType,
    subcategories: [] as string[]
  })
  const [picData, setPicData] = useState<PICData | null>(null)
  const [additionalLocations, setAdditionalLocations] = useState<AdditionalLocation[]>([])
  const [legacyLocations, setLegacyLocations] = useState<any[]>([])
  const [loadingLegacyLocations, setLoadingLegacyLocations] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  
  // Geocoding results for preview
  const [headquartersPreview, setHeadquartersPreview] = useState<any>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(CreationStep.SEARCH)
      setSelectedLegacy(null)
      setIsCreatingNew(false)
      setError(null)
      setCompanyData({
        name: '',
        fantasyName: '',
        category: companyType,
        subcategories: []
      })
      setPicData(null)
      setAdditionalLocations([])
      setLegacyLocations([])
      setLocationSearchQuery('')
      setShowLocationSearch(false)
      setHeadquartersPreview(null)
    }
  }, [isOpen, companyType])

  // Handle legacy company selection
  const handleLegacySelect = async (company: LegacyCompanyResult) => {
    setSelectedLegacy(company)
    setIsCreatingNew(false)
    setError(null)
    
    // Pre-fill company data from legacy
    setCompanyData({
      name: company.name,
      fantasyName: company.fantasyName || company.name,
      category: companyType,
      subcategories: determineSubcategories(company.group1, company.group2)
    })

    // Don't auto-fetch legacy locations anymore - let user search manually

    // Geocode headquarters for preview
    if (company.fullAddress) {
      try {
        const response = await fetch('/api/locations/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: company.fullAddress })
        })
        
        if (response.ok) {
          const geocoded = await response.json()
          setHeadquartersPreview(geocoded)
        }
      } catch (error) {
        console.warn('Preview geocoding failed:', error)
      }
    }

    setCurrentStep(CreationStep.COMPANY_INFO)
  }

  // Handle create new company
  const handleCreateNew = (searchTerm: string) => {
    setSelectedLegacy(null)
    setIsCreatingNew(true)
    setError(null)
    
    setCompanyData(prev => ({
      ...prev,
      name: searchTerm,
      fantasyName: searchTerm
    }))
    
    setCurrentStep(CreationStep.COMPANY_INFO)
  }

  // Handle step navigation
  const canProceedToNextStep = (): boolean => {
    switch (currentStep) {
      case CreationStep.SEARCH:
        return selectedLegacy !== null || isCreatingNew
      case CreationStep.COMPANY_INFO:
        return companyData.name.trim().length > 0 && companyData.subcategories.length > 0
      case CreationStep.PIC_MANAGEMENT:
        return true // PIC is optional
      case CreationStep.ADDITIONAL_LOCATIONS:
        return true // Additional locations are optional
      case CreationStep.CONFIRMATION:
        return companyData.name.trim().length > 0 && companyData.subcategories.length > 0
      default:
        return false
    }
  }

  const handleNext = () => {
    const steps = Object.values(CreationStep)
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    const steps = Object.values(CreationStep)
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  // Search legacy locations manually
  const searchLegacyLocations = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setLegacyLocations([])
      return
    }
    
    setLoadingLegacyLocations(true)
    try {
      const params = new URLSearchParams()
      params.append('search', query.trim())
      
      const response = await fetch(`/api/companies/legacy-locations?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setLegacyLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Failed to search legacy locations:', error)
      setLegacyLocations([])
    } finally {
      setLoadingLegacyLocations(false)
    }
  }

  // Handle subcategory changes
  const handleSubcategoryChange = (subcategory: string, checked: boolean) => {
    setCompanyData(prev => {
      const newSubcategories = checked
        ? [...prev.subcategories, subcategory]
        : prev.subcategories.filter(s => s !== subcategory)
      
      return { ...prev, subcategories: newSubcategories }
    })
  }

  // Add additional location
  const addAdditionalLocation = () => {
    setAdditionalLocations(prev => [
      ...prev,
      { name: '', address: '', isHeadquarters: false }
    ])
  }

  // Remove additional location
  const removeAdditionalLocation = (index: number) => {
    setAdditionalLocations(prev => prev.filter((_, i) => i !== index))
  }

  // Update additional location
  const updateAdditionalLocation = (index: number, field: keyof AdditionalLocation, value: string | boolean) => {
    setAdditionalLocations(prev => 
      prev.map((location, i) => 
        i === index ? { ...location, [field]: value } : location
      )
    )
  }

  // Add legacy location to additional locations
  const addLegacyLocation = (legacyLocation: any) => {
    const newLocation: AdditionalLocation = {
      name: legacyLocation.name || legacyLocation.fullName,
      address: legacyLocation.fullAddress,
      isHeadquarters: false
    }
    setAdditionalLocations(prev => [...prev, newLocation])
  }

  // Handle final submission
  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (selectedLegacy) {
        // Create from legacy data
        const response = await fetch('/api/companies/create-from-legacy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            legacyClientId: selectedLegacy.id,
            pic: picData,
            additionalLocations: additionalLocations.filter(loc => loc.name && loc.address),
            companyOverrides: companyData
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create company from legacy data')
        }

        const result = await response.json()
        onCompanyCreated?.(result.company)
      } else {
        // Create new company
        const response = await fetch('/api/companies/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            company: companyData,
            headquarters: {
              name: 'Main Headquarters',
              address_line1: 'Address to be filled',
              city: 'City to be filled',
              country: 'Brazil'
            },
            pic: picData
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create company')
        }

        const result = await response.json()
        onCompanyCreated?.(result.company)
      }

      onClose()
    } catch (error) {
      console.error('Company creation error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-xl max-w-4xl w-full max-h-[95vh] ${currentStep === CreationStep.SEARCH ? 'overflow-visible' : 'overflow-hidden'}`}>
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building className="w-5 h-5" />
            {selectedLegacy ? 'Import Company' : isCreatingNew ? 'New Company' : 'Search or Create Company'}
          </h2>
          <button
            onClick={onClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-3 border-b border-pearl-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between text-sm">
            {[
              { key: CreationStep.SEARCH, label: 'Search' },
              { key: CreationStep.COMPANY_INFO, label: 'Company Info' },
              { key: CreationStep.PIC_MANAGEMENT, label: 'PIC' },
              { key: CreationStep.ADDITIONAL_LOCATIONS, label: 'Locations' },
              { key: CreationStep.CONFIRMATION, label: 'Confirm' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step.key 
                    ? 'bg-emerald-600 text-white' 
                    : Object.values(CreationStep).indexOf(currentStep) > index
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {Object.values(CreationStep).indexOf(currentStep) > index ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`ml-2 ${
                  currentStep === step.key 
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.label}
                </span>
                {index < 4 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-4" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 p-6 ${currentStep !== CreationStep.SEARCH ? 'overflow-y-auto' : ''}`}>
          {/* Step 1: Search */}
          {currentStep === CreationStep.SEARCH && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                  Search Existing Company
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Search for companies already registered in the legacy system or create a new company.
                </p>
              </div>

              <LegacyCompanySearch
                onCompanySelect={handleLegacySelect}
                onCreateNew={handleCreateNew}
                initialSearch={initialSearch}
                placeholder="Type company name to search..."
              />

              {selectedLegacy && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-emerald-800 dark:text-emerald-400">
                        Selected Company
                      </h4>
                      <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                        {selectedLegacy.displayName}
                      </p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        {selectedLegacy.location}
                      </p>
                    </div>
                    {headquartersPreview && (
                      <NavigationLinks
                        location={{
                          address: selectedLegacy.fullAddress,
                          latitude: headquartersPreview.latitude,
                          longitude: headquartersPreview.longitude,
                          name: selectedLegacy.name
                        }}
                        variant="button"
                        showLabel={false}
                        className="text-xs"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Company Information */}
          {currentStep === CreationStep.COMPANY_INFO && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                  Company Information
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {selectedLegacy ? 'Confirm or adjust the imported information.' : 'Fill in the basic company information.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Official Name *
                  </label>
                  <input
                    type="text"
                    value={companyData.name}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Full company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trade Name
                  </label>
                  <input
                    type="text"
                    value={companyData.fantasyName}
                    onChange={(e) => setCompanyData(prev => ({ ...prev, fantasyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Commercial name or brand"
                  />
                </div>
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Type *
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {companyType === 'buyer' 
                    ? 'Buyers can be importers, roasters, or both.' 
                    : 'Suppliers can be cooperatives, producers, or exporters.'}
                </p>
                <div className="space-y-2">
                  {companyType === 'buyer' ? (
                    <>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="roasters"
                          checked={companyData.subcategories.includes('roasters')}
                          onChange={(e) => handleSubcategoryChange('roasters', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="roasters" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Roasters
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="importers"
                          checked={companyData.subcategories.includes('importers')}
                          onChange={(e) => handleSubcategoryChange('importers', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="importers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Importers
                        </label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="cooperatives"
                          name="supplier_type"
                          checked={companyData.subcategories.includes('cooperatives')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompanyData(prev => ({ ...prev, subcategories: ['cooperatives'] }))
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="cooperatives" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Cooperatives
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="producers"
                          name="supplier_type"
                          checked={companyData.subcategories.includes('producers')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompanyData(prev => ({ ...prev, subcategories: ['producers'] }))
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="producers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Producers
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="exporters"
                          name="supplier_type"
                          checked={companyData.subcategories.includes('exporters')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCompanyData(prev => ({ ...prev, subcategories: ['exporters'] }))
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="exporters" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Exporters
                        </label>
                      </div>
                    </>
                  )}
                </div>
                {companyData.subcategories.length === 0 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Please select at least one company type.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: PIC Management */}
          {currentStep === CreationStep.PIC_MANAGEMENT && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                  Person in Charge (PIC)
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Define the person responsible for the commercial relationship with this company.
                </p>
              </div>

              <PICManagement
                initialData={picData || undefined}
                onChange={setPicData}
                required={false}
              />
            </div>
          )}

          {/* Step 4: Additional Locations */}
          {currentStep === CreationStep.ADDITIONAL_LOCATIONS && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                  Additional Locations
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add other units, branches or locations of interest for this company.
                </p>
              </div>

              <div className="space-y-4">
                {additionalLocations.map((location, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        Location {index + 1}
                      </h4>
                      <button
                        onClick={() => removeAdditionalLocation(index)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location Name
                        </label>
                        <input
                          type="text"
                          value={location.name}
                          onChange={(e) => updateAdditionalLocation(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="ex: São Paulo Branch"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Complete Address
                        </label>
                        <input
                          type="text"
                          value={location.address}
                          onChange={(e) => updateAdditionalLocation(index, 'address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Complete address with city and state"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Legacy Locations Search - only show when importing from legacy */}
                {selectedLegacy && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-golden-400 mb-3">
                      Search Legacy Locations
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Search for additional locations by company name or address:
                    </p>
                    
                    {/* Search Input */}
                    <div className="relative mb-4">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => {
                          setLocationSearchQuery(e.target.value)
                          searchLegacyLocations(e.target.value)
                        }}
                        placeholder="Search by company name or address..."
                        style={{ paddingLeft: '36px' }}
                        className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Loading State */}
                    {loadingLegacyLocations && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">Searching locations...</span>
                      </div>
                    )}

                    {/* Search Results */}
                    {!loadingLegacyLocations && legacyLocations.length > 0 && (
                      <div className="grid grid-cols-1 gap-3">
                        {legacyLocations.map((legacyLoc, index) => {
                          const isAlreadyAdded = additionalLocations.some(loc => 
                            loc.address === legacyLoc.fullAddress
                          )
                          
                          return (
                            <div 
                              key={index}
                              className={`p-3 border rounded-lg transition-colors ${
                                isAlreadyAdded 
                                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50'
                                  : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer'
                              }`}
                              onClick={() => !isAlreadyAdded && addLegacyLocation(legacyLoc)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {legacyLoc.name}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {legacyLoc.fullAddress}
                                  </div>
                                </div>
                                <div className="ml-3">
                                  {isAlreadyAdded ? (
                                    <Check className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <Plus className="w-5 h-5 text-emerald-600" />
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* No Results */}
                    {!loadingLegacyLocations && locationSearchQuery && legacyLocations.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No locations found for "{locationSearchQuery}"
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <button
                    onClick={addAdditionalLocation}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-full justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Location
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === CreationStep.CONFIRMATION && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                  Confirm Creation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Review the information before creating the company.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Company: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {companyData.name} {companyData.fantasyName && companyData.fantasyName !== companyData.name && `(${companyData.fantasyName})`}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Type: </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {companyData.subcategories.join(', ')}
                    </span>
                  </div>
                  {picData && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">PIC: </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {picData.name} ({picData.email}) {picData.title && `- ${picData.title}`}
                      </span>
                    </div>
                  )}
                  {selectedLegacy && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Source: </span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Imported from legacy system
                      </span>
                    </div>
                  )}
                  {additionalLocations.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Additional locations: </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {additionalLocations.length} location(s) added
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-pearl-200 dark:border-[#2a2a2a] px-6 py-4 flex justify-between">
          <button
            onClick={currentStep === CreationStep.SEARCH ? onClose : handlePrevious}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {currentStep === CreationStep.SEARCH ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Back
              </>
            )}
          </button>

          {currentStep === CreationStep.CONFIRMATION ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !canProceedToNextStep()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Company
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function to determine subcategories from legacy data
function determineSubcategories(group1?: string, group2?: string): string[] {
  const subcategories: string[] = []
  const group1Lower = group1?.toLowerCase() || ''
  const group2Lower = group2?.toLowerCase() || ''

  // Check for buyer types (can be multiple)
  if (group1Lower.includes('roaster') || group2Lower.includes('roaster') || 
      group1Lower.includes('torref') || group2Lower.includes('torref')) {
    subcategories.push('roasters')
  }
  if (group1Lower.includes('importer') || group2Lower.includes('importer') ||
      group1Lower.includes('import') || group2Lower.includes('import')) {
    subcategories.push('importers')
  }

  // Check for supplier types (single selection)
  if (group1Lower.includes('exporter') || group2Lower.includes('exporter') ||
      group1Lower.includes('export') || group2Lower.includes('export')) {
    subcategories.push('exporters')
  }
  if (group1Lower.includes('coop') || group2Lower.includes('cooperative') ||
      group1Lower.includes('cooperat') || group2Lower.includes('cooperat')) {
    subcategories.push('cooperatives')
  }
  if (group1Lower.includes('producer') || group2Lower.includes('producer') ||
      group1Lower.includes('produtor') || group2Lower.includes('produtor') ||
      group1Lower.includes('fazend') || group2Lower.includes('fazend')) {
    subcategories.push('producers')
  }

  // Default to exporters if no specific type found
  return subcategories.length > 0 ? subcategories : ['exporters']
}