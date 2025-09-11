"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  MapPin, 
  Clock, 
  Navigation,
  Calendar,
  Gauge
} from "lucide-react";

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

interface UsageLog {
  id: string;
  driver_id: string;
  driver_name: string;
  trip_id: string | null;
  trip_title: string | null;
  usage_start_datetime: string;
  usage_end_datetime: string | null;
  start_mileage: number;
  end_mileage: number | null;
  start_location: string | null;
  end_location: string | null;
  fuel_level_start: number | null;
  fuel_level_end: number | null;
  usage_type: string;
  notes: string | null;
  created_at: string;
}

interface VehicleUsageTabProps {
  vehicle: Vehicle;
}

export default function VehicleUsageTab({ vehicle }: VehicleUsageTabProps) {
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "trip" | "maintenance" | "personal">("all");

  useEffect(() => {
    fetchUsageLogs();
  }, [vehicle.id]);

  const fetchUsageLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/usage`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsageLogs(data.usage || []);
      }
    } catch (error) {
      console.error("Error fetching usage logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = usageLogs.filter(log => 
    filter === "all" || log.usage_type === filter
  );

  const calculateDistance = (log: UsageLog) => {
    if (!log.end_mileage) return null;
    return log.end_mileage - log.start_mileage;
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('pt-BR').format(mileage);
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('pt-BR');
  };

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return "Ongoing";
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.floor(totalMinutes / 60);
    let diffMinutes = totalMinutes % 60;
    
    // Round minutes to nearest 5-minute interval
    diffMinutes = Math.round(diffMinutes / 5) * 5;
    
    // Ensure minimum 5 minutes for any non-zero duration
    if (diffMinutes === 0 && diffHours === 0 && diffMs > 0) {
      diffMinutes = 5;
    }
    
    // Handle case where rounding brings minutes to 60
    if (diffMinutes === 60) {
      return `${diffHours + 1}hr`;
    }
    
    if (diffHours > 0 && diffMinutes > 0) {
      return `${diffHours}hr ${diffMinutes}min`;
    } else if (diffHours > 0) {
      return `${diffHours}hr`;
    } else {
      return `${diffMinutes}min`;
    }
  };

  const getUsageTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case "trip":
        return <Navigation className={iconClass} />;
      case "maintenance":
        return <div className={`${iconClass} rounded border border-current`} />;
      case "personal":
        return <Users className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  };

  const getUsageTypeColor = (type: string) => {
    switch (type) {
      case "trip":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "maintenance":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      case "personal":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const getUsageTypeLabel = (type: string) => {
    switch (type) {
      case "trip":
        return "Business Trip";
      case "maintenance":
        return "Maintenance";
      case "personal":
        return "Personal Use";
      default:
        return "Other";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
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
      {/* Header with Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
            Usage History
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete log of who drove this vehicle and when
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Usage</option>
            <option value="trip">Business Trips</option>
            <option value="maintenance">Maintenance</option>
            <option value="personal">Personal Use</option>
          </select>
        </div>
      </div>

      {/* Usage Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Trips</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {usageLogs.filter(log => log.usage_type === 'trip').length}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Distance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatMileage(
              usageLogs.reduce((total, log) => {
                const distance = calculateDistance(log);
                return total + (distance || 0);
              }, 0)
            )} km
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Unique Drivers</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {new Set(usageLogs.map(log => log.driver_id)).size}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {usageLogs.filter(log => {
              const logDate = new Date(log.usage_start_datetime);
              const currentDate = new Date();
              return logDate.getMonth() === currentDate.getMonth() && 
                     logDate.getFullYear() === currentDate.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Usage Logs */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {filter === "all" ? "No Usage Records" : `No ${getUsageTypeLabel(filter)} Records`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "all" 
              ? "Usage logs will appear here once this vehicle is used for trips or maintenance."
              : `No ${getUsageTypeLabel(filter).toLowerCase()} records found for this vehicle.`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => {
            const distance = calculateDistance(log);
            return (
              <div
                key={log.id}
                className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      {getUsageTypeIcon(log.usage_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {log.trip_title || `${getUsageTypeLabel(log.usage_type)} by ${log.driver_name}`}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUsageTypeColor(log.usage_type)}`}>
                          {getUsageTypeLabel(log.usage_type)}
                        </span>
                      </div>
                      
                      {/* Basic Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>{log.driver_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(log.usage_start_datetime)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(log.usage_start_datetime, log.usage_end_datetime)}</span>
                        </div>
                        
                        {distance && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Gauge className="h-4 w-4" />
                            <span>{formatMileage(distance)} km</span>
                          </div>
                        )}
                      </div>

                      {/* Location and Mileage Details */}
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                        {/* Locations */}
                        {(log.start_location || log.end_location) && (
                          <div className="space-y-2">
                            {log.start_location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">From:</span> {log.start_location}
                                </span>
                              </div>
                            )}
                            {log.end_location && (
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-red-600" />
                                <span className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">To:</span> {log.end_location}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Mileage Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Start Mileage:</span>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {formatMileage(log.start_mileage)} km
                            </p>
                          </div>
                          
                          {log.end_mileage && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">End Mileage:</span>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {formatMileage(log.end_mileage)} km
                              </p>
                            </div>
                          )}
                          
                          {log.fuel_level_start && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Fuel Start:</span>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {log.fuel_level_start}%
                              </p>
                            </div>
                          )}
                          
                          {log.fuel_level_end && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Fuel End:</span>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {log.fuel_level_end}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {log.notes && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Notes:</span> {log.notes}
                          </p>
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