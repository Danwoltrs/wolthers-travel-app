'use client'

import React, { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'

interface TableModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (tableHtml: string) => void
}

export default function TableModal({ isOpen, onClose, onInsert }: TableModalProps) {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [tableData, setTableData] = useState<string[][]>(
    Array(3).fill(null).map(() => Array(3).fill(''))
  )
  const [hasHeaders, setHasHeaders] = useState(true)

  // Update table data when dimensions change
  const updateDimensions = (newRows: number, newCols: number) => {
    const newData = Array(newRows).fill(null).map((_, rowIndex) => 
      Array(newCols).fill(null).map((_, colIndex) => 
        tableData[rowIndex]?.[colIndex] || ''
      )
    )
    setTableData(newData)
    setRows(newRows)
    setCols(newCols)
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...tableData]
    newData[rowIndex][colIndex] = value
    setTableData(newData)
  }

  const generateTableHtml = () => {
    let html = '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; border: 1px solid #e5e7eb;">'
    
    tableData.forEach((row, rowIndex) => {
      const isHeaderRow = hasHeaders && rowIndex === 0
      const cellTag = isHeaderRow ? 'th' : 'td'
      const cellStyle = `border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; ${isHeaderRow ? 'background-color: #f9fafb; font-weight: 600;' : ''}`
      
      html += '<tr>'
      row.forEach(cell => {
        html += `<${cellTag} style="${cellStyle}">${cell || '&nbsp;'}</${cellTag}>`
      })
      html += '</tr>'
    })
    
    html += '</table>'
    return html
  }

  const handleInsert = () => {
    const tableHtml = generateTableHtml()
    onInsert(tableHtml)
    onClose()
    
    // Reset form
    setRows(3)
    setCols(3)
    setTableData(Array(3).fill(null).map(() => Array(3).fill('')))
    setHasHeaders(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] max-w-2xl w-full max-h-[90vh] overflow-auto">
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] p-4 border-b border-golden-500 dark:border-[#0a2e21] rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-700 dark:text-golden-400">Insert Table</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded transition-colors text-gray-700 dark:text-golden-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Table Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Rows:</label>
                <button
                  onClick={() => updateDimensions(Math.max(1, rows - 1), cols)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm">{rows}</span>
                <button
                  onClick={() => updateDimensions(rows + 1, cols)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Columns:</label>
                <button
                  onClick={() => updateDimensions(rows, Math.max(1, cols - 1))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm">{cols}</span>
                <button
                  onClick={() => updateDimensions(rows, cols + 1)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="headers"
                  checked={hasHeaders}
                  onChange={(e) => setHasHeaders(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="headers" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  First row as headers
                </label>
              </div>
            </div>
          </div>

          {/* Table Editor */}
          <div className="mb-6 overflow-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border border-gray-300 dark:border-gray-600 p-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        className={`w-full p-2 border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                          hasHeaders && rowIndex === 0 
                            ? 'bg-gray-50 dark:bg-gray-800 font-semibold' 
                            : 'bg-white dark:bg-[#1a1a1a]'
                        }`}
                        placeholder={hasHeaders && rowIndex === 0 ? 'Header' : 'Cell data'}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </table>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</h4>
            <div 
              className="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900"
              dangerouslySetInnerHTML={{ __html: generateTableHtml() }}
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
              Insert Table
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}