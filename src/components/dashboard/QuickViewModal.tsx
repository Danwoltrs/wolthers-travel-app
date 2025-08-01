import React from 'react'
import { X, Calendar, Users, Car, Clock, MapPin, Phone, Mail, Globe } from 'lucide-react'
import type { TripCard as TripCardType } from '@/types'
import { formatDateRange } from '@/lib/utils'

interface QuickViewModalProps {
  trip: TripCardType
  isOpen: boolean
  onClose: () => void
}

export default function QuickViewModal({ trip, isOpen, onClose }: QuickViewModalProps) {
  if (!isOpen) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">{trip.title}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.status)}`}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Trip Overview */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Trip Overview</h3>
            <p className="text-gray-700">{trip.subject}</p>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-5 h-5 mr-3 text-amber-600" />
                <div>
                  <span className="font-medium">Duration:</span>
                  <div className="text-sm">{formatDateRange(trip.startDate, trip.endDate)}</div>
                </div>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="w-5 h-5 mr-3 text-amber-600" />
                <div>
                  <span className="font-medium">Length:</span>
                  <div className="text-sm">{trip.duration} days</div>
                </div>
              </div>
            </div>
          </div>

          {/* Companies */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-orange-600" />
              Companies Visiting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trip.client.map((company) => (
                <div key={company.id} className="bg-white rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {company.fantasyName || company.name}
                  </h4>
                  {company.name !== company.fantasyName && (
                    <p className="text-sm text-gray-600 mb-2">{company.name}</p>
                  )}
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium w-16">Industry:</span>
                      <span className="capitalize">{company.industry}</span>
                    </div>
                    {company.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{company.email}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-2" />
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team & Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wolthers Staff */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Wolthers Staff ({trip.wolthersStaff.length})
              </h3>
              <div className="space-y-3">
                {trip.wolthersStaff.map((staff) => (
                  <div key={staff.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-medium text-gray-900">{staff.fullName}</div>
                    <div className="text-sm text-gray-600">{staff.email}</div>
                    <div className="text-xs text-gray-500 capitalize">{staff.role.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicles & Drivers */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-green-600" />
                Fleet & Drivers
              </h3>
              
              {trip.vehicles.length > 0 ? (
                <div className="space-y-3">
                  {trip.vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="font-medium text-gray-900">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </div>
                      <div className="text-sm text-gray-600">
                        {vehicle.color && `${vehicle.color} • `}
                        {vehicle.licensePlate}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vehicle.currentMileage.toLocaleString()} miles
                      </div>
                    </div>
                  ))}
                  
                  {trip.drivers.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Assigned Drivers</h4>
                      <div className="space-y-2">
                        {trip.drivers.map((driver) => (
                          <div key={driver.id} className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="font-medium text-gray-900">{driver.fullName}</div>
                            <div className="text-sm text-gray-600">{driver.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No vehicles assigned
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          {trip.progress !== undefined && trip.status === 'ongoing' && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Trip Progress</h3>
              <div className="w-full bg-yellow-200 rounded-full h-3">
                <div 
                  className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${trip.progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-700 font-medium">
                {trip.progress}% Complete
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.location.href = `/trips/${trip.id}`}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            View Full Details
          </button>
        </div>
      </div>
    </div>
  )
}