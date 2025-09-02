'use client'

import { useState, useEffect } from 'react'
import { X, Building, Loader2, Check } from 'lucide-react'

interface Company {
  id: string
  name: string
  fantasy_name?: string
  category: 'buyer' | 'supplier' | 'service_provider'
  subcategories?: string[]
  staff_count?: number
  annual_trip_cost?: number
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Initialize form data when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        fantasy_name: company.fantasy_name || '',
        category: company.category,
        subcategories: company.subcategories || [],
        staff_count: company.staff_count || 0,
        annual_trip_cost: company.annual_trip_cost || 0
      })
    }
  }, [company])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

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
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Company
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

        {/* Content */}
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

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                required
                value={formData.category || ''}
                onChange={(e) => handleInputChange('category', e.target.value as Company['category'])}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading}
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
                <div className="space-y-2">
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

            {/* Staff Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="staff_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Staff Count
                </label>
                <input
                  type="number"
                  id="staff_count"
                  min="0"
                  value={formData.staff_count || ''}
                  onChange={(e) => handleInputChange('staff_count', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* Annual Trip Cost */}
              <div>
                <label htmlFor="annual_trip_cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Trip Cost (USD)
                </label>
                <input
                  type="number"
                  id="annual_trip_cost"
                  min="0"
                  step="0.01"
                  value={formData.annual_trip_cost || ''}
                  onChange={(e) => handleInputChange('annual_trip_cost', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Updating...' : 'Update Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}