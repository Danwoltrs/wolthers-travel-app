/**
 * Add Participants Dialog with availability checking and bulk selection
 * Primary flow: "Add Available Staff" with live availability and multi-select
 */

import React, { useState, useEffect, useMemo } from 'react'
import { 
  X, 
  Search, 
  Users, 
  Building, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  Filter,
  Loader2
} from 'lucide-react'
import { EnhancedParticipant, ParticipantRole } from '@/hooks/useParticipants'
import { useWolthersStaff } from '@/hooks/useWolthersStaff'
import { getMockAvailability, getAvailabilityClasses } from '@/lib/availability'

interface AddParticipantsDialogProps {
  tripId: string
  tripDateRange: { start: string; end: string }
  defaultTab?: 'staff' | 'everyone'
  onClose: () => void
  onAddParticipant: (participant: Omit<EnhancedParticipant, 'id' | 'isOptimistic'>) => Promise<EnhancedParticipant>
}

interface PersonCandidate {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  companyId: string | null
  companyName?: string
  isStaff: boolean
  role: ParticipantRole
  availability: 'available' | 'unavailable' | 'partial' | 'unknown'
  conflictDays: string[]
  availableDays: string[]
  isAlreadyAdded: boolean
}

export function AddParticipantsDialog({
  tripId,
  tripDateRange,
  defaultTab = 'staff',
  onClose,
  onAddParticipant
}: AddParticipantsDialogProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'everyone'>(defaultTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable' | 'partial'>('all')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [candidates, setCandidates] = useState<PersonCandidate[]>([])
  
  // Load Wolthers staff
  const { wolthersStaff, loading: staffLoading } = useWolthersStaff()

  // Load candidates based on active tab
  useEffect(() => {
    const loadCandidates = async () => {
      setLoading(true)
      try {
        if (activeTab === 'staff') {
          // Convert Wolthers staff to candidates with availability
          const staffCandidates: PersonCandidate[] = await Promise.all(
            wolthersStaff.map(async (staff) => {
              const availability = getMockAvailability(staff.id || '', tripDateRange)
              return {
                id: staff.id || '',
                fullName: staff.full_name,
                email: staff.email,
                phone: staff.phone || null,
                companyId: staff.company_id,
                companyName: 'Wolthers & Associates',
                isStaff: true,
                role: 'staff' as ParticipantRole,
                availability: availability.overallStatus === 'available' ? 'available' :
                             availability.overallStatus === 'unavailable' ? 'unavailable' :
                             availability.overallStatus === 'partial' ? 'partial' : 'unknown',
                conflictDays: availability.conflictDays,
                availableDays: availability.availableDays,
                isAlreadyAdded: false // TODO: Check against existing participants
              }
            })
          )
          setCandidates(staffCandidates)
        } else {
          // Load all people (staff + company contacts + external)
          // TODO: Implement API call for all people
          setCandidates([])
        }
      } catch (error) {
        console.error('Error loading candidates:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCandidates()
  }, [activeTab, wolthersStaff, tripDateRange])

  // Filter candidates based on search and availability
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          candidate.fullName.toLowerCase().includes(searchLower) ||
          candidate.email?.toLowerCase().includes(searchLower) ||
          candidate.companyName?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Availability filter
      if (availabilityFilter !== 'all' && candidate.availability !== availabilityFilter) {
        return false
      }

      return true
    })
  }, [candidates, searchQuery, availabilityFilter])

  // Available candidates for quick selection
  const availableCandidates = useMemo(() => 
    filteredCandidates.filter(c => c.availability === 'available'),
    [filteredCandidates]
  )

  // Handle candidate selection
  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const selectAllAvailable = () => {
    const availableIds = availableCandidates.map(c => c.id)
    setSelectedCandidates(availableIds)
  }

  const clearSelection = () => {
    setSelectedCandidates([])
  }

  // Handle adding participants
  const handleAddParticipants = async () => {
    if (selectedCandidates.length === 0) return

    setSaving(true)
    try {
      const selectedPeople = candidates.filter(c => selectedCandidates.includes(c.id))
      
      for (const person of selectedPeople) {
        await onAddParticipant({
          tripId,
          personId: person.id,
          fullName: person.fullName,
          email: person.email,
          phone: person.phone,
          role: person.role,
          availability: person.availability,
          companyId: person.companyId,
          companyName: person.companyName,
          isStaff: person.isStaff,
          canEdit: false
        })
      }

      onClose()
    } catch (error) {
      console.error('Error adding participants:', error)
    } finally {
      setSaving(false)
    }
  }

  // Get availability icon
  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'partial':
        return <Clock className="w-4 h-4 text-amber-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] w-full h-full sm:max-w-4xl sm:h-auto sm:max-h-[90vh] flex flex-col overflow-auto sm:overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-golden-400">
              Add Participants
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Trip dates: {new Date(tripDateRange.start).toLocaleDateString()} - {new Date(tripDateRange.end).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-[#2a2a2a] px-6">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'staff'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
              {availableCandidates.length} available
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('everyone')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'everyone'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Everyone</span>
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
                className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
            
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={selectAllAvailable}
                className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                Select all available ({availableCandidates.length})
              </button>
              {selectedCandidates.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Clear selection
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCandidates.length} selected
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="flex-1 overflow-y-auto">
          {loading || staffLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading candidates...</span>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No candidates found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search or availability filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedCandidates.includes(candidate.id)
                const availabilityClasses = getAvailabilityClasses(candidate.availability)

                return (
                  <div
                    key={candidate.id}
                    className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${
                      candidate.isAlreadyAdded ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={candidate.isAlreadyAdded}
                        onChange={() => toggleCandidate(candidate.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                      />

                      {/* Avatar */}
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {candidate.fullName}
                          </h4>
                          {candidate.isAlreadyAdded && (
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              Already added
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {candidate.email && <span>{candidate.email}</span>}
                          {candidate.companyName && <span>{candidate.companyName}</span>}
                        </div>
                      </div>

                      {/* Availability */}
                      <div className="flex items-center space-x-2">
                        {getAvailabilityIcon(candidate.availability)}
                        <span className={`px-2 py-1 text-xs rounded-full ${availabilityClasses.chip}`}>
                          {candidate.availability}
                        </span>
                        
                        {/* Availability Details */}
                        {candidate.availability !== 'available' && candidate.conflictDays.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {candidate.conflictDays.length} conflict{candidate.conflictDays.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-[#2a2a2a]">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCandidates.length} participant{selectedCandidates.length !== 1 ? 's' : ''} selected
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddParticipants}
              disabled={selectedCandidates.length === 0 || saving}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                Add {selectedCandidates.length} Participant{selectedCandidates.length !== 1 ? 's' : ''}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}