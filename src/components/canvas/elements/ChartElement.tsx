'use client'

import React, { useRef, useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { fabric } from 'fabric'
import { Edit2, Maximize2 } from 'lucide-react'

interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'area'
  title: string
  data: Array<{
    name: string
    value: number
    [key: string]: any
  }>
  colors?: string[]
  width?: number
  height?: number
}

interface ChartElementProps {
  chartData: ChartData
  onEdit?: (newData: ChartData) => void
  canvas?: fabric.Canvas | null
  isSelected?: boolean
}

const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function ChartElement({ chartData, onEdit, canvas, isSelected }: ChartElementProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showEditButton, setShowEditButton] = useState(false)
  
  const colors = chartData.colors || defaultColors
  const width = chartData.width || 300
  const height = chartData.height || 200

  // Create the visual chart component
  const renderChart = () => {
    switch (chartData.type) {
      case 'bar':
        return (
          <BarChart width={width} height={height} data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {chartData.data.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        )
      
      case 'line':
        return (
          <LineChart width={width} height={height} data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2, fill: '#ffffff' }}
            />
          </LineChart>
        )
      
      case 'pie':
        const RADIAN = Math.PI / 180
        const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
          const radius = innerRadius + (outerRadius - innerRadius) * 0.5
          const x = cx + radius * Math.cos(-midAngle * RADIAN)
          const y = cy + radius * Math.sin(-midAngle * RADIAN)

          return (
            <text 
              x={x} 
              y={y} 
              fill="white" 
              textAnchor={x > cx ? 'start' : 'end'} 
              dominantBaseline="central"
              fontSize={12}
              fontWeight="bold"
            >
              {`${(percent * 100).toFixed(0)}%`}
            </text>
          )
        }

        return (
          <PieChart width={width} height={height}>
            <Pie
              data={chartData.data}
              cx={width / 2}
              cy={height / 2}
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={Math.min(width, height) / 3}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.data.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        )
      
      case 'area':
        return (
          <AreaChart width={width} height={height} data={chartData.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        )
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Unsupported chart type: {chartData.type}
          </div>
        )
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-white border-2 rounded-lg shadow-sm ${
        isSelected ? 'border-blue-500' : 'border-gray-200'
      } transition-all duration-200 hover:shadow-md`}
      style={{ width: width + 20, height: height + 60 }}
      onMouseEnter={() => setShowEditButton(true)}
      onMouseLeave={() => setShowEditButton(false)}
    >
      {/* Chart Title */}
      <div className="px-3 py-2 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900 truncate">
          {chartData.title}
        </h4>
      </div>

      {/* Chart Content */}
      <div className="p-2">
        {renderChart()}
      </div>

      {/* Edit Button Overlay */}
      {showEditButton && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={() => onEdit && onEdit(chartData)}
            className="p-1.5 bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700 border border-gray-200 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
            title="Edit chart"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-700 border border-gray-200 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
            title="Expand chart"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Drag Handle */}
      <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full cursor-move flex items-center justify-center shadow-md">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>
    </div>
  )
}

// Factory function to create chart elements on canvas
export const createChartElement = (
  canvas: fabric.Canvas, 
  chartData: ChartData, 
  position: { x: number; y: number }
) => {
  // Create a container for the chart
  const chartContainer = document.createElement('div')
  chartContainer.style.width = `${(chartData.width || 300) + 20}px`
  chartContainer.style.height = `${(chartData.height || 200) + 60}px`
  
  // Render React chart component into the container
  const root = (window as any).ReactDOMClient?.createRoot(chartContainer)
  if (root) {
    root.render(React.createElement(ChartElement, { chartData }))
  }

  // Convert to canvas using html2canvas or similar
  // For now, create a placeholder that will be replaced with actual chart rendering
  const chartRect = new fabric.Rect({
    left: position.x,
    top: position.y,
    width: (chartData.width || 300) + 20,
    height: (chartData.height || 200) + 60,
    fill: '#ffffff',
    stroke: '#e5e7eb',
    strokeWidth: 2,
    cornerColor: '#3b82f6',
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerSize: 8
  })

  // Add chart title
  const titleText = new fabric.Text(chartData.title, {
    left: position.x + 10,
    top: position.y + 10,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
    fill: '#1f2937'
  })

  // Add chart type indicator
  const chartIcon = new fabric.Text('📊', {
    left: position.x + 10,
    top: position.y + 35,
    fontSize: 16
  })

  const chartTypeText = new fabric.Text(`${chartData.type.toUpperCase()} CHART`, {
    left: position.x + 35,
    top: position.y + 38,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    fill: '#6b7280'
  })

  // Create a group for the chart element
  const chartGroup = new fabric.Group([chartRect, titleText, chartIcon, chartTypeText], {
    left: position.x,
    top: position.y,
    cornerColor: '#3b82f6',
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerSize: 8
  })

  // Add metadata
  chartGroup.set('elementType', 'chart')
  chartGroup.set('chartData', chartData)

  canvas.add(chartGroup)
  canvas.setActiveObject(chartGroup)
  canvas.renderAll()

  return chartGroup
}

// Sample chart data for testing
export const sampleChartData: ChartData[] = [
  {
    type: 'bar',
    title: 'Coffee Production by Region',
    data: [
      { name: 'Brasil', value: 2680 },
      { name: 'Vietnam', value: 1650 },
      { name: 'Colombia', value: 810 },
      { name: 'Indonesia', value: 660 },
      { name: 'Ethiopia', value: 470 }
    ],
    colors: ['#8b4513', '#d2691e', '#cd853f', '#daa520', '#b8860b']
  },
  {
    type: 'line',
    title: 'Coffee Prices Trend',
    data: [
      { name: 'Jan', value: 120 },
      { name: 'Feb', value: 132 },
      { name: 'Mar', value: 101 },
      { name: 'Apr', value: 134 },
      { name: 'May', value: 90 },
      { name: 'Jun', value: 230 }
    ],
    colors: ['#10b981']
  },
  {
    type: 'pie',
    title: 'Market Share by Company',
    data: [
      { name: 'Nestlé', value: 22 },
      { name: 'JDE Peet', value: 15 },
      { name: 'Starbucks', value: 12 },
      { name: 'Lavazza', value: 8 },
      { name: 'Others', value: 43 }
    ]
  }
]