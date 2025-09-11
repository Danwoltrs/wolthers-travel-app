import React, { useState, useEffect } from 'react'
import { X, Plane, Clock, MapPin, ArrowRight, User, Calculator, AlertTriangle, CheckCircle } from 'lucide-react'
import { travelCalculationService, type IntercityTravelCalculation } from '@/lib/travel-calculation-service'
import { useLandingTimeCalculation } from '@/hooks/useLandingTimeCalculation'

interface FlightInfo {
  flightNumber: string
  airline: string
  arrivalDate: string
  arrivalTime: string
  departureAirport: string
  departureCity: string
  passengerName: string
  passengerNames?: string[]
  guestCount?: number
  terminal?: string
  notes?: string
}

interface EnhancedFlightInfoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (
    flightInfo: FlightInfo, 
    nextDestination: 'hotel' | 'office', 
    destinationAddress: string,
    calculatedItinerary?: IntercityTravelCalculation
  ) => void
  selectedGuests?: Array<{
    name: string
    email: string
    companyName: string
  }>
  tripStartDate?: Date | null
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

export default function EnhancedFlightInfoModal({
  isOpen,
  onClose,
  onSubmit,
  selectedGuests = [],
  tripStartDate,
  allowMultiplePassengers = false,
  pickupGroupName
}: EnhancedFlightInfoModalProps) {
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
  const [calculatedItinerary, setCalculatedItinerary] = useState<IntercityTravelCalculation | null>(null)
  const [calculatingTravel, setCalculatingTravel] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  
  const { data: landingTimeData, loading: landingTimeLoading, calculateLandingTime } = useLandingTimeCalculation()

  // Update arrival date when trip start date changes
  useEffect(() => {
    if (tripStartDate && isOpen) {
      setFlightInfo(prev => ({
        ...prev,
        arrivalDate: tripStartDate.toISOString().split('T')[0]
      }))
    }
  }, [tripStartDate, isOpen])

  // Update passenger names when selected guests change
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

  // Auto-calculate landing time when flight info is complete
  useEffect(() => {
    const isFlightInfoComplete = flightInfo.flightNumber && 
                                flightInfo.airline && 
                                flightInfo.arrivalDate && 
                                flightInfo.arrivalTime &&
                                flightInfo.departureAirport

    if (isFlightInfoComplete && !landingTimeLoading && !landingTimeData) {
      calculateLandingTime({
        arrivalTime: flightInfo.arrivalTime,
        arrivalDate: flightInfo.arrivalDate,
        departureAirport: flightInfo.departureAirport,
        arrivalAirport: 'GRU'
      })
    }
  }, [flightInfo, landingTimeData, landingTimeLoading, calculateLandingTime])

  if (!isOpen) return null

  const handleSubmitFlightInfo = () => {
    if (!isFormValid) return
    setShowDestinationPrompt(true)
  }

  const handleDestinationSelection = (destination: 'hotel' | 'office') => {
    setSelectedDestinationType(destination)
    setShowDestinationPrompt(false)
    setShowAddressInput(true)
    
    // Set default addresses
    if (destination === 'hotel') {
      setDestinationAddress('Sheraton Santos Hotel, Av. Washington Luís, 295 - Gonzaga, Santos - SP, 11055-001, Brazil')
    } else {
      setDestinationAddress('W&A HQ - Rua XV de Novembro, 96, Santos, SP, Brazil')
    }
  }

  const calculateCompleteItinerary = async () => {
    if (!selectedDestinationType || !destinationAddress.trim()) return

    setCalculatingTravel(true)
    setCalculationError(null)

    try {
      console.log('🧮 [EnhancedFlightModal] Calculating complete intercity travel itinerary')
      
      const itinerary = await travelCalculationService.calculateIntercityTravel(
        {
          flightNumber: flightInfo.flightNumber,
          airline: flightInfo.airline,
          arrivalDate: flightInfo.arrivalDate,
          arrivalTime: flightInfo.arrivalTime,
          departureAirport: flightInfo.departureAirport,
          passengerName: flightInfo.passengerName
        },
        {
          origin: 'GRU Airport, São Paulo, SP, Brazil',
          destination: destinationAddress,
          mode: 'driving'
        },
        {
          includePreparationTime: 10 // 10 minutes for driver preparation
        }
      )

      setCalculatedItinerary(itinerary)
      console.log('✅ [EnhancedFlightModal] Itinerary calculation complete')
    } catch (error) {
      console.error('❌ [EnhancedFlightModal] Itinerary calculation failed:', error)
      setCalculationError(error instanceof Error ? error.message : 'Failed to calculate travel itinerary')
    } finally {
      setCalculatingTravel(false)
    }
  }

  const handleAddressSubmit = async () => {
    if (!selectedDestinationType || !destinationAddress.trim()) return

    // Calculate complete itinerary before submitting
    await calculateCompleteItinerary()

    // Submit with calculated itinerary
    onSubmit(flightInfo, selectedDestinationType, destinationAddress, calculatedItinerary || undefined)
    onClose()
    
    // Reset state
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
    setCalculatedItinerary(null)
  }

  const updateFlightInfo = (updates: Partial<FlightInfo>) => {
    setFlightInfo(prev => ({ ...prev, ...updates }))
  }

  const isFormValid = flightInfo.flightNumber && 
                     flightInfo.airline && 
                     flightInfo.arrivalDate && 
                     flightInfo.arrivalTime && 
                     flightInfo.passengerName

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-pearl-200 dark:border-[#2a2a2a] w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-pearl-200 dark:border-[#2a2a2a] bg-gradient-to-r from-indigo-500 to-indigo-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Enhanced GRU Airport Pickup with Travel Calculations
                  {pickupGroupName && (
                    <span className="text-indigo-200 text-base font-normal ml-2">({pickupGroupName})</span>
                  )}
                </h2>
                <p className="text-indigo-100 text-sm">
                  {showDestinationPrompt 
                    ? 'Where to next?' 
                    : showAddressInput 
                    ? 'Calculating complete travel itinerary...'
                    : 'Flight details with automatic distance & landing time calculations'}
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
            /* Flight Info Form with Auto-Calculations */
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
                
                <input
                  type="text"
                  value={flightInfo.passengerName}
                  onChange={(e) => updateFlightInfo({ passengerName: e.target.value })}
                  placeholder={allowMultiplePassengers ? "Passenger names (comma-separated)" : "Enter guest name"}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                
                {/* Display selected guests info */}
                {selectedGuests.length > 0 && (
                  <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Selected Guests:</p>
                    <div className="space-y-1">
                      {selectedGuests.map((guest, index) => (
                        <div key={guest.email} className="text-sm text-blue-800 dark:text-blue-400">
                          • {guest.name} ({guest.companyName})
                        </div>
                      ))}
                    </div>
                  </div>
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
                    Departure Airport *
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
                    placeholder="Auto-filled or enter manually"
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
                  <input
                    type="time"
                    id="arrivalTime"
                    value={flightInfo.arrivalTime}
                    onChange={(e) => updateFlightInfo({ arrivalTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
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

              {/* Landing Time Calculation Display */}
              {landingTimeData && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                    <h3 className="text-lg font-medium text-emerald-900 dark:text-emerald-300">
                      Landing Time Calculation
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 block font-medium">Scheduled Arrival:</span>
                      <span className="text-emerald-900 dark:text-emerald-300">
                        {landingTimeData.scheduledArrival.time} on {new Date(landingTimeData.scheduledArrival.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 block font-medium">Estimated Landing:</span>
                      <span className="text-emerald-900 dark:text-emerald-300">
                        {landingTimeData.estimatedLandingTime.time}
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-700 dark:text-emerald-400 block font-medium">Pickup Time:</span>
                      <span className="text-emerald-900 dark:text-emerald-300 font-semibold">
                        {landingTimeData.recommendedPickupTime.time}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2">
                    {landingTimeData.bufferCalculation.bufferReason}
                  </p>
                </div>
              )}

              {/* Notes */}
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
            </div>
          ) : showDestinationPrompt ? (
            /* Destination Selection */
            <div className="text-center space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-emerald-500 p-3 rounded-full">
                    <Plane className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-2">
                  Flight Information Saved with Landing Time Calculation!
                </h3>
                {landingTimeData && (
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Pickup scheduled for {flightInfo.passengerName} at {landingTimeData.recommendedPickupTime.time}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Where should we drive after pickup?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We'll calculate the complete travel itinerary with distances and times
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
                      Drive to hotel with calculated distance & time
                    </p>
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
                      Drive to office with route optimization
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Address Input with Travel Calculation */
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-emerald-500 p-3 rounded-full">
                    {calculatingTravel ? (
                      <Calculator className="w-6 h-6 text-white animate-pulse" />
                    ) : (
                      <MapPin className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-2 text-center">
                  {selectedDestinationType === 'hotel' ? 'Hotel Destination' : 'Office Destination'}
                </h3>
                <p className="text-emerald-700 dark:text-emerald-400 text-center">
                  {calculatingTravel ? 'Calculating complete travel itinerary...' : 'Enter destination for distance calculation'}
                </p>
              </div>

              <div>
                <label htmlFor="destinationAddress" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {selectedDestinationType === 'hotel' ? 'Hotel Address *' : 'Office Address *'}
                </label>
                <textarea
                  id="destinationAddress"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  rows={3}
                  placeholder={selectedDestinationType === 'hotel' 
                    ? 'Enter hotel name and complete address...' 
                    : 'Enter office name and complete address...'}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Display calculated itinerary if available */}
              {calculatedItinerary && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Complete Travel Itinerary Calculated
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-blue-900 dark:text-blue-300">Drive Distance:</span>
                        <span className="text-blue-700 dark:text-blue-400 ml-2">
                          {calculatedItinerary.route.distance.distance.text}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-900 dark:text-blue-300">Drive Time:</span>
                        <span className="text-blue-700 dark:text-blue-400 ml-2">
                          {calculatedItinerary.route.distance.duration.text}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-300">Activities Created:</span>
                      <span className="text-blue-700 dark:text-blue-400 ml-2">
                        {calculatedItinerary.activities.length} activities (Flight Landing, Pickup, Drive, Arrival)
                      </span>
                    </div>
                    {calculatedItinerary.flightLanding && (
                      <div>
                        <span className="font-medium text-blue-900 dark:text-blue-300">Pickup Time:</span>
                        <span className="text-blue-700 dark:text-blue-400 ml-2">
                          {new Date(calculatedItinerary.flightLanding.recommendedPickupTime.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Calculation Error */}
              {calculationError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <h4 className="font-medium text-red-900 dark:text-red-300">Calculation Error</h4>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-400">{calculationError}</p>
                </div>
              )}

              {/* Quick Address Options */}
              {selectedDestinationType === 'hotel' && (
                <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-2">Common Hotels in Santos</h4>
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
                disabled={!destinationAddress.trim() || calculatingTravel}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {calculatingTravel ? (
                  <>
                    <Calculator className="w-4 h-4 animate-pulse" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Itinerary</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSubmitFlightInfo}
                disabled={!isFormValid || landingTimeLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                {landingTimeLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}