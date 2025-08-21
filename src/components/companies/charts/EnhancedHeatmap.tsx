'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import useSWR from 'swr'

interface WeekData {
  count: number
  level: number
}

interface EntityData {
  name: string
  weeks: Map<number, WeekData>
  totalTrips: number
}

interface YearData {
  entities: Map<string, EntityData>
  totalTrips: number
  busiestWeekCount: number
}

interface HeatmapData {
  yearlyData: Map<number, YearData>
  currentYear: number
  type: string
  expandedYears: Set<number>
}

interface EnhancedHeatmapProps {
  selectedSection: 'wolthers' | 'importers' | 'exporters'
  className?: string
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function EnhancedHeatmap({ selectedSection, className = '' }: EnhancedHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2025]))
  const [currentWeek, setCurrentWeek] = useState<number>(0)

  const sectionTitles = {
    wolthers: 'Wolthers Staff Travel Activity',
    importers: 'Importer/Roaster Activity',
    exporters: 'Exporter/Producer/Coop Activity'
  }

  // Fetch real travel data
  const { data: travelData, error, isLoading } = useSWR(
    '/api/charts/travel-data',
    fetcher
  )

  // Calculate current week
  useEffect(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const weekNumber = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
    setCurrentWeek(weekNumber)
  }, [])

  // Process real travel data for heatmap
  useEffect(() => {
    if (!travelData?.heatmapData) {
      setHeatmapData(null)
      return
    }

    const { heatmapData: rawData } = travelData
    
    // If no data or section is not 'wolthers', show empty state
    if (rawData.totalTrips === 0 || selectedSection !== 'wolthers') {
      setHeatmapData({
        yearlyData: new Map(),
        currentYear: new Date().getFullYear(),
        type: selectedSection,
        expandedYears
      })
      return
    }

    // Convert the raw data back to Maps for consistency with existing code
    const yearlyData = new Map<number, YearData>()
    
    Object.entries(rawData.yearlyData).forEach(([yearStr, yearData]: [string, any]) => {
      const year = parseInt(yearStr)
      const entities = new Map<string, EntityData>()
      
      Object.entries(yearData.entities).forEach(([entityName, entityData]: [string, any]) => {
        const weeks = new Map<number, WeekData>()
        
        Object.entries(entityData.weeks).forEach(([weekStr, weekData]: [string, any]) => {
          weeks.set(parseInt(weekStr), {
            count: weekData.count,
            level: weekData.level
          })
        })
        
        entities.set(entityName, {
          name: entityData.name,
          weeks,
          totalTrips: entityData.totalTrips
        })
      })
      
      yearlyData.set(year, {
        entities,
        totalTrips: yearData.totalTrips,
        busiestWeekCount: yearData.busiestWeekCount
      })
    })

    setHeatmapData({
      yearlyData,
      currentYear: new Date().getFullYear(),
      type: selectedSection,
      expandedYears
    })

  }, [travelData, selectedSection, expandedYears])

  const toggleYear = (year: number) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev)
      if (newSet.has(year)) {
        newSet.delete(year)
      } else {
        newSet.add(year)
      }
      return newSet
    })
  }

  const getIntensityColor = (level: number): string => {
    const colors = [
      'bg-gray-100 dark:bg-gray-800', // 0 trips
      'bg-yellow-200 dark:bg-emerald-900/60', // 1 trip - light yellow for light mode
      'bg-orange-300 dark:bg-emerald-800', // 2 trips - light orange for light mode
      'bg-orange-500 dark:bg-emerald-700', // 3 trips - medium orange for light mode
      'bg-orange-700 dark:bg-emerald-600' // 4+ trips - dark orange for light mode
    ]
    return colors[Math.min(level, 4)]
  }

  const renderWeekNumbers = () => {
    const weekNumbers = []
    for (let week = 1; week <= 52; week++) {
      const isCurrentWeek = week === currentWeek
      const isRegularInterval = week === 1 || week % 5 === 0
      const isTooCloseToCurrentWeek = Math.abs(week - currentWeek) <= 2 && week !== currentWeek
      
      // Show regular intervals unless they're too close to current week, or always show current week
      const showWeekNumber = (isRegularInterval && !isTooCloseToCurrentWeek) || isCurrentWeek
      
      weekNumbers.push(
        <div
          key={week}
          className={`text-[10px] w-2.5 text-center flex-shrink-0 ${
            isCurrentWeek 
              ? 'text-green-600 dark:text-green-400 font-bold' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
          style={{ 
            borderRadius: '2px',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        >
          {showWeekNumber ? week : ''}
        </div>
      )
    }
    return weekNumbers
  }

  const renderMonthHeaders = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthHeaders = []
    
    // Create a header for each week position, showing month name only at the start of each month
    for (let week = 1; week <= 52; week++) {
      const date = new Date(2025, 0, 1) // Start of 2025
      date.setDate(date.getDate() + (week - 1) * 7) // Add weeks
      const monthIndex = date.getMonth()
      const isFirstWeekOfMonth = week === 1 || (week > 1 && new Date(2025, 0, 1 + (week - 2) * 7).getMonth() !== monthIndex)
      
      monthHeaders.push(
        <div
          key={week}
          className="text-xs text-gray-500 dark:text-gray-400 text-left w-2.5 flex-shrink-0"
          style={{ 
            borderRadius: '2px',
            marginRight: '2px',
            marginBottom: '2px'
          }}
        >
          {isFirstWeekOfMonth ? months[monthIndex] : ''}
        </div>
      )
    }
    return monthHeaders
  }

  const renderQuarters = () => {
    return ['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => (
      <div
        key={quarter}
        className="text-xs text-gray-500 dark:text-gray-400 text-center flex-1"
      >
        {quarter}
      </div>
    ))
  }

  const renderHeatmapSquares = (entityData: EntityData, viewMode: 'weeks' | 'months' | 'quarters') => {
    if (viewMode === 'weeks') {
      // Create a single row of 52 weeks for each person
      const weekSquares = []
      
      for (let week = 1; week <= 52; week++) {
        const weekData = entityData.weeks.get(week)
        const level = weekData?.level || 0
        const count = weekData?.count || 0
        const isCurrentWeek = week === currentWeek

        weekSquares.push(
          <div
            key={week}
            className={`w-2.5 h-2.5 ${getIntensityColor(level)} hover:ring-1 hover:ring-emerald-500 cursor-pointer transition-all`}
            style={{ 
              borderRadius: '2px',
              marginRight: '2px',
              marginBottom: '2px'
            }}
            title={`Week ${week}: ${count} trip${count !== 1 ? 's' : ''}`}
          />
        )
      }
      
      return <div className="flex">{weekSquares}</div>
    }
    
    if (viewMode === 'months') {
      const monthlyData = new Map<number, number>()
      // Aggregate weekly data into months
      for (let week = 1; week <= 52; week++) {
        const month = Math.floor((week - 1) / 4.33) // Approximate weeks per month
        const weekData = entityData.weeks.get(week)
        if (weekData) {
          monthlyData.set(month, (monthlyData.get(month) || 0) + weekData.count)
        }
      }

      const squares = []
      for (let month = 0; month < 12; month++) {
        const count = monthlyData.get(month) || 0
        const level = Math.min(Math.floor(count / 2), 4)
        
        squares.push(
          <div
            key={month}
            className={`w-6 h-6 ${getIntensityColor(level)} hover:ring-1 hover:ring-emerald-500 cursor-pointer transition-all`}
            style={{ 
              borderRadius: '2px',
              margin: '1px'
            }}
            title={`Month ${month + 1}: ${count} trip${count !== 1 ? 's' : ''}`}
          />
        )
      }
      return <div className="flex gap-px">{squares}</div>
    }

    if (viewMode === 'quarters') {
      const quarterlyData = [0, 0, 0, 0]
      // Aggregate weekly data into quarters
      for (let week = 1; week <= 52; week++) {
        const quarter = Math.floor((week - 1) / 13) // 13 weeks per quarter
        const weekData = entityData.weeks.get(week)
        if (weekData) {
          quarterlyData[quarter] += weekData.count
        }
      }

      const squares = []
      quarterlyData.forEach((count, quarter) => {
        const level = Math.min(Math.floor(count / 4), 4)
        
        squares.push(
          <div
            key={quarter}
            className={`w-8 h-8 ${getIntensityColor(level)} hover:ring-1 hover:ring-emerald-500 cursor-pointer transition-all flex-1`}
            style={{ 
              borderRadius: '2px',
              margin: '1px'
            }}
            title={`Q${quarter + 1}: ${count} trip${count !== 1 ? 's' : ''}`}
          />
        )
      })
      return <div className="flex gap-px">{squares}</div>
    }

    return null
  }

  // Responsive breakpoints
  const getViewMode = (): 'weeks' | 'months' | 'quarters' => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width < 768) return 'quarters' // mobile
      if (width < 1024) return 'months' // tablet
      return 'weeks' // desktop
    }
    return 'weeks'
  }

  const [viewMode, setViewMode] = useState<'weeks' | 'months' | 'quarters'>('weeks')

  useEffect(() => {
    const handleResize = () => setViewMode(getViewMode())
    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">Error loading heatmap data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {error.message || 'Failed to fetch travel data'}
          </p>
        </div>
      </div>
    )
  }

  if (!heatmapData || (heatmapData.yearlyData.size === 0 && selectedSection !== 'wolthers')) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-golden-400 mb-6">
          {sectionTitles[selectedSection]}
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No travel data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {selectedSection === 'wolthers' 
              ? 'Travel activity will appear here as trips are created'
              : `${sectionTitles[selectedSection]} data will be available in the future`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`inline-block bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-golden-400 mb-6">
        {sectionTitles[selectedSection]}
      </h2>
      
      {/* Container with fixed width to match chart content */}
      <div className="inline-block">
        <div className="space-y-0.5">
          {/* Single Month Header at Top */}
          <div className="flex items-center gap-2" style={{ marginBottom: '2px' }}>
            <div className="w-48 text-xs text-gray-500 dark:text-gray-400">Month</div>
            <div className="flex">
              {viewMode === 'weeks' && renderMonthHeaders()}
              {viewMode === 'months' && renderMonthHeaders()}
              {viewMode === 'quarters' && renderQuarters()}
            </div>
          </div>

        {/* Years List */}
        {Array.from(heatmapData.yearlyData.keys())
          .sort((a, b) => a - b)
          .filter(year => heatmapData.yearlyData.get(year)?.totalTrips > 0)
          .map((year, index, array) => {
            const yearData = heatmapData.yearlyData.get(year)
            if (!yearData) return null
            
            const isExpanded = expandedYears.has(year)
            const isCurrentYear = year === 2025
            
            // Calculate year-level activity for the year row
            const yearWeeklyData = new Map<number, number>()
            Array.from(yearData.entities.values()).forEach(entity => {
              entity.weeks.forEach((weekData, week) => {
                yearWeeklyData.set(week, (yearWeeklyData.get(week) || 0) + weekData.count)
              })
            })
            
            const yearEntityData: EntityData = {
              name: year.toString(),
              weeks: new Map(Array.from(yearWeeklyData.entries()).map(([week, count]) => [
                week, 
                { count, level: Math.min(count, 4) }
              ])),
              totalTrips: yearData.totalTrips
            }
            
            const isLastYear = index === array.length - 1
            
            return (
              <div key={year} className="space-y-px">
                {/* Year Header with Heatmap */}
                <div className="flex items-center gap-2" style={{ 
                  height: '10px',
                  marginBottom: isLastYear ? '0' : '2px'
                }}>
                  <button
                    onClick={() => toggleYear(year)}
                    className="w-48 flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>{year}</span>
                    <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400">
                      ({yearData.totalTrips})
                    </span>
                  </button>
                  <div className="flex">
                    {renderHeatmapSquares(yearEntityData, viewMode)}
                  </div>
                </div>
                
                {/* Individual Entity Rows - Show when expanded */}
                {isExpanded && (
                  <div className="space-y-px">
                    {Array.from(yearData.entities.entries()).map(([entityName, entityData]) => (
                      <div key={entityName} className="flex items-center gap-2" style={{ height: '10px', paddingLeft: '32px' }}>
                        <div className="w-40 text-xs text-gray-600 dark:text-gray-400 flex items-center">
                          <span className="truncate">{entityName}</span>
                          <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                            ({entityData.totalTrips})
                          </span>
                        </div>
                        <div className="flex">
                          {renderHeatmapSquares(entityData, viewMode)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Week Numbers - only show for desktop view */}
          {viewMode === 'weeks' && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-48 text-xs text-gray-500 dark:text-gray-400">Week</div>
              <div className="flex">
                {renderWeekNumbers()}
              </div>
            </div>
          )}
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span>Less</span>
            <div className="flex gap-px">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-2.5 h-2.5 ${getIntensityColor(level)}`}
                  style={{ 
                    borderRadius: '2px',
                    margin: '1px'
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}