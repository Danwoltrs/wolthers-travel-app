import React, { useState } from 'react'
import { TripFormData } from './TripCreationModal'
import { Plane, Plus, Trash2, MapPin, Clock, DollarSign, ArrowRight } from 'lucide-react'

interface Flight {
  id: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    city: string
    date: string
    time: string
  }
  arrival: {
    airport: string
    city: string
    date: string
    time: string
  }
  cost?: number
  bookingReference?: string
  notes?: string
}

interface FlightBookingStepProps {
  formData: TripFormData & { flights?: Flight[] }
  updateFormData: (data: Partial<TripFormData & { flights?: Flight[] }>) => void
}

export default function FlightBookingStep({ formData, updateFormData }: FlightBookingStepProps) {
  const [flights, setFlights] = useState<Flight[]>(formData.flights || [])

  // Add a new flight booking
  const addFlight = () => {
    const newFlight: Flight = {
      id: `flight_${Date.now()}`,
      airline: '',
      flightNumber: '',
      departure: {
        airport: '',
        city: '',
        date: formData.startDate?.toISOString().split('T')[0] || '',
        time: '09:00'
      },
      arrival: {
        airport: '',
        city: '',
        date: formData.startDate?.toISOString().split('T')[0] || '',
        time: '12:00'
      },
      cost: undefined,
      bookingReference: '',
      notes: ''
    }

    const updatedFlights = [...flights, newFlight]
    setFlights(updatedFlights)
    updateFormData({ flights: updatedFlights })
  }

  // Update flight information
  const updateFlight = (flightId: string, updates: Partial<Flight>) => {
    const updatedFlights = flights.map(flight =>
      flight.id === flightId ? { ...flight, ...updates } : flight
    )
    
    setFlights(updatedFlights)
    updateFormData({ flights: updatedFlights })
  }

  // Update nested flight information (departure/arrival)
  const updateFlightNested = (flightId: string, section: 'departure' | 'arrival', updates: Partial<Flight['departure']>) => {
    const updatedFlights = flights.map(flight =>
      flight.id === flightId 
        ? { ...flight, [section]: { ...flight[section], ...updates } }
        : flight
    )
    
    setFlights(updatedFlights)
    updateFormData({ flights: updatedFlights })
  }

  // Remove a flight booking
  const removeFlight = (flightId: string) => {
    const updatedFlights = flights.filter(flight => flight.id !== flightId)
    setFlights(updatedFlights)
    updateFormData({ flights: updatedFlights })
  }

  const totalCost = flights.reduce((sum, flight) => sum + (flight.cost || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Plane className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
          Flights & Travel Arrangements
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Arrange international flights and travel logistics for your conference attendance.
        </p>

        {/* Summary Stats */}
        {flights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center">
                <Plane className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Flights Booked</p>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-300">{flights.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">Total Cost</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-300">
                    {totalCost > 0 ? `$${totalCost.toLocaleString()}` : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flight List */}
        <div className="space-y-6">
          {flights.map((flight, index) => (
            <div key={flight.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Flight {index + 1}
                </h3>
                {flights.length > 1 && (
                  <button
                    onClick={() => removeFlight(flight.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Flight Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Airline *
                  </label>
                  <input
                    type="text"
                    value={flight.airline}
                    onChange={(e) => updateFlight(flight.id, { airline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., Swiss International Air Lines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Flight Number *
                  </label>
                  <input
                    type="text"
                    value={flight.flightNumber}
                    onChange={(e) => updateFlight(flight.id, { flightNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., LX318"
                  />
                </div>
              </div>

              {/* Departure and Arrival Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Departure */}
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3 flex items-center">
                    <Plane className="w-4 h-4 mr-1 rotate-45" />
                    Departure
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                        Airport *
                      </label>
                      <input
                        type="text"
                        value={flight.departure.airport}
                        onChange={(e) => updateFlightNested(flight.id, 'departure', { airport: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        placeholder="e.g., ZUR - Zurich Airport"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={flight.departure.city}
                        onChange={(e) => updateFlightNested(flight.id, 'departure', { city: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        placeholder="e.g., Zurich"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={flight.departure.date}
                          onChange={(e) => updateFlightNested(flight.id, 'departure', { date: e.target.value })}
                          className="w-full px-2 py-2 text-sm border border-blue-300 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                          Time *
                        </label>
                        <input
                          type="time"
                          value={flight.departure.time}
                          onChange={(e) => updateFlightNested(flight.id, 'departure', { time: e.target.value })}
                          className="w-full px-2 py-2 text-sm border border-blue-300 dark:border-blue-700 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrival */}
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-medium text-green-900 dark:text-green-300 mb-3 flex items-center">
                    <Plane className="w-4 h-4 mr-1 -rotate-45" />
                    Arrival
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                        Airport *
                      </label>
                      <input
                        type="text"
                        value={flight.arrival.airport}
                        onChange={(e) => updateFlightNested(flight.id, 'arrival', { airport: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-green-300 dark:border-green-700 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        placeholder="e.g., LHR - London Heathrow"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        value={flight.arrival.city}
                        onChange={(e) => updateFlightNested(flight.id, 'arrival', { city: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-green-300 dark:border-green-700 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        placeholder="e.g., London"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                          Date *
                        </label>
                        <input
                          type="date"
                          value={flight.arrival.date}
                          onChange={(e) => updateFlightNested(flight.id, 'arrival', { date: e.target.value })}
                          className="w-full px-2 py-2 text-sm border border-green-300 dark:border-green-700 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-green-800 dark:text-green-300 mb-1">
                          Time *
                        </label>
                        <input
                          type="time"
                          value={flight.arrival.time}
                          onChange={(e) => updateFlightNested(flight.id, 'arrival', { time: e.target.value })}
                          className="w-full px-2 py-2 text-sm border border-green-300 dark:border-green-700 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Flight Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cost (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={flight.cost || ''}
                      onChange={(e) => updateFlight(flight.id, { cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Booking Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={flight.bookingReference || ''}
                    onChange={(e) => updateFlight(flight.id, { bookingReference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., ABC123"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={flight.notes || ''}
                    onChange={(e) => updateFlight(flight.id, { notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., Seat preferences, meal requests, terminal information..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Flight Button */}
          <button
            onClick={addFlight}
            className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors group"
          >
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-medium">Add Flight Booking</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}