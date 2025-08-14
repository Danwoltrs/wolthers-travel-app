/**
 * Logistics Tab Component
 * 
 * Provides comprehensive logistics management including vehicles, drivers,
 * equipment, accommodations, and transportation planning.
 */

import React, { useState, useCallback } from 'react'
import { 
  Car, 
  User, 
  Package, 
  Building2, 
  MapPin, 
  Plus,
  Settings,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Navigation
} from 'lucide-react'
import type { TripCard } from '@/types'
import type { TabValidationState } from '@/types/enhanced-modal'

interface LogisticsTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'logistics', updates: any) => void
  validationState: TabValidationState
}

export function LogisticsTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState 
}: LogisticsTabProps) {
  const [activeSection, setActiveSection] = useState<'vehicles' | 'equipment' | 'accommodation' | 'transportation'>('vehicles')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'available':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Logistics Management
        </h3>
        <div className="flex items-center space-x-3">
          <button className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
            Generate Report
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="border-b border-gray-200 dark:border-[#2a2a2a]">
        <nav className="flex space-x-6">
          {[
            { id: 'vehicles', label: 'Vehicles & Drivers', icon: Car, count: trip.vehicles.length + trip.drivers.length },
            { id: 'equipment', label: 'Equipment', icon: Package, count: 0 },
            { id: 'accommodation', label: 'Accommodation', icon: Building2, count: 0 },
            { id: 'transportation', label: 'Transportation', icon: Navigation, count: 0 }
          ].map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`flex items-center space-x-2 pb-3 border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {section.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        {activeSection === 'vehicles' && (
          <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
            {/* Vehicles Section */}
            <div>
              <div className="px-6 py-3 bg-blue-800 dark:bg-blue-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4 text-golden-400" />
                    <h4 className="font-medium text-golden-400">Vehicles</h4>
                  </div>
                  <div className="text-xs text-golden-400/70">
                    {trip.vehicles.length} assigned
                  </div>
                </div>
              </div>

              {trip.vehicles.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {trip.vehicles.map((vehicle, index) => (
                    <div key={vehicle.id || index} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              License: {vehicle.licensePlate || 'N/A'}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Capacity: 5 passengers
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Type: Business
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('assigned')}`}>
                            Assigned
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Settings className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <Car className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No vehicles assigned</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Add vehicles for transportation
                  </p>
                </div>
              )}
            </div>

            {/* Drivers Section */}
            <div>
              <div className="px-6 py-3 bg-green-800 dark:bg-green-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-golden-400" />
                    <h4 className="font-medium text-golden-400">Drivers</h4>
                  </div>
                  <div className="text-xs text-golden-400/70">
                    {trip.drivers.length} assigned
                  </div>
                </div>
              </div>

              {trip.drivers.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-[#2a2a2a]">
                  {trip.drivers.map((driver, index) => (
                    <div key={driver.id || index} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {driver.fullName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {driver.email}
                            </div>
                            <div className="flex items-center space-x-4 mt-1">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                License: Valid until 2025
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Experience: 5+ years
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('confirmed')}`}>
                            Confirmed
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <Settings className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-8 text-center">
                  <User className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No drivers assigned</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Add drivers for vehicle operations
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'equipment' && (
          <div className="px-6 py-12 text-center">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Equipment management coming soon</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Track presentation equipment, safety gear, and other resources
            </p>
          </div>
        )}

        {activeSection === 'accommodation' && (
          <div className="px-6 py-12 text-center">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Accommodation management coming soon</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Manage hotel bookings, room assignments, and special requests
            </p>
          </div>
        )}

        {activeSection === 'transportation' && (
          <div className="px-6 py-12 text-center">
            <Navigation className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Transportation planning coming soon</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Plan routes, calculate distances, and optimize travel times
            </p>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {trip.vehicles.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Vehicles
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {trip.drivers.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Drivers
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Equipment
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Bookings
          </div>
        </div>
      </div>
    </div>
  )
}