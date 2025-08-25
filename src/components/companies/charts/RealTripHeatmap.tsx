'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calendar, TrendingUp, Users } from 'lucide-react'
import useSWR from 'swr'

interface RealTripHeatmapProps {
  selectedSection: 'wolthers' | 'buyers' | 'suppliers'
  className?: string
}

interface TripData {
  id: string
  title: string
  status: string
  start_date: string
  end_date: string
  total_cost: string | null
  access_code: string
  trip_type: string
  created_at: string
}

interface LocationData {
  location: string
  tripCount: number
  totalCost: number
  trips: TripData[]
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

// Extract location from trip titles
const extractLocation = (title: string): string => {
  // Common patterns in trip titles
  if (title.includes('Amsterdam')) return 'Amsterdam, Netherlands'
  if (title.includes('Copenhagen')) return 'Copenhagen, Denmark'  
  if (title.includes('Berlin')) return 'Berlin, Germany'
  if (title.includes('Swiss')) return 'Switzerland'
  
  // Fallback patterns
  const locationPatterns = [
    /^([A-Z][a-z]+)\s/,  // City at start
    /in\s([A-Z][a-z]+)/,  // "in City"
    /to\s([A-Z][a-z]+)/,  // "to City"
  ]
  
  for (const pattern of locationPatterns) {
    const match = title.match(pattern)
    if (match) return match[1]
  }
  
  return 'Unknown Location'
}

// Calculate months between dates
const getMonthsBetween = (start: string, end: string): number => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (endDate.getMonth() - startDate.getMonth()) + 1
  return Math.max(1, months)
}

export default function RealTripHeatmap({ selectedSection, className = '' }: RealTripHeatmapProps) {
  const [processedData, setProcessedData] = useState<{
    totalTrips: number
    totalCost: number
    uniqueLocations: number
    locationData: LocationData[]
    monthlyActivity: { month: string; trips: number }[]
  } | null>(null)

  // Fetch real trips data
  const { data: tripsData, error, isLoading } = useSWR<{ trips: TripData[] }>(
    '/api/trips/real-data', // We'll need to create this endpoint
    fetcher
  )

  useEffect(() => {
    if (!tripsData?.trips) return

    const trips = tripsData.trips

    // Calculate location data
    const locationMap = new Map<string, LocationData>()
    let totalCost = 0
    
    trips.forEach(trip => {
      const location = extractLocation(trip.title)
      const cost = trip.total_cost ? parseFloat(trip.total_cost) : 0
      totalCost += cost
      
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          location,
          tripCount: 0,
          totalCost: 0,
          trips: []
        })
      }
      
      const locationData = locationMap.get(location)!
      locationData.tripCount++
      locationData.totalCost += cost
      locationData.trips.push(trip)
    })

    // Create monthly activity (simplified for 2025)
    const monthlyMap = new Map<string, number>()
    trips.forEach(trip => {
      const startDate = new Date(trip.start_date)
      const monthKey = startDate.toLocaleDateString('en-US', { month: 'short' })
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1)
    })

    const monthlyActivity = Array.from(monthlyMap.entries())
      .map(([month, trips]) => ({ month, trips }))
      .sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return months.indexOf(a.month) - months.indexOf(b.month)
      })

    setProcessedData({
      totalTrips: trips.length,
      totalCost,
      uniqueLocations: locationMap.size,
      locationData: Array.from(locationMap.values()).sort((a, b) => b.tripCount - a.tripCount),
      monthlyActivity
    })
  }, [tripsData])

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">Error loading trip data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {error.message || 'Failed to fetch real trip data'}
          </p>
        </div>
      </div>
    )
  }

  if (!processedData || processedData.totalTrips === 0) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No trip data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Trip data will appear here once trips are created
          </p>
        </div>
      </div>
    )
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
              Real Trip Data (2025)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Based on {processedData.totalTrips} actual trips from database
            </p>
          </div>
        </div>
      </div>

      {/* Real Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">Total Trips</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">
            {processedData.totalTrips}
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300">Total Cost</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
            {formatCurrency(processedData.totalCost)}
          </div>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm text-violet-700 dark:text-violet-300">Locations</span>
          </div>
          <div className="text-2xl font-bold text-violet-900 dark:text-violet-100 mt-1">
            {processedData.uniqueLocations}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">Avg Cost</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            {formatCurrency(processedData.totalCost / processedData.totalTrips)}
          </div>
        </div>
      </div>

      {/* Monthly Activity */}
      {processedData.monthlyActivity.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-golden-400">2025 Monthly Activity</h4>
          
          <div className="flex gap-2 flex-wrap">
            {processedData.monthlyActivity.map((month) => (
              <div
                key={month.month}
                className="flex-1 min-w-[80px] p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800"
              >
                <div className="text-center">
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">
                    {month.month}
                  </div>
                  <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                    {month.trips}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">
                    {month.trips === 1 ? 'trip' : 'trips'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real Locations */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 dark:text-golden-400">Trip Locations</h4>
        
        <div className="space-y-3">
          {processedData.locationData.map((location, index) => (
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
                    {location.tripCount} {location.tripCount === 1 ? 'trip' : 'trips'}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(location.totalCost)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {location.trips.map(t => t.access_code).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Source Note */}
      <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        Real data from {processedData.totalTrips} trips in database • Updated automatically
      </div>
    </div>
  )
}