'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Building, Loader2, Check, Upload, Camera, MapPin, User, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

interface Company {
  id: string
  name: string
  fantasy_name?: string
  category: 'buyer' | 'supplier' | 'service_provider'
  subcategories?: string[]
  logo_url?: string
}

interface Location {
  id?: string
  name: string
  address_line1: string
  address_line2?: string
  city: string
  state_province?: string
  postal_code?: string
  country: string
  is_headquarters?: boolean
  contact_person?: string
  phone?: string
  email?: string
  notes?: string
}

interface CompanyEditModalProps {
  isOpen: boolean
  onClose: () => void
  company: Company | null
  onCompanyUpdated?: (updatedCompany: Company) => void
}

export default function CompanyEditModal({
  isOpen,
  onClose,
  company,
  onCompanyUpdated
}: CompanyEditModalProps) {
  const [formData, setFormData] = useState<Partial<Company>>({})
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'locations'>('basic')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { user } = useAuth()
  const isWolthersStaff = user?.companyId === '840783f4-866d-4bdb-9b5d-5d0facf62db0'

  // Initialize form data when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        fantasy_name: company.fantasy_name || '',
        category: company.category,
        subcategories: company.subcategories || [],
        logo_url: company.logo_url
      })
      setLogoPreview(company.logo_url || null)
      
      // Fetch locations for this company
      fetchLocations()
    }
  }, [company])

  // Fetch company locations
  const fetchLocations = async () => {
    if (!company?.id) return
    
    try {
      const response = await fetch(`/api/companies/${company.id}/locations`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSuccessMessage(null)
      setActiveTab('basic')
      setLogoFile(null)
      setLogoPreview(company?.logo_url || null)
    }
  }, [isOpen, company?.logo_url])

  // Validate file type and size
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml']
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (PNG, JPG, GIF, WebP, AVIF, or SVG)'
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }
    
    return null
  }

  // Handle file processing
  const processFile = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setError(null)
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Handle logo upload
  const handleLogoUpload = async () => {
    if (!logoFile || !company?.id) return

    setIsUploadingLogo(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('logo', logoFile)

      const response = await fetch(`/api/companies/${company.id}/logo`, {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo')
      }

      setFormData(prev => ({ ...prev, logo_url: data.logoUrl }))
      setSuccessMessage('Logo uploaded successfully!')
      setLogoFile(null)
      
      // Notify parent component to refresh data
      if (onCompanyUpdated && company) {
        onCompanyUpdated({ ...company, logo_url: data.logoUrl })
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // Handle logo removal
  const handleLogoRemove = async () => {
    if (!company?.id) return

    setIsUploadingLogo(true)
    try {
      const response = await fetch(`/api/companies/${company.id}/logo`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove logo')
      }

      setFormData(prev => ({ ...prev, logo_url: null }))
      setLogoPreview(null)
      setLogoFile(null)
      setSuccessMessage('Logo removed successfully!')
      
      // Notify parent component to refresh data
      if (onCompanyUpdated && company) {
        onCompanyUpdated({ ...company, logo_url: null })
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // Handle location operations
  const addLocation = () => {
    const newLocation: Location = {
      name: '',
      address_line1: '',
      city: '',
      country: '',
      is_headquarters: locations.length === 0 // First location is headquarters by default
    }
    setLocations([...locations, newLocation])
  }

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index))
  }

  const updateLocation = (index: number, field: keyof Location, value: any) => {
    const updatedLocations = [...locations]
    updatedLocations[index] = { ...updatedLocations[index], [field]: value }
    setLocations(updatedLocations)
  }

  if (!isOpen || !company) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/companies/${company.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update company')
      }

      setSuccessMessage('Company updated successfully!')
      onCompanyUpdated?.(data)
      
      // Close modal after brief delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update company')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof Company, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const categoryOptions = [
    { value: 'buyer', label: 'Buyer' },
    { value: 'supplier', label: 'Supplier' },
    { value: 'service_provider', label: 'Service Provider' }
  ]

  const subcategoryOptions = {
    buyer: ['exporters', 'importers', 'brokers'],
    supplier: ['producers', 'processors', 'cooperatives', 'farms'],
    service_provider: ['laboratory', 'logistics', 'consulting']
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Company: {company.fantasy_name || company.name}
            </h2>
          </div>
          <button
            onClick={isLoading ? undefined : onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex space-x-8 px-6">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'basic'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Basic Information
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('locations')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'locations'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Locations ({locations.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Success Message */}
              {successMessage && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg text-green-800 dark:text-green-200">
                  <Check className="w-5 h-5" />
                  {successMessage}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  {/* Logo Section */}
                  <div className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Company Logo</h3>
                    
                    <div className="flex items-start space-x-6">
                      {/* Logo Preview */}
                      <div className="flex-shrink-0">
                        {logoPreview ? (
                          <div className="relative">
                            <div className="w-32 h-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center p-2">
                              <Image
                                src={logoPreview}
                                alt="Company Logo"
                                width={120}
                                height={80}
                                className="max-w-full max-h-full object-contain"
                                style={{ maxHeight: '43px' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleLogoRemove}
                              disabled={isUploadingLogo}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div 
                            className={`w-32 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed ${
                              isDragOver 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                                : 'border-gray-300 dark:border-gray-600'
                            } flex items-center justify-center cursor-pointer transition-all`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <div className="text-center">
                              <Camera className={`w-6 h-6 mx-auto mb-1 ${
                                isDragOver ? 'text-emerald-500' : 'text-gray-400'
                              }`} />
                              <p className={`text-xs ${
                                isDragOver ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {isDragOver ? 'Drop here' : 'Drop or click'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Logo Upload */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Upload className="w-4 h-4 inline mr-2" />
                            Choose Logo
                          </button>
                          
                          {logoFile && (
                            <button
                              type="button"
                              onClick={handleLogoUpload}
                              disabled={isUploadingLogo}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {isUploadingLogo ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              ) : (
                                <Check className="w-4 h-4 mr-2" />
                              )}
                              Upload
                            </button>
                          )}
                        </div>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif,image/svg+xml"
                          onChange={handleLogoSelect}
                          className="hidden"
                        />
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Upload an image (PNG, JPG, GIF, WebP, AVIF, SVG) up to 5MB. Drag and drop supported.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Fantasy Name */}
                    <div>
                      <label htmlFor="fantasy_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fantasy Name
                      </label>
                      <input
                        type="text"
                        id="fantasy_name"
                        value={formData.fantasy_name || ''}
                        onChange={(e) => handleInputChange('fantasy_name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                      {!isWolthersStaff && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          (Contact Wolthers staff to change)
                        </span>
                      )}
                    </label>
                    <select
                      id="category"
                      required
                      value={formData.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value as Company['category'])}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading || !isWolthersStaff}
                    >
                      {categoryOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategories */}
                  {formData.category && subcategoryOptions[formData.category] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subcategories
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {subcategoryOptions[formData.category].map(subcategory => (
                          <label key={subcategory} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={(formData.subcategories || []).includes(subcategory)}
                              onChange={(e) => {
                                const current = formData.subcategories || []
                                const updated = e.target.checked
                                  ? [...current, subcategory]
                                  : current.filter(s => s !== subcategory)
                                handleInputChange('subcategories', updated)
                              }}
                              className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                              disabled={isLoading}
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {subcategory}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Locations Tab */}
              {activeTab === 'locations' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Office Locations</h3>
                    <button
                      type="button"
                      onClick={addLocation}
                      className="flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Location
                    </button>
                  </div>

                  {locations.map((location, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                          {location.is_headquarters ? 'Headquarters' : `Location ${index + 1}`}
                        </h4>
                        {locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Location Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={location.name}
                            onChange={(e) => updateLocation(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            PIC (Person In Charge)
                          </label>
                          <input
                            type="text"
                            value={location.contact_person || ''}
                            onChange={(e) => updateLocation(index, 'contact_person', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Address *
                          </label>
                          <input
                            type="text"
                            required
                            value={location.address_line1}
                            onChange={(e) => updateLocation(index, 'address_line1', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                            placeholder="Street address"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={location.city}
                            onChange={(e) => updateLocation(index, 'city', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country *
                          </label>
                          <input
                            type="text"
                            required
                            value={location.country}
                            onChange={(e) => updateLocation(index, 'country', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {locations.length === 0 && (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No locations added</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first office location to get started.</p>
                      <button
                        type="button"
                        onClick={addLocation}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Location
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}