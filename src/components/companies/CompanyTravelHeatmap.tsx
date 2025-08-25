'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, MapPin, Users } from 'lucide-react'

interface Trip {
  id: string
  title: string
  trip_code: string
  start_date: string
  end_date: string
  status: string
  participants: any[]
}

interface CompanyTravelHeatmapProps {
  companyId: string
  trips?: any
}

interface MonthData {
  month: string
  year: number
  trips: Trip[]
  tripCount: number
  participantCount: number
}

export default function CompanyTravelHeatmap({ companyId, trips }: CompanyTravelHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<MonthData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'year' | '6months'>('year')

  useEffect(() => {
    if (trips?.trips) {
      generateHeatmapData(trips.trips)
    }
  }, [trips])

  const generateHeatmapData = (tripsList: Trip[]) => {
    const monthlyData: { [key: string]: MonthData } = {}
    const now = new Date()
    const monthsToShow = selectedPeriod === 'year' ? 12 : 6

    // Initialize last 12 months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      monthlyData[monthKey] = {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        trips: [],
        tripCount: 0,
        participantCount: 0
      }
    }

    // Group trips by month
    tripsList.forEach((trip: Trip) => {
      const startDate = new Date(trip.start_date)
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].trips.push(trip)
        monthlyData[monthKey].tripCount += 1
        monthlyData[monthKey].participantCount += trip.participants?.length || 0
      }
    })

    setHeatmapData(Object.values(monthlyData))
  }

  const maxTrips = Math.max(...heatmapData.map(d => d.tripCount), 1)
  
  const getIntensityColor = (tripCount: number) => {
    if (tripCount === 0) return 'bg-gray-100 dark:bg-gray-800'
    const intensity = tripCount / maxTrips
    if (intensity <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900/50'
    if (intensity <= 0.5) return 'bg-emerald-300 dark:bg-emerald-800/70'
    if (intensity <= 0.75) return 'bg-emerald-400 dark:bg-emerald-700'
    return 'bg-emerald-500 dark:bg-emerald-600'
  }

  const totalTrips = trips?.count || 0
  const averagePerMonth = heatmapData.length > 0 ? (totalTrips / heatmapData.length).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg/Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{averagePerMonth}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Most Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.max(...heatmapData.map(d => d.tripCount), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Travel Heatmap */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Travel Activity Heatmap
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monthly trip participation for this company
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('6months')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedPeriod === '6months'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              6 Months
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedPeriod === 'year'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              12 Months
            </button>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2">
            {heatmapData.map((monthData, index) => (
              <div key={index} className="text-center">
                <div
                  className={`w-full h-12 rounded-md ${getIntensityColor(monthData.tripCount)} 
                    border border-gray-200 dark:border-gray-700 cursor-pointer 
                    hover:ring-2 hover:ring-emerald-500 transition-all
                    flex items-center justify-center text-sm font-medium
                    ${monthData.tripCount > 0 ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  title={`${monthData.month} ${monthData.year}: ${monthData.tripCount} trips, ${monthData.participantCount} participants`}
                >
                  {monthData.tripCount > 0 ? monthData.tripCount : ''}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {monthData.month}
                </p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/50"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-800/70"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700"></div>
              <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600"></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">More</span>
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      {trips?.trips && trips.trips.length > 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recent Trips
          </h3>
          <div className="space-y-3">
            {trips.trips.slice(0, 5).map((trip: Trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {trip.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {trip.trip_code} • {new Date(trip.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  trip.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                    : trip.status === 'ongoing'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                }`}>
                  {trip.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}