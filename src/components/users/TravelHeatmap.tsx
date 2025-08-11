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

interface YearData {
  year: number
  tripCount: number
  weeklyData: HeatmapData[]
  maxTripsPerWeek: number
}

export default function TravelHeatmap({ userId, year = 2025 }: TravelHeatmapProps) {
  const [yearlyHeatmapData, setYearlyHeatmapData] = useState<YearData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [globalMaxTripCount, setGlobalMaxTripCount] = useState(0)
  const [hasAnyTrips, setHasAnyTrips] = useState(false)

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
      // Get auth token from localStorage (Microsoft OAuth or Supabase session)
      const authToken = localStorage.getItem('auth-token')
      
      console.log('TravelHeatmap: Fetching travel data via authenticated API...', {
        hasAuthToken: !!authToken,
        tokenType: authToken ? (authToken.includes('eyJ') ? 'JWT' : 'Supabase') : 'none',
        endpoint: '/api/user/stats'
      })
      
      // Prepare request headers - always include credentials for httpOnly cookies
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      // Add Authorization header if token is available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const response = await fetch('/api/user/stats', {
        method: 'GET',
        headers,
        credentials: 'include' // Always include cookies for Microsoft OAuth sessions
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }))
        console.error('TravelHeatmap: API error:', {
          status: response.status,
          error: errorData,
          hasAuthToken: !!authToken,
          endpoint: '/api/user/stats'
        })
        
        if (response.status === 401) {
          console.log('TravelHeatmap: Authentication failed - user may need to re-authenticate')
        }
        
        // Set empty state for error cases
        setHasAnyTrips(false)
        setYearlyHeatmapData([])
        setIsLoading(false)
        return
      }

      const stats = await response.json()
      console.log('TravelHeatmap: Received travel statistics:', stats)

      const yearlyData = stats.yearlyData || {}
      const yearsWithTrips = stats.yearsWithTrips || []
      const globalMaxTrips = stats.globalMaxTrips || 0
      const hasTrips = stats.hasAnyTrips || false

      setGlobalMaxTripCount(globalMaxTrips)
      setHasAnyTrips(hasTrips)

      // Create heatmap data for each year with trips
      const yearlyHeatmapArray: YearData[] = yearsWithTrips.map((yearNum: number) => {
        const yearData = yearlyData[yearNum]
        const weeklyData = yearData?.weeklyData || {}
        const yearTripCount = yearData?.tripCount || 0
        const yearMaxTrips = yearData?.maxTripsPerWeek || 0

        // Create heatmap data for all 52 weeks of this year
        const heatmapArray: HeatmapData[] = []
        for (let week = 1; week <= 52; week++) {
          const tripCount = weeklyData[week] || 0
          const sampleDate = new Date(yearNum, 0, 1)
          sampleDate.setDate(sampleDate.getDate() + (week - 1) * 7)
          const monthIndex = sampleDate.getMonth()
          
          heatmapArray.push({
            week,
            month: months[monthIndex],
            monthIndex,
            tripCount,
            color: getIntensityColor(tripCount, globalMaxTrips), // Use global max for consistent coloring
            weekOfYear: week,
            dateRange: getDateRangeForWeek(yearNum, week)
          })
        }

        return {
          year: yearNum,
          tripCount: yearTripCount,
          weeklyData: heatmapArray,
          maxTripsPerWeek: yearMaxTrips
        }
      })

      setYearlyHeatmapData(yearlyHeatmapArray)
    } catch (error) {
      console.error('TravelHeatmap: Error fetching travel data:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        userId
      })
      // Set empty state for error cases
      setHasAnyTrips(false)
      setYearlyHeatmapData([])
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
          Travel Activity
        </h4>
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  // Don't render heatmap if user has no trips
  if (!hasAnyTrips || yearlyHeatmapData.length === 0) {
    return null
  }

  // Helper function to generate month headers for any year
  const generateMonthHeaders = (heatmapData: HeatmapData[]) => {
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

    return monthHeaders
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-amber-300 uppercase tracking-wider">
          Travel Activity
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {yearlyHeatmapData.reduce((sum, yearData) => sum + yearData.tripCount, 0)} total trips
          {globalMaxTripCount > 0 && ` • Busiest week: ${globalMaxTripCount} trips`}
        </div>
      </div>
      
      {/* Multi-year heatmap */}
      <div className="space-y-4">
        {yearlyHeatmapData.map((yearData, yearIndex) => {
          const monthHeaders = generateMonthHeaders(yearData.weeklyData)
          
          return (
            <div key={yearData.year} className="space-y-1">
              <div className="flex">
                {/* Left side labels */}
                <div className="flex flex-col justify-start space-y-1 mr-6 text-xs text-gray-500 dark:text-gray-400">
                  <div className="h-3 flex items-center">{yearIndex === 0 ? 'Month' : ''}</div>
                  <div className="h-3 flex items-center font-medium text-gray-700 dark:text-amber-400">
                    {yearData.year} ({yearData.tripCount})
                  </div>
                  <div className="h-3 flex items-center">{yearIndex === yearlyHeatmapData.length - 1 ? 'Week' : ''}</div>
                </div>

                {/* Heatmap grid */}
                <div className="space-y-1 flex-1">
                  {/* Month headers - only show for first year */}
                  {yearIndex === 0 && (
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
                  )}

                  {/* Heatmap squares */}
                  <div className="flex justify-between">
                    {yearData.weeklyData.map((data) => (
                      <div key={`${yearData.year}-${data.week}`} className="flex flex-col items-center gap-1 flex-1 max-w-[20px]">
                        <div
                          className={`w-3 h-3 rounded-none border transition-all duration-200 hover:scale-125 hover:z-50 relative cursor-pointer ${data.color} mx-auto`}
                          title={`${yearData.year} Week ${data.weekOfYear} (${data.dateRange}): ${data.tripCount} ${data.tripCount === 1 ? 'trip' : 'trips'}`}
                          style={{ borderRadius: '2px' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Week numbers - only show for last year */}
                  {yearIndex === yearlyHeatmapData.length - 1 && (
                    <div className="flex justify-between">
                      {yearData.weeklyData.map((data) => (
                        <div key={`week-${data.week}`} className="flex flex-col items-center gap-1 flex-1 max-w-[20px]">
                          <div
                            className="w-3 h-3 text-[8px] text-gray-400 dark:text-gray-500 flex items-center justify-center mx-auto"
                            title={`Week ${data.weekOfYear}: ${data.dateRange}`}
                          >
                            {data.week % 4 === 1 ? data.week : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}