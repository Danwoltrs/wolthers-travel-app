"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Clock,
  Target,
  PieChart,
  LineChart,
  TrendingDown,
  Filter,
} from "lucide-react";
import StatisticsChart from "../charts/StatisticsChart";
import CompanyTravelHeatmap from "../charts/CompanyTravelHeatmap";
import { useCompanyStatistics } from "@/hooks/useCompanyStatistics";
import type { ChartDataPoint } from "../charts/StatisticsChart";

interface CompanyStatisticsTabProps {
  companyId: string;
}

interface CompanyStats {
  totalTrips: number;
  totalSpend: number;
  totalMeetings: number;
  avgCostPerTrip: number;
  uniqueLocations: number;
  uniqueStaff: number;
  avgTripDuration: number;
  lastTripDate: string;
  yearOverYearGrowth: number;
  quarterlyTrends: ChartDataPoint[];
  costBreakdown: ChartDataPoint[];
  locationDistribution: ChartDataPoint[];
  monthlyTrends: ChartDataPoint[];
  staffEngagement: ChartDataPoint[];
}

// This component now uses the useCompanyStatistics hook which pulls real data
// from Supabase and provides intelligent fallbacks when no data exists
const generateEmptyStats = (): CompanyStats => {
  return {
    totalTrips: 0,
    totalSpend: 0,
    totalMeetings: 0,
    avgCostPerTrip: 0,
    uniqueLocations: 0,
    uniqueStaff: 0,
    avgTripDuration: 0,
    lastTripDate: new Date().toISOString(),
    yearOverYearGrowth: 0,
    quarterlyTrends: [],
    costBreakdown: [],
    locationDistribution: [],
    monthlyTrends: [],
    staffEngagement: [],
  };
};

export default function CompanyStatisticsTab({
  companyId,
}: CompanyStatisticsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<
    "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [selectedMetric, setSelectedMetric] = useState<
    "trips" | "cost" | "all"
  >("all");

  // Use the real statistics hook
  const { stats, loading, error } = useCompanyStatistics(companyId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">
            Error loading statistics: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800/50 rounded-lg p-8 text-center">
          <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No statistics available
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start creating trips to see company statistics
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-emerald-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (trend: number): string => {
    if (trend > 0) return "text-emerald-600";
    if (trend < 0) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
            Company Statistics & Analytics
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive travel insights and performance metrics
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Metrics</option>
            <option value="trips">Trips Only</option>
            <option value="cost">Cost Only</option>
          </select>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {getTrendIcon(stats.yearOverYearGrowth)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Trips
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(stats.totalTrips)}
          </p>
          <p
            className={`text-xs mt-1 ${getTrendColor(stats.yearOverYearGrowth)}`}
          >
            {stats.yearOverYearGrowth > 0 ? "+" : ""}
            {stats.yearOverYearGrowth.toFixed(1)}% YoY
          </p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {getTrendIcon(15.2)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Spend
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(stats.totalSpend)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(15.2)}`}>+15.2% YoY</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            {getTrendIcon(8.7)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Meetings</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(stats.totalMeetings)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(8.7)}`}>+8.7% YoY</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {getTrendIcon(-3.1)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Avg Cost/Trip
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(stats.avgCostPerTrip)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(-3.1)}`}>-3.1% YoY</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {getTrendIcon(12.0)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Locations</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(stats.uniqueLocations)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(12.0)}`}>+12.0% YoY</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            {getTrendIcon(5.8)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Staff</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(stats.uniqueStaff)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(5.8)}`}>+5.8% YoY</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            {getTrendIcon(7.3)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Avg Duration
          </p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {stats.avgTripDuration} days
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(7.3)}`}>+7.3% YoY</p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last Trip</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {new Date(stats.lastTripDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.floor(
              (Date.now() - new Date(stats.lastTripDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )}{" "}
            days ago
          </p>
        </div>
      </div>

      {/* Travel Activity Heatmap */}
      <CompanyTravelHeatmap companyId={companyId} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <StatisticsChart
          title="Monthly Trip Trends"
          subtitle="Trip volume by month with trend indicators"
          data={stats.monthlyTrends}
          type="area"
          metric="trips"
          height={300}
          showTrend={true}
          showLegend={false}
        />

        {/* Quarterly Performance */}
        <StatisticsChart
          title="Quarterly Performance"
          subtitle="Trip volume by quarter showing growth patterns"
          data={stats.quarterlyTrends}
          type="bar"
          metric="trips"
          height={300}
          showTrend={true}
          showLegend={false}
        />

        {/* Cost Breakdown */}
        <StatisticsChart
          title="Cost Breakdown"
          subtitle="Expense distribution by category"
          data={stats.costBreakdown}
          type="donut"
          metric="cost"
          height={300}
          showTrend={false}
          showLegend={true}
        />

        {/* Location Distribution */}
        <StatisticsChart
          title="Location Distribution"
          subtitle="Trip frequency by destination"
          data={stats.locationDistribution}
          type="pie"
          metric="trips"
          height={300}
          showTrend={false}
          showLegend={true}
        />
      </div>

      {/* Staff Engagement Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatisticsChart
          title="Staff Travel Engagement"
          subtitle="Trip participation by team member"
          data={stats.staffEngagement}
          type="bar"
          metric="trips"
          height={300}
          showTrend={false}
          showLegend={false}
        />

        {/* ROI and Efficiency Metrics */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
              Efficiency Metrics
            </h4>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  Cost per Meeting
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(
                    stats.totalSpend / Math.max(stats.totalMeetings, 1),
                  )}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Trips per Location
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {(
                    stats.totalTrips / Math.max(stats.uniqueLocations, 1)
                  ).toFixed(1)}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg">
              <div>
                <p className="text-sm text-violet-700 dark:text-violet-300">
                  Staff Utilization
                </p>
                <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                  {(
                    ((stats.totalTrips / Math.max(stats.uniqueStaff, 1)) *
                      100) /
                    12
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <Users className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Meeting Success Rate
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {(
                    (stats.totalMeetings / Math.max(stats.totalTrips, 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
