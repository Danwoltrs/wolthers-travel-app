"use client";

import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Plus, 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface MaintenanceRecord {
  id: string;
  maintenance_type: string;
  service_provider: string | null;
  maintenance_date: string;
  mileage_at_service: number | null;
  cost_brl: number | null;
  next_service_due_date: string | null;
  next_service_due_mileage: number | null;
  description: string | null;
  warranty_until: string | null;
  created_at: string;
}

interface VehicleMaintenanceTabProps {
  vehicle: Vehicle;
}

export default function VehicleMaintenanceTab({ vehicle }: VehicleMaintenanceTabProps) {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    maintenance_type: "",
    service_provider: "",
    maintenance_date: new Date().toISOString().split('T')[0],
    mileage_at_service: vehicle.current_mileage,
    cost_brl: "",
    next_service_due_date: "",
    next_service_due_mileage: "",
    description: "",
    warranty_until: "",
  });

  useEffect(() => {
    fetchMaintenanceRecords();
  }, [vehicle.id]);

  const fetchMaintenanceRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/maintenance`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaintenanceRecords(data.maintenance || []);
      }
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...newMaintenance,
          cost_brl: newMaintenance.cost_brl ? parseFloat(newMaintenance.cost_brl) : null,
          next_service_due_mileage: newMaintenance.next_service_due_mileage ? 
            parseInt(newMaintenance.next_service_due_mileage) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMaintenanceRecords([data.maintenance, ...maintenanceRecords]);
        setShowAddForm(false);
        setNewMaintenance({
          maintenance_type: "",
          service_provider: "",
          maintenance_date: new Date().toISOString().split('T')[0],
          mileage_at_service: vehicle.current_mileage,
          cost_brl: "",
          next_service_due_date: "",
          next_service_due_mileage: "",
          description: "",
          warranty_until: "",
        });
      }
    } catch (error) {
      console.error("Error adding maintenance record:", error);
    }
  };

  const getMaintenanceTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type.toLowerCase()) {
      case "oil_change":
        return <Wrench className={iconClass} />;
      case "tire_rotation":
      case "tire_replacement":
        return <div className={`${iconClass} rounded-full border-2 border-current`} />;
      case "brake_service":
        return <div className={`${iconClass} bg-current rounded-sm`} />;
      default:
        return <Wrench className={iconClass} />;
    }
  };

  const getMaintenanceStatus = (record: MaintenanceRecord) => {
    if (!record.next_service_due_date && !record.next_service_due_mileage) {
      return { status: "completed", color: "text-green-600", label: "Completed" };
    }

    const currentDate = new Date();
    const currentMileage = vehicle.current_mileage;

    let isDue = false;
    
    if (record.next_service_due_date) {
      const dueDate = new Date(record.next_service_due_date);
      if (dueDate <= currentDate) {
        isDue = true;
      }
    }

    if (record.next_service_due_mileage && currentMileage >= record.next_service_due_mileage) {
      isDue = true;
    }

    if (isDue) {
      return { status: "due", color: "text-orange-600", label: "Service Due" };
    }

    return { status: "scheduled", color: "text-blue-600", label: "Scheduled" };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('pt-BR').format(mileage);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
            Maintenance History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track all maintenance and service records for this vehicle
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Maintenance
        </button>
      </div>

      {/* Add Maintenance Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
            Add Maintenance Record
          </h4>
          
          <form onSubmit={handleAddMaintenance} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maintenance Type *
                </label>
                <select
                  value={newMaintenance.maintenance_type}
                  onChange={(e) => setNewMaintenance({...newMaintenance, maintenance_type: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select maintenance type</option>
                  <option value="oil_change">Oil Change</option>
                  <option value="tire_rotation">Tire Rotation</option>
                  <option value="tire_replacement">Tire Replacement</option>
                  <option value="brake_service">Brake Service</option>
                  <option value="transmission_service">Transmission Service</option>
                  <option value="engine_tune_up">Engine Tune-up</option>
                  <option value="battery_replacement">Battery Replacement</option>
                  <option value="air_filter_replacement">Air Filter Replacement</option>
                  <option value="coolant_flush">Coolant Flush</option>
                  <option value="general_inspection">General Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Provider
                </label>
                <input
                  type="text"
                  value={newMaintenance.service_provider}
                  onChange={(e) => setNewMaintenance({...newMaintenance, service_provider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Auto Center Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Service Date *
                </label>
                <input
                  type="date"
                  value={newMaintenance.maintenance_date}
                  onChange={(e) => setNewMaintenance({...newMaintenance, maintenance_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mileage at Service
                </label>
                <input
                  type="number"
                  value={newMaintenance.mileage_at_service}
                  onChange={(e) => setNewMaintenance({...newMaintenance, mileage_at_service: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaintenance.cost_brl}
                  onChange={(e) => setNewMaintenance({...newMaintenance, cost_brl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Next Service Due Date
                </label>
                <input
                  type="date"
                  value={newMaintenance.next_service_due_date}
                  onChange={(e) => setNewMaintenance({...newMaintenance, next_service_due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={newMaintenance.description}
                onChange={(e) => setNewMaintenance({...newMaintenance, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Additional details about the maintenance performed..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 transition-colors"
              >
                Add Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Records */}
      {maintenanceRecords.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Maintenance Records
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start tracking maintenance by adding the first service record.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Record
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {maintenanceRecords.map((record) => {
            const status = getMaintenanceStatus(record);
            return (
              <div
                key={record.id}
                className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      {getMaintenanceTypeIcon(record.maintenance_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {record.maintenance_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h4>
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          status.status === "completed" && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
                          status.status === "scheduled" && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
                          status.status === "due" && "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                        )}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(record.maintenance_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        
                        {record.mileage_at_service && (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-current" />
                            <span>{formatMileage(record.mileage_at_service)} km</span>
                          </div>
                        )}
                        
                        {record.cost_brl && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(record.cost_brl)}</span>
                          </div>
                        )}
                        
                        {record.service_provider && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>{record.service_provider}</span>
                          </div>
                        )}
                      </div>
                      
                      {record.description && (
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                          {record.description}
                        </p>
                      )}
                      
                      {(record.next_service_due_date || record.next_service_due_mileage) && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Next Service Due:
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.next_service_due_date && (
                              <span>
                                📅 {new Date(record.next_service_due_date).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {record.next_service_due_mileage && (
                              <span>
                                🛣️ {formatMileage(record.next_service_due_mileage)} km
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}