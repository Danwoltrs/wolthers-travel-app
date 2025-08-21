'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, MapPin, DollarSign } from 'lucide-react'
import useSWR from 'swr'

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

interface TrendPoint {
  month: string
  conventions: number
  inland: number
  other: number
  totalCost: number
}

interface RealTravelTrendsProps {
  selectedSection: 'wolthers' | 'importers' | 'exporters'
  className?: string
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function RealTravelTrends({ selectedSection, className = '' }: RealTravelTrendsProps) {
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [summary, setSummary] = useState({
    totalTrips: 0,
    totalCost: 0,
    conventions: 0,
    inland: 0,
    avgTripCost: 0
  })

  // Fetch real trips data
  const { data: tripsData, error, isLoading } = useSWR<{ trips: TripData[] }>(
    '/api/trips/real-data',
    fetcher
  )

  useEffect(() => {
    if (!tripsData?.trips) return

    const trips = tripsData.trips

    // Group trips by month
    const monthlyMap = new Map<string, TrendPoint>()
    let totalCost = 0
    let conventions = 0
    let inland = 0

    trips.forEach(trip => {
      const startDate = new Date(trip.start_date)
      const monthKey = startDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const cost = trip.total_cost ? parseFloat(trip.total_cost) : 0
      totalCost += cost

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          conventions: 0,
          inland: 0,
          other: 0,
          totalCost: 0
        })
      }

      const monthData = monthlyMap.get(monthKey)!
      monthData.totalCost += cost

      // Categorize trip types
      switch (trip.trip_type) {
        case 'convention':
          monthData.conventions++
          conventions++
          break
        case 'in_land':
          monthData.inland++
          inland++
          break
        default:
          monthData.other++
          break
      }
    })

    // Sort by month chronologically
    const sortedData = Array.from(monthlyMap.values()).sort((a, b) => {
      // Simple sort by month name for now
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const aMonth = a.month.split(' ')[0]
      const bMonth = b.month.split(' ')[0]
      return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth)
    })

    setTrendData(sortedData)
    setSummary({
      totalTrips: trips.length,
      totalCost,
      conventions,
      inland,
      avgTripCost: trips.length > 0 ? totalCost / trips.length : 0
    })

  }, [tripsData])

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-red-500 dark:text-red-400">Error loading trends</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {error.message || 'Failed to fetch trip trends'}
          </p>
        </div>
      </div>
    )
  }

  if (summary.totalTrips === 0) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No travel trends data</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Travel patterns will appear here as trips are created
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
      <div className="flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
            Real Travel Trends
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Based on {summary.totalTrips} actual trips • 2025 data
          </p>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-700 dark:text-blue-300">Conventions</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            {summary.conventions}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {((summary.conventions / summary.totalTrips) * 100).toFixed(0)}% of trips
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">Inland Trips</span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
            {summary.inland}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            {((summary.inland / summary.totalTrips) * 100).toFixed(0)}% of trips
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm text-amber-700 dark:text-amber-300">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-amber-900 dark:text-amber-100 mt-1">
            {formatCurrency(summary.totalCost)}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400">
            This year
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-700 dark:text-purple-300">Avg Cost</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
            {formatCurrency(summary.avgTripCost)}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400">
            Per trip
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {trendData.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-golden-400">Monthly Breakdown</h4>
          
          <div className="space-y-3">
            {trendData.map((month, index) => {
              const totalTrips = month.conventions + month.inland + month.other
              const isCurrentMonth = month.month.includes('Aug') // Highlight current activity
              
              return (
                <div
                  key={month.month}
                  className={`p-4 rounded-lg border ${
                    isCurrentMonth 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className={`font-medium ${
                        isCurrentMonth ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {month.month}
                        {isCurrentMonth && (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-xs">
                            Active
                          </span>
                        )}
                      </h5>
                      <p className={`text-sm ${
                        isCurrentMonth ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {totalTrips} {totalTrips === 1 ? 'trip' : 'trips'} • {formatCurrency(month.totalCost)}
                      </p>
                    </div>
                  </div>

                  {/* Trip type breakdown */}
                  <div className="flex gap-4 text-sm">
                    {month.conventions > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {month.conventions} convention{month.conventions !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {month.inland > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {month.inland} inland trip{month.inland !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    {month.other > 0 && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {month.other} other trip{month.other !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Data Source Note */}
      <div className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        Real data from {summary.totalTrips} trips • No fake statistics • Updated automatically
      </div>
    </div>
  )
}