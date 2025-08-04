'use client'

import React from 'react'
import { Calendar, Users, Car, MapPin } from 'lucide-react'
import { formatDateRange } from '@/lib/utils'
import type { Trip } from '@/types'

interface TripHeaderProps {
  trip: Trip
}

export default function TripHeader({ trip }: TripHeaderProps) {
  // Mock data for guests and vehicles - replace with actual data
  const mockGuests = [
    { companyId: '1', companyName: 'Acme Coffee Co.', names: ['John Smith', 'Sarah Johnson'] },
    { companyId: '2', companyName: 'Bean & Beyond', names: ['Mike Wilson', 'Lisa Chen'] }
  ]

  const mockVehicles = [
    { id: '1', make: 'Toyota', model: 'Land Cruiser', licensePlate: 'ABC-123', driver: 'Carlos Rodriguez' },
    { id: '2', make: 'Ford', model: 'Transit', licensePlate: 'XYZ-789', driver: 'Maria Santos' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {/* Trip Title and Dates */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{trip.title}</h1>
        <div className="flex items-center text-gray-600">
          <Calendar className="w-5 h-5 mr-2" />
          <span className="text-lg">
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
        </div>
        {trip.description && (
          <p className="mt-3 text-gray-700 leading-relaxed">{trip.description}</p>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Guest List */}
        <div>
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 mr-2 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Participants</h2>
          </div>
          
          <div className="space-y-4">
            {mockGuests.map((group) => (
              <div key={group.companyId} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{group.companyName}</h3>
                <div className="space-y-1">
                  {group.names.map((name, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Vehicles and Drivers */}
        <div>
          <div className="flex items-center mb-4">
            <Car className="w-5 h-5 mr-2 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Fleet & Drivers</h2>
          </div>
          
          <div className="space-y-4">
            {mockVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <span className="text-sm text-gray-600 font-mono">
                    {vehicle.licensePlate}
                  </span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Driver: {vehicle.driver}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}