/**
 * Modern Participants Section with tabs, search, filters and bulk actions
 * Designed for frictionless staff addition and comprehensive participant management
 */

import React, { useState } from 'react'
import { Users, Building, UserPlus, RotateCcw, AlertCircle, MapPin, X } from 'lucide-react'
import { useParticipants, ParticipantRole } from '@/hooks/useParticipants'
import { ParticipantsToolbar } from './ParticipantsToolbar'
import { ParticipantRow } from './ParticipantRow'
import { EnhancedGuestInvitationModal } from './EnhancedGuestInvitationModal'
import { CompanySelectionModal } from './CompanySelectionModal'
import { InvitationsTable } from './InvitationsTable'

interface ParticipantsSectionProps {
  tripId: string
  tripDateRange: { start: string; end: string }
  className?: string
  onParticipantStatsChange?: (stats: { 
    total: number; 
    staff: number; 
    guests: number;
    staffMembers: Array<{ id: string; fullName: string }>;
    guestMembers: Array<{ id: string; fullName: string }>;
  }) => void
}

type TabType = 'staff' | 'company' | 'external' | 'hosts'

export function ParticipantsSection({ tripId, tripDateRange, className = '', onParticipantStatsChange }: ParticipantsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('staff')
  const [showGuestInvitationModal, setShowGuestInvitationModal] = useState(false)
  const [showCompanySelectionModal, setShowCompanySelectionModal] = useState(false)
  const [showHostSelectionModal, setShowHostSelectionModal] = useState(false)
  const [selectedHostCompany, setSelectedHostCompany] = useState<any>(null)

  const {
    filteredParticipants,
    availableStaff,
    companyReps,
    externalGuests,
    pendingInvitations,
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
      case 'hosts':
        return [] // TODO: Add hosts data hook
      default:
        return []
    }
  }, [activeTab, availableStaff, companyReps, externalGuests])

  // Notify parent of participant stats changes
  React.useEffect(() => {
    if (onParticipantStatsChange) {
      const addedStaff = availableStaff.filter(p => p.metadata?.addedToTrip)
      const addedCompanyReps = companyReps.filter(p => p.metadata?.addedToTrip)
      const addedExternalGuests = externalGuests.filter(p => p.metadata?.addedToTrip)
      
      const staffCount = addedStaff.length
      const guestCount = addedCompanyReps.length + addedExternalGuests.length
      
      onParticipantStatsChange({
        total: staffCount + guestCount,
        staff: staffCount,
        guests: guestCount,
        staffMembers: addedStaff.map(p => ({ id: p.id, fullName: p.fullName })),
        guestMembers: [...addedCompanyReps, ...addedExternalGuests].map(p => ({ id: p.id, fullName: p.fullName }))
      })
    }
  }, [availableStaff, companyReps, externalGuests, onParticipantStatsChange])

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
        title: 'No companies selected yet',
        description: 'Select companies and their staff to invite to this trip'
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
        description: 'Add outsider guests joining Wolthers trips'
      }
    },
    { 
      id: 'hosts' as TabType, 
      label: 'Host Companies', 
      count: 0, // TODO: Add host count when hook is ready
      icon: MapPin,
      color: 'amber',
      emptyState: {
        icon: MapPin,
        title: 'No host companies selected',
        description: 'Add host companies to organize visits and meetings'
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

  // Handle guest invitation sent
  const handleGuestInvitationSent = () => {
    // Refresh participants to show any updates
    refreshAvailability()
  }

  // Handle resending invitation
  const handleResendInvitation = async (invitation: any) => {
    try {
      const response = await fetch('/api/guests/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tripId,
          guestEmail: invitation.guest_email,
          guestName: invitation.guest_name,
          guestCompany: invitation.guest_company,
          guestTitle: invitation.guest_title,
          guestPhone: invitation.guest_phone,
          message: `Reminder: You previously received an invitation for this trip.`,
          invitationType: activeTab === 'external' ? 'company_guest' : 'external_guest', // Swapped logic
          isReminder: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to resend invitation')
      }

      // Refresh participants to show updated reminder count
      refreshAvailability()
    } catch (error) {
      console.error('Failed to resend invitation:', error)
      // You could add toast notification here
      throw error
    }
  }

  // Handle add guest button click
  const handleAddGuestClick = () => {
    if (activeTab === 'company') {
      setShowCompanySelectionModal(true)
    } else if (activeTab === 'external') {
      setShowGuestInvitationModal(true)
    } else if (activeTab === 'hosts') {
      setShowHostSelectionModal(true)
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
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col flex-1 min-h-[400px]">
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
          currentRole={activeTab === 'staff' ? 'staff' : activeTab === 'company' ? 'company_rep' : activeTab === 'hosts' ? 'host' : 'external'}
          showAddGuestButton={activeTab === 'company' || activeTab === 'external' || activeTab === 'hosts'}
          onAddGuest={handleAddGuestClick}
        />

        {/* Participants List */}
        <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a] flex-1 overflow-y-auto">
          {loading && activeTab === 'staff' ? (
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
            /* Show invitations table for company and external guests, or empty state for staff */
            activeTab === 'company' || activeTab === 'external' ? (
              <InvitationsTable 
                invitations={pendingInvitations.filter(inv => 
                  activeTab === 'company' 
                    ? inv.invitation_type === 'external_guest' // Company tab now shows external guest invitations
                    : inv.invitation_type === 'company_guest'  // External tab now shows company guest invitations
                )}
                className="flex-1"
                onResendInvitation={handleResendInvitation}
              />
            ) : (
              /* Empty State for Staff */
              <div className="px-4 md:px-6 py-12 text-center">
                <currentTab.emptyState.icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {currentTab.emptyState.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {currentTab.emptyState.description}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Enhanced Guest Invitation Modal - for External Guests */}
      <EnhancedGuestInvitationModal
        isOpen={showGuestInvitationModal}
        onClose={() => setShowGuestInvitationModal(false)}
        tripId={tripId}
        onInvitationSent={handleGuestInvitationSent}
      />

      {/* Company Selection Modal - for Company Guests */}
      <CompanySelectionModal
        isOpen={showCompanySelectionModal}
        onClose={() => setShowCompanySelectionModal(false)}
        tripId={tripId}
        onInvitationSent={handleGuestInvitationSent}
      />
      
      {/* Host Selection Modal - for Host Companies */}
      {showHostSelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Host Companies</h3>
              <button
                onClick={() => setShowHostSelectionModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Host Selection Available
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Host companies can be added during trip creation or from the trip schedule tab.
                This feature allows you to organize visits and meetings with your host partners.
              </p>
              <button
                onClick={() => setShowHostSelectionModal(false)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}