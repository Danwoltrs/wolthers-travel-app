import React, { useState, useEffect } from 'react';
import { 
  Car, 
  MapPin, 
  Users, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  X,
  Calendar,
  Clock,
  User,
  Truck,
  UserCheck
} from 'lucide-react';
import { TripFormData } from './TripCreationModal';
import { ParticipantWithDates } from './TeamVehicleStep';
import { useVehicleAllocation } from '@/hooks/useVehicleAllocation';

interface VehicleAllocationSectionProps {
  formData: TripFormData;
  updateFormData: (data: Partial<TripFormData>) => void;
  participantsWithDates: ParticipantWithDates[];
}

export default function VehicleAllocationSection({
  formData,
  updateFormData,
  participantsWithDates
}: VehicleAllocationSectionProps) {
  const {
    availableVehicles,
    rentalSuggestions,
    assignments,
    loading,
    error,
    summary,
    searchAvailableVehicles,
    assignVehicles,
    generateSmartSuggestions,
    clearError
  } = useVehicleAllocation();

  const [selectedTab, setSelectedTab] = useState<'available' | 'assignments' | 'rentals'>('available');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [localAssignments, setLocalAssignments] = useState<any[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});

  // Search for available vehicles when component mounts or key data changes
  useEffect(() => {
    if (formData.startDate && formData.endDate && !searchPerformed) {
      const startDate = formData.startDate instanceof Date 
        ? formData.startDate.toISOString().split('T')[0] 
        : formData.startDate;
      const endDate = formData.endDate instanceof Date 
        ? formData.endDate.toISOString().split('T')[0] 
        : formData.endDate;
      
      const participantCount = participantsWithDates.length || (formData.wolthersStaff || []).length || 1;
      
      searchAvailableVehicles({
        startDate,
        endDate,
        startingPoint: formData.startingPoint,
        participantCount,
        requirements: {
          seatingCapacity: participantCount
        }
      }).then(() => {
        setSearchPerformed(true);
      }).catch(console.error);
    }
  }, [formData.startDate, formData.endDate, formData.startingPoint, participantsWithDates.length, searchPerformed]);

  // Generate smart suggestions
  const smartSuggestions = generateSmartSuggestions(
    formData.startingPoint || 'other',
    participantsWithDates.length || 1,
    formData.startDate && formData.endDate 
      ? Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 1
  );

  // Get available drivers (internal team members who can drive)
  const availableDrivers = participantsWithDates.filter(p => p.isDriver);
  
  // Handle driver selection for a specific vehicle
  const handleDriverSelection = (vehicleId: string, driverId: string) => {
    setSelectedDrivers(prev => ({
      ...prev,
      [vehicleId]: driverId
    }));
  };

  const handleVehicleAssignment = (vehicleId: string, assignmentType: 'company_vehicle' | 'rental_request') => {
    console.log('🚗 [Vehicle Assignment] Creating assignment:', { vehicleId, assignmentType })
    
    // Find selected driver for this vehicle
    const selectedDriverId = selectedDrivers[vehicleId]
    const selectedDriver = selectedDriverId 
      ? participantsWithDates.find(p => p.id === selectedDriverId)
      : availableDrivers[0] // Default to first available driver
    
    if (!selectedDriver && availableDrivers.length > 0) {
      alert('Please select a driver for this vehicle')
      return
    }
    
    const newAssignment = {
      vehicleId: assignmentType === 'company_vehicle' ? vehicleId : undefined,
      assignmentType,
      driverId: selectedDriver?.id,
      driverName: selectedDriver?.fullName,
      startDate: formData.startDate instanceof Date 
        ? formData.startDate.toISOString().split('T')[0] 
        : formData.startDate,
      endDate: formData.endDate instanceof Date 
        ? formData.endDate.toISOString().split('T')[0] 
        : formData.endDate,
      assignedParticipants: participantsWithDates.map(p => p.id),
      notes: assignmentType === 'rental_request' ? 'Rental car required' : undefined
    };

    const updatedAssignments = [...localAssignments, newAssignment]
    setLocalAssignments(updatedAssignments);
    
    // Update form data
    updateFormData({
      vehicleAssignments: updatedAssignments
    });

    console.log('✅ [Vehicle Assignment] Assignment created:', newAssignment)
    setSelectedTab('assignments');
  };

  const handleRemoveAssignment = (index: number) => {
    const updatedAssignments = localAssignments.filter((_, i) => i !== index);
    setLocalAssignments(updatedAssignments);
    updateFormData({
      vehicleAssignments: updatedAssignments
    });
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'santos': return '🏢'; // Port
      case 'cerrado': return '🌾'; // Rural
      case 'uberlandia': return '✈️'; // Airport
      case 'sao_paulo': return '🏙️'; // City
      default: return '📍';
    }
  };

  if (loading && !searchPerformed) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <Car className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Searching available vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 dark:text-red-300 font-medium">Error loading vehicles</p>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 text-sm hover:text-red-800 dark:hover:text-red-300 mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-blue-800 dark:text-blue-300 font-medium mb-2">Smart Recommendations</h4>
          <div className="space-y-2">
            {smartSuggestions.map((suggestion, index) => (
              <div key={index} className="text-sm text-blue-700 dark:text-blue-400">
                <strong>{suggestion.title}:</strong> {suggestion.description}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSelectedTab('available')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'available'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Available Vehicles ({summary.totalAvailable})
          </button>
          <button
            onClick={() => setSelectedTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'assignments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Assignments ({localAssignments.length})
          </button>
          <button
            onClick={() => setSelectedTab('rentals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'rentals'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Rental Options ({rentalSuggestions.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {selectedTab === 'available' && (
          <div className="space-y-4">
            {availableVehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No vehicles available for the selected dates</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Consider rental options or adjust dates</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {availableVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className={`p-4 border rounded-lg ${
                      vehicle.isRecommended
                        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {vehicle.is_rental ? <Truck className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {vehicle.year} {vehicle.model}
                            </h4>
                            {vehicle.isRecommended && (
                              <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{getLocationIcon(vehicle.base_location)} {vehicle.base_location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{vehicle.seating_capacity} seats</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className={`w-3 h-3 rounded-full ${vehicle.color?.toLowerCase() === 'white' ? 'bg-gray-200 border border-gray-400' : ''}`} 
                                  style={{ backgroundColor: vehicle.color?.toLowerCase() }}></span>
                            <span>{vehicle.color}</span>
                          </div>
                          <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {vehicle.license_plate}
                          </div>
                        </div>

                        {vehicle.suggestions.length > 0 && (
                          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                            <ul className="list-disc list-inside space-y-1">
                              {vehicle.suggestions.slice(0, 2).map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {vehicle.estimatedTransferCost && (
                          <div className="mt-2 flex items-center space-x-1 text-sm text-orange-600 dark:text-orange-400">
                            <DollarSign className="w-4 h-4" />
                            <span>Est. transfer cost: ${vehicle.estimatedTransferCost}</span>
                          </div>
                        )}
                        
                        {/* Driver Selection */}
                        {availableDrivers.length > 0 && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Select Driver:
                            </label>
                            <select
                              value={selectedDrivers[vehicle.id] || ''}
                              onChange={(e) => handleDriverSelection(vehicle.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                              <option value="">Choose driver...</option>
                              {availableDrivers.map(driver => (
                                <option key={driver.id} value={driver.id}>
                                  {driver.fullName} {driver.drivingLicense ? `(${driver.drivingLicense})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleVehicleAssignment(vehicle.id, 'company_vehicle')}
                          disabled={availableDrivers.length > 0 && !selectedDrivers[vehicle.id]}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            availableDrivers.length > 0 && !selectedDrivers[vehicle.id]
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          Assign
                        </button>
                        <div className="text-xs text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            vehicle.recommendationLevel === 'highly_recommended' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : vehicle.recommendationLevel === 'recommended'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            Score: {vehicle.availabilityScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'assignments' && (
          <div className="space-y-4">
            {localAssignments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No vehicle assignments yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Assign vehicles from the Available tab</p>
              </div>
            ) : (
              <div className="space-y-4">
                {localAssignments.map((assignment, index) => {
                  const vehicle = availableVehicles.find(v => v.id === assignment.vehicleId);
                  return (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {vehicle ? `${vehicle.year} ${vehicle.model}` : 'Rental Vehicle Request'}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              assignment.assignmentType === 'company_vehicle'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                            }`}>
                              {assignment.assignmentType === 'company_vehicle' ? 'Company Vehicle' : 'Rental Request'}
                            </span>
                            {assignment.driverName && (
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 flex items-center">
                                <UserCheck className="w-3 h-3 mr-1" />
                                {assignment.driverName}
                              </span>
                            )}
                          </div>
                          
                          {vehicle && (
                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{vehicle.base_location}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Users className="w-4 h-4" />
                                <span>{vehicle.seating_capacity} seats</span>
                              </div>
                              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {vehicle.license_plate}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{assignment.startDate} to {assignment.endDate}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{assignment.assignedParticipants.length} participants</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRemoveAssignment(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove assignment"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'rentals' && (
          <div className="space-y-4">
            {rentalSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No specific rental recommendations</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Check with local rental agencies</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rentalSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-start space-x-3">
                      <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-900 dark:text-purple-300">
                          {suggestion.location}
                        </h4>
                        <p className="text-purple-800 dark:text-purple-400 text-sm mt-1">
                          {suggestion.reason}
                        </p>
                        
                        {suggestion.recommendedVehicles.map((vehicle, vIndex) => (
                          <div key={vIndex} className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white">
                                  {vehicle.category}
                                </h5>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{vehicle.currency} {vehicle.estimatedCost}/{vehicle.period}</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {vehicle.features.map((feature, fIndex) => (
                                    <span key={fIndex} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-col space-y-2">
                                <button
                                  onClick={() => handleVehicleAssignment('', 'rental_request')}
                                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Request Rental
                                </button>
                                <button
                                  onClick={() => handleVehicleAssignment('external-driver', 'rental_request')}
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm text-xs"
                                >
                                  External Driver
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {(localAssignments.length > 0 || summary.totalAvailable > 0) && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vehicle Allocation Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Available:</span>
              <span className="ml-1 font-medium">{summary.totalAvailable}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Assigned:</span>
              <span className="ml-1 font-medium">{localAssignments.length}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Participants:</span>
              <span className="ml-1 font-medium">{participantsWithDates.length}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Coverage:</span>
              <span className={`ml-1 font-medium ${
                localAssignments.length > 0 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {localAssignments.length > 0 ? 'Assigned' : 'Needs Assignment'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}