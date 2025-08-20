'use client'

import { useState, useEffect, useRef } from 'react'
import { TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, Calendar, Target } from 'lucide-react'

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut'
export type ChartMetric = 'trips' | 'cost' | 'meetings' | 'locations' | 'staff'

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  percentage?: number
  trend?: number // percentage change from previous period
}

export interface StatisticsChartProps {
  title: string
  subtitle?: string
  data: ChartDataPoint[]
  type: ChartType
  metric: ChartMetric
  height?: number
  showTrend?: boolean
  showLegend?: boolean
  className?: string
}

// Color palette following the design system
const COLORS = {
  primary: '#059669', // emerald-600
  secondary: '#F59E0B', // amber-500
  tertiary: '#7C3AED', // violet-600
  quaternary: '#EF4444', // red-500
  quinary: '#3B82F6', // blue-500
  senary: '#F97316', // orange-500
}

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.tertiary,
  COLORS.quaternary,
  COLORS.quinary,
  COLORS.senary,
]

export default function StatisticsChart({
  title,
  subtitle,
  data,
  type,
  metric,
  height = 300,
  showTrend = true,
  showLegend = true,
  className = ''
}: StatisticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Calculate chart metrics
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)
  const avgValue = totalValue / Math.max(data.length, 1)
  
  // Calculate overall trend
  const overallTrend = data.length >= 2 
    ? ((data[data.length - 1].value - data[0].value) / Math.max(data[0].value, 1)) * 100
    : 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size for crisp rendering
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Chart dimensions with padding
    const padding = 40
    const chartWidth = rect.width - padding * 2
    const chartHeight = rect.height - padding * 2

    // Draw based on chart type
    switch (type) {
      case 'line':
        drawLineChart(ctx, chartWidth, chartHeight, padding)
        break
      case 'bar':
        drawBarChart(ctx, chartWidth, chartHeight, padding)
        break
      case 'area':
        drawAreaChart(ctx, chartWidth, chartHeight, padding)
        break
      case 'pie':
      case 'donut':
        drawPieChart(ctx, chartWidth, chartHeight, padding, type === 'donut')
        break
    }
  }, [data, type, maxValue, hoveredIndex])

  const drawLineChart = (ctx: CanvasRenderingContext2D, width: number, height: number, padding: number) => {
    if (data.length === 0) return

    const stepX = width / Math.max(data.length - 1, 1)
    
    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + width, y)
      ctx.stroke()
    }

    // Draw line
    ctx.strokeStyle = COLORS.primary
    ctx.lineWidth = 3
    ctx.beginPath()
    data.forEach((point, index) => {
      const x = padding + stepX * index
      const y = padding + height - (point.value / maxValue) * height
      if (index === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Draw points
    data.forEach((point, index) => {
      const x = padding + stepX * index
      const y = padding + height - (point.value / maxValue) * height
      
      ctx.beginPath()
      ctx.arc(x, y, hoveredIndex === index ? 6 : 4, 0, Math.PI * 2)
      ctx.fillStyle = hoveredIndex === index ? COLORS.secondary : COLORS.primary
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }

  const drawBarChart = (ctx: CanvasRenderingContext2D, width: number, height: number, padding: number) => {
    if (data.length === 0) return

    const barWidth = width / data.length * 0.8
    const barSpacing = width / data.length * 0.2

    data.forEach((point, index) => {
      const x = padding + (width / data.length) * index + barSpacing / 2
      const barHeight = (point.value / maxValue) * height
      const y = padding + height - barHeight

      ctx.fillStyle = hoveredIndex === index 
        ? COLORS.secondary 
        : point.color || CHART_COLORS[index % CHART_COLORS.length]
      ctx.fillRect(x, y, barWidth, barHeight)

      // Add subtle shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(x + 2, y + 2, barWidth, barHeight)
    })
  }

  const drawAreaChart = (ctx: CanvasRenderingContext2D, width: number, height: number, padding: number) => {
    if (data.length === 0) return

    const stepX = width / Math.max(data.length - 1, 1)

    // Create gradient
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + height)
    gradient.addColorStop(0, `${COLORS.primary}40`)
    gradient.addColorStop(1, `${COLORS.primary}10`)

    // Draw area
    ctx.beginPath()
    ctx.moveTo(padding, padding + height)
    data.forEach((point, index) => {
      const x = padding + stepX * index
      const y = padding + height - (point.value / maxValue) * height
      ctx.lineTo(x, y)
    })
    ctx.lineTo(padding + width, padding + height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line on top
    drawLineChart(ctx, width, height, padding)
  }

  const drawPieChart = (ctx: CanvasRenderingContext2D, width: number, height: number, padding: number, isDonut: boolean) => {
    if (data.length === 0 || totalValue === 0) return

    const centerX = padding + width / 2
    const centerY = padding + height / 2
    const radius = Math.min(width, height) / 2 - 20
    const innerRadius = isDonut ? radius * 0.6 : 0

    let currentAngle = -Math.PI / 2 // Start at top

    data.forEach((point, index) => {
      const sliceAngle = (point.value / totalValue) * Math.PI * 2
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      if (isDonut) {
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
      } else {
        ctx.lineTo(centerX, centerY)
      }
      ctx.closePath()

      ctx.fillStyle = hoveredIndex === index 
        ? COLORS.secondary 
        : point.color || CHART_COLORS[index % CHART_COLORS.length]
      ctx.fill()

      currentAngle += sliceAngle
    })

    // Draw center text for donut charts
    if (isDonut) {
      ctx.fillStyle = '#374151'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(totalValue.toString(), centerX, centerY - 10)
      
      ctx.font = '14px sans-serif'
      ctx.fillStyle = '#6B7280'
      ctx.fillText('Total', centerX, centerY + 15)
    }
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Simple hit detection for bars and pie slices
    if (type === 'bar') {
      const barWidth = rect.width / data.length * 0.8
      const barIndex = Math.floor((x - 40) / (rect.width / data.length))
      setHoveredIndex(barIndex >= 0 && barIndex < data.length ? barIndex : null)
    } else if (type === 'pie' || type === 'donut') {
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
      const radius = Math.min(rect.width, rect.height) / 2 - 20
      
      if (distance <= radius) {
        const angle = Math.atan2(y - centerY, x - centerX) + Math.PI / 2
        const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle
        let currentAngle = 0
        
        for (let i = 0; i < data.length; i++) {
          const sliceAngle = (data[i].value / totalValue) * Math.PI * 2
          if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
            setHoveredIndex(i)
            return
          }
          currentAngle += sliceAngle
        }
      }
      setHoveredIndex(null)
    } else {
      // Line and area charts
      const stepX = (rect.width - 80) / Math.max(data.length - 1, 1)
      const pointIndex = Math.round((x - 40) / stepX)
      setHoveredIndex(pointIndex >= 0 && pointIndex < data.length ? pointIndex : null)
    }
  }

  const formatValue = (value: number): string => {
    switch (metric) {
      case 'cost':
        return `$${value.toLocaleString()}`
      case 'trips':
      case 'meetings':
      case 'locations':
      case 'staff':
        return value.toLocaleString()
      default:
        return value.toString()
    }
  }

  const getMetricIcon = () => {
    switch (metric) {
      case 'trips': return Calendar
      case 'cost': return Target
      case 'meetings': return BarChart3
      case 'locations': return Target
      case 'staff': return Target
      default: return BarChart3
    }
  }

  const MetricIcon = getMetricIcon()

  return (
    <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <MetricIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {showTrend && (
          <div className="flex items-center gap-2">
            {overallTrend > 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : overallTrend < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : null}
            <span className={`text-sm font-medium ${
              overallTrend > 0 ? 'text-emerald-600' : 
              overallTrend < 0 ? 'text-red-600' : 
              'text-gray-500'
            }`}>
              {overallTrend > 0 ? '+' : ''}{overallTrend.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          height={height}
          className="w-full cursor-pointer"
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{ height: `${height}px` }}
        />
        
        {/* Tooltip */}
        {hoveredIndex !== null && hoveredIndex < data.length && (
          <div className="absolute top-4 right-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg text-sm z-10">
            <div className="font-medium">{data[hoveredIndex].label}</div>
            <div className="text-xs opacity-75">
              {formatValue(data[hoveredIndex].value)}
              {data[hoveredIndex].percentage && ` (${data[hoveredIndex].percentage.toFixed(1)}%)`}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (type === 'pie' || type === 'donut') && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: point.color || CHART_COLORS[index % CHART_COLORS.length] }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {point.label}
              </span>
              <span className="text-xs font-medium text-gray-900 dark:text-gray-100 ml-auto">
                {formatValue(point.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-pearl-200 dark:border-[#2a2a2a]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatValue(totalValue)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatValue(Math.round(avgValue))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatValue(maxValue)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Peak</div>
          </div>
        </div>
      </div>
    </div>
  )
}