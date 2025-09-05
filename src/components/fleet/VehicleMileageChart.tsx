"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Fuel,
  Route,
  Clock
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

interface MileageData {
  month: string;
  distance: number;
  fuel_cost: number;
  efficiency: number;
  trips: number;
}

interface VehicleMileageChartProps {
  vehicle: Vehicle;
}

export default function VehicleMileageChart({ vehicle }: VehicleMileageChartProps) {
  const [mileageData, setMileageData] = useState<MileageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"6months" | "year" | "all">("6months");

  useEffect(() => {
    fetchMileageData();
  }, [vehicle.id, timeframe]);

  const fetchMileageData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fleet/vehicles/${vehicle.id}/analytics?timeframe=${timeframe}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setMileageData(data.mileage_data || []);
      }
    } catch (error) {
      console.error("Error fetching mileage analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use only real data, no mock data
  const data = mileageData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatMileage = (mileage: number) => {
    return new Intl.NumberFormat('pt-BR').format(mileage);
  };

  const getMonthName = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Calculate summary statistics
  const totalDistance = data.length > 0 ? data.reduce((sum, item) => sum + item.distance, 0) : 0;
  const totalFuelCost = data.length > 0 ? data.reduce((sum, item) => sum + item.fuel_cost, 0) : 0;
  const avgEfficiency = data.length > 0 ? data.reduce((sum, item) => sum + item.efficiency, 0) / data.length : 0;
  const totalTrips = data.length > 0 ? data.reduce((sum, item) => sum + item.trips, 0) : 0;

  // Calculate trends
  const lastMonthDistance = data.length > 1 ? data[data.length - 1].distance : 0;
  const previousMonthDistance = data.length > 1 ? data[data.length - 2].distance : 0;
  const distanceTrend = lastMonthDistance - previousMonthDistance;
  const distanceTrendPercentage = previousMonthDistance > 0 ? (distanceTrend / previousMonthDistance) * 100 : 0;

  const lastMonthEfficiency = data.length > 1 ? data[data.length - 1].efficiency : 0;
  const previousMonthEfficiency = data.length > 1 ? data[data.length - 2].efficiency : 0;
  const efficiencyTrend = lastMonthEfficiency - previousMonthEfficiency;

  const maxDistance = Math.max(...data.map(item => item.distance));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Timeframe Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400">
            Usage Analytics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Detailed usage patterns and efficiency metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Timeframe:</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="6months">Last 6 Months</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Route className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Distance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length > 0 ? `${formatMileage(totalDistance)} km` : '— km'}
          </p>
          {data.length > 1 ? (
            <div className="flex items-center gap-1 mt-1">
              {distanceTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${distanceTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(distanceTrendPercentage).toFixed(1)}% vs last month
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              — vs last month
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Cost</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length > 0 ? formatCurrency(totalFuelCost) : 'R$ —,—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {data.length > 0 ? `${formatCurrency(totalFuelCost / (totalDistance || 1) * 100)}/100km` : 'R$ —,—/100km'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Efficiency</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length > 0 ? `${avgEfficiency.toFixed(1)} km/L` : '—,— km/L'}
          </p>
          {data.length > 1 ? (
            <div className="flex items-center gap-1 mt-1">
              {efficiencyTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${efficiencyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(efficiencyTrend).toFixed(1)} vs last month
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              —,— vs last month
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Trips</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.length > 0 ? totalTrips : '—'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {data.length > 0 ? `${(totalDistance / (totalTrips || 1)).toFixed(0)} km/trip avg` : '— km/trip avg'}
          </p>
        </div>
      </div>

      {/* Distance Chart */}
      <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
          Monthly Distance Traveled
        </h4>
        
        {data.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No usage data available for the selected timeframe
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={item.month} className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {getMonthName(item.month)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatMileage(item.distance)} km • {item.trips} trips
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(item.distance / maxDistance) * 100}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-500">
                  <div>
                    <span className="flex items-center gap-1">
                      <Fuel className="h-3 w-3" />
                      {formatCurrency(item.fuel_cost)}
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      {item.efficiency} km/L
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1">
                      <Route className="h-3 w-3" />
                      {formatCurrency(item.fuel_cost / item.distance * 100)}/100km
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Efficiency Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
            Fuel Efficiency Trend
          </h4>
          
          {data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No efficiency data available
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, index) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getMonthName(item.month).split(' ')[0]}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full"
                        style={{
                          width: `${(item.efficiency / 15) * 100}%` // Assuming max efficiency of 15 km/L
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-12">
                      {item.efficiency} km/L
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
            Usage Insights
          </h4>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                🎯 Most Efficient Month
              </h5>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                {data.length > 0 ? (
                  <>
                    {getMonthName(data.reduce((max, item) => item.efficiency > max.efficiency ? item : max).month)} with {Math.max(...data.map(item => item.efficiency)).toFixed(1)} km/L
                  </>
                ) : '— with —,— km/L'}
              </p>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h5 className="font-medium text-green-900 dark:text-green-300 mb-2">
                📊 Average Monthly Usage
              </h5>
              <p className="text-sm text-green-800 dark:text-green-400">
                {data.length > 0 ? `${formatMileage(Math.round(totalDistance / data.length))} km per month` : '— km per month'}
              </p>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h5 className="font-medium text-orange-900 dark:text-orange-300 mb-2">
                ⛽ Fuel Cost Analysis
              </h5>
              <p className="text-sm text-orange-800 dark:text-orange-400">
                {data.length > 0 ? `${formatCurrency(totalFuelCost / data.length)} average monthly cost` : 'R$ —,— average monthly cost'}
              </p>
            </div>

            {vehicle.last_maintenance_mileage && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h5 className="font-medium text-purple-900 dark:text-purple-300 mb-2">
                  🔧 Since Last Service
                </h5>
                <p className="text-sm text-purple-800 dark:text-purple-400">
                  {formatMileage(vehicle.current_mileage - vehicle.last_maintenance_mileage)} km driven
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}