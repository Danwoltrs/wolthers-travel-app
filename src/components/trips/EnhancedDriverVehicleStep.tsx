import React, { useState, useEffect } from 'react'
import { 
  Car, 
  User, 
  UserCheck, 
  Plus, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Truck,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Settings,
  X
} from 'lucide-react'
import { TripFormData } from './TripCreationModal'
import type { User as UserType, Vehicle } from '@/types'
import AddVehicleModal from '@/components/fleet/AddVehicleModal'

interface ExternalDriver {
  id?: string
  full_name: string
  cpf_rg: string
  cnh_number: string
  cnh_category: string
  cnh_expiry_date: string
  whatsapp: string
  email?: string
  is_active: boolean
}

interface EnhancedDriverVehicleStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

export default function EnhancedDriverVehicleStep({ formData, updateFormData }: EnhancedDriverVehicleStepProps) {
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [externalDrivers, setExternalDrivers] = useState<ExternalDriver[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({})
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, string>>({})
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
  const [showAddDriverModal, setShowAddDriverModal] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // External driver form state
  const [driverForm, setDriverForm] = useState<Partial<ExternalDriver>>({
    full_name: '',
    cpf_rg: '',
    cnh_number: '',
    cnh_category: 'B',
    cnh_expiry_date: '',
    whatsapp: '',
    email: '',
    is_active: true
  })

  // Get participating Wolthers staff only (not all staff)
  const participatingStaff = formData.participants || []

  // Load available vehicles and external drivers
  useEffect(() => {
    loadVehiclesAndDrivers()
  }, [formData.startDate, formData.endDate])

  const loadVehiclesAndDrivers = async () => {
    try {
      setLoading(true)
      
      // Load available vehicles
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

      // Load external drivers
      const driversResponse = await fetch('/api/drivers/external', {
        credentials: 'include'
      })

      if (driversResponse.ok) {
        const driversData = await driversResponse.json()
        setExternalDrivers(driversData.drivers || [])
      }

    } catch (error) {
      console.error('Failed to load vehicles and drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStaffDriverToggle = (staffId: string, isDriver: boolean) => {
    const updatedStaff = participatingStaff.map(staff => 
      staff.id === staffId ? { ...staff, isDriver } : staff
    )
    updateFormData({ participants: updatedStaff })
  }

  const handleAddExternalDriver = async () => {
    try {
      const response = await fetch('/api/drivers/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(driverForm)
      })

      if (response.ok) {
        const newDriver = await response.json()
        setExternalDrivers(prev => [...prev, newDriver])
        setShowAddDriverModal(false)
        setDriverForm({
          full_name: '',
          cpf_rg: '',
          cnh_number: '',
          cnh_category: 'B',
          cnh_expiry_date: '',
          whatsapp: '',
          email: '',
          is_active: true
        })
      } else {
        const error = await response.json()
        alert('Failed to create driver: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to create external driver:', error)
      alert('Failed to create driver. Please try again.')
    }
  }

  const handleVehicleAssignment = (vehicleId: string, driverId: string) => {
    const newAssignments = { ...vehicleAssignments, [vehicleId]: driverId }
    setVehicleAssignments(newAssignments)
    
    // Convert to full objects for form data
    const assignmentArray = Object.entries(newAssignments).map(([vehicleId, driverId]) => {
      // Find driver (could be from staff or external drivers)
      const staffDriver = participatingStaff.find(s => s.id === driverId)
      const externalDriver = externalDrivers.find(d => d.id === driverId)
      const driver = staffDriver || externalDriver
      
      // Find vehicle
      const vehicle = availableVehicles.find(v => v.id === vehicleId)
      
      return {
        driver,
        vehicle
      }
    }).filter(assignment => assignment.driver && assignment.vehicle)
    
    // Update form data with full vehicle assignments
    updateFormData({
      vehicleAssignments: assignmentArray
    })
  }

  const getDriverName = (driverId: string) => {
    const staff = participatingStaff.find(s => s.id === driverId)
    if (staff) return staff.fullName || (staff as any).full_name || staff.email || 'Unknown Staff'
    
    const external = externalDrivers.find(d => d.id === driverId)
    if (external) return external.full_name
    
    return 'Unknown Driver'
  }

  const getAllDrivers = () => {
    const staffDrivers = participatingStaff
      .filter(staff => (staff as any).isDriver)
      .map(staff => ({ id: staff.id, name: staff.fullName || (staff as any).full_name || staff.email || 'Unknown Staff', type: 'staff' }))
    
    const externalDriversList = externalDrivers.map(driver => ({ 
      id: driver.id!, 
      name: driver.full_name, 
      type: 'external' 
    }))
    
    return [...staffDrivers, ...externalDriversList]
  }

  const getTotalCapacity = () => {
    return availableVehicles.reduce((total, vehicle) => total + (vehicle.seating_capacity || 5), 0)
  }

  const getAssignedVehicles = () => {
    return Object.keys(vehicleAssignments).length
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading vehicles and drivers...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Smart Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300">Trip Summary</h4>
            <div className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p>{participatingStaff.length} participants • {availableVehicles.length} vehicles available • {getTotalCapacity()} total seats</p>
              <p>Recommended: {Math.ceil(participatingStaff.length / 4)} vehicles • Assigned: {getAssignedVehicles()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Drivers */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Drivers
              </h3>
            </div>

            {/* Wolthers Staff - Trip Participants Only */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <UserCheck className="w-4 h-4 mr-2" />
                Wolthers Staff (Trip Participants)
              </h4>
              
              {participatingStaff.length === 0 ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No team members selected yet.</p>
                  <p className="text-xs">Go back to Team & Participants step to select staff.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participatingStaff.map((staff) => (
                    <div 
                      key={staff.id}
                      className={`p-4 border rounded-lg transition-all ${
                        (staff as any).isDriver 
                          ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20' 
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            (staff as any).isDriver ? 'bg-green-100 dark:bg-green-800/30' : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            {(staff as any).isDriver ? (
                              <Car className="w-4 h-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {staff.fullName || (staff as any).full_name || staff.email || 'Unknown Staff'}
                            </p>
                            {(staff as any).isDriver && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Available as driver
                              </p>
                            )}
                          </div>
                        </div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={(staff as any).isDriver || false}
                            onChange={(e) => handleStaffDriverToggle(staff.id, e.target.checked)}
                            className="text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Can Drive
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* External Drivers Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    External Drivers
                  </h4>
                  <button
                    onClick={() => setShowAddDriverModal(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add External Driver</span>
                  </button>
                </div>

                {externalDrivers.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No external drivers yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Click "Add External Driver" to register professional drivers
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {externalDrivers.map((driver) => (
                      <div key={driver.id} className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded-lg">
                            <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">{driver.full_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{driver.whatsapp}</p>
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Available
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Vehicles */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300 flex items-center">
                <Car className="w-5 h-5 mr-2" />
                Available Vehicles
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Handle rental selection - just mark it as selected
                    updateFormData({ useRental: true })
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Car className="w-4 h-4" />
                  <span>Use Rental</span>
                </button>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              </div>
            </div>

            {(formData as any).useRental && (
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 dark:bg-blue-800/30 p-2 rounded-lg">
                    <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-300">Rental Vehicle Selected</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Vehicle will be arranged through rental service
                    </p>
                  </div>
                  <button
                    onClick={() => updateFormData({ useRental: false })}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {availableVehicles.length === 0 && !(formData as any).useRental ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <Car className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No vehicles available</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Add vehicles to your fleet or check availability dates
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {vehicle.image_url ? (
                            <img 
                              src={vehicle.image_url} 
                              alt={vehicle.model}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <Car className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {vehicle.model} {vehicle.year}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {vehicle.color} • {vehicle.license_plate}
                            </p>
                            <p className="text-xs text-gray-400">
                              {vehicle.seating_capacity} seats • {vehicle.vehicle_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                            Available
                          </div>
                        </div>
                      </div>

                      {/* Driver Assignment */}
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Assign Driver:
                          </label>
                          <select
                            value={vehicleAssignments[vehicle.id] || ''}
                            onChange={(e) => handleVehicleAssignment(vehicle.id, e.target.value)}
                            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1"
                          >
                            <option value="">Select Driver</option>
                            {getAllDrivers().map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driver.name} ({driver.type === 'staff' ? 'Staff' : 'External'})
                              </option>
                            ))}
                          </select>
                        </div>
                        {vehicleAssignments[vehicle.id] && (
                          <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                            Assigned to {getDriverName(vehicleAssignments[vehicle.id])}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        onAdd={(vehicle) => {
          setAvailableVehicles(prev => [...prev, vehicle])
          setShowAddVehicleModal(false)
        }}
      />

      {/* Add External Driver Modal */}
      {showAddDriverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add External Driver
                </h3>
                <button
                  onClick={() => setShowAddDriverModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={driverForm.full_name || ''}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Driver's full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CPF/RG *
                  </label>
                  <input
                    type="text"
                    value={driverForm.cpf_rg || ''}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, cpf_rg: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="CPF or RG number"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CNH Number *
                    </label>
                    <input
                      type="text"
                      value={driverForm.cnh_number || ''}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, cnh_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="CNH number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CNH Category *
                    </label>
                    <select
                      value={driverForm.cnh_category || 'B'}
                      onChange={(e) => setDriverForm(prev => ({ ...prev, cnh_category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="A">A - Motorcycle</option>
                      <option value="B">B - Car</option>
                      <option value="C">C - Truck</option>
                      <option value="D">D - Bus</option>
                      <option value="E">E - Heavy Truck</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CNH Expiry Date
                  </label>
                  <input
                    type="date"
                    value={driverForm.cnh_expiry_date || ''}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, cnh_expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    value={driverForm.whatsapp || ''}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={driverForm.email || ''}
                    onChange={(e) => setDriverForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="driver@email.com"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddDriverModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExternalDriver}
                    disabled={!driverForm.full_name || !driverForm.cpf_rg || !driverForm.cnh_number || !driverForm.whatsapp}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    Add Driver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}