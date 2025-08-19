/**
 * Modern Participants Section with tabs, search, filters and bulk actions
 * Designed for frictionless staff addition and comprehensive participant management
 */

import React, { useState } from 'react'
import { Users, Building, UserPlus, RotateCcw, AlertCircle } from 'lucide-react'
import { useParticipants, ParticipantRole } from '@/hooks/useParticipants'
import { ParticipantsToolbar } from './ParticipantsToolbar'
import { ParticipantRow } from './ParticipantRow'

interface ParticipantsSectionProps {
  tripId: string
  tripDateRange: { start: string; end: string }
  className?: string
}

type TabType = 'staff' | 'company' | 'external'

export function ParticipantsSection({ tripId, tripDateRange, className = '' }: ParticipantsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('staff')

  const {
    filteredParticipants,
    availableStaff,
    companyReps,
    externalGuests,
    filters,
    setFilters,
    stats,
    loading,
    availabilityLoading,
    addParticipant,
    removeParticipant,
    updateParticipant,
    bulkUpdateParticipants,
    refreshAvailability,
    undoLastAction,
    canUndo,
    error,
    clearError
  } = useParticipants({ tripId, tripDateRange })

  // Get participants for current tab
  const currentTabParticipants = React.useMemo(() => {
    switch (activeTab) {
      case 'staff':
        return availableStaff
      case 'company':
        return companyReps
      case 'external':
        return externalGuests
      default:
        return []
    }
  }, [activeTab, availableStaff, companyReps, externalGuests])

  // Tab configuration
  const tabs = [
    { 
      id: 'staff' as TabType, 
      label: 'Wolthers Staff', 
      count: availableStaff.filter(p => p.metadata?.addedToTrip).length,
      icon: Users,
      color: 'emerald',
      emptyState: {
        icon: Users,
        title: 'Loading staff members...',
        description: 'Please wait while we load Wolthers staff members'
      }
    },
    { 
      id: 'company' as TabType, 
      label: 'Company Guests', 
      count: companyReps.filter(p => p.metadata?.addedToTrip).length,
      icon: Building,
      color: 'violet',
      emptyState: {
        icon: Building,
        title: 'No company representatives yet',
        description: 'Add client company representatives to this trip'
      }
    },
    { 
      id: 'external' as TabType, 
      label: 'External Guests', 
      count: externalGuests.filter(p => p.metadata?.addedToTrip).length,
      icon: UserPlus,
      color: 'slate',
      emptyState: {
        icon: UserPlus,
        title: 'No external guests yet',
        description: 'Add external guests and contractors'
      }
    }
  ]

  const currentTab = tabs.find(tab => tab.id === activeTab)!


  // Handle participant checkbox toggle
  const handleParticipantToggle = async (participantId: string, selected: boolean) => {
    try {
      if (selected) {
        // Add to trip
        const participant = currentTabParticipants.find(p => p.id === participantId)
        if (participant) {
          await addParticipant(participant)
        }
      } else {
        // Remove from trip
        await removeParticipant(participantId)
      }
    } catch (err) {
      console.error('Failed to toggle participant:', err)
    }
  }


  return (
    <div className={`space-y-6 flex flex-col h-full ${className}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <nav className="flex space-x-1 bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-lg">
          {tabs.map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-emerald-800/80 text-gray-800 dark:text-golden-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-gray-100 dark:bg-emerald-900/50 text-gray-600 dark:text-golden-400/80'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {canUndo && (
            <button
              onClick={undoLastAction}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Undo</span>
            </button>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Trip dates: {new Date(tripDateRange.start).toLocaleDateString()} - {new Date(tripDateRange.end).toLocaleDateString()} • 
        Check the boxes to add/remove staff from this trip
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-600">
            ×
          </button>
        </div>
      )}

      {/* Content Section */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col flex-1">
        {/* Toolbar */}
        <ParticipantsToolbar
          filters={filters}
          onFiltersChange={setFilters}
          bulkSelectMode={false}
          selectedCount={0}
          totalCount={currentTabParticipants.length}
          onSelectAll={() => {}}
          onBulkAction={() => {}}
          availabilityLoading={availabilityLoading}
          onRefreshAvailability={refreshAvailability}
          currentRole={activeTab === 'staff' ? 'staff' : activeTab === 'company' ? 'company_rep' : 'external'}
        />

        {/* Participants List */}
        <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a] flex-1 overflow-y-auto">
          {loading && currentTabParticipants.length === 0 ? (
            <div className="px-4 md:px-6 py-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">Loading participants...</div>
            </div>
          ) : currentTabParticipants.length > 0 ? (
            currentTabParticipants.map((participant) => (
              <ParticipantRow
                key={participant.id}
                participant={participant}
                selected={participant.metadata?.addedToTrip || false}
                onToggle={handleParticipantToggle}
                tripDateRange={tripDateRange}
              />
            ))
          ) : (
            /* Empty State - Only show for company and external, staff should always load from API */
            <div className="px-4 md:px-6 py-12 text-center">
              <currentTab.emptyState.icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {activeTab === 'staff' ? 'Loading staff members...' : currentTab.emptyState.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {activeTab === 'staff' ? 'Please wait while we load Wolthers staff members' : currentTab.emptyState.description}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}