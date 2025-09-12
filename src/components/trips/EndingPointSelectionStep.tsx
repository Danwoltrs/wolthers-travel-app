import React, { useState } from 'react'
import { MapPin, Car, Plane, Ship, Navigation, Users, ArrowRight } from 'lucide-react'
import type { TripFormData } from './TripCreationModal'
import FlightInfoModal from './FlightInfoModal'
import GuestPickupManager from './GuestPickupManager'

interface EndingPointSelectionStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface EndingPointOption {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

const endingPointOptions: EndingPointOption[] = [
  {
    id: 'santos',
    name: 'Santos',
    description: 'Return to Wolthers HQ in Santos port',
    icon: <Ship className="w-6 h-6" />,
    color: 'bg-blue-500'
  },
  {
    id: 'gru_airport',
    name: 'Airport dropoff',
    description: 'Drop-off at GRU airport for international departure',
    icon: <Plane className="w-6 h-6" />,
    color: 'bg-indigo-500'
  },
  {
    id: 'guarulhos',
    name: 'Guarulhos Area',
    description: 'End trip in Guarulhos metropolitan area',
    icon: <Navigation className="w-6 h-6" />,
    color: 'bg-green-500'
  },
  {
    id: 'last_visit',
    name: 'Last Company Visit',
    description: 'End trip at the final company visit location',
    icon: <MapPin className="w-6 h-6" />,
    color: 'bg-purple-500'
  },
  {
    id: 'other_location',
    name: 'Other Location',
    description: 'Specify any custom ending location in Brazil',
    icon: <MapPin className="w-6 h-6" />,
    color: 'bg-gray-500'
  },
  {
    id: 'multi_company_dropoff',
    name: 'Multi-Company Drop-offs',
    description: 'Coordinate drop-offs for multiple companies at different locations',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-orange-500'
  }
]

export default function EndingPointSelectionStep({ formData, updateFormData }: EndingPointSelectionStepProps) {
  const [selectedEndingPoint, setSelectedEndingPoint] = useState<string>(
    formData.endingPoint || ''
  )
  const [customLocation, setCustomLocation] = useState<string>(
    formData.endingPoint && !endingPointOptions.some(opt => opt.id === formData.endingPoint) 
      ? formData.endingPoint 
      : ''
  )
  const [showCustomInput, setShowCustomInput] = useState<boolean>(
    formData.endingPoint === 'other' || 
    (formData.endingPoint && !endingPointOptions.some(opt => opt.id === formData.endingPoint))
  )
  const [showFlightModal, setShowFlightModal] = useState(false)
  const [flightInfo, setFlightInfo] = useState<any>(null)
  const [showDropoffManager, setShowDropoffManager] = useState(false)
  const [dropoffGroups, setDropoffGroups] = useState<any[]>([])

  const handleEndingPointSelect = (pointId: string) => {
    if (pointId === 'other' || pointId === 'other_location') {
      setShowCustomInput(true)
      setSelectedEndingPoint('other')
      updateFormData({ endingPoint: customLocation || 'other' })
    } else if (pointId === 'gru_airport') {
      // Show flight info modal for GRU Airport drop-off
      setShowFlightModal(true)
    } else if (pointId === 'multi_company_dropoff') {
      // Show multi-company drop-off manager
      setShowDropoffManager(true)
      setSelectedEndingPoint(pointId)
      updateFormData({ endingPoint: pointId })
    } else {
      setShowCustomInput(false)
      setSelectedEndingPoint(pointId)
      setCustomLocation('')
      updateFormData({ endingPoint: pointId })
    }
  }

  const handleCustomLocationChange = (value: string) => {
    setCustomLocation(value)
    if (showCustomInput) {
      updateFormData({ endingPoint: value || 'other' })
    }
  }

  const handleFlightInfoSubmit = (flightData: any, destination: 'hotel' | 'office', destinationAddress: string) => {
    setFlightInfo(flightData)
    setSelectedEndingPoint('gru_airport')
    setShowFlightModal(false)
    
    // Update form data with flight info for departure
    updateFormData({ 
      endingPoint: 'gru_airport',
      departureFlightInfo: flightData,
      preFlightDestination: destination,
      preFlightDestinationAddress: destinationAddress
    })
  }

  const handleDropoffGroupsChange = (groups: any[]) => {
    setDropoffGroups(groups)
    updateFormData({ 
      endingPoint: 'multi_company_dropoff',
      dropoffGroups: groups
    })
  }

  // Check if multi-company drop-off is needed based on selected companies
  const hasMultipleCompaniesWithGuests = () => {
    const companiesWithGuests = (formData.companies || []).filter(company => {
      const companyWithParticipants = company as any
      const participants = companyWithParticipants.participants || companyWithParticipants.selectedContacts || []
      return participants.length > 0
    })
    return companiesWithGuests.length > 1
  }

  // Get all guests from selected companies
  const getAllSelectedGuests = () => {
    if (!formData.companies) return []
    
    return formData.companies.flatMap(company => {
      const companyWithParticipants = company as any
      // Handle both participants and selectedContacts for backward compatibility
      const participants = companyWithParticipants.participants || companyWithParticipants.selectedContacts || []
      return participants.map((participant: any) => ({
        name: participant.name || participant.full_name,
        email: participant.email,
        companyName: companyWithParticipants.fantasyName || companyWithParticipants.fantasy_name || company.name
      }))
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-emerald-300 mb-2">
          Where does the trip end?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your final destination to complete route planning and logistics
        </p>
        {formData.startingPoint && (
          <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Trip route:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {formData.startingPoint}
            </span>
            <ArrowRight className="w-4 h-4" />
            <span>Host company visits</span>
            <ArrowRight className="w-4 h-4" />
            <span className="font-medium text-orange-600 dark:text-orange-400">
              {selectedEndingPoint || 'Select ending point'}
            </span>
          </div>
        )}
      </div>

      {/* Smart Suggestion for Multi-Company Drop-off */}
      {hasMultipleCompaniesWithGuests() && selectedEndingPoint !== 'multi_company_dropoff' && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 dark:bg-orange-800/30 p-2 rounded-lg">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-1">
                Multiple Companies Detected
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                You have guests from multiple companies. Consider using Multi-Company Drop-offs to coordinate different departure times and destinations.
              </p>
              <button
                onClick={() => handleEndingPointSelect('multi_company_dropoff')}
                className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Setup Multi-Company Drop-off →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ending Point Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {endingPointOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleEndingPointSelect(option.id)}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200 text-left
              hover:border-orange-300 dark:hover:border-orange-600
              hover:bg-orange-50 dark:hover:bg-orange-900/20
              ${selectedEndingPoint === option.id
                ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30'
                : 'border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]'
              }
            `}
          >
            {/* Selection indicator */}
            {selectedEndingPoint === option.id && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-orange-300 mb-1">
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
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-700 p-6">
          <label htmlFor="customEndingLocation" className="block text-sm font-medium text-orange-800 dark:text-orange-300 mb-2">
            Custom Ending Location
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <MapPin className="w-4 h-4 text-orange-500" />
            </div>
            <input
              type="text"
              id="customEndingLocation"
              value={customLocation}
              onChange={(e) => handleCustomLocationChange(e.target.value)}
              placeholder="Enter city, airport, or specific location..."
              className="w-full pl-10 pr-4 py-3 border border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-orange-400 dark:placeholder-orange-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
            This will help optimize route planning and final logistics for your trip
          </p>
        </div>
      )}

      {/* Selected Summary */}
      {(selectedEndingPoint && selectedEndingPoint !== 'other' && selectedEndingPoint !== 'gru_airport') && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-orange-900 dark:text-orange-300">
                Ending at {endingPointOptions.find(opt => opt.id === selectedEndingPoint)?.name}
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Your trip will end at this location and final routes will be optimized accordingly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GRU Airport Flight Info Summary */}
      {selectedEndingPoint === 'gru_airport' && flightInfo && (
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl border border-indigo-200 dark:border-indigo-700 p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-indigo-500 p-3 rounded-lg text-white flex-shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                Airport Dropoff Scheduled
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
                    <strong>Departure:</strong> {flightInfo.departureDate && new Date(flightInfo.departureDate).toLocaleDateString()} at {flightInfo.departureTime}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-700 dark:text-indigo-400 mb-1">
                    <strong>Destination:</strong> {flightInfo.arrivalCity} ({flightInfo.arrivalAirport})
                  </p>
                  {flightInfo.notes && (
                    <p className="text-indigo-700 dark:text-indigo-400">
                      <strong>Notes:</strong> {flightInfo.notes}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  Your calendar will end with drop-off at GRU Airport for departure
                </p>
              </div>
              <button
                onClick={() => setShowFlightModal(true)}
                className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline"
              >
                Edit departure flight information
              </button>
            </div>
          </div>
        </div>
      )}

      {(showCustomInput && customLocation) && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-medium text-orange-900 dark:text-orange-300">
                Ending at {customLocation}
              </h4>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Your trip will end at this location and final routes will be optimized accordingly
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Company Drop-off Manager */}
      {showDropoffManager && selectedEndingPoint === 'multi_company_dropoff' && (
        <div className="mt-8">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300 mb-4">
              Configure Multi-Company Drop-offs
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-400 mb-4">
              Set up different drop-off locations and times for each company group based on their departure schedules.
            </p>
            <GuestPickupManager
              companies={formData.companies || []}
              tripStartDate={formData.endDate} // Use end date for drop-offs
              onPickupGroupsChange={handleDropoffGroupsChange}
              existingGroups={dropoffGroups}
              mode="dropoff" // This would need to be added to GuestPickupManager
            />
          </div>
        </div>
      )}

      {/* Flight Info Modal for Departures */}
      <FlightInfoModal
        isOpen={showFlightModal}
        onClose={() => setShowFlightModal(false)}
        onSubmit={handleFlightInfoSubmit}
        selectedGuests={(() => {
          // Extract selected guests from BUYER companies only (exclude hosts and Wolthers staff)
          const guests: Array<{name: string, email: string, companyName: string}> = []
          
          // Only process buyer companies (formData.companies), not host companies
          const buyerCompanies = formData.companies || []
          
          buyerCompanies.forEach((company) => {
            // Skip Wolthers companies
            const isWolthersCompany = company.name?.toLowerCase().includes('wolthers') || 
                                     ((company as any).fantasyName || (company as any).fantasy_name)?.toLowerCase().includes('wolthers')
            
            if (!isWolthersCompany && (company as any).participants) {
              ;(company as any).participants.forEach((participant: any) => {
                const participantName = participant.name || participant.full_name
                const participantEmail = participant.email
                
                if (participantName && participantEmail) {
                  guests.push({
                    name: participantName,
                    email: participantEmail,
                    companyName: (company as any).fantasyName || (company as any).fantasy_name || company.name
                  })
                }
              })
            }
          })
          
          return guests
        })()}
        tripStartDate={formData.endDate} // Use end date for departure flights
        mode="departure"
      />
    </div>
  )
}