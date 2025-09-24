'use client'

import React, { useState } from 'react'
import { X, Plus, Minus, BarChart3, PieChart, TrendingUp } from 'lucide-react'

interface ChartModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (chartHtml: string) => void
}

interface ChartData {
  label: string
  value: number
}

export default function ChartModal({ isOpen, onClose, onInsert }: ChartModalProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  const [chartTitle, setChartTitle] = useState('')
  const [chartData, setChartData] = useState<ChartData[]>([
    { label: 'Item 1', value: 30 },
    { label: 'Item 2', value: 45 },
    { label: 'Item 3', value: 25 }
  ])

  const addDataPoint = () => {
    setChartData([...chartData, { label: `Item ${chartData.length + 1}`, value: 0 }])
  }

  const removeDataPoint = (index: number) => {
    if (chartData.length > 1) {
      setChartData(chartData.filter((_, i) => i !== index))
    }
  }

  const updateDataPoint = (index: number, field: 'label' | 'value', value: string | number) => {
    const newData = [...chartData]
    newData[index] = { ...newData[index], [field]: value }
    setChartData(newData)
  }

  const generateBarChart = () => {
    const maxValue = Math.max(...chartData.map(d => d.value))
    const totalValue = chartData.reduce((sum, d) => sum + d.value, 0)
    
    let html = `<div style="margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background-color: #fafafa;">`
    
    if (chartTitle) {
      html += `<h4 style="margin: 0 0 16px 0; text-align: center; font-weight: 600; color: #374151;">${chartTitle}</h4>`
    }
    
    html += `<div style="display: flex; flex-direction: column; gap: 8px;">`
    
    chartData.forEach(item => {
      const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
      const displayValue = chartType === 'pie' ? `${item.value} (${((item.value / totalValue) * 100).toFixed(1)}%)` : item.value.toString()
      
      html += `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="min-width: 80px; font-size: 14px; color: #6b7280;">${item.label}:</span>
          <div style="flex: 1; height: 24px; background-color: #e5e7eb; border-radius: 4px; position: relative; overflow: hidden;">
            <div style="height: 100%; background-color: #10b981; width: ${percentage}%; border-radius: 4px;"></div>
          </div>
          <span style="min-width: 60px; font-size: 14px; font-weight: 500; text-align: right; color: #374151;">${displayValue}</span>
        </div>
      `
    })
    
    html += `</div></div>`
    return html
  }

  const generatePieChart = () => {
    const totalValue = chartData.reduce((sum, d) => sum + d.value, 0)
    
    let html = `<div style="margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background-color: #fafafa;">`
    
    if (chartTitle) {
      html += `<h4 style="margin: 0 0 16px 0; text-align: center; font-weight: 600; color: #374151;">${chartTitle}</h4>`
    }
    
    // Text-based pie chart representation
    html += `<div style="display: grid; grid-template-columns: 1fr 200px; gap: 16px; align-items: center;">`
    
    // Data list
    html += `<div style="display: flex; flex-direction: column; gap: 8px;">`
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    
    chartData.forEach((item, index) => {
      const percentage = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0'
      const color = colors[index % colors.length]
      
      html += `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 16px; height: 16px; background-color: ${color}; border-radius: 3px;"></div>
          <span style="font-size: 14px; color: #374151;">${item.label}: ${item.value} (${percentage}%)</span>
        </div>
      `
    })
    
    html += `</div>`
    
    // Simple visual representation
    html += `<div style="width: 160px; height: 160px; border-radius: 50%; background: conic-gradient(`
    
    let cumulativePercentage = 0
    chartData.forEach((item, index) => {
      const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0
      const color = colors[index % colors.length]
      
      if (index > 0) html += ', '
      html += `${color} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`
      cumulativePercentage += percentage
    })
    
    html += `); margin: 0 auto;"></div>`
    html += `</div></div>`
    
    return html
  }

  const generateLineChart = () => {
    let html = `<div style="margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; background-color: #fafafa;">`
    
    if (chartTitle) {
      html += `<h4 style="margin: 0 0 16px 0; text-align: center; font-weight: 600; color: #374151;">${chartTitle}</h4>`
    }
    
    // Simple trend representation with text
    html += `<div style="display: flex; flex-direction: column; gap: 12px;">`
    
    // Show trend
    const values = chartData.map(d => d.value)
    const trend = values.length > 1 ? (values[values.length - 1] - values[0]) : 0
    const trendDirection = trend > 0 ? '↗️' : trend < 0 ? '↘️' : '➡️'
    const trendText = trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable'
    
    html += `<div style="text-align: center; padding: 8px; background-color: #f0fdf4; border-radius: 4px; border: 1px solid #bbf7d0;">`
    html += `<span style="font-size: 14px; color: #166534;">Trend: ${trendDirection} ${trendText} (${trend > 0 ? '+' : ''}${trend})</span>`
    html += `</div>`
    
    // Data points with connecting line representation
    chartData.forEach((item, index) => {
      const isLast = index === chartData.length - 1
      html += `
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="min-width: 80px; font-size: 14px; color: #6b7280;">${item.label}</span>
          <div style="display: flex; align-items: center; flex: 1;">
            <div style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%;"></div>
            ${!isLast ? '<div style="flex: 1; height: 2px; background-color: #10b981; margin: 0 4px;"></div>' : ''}
          </div>
          <span style="min-width: 60px; font-size: 14px; font-weight: 500; text-align: right; color: #374151;">${item.value}</span>
        </div>
      `
    })
    
    html += `</div></div>`
    return html
  }

  const generateChartHtml = () => {
    switch (chartType) {
      case 'bar':
        return generateBarChart()
      case 'pie':
        return generatePieChart()
      case 'line':
        return generateLineChart()
      default:
        return generateBarChart()
    }
  }

  const handleInsert = () => {
    const chartHtml = generateChartHtml()
    onInsert(chartHtml)
    onClose()
    
    // Reset form
    setChartTitle('')
    setChartType('bar')
    setChartData([
      { label: 'Item 1', value: 30 },
      { label: 'Item 2', value: 45 },
      { label: 'Item 3', value: 25 }
    ])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] max-w-3xl w-full max-h-[90vh] overflow-auto">
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] p-4 border-b border-golden-500 dark:border-[#0a2e21] rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-700 dark:text-golden-400">Insert Chart</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded transition-colors text-gray-700 dark:text-golden-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Chart Controls */}
          <div className="mb-6 space-y-4">
            {/* Chart Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Type</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    chartType === 'bar' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Bar Chart</span>
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    chartType === 'pie' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Pie Chart</span>
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    chartType === 'line' 
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Line Chart</span>
                </button>
              </div>
            </div>

            {/* Chart Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Title</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                placeholder="Enter chart title (optional)"
              />
            </div>
          </div>

          {/* Data Points */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Points</label>
              <button
                onClick={addDataPoint}
                className="flex items-center space-x-1 text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Point</span>
              </button>
            </div>
            
            <div className="space-y-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateDataPoint(index, 'label', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    placeholder="Label"
                  />
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => updateDataPoint(index, 'value', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    placeholder="Value"
                  />
                  <button
                    onClick={() => removeDataPoint(index)}
                    disabled={chartData.length <= 1}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</h4>
            <div 
              className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900"
              dangerouslySetInnerHTML={{ __html: generateChartHtml() }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
            >
              Insert Chart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}