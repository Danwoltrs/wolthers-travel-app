'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calendar, TrendingUp, Users } from 'lucide-react'

interface CompanyTravelHeatmapProps {
  companyId: string
  year?: number
  className?: string
}

interface LocationVisit {
  location: string
  country: string
  coordinates: [number, number]
  visitCount: number
  lastVisit: string
  totalCost: number
  averageDuration: number
  visitors: string[]
}

interface MonthlyData {
  month: number
  monthName: string
  tripCount: number
  cost: number
  locations: string[]
  intensity: number // 0-4 for color intensity
}

interface HeatmapData {
  year: number
  totalTrips: number
  totalCost: number
  uniqueLocations: number
  monthlyData: MonthlyData[]
  topLocations: LocationVisit[]
  yearOverYearGrowth: number
}

// Mock data generator - in real app this would come from API
const generateMockHeatmapData = (companyId: string, year: number): HeatmapData => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  // Generate realistic monthly patterns
  const monthlyData: MonthlyData[] = months.map((monthName, index) => {
    const isHighSeason = index >= 2 && index <= 5 || index >= 8 && index <= 10 // Mar-Jun, Sep-Nov
    const baseTripCount = isHighSeason ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 4) + 1
    const tripCount = Math.max(0, baseTripCount + Math.floor(Math.random() * 3) - 1)
    
    return {
      month: index + 1,
      monthName,
      tripCount,
      cost: tripCount * (15000 + Math.random() * 25000), // $15k-$40k per trip
      locations: tripCount > 0 ? ['Guatemala', 'Colombia', 'Ethiopia', 'Brazil', 'Kenya'].slice(0, Math.min(tripCount, 3)) : [],
      intensity: Math.min(Math.floor(tripCount / 2), 4)
    }
  })

  const totalTrips = monthlyData.reduce((sum, month) => sum + month.tripCount, 0)
  const totalCost = monthlyData.reduce((sum, month) => sum + month.cost, 0)

  const topLocations: LocationVisit[] = [
    {
      location: 'Guatemala City, Guatemala',
      country: 'Guatemala',
      coordinates: [14.6349, -90.5069],
      visitCount: 8,
      lastVisit: '2025-03-15',
      totalCost: 125000,
      averageDuration: 4.2,
      visitors: ['Daniel Wolthers', 'Tom Hansen', 'Svenn Larsen']
    },
    {
      location: 'Medellín, Colombia',
      country: 'Colombia',
      coordinates: [6.2442, -75.5812],
      visitCount: 6,
      lastVisit: '2025-02-28',
      totalCost: 95000,
      averageDuration: 3.8,
      visitors: ['Daniel Wolthers', 'Rasmus Nielsen']
    },
    {
      location: 'Addis Ababa, Ethiopia',
      country: 'Ethiopia',
      coordinates: [9.0192, 38.7525],
      visitCount: 5,
      lastVisit: '2025-01-20',
      totalCost: 145000,
      averageDuration: 5.5,
      visitors: ['Daniel Wolthers', 'Tom Hansen']
    },
    {
      location: 'São Paulo, Brazil',
      country: 'Brazil',
      coordinates: [-23.5505, -46.6333],
      visitCount: 4,
      lastVisit: '2024-12-10',
      totalCost: 87000,
      averageDuration: 3.5,
      visitors: ['Svenn Larsen', 'Rasmus Nielsen']
    },
    {
      location: 'Nairobi, Kenya',
      country: 'Kenya',
      coordinates: [-1.2864, 36.8172],
      visitCount: 3,
      lastVisit: '2024-11-05',
      totalCost: 78000,
      averageDuration: 4.8,
      visitors: ['Daniel Wolthers']
    }
  ]

  return {
    year,
    totalTrips,
    totalCost,
    uniqueLocations: topLocations.length,
    monthlyData,
    topLocations,
    yearOverYearGrowth: (Math.random() - 0.5) * 40 // -20% to +20%
  }
}

export default function CompanyTravelHeatmap({ companyId, year = 2025, className = '' }: CompanyTravelHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setIsLoading(true)
      // In real app, this would be an API call
      setTimeout(() => {
        const data = generateMockHeatmapData(companyId, year)
        setHeatmapData(data)
        setIsLoading(false)
      }, 800)
    }

    fetchData()
  }, [companyId, year])

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!heatmapData) return null

  const getIntensityColor = (intensity: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700', // 0 trips
      'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800', // 1-2 trips
      'bg-emerald-200 dark:bg-emerald-800/70 border-emerald-300 dark:border-emerald-700', // 3-4 trips
      'bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600', // 5-6 trips
      'bg-emerald-600 dark:bg-emerald-600 border-emerald-700 dark:border-emerald-500', // 7+ trips
    ]
    return colors[Math.min(intensity, 4)]
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
              Travel Activity Heatmap
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {year} - Travel patterns and frequency by month
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {heatmapData.yearOverYearGrowth > 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
          )}
          <span className={`text-sm font-medium ${
            heatmapData.yearOverYearGrowth > 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {heatmapData.yearOverYearGrowth > 0 ? '+' : ''}{heatmapData.yearOverYearGrowth.toFixed(1)}% YoY
          </span>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">Total Trips</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
            {heatmapData.totalTrips}
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300">Total Cost</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
            {formatCurrency(heatmapData.totalCost)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm text-violet-700 dark:text-violet-300">Locations</span>
          </div>
          <div className="text-2xl font-bold text-violet-900 dark:text-violet-100 mt-1">
            {heatmapData.uniqueLocations}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">Avg/Month</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            {(heatmapData.totalTrips / 12).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Monthly Heatmap */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-golden-400">Monthly Activity</h4>
        
        {/* Heatmap Grid */}
        <div className="grid grid-cols-12 gap-2">
          {heatmapData.monthlyData.map((month) => (
            <div
              key={month.month}
              className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                getIntensityColor(month.intensity)
              } ${selectedMonth === month.month ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
              onClick={() => setSelectedMonth(selectedMonth === month.month ? null : month.month)}
            >
              <div className="text-center">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {month.monthName}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {month.tripCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {month.tripCount === 1 ? 'trip' : 'trips'}
                </div>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                <div className="font-medium">{month.monthName} {heatmapData.year}</div>
                <div>{month.tripCount} trips • {formatCurrency(month.cost)}</div>
                {month.locations.length > 0 && (
                  <div className="text-xs opacity-75">{month.locations.join(', ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className={`w-3 h-3 rounded-sm border ${getIntensityColor(intensity)}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Selected Month Details */}
      {selectedMonth && (
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/10 dark:to-emerald-800/10 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          {(() => {
            const monthData = heatmapData.monthlyData.find(m => m.month === selectedMonth)
            if (!monthData) return null
            
            return (
              <div>
                <h5 className="font-medium text-emerald-900 dark:text-emerald-100 mb-2">
                  {monthData.monthName} {heatmapData.year} Details
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-300">Trips:</span>
                    <span className="ml-2 font-medium text-emerald-900 dark:text-emerald-100">
                      {monthData.tripCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-300">Cost:</span>
                    <span className="ml-2 font-medium text-emerald-900 dark:text-emerald-100">
                      {formatCurrency(monthData.cost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-700 dark:text-emerald-300">Locations:</span>
                    <span className="ml-2 font-medium text-emerald-900 dark:text-emerald-100">
                      {monthData.locations.length || 0}
                    </span>
                  </div>
                </div>
                {monthData.locations.length > 0 && (
                  <div className="mt-2">
                    <span className="text-emerald-700 dark:text-emerald-300 text-sm">Visited: </span>
                    <span className="text-emerald-900 dark:text-emerald-100 text-sm">
                      {monthData.locations.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Top Locations */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-golden-400">Most Visited Locations</h4>
        
        <div className="space-y-3">
          {heatmapData.topLocations.slice(0, 5).map((location, index) => (
            <div
              key={location.location}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {location.location}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {location.visitCount} visits • {location.averageDuration} days avg
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(location.totalCost)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last: {new Date(location.lastVisit).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}