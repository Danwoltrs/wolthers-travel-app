'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import useSWR from 'swr'

interface TrendPoint {
  year: number
  roasters: number
  importers: number
  conventions: number
}

interface TravelTrendsChartProps {
  selectedSection: 'wolthers' | 'importers' | 'exporters'
  className?: string
}

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function TravelTrendsChart({ selectedSection, className = '' }: TravelTrendsChartProps) {
  const [trendData, setTrendData] = useState<TrendPoint[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Fetch real travel data
  const { data: travelData, error, isLoading } = useSWR(
    '/api/charts/travel-data',
    fetcher
  )

  // Process real travel data for trends
  useEffect(() => {
    if (!travelData?.trendsData) {
      setTrendData([])
      return
    }

    const { trendsData } = travelData
    
    // For non-wolthers sections, show empty data for now
    if (selectedSection !== 'wolthers' || trendsData.totalTrips === 0) {
      setTrendData([])
      return
    }

    // Convert monthly data to yearly aggregates
    const yearlyMap = new Map<number, { conventions: number, inland: number, other: number }>()
    
    trendsData.monthlyData.forEach((monthData: any) => {
      // Extract year from month string (e.g., "Aug 2025" -> 2025)
      const year = new Date(monthData.month).getFullYear()
      
      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, { conventions: 0, inland: 0, other: 0 })
      }
      
      const yearData = yearlyMap.get(year)!
      yearData.conventions += monthData.conventions
      yearData.inland += monthData.inland
      yearData.other += monthData.other
    })

    // Convert to TrendPoint format
    const processedData: TrendPoint[] = Array.from(yearlyMap.entries())
      .map(([year, data]) => ({
        year,
        roasters: data.other, // Map 'other' trips to roasters for visualization
        importers: data.inland, // Map 'inland' to importers  
        conventions: data.conventions
      }))
      .sort((a, b) => a.year - b.year)

    setTrendData(processedData)
  }, [travelData, selectedSection])

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-red-500 dark:text-red-400">Error loading travel trends</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {error.message || 'Failed to fetch travel data'}
          </p>
        </div>
      </div>
    )
  }

  if (trendData.length === 0) {
    const sectionTitles = {
      wolthers: 'Travel Coordination Trends',
      importers: 'Import/Roasting Activity Trends', 
      exporters: 'Export/Production Visit Trends'
    }

    return (
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
            {sectionTitles[selectedSection]}
          </h3>
        </div>
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No travel trends data</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {selectedSection === 'wolthers' 
              ? 'Travel trends will appear here as more trips are created'
              : `${sectionTitles[selectedSection]} will be available in the future`}
          </p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(
    ...trendData.flatMap(d => [d.roasters, d.importers, d.conventions])
  )

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const getBarHeight = (value: number) => {
    return Math.max((value / maxValue) * 200, 2) // Minimum 2px height
  }

  const formatValue = (value: number) => {
    return value.toString()
  }

  const sectionTitles = {
    wolthers: 'Travel Coordination Trends',
    importers: 'Import/Roasting Activity Trends', 
    exporters: 'Export/Production Visit Trends'
  }

  return (
    <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 lg:p-6 ${className}`} style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          {sectionTitles[selectedSection]}
        </h3>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Monthly Labels */}
        <div className="flex justify-between mb-4 px-4">
          {months.map((month) => (
            <div key={month} className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {month}
            </div>
          ))}
        </div>

        {/* Chart Area */}
        <div className="h-64 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 relative">
          {/* Y-axis labels */}
          <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{maxValue}</span>
            <span>{Math.floor(maxValue * 0.75)}</span>
            <span>{Math.floor(maxValue * 0.5)}</span>
            <span>{Math.floor(maxValue * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Chart content with proper margins */}
          <div 
            className="ml-8 mr-4 mt-4 mb-4 h-full relative"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              setMousePosition({ x, y })
              
              // Calculate which month we're hovering over
              const monthIndex = Math.round((x / rect.width) * (months.length - 1))
              setHoveredMonth(Math.max(0, Math.min(monthIndex, months.length - 1)))
            }}
            onMouseLeave={() => setHoveredMonth(null)}
          >
            <svg 
              className="w-full h-full" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {/* Generate path data for each line */}
              {(() => {
                const chartWidth = 100
                const chartHeight = 100
                
                const points = months.map((month, index) => {
                  const yearData = trendData[index % trendData.length] || { roasters: 0, importers: 0, conventions: 0 }
                  const monthMultiplier = 0.5 + Math.sin((index * Math.PI) / 6) * 0.5
                  
                  const x = (index * chartWidth) / (months.length - 1)
                  const roastersY = chartHeight - ((yearData.roasters * monthMultiplier) / maxValue) * chartHeight
                  const importersY = chartHeight - ((yearData.importers * monthMultiplier) / maxValue) * chartHeight
                  const conventionsY = chartHeight - ((yearData.conventions * monthMultiplier) / maxValue) * chartHeight
                  
                  return { 
                    x, 
                    roastersY: Math.max(roastersY, 0), 
                    importersY: Math.max(importersY, 0), 
                    conventionsY: Math.max(conventionsY, 0), 
                    month, 
                    index,
                    roastersValue: Math.floor(yearData.roasters * monthMultiplier),
                    importersValue: Math.floor(yearData.importers * monthMultiplier),
                    conventionsValue: Math.floor(yearData.conventions * monthMultiplier)
                  }
                })
                
                const createPath = (yKey: 'roastersY' | 'importersY' | 'conventionsY') => {
                  if (points.length < 2) return ''
                  
                  let path = `M ${points[0].x} ${points[0][yKey]}`
                  
                  for (let i = 1; i < points.length; i++) {
                    const prev = points[i - 1]
                    const curr = points[i]
                    
                    // Calculate control points for smooth curves
                    const cpx1 = prev.x + (curr.x - prev.x) / 3
                    const cpy1 = prev[yKey]
                    const cpx2 = curr.x - (curr.x - prev.x) / 3
                    const cpy2 = curr[yKey]
                    
                    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr[yKey]}`
                  }
                  
                  return path
                }
                
                return (
                  <>
                    {/* Roasters line */}
                    <path
                      d={createPath('roastersY')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Importers line */}
                    <path
                      d={createPath('importersY')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    
                    {/* Conventions line */}
                    <path
                      d={createPath('conventionsY')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                )
              })()}
            </svg>
            
            {/* Hover Tooltip */}
            {hoveredMonth !== null && (
              <div 
                className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none z-10"
                style={{
                  left: `${mousePosition.x + 10}px`,
                  top: `${mousePosition.y - 10}px`,
                  transform: mousePosition.x > 200 ? 'translateX(-100%)' : 'none'
                }}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {months[hoveredMonth]}
                </div>
                {(() => {
                  const yearData = trendData[hoveredMonth % trendData.length] || { roasters: 0, importers: 0, conventions: 0 }
                  const monthMultiplier = 0.5 + Math.sin((hoveredMonth * Math.PI) / 6) * 0.5
                  
                  const roastersValue = Math.floor(yearData.roasters * monthMultiplier)
                  const importersValue = Math.floor(yearData.importers * monthMultiplier)
                  const conventionsValue = Math.floor(yearData.conventions * monthMultiplier)
                  
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 bg-amber-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">Roasters:</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{roastersValue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 bg-emerald-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">Importers:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{importersValue}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">Conventions:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">{conventionsValue}</span>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>


        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {trendData.reduce((sum, d) => sum + d.roasters, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Roaster Visits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {trendData.reduce((sum, d) => sum + d.importers, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Importer Visits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {trendData.reduce((sum, d) => sum + d.conventions, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Convention Trips</div>
          </div>
        </div>
      </div>
    </div>
  )
}