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
import { cn } from '@/lib/utils'

interface LogisticsTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'logistics', updates: any) => void
  validationState: TabValidationState
  mode?: 'view' | 'edit'
  className?: string
}

export function LogisticsTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState,
  mode = 'view',
  className = ''
}: LogisticsTabProps) {
  const [activeSection, setActiveSection] = useState<'vehicles' | 'equipment' | 'accommodation' | 'transportation'>('vehicles')

  const handleVehicleRemove = useCallback((vehicleId: string) => {
    // TODO: Implement vehicle removal logic
    console.log('Remove vehicle:', vehicleId)
  }, [])

  const handleDriverRemove = useCallback((driverId: string) => {
    // TODO: Implement driver removal logic
    console.log('Remove driver:', driverId)
  }, [])

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
    <div className={cn('flex flex-col min-h-0 space-y-4', className)}>
      {/* Title - hidden on mobile */}
      <div className="hidden md:flex items-center justify-between">
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

      {/* Section Navigation - Mobile optimized with icons */}
      <div className="border-b border-gray-200 dark:border-[#2a2a2a]">
        <nav className="grid grid-cols-4 gap-1 md:flex md:space-x-6 pb-2">
          {[
            { id: 'vehicles', label: 'Vehicles & Drivers', shortLabel: 'Vehicles', icon: Car, count: trip.vehicles.length + trip.drivers.length },
            { id: 'equipment', label: 'Equipment', shortLabel: 'Equipment', icon: Package, count: 0 },
            { id: 'accommodation', label: 'Accommodation', shortLabel: 'Hotels', icon: Building2, count: 0 },
            { id: 'transportation', label: 'Transportation', shortLabel: 'Routes', icon: Navigation, count: 0 }
          ].map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`
                  flex flex-col md:flex-row items-center justify-center md:space-x-2 py-2 px-1 md:px-0 md:pb-3 md:border-b-2 rounded-md md:rounded-none transition-colors
                  ${
                    isActive
                      ? 'bg-emerald-800 dark:bg-emerald-800/80 text-golden-400 md:bg-transparent md:border-emerald-500 md:text-emerald-600 md:dark:text-emerald-400'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800/40 md:hover:bg-transparent md:border-transparent'
                  }
                `}
                title={section.label}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {/* Show text only for active tab on mobile, always on desktop */}
                <span className={`text-xs md:text-sm truncate ${
                  isActive ? '' : 'hidden md:inline'
                }`}>
                  <span className="md:hidden">{section.shortLabel}</span>
                  <span className="hidden md:inline">{section.label}</span>
                </span>
                <span className={`px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${
                  isActive
                    ? 'bg-golden-400/20 text-golden-400 md:bg-gray-100 md:dark:bg-gray-700 md:text-gray-600 md:dark:text-gray-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hidden md:inline-flex'
                } ${isActive ? '' : 'hidden md:inline-flex'}`}>
                  {section.count}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content Area - Full width cards on mobile */}
      <div className="flex-1 space-y-3">
        {activeSection === 'vehicles' && (
          <div className="space-y-3">
            {/* Vehicles Section */}
            {trip.vehicles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-1">
                  <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Vehicles ({trip.vehicles.length})</h4>
                </div>
                <div className="space-y-2">
                  {trip.vehicles.map((vehicle, index) => (
                    <div key={vehicle.id || index} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {vehicle.make} {vehicle.model}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                License: {vehicle.licensePlate || 'N/A'}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                  5 passengers
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                  Business
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2 ml-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('assigned')}`}>
                                Assigned
                              </span>
                              <div className="flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
                              </div>
                              {mode === 'edit' && (
                                <button
                                  onClick={() => handleVehicleRemove(vehicle.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drivers Section */}
            {trip.drivers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-1">
                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Drivers ({trip.drivers.length})</h4>
                </div>
                <div className="space-y-2">
                  {trip.drivers.map((driver, index) => (
                    <div key={driver.id || index} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                {driver.fullName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {driver.email}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                  Valid until 2025
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                  5+ years exp
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2 ml-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('confirmed')}`}>
                                Confirmed
                              </span>
                              <div className="flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">Available</span>
                              </div>
                              {mode === 'edit' && (
                                <button
                                  onClick={() => handleDriverRemove(driver.id)}
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {trip.vehicles.length === 0 && trip.drivers.length === 0 && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 text-center">
                <Car className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No vehicles or drivers assigned</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Add transportation resources for this trip
                </p>
              </div>
            )}
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

      {/* Action Buttons - Mobile only, above statistics */}
      <div className="md:hidden flex items-center justify-center space-x-3">
        <button className="text-xs px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
          Generate Report
        </button>
        <button className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add Resource</span>
        </button>
      </div>

      {/* Compact Statistics */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-2 text-center">
          <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {trip.vehicles.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Vehicles
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-2 text-center">
          <div className="text-lg md:text-2xl font-bold text-green-600 dark:text-green-400">
            {trip.drivers.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Drivers
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-2 text-center">
          <div className="text-lg md:text-2xl font-bold text-amber-600 dark:text-amber-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Equipment
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-2 text-center">
          <div className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400">
            0
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Bookings
          </div>
        </div>
      </div>
    </div>
  )
}
