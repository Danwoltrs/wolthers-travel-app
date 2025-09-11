import React, { useState, useEffect } from 'react'
import { X, Plane, Clock, MapPin, ArrowRight, User } from 'lucide-react'

interface FlightInfo {
  flightNumber: string
  airline: string
  arrivalDate: string
  arrivalTime: string
  departureAirport: string
  departureCity: string
  passengerName: string
  passengerNames?: string[] // For multiple passengers
  guestCount?: number
  terminal?: string
  notes?: string
}

interface FlightInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (flightInfo: FlightInfo, nextDestination: 'hotel' | 'office', destinationAddress: string) => void
  selectedGuests?: Array<{
    name: string
    email: string
    companyName: string
  }>
  tripStartDate?: Date | null
  // Enhanced pickup functionality
  allowMultiplePassengers?: boolean
  pickupGroupName?: string
}

const airlines = [
  'LATAM Airlines',
  'Gol Linhas Aéreas',
  'Azul Linhas Aéreas',
  'American Airlines',
  'Delta Air Lines',
  'United Airlines',
  'Air France',
  'Lufthansa',
  'KLM Royal Dutch Airlines',
  'British Airways',
  'Turkish Airlines',
  'Emirates',
  'Qatar Airways',
  'Other'
]

const commonAirports = [
  { code: 'JFK', city: 'New York' },
  { code: 'LAX', city: 'Los Angeles' },
  { code: 'MIA', city: 'Miami' },
  { code: 'ATL', city: 'Atlanta' },
  { code: 'ORD', city: 'Chicago' },
  { code: 'DFW', city: 'Dallas' },
  { code: 'CDG', city: 'Paris' },
  { code: 'LHR', city: 'London' },
  { code: 'FRA', city: 'Frankfurt' },
  { code: 'AMS', city: 'Amsterdam' },
  { code: 'MAD', city: 'Madrid' },
  { code: 'FCO', city: 'Rome' },
  { code: 'DXB', city: 'Dubai' },
  { code: 'DOH', city: 'Doha' },
  { code: 'IST', city: 'Istanbul' }
]

export default function FlightInfoModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedGuests = [], 
  tripStartDate,
  allowMultiplePassengers = false,
  pickupGroupName
}: FlightInfoModalProps) {
  const [flightInfo, setFlightInfo] = useState<FlightInfo>({
    flightNumber: '',
    airline: '',
    arrivalDate: tripStartDate ? tripStartDate.toISOString().split('T')[0] : '',
    arrivalTime: '',
    departureAirport: '',
    departureCity: '',
    passengerName: selectedGuests.length > 0 ? 
      (allowMultiplePassengers ? 
        selectedGuests.map(g => g.name).join(', ') : 
        selectedGuests[0].name) : '',
    passengerNames: selectedGuests.map(g => g.name),
    guestCount: selectedGuests.length,
    terminal: '',
    notes: ''
  })

  const [showDestinationPrompt, setShowDestinationPrompt] = useState(false)
  const [showAddressInput, setShowAddressInput] = useState(false)
  const [selectedDestinationType, setSelectedDestinationType] = useState<'hotel' | 'office' | null>(null)
  const [destinationAddress, setDestinationAddress] = useState('')

  // Update arrival date when trip start date changes and passenger name when guests change
  useEffect(() => {
    if (tripStartDate && isOpen) {
      setFlightInfo(prev => ({
        ...prev,
        arrivalDate: tripStartDate.toISOString().split('T')[0]
      }))
    }
  }, [tripStartDate, isOpen])

  // Update passenger name when selected guests change
  useEffect(() => {
    if (selectedGuests.length > 0 && isOpen) {
      setFlightInfo(prev => ({
        ...prev,
        passengerName: allowMultiplePassengers ? 
          selectedGuests.map(g => g.name).join(', ') : 
          selectedGuests[0].name,
        passengerNames: selectedGuests.map(g => g.name),
        guestCount: selectedGuests.length
      }))
    }
  }, [selectedGuests, isOpen, allowMultiplePassengers])

  if (!isOpen) return null

  const handleSubmitFlightInfo = () => {
    // Validate required fields
    if (!flightInfo.flightNumber || !flightInfo.airline || !flightInfo.arrivalDate || !flightInfo.arrivalTime || !flightInfo.passengerName) {
      return
    }

    setShowDestinationPrompt(true)
  }

  const handleDestinationSelection = (destination: 'hotel' | 'office') => {
    setSelectedDestinationType(destination)
    setShowDestinationPrompt(false)
    setShowAddressInput(true)
    
    // Set default addresses
    if (destination === 'hotel') {
      setDestinationAddress('Sheraton Santos Hotel, Santos, SP, Brazil')
    } else {
      setDestinationAddress('Wolthers & Associates HQ, Santos, SP, Brazil')
    }
  }

  const handleAddressSubmit = () => {
    if (selectedDestinationType && destinationAddress.trim()) {
      onSubmit(flightInfo, selectedDestinationType, destinationAddress)
      onClose()
      // Reset for next use
      setFlightInfo({
        flightNumber: '',
        airline: '',
        arrivalDate: '',
        arrivalTime: '',
        departureAirport: '',
        departureCity: '',
        passengerName: '',
        terminal: '',
        notes: ''
      })
      setShowDestinationPrompt(false)
      setShowAddressInput(false)
      setSelectedDestinationType(null)
      setDestinationAddress('')
    }
  }

  const updateFlightInfo = (updates: Partial<FlightInfo>) => {
    setFlightInfo(prev => ({ ...prev, ...updates }))
  }

  const isFormValid = flightInfo.flightNumber && flightInfo.airline && flightInfo.arrivalDate && flightInfo.arrivalTime && flightInfo.passengerName

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-pearl-200 dark:border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-pearl-200 dark:border-[#2a2a2a] bg-gradient-to-r from-indigo-500 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  GRU Airport Pickup - Flight Information
                  {pickupGroupName && (
                    <span className="text-indigo-200 text-base font-normal ml-2">({pickupGroupName})</span>
                  )}
                </h2>
                <p className="text-indigo-100 text-sm">
                  {showDestinationPrompt 
                    ? 'Where to next?' 
                    : showAddressInput 
                    ? 'Specify destination address'
                    : allowMultiplePassengers
                    ? `Coordinating pickup for ${selectedGuests.length} guest${selectedGuests.length > 1 ? 's' : ''}`
                    : 'Enter flight details for airport pickup coordination'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!showDestinationPrompt && !showAddressInput ? (
            /* Flight Info Form */
            <div className="space-y-6">
              {/* Passenger Information */}
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {allowMultiplePassengers ? 'Passenger Names *' : 'Guest Name *'}
                  {selectedGuests.length > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-2">
                      ({selectedGuests.length} guest{selectedGuests.length > 1 ? 's' : ''} from {pickupGroupName || 'companies'})
                    </span>
                  )}
                </label>
                
                {selectedGuests.length > 0 ? (
                  /* Dropdown with guests + manual input option */
                  <div className="space-y-3">
                    {allowMultiplePassengers ? (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                          Auto-populated passengers from selected companies:
                        </p>
                        <div className="text-sm text-blue-800 dark:text-blue-400">
                          {selectedGuests.map((guest, index) => (
                            <div key={guest.email} className="flex items-center justify-between py-1">
                              <span>• {guest.name}</span>
                              <span className="text-xs text-blue-600 dark:text-blue-500">({guest.companyName})</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                          💡 These names will be used for pickup coordination. You can modify the passenger list below if needed.
                        </p>
                      </div>
                    ) : (
                      <select
                        value={flightInfo.passengerName}
                        onChange={(e) => updateFlightInfo({ passengerName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select guest or type custom name below</option>
                        {selectedGuests.map((guest) => (
                          <option key={guest.email} value={guest.name}>
                            {guest.name}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {/* Manual input field that works alongside dropdown */}
                    <div className="relative">
                      <input
                        type="text"
                        id="passengerName"
                        value={flightInfo.passengerName}
                        onChange={(e) => updateFlightInfo({ passengerName: e.target.value })}
                        placeholder={allowMultiplePassengers ? 
                          "Modify passenger list (comma-separated)" : 
                          "Or type guest name"}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      {allowMultiplePassengers && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1a1a1a] px-1">
                            {flightInfo.passengerName.split(',').filter(n => n.trim()).length} guests
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {selectedGuests.length > 0 && !allowMultiplePassengers && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-400">
                          💡 Select from the dropdown above or type a custom name. Available guests from {selectedGuests[0].companyName}:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedGuests.map((guest) => (
                            <span key={guest.email} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300">
                              {guest.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Show input field when no guests selected */
                  <input
                    type="text"
                    id="passengerName"
                    value={flightInfo.passengerName}
                    onChange={(e) => updateFlightInfo({ passengerName: e.target.value })}
                    placeholder="Enter guest name"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Flight Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="airline" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Airline *
                  </label>
                  <select
                    id="airline"
                    value={flightInfo.airline}
                    onChange={(e) => updateFlightInfo({ airline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select airline</option>
                    {airlines.map(airline => (
                      <option key={airline} value={airline}>{airline}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="flightNumber" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Flight Number *
                  </label>
                  <input
                    type="text"
                    id="flightNumber"
                    value={flightInfo.flightNumber}
                    onChange={(e) => updateFlightInfo({ flightNumber: e.target.value })}
                    placeholder="e.g., LA8084, G38031"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Departure Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="departureAirport" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Departure Airport
                  </label>
                  <select
                    id="departureAirport"
                    value={flightInfo.departureAirport}
                    onChange={(e) => {
                      const selected = commonAirports.find(airport => airport.code === e.target.value)
                      updateFlightInfo({ 
                        departureAirport: e.target.value,
                        departureCity: selected?.city || ''
                      })
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select departure airport</option>
                    {commonAirports.map(airport => (
                      <option key={airport.code} value={airport.code}>
                        {airport.code} - {airport.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="departureCity" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Departure City
                  </label>
                  <input
                    type="text"
                    id="departureCity"
                    value={flightInfo.departureCity}
                    onChange={(e) => updateFlightInfo({ departureCity: e.target.value })}
                    placeholder="Enter city if not in list"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Arrival Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="arrivalDate" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Arrival Date *
                  </label>
                  <input
                    type="date"
                    id="arrivalDate"
                    value={flightInfo.arrivalDate}
                    onChange={(e) => updateFlightInfo({ arrivalDate: e.target.value })}
                    min={today}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Arrival Time *
                  </label>
                  <div className="relative">
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="arrivalTime"
                      value={flightInfo.arrivalTime}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow only digits and colon, format as HH:MM
                        const formatted = value
                          .replace(/[^\d:]/g, '')
                          .replace(/^(\d{2})(\d)/, '$1:$2')
                          .substring(0, 5)
                        updateFlightInfo({ arrivalTime: formatted })
                      }}
                      onBlur={(e) => {
                        const value = e.target.value
                        // Validate and format on blur
                        const match = value.match(/^(\d{1,2}):?(\d{0,2})$/)
                        if (match) {
                          const hours = parseInt(match[1], 10)
                          const minutes = match[2] ? parseInt(match[2], 10) : 0
                          if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                            const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                            updateFlightInfo({ arrivalTime: formatted })
                          }
                        }
                      }}
                      style={{ paddingLeft: '32px' }}
                      className="w-full pr-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                      placeholder="HH:MM (24-hour format)"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="terminal" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Terminal
                  </label>
                  <input
                    type="text"
                    id="terminal"
                    value={flightInfo.terminal}
                    onChange={(e) => updateFlightInfo({ terminal: e.target.value })}
                    placeholder="e.g., Terminal 3"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  value={flightInfo.notes}
                  onChange={(e) => updateFlightInfo({ notes: e.target.value })}
                  placeholder="Any special requirements, delays, or additional information..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Flight Summary Card */}
              {isFormValid && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-300 mb-2">Flight Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-700 dark:text-indigo-400">Passenger:</span>
                      <span className="font-medium text-indigo-900 dark:text-indigo-300">{flightInfo.passengerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-700 dark:text-indigo-400">Flight:</span>
                      <span className="font-medium text-indigo-900 dark:text-indigo-300">{flightInfo.airline} {flightInfo.flightNumber}</span>
                    </div>
                    {flightInfo.departureCity && (
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-700 dark:text-indigo-400">From:</span>
                        <span className="font-medium text-indigo-900 dark:text-indigo-300">{flightInfo.departureCity} ({flightInfo.departureAirport})</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-700 dark:text-indigo-400">Arrives:</span>
                      <span className="font-medium text-indigo-900 dark:text-indigo-300">
                        {new Date(flightInfo.arrivalDate).toLocaleDateString()} at {flightInfo.arrivalTime}
                        {flightInfo.terminal && ` (${flightInfo.terminal})`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : showDestinationPrompt ? (
            /* Destination Prompt */
            <div className="text-center space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-emerald-500 p-3 rounded-full">
                    <Plane className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                  Flight Information Saved!
                </h3>
                <p className="text-emerald-700 dark:text-emerald-400">
                  Pickup scheduled for {allowMultiplePassengers && flightInfo.guestCount && flightInfo.guestCount > 1 
                    ? `${flightInfo.guestCount} guests` 
                    : flightInfo.passengerName} at GRU Airport
                  {pickupGroupName && (
                    <span className="block text-emerald-600 dark:text-emerald-500 text-sm mt-1">
                      Group: {pickupGroupName}
                    </span>
                  )}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Where should we drive to after pickup?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This will help us plan the route and schedule the rest of your trip
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleDestinationSelection('hotel')}
                  className="group p-6 border-2 border-gray-200 dark:border-[#2a2a2a] rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="bg-blue-500 p-3 rounded-lg group-hover:bg-emerald-500 transition-colors">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Hotel</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      Drive to hotel for check-in and accommodation
                    </p>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => handleDestinationSelection('office')}
                  className="group p-6 border-2 border-gray-200 dark:border-[#2a2a2a] rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200"
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="bg-orange-500 p-3 rounded-lg group-hover:bg-emerald-500 transition-colors">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Office Location</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      Drive directly to business meeting or office location
                    </p>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Address Input */
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-emerald-500 p-3 rounded-full">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-2 text-center">
                  {selectedDestinationType === 'hotel' ? 'Hotel Address' : 'Office Address'}
                </h3>
                <p className="text-emerald-700 dark:text-emerald-400 text-center">
                  Drive destination after airport pickup
                </p>
              </div>

              <div>
                <label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selectedDestinationType === 'hotel' ? 'Hotel Address *' : 'Office Address *'}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3 pointer-events-none">
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <textarea
                    id="destinationAddress"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    rows={3}
                    placeholder={selectedDestinationType === 'hotel' 
                      ? 'Enter hotel name and complete address...' 
                      : 'Enter office name and complete address...'}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This address will be used for route planning and calendar scheduling
                </p>
              </div>

              {selectedDestinationType === 'hotel' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Common Hotels in Santos</h4>
                  <div className="space-y-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setDestinationAddress('Sheraton Santos Hotel, Av. Washington Luís, 295 - Gonzaga, Santos - SP, 11055-001, Brazil')}
                      className="block w-full text-left text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline"
                    >
                      Sheraton Santos Hotel
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinationAddress('Ibis Santos Duque de Caxias, R. Brás Cubas, 211 - Centro, Santos - SP, 11013-161, Brazil')}
                      className="block w-full text-left text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline"
                    >
                      Ibis Santos Duque de Caxias
                    </button>
                  </div>
                </div>
              )}

              {selectedDestinationType === 'office' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-2">Common Office Locations</h4>
                  <div className="space-y-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setDestinationAddress('Wolthers & Associates HQ, Santos Port Area, Santos - SP, Brazil')}
                      className="block w-full text-left text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 underline"
                    >
                      Wolthers & Associates HQ - Santos
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinationAddress('Santos Port Authority, Praça Visconde de Mauá, s/n - Centro, Santos - SP, Brazil')}
                      className="block w-full text-left text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 underline"
                    >
                      Santos Port Authority
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showDestinationPrompt && (
          <div className="px-6 py-4 border-t border-pearl-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            {showAddressInput ? (
              <button
                onClick={handleAddressSubmit}
                disabled={!destinationAddress.trim()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>Add to Calendar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitFlightInfo}
                disabled={!isFormValid}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}