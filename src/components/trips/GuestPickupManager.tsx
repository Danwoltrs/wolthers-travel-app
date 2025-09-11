import React, { useState, useEffect } from 'react'
import { Plane, Users, Clock, MapPin, Plus, Edit, Trash2, Calendar } from 'lucide-react'
import FlightInfoModal from './FlightInfoModal'

interface PickupGroup {
  id: string
  name: string
  companies: Array<{
    id: string
    name: string
    selectedContacts: Array<{
      name: string
      email: string
      phone?: string
    }>
  }>
  arrivalDate: string
  flightInfo?: {
    flightNumber: string
    airline: string
    arrivalTime: string
    departureAirport: string
    departureCity: string
    terminal?: string
    notes?: string
  }
  destination?: {
    type: 'hotel' | 'office'
    address: string
  }
  estimatedGuestCount: number
}

interface GuestPickupManagerProps {
  companies: Array<{
    id: string
    name: string
    selectedContacts?: Array<{
      name: string
      email: string
      phone?: string
    }>
  }>
  tripStartDate?: Date | null
  onPickupGroupsChange: (groups: PickupGroup[]) => void
  existingGroups?: PickupGroup[]
}

export default function GuestPickupManager({
  companies,
  tripStartDate,
  onPickupGroupsChange,
  existingGroups = []
}: GuestPickupManagerProps) {
  const [pickupGroups, setPickupGroups] = useState<PickupGroup[]>(existingGroups)
  const [showFlightModal, setShowFlightModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<PickupGroup | null>(null)
  const [showGroupCreator, setShowGroupCreator] = useState(false)

  // Auto-create initial groups based on companies
  useEffect(() => {
    if (pickupGroups.length === 0 && companies.length > 0) {
      const initialGroups = companies
        .filter(company => company.selectedContacts && company.selectedContacts.length > 0)
        .map((company, index) => ({
          id: `group-${company.id}`,
          name: `${company.name} Group`,
          companies: [company],
          arrivalDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
          estimatedGuestCount: company.selectedContacts?.length || 0
        }))
      
      if (initialGroups.length > 0) {
        setPickupGroups(initialGroups)
        onPickupGroupsChange(initialGroups)
      }
    }
  }, [companies, tripStartDate, pickupGroups.length, onPickupGroupsChange])

  const handleCreateGroup = () => {
    setShowGroupCreator(true)
  }

  const handleEditGroup = (group: PickupGroup) => {
    setEditingGroup(group)
    setShowFlightModal(true)
  }

  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = pickupGroups.filter(g => g.id !== groupId)
    setPickupGroups(updatedGroups)
    onPickupGroupsChange(updatedGroups)
  }

  const handleFlightInfoSubmit = (flightInfo: any, destinationType: 'hotel' | 'office', destinationAddress: string) => {
    if (!editingGroup) return

    const updatedGroup: PickupGroup = {
      ...editingGroup,
      flightInfo: {
        flightNumber: flightInfo.flightNumber,
        airline: flightInfo.airline,
        arrivalTime: flightInfo.arrivalTime,
        departureAirport: flightInfo.departureAirport,
        departureCity: flightInfo.departureCity,
        terminal: flightInfo.terminal,
        notes: flightInfo.notes
      },
      destination: {
        type: destinationType,
        address: destinationAddress
      },
      arrivalDate: flightInfo.arrivalDate
    }

    const updatedGroups = pickupGroups.map(g => 
      g.id === editingGroup.id ? updatedGroup : g
    )
    
    setPickupGroups(updatedGroups)
    onPickupGroupsChange(updatedGroups)
    setEditingGroup(null)
    setShowFlightModal(false)
  }

  const getGroupGuests = (group: PickupGroup) => {
    return group.companies.flatMap(company => 
      company.selectedContacts?.map(contact => ({
        name: contact.name,
        email: contact.email,
        companyName: company.name
      })) || []
    )
  }

  const formatArrivalDateTime = (group: PickupGroup) => {
    if (!group.arrivalDate) return 'Not scheduled'
    
    const date = new Date(group.arrivalDate)
    const dateStr = date.toLocaleDateString()
    
    if (group.flightInfo?.arrivalTime) {
      return `${dateStr} at ${group.flightInfo.arrivalTime}`
    }
    
    return dateStr
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Guest Pickup Coordination
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Organize airport pickups for different arrival groups
          </p>
        </div>
        <button
          onClick={handleCreateGroup}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Pickup Groups List */}
      {pickupGroups.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <Plane className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            No Pickup Groups Yet
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create pickup groups to coordinate airport transfers for different companies or arrival times
          </p>
          <button
            onClick={handleCreateGroup}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pickupGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden"
            >
              {/* Group Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Plane className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{group.name}</h4>
                      <p className="text-indigo-100 text-sm">
                        {group.estimatedGuestCount} guest{group.estimatedGuestCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-white/70 hover:text-white transition-colors"
                      title="Configure pickup details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-white/70 hover:text-white transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group Details */}
              <div className="p-4 space-y-4">
                {/* Companies & Guests */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Companies & Guests
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.companies.map((company) => (
                      <div key={company.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {company.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {company.selectedContacts?.map((contact) => (
                            <span
                              key={contact.email}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-800/30 text-emerald-700 dark:text-emerald-400"
                            >
                              {contact.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flight & Arrival Info */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Arrival Details
                    </span>
                  </div>
                  {group.flightInfo ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Flight:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {group.flightInfo.airline} {group.flightInfo.flightNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Arrives:</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatArrivalDateTime(group)}
                          </span>
                        </div>
                        {group.flightInfo.departureCity && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">From:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {group.flightInfo.departureCity}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        ⚠️ Flight details not configured
                      </p>
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="text-xs text-yellow-800 dark:text-yellow-300 underline mt-1"
                      >
                        Add flight information →
                      </button>
                    </div>
                  )}
                </div>

                {/* Destination */}
                {group.destination && (
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Destination
                      </span>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-900 dark:text-green-300">
                        {group.destination.type === 'hotel' ? '🏨 Hotel' : '🏢 Office'}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        {group.destination.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flight Info Modal */}
      <FlightInfoModal
        isOpen={showFlightModal}
        onClose={() => {
          setShowFlightModal(false)
          setEditingGroup(null)
        }}
        onSubmit={handleFlightInfoSubmit}
        selectedGuests={editingGroup ? getGroupGuests(editingGroup) : []}
        tripStartDate={tripStartDate}
        allowMultiplePassengers={true}
        pickupGroupName={editingGroup?.name}
      />
    </div>
  )
}