'use client'

import React, { useRef, useCallback } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Quote, BarChart, Table, Code } from 'lucide-react'

interface ChartData {
  type: 'bar' | 'line' | 'donut' | 'sankey' | 'spider'
  title: string
  data: any
}

interface TableData {
  title: string
  headers: string[]
  rows: string[][]
}

interface TextEditorProps {
  content: string
  setContent: React.Dispatch<React.SetStateAction<string>>
  isEditing: boolean
  charts: ChartData[]
  tables: TableData[]
  onOpenChartBuilder: () => void
  onOpenTableBuilder: () => void
}

export default function TextEditor({
  content,
  setContent,
  isEditing,
  charts,
  tables,
  onOpenChartBuilder,
  onOpenTableBuilder
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertTextAtCursor = useCallback((beforeText: string, afterText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newText = content.substring(0, start) + beforeText + selectedText + afterText + content.substring(end)
    setContent(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + beforeText.length + selectedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }, [content, setContent])

  const insertChart = (chartIndex: number) => {
    const chart = charts[chartIndex]
    if (!chart) return
    insertTextAtCursor(`\n\n[CHART:${chartIndex}:${chart.title}]\n\n`)
  }

  const insertTable = (tableIndex: number) => {
    const table = tables[tableIndex]
    if (!table) return
    insertTextAtCursor(`\n\n[TABLE:${tableIndex}:${table.title}]\n\n`)
  }

  const renderFormattedText = (text: string) => {
    if (!text) return ''

    let formattedText = text
    
    // Replace chart placeholders with actual charts
    formattedText = formattedText.replace(/\[CHART:(\d+):([^\]]+)\]/g, (match, index, title) => {
      const chartIndex = parseInt(index)
      const chart = charts[chartIndex]
      if (!chart) return match

      return `<div class="chart-container my-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">${title}</h4>
        <div class="chart-visualization">
          ${renderChartHTML(chart)}
        </div>
      </div>`
    })

    // Replace table placeholders with actual tables
    formattedText = formattedText.replace(/\[TABLE:(\d+):([^\]]+)\]/g, (match, index, title) => {
      const tableIndex = parseInt(index)
      const table = tables[tableIndex]
      if (!table) return match

      const tableHTML = `
        <div class="table-container my-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">${title}</h4>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr>
                  ${table.headers.map(header => 
                    `<th class="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">${header}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${table.rows.map(row => 
                  `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    ${row.map(cell => 
                      `<td class="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">${cell}</td>`
                    ).join('')}
                  </tr>`
                ).join('')}
              </tbody>
            </table>
          </div>
        </div>`
      
      return tableHTML
    })

    // Handle other markdown-like formatting
    formattedText = formattedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
      .replace(/\n/g, '<br>')

    // Wrap consecutive list items
    formattedText = formattedText
      .replace(/(<li>(?:(?!<li>).)*<\/li>(?:\s*<br>\s*<li>(?:(?!<li>).)*<\/li>)*)/g, '<ul class="list-disc list-inside space-y-1">$1</ul>')

    return formattedText
  }

  const renderChartHTML = (chart: ChartData) => {
    const chartId = `chart-${Date.now()}-${Math.random()}`
    
    switch (chart.type) {
      case 'bar':
        const maxValue = Math.max(...chart.data.map((item: any) => item.value))
        return `
          <div class="space-y-2">
            ${chart.data.map((item: any) => `
              <div class="flex items-center space-x-2">
                <div class="w-16 text-xs text-gray-600 dark:text-gray-400 truncate">${item.label}</div>
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div class="bg-blue-500 h-4 rounded-full transition-all duration-500" style="width: ${(item.value / maxValue) * 100}%"></div>
                </div>
                <div class="w-8 text-xs text-gray-600 dark:text-gray-400 text-right">${item.value}</div>
              </div>
            `).join('')}
          </div>
        `
      
      case 'donut':
        const total = chart.data.reduce((sum: number, item: any) => sum + item.value, 0)
        let currentAngle = 0
        const donutSVG = chart.data.map((item: any) => {
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
          
          return `<path d="M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${item.color}" stroke="white" stroke-width="1" />`
        }).join('')

        return `
          <div class="flex items-center space-x-4">
            <svg viewBox="0 0 100 100" class="w-24 h-24">
              ${donutSVG}
              <circle cx="50" cy="50" r="20" fill="white" />
            </svg>
            <div class="space-y-1">
              ${chart.data.map((item: any) => `
                <div class="flex items-center space-x-2 text-xs">
                  <div class="w-3 h-3 rounded-full" style="background-color: ${item.color}"></div>
                  <span class="text-gray-700 dark:text-gray-300">${item.label}: ${item.value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `
      
      default:
        return `<div class="text-gray-500 italic">Chart visualization not available in text mode</div>`
    }
  }

  if (!isEditing) {
    return (
      <div 
        className="prose prose-sm max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: renderFormattedText(content) }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        <button
          onClick={() => insertTextAtCursor('**', '**')}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('*', '*')}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('__', '__')}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('`', '`')}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        
        <button
          onClick={() => insertTextAtCursor('\n- ')}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n1. ')}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertTextAtCursor('\n> ')}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
        
        <button
          onClick={onOpenChartBuilder}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Insert Chart"
        >
          <BarChart className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenTableBuilder}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Insert Table"
        >
          <Table className="w-4 h-4" />
        </button>

        {/* Insert Chart Dropdown */}
        {charts.length > 0 && (
          <div className="relative group">
            <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
              Charts ({charts.length})
            </button>
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg hidden group-hover:block z-10 min-w-[150px]">
              {charts.map((chart, index) => (
                <button
                  key={index}
                  onClick={() => insertChart(index)}
                  className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {chart.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Insert Table Dropdown */}
        {tables.length > 0 && (
          <div className="relative group">
            <button className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
              Tables ({tables.length})
            </button>
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg hidden group-hover:block z-10 min-w-[150px]">
              {tables.map((table, index) => (
                <button
                  key={index}
                  onClick={() => insertTable(index)}
                  className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {table.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start typing your notes..."
        className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
      />

      {/* Preview */}
      {content && (
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Preview:</h4>
          <div 
            className="prose prose-sm max-w-none dark:prose-invert p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
            dangerouslySetInnerHTML={{ __html: renderFormattedText(content) }}
          />
        </div>
      )}
    </div>
  )
}