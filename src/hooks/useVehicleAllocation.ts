import { useState, useEffect, useCallback } from 'react';

interface VehicleRequirements {
  seatingCapacity?: number;
  cargoSpace?: boolean;
  terrainCapability?: string[];
  fuelType?: string;
  specialEquipment?: string[];
}

interface ScoredVehicle {
  id: string;
  model: string;
  year: number;
  color?: string;
  license_plate: string;
  vehicle_type: string;
  seating_capacity: number;
  is_rental: boolean;
  rental_company?: string;
  rental_cost_per_day?: number;
  base_location: string;
  is_suitable_for_terrain: Record<string, boolean>;
  availability_status: string;
  availabilityScore: number;
  suggestions: string[];
  recommendationLevel: 'highly_recommended' | 'recommended' | 'suitable' | 'not_ideal';
  estimatedTransferCost?: number;
  isRecommended: boolean;
}

interface RentalSuggestion {
  type: 'rental_recommendation';
  location: string;
  reason: string;
  recommendedVehicles: {
    category: string;
    estimatedCost: number;
    currency: string;
    period: string;
    features: string[];
  }[];
}

interface VehicleAssignment {
  vehicleId?: string;
  driverId?: string;
  assignmentType: 'company_vehicle' | 'rental_request' | 'rental_assigned';
  startDate: string;
  endDate: string;
  assignedParticipants: string[];
  rentalCompany?: string;
  rentalContactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  rentalCostPerDay?: number;
  rentalLocation?: string;
  rentalPickupTime?: string;
  rentalReturnTime?: string;
  vehicleRequirements?: VehicleRequirements;
  notes?: string;
}

interface VehicleAllocationState {
  availableVehicles: ScoredVehicle[];
  rentalSuggestions: RentalSuggestion[];
  assignments: VehicleAssignment[];
  loading: boolean;
  error: string | null;
  searchCriteria: {
    startDate?: string;
    endDate?: string;
    startingPoint?: string;
    participantCount?: number;
    requirements?: VehicleRequirements;
  };
  summary: {
    totalAvailable: number;
    recommended: number;
    requiresRental: boolean;
  };
}

export const useVehicleAllocation = () => {
  const [state, setState] = useState<VehicleAllocationState>({
    availableVehicles: [],
    rentalSuggestions: [],
    assignments: [],
    loading: false,
    error: null,
    searchCriteria: {},
    summary: {
      totalAvailable: 0,
      recommended: 0,
      requiresRental: false
    }
  });

  // Search for available vehicles
  const searchAvailableVehicles = useCallback(async (criteria: {
    startDate: string;
    endDate: string;
    startingPoint?: string;
    participantCount?: number;
    requirements?: VehicleRequirements;
  }) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/trips/vehicles/available', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(criteria)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search vehicles');
      }

      setState(prev => ({
        ...prev,
        availableVehicles: data.availableVehicles || [],
        rentalSuggestions: data.rentalSuggestions || [],
        searchCriteria: data.searchCriteria || criteria,
        summary: data.summary || { totalAvailable: 0, recommended: 0, requiresRental: false },
        loading: false
      }));

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search vehicles';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      throw error;
    }
  }, []);

  // Assign vehicles to a trip
  const assignVehicles = useCallback(async (tripId: string, assignments: VehicleAssignment[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/trips/vehicles/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tripId, assignments })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to assign vehicles');
      }

      setState(prev => ({
        ...prev,
        assignments: assignments,
        loading: false
      }));

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign vehicles';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      throw error;
    }
  }, []);

  // Get existing assignments for a trip
  const getAssignments = useCallback(async (tripId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/trips/vehicles/assign?tripId=${encodeURIComponent(tripId)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get vehicle assignments');
      }

      // Convert API response to local assignment format
      const formattedAssignments: VehicleAssignment[] = (data.assignments || []).map((assignment: any) => ({
        vehicleId: assignment.vehicle_id,
        driverId: assignment.driver_id,
        assignmentType: assignment.assignment_type,
        startDate: assignment.start_date,
        endDate: assignment.end_date,
        assignedParticipants: assignment.assigned_participants || [],
        rentalCompany: assignment.rental_company,
        rentalContactInfo: assignment.rental_contact_info,
        rentalCostPerDay: assignment.rental_cost_per_day,
        rentalLocation: assignment.rental_location,
        rentalPickupTime: assignment.rental_pickup_time,
        rentalReturnTime: assignment.rental_return_time,
        vehicleRequirements: assignment.vehicle_requirements,
        notes: assignment.notes
      }));

      setState(prev => ({
        ...prev,
        assignments: formattedAssignments,
        loading: false
      }));

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get vehicle assignments';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      throw error;
    }
  }, []);

  // Helper functions for vehicle recommendations
  const getRecommendedVehicles = useCallback(() => {
    return state.availableVehicles.filter(vehicle => vehicle.isRecommended);
  }, [state.availableVehicles]);

  const getVehiclesByLocation = useCallback((location: string) => {
    return state.availableVehicles.filter(vehicle => vehicle.base_location === location);
  }, [state.availableVehicles]);

  const calculateTotalEstimatedCost = useCallback(() => {
    return state.assignments.reduce((total, assignment) => {
      if (assignment.rentalCostPerDay && assignment.startDate && assignment.endDate) {
        const days = Math.ceil(
          (new Date(assignment.endDate).getTime() - new Date(assignment.startDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        return total + (assignment.rentalCostPerDay * days);
      }
      return total;
    }, 0);
  }, [state.assignments]);

  // Generate smart suggestions based on trip requirements
  const generateSmartSuggestions = useCallback((
    startingPoint: string,
    participantCount: number,
    tripDuration: number
  ) => {
    const suggestions = [];

    // Location-based suggestions
    switch (startingPoint) {
      case 'uberlandia':
        suggestions.push({
          type: 'location_suggestion',
          title: 'Fly + Rent Strategy Recommended',
          description: 'For Uberlândia trips, flying and renting a car at the airport is typically most cost-effective.',
          action: 'Consider rental vehicles for this trip'
        });
        break;

      case 'cerrado':
        suggestions.push({
          type: 'terrain_suggestion', 
          title: '4WD Vehicle Recommended',
          description: 'Rural Cerrado terrain requires vehicles with good ground clearance and 4WD capability.',
          action: 'Prioritize SUVs and pickup trucks'
        });
        break;

      case 'santos':
        suggestions.push({
          type: 'port_suggestion',
          title: 'Port-Suitable Vehicle Needed',
          description: 'Santos port operations require vehicles suitable for industrial/port environments.',
          action: 'Select SUVs or pickups with port terrain capability'
        });
        break;
    }

    // Participant count suggestions
    if (participantCount > 4) {
      suggestions.push({
        type: 'capacity_suggestion',
        title: 'Multiple Vehicles Needed',
        description: `${participantCount} participants require multiple vehicles or a large capacity vehicle.`,
        action: 'Consider assigning multiple vehicles or a van'
      });
    }

    // Duration-based suggestions
    if (tripDuration > 7) {
      suggestions.push({
        type: 'duration_suggestion',
        title: 'Extended Trip Considerations',
        description: 'Long trips may require vehicles with better fuel efficiency and comfort features.',
        action: 'Prioritize vehicles with good fuel economy and comfort'
      });
    }

    return suggestions;
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      availableVehicles: [],
      rentalSuggestions: [],
      assignments: [],
      loading: false,
      error: null,
      searchCriteria: {},
      summary: {
        totalAvailable: 0,
        recommended: 0,
        requiresRental: false
      }
    });
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    searchAvailableVehicles,
    assignVehicles,
    getAssignments,
    
    // Helpers
    getRecommendedVehicles,
    getVehiclesByLocation,
    calculateTotalEstimatedCost,
    generateSmartSuggestions,
    
    // Utilities
    clearError,
    reset
  };
};

export default useVehicleAllocation;