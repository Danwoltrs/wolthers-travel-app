/**
 * Participants Toolbar with search, filters, and bulk actions
 * Sticky mini-toolbar design for efficient participant management
 */

import React, { useState } from 'react'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  RefreshCw, 
  CheckSquare, 
  Square,
  Users,
  Building,
  UserPlus
} from 'lucide-react'
import { ParticipantFilters, ParticipantRole, ParticipantAvailability } from '@/hooks/useParticipants'

interface ParticipantsToolbarProps {
  filters: ParticipantFilters
  onFiltersChange: (filters: Partial<ParticipantFilters>) => void
  bulkSelectMode: boolean
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onBulkAction: (action: string) => void
  availabilityLoading: boolean
  onRefreshAvailability: () => void
  currentRole: ParticipantRole
}

export function ParticipantsToolbar({
  filters,
  onFiltersChange,
  bulkSelectMode,
  selectedCount,
  totalCount,
  onSelectAll,
  onBulkAction,
  availabilityLoading,
  onRefreshAvailability,
  currentRole
}: ParticipantsToolbarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Handle search input with debouncing
  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value })
  }

  const isAllSelected = selectedCount === totalCount && totalCount > 0

  return (
    <div className="sticky top-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] z-10">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between space-x-4">
          {/* Left Section: Search and Filters */}
          <div className="flex items-center space-x-3 flex-1 max-w-lg">
            {/* Bulk Select Checkbox */}
            {bulkSelectMode && (
              <button
                onClick={onSelectAll}
                className="flex items-center justify-center w-5 h-5 rounded border border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>
            )}

            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search name or email"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{ paddingLeft: '36px' }}
                className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Filters Button */}
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3 py-2 border rounded-md transition-colors ${
                  showFilters || filters.availability !== 'all' || filters.companyId !== 'all'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Filters Dropdown */}
              {showFilters && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg z-20">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        value={filters.role}
                        onChange={(e) => onFiltersChange({ role: e.target.value as ParticipantRole | 'all' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      >
                        <option value="all">All Roles</option>
                        <option value="staff">Staff</option>
                        <option value="company_rep">Company Rep</option>
                        <option value="external">External</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Availability
                      </label>
                      <select
                        value={filters.availability}
                        onChange={(e) => onFiltersChange({ availability: e.target.value as ParticipantAvailability | 'all' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      >
                        <option value="all">All</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>

                    {(currentRole === 'company_rep' || currentRole === 'external') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Company
                        </label>
                        <select
                          value={filters.companyId}
                          onChange={(e) => onFiltersChange({ companyId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        >
                          <option value="all">All Companies</option>
                          {/* TODO: Add actual companies from context */}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          onFiltersChange({ 
                            search: '', 
                            role: 'all', 
                            availability: 'all', 
                            companyId: 'all' 
                          })
                          setShowFilters(false)
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center space-x-3">
            {/* Refresh Availability */}
            <button
              onClick={onRefreshAvailability}
              disabled={availabilityLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${availabilityLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Bulk Actions Dropdown */}
            {bulkSelectMode && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <span className="text-sm">Bulk Actions</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showBulkActions ? 'rotate-180' : ''}`} />
                </button>

                {showBulkActions && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg z-20">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          onBulkAction('set_role_staff')
                          setShowBulkActions(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Users className="w-4 h-4" />
                        <span>Set Role: Staff</span>
                      </button>
                      <button
                        onClick={() => {
                          onBulkAction('set_role_company')
                          setShowBulkActions(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Building className="w-4 h-4" />
                        <span>Set Role: Company Rep</span>
                      </button>
                      <button
                        onClick={() => {
                          onBulkAction('set_role_external')
                          setShowBulkActions(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Set Role: External</span>
                      </button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      
                      <button
                        onClick={() => {
                          onBulkAction('set_available')
                          setShowBulkActions(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      >
                        Mark Available
                      </button>
                      <button
                        onClick={() => {
                          onBulkAction('set_unavailable')
                          setShowBulkActions(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        Mark Unavailable
                      </button>
                      
                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                      
                      <button
                        onClick={() => {
                          onBulkAction('remove')
                          setShowBulkActions(false)
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Remove from Trip
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.role !== 'all' || filters.availability !== 'all' || filters.companyId !== 'all') && (
          <div className="flex items-center space-x-2 mt-3 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Active filters:</span>
            
            {filters.search && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md">
                Search: "{filters.search}"
              </span>
            )}
            
            {filters.role !== 'all' && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-md">
                Role: {filters.role}
              </span>
            )}
            
            {filters.availability !== 'all' && (
              <span className={`px-2 py-1 rounded-md ${
                filters.availability === 'available' 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                  : filters.availability === 'unavailable'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {filters.availability}
              </span>
            )}
            
            {filters.companyId !== 'all' && (
              <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded-md">
                Company filtered
              </span>
            )}

            <button
              onClick={() => onFiltersChange({ 
                search: '', 
                role: 'all', 
                availability: 'all', 
                companyId: 'all' 
              })}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Bulk Selection Status */}
        {bulkSelectMode && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {selectedCount} of {totalCount} participants selected
          </div>
        )}
      </div>
    </div>
  )
}

