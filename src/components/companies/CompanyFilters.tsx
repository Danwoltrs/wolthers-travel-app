'use client'

import { X, Check } from 'lucide-react'
import type { CompanyFilters as CompanyFiltersType, CompanyType } from '@/types/company'

interface CompanyFiltersProps {
  filters: CompanyFiltersType
  onFiltersChange: (filters: CompanyFiltersType) => void
  onClose: () => void
}

export default function CompanyFilters({ filters, onFiltersChange, onClose }: CompanyFiltersProps) {
  const companyTypes: { value: CompanyType; label: string }[] = [
    { value: 'roaster_dealer', label: 'Roaster/Dealer' },
    { value: 'exporter_coop', label: 'Exporter/Coop' },
    { value: 'service_provider', label: 'Service Provider' }
  ]

  const sortOptions = [
    { value: 'name', label: 'Company Name' },
    { value: 'last_visit', label: 'Last Visit' },
    { value: 'trip_count', label: 'Trip Count' },
    { value: 'total_cost', label: 'Total Spend' }
  ]

  const handleTypeToggle = (type: CompanyType) => {
    const currentTypes = filters.company_type || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    
    onFiltersChange({
      ...filters,
      company_type: newTypes.length > 0 ? newTypes : undefined
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      search: filters.search || '',
      is_active: true,
      sort_by: 'name',
      sort_order: 'asc'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
        <div className="flex gap-2">
          <button
            onClick={handleClearFilters}
            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Company Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company Type
          </label>
          <div className="space-y-2">
            {companyTypes.map(type => (
              <label
                key={type.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filters.company_type?.includes(type.value) || false}
                  onChange={() => handleTypeToggle(type.value)}
                  className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
              <input
                type="radio"
                checked={filters.is_active === true}
                onChange={() => onFiltersChange({ ...filters, is_active: true })}
                className="border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
              <input
                type="radio"
                checked={filters.is_active === false}
                onChange={() => onFiltersChange({ ...filters, is_active: false })}
                className="border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Inactive Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
              <input
                type="radio"
                checked={filters.is_active === undefined}
                onChange={() => onFiltersChange({ ...filters, is_active: undefined })}
                className="border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">All</span>
            </label>
          </div>
        </div>

        {/* Trip Activity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Trip Activity
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors">
              <input
                type="checkbox"
                checked={filters.has_recent_trips || false}
                onChange={(e) => onFiltersChange({ ...filters, has_recent_trips: e.target.checked || undefined })}
                className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Has Recent Trips</span>
            </label>
            <div className="space-y-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Min Trips</label>
              <input
                type="number"
                min="0"
                value={filters.min_trip_count || ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  min_trip_count: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-600 dark:text-gray-400">Max Trips</label>
              <input
                type="number"
                min="0"
                value={filters.max_trip_count || ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  max_trip_count: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                placeholder="∞"
              />
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sort By
          </label>
          <select
            value={filters.sort_by || 'name'}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              sort_by: e.target.value as any 
            })}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors flex-1">
              <input
                type="radio"
                checked={filters.sort_order === 'asc'}
                onChange={() => onFiltersChange({ ...filters, sort_order: 'asc' })}
                className="border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Asc</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors flex-1">
              <input
                type="radio"
                checked={filters.sort_order === 'desc'}
                onChange={() => onFiltersChange({ ...filters, sort_order: 'desc' })}
                className="border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Desc</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}