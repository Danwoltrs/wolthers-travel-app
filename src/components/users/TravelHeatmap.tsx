'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

interface TravelHeatmapProps {
  userId: string
  year?: number
}

interface HeatmapData {
  week: number
  month: string
  monthIndex: number
  tripCount: number
  color: string
  weekOfYear: number
  dateRange: string
}

export default function TravelHeatmap({ userId, year = 2025 }: TravelHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [maxTripCount, setMaxTripCount] = useState(0)

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const getWeekOfYear = (date: Date): number => {
    const start = new Date(date.getFullYear(), 0, 1)
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayOfYear = (today.getTime() - start.getTime() + 86400000) / 86400000
    return Math.ceil(dayOfYear / 7)
  }

  const getDateRangeForWeek = (year: number, week: number): string => {
    const start = new Date(year, 0, 1)
    start.setDate(start.getDate() + (week - 1) * 7 - start.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  const getIntensityColor = (tripCount: number, maxTrips: number): string => {
    if (tripCount === 0) {
      return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }
    
    const intensity = Math.min(Math.ceil((tripCount / Math.max(maxTrips, 1)) * 4), 4)
    
    // Light mode: browns, Dark mode: greens (matching app theme)
    const lightColors = [
      'bg-amber-100 border-amber-200', // lightest brown
      'bg-amber-200 border-amber-300', 
      'bg-amber-400 border-amber-500',
      'bg-amber-600 border-amber-700'  // darkest brown
    ]
    
    const darkColors = [
      'dark:bg-emerald-900 dark:border-emerald-800', // lightest green
      'dark:bg-emerald-800 dark:border-emerald-700',
      'dark:bg-emerald-600 dark:border-emerald-500', 
      'dark:bg-emerald-500 dark:border-emerald-400'  // darkest green
    ]
    
    return `${lightColors[intensity - 1]} ${darkColors[intensity - 1]}`
  }

  const fetchTravelData = async () => {
    setIsLoading(true)
    try {
      // Get all trips for this user in the specified year
      const { data: userTrips, error } = await supabase
        .from('trip_participants')
        .select(`
          trips!inner(
            id,
            start_date,
            end_date
          )
        `)
        .eq('user_id', userId)
        .gte('trips.start_date', `${year}-01-01`)
        .lte('trips.start_date', `${year}-12-31`)

      if (error) {
        console.error('Error fetching travel data:', error)
        return
      }

      // Group trips by week
      const weeklyData: Record<number, number> = {}
      let maxTrips = 0

      userTrips?.forEach(tp => {
        const trip = tp.trips
        if (trip && trip.start_date) {
          const startDate = new Date(trip.start_date)
          const weekOfYear = getWeekOfYear(startDate)
          weeklyData[weekOfYear] = (weeklyData[weekOfYear] || 0) + 1
          maxTrips = Math.max(maxTrips, weeklyData[weekOfYear])
        }
      })

      setMaxTripCount(maxTrips)

      // Create heatmap data for all 52 weeks
      const heatmapArray: HeatmapData[] = []
      for (let week = 1; week <= 52; week++) {
        const tripCount = weeklyData[week] || 0
        const sampleDate = new Date(year, 0, 1)
        sampleDate.setDate(sampleDate.getDate() + (week - 1) * 7)
        const monthIndex = sampleDate.getMonth()
        
        heatmapArray.push({
          week,
          month: months[monthIndex],
          monthIndex,
          tripCount,
          color: getIntensityColor(tripCount, maxTrips),
          weekOfYear: week,
          dateRange: getDateRangeForWeek(year, week)
        })
      }

      setHeatmapData(heatmapArray)
    } catch (error) {
      console.error('Error fetching travel data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchTravelData()
    }
  }, [userId, year])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-amber-300 uppercase tracking-wider">
          Travel Activity ({year})
        </h4>
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  // Group weeks by month for header display
  const monthHeaders: Array<{ month: string; weeksInMonth: number; startWeek: number }> = []
  let currentMonth = ''
  let weeksInCurrentMonth = 0
  let monthStartWeek = 1

  heatmapData.forEach((data, index) => {
    if (data.month !== currentMonth) {
      if (currentMonth !== '') {
        monthHeaders.push({
          month: currentMonth,
          weeksInMonth: weeksInCurrentMonth,
          startWeek: monthStartWeek
        })
      }
      currentMonth = data.month
      weeksInCurrentMonth = 1
      monthStartWeek = index + 1
    } else {
      weeksInCurrentMonth++
    }
  })

  // Add the last month
  if (currentMonth !== '') {
    monthHeaders.push({
      month: currentMonth,
      weeksInMonth: weeksInCurrentMonth,
      startWeek: monthStartWeek
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-amber-300 uppercase tracking-wider">
          Travel Activity ({year})
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {heatmapData.reduce((sum, data) => sum + data.tripCount, 0)} trips in {year}
          {maxTripCount > 0 && ` • Busiest week: ${maxTripCount} trips`}
        </div>
      </div>
      
      <div className="flex">
        {/* Left side labels */}
        <div className="flex flex-col justify-start space-y-1 mr-6 text-xs text-gray-500 dark:text-gray-400">
          <div className="h-3 flex items-center">Month</div>
          <div className="h-3 flex items-center"></div>
          <div className="h-3 flex items-center">Week</div>
        </div>

        {/* Heatmap grid */}
        <div className="space-y-1 flex-1">
          {/* Month headers */}
          <div className="flex justify-between">
            {monthHeaders.map((header, index) => (
              <div 
                key={index} 
                className="text-xs text-gray-500 dark:text-gray-400 text-center flex-1"
                style={{ maxWidth: `${header.weeksInMonth * 20}px` }}
              >
                {header.month}
              </div>
            ))}
          </div>

          {/* Combined heatmap squares and week numbers row */}
          <div className="flex justify-between">
            {heatmapData.map((data) => (
              <div key={data.week} className="flex flex-col items-center gap-1 flex-1 max-w-[20px]">
                <div
                  className={`w-3 h-3 rounded-none border transition-all duration-200 hover:scale-125 hover:z-10 relative cursor-pointer ${data.color} mx-auto`}
                  title={`Week ${data.weekOfYear} (${data.dateRange}): ${data.tripCount} ${data.tripCount === 1 ? 'trip' : 'trips'}`}
                  style={{ borderRadius: '2px' }}
                />
                <div
                  className="w-3 h-3 text-[8px] text-gray-400 dark:text-gray-500 flex items-center justify-center mx-auto"
                  title={`Week ${data.weekOfYear}: ${data.dateRange}`}
                >
                  {data.week % 4 === 1 ? data.week : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}