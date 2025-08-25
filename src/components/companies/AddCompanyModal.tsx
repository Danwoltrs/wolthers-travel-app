'use client'

import { useState } from 'react'
import { X, Plus, MapPin, Building, Globe, Phone, Mail, User } from 'lucide-react'

interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  companyType: 'buyer' | 'supplier'
}

interface CompanyFormData {
  name: string
  fantasy_name: string
  category: string
  subcategories: string[] // For buyers: roasters/importers (multiple), suppliers: single choice
  legacy_company_id: string // Link to legacy system
  // Headquarters location
  hq_name: string
  address_line1: string
  address_line2: string
  city: string
  state_province: string
  country: string
  postal_code: string
  phone: string
  email: string
  contact_person: string
  notes: string
}

export default function AddCompanyModal({ isOpen, onClose, companyType }: AddCompanyModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    fantasy_name: '',
    category: companyType === 'buyer' ? 'buyer' : 'supplier',
    subcategories: [],
    legacy_company_id: '',
    hq_name: 'Head Office',
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    country: '',
    postal_code: '',
    phone: '',
    email: '',
    contact_person: '',
    notes: ''
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof CompanyFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubcategoryChange = (subcategory: string, checked: boolean) => {
    setFormData(prev => {
      if (companyType === 'buyer') {
        // Buyers can have multiple subcategories
        const newSubcategories = checked
          ? [...prev.subcategories, subcategory]
          : prev.subcategories.filter(s => s !== subcategory)
        return { ...prev, subcategories: newSubcategories }
      } else {
        // Suppliers can only have one subcategory
        return { ...prev, subcategories: checked ? [subcategory] : [] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate subcategories
    if (formData.subcategories.length === 0) {
      setError(`Please select at least one ${companyType === 'buyer' ? 'business' : 'supplier'} type`)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/companies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          company: {
            name: formData.name,
            fantasy_name: formData.fantasy_name || formData.name,
            category: formData.category,
            subcategories: formData.subcategories,
            legacy_company_id: formData.legacy_company_id || null,
          },
          headquarters: {
            name: formData.hq_name,
            is_headquarters: true,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            city: formData.city,
            state_province: formData.state_province,
            country: formData.country,
            postal_code: formData.postal_code,
            phone: formData.phone,
            email: formData.email,
            contact_person: formData.contact_person,
            notes: formData.notes,
            is_active: true
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create company')
      }

      // Reset form and close modal on success
      setFormData({
        name: '',
        fantasy_name: '',
        category: companyType === 'buyer' ? 'buyer' : 'supplier',
        subcategories: [],
        legacy_company_id: '',
        hq_name: 'Head Office',
        address_line1: '',
        address_line2: '',
        city: '',
        state_province: '',
        country: '',
        postal_code: '',
        phone: '',
        email: '',
        contact_person: '',
        notes: ''
      })
      onClose()
      
      // Refresh the page to show the new company
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New {companyType === 'buyer' ? 'Buyer' : 'Supplier'}
          </h2>
          <button
            onClick={onClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Company Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
              Company Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter full legal company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trade/Fantasy Name
                  </label>
                  <input
                    type="text"
                    value={formData.fantasy_name}
                    onChange={(e) => handleInputChange('fantasy_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Known as / Doing business as"
                  />
                </div>
              </div>

              {/* Legacy Company Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Legacy Company ID
                </label>
                <input
                  type="text"
                  value={formData.legacy_company_id}
                  onChange={(e) => handleInputChange('legacy_company_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Link to existing legacy company (optional)"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Connect this company to legacy system data for data integration
                </p>
              </div>

              {/* Subcategories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {companyType === 'buyer' ? 'Business Type' : 'Supplier Type'} *
                </label>
                <div className="space-y-2">
                  {companyType === 'buyer' ? (
                    // Multiple selection for buyers
                    <>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="roasters"
                          checked={formData.subcategories.includes('roasters')}
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
                          checked={formData.subcategories.includes('importers')}
                          onChange={(e) => handleSubcategoryChange('importers', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="importers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Importers
                        </label>
                      </div>
                    </>
                  ) : (
                    // Single selection for suppliers
                    <>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="exporters"
                          name="supplier_type"
                          checked={formData.subcategories.includes('exporters')}
                          onChange={(e) => handleSubcategoryChange('exporters', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="exporters" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Exporters
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="coops"
                          name="supplier_type"
                          checked={formData.subcategories.includes('coops')}
                          onChange={(e) => handleSubcategoryChange('coops', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="coops" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Cooperatives
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="producers"
                          name="supplier_type"
                          checked={formData.subcategories.includes('producers')}
                          onChange={(e) => handleSubcategoryChange('producers', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-white dark:bg-[#1a1a1a] border-gray-300 dark:border-gray-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="producers" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Producers
                        </label>
                      </div>
                    </>
                  )}
                </div>
                {formData.subcategories.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select at least one {companyType === 'buyer' ? 'business' : 'supplier'} type
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Headquarters Location */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Headquarters Location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  value={formData.hq_name}
                  onChange={(e) => handleInputChange('hq_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Head Office, Main Office"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address_line1}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => handleInputChange('address_line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Apartment, suite, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    value={formData.state_province}
                    onChange={(e) => handleInputChange('state_province', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Primary Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Name of main contact"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Additional information about the company..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create {companyType === 'buyer' ? 'Buyer' : 'Supplier'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}