import React, { useState, useEffect } from 'react'
import { 
  Plane, 
  Car, 
  MapPin, 
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  ParkingCircle,
  Key,
  X
} from 'lucide-react'
import { TripFormData } from './TripCreationModal'
import type { User as UserType, Vehicle } from '@/types'

interface ConventionAirportTransportStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface AirportTransport {
  needsTransport: boolean
  driver?: UserType
  vehicle?: Vehicle
  departureInfo?: {
    date: string
    time: string
    airport: string
    terminal?: string
    flightNumber?: string
  }
  returnInfo?: {
    date: string
    time: string
    airport: string
    terminal?: string
    flightNumber?: string
  }
  parkingInfo?: {
    willParkAtAirport: boolean
    parkingLocation?: string
    parkingDuration?: string
    estimatedCost?: number
    whoWillDrive?: string
  }
}

export default function ConventionAirportTransportStep({ formData, updateFormData }: ConventionAirportTransportStepProps) {
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [airportTransport, setAirportTransport] = useState<AirportTransport>(() => {
    const existing = (formData as any).airportTransport
    return existing || {
      needsTransport: true,
      parkingInfo: {
        willParkAtAirport: false
      }
    }
  })

  const participatingStaff = formData.participants || []

  // Load available vehicles
  useEffect(() => {
    loadAvailableVehicles()
  }, [formData.startDate, formData.endDate])

  const loadAvailableVehicles = async () => {
    try {
      setLoading(true)
      
      const vehiclesResponse = await fetch('/api/vehicles/available', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          participantCount: participatingStaff.length
        })
      })

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json()
        setAvailableVehicles(vehiclesData.vehicles || [])
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAirportTransport = (updates: Partial<AirportTransport>) => {
    const updated = { ...airportTransport, ...updates }
    setAirportTransport(updated)
    updateFormData({ airportTransport: updated })
  }

  const updateParkingInfo = (updates: Partial<AirportTransport['parkingInfo']>) => {
    const updatedParkingInfo = { ...airportTransport.parkingInfo, ...updates }
    updateAirportTransport({ parkingInfo: updatedParkingInfo })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading transport options...</div>
        </div>
      </div>
    )
  }

  if (!airportTransport.needsTransport) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Airport Transport
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Configure transportation to and from the airport for your convention trip
          </p>
        </div>

        {/* No Transport Selected */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
            No Airport Transport Arranged
          </h3>
          <p className="text-yellow-700 dark:text-yellow-400 mb-4">
            Team members will arrange their own transportation to/from the airport
          </p>
          <button
            onClick={() => updateAirportTransport({ needsTransport: true })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Setup Airport Transport
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plane className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Airport Transport
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Configure transportation to and from the airport for your convention trip
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-800/30 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                {participatingStaff.length} Team Members Going to Convention
              </h3>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                {formData.startDate?.toLocaleDateString()} - {formData.endDate?.toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => updateAirportTransport({ needsTransport: false })}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
          >
            Skip Airport Transport
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Driver Selection */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 mr-2 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300">
                Who Will Drive to Airport?
              </h3>
            </div>

            <div className="space-y-3">
              {participatingStaff.map((staff) => (
                <label key={staff.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                  <input
                    type="radio"
                    name="airportDriver"
                    checked={airportTransport.driver?.id === staff.id}
                    onChange={() => updateAirportTransport({ driver: staff })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {staff.fullName || (staff as any).full_name || staff.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Will drive team to/from airport
                    </p>
                  </div>
                </label>
              ))}
              
              <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                <input
                  type="radio"
                  name="airportDriver"
                  checked={!airportTransport.driver}
                  onChange={() => updateAirportTransport({ driver: undefined })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    External Driver/Service
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Uber, taxi, or hired driver service
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Vehicle & Parking */}
        <div className="space-y-6">
          {/* Vehicle Selection */}
          {airportTransport.driver && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Car className="w-5 h-5 mr-2 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300">
                  Select Vehicle
                </h3>
              </div>

              <div className="space-y-3">
                {availableVehicles.map((vehicle) => (
                  <label key={vehicle.id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name="airportVehicle"
                      checked={airportTransport.vehicle?.id === vehicle.id}
                      onChange={() => updateAirportTransport({ vehicle })}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {vehicle.model} {vehicle.year}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {vehicle.color} • {vehicle.license_plate} • {vehicle.seating_capacity} seats
                      </p>
                    </div>
                  </label>
                ))}
                
                {availableVehicles.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Car className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No vehicles available</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Consider using a rental or external service
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parking Information */}
          {airportTransport.driver && airportTransport.vehicle && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-xl p-6">
              <div className="flex items-center mb-4">
                <ParkingCircle className="w-5 h-5 mr-2 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300">
                  Airport Parking
                </h3>
              </div>

              <div className="space-y-4">
                {/* Will park at airport */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="parkAtAirport"
                    checked={airportTransport.parkingInfo?.willParkAtAirport || false}
                    onChange={(e) => updateParkingInfo({ willParkAtAirport: e.target.checked })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="parkAtAirport" className="text-sm font-medium text-gray-900 dark:text-white">
                    Vehicle will stay parked at airport during trip
                  </label>
                </div>

                {airportTransport.parkingInfo?.willParkAtAirport && (
                  <div className="space-y-4 pl-6 border-l-2 border-emerald-200 dark:border-emerald-700">
                    {/* Parking location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parking Location
                      </label>
                      <select
                        value={airportTransport.parkingInfo?.parkingLocation || ''}
                        onChange={(e) => updateParkingInfo({ parkingLocation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select parking area</option>
                        <option value="terminal1_covered">Terminal 1 - Covered</option>
                        <option value="terminal1_open">Terminal 1 - Open Air</option>
                        <option value="terminal2_covered">Terminal 2 - Covered</option>
                        <option value="terminal2_open">Terminal 2 - Open Air</option>
                        <option value="remote_economy">Remote Economy Lot</option>
                        <option value="valet">Valet Service</option>
                      </select>
                    </div>

                    {/* Estimated cost */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimated Parking Cost (total)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">R$</span>
                        <input
                          type="number"
                          value={airportTransport.parkingInfo?.estimatedCost || ''}
                          onChange={(e) => updateParkingInfo({ estimatedCost: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Who will drive back */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Who will drive back from airport?
                      </label>
                      <select
                        value={airportTransport.parkingInfo?.whoWillDrive || ''}
                        onChange={(e) => updateParkingInfo({ whoWillDrive: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select driver for return trip</option>
                        {participatingStaff.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.fullName || (staff as any).full_name || staff.email}
                          </option>
                        ))}
                        <option value="same">Same person who drove there</option>
                        <option value="different_person">Different Wolthers staff member</option>
                        <option value="external">External driver/service</option>
                      </select>
                    </div>
                  </div>
                )}

                {!airportTransport.parkingInfo?.willParkAtAirport && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-300">Return Transport</p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          Driver will drop off team and return home, then pick them up when they return
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {(airportTransport.driver || !airportTransport.needsTransport) && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-900 dark:text-green-300">
                Airport Transport Configured
              </h4>
              {airportTransport.driver ? (
                <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <p>
                    <strong>{airportTransport.driver.fullName || (airportTransport.driver as any).full_name}</strong> will drive the team
                  </p>
                  {airportTransport.vehicle && (
                    <p>
                      Using <strong>{airportTransport.vehicle.model} {airportTransport.vehicle.year}</strong> ({airportTransport.vehicle.license_plate})
                    </p>
                  )}
                  {airportTransport.parkingInfo?.willParkAtAirport ? (
                    <p>Vehicle will stay parked at airport during the trip</p>
                  ) : (
                    <p>Driver will drop off and pick up the team (no airport parking)</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-700 dark:text-green-400">
                  Team will use external transportation service (Uber, taxi, etc.)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}