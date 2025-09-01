"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  Wrench,
  Shield,
  BarChart3,
  MapPin,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import VehicleCard from "./VehicleCard";
import VehicleDetailsModal from "./VehicleDetailsModal";
import AddVehicleModal from "./AddVehicleModal";

interface Vehicle {
  id: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  current_mileage: number;
  is_available: boolean;
  last_maintenance_date: string | null;
  last_maintenance_mileage: number | null;
  insurance_expiry_date: string | null;
  vehicle_type: string;
  seating_capacity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface FleetStats {
  total_vehicles: number;
  available_vehicles: number;
  in_use_vehicles: number;
  maintenance_due: number;
  insurance_expiring: number;
}

export default function FleetDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fleetStats, setFleetStats] = useState<FleetStats>({
    total_vehicles: 0,
    available_vehicles: 0,
    in_use_vehicles: 0,
    maintenance_due: 0,
    insurance_expiring: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "in_use" | "maintenance">("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch vehicles and stats
  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles
        const vehiclesResponse = await fetch("/api/fleet/vehicles", {
          credentials: "include",
        });
        
        if (!vehiclesResponse.ok) {
          throw new Error("Failed to fetch vehicles");
        }
        
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData.vehicles || []);
        
        // Calculate stats from vehicles data
        const stats = calculateFleetStats(vehiclesData.vehicles || []);
        setFleetStats(stats);
        
      } catch (err) {
        console.error("Error fetching fleet data:", err);
        setError(err instanceof Error ? err.message : "Failed to load fleet data");
      } finally {
        setLoading(false);
      }
    };

    fetchFleetData();
  }, []);

  // Calculate fleet statistics
  const calculateFleetStats = (vehicles: Vehicle[]): FleetStats => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.is_available).length;
    const inUse = total - available;
    
    // Check maintenance due (vehicles that haven't had maintenance in 6 months or 10,000 km)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const maintenanceDue = vehicles.filter(v => {
      if (!v.last_maintenance_date && !v.last_maintenance_mileage) return true;
      
      const lastMaintenance = v.last_maintenance_date ? new Date(v.last_maintenance_date) : null;
      const mileageDue = v.last_maintenance_mileage ? 
        (v.current_mileage - v.last_maintenance_mileage) > 10000 : false;
      const dateDue = lastMaintenance ? lastMaintenance < sixMonthsAgo : true;
      
      return mileageDue || dateDue;
    }).length;
    
    // Check insurance expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const insuranceExpiring = vehicles.filter(v => {
      if (!v.insurance_expiry_date) return false;
      const expiryDate = new Date(v.insurance_expiry_date);
      return expiryDate <= thirtyDaysFromNow;
    }).length;
    
    return {
      total_vehicles: total,
      available_vehicles: available,
      in_use_vehicles: inUse,
      maintenance_due: maintenanceDue,
      insurance_expiring: insuranceExpiring,
    };
  };

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.color?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "available" && vehicle.is_available) ||
      (filterStatus === "in_use" && !vehicle.is_available) ||
      (filterStatus === "maintenance" && !vehicle.is_available);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        {/* Vehicles skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Error Loading Fleet Data
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Fleet Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-[#2C2C2C] rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center">
            <Car className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fleetStats.total_vehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2C2C2C] rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fleetStats.available_vehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2C2C2C] rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Use</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fleetStats.in_use_vehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2C2C2C] rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center">
            <Wrench className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Maintenance Due</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fleetStats.maintenance_due}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2C2C2C] rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Insurance Expiring</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{fleetStats.insurance_expiring}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
              className="block w-full pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="appearance-none bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 pr-8 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="all">All Vehicles</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Add Vehicle Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </button>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm || filterStatus !== "all" ? "No vehicles found" : "No vehicles yet"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || filterStatus !== "all" 
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first vehicle to the fleet"
            }
          </p>
          {(!searchTerm && filterStatus === "all") && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onClick={() => setSelectedVehicle(vehicle)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          isOpen={true}
          onClose={() => setSelectedVehicle(null)}
          onUpdate={(updatedVehicle) => {
            setVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
            setSelectedVehicle(updatedVehicle);
          }}
        />
      )}

      {showAddModal && (
        <AddVehicleModal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          onAdd={(newVehicle) => {
            setVehicles([...vehicles, newVehicle]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}