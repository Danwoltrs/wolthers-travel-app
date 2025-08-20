'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, TrendingUp, Calendar, DollarSign, Users, MapPin, 
  Clock, Target, PieChart, LineChart, TrendingDown, Filter
} from 'lucide-react'
import StatisticsChart from '../charts/StatisticsChart'
import CompanyTravelHeatmap from '../charts/CompanyTravelHeatmap'
import type { ChartDataPoint } from '../charts/StatisticsChart'

interface CompanyStatisticsTabProps {
  companyId: string
}

interface CompanyStats {
  totalTrips: number
  totalSpend: number
  totalMeetings: number
  avgCostPerTrip: number
  uniqueLocations: number
  uniqueStaff: number
  avgTripDuration: number
  lastTripDate: string
  yearOverYearGrowth: number
  quarterlyTrends: ChartDataPoint[]
  costBreakdown: ChartDataPoint[]
  locationDistribution: ChartDataPoint[]
  monthlyTrends: ChartDataPoint[]
  staffEngagement: ChartDataPoint[]
}

// Mock data generator for comprehensive statistics
const generateMockStats = (companyId: string): CompanyStats => {
  const currentYear = new Date().getFullYear()
  
  return {
    totalTrips: 47,
    totalSpend: 485000,
    totalMeetings: 23,
    avgCostPerTrip: 10319,
    uniqueLocations: 8,
    uniqueStaff: 12,
    avgTripDuration: 4.2,
    lastTripDate: '2025-03-15',
    yearOverYearGrowth: 23.5,
    
    quarterlyTrends: [
      { label: 'Q1 2024', value: 8, trend: 12.5 },
      { label: 'Q2 2024', value: 15, trend: 25.0 },
      { label: 'Q3 2024', value: 12, trend: -8.3 },
      { label: 'Q4 2024', value: 18, trend: 33.3 },
      { label: 'Q1 2025', value: 11, trend: 15.4 }
    ],
    
    costBreakdown: [
      { label: 'Flights', value: 195000, percentage: 40.2, color: '#059669' },
      { label: 'Hotels', value: 125000, percentage: 25.8, color: '#F59E0B' },
      { label: 'Meals', value: 85000, percentage: 17.5, color: '#7C3AED' },
      { label: 'Ground Transport', value: 48000, percentage: 9.9, color: '#EF4444' },
      { label: 'Other', value: 32000, percentage: 6.6, color: '#3B82F6' }
    ],
    
    locationDistribution: [
      { label: 'Guatemala', value: 18, percentage: 38.3, color: '#059669' },
      { label: 'Colombia', value: 12, percentage: 25.5, color: '#F59E0B' },
      { label: 'Ethiopia', value: 8, percentage: 17.0, color: '#7C3AED' },
      { label: 'Brazil', value: 6, percentage: 12.8, color: '#EF4444' },
      { label: 'Kenya', value: 3, percentage: 6.4, color: '#3B82F6' }
    ],
    
    monthlyTrends: [
      { label: 'Jan', value: 2, trend: -12.5 },
      { label: 'Feb', value: 4, trend: 33.3 },
      { label: 'Mar', value: 5, trend: 25.0 },
      { label: 'Apr', value: 6, trend: 20.0 },
      { label: 'May', value: 4, trend: -16.7 },
      { label: 'Jun', value: 7, trend: 40.0 },
      { label: 'Jul', value: 3, trend: -28.6 },
      { label: 'Aug', value: 5, trend: 25.0 },
      { label: 'Sep', value: 4, trend: -11.1 },
      { label: 'Oct', value: 6, trend: 33.3 },
      { label: 'Nov', value: 5, trend: -9.1 },
      { label: 'Dec', value: 6, trend: 15.4 }
    ],
    
    staffEngagement: [
      { label: 'Daniel Wolthers', value: 18, percentage: 38.3 },
      { label: 'Tom Hansen', value: 12, percentage: 25.5 },
      { label: 'Svenn Larsen', value: 8, percentage: 17.0 },
      { label: 'Rasmus Nielsen', value: 6, percentage: 12.8 },
      { label: 'Others', value: 3, percentage: 6.4 }
    ]
  }
}

export default function CompanyStatisticsTab({ companyId }: CompanyStatisticsTabProps) {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')
  const [selectedMetric, setSelectedMetric] = useState<'trips' | 'cost' | 'all'>('all')

  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      setIsLoading(true)
      // In real app, this would be an API call
      setTimeout(() => {
        const mockStats = generateMockStats(companyId)
        setStats(mockStats)
        setIsLoading(false)
      }, 1000)
    }

    fetchStats()
  }, [companyId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-emerald-600" />
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return null
  }

  const getTrendColor = (trend: number): string => {
    if (trend > 0) return 'text-emerald-600'
    if (trend < 0) return 'text-red-600'
    return 'text-gray-500'
  }

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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {getTrendIcon(stats.yearOverYearGrowth)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Trips</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatNumber(stats.totalTrips)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(stats.yearOverYearGrowth)}`}>
            {stats.yearOverYearGrowth > 0 ? '+' : ''}{stats.yearOverYearGrowth.toFixed(1)}% YoY
          </p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {getTrendIcon(15.2)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Spend</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(stats.totalSpend)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(15.2)}`}>
            +15.2% YoY
          </p>
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
          <p className={`text-xs mt-1 ${getTrendColor(8.7)}`}>
            +8.7% YoY
          </p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {getTrendIcon(-3.1)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Cost/Trip</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(stats.avgCostPerTrip)}
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(-3.1)}`}>
            -3.1% YoY
          </p>
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
          <p className={`text-xs mt-1 ${getTrendColor(12.0)}`}>
            +12.0% YoY
          </p>
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
          <p className={`text-xs mt-1 ${getTrendColor(5.8)}`}>
            +5.8% YoY
          </p>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            {getTrendIcon(7.3)}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Avg Duration</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {stats.avgTripDuration} days
          </p>
          <p className={`text-xs mt-1 ${getTrendColor(7.3)}`}>
            +7.3% YoY
          </p>
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
            {Math.floor((Date.now() - new Date(stats.lastTripDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
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
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Cost per Meeting</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {formatCurrency(stats.totalSpend / Math.max(stats.totalMeetings, 1))}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">Trips per Location</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {(stats.totalTrips / Math.max(stats.uniqueLocations, 1)).toFixed(1)}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg">
              <div>
                <p className="text-sm text-violet-700 dark:text-violet-300">Staff Utilization</p>
                <p className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                  {((stats.totalTrips / Math.max(stats.uniqueStaff, 1)) * 100 / 12).toFixed(1)}%
                </p>
              </div>
              <Users className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Meeting Success Rate</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {((stats.totalMeetings / Math.max(stats.totalTrips, 1)) * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}