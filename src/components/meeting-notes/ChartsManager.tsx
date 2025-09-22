'use client'

import React, { useState } from 'react'
import { BarChart, X, Plus, Edit2, Check } from 'lucide-react'

interface ChartData {
  type: 'bar' | 'line' | 'donut' | 'sankey' | 'spider'
  title: string
  data: any
}

interface ChartsManagerProps {
  charts: ChartData[]
  setCharts: React.Dispatch<React.SetStateAction<ChartData[]>>
  isEditing: boolean
}

export default function ChartsManager({ charts, setCharts, isEditing }: ChartsManagerProps) {
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [chartType, setChartType] = useState<'bar' | 'line' | 'donut' | 'sankey' | 'spider'>('bar')
  const [chartTitle, setChartTitle] = useState('')
  const [editingChart, setEditingChart] = useState<number | null>(null)

  // Chart-specific state
  const [barData, setBarData] = useState([{ label: 'Item 1', value: 10 }])
  const [lineData, setLineData] = useState([{ x: 'Jan', y: 10 }])
  const [donutData, setDonutData] = useState([{ label: 'Category 1', value: 30, color: '#3B82F6' }])
  const [sankeyData, setSankeyData] = useState([{ source: 'A', target: 'B', value: 10 }])
  const [spiderData, setSpiderData] = useState([{ category: 'Category 1', score: 5 }])

  const resetChartBuilder = () => {
    setChartTitle('')
    setBarData([{ label: 'Item 1', value: 10 }])
    setLineData([{ x: 'Jan', y: 10 }])
    setDonutData([{ label: 'Category 1', value: 30, color: '#3B82F6' }])
    setSankeyData([{ source: 'A', target: 'B', value: 10 }])
    setSpiderData([{ category: 'Category 1', score: 5 }])
    setEditingChart(null)
  }

  const openChartBuilder = () => {
    resetChartBuilder()
    setShowChartBuilder(true)
  }

  const editChart = (index: number) => {
    const chart = charts[index]
    setChartType(chart.type)
    setChartTitle(chart.title)
    
    switch (chart.type) {
      case 'bar':
        setBarData(chart.data)
        break
      case 'line':
        setLineData(chart.data)
        break
      case 'donut':
        setDonutData(chart.data)
        break
      case 'sankey':
        setSankeyData(chart.data)
        break
      case 'spider':
        setSpiderData(chart.data)
        break
    }
    
    setEditingChart(index)
    setShowChartBuilder(true)
  }

  const saveChart = () => {
    if (!chartTitle.trim()) {
      alert('Please enter a chart title')
      return
    }

    let data
    switch (chartType) {
      case 'bar':
        data = barData
        break
      case 'line':
        data = lineData
        break
      case 'donut':
        data = donutData
        break
      case 'sankey':
        data = sankeyData
        break
      case 'spider':
        data = spiderData
        break
      default:
        return
    }

    const newChart: ChartData = {
      type: chartType,
      title: chartTitle,
      data
    }

    if (editingChart !== null) {
      setCharts(prev => prev.map((chart, index) => 
        index === editingChart ? newChart : chart
      ))
    } else {
      setCharts(prev => [...prev, newChart])
    }

    setShowChartBuilder(false)
    resetChartBuilder()
  }

  const removeChart = (index: number) => {
    setCharts(prev => prev.filter((_, i) => i !== index))
  }

  const renderChart = (chart: ChartData, index: number) => {
    const chartKey = `chart-${index}-${chart.type}-${chart.title}`
    
    switch (chart.type) {
      case 'bar':
        return renderBarChart(chart.data, chartKey)
      case 'line':
        return renderLineChart(chart.data, chartKey)
      case 'donut':
        return renderDonutChart(chart.data, chartKey)
      case 'sankey':
        return renderSankeyChart(chart.data, chartKey)
      case 'spider':
        return renderSpiderChart(chart.data, chartKey)
      default:
        return null
    }
  }

  const renderBarChart = (data: any[], key: string) => {
    const maxValue = Math.max(...data.map((item: any) => item.value))
    
    return (
      <div key={key} className="space-y-2">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-16 text-xs text-gray-600 dark:text-gray-400 truncate">
              {item.label}
            </div>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="w-8 text-xs text-gray-600 dark:text-gray-400 text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderLineChart = (data: any[], key: string) => {
    if (data.length < 2) return <p className="text-gray-500">Need at least 2 data points</p>
    
    const maxY = Math.max(...data.map((item: any) => item.y))
    const minY = Math.min(...data.map((item: any) => item.y))
    const range = maxY - minY || 1
    
    return (
      <svg key={key} viewBox="0 0 300 150" className="w-full h-32 border border-gray-200 dark:border-gray-600 rounded">
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          points={data.map((item: any, index: number) => 
            `${(index / (data.length - 1)) * 280 + 10},${140 - ((item.y - minY) / range) * 120}`
          ).join(' ')}
        />
        {data.map((item: any, index: number) => (
          <g key={index}>
            <circle
              cx={(index / (data.length - 1)) * 280 + 10}
              cy={140 - ((item.y - minY) / range) * 120}
              r="3"
              fill="#3B82F6"
            />
            <text
              x={(index / (data.length - 1)) * 280 + 10}
              y={155}
              textAnchor="middle"
              className="text-xs fill-current text-gray-600 dark:text-gray-400"
            >
              {item.x}
            </text>
          </g>
        ))}
      </svg>
    )
  }

  const renderDonutChart = (data: any[], key: string) => {
    const total = data.reduce((sum: number, item: any) => sum + item.value, 0)
    let currentAngle = 0
    
    return (
      <div key={key} className="flex items-center space-x-4">
        <svg viewBox="0 0 100 100" className="w-24 h-24">
          {data.map((item: any, index: number) => {
            const percentage = item.value / total
            const angle = percentage * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            currentAngle = endAngle
            
            const x1 = 50 + 35 * Math.cos((startAngle - 90) * Math.PI / 180)
            const y1 = 50 + 35 * Math.sin((startAngle - 90) * Math.PI / 180)
            const x2 = 50 + 35 * Math.cos((endAngle - 90) * Math.PI / 180)
            const y2 = 50 + 35 * Math.sin((endAngle - 90) * Math.PI / 180)
            
            const largeArcFlag = angle > 180 ? 1 : 0
            
            return (
              <path
                key={index}
                d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={item.color}
                stroke="white"
                strokeWidth="1"
              />
            )
          })}
          <circle cx="50" cy="50" r="20" fill="white" />
        </svg>
        <div className="space-y-1">
          {data.map((item: any, index: number) => (
            <div key={index} className="flex items-center space-x-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">
                {item.label}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSankeyChart = (data: any[], key: string) => {
    const sources = [...new Set(data.map((item: any) => item.source))]
    const targets = [...new Set(data.map((item: any) => item.target))]
    const maxValue = Math.max(...data.map((item: any) => item.value))
    
    return (
      <svg key={key} viewBox="0 0 300 150" className="w-full h-32 border border-gray-200 dark:border-gray-600 rounded">
        {/* Source nodes */}
        {sources.map((source: string, index: number) => (
          <g key={`source-${index}`}>
            <rect
              x="20"
              y={20 + index * 30}
              width="60"
              height="20"
              fill="#3B82F6"
              rx="3"
            />
            <text
              x="50"
              y={32 + index * 30}
              textAnchor="middle"
              className="text-xs fill-white"
            >
              {source}
            </text>
          </g>
        ))}
        
        {/* Target nodes */}
        {targets.map((target: string, index: number) => (
          <g key={`target-${index}`}>
            <rect
              x="220"
              y={20 + index * 30}
              width="60"
              height="20"
              fill="#10B981"
              rx="3"
            />
            <text
              x="250"
              y={32 + index * 30}
              textAnchor="middle"
              className="text-xs fill-white"
            >
              {target}
            </text>
          </g>
        ))}
        
        {/* Flows */}
        {data.map((item: any, index: number) => {
          const sourceIndex = sources.indexOf(item.source)
          const targetIndex = targets.indexOf(item.target)
          const thickness = (item.value / maxValue) * 10 + 2
          
          return (
            <path
              key={`flow-${index}`}
              d={`M 80 ${30 + sourceIndex * 30} Q 150 ${30 + sourceIndex * 30} 220 ${30 + targetIndex * 30}`}
              stroke="#6B7280"
              strokeWidth={thickness}
              fill="none"
              opacity="0.6"
            />
          )
        })}
      </svg>
    )
  }

  const renderSpiderChart = (data: any[], key: string) => {
    const centerX = 75
    const centerY = 75
    const radius = 50
    const angles = data.map((_, index) => (index * 2 * Math.PI) / data.length - Math.PI / 2)
    
    return (
      <svg key={key} viewBox="0 0 150 150" className="w-32 h-32 border border-gray-200 dark:border-gray-600 rounded">
        {/* Grid circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, index) => (
          <circle
            key={`grid-${index}`}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Grid lines */}
        {angles.map((angle, index) => (
          <line
            key={`line-${index}`}
            x1={centerX}
            y1={centerY}
            x2={centerX + radius * Math.cos(angle)}
            y2={centerY + radius * Math.sin(angle)}
            stroke="#E5E7EB"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Data polygon */}
        <polygon
          points={data.map((item: any, index: number) => {
            const angle = angles[index]
            const value = Math.min(item.score / 10, 1) // Normalize to 0-1
            const x = centerX + radius * value * Math.cos(angle)
            const y = centerY + radius * value * Math.sin(angle)
            return `${x},${y}`
          }).join(' ')}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3B82F6"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((item: any, index: number) => {
          const angle = angles[index]
          const value = Math.min(item.score / 10, 1)
          const x = centerX + radius * value * Math.cos(angle)
          const y = centerY + radius * value * Math.sin(angle)
          
          return (
            <circle
              key={`point-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill="#3B82F6"
            />
          )
        })}
        
        {/* Labels */}
        {data.map((item: any, index: number) => {
          const angle = angles[index]
          const labelX = centerX + (radius + 15) * Math.cos(angle)
          const labelY = centerY + (radius + 15) * Math.sin(angle)
          
          return (
            <text
              key={`label-${index}`}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              className="text-xs fill-current text-gray-600 dark:text-gray-400"
            >
              {item.category.substring(0, 4)}
            </text>
          )
        })}
      </svg>
    )
  }

  const renderChartBuilder = () => {
    switch (chartType) {
      case 'bar':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Bar Chart Data</h3>
            {barData.map((item, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => setBarData(prev => prev.map((d, i) => 
                    i === index ? { ...d, label: e.target.value } : d
                  ))}
                  placeholder="Label"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => setBarData(prev => prev.map((d, i) => 
                    i === index ? { ...d, value: parseInt(e.target.value) || 0 } : d
                  ))}
                  placeholder="Value"
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={() => setBarData(prev => prev.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setBarData(prev => [...prev, { label: `Item ${prev.length + 1}`, value: 10 }])}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        )
      
      case 'line':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Line Chart Data</h3>
            {lineData.map((item, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={item.x}
                  onChange={(e) => setLineData(prev => prev.map((d, i) => 
                    i === index ? { ...d, x: e.target.value } : d
                  ))}
                  placeholder="X Value"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  value={item.y}
                  onChange={(e) => setLineData(prev => prev.map((d, i) => 
                    i === index ? { ...d, y: parseInt(e.target.value) || 0 } : d
                  ))}
                  placeholder="Y Value"
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={() => setLineData(prev => prev.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setLineData(prev => [...prev, { x: `Point ${prev.length + 1}`, y: 10 }])}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Add Point</span>
            </button>
          </div>
        )
      
      case 'donut':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Donut Chart Data</h3>
            {donutData.map((item, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => setDonutData(prev => prev.map((d, i) => 
                    i === index ? { ...d, label: e.target.value } : d
                  ))}
                  placeholder="Label"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => setDonutData(prev => prev.map((d, i) => 
                    i === index ? { ...d, value: parseInt(e.target.value) || 0 } : d
                  ))}
                  placeholder="Value"
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <input
                  type="color"
                  value={item.color}
                  onChange={(e) => setDonutData(prev => prev.map((d, i) => 
                    i === index ? { ...d, color: e.target.value } : d
                  ))}
                  className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-md"
                />
                <button
                  onClick={() => setDonutData(prev => prev.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setDonutData(prev => [...prev, { 
                label: `Category ${prev.length + 1}`, 
                value: 20, 
                color: `#${Math.floor(Math.random()*16777215).toString(16)}` 
              }])}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        )
      
      case 'sankey':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Sankey Diagram Data</h3>
            {sankeyData.map((item, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={item.source}
                  onChange={(e) => setSankeyData(prev => prev.map((d, i) => 
                    i === index ? { ...d, source: e.target.value } : d
                  ))}
                  placeholder="Source"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  value={item.target}
                  onChange={(e) => setSankeyData(prev => prev.map((d, i) => 
                    i === index ? { ...d, target: e.target.value } : d
                  ))}
                  placeholder="Target"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => setSankeyData(prev => prev.map((d, i) => 
                    i === index ? { ...d, value: parseInt(e.target.value) || 0 } : d
                  ))}
                  placeholder="Value"
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={() => setSankeyData(prev => prev.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setSankeyData(prev => [...prev, { 
                source: `Source ${prev.length + 1}`, 
                target: `Target ${prev.length + 1}`, 
                value: 10 
              }])}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Add Flow</span>
            </button>
          </div>
        )
      
      case 'spider':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Spider/Radar Chart Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Scores should be between 0-10</p>
            {spiderData.map((item, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={item.category}
                  onChange={(e) => setSpiderData(prev => prev.map((d, i) => 
                    i === index ? { ...d, category: e.target.value } : d
                  ))}
                  placeholder="Category"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={item.score}
                  onChange={(e) => setSpiderData(prev => prev.map((d, i) => 
                    i === index ? { ...d, score: Math.max(0, Math.min(10, parseInt(e.target.value) || 0)) } : d
                  ))}
                  placeholder="Score (0-10)"
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={() => setSpiderData(prev => prev.filter((_, i) => i !== index))}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setSpiderData(prev => [...prev, { 
                category: `Category ${prev.length + 1}`, 
                score: 5 
              }])}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div>
      {/* Charts Display */}
      {charts.length > 0 && (
        <div className="space-y-4 mb-4">
          {charts.map((chart, index) => (
            <div key={index} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {chart.title}
                </h4>
                {isEditing && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => editChart(index)}
                      className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeChart(index)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              {renderChart(chart, index)}
            </div>
          ))}
        </div>
      )}

      {/* Add Chart Button */}
      {isEditing && (
        <button
          onClick={openChartBuilder}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <BarChart className="w-4 h-4" />
          <span>Add Chart</span>
        </button>
      )}

      {/* Chart Builder Modal */}
      {showChartBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {editingChart !== null ? 'Edit Chart' : 'Create Chart'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowChartBuilder(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Chart Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chart Title
                  </label>
                  <input
                    type="text"
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                    placeholder="Enter chart title..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Chart Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chart Type
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {(['bar', 'line', 'donut', 'sankey', 'spider'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-2 text-sm rounded transition-colors ${
                          chartType === type
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Data Input */}
                {renderChartBuilder()}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowChartBuilder(false)}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChart}
                    className="flex items-center space-x-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingChart !== null ? 'Update Chart' : 'Add Chart'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}