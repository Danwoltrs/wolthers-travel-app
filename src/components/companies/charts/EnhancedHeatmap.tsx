'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([2021, 2022, 2023, 2024, 2025]))
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
    
    // If section is not 'wolthers', show empty state (but allow wolthers with any amount of data)
    if (selectedSection !== 'wolthers') {
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

    // Auto-expand years that have data
    const yearsWithData = Array.from(yearlyData.keys())
    const autoExpandedYears = new Set([...expandedYears, ...yearsWithData])
    
    setHeatmapData({
      yearlyData,
      currentYear: new Date().getFullYear(),
      type: selectedSection,
      expandedYears: autoExpandedYears
    })
    
    // Update the expanded years state to include years with data
    setExpandedYears(autoExpandedYears)

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
            marginRight: '1px',
            marginBottom: '1px'
          }}
        >
          {showWeekNumber ? week : ''}
        </div>
      )
    }
    return weekNumbers
  }

  const renderWeeklyMonthHeaders = () => {
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
            marginRight: '1px',
            marginBottom: '1px'
          }}
        >
          {isFirstWeekOfMonth ? months[monthIndex] : ''}
        </div>
      )
    }
    return monthHeaders
  }

  const renderBiannualHeaders = () => {
    // 24 periods - show months at appropriate positions
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const headers = []
    
    for (let period = 1; period <= 24; period++) {
      // Show month at beginning of each month (every ~2 periods)
      const monthIndex = Math.floor((period - 1) / 2)
      const isMonthStart = period % 2 === 1 && monthIndex < 12
      
      headers.push(
        <div
          key={period}
          className="text-xs text-gray-500 dark:text-gray-400 text-center flex-shrink-0"
          style={{ width: '16px', marginRight: '2px' }}
        >
          {isMonthStart ? months[monthIndex] : ''}
        </div>
      )
    }
    return headers
  }

  const renderMonthlyHeaders = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months.map((month, index) => (
      <div
        key={month}
        className="text-xs text-gray-500 dark:text-gray-400 text-center flex-shrink-0"
        style={{ width: '16px', marginRight: '2px' }}
      >
        {month}
      </div>
    ))
  }

  const renderHeatmapSquares = (entityData: EntityData, sizing: typeof fixedSizing) => {
    const { mode, squareSize, gap, verticalGap } = sizing
    
    if (mode === 'weekly') {
      // 52 weekly squares for large screens
      const weekSquares = []
      
      for (let week = 1; week <= 52; week++) {
        const weekData = entityData.weeks.get(week)
        const level = weekData?.level || 0
        const count = weekData?.count || 0

        weekSquares.push(
          <div
            key={week}
            className={`${getIntensityColor(level)} hover:ring-1 hover:ring-emerald-500 cursor-pointer transition-all flex-shrink-0`}
            style={{ 
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              minWidth: `${squareSize}px`,
              minHeight: `${squareSize}px`,
              maxWidth: `${squareSize}px`,
              maxHeight: `${squareSize}px`,
              borderRadius: '2px',
              marginRight: `${gap}px`,
              marginBottom: `${verticalGap}px`,
              aspectRatio: '1'
            }}
            title={`Week ${week}: ${count} trip${count !== 1 ? 's' : ''}`}
          />
        )
      }
      
      return <div className="flex">{weekSquares}</div>
    }
    
    if (mode === 'biannual') {
      // 24 squares - 2 weeks per square (H1 and H2 of year)
      const biannualSquares = []
      
      for (let period = 1; period <= 24; period++) {
        // Each period represents ~2.17 weeks
        const startWeek = Math.floor((period - 1) * 2.17) + 1
        const endWeek = Math.min(Math.floor(period * 2.17), 52)
        
        let totalCount = 0
        for (let week = startWeek; week <= endWeek; week++) {
          const weekData = entityData.weeks.get(week)
          if (weekData) totalCount += weekData.count
        }
        
        const level = Math.min(Math.floor(totalCount / 2), 4)
        
        biannualSquares.push(
          <div
            key={period}
            className={`${getIntensityColor(level)} hover:ring-1 hover:ring-emerald-500 cursor-pointer transition-all flex-shrink-0`}
            style={{ 
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              borderRadius: '2px',
              marginRight: `${gap}px`,
              marginBottom: `${verticalGap}px`,
              minWidth: `${squareSize}px`,
              minHeight: `${squareSize}px`,
              maxWidth: `${squareSize}px`,
              maxHeight: `${squareSize}px`,
              aspectRatio: '1'
            }}
            title={`Period ${period} (weeks ${startWeek}-${endWeek}): ${totalCount} trip${totalCount !== 1 ? 's' : ''}`}
          />
        )
      }
      
      return <div className="flex">{biannualSquares}</div>
    }

    if (mode === 'monthly') {
      // 12 monthly squares
      const monthlySquares = []
      
      for (let month = 1; month <= 12; month++) {
        // Calculate weeks for this month (approximate)
        const startWeek = Math.floor((month - 1) * 4.33) + 1
        const endWeek = Math.min(Math.floor(month * 4.33), 52)
        
        let totalCount = 0
        for (let week = startWeek; week <= endWeek; week++) {
          const weekData = entityData.weeks.get(week)
          if (weekData) totalCount += weekData.count
        }
        
        const level = Math.min(Math.floor(totalCount / 3), 4)
        
        monthlySquares.push(
          <div
            key={month}
            className={`${getIntensityColor(level)} hover:ring-1 hover:ring-emerald-500 cursor-pointer transition-all flex-shrink-0`}
            style={{ 
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              borderRadius: '2px',
              marginRight: `${gap}px`,
              marginBottom: `${verticalGap}px`,
              minWidth: `${squareSize}px`,
              minHeight: `${squareSize}px`,
              maxWidth: `${squareSize}px`,
              maxHeight: `${squareSize}px`,
              aspectRatio: '1'
            }}
            title={`Month ${month}: ${totalCount} trip${totalCount !== 1 ? 's' : ''}`}
          />
        )
      }
      
      return <div className="flex">{monthlySquares}</div>
    }

    return null
  }

  // Fixed sizing calculation - always weekly view with 10x10px squares
  const getFixedSizing = (containerRef?: React.RefObject<HTMLDivElement>) => {
    // Fixed sizing for consistent 10x10px squares with 1px gaps
    const squareSize = 10
    const gap = 1
    const verticalGap = 1
    
    // Calculate exact space needed for 52 weeks
    const weeklyWidth = 52 * squareSize + 51 * gap  // 52 squares = 571px
    
    if (typeof window !== 'undefined' && containerRef?.current) {
      const containerWidth = containerRef.current.offsetWidth
      
      // Optimize name column width to fit in 720px container
      // Container - squares - padding = available for names
      const availableForNames = containerWidth - weeklyWidth - 20 // 20px for padding
      const nameColumnWidth = Math.max(100, Math.min(150, availableForNames))
      
      console.log(`🔍 Container: ${containerWidth}px, Weekly needs: ${weeklyWidth}px, Names: ${nameColumnWidth}px`)
      
      return { 
        mode: 'weekly' as const, // Always weekly mode
        squareSize,
        gap,
        nameColumnWidth,
        verticalGap
      }
    }
    
    // Default fallback
    return { mode: 'weekly' as const, squareSize: 10, gap: 1, nameColumnWidth: 130, verticalGap: 1 }
  }

  const [fixedSizing, setFixedSizing] = useState({ mode: 'weekly' as const, squareSize: 10, gap: 1, nameColumnWidth: 130, verticalGap: 1 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      const newSizing = getFixedSizing(containerRef)
      setFixedSizing(newSizing)
    }
    
    // Use ResizeObserver for better container size detection
    const resizeObserver = new ResizeObserver((entries) => {
      handleResize()
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    // Also listen to window resize as primary trigger
    window.addEventListener('resize', handleResize)
    
    // Set initial value immediately
    handleResize()
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
    }
  }, []) // No dependencies to prevent loops

  // Also update when heatmap data changes (affects layout)
  useEffect(() => {
    if (heatmapData && containerRef.current) {
      const timer = setTimeout(() => {
        const newSizing = getFixedSizing(containerRef)
        setFixedSizing(newSizing)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [heatmapData])

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
    <div 
      ref={containerRef}
      className={`w-full bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 lg:p-6 ${className}`}
      style={{ 
        maxWidth: '100%',
        overflow: 'hidden',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-golden-400 mb-6">
        {sectionTitles[selectedSection]}
      </h2>
      
      {/* Container with constrained width to prevent overflow */}
      <div className="w-full overflow-hidden" style={{ maxWidth: '100%' }}>
        <div style={{ minWidth: 'fit-content', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: `${fixedSizing.verticalGap}px` }}>
          {/* Headers for different view modes */}
          <div className="flex items-center gap-2" style={{ marginBottom: '2px' }}>
            <div className="text-xs text-gray-500 dark:text-gray-400" style={{ width: `${fixedSizing.nameColumnWidth}px`, flexShrink: 0 }}>Month</div>
            <div className="flex overflow-hidden">
              {fixedSizing.mode === 'weekly' && renderWeeklyMonthHeaders()}
              {fixedSizing.mode === 'biannual' && renderBiannualHeaders()}
              {fixedSizing.mode === 'monthly' && renderMonthlyHeaders()}
            </div>
          </div>

        {/* Years List */}
        {Array.from(heatmapData.yearlyData.keys())
          .sort((a, b) => b - a) // Show newest years first
          .filter(year => heatmapData.yearlyData.get(year)?.totalTrips >= 0) // Show all years with data (including 0 trips)
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
                    className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    style={{ width: `${fixedSizing.nameColumnWidth}px`, flexShrink: 0 }}
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <span>{year}</span>
                    <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400">
                      ({yearData.totalTrips})
                    </span>
                  </button>
                  <div className="flex overflow-hidden">
                    {renderHeatmapSquares(yearEntityData, fixedSizing)}
                  </div>
                </div>
                
                {/* Individual Entity Rows - Show when expanded */}
                {isExpanded && (
                  <div className="space-y-px">
                    {Array.from(yearData.entities.entries()).map(([entityName, entityData]) => (
                      <div key={entityName} className="flex items-center gap-2" style={{ height: '10px', paddingLeft: '32px' }}>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center" style={{ width: `${fixedSizing.nameColumnWidth - 32}px`, flexShrink: 0 }}>
                          <span className="truncate">{entityName}</span>
                          <span className="ml-auto text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0">
                            ({entityData.totalTrips})
                          </span>
                        </div>
                        <div className="flex overflow-hidden">
                          {renderHeatmapSquares(entityData, fixedSizing)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Week Numbers - show for weekly and biannual views */}
          {fixedSizing.mode === 'weekly' && (
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-gray-500 dark:text-gray-400" style={{ width: `${fixedSizing.nameColumnWidth}px`, flexShrink: 0 }}>Week</div>
              <div className="flex overflow-hidden">
                {renderWeekNumbers()}
              </div>
            </div>
          )}
          
          {fixedSizing.mode === 'biannual' && (
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-gray-500 dark:text-gray-400" style={{ width: `${fixedSizing.nameColumnWidth}px`, flexShrink: 0 }}>Week</div>
              <div className="flex overflow-hidden">
                {Array.from({length: 24}, (_, i) => {
                  const period = i + 1
                  const startWeek = Math.floor((period - 1) * 2.17) + 1
                  const showWeek = period === 1 || period % 4 === 0
                  return (
                    <div
                      key={period}
                      className="text-[10px] text-gray-500 dark:text-gray-400 text-center flex-shrink-0"
                      style={{ width: '16px', marginRight: '2px' }}
                    >
                      {showWeek ? startWeek : ''}
                    </div>
                  )
                })}
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