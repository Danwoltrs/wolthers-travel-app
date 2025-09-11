import React, { useState } from 'react'
import { MapPin, Car, Plane, Ship, Navigation, Users } from 'lucide-react'
import type { TripFormData } from './TripCreationModal'
import FlightInfoModal from './FlightInfoModal'
import GuestPickupManager from './GuestPickupManager'

interface StartingPointSelectionStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface StartingPointOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const startingPointOptions: StartingPointOption[] = [
  {
    id: 'santos',
    name: 'Santos',
    description: 'Visit Wolthers HQ and exporters in Santos',
    icon: <Ship className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'cerrado',
    name: 'Cerrado Region',
    description: 'North to south routing through coffee-growing regions',
    icon: <Navigation className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'uberlandia',
    name: 'Fly to Cerrado',
    description: 'Fly to Cerrado - with either rental or Wolthers driver to pick us up',
    icon: <Plane className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    id: 'other_location',
    name: 'Other Location',
    description: 'Specify any custom starting location in Brazil',
    icon: <MapPin className="w-6 h-6" />,
    color: 'bg-gray-500'
  },
  {
    id: 'gru_airport',
    name: 'GRU Airport Pickup',
    description: 'Pick up from GRU airport, then drive to Santos or Interior regions',
    icon: <Plane className="w-6 h-6" />,
    color: 'bg-indigo-500'
  },
  {
    id: 'multi_company_pickup',
    name: 'Multi-Company Coordination',
    description: 'Coordinate pickups for multiple companies with different arrival times',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-purple-500'
  }
]

export default function StartingPointSelectionStep({ formData, updateFormData }: StartingPointSelectionStepProps) {
  const [selectedStartingPoint, setSelectedStartingPoint] = useState<string>(
    formData.startingPoint || ''
  )
  const [customLocation, setCustomLocation] = useState<string>(
    formData.startingPoint && !startingPointOptions.some(opt => opt.id === formData.startingPoint) 
      ? formData.startingPoint 
      : ''
  )
  const [showCustomInput, setShowCustomInput] = useState<boolean>(
    formData.startingPoint === 'other' || 
    (formData.startingPoint && !startingPointOptions.some(opt => opt.id === formData.startingPoint))
  )
  const [showFlightModal, setShowFlightModal] = useState(false)
  const [flightInfo, setFlightInfo] = useState<any>(null)
  const [nextDestination, setNextDestination] = useState<'hotel' | 'office' | null>(null)
  const [showPickupManager, setShowPickupManager] = useState(false)
  const [pickupGroups, setPickupGroups] = useState<any[]>([])

  const handleStartingPointSelect = (pointId: string) => {
    if (pointId === 'other' || pointId === 'other_location') {
      setShowCustomInput(true)
      setSelectedStartingPoint('other')
      updateFormData({ startingPoint: customLocation || 'other' })
    } else if (pointId === 'gru_airport') {
      // Show flight info modal for GRU Airport pickup
      setShowFlightModal(true)
    } else if (pointId === 'multi_company_pickup') {
      // Show multi-company pickup manager
      setShowPickupManager(true)
      setSelectedStartingPoint(pointId)
      updateFormData({ startingPoint: pointId })
    } else {
      setShowCustomInput(false)
      setSelectedStartingPoint(pointId)
      setCustomLocation('')
      updateFormData({ startingPoint: pointId })
    }
  }

  const handleCustomLocationChange = (value: string) => {
    setCustomLocation(value)
    if (showCustomInput) {
      updateFormData({ startingPoint: value || 'other' })
    }
  }

  const handleFlightInfoSubmit = (flightData: any, destination: 'hotel' | 'office', destinationAddress: string) => {
    setFlightInfo(flightData)
    setNextDestination(destination)
    setSelectedStartingPoint('gru_airport')
    setShowFlightModal(false)
    
    // Update form data with flight info, destination, and address
    updateFormData({ 
      startingPoint: 'gru_airport',
      flightInfo: flightData,
      nextDestination: destination,
      destinationAddress: destinationAddress
    })
  }

  const handlePickupGroupsChange = (groups: any[]) => {
    setPickupGroups(groups)
    updateFormData({ 
      startingPoint: 'multi_company_pickup',
      pickupGroups: groups
    })
  }

  // Check if multi-company pickup is needed based on selected companies
  const hasMultipleCompaniesWithGuests = () => {
    const companiesWithGuests = (formData.companies || []).filter(company => 
      (company as any).selectedContacts && (company as any).selectedContacts.length > 0
    )
    return companiesWithGuests.length > 1
  }

  // Get all guests from selected companies
  const getAllSelectedGuests = () => {
    if (!formData.companies) return []
    
    return formData.companies.flatMap(company => {
      const companyWithContacts = company as any
      return companyWithContacts.selectedContacts?.map((contact: any) => ({
        name: contact.name,
        email: contact.email,
        companyName: company.name
      })) || []
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-emerald-300 mb-2">
          Where are we starting the trip?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your departure point to optimize route planning and logistics
        </p>
      </div>

      {/* Smart Suggestion for Multi-Company Pickup */}
      {hasMultipleCompaniesWithGuests() && selectedStartingPoint !== 'multi_company_pickup' && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 dark:bg-purple-800/30 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-1">
                Multiple Companies Detected
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
                You have guests from multiple companies. Consider using Multi-Company Coordination to organize different arrival times and pickup groups.
              </p>
              <button
                onClick={() => handleStartingPointSelect('multi_company_pickup')}
                className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Setup Multi-Company Pickup →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starting Point Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {startingPointOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleStartingPointSelect(option.id)}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200 text-left
              hover:border-emerald-300 dark:hover:border-emerald-600
              hover:bg-emerald-50 dark:hover:bg-emerald-900/20
              ${selectedStartingPoint === option.id
                ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]'
              }
            `}
          >
            {/* Selection indicator */}
            {selectedStartingPoint === option.id && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <MapPin className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className={`${option.color} p-3 rounded-lg text-white flex-shrink-0`}>
                {option.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300 mb-1">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        ))}

      </div>

      {/* Custom Location Input */}
      {showCustomInput && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-6">
          <label htmlFor="customLocation" className="block text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-2">
            Custom Starting Location
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <MapPin className="w-4 h-4 text-emerald-500" />
            </div>
            <input
              type="text"
              id="customLocation"
              value={customLocation}
              onChange={(e) => handleCustomLocationChange(e.target.value)}
              placeholder="Enter city, airport, or specific location..."
              className="w-full pl-10 pr-4 py-3 border border-emerald-300 dark:border-emerald-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-emerald-400 dark:placeholder-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            This will help optimize route planning and logistics for your trip
          </p>
        </div>
      )}

      {/* Selected Summary */}
      {(selectedStartingPoint && selectedStartingPoint !== 'other' && selectedStartingPoint !== 'gru_airport') && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900 dark:text-emerald-300">
                Starting from {startingPointOptions.find(opt => opt.id === selectedStartingPoint)?.name}
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your trip will begin from this location and routes will be optimized accordingly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GRU Airport Flight Info Summary */}
      {selectedStartingPoint === 'gru_airport' && flightInfo && nextDestination && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl border border-indigo-200 dark:border-indigo-700 p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-indigo-500 p-3 rounded-lg text-white flex-shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                GRU Airport Pickup Scheduled
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-indigo-700 dark:text-indigo-400 mb-1">
                    <strong>Passenger:</strong> {flightInfo.passengerName}
                  </p>
                  <p className="text-indigo-700 dark:text-indigo-400 mb-1">
                    <strong>Flight:</strong> {flightInfo.airline} {flightInfo.flightNumber}
                  </p>
                  <p className="text-indigo-700 dark:text-indigo-400">
                    <strong>Arrival:</strong> {new Date(flightInfo.arrivalDate).toLocaleDateString()} at {flightInfo.arrivalTime}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-700 dark:text-indigo-400 mb-1">
                    <strong>Next Destination:</strong> {nextDestination === 'hotel' ? 'Hotel Check-in' : 'Office Location'}
                  </p>
                  {flightInfo.departureCity && (
                    <p className="text-indigo-700 dark:text-indigo-400 mb-1">
                      <strong>From:</strong> {flightInfo.departureCity} ({flightInfo.departureAirport})
                    </p>
                  )}
                  {flightInfo.notes && (
                    <p className="text-indigo-700 dark:text-indigo-400">
                      <strong>Notes:</strong> {flightInfo.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  Your calendar will start with pickup at GRU Airport, followed by drive to {nextDestination === 'hotel' ? 'hotel' : 'business location'}
                </p>
              </div>
              <button
                onClick={() => setShowFlightModal(true)}
                className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
              >
                Edit flight information
              </button>
            </div>
          </div>
        </div>
      )}

      {(showCustomInput && customLocation) && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl border border-emerald-200 dark:border-emerald-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-2 rounded-lg text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900 dark:text-emerald-300">
                Starting from {customLocation}
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your trip will begin from this location and routes will be optimized accordingly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Company Pickup Manager */}
      {showPickupManager && selectedStartingPoint === 'multi_company_pickup' && (
        <div className="mt-8">
          <GuestPickupManager
            companies={formData.companies || []}
            tripStartDate={formData.startDate}
            onPickupGroupsChange={handlePickupGroupsChange}
            existingGroups={pickupGroups}
          />
        </div>
      )}

      {/* Flight Info Modal */}
      <FlightInfoModal
        isOpen={showFlightModal}
        onClose={() => setShowFlightModal(false)}
        onSubmit={handleFlightInfoSubmit}
        selectedGuests={(() => {
          // Extract selected guests from buyer companies
          const guests: Array<{name: string, email: string, companyName: string}> = []
          console.log('🔍 [FlightModal] Extracting guests from formData:', {
            companies: formData.companies,
            hasCompanies: !!formData.companies,
            companiesCount: formData.companies?.length || 0
          })
          
          if (formData.companies) {
            formData.companies.forEach((company, index) => {
              console.log(`🔍 [FlightModal] Company ${index}:`, {
                name: company.name,
                fantasyName: company.fantasyName,
                hasParticipants: !!company.participants,
                participantsCount: company.participants?.length || 0,
                participants: company.participants
              })
              
              if (company.participants) {
                company.participants.forEach((participant, index) => {
                  console.log(`🔍 [FlightModal] Participant ${index}:`, {
                    participant,
                    hasName: !!participant.name,
                    hasEmail: !!participant.email,
                    participantKeys: Object.keys(participant),
                    fullStructure: JSON.stringify(participant)
                  })
                  if (participant.name && participant.email) {
                    guests.push({
                      name: participant.name,
                      email: participant.email,
                      companyName: company.fantasyName || company.name
                    })
                  }
                })
              }
            })
          }
          
          console.log('🔍 [FlightModal] Final guests array:', guests)
          return guests
        })()}
        tripStartDate={formData.startDate}
      />
    </div>
  )
}