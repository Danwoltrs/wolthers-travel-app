'use client'

import React, { useState, useRef } from 'react'
import { fabric } from 'fabric'
import { Edit2, Plus, Minus, Maximize2 } from 'lucide-react'

interface TableData {
  title: string
  headers: string[]
  rows: string[][]
  width?: number
  height?: number
  styles?: {
    headerBg?: string
    headerColor?: string
    cellBg?: string
    cellColor?: string
    borderColor?: string
    alternateRowBg?: string
  }
}

interface TableElementProps {
  tableData: TableData
  onEdit?: (newData: TableData) => void
  canvas?: fabric.Canvas | null
  isSelected?: boolean
  isEditing?: boolean
  onEditingChange?: (editing: boolean) => void
}

export default function TableElement({ 
  tableData, 
  onEdit, 
  canvas, 
  isSelected,
  isEditing = false,
  onEditingChange
}: TableElementProps) {
  const [showEditButton, setShowEditButton] = useState(false)
  const [localData, setLocalData] = useState(tableData)
  const tableRef = useRef<HTMLTableElement>(null)

  const styles = {
    headerBg: '#f3f4f6',
    headerColor: '#1f2937',
    cellBg: '#ffffff',
    cellColor: '#374151',
    borderColor: '#d1d5db',
    alternateRowBg: '#f9fafb',
    ...localData.styles
  }

  const width = localData.width || 400
  const height = localData.height || Math.max(200, (localData.rows.length + 2) * 40)

  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    if (!isEditing) return

    const newRows = [...localData.rows]
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = []
    }
    newRows[rowIndex][colIndex] = value

    const updatedData = { ...localData, rows: newRows }
    setLocalData(updatedData)
    
    if (onEdit) {
      onEdit(updatedData)
    }
  }

  const handleHeaderEdit = (colIndex: number, value: string) => {
    if (!isEditing) return

    const newHeaders = [...localData.headers]
    newHeaders[colIndex] = value

    const updatedData = { ...localData, headers: newHeaders }
    setLocalData(updatedData)
    
    if (onEdit) {
      onEdit(updatedData)
    }
  }

  const addRow = () => {
    if (!isEditing) return

    const newRow = new Array(localData.headers.length).fill('')
    const updatedData = { ...localData, rows: [...localData.rows, newRow] }
    setLocalData(updatedData)
    
    if (onEdit) {
      onEdit(updatedData)
    }
  }

  const removeRow = (rowIndex: number) => {
    if (!isEditing || localData.rows.length <= 1) return

    const newRows = localData.rows.filter((_, index) => index !== rowIndex)
    const updatedData = { ...localData, rows: newRows }
    setLocalData(updatedData)
    
    if (onEdit) {
      onEdit(updatedData)
    }
  }

  const addColumn = () => {
    if (!isEditing) return

    const newHeaders = [...localData.headers, `Column ${localData.headers.length + 1}`]
    const newRows = localData.rows.map(row => [...row, ''])

    const updatedData = { ...localData, headers: newHeaders, rows: newRows }
    setLocalData(updatedData)
    
    if (onEdit) {
      onEdit(updatedData)
    }
  }

  const removeColumn = (colIndex: number) => {
    if (!isEditing || localData.headers.length <= 1) return

    const newHeaders = localData.headers.filter((_, index) => index !== colIndex)
    const newRows = localData.rows.map(row => row.filter((_, index) => index !== colIndex))

    const updatedData = { ...localData, headers: newHeaders, rows: newRows }
    setLocalData(updatedData)
    
    if (onEdit) {
      onEdit(updatedData)
    }
  }

  const toggleEditMode = () => {
    if (onEditingChange) {
      onEditingChange(!isEditing)
    }
  }

  return (
    <div 
      className={`relative bg-white border-2 rounded-lg shadow-sm ${
        isSelected ? 'border-blue-500' : 'border-gray-200'
      } transition-all duration-200 hover:shadow-md overflow-hidden`}
      style={{ width: width + 20, minHeight: height + 60 }}
      onMouseEnter={() => setShowEditButton(true)}
      onMouseLeave={() => setShowEditButton(false)}
    >
      {/* Table Title */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
        {isEditing ? (
          <input
            type="text"
            value={localData.title}
            onChange={(e) => {
              const updatedData = { ...localData, title: e.target.value }
              setLocalData(updatedData)
              if (onEdit) onEdit(updatedData)
            }}
            className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none w-full"
            placeholder="Table title"
          />
        ) : (
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {localData.title}
          </h4>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-auto max-h-96">
        <table 
          ref={tableRef}
          className="w-full border-collapse"
          style={{ 
            borderColor: styles.borderColor,
            width: '100%'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: styles.headerBg }}>
              {localData.headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="border px-3 py-2 text-left font-semibold text-sm relative group"
                  style={{ 
                    borderColor: styles.borderColor,
                    color: styles.headerColor,
                    backgroundColor: styles.headerBg
                  }}
                >
                  {isEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleHeaderEdit(colIndex, e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-semibold w-full min-w-0"
                        style={{ color: styles.headerColor }}
                      />
                      {localData.headers.length > 1 && (
                        <button
                          onClick={() => removeColumn(colIndex)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-600 transition-opacity"
                          title="Remove column"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="truncate">{header}</span>
                  )}
                </th>
              ))}
              {isEditing && (
                <th 
                  className="border px-2 py-2 w-8"
                  style={{ borderColor: styles.borderColor, backgroundColor: styles.headerBg }}
                >
                  <button
                    onClick={addColumn}
                    className="w-full h-full flex items-center justify-center text-blue-500 hover:text-blue-600 transition-colors"
                    title="Add column"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {localData.rows.map((row, rowIndex) => (
              <tr 
                key={rowIndex}
                className="hover:bg-gray-50 transition-colors group"
                style={{ 
                  backgroundColor: rowIndex % 2 === 1 ? styles.alternateRowBg : styles.cellBg 
                }}
              >
                {localData.headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border px-3 py-2 text-sm"
                    style={{ 
                      borderColor: styles.borderColor,
                      color: styles.cellColor
                    }}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={row[colIndex] || ''}
                        onChange={(e) => handleCellEdit(rowIndex, colIndex, e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm"
                        style={{ color: styles.cellColor }}
                        placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                      />
                    ) : (
                      <span className="block truncate">{row[colIndex] || ''}</span>
                    )}
                  </td>
                ))}
                {isEditing && (
                  <td 
                    className="border px-2 py-2 w-8"
                    style={{ borderColor: styles.borderColor }}
                  >
                    <button
                      onClick={() => removeRow(rowIndex)}
                      className="opacity-0 group-hover:opacity-100 w-full h-full flex items-center justify-center text-red-500 hover:text-red-600 transition-opacity"
                      title="Remove row"
                      disabled={localData.rows.length <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {isEditing && (
              <tr>
                <td 
                  colSpan={localData.headers.length + 1}
                  className="border-t px-3 py-2 text-center"
                  style={{ borderColor: styles.borderColor }}
                >
                  <button
                    onClick={addRow}
                    className="inline-flex items-center space-x-1 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                    title="Add row"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Row</span>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Control Buttons Overlay */}
      {showEditButton && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={toggleEditMode}
            className={`p-1.5 border border-gray-200 rounded-md shadow-sm transition-all duration-200 hover:shadow-md ${
              isEditing 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700'
            }`}
            title={isEditing ? "Done editing" : "Edit table"}
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            className="p-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-700 border border-gray-200 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
            title="Expand table"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Drag Handle */}
      <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full cursor-move flex items-center justify-center shadow-md">
        <div className="w-2 h-2 bg-white rounded-full"></div>
      </div>

      {/* Status indicator when editing */}
      {isEditing && (
        <div className="absolute bottom-2 left-2">
          <div className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Editing</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Factory function to create table elements on canvas
export const createTableElement = (
  canvas: fabric.Canvas,
  tableData: TableData,
  position: { x: number; y: number }
) => {
  const width = (tableData.width || 400) + 20
  const height = Math.max(200, (tableData.rows.length + 2) * 40) + 60

  // Create table background
  const tableRect = new fabric.Rect({
    left: position.x,
    top: position.y,
    width,
    height,
    fill: '#ffffff',
    stroke: '#e5e7eb',
    strokeWidth: 2,
    cornerColor: '#10b981',
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerSize: 8
  })

  // Add table title
  const titleRect = new fabric.Rect({
    left: position.x,
    top: position.y,
    width,
    height: 35,
    fill: '#f9fafb',
    stroke: '#e5e7eb',
    strokeWidth: 1
  })

  const titleText = new fabric.Text(tableData.title, {
    left: position.x + 10,
    top: position.y + 10,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter, sans-serif',
    fill: '#1f2937'
  })

  // Add table headers
  let yOffset = 45
  const headerHeight = 30
  const cellWidth = width / tableData.headers.length

  const headerElements: fabric.Object[] = []
  tableData.headers.forEach((header, index) => {
    const headerRect = new fabric.Rect({
      left: position.x + (index * cellWidth),
      top: position.y + yOffset,
      width: cellWidth,
      height: headerHeight,
      fill: '#f3f4f6',
      stroke: '#d1d5db',
      strokeWidth: 1
    })

    const headerText = new fabric.Text(header, {
      left: position.x + (index * cellWidth) + 8,
      top: position.y + yOffset + 8,
      fontSize: 12,
      fontWeight: 'bold',
      fontFamily: 'Inter, sans-serif',
      fill: '#1f2937'
    })

    headerElements.push(headerRect, headerText)
  })

  // Add table rows
  yOffset += headerHeight
  const rowElements: fabric.Object[] = []
  
  tableData.rows.forEach((row, rowIndex) => {
    const rowHeight = 30
    row.forEach((cell, colIndex) => {
      const cellRect = new fabric.Rect({
        left: position.x + (colIndex * cellWidth),
        top: position.y + yOffset + (rowIndex * rowHeight),
        width: cellWidth,
        height: rowHeight,
        fill: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
        stroke: '#d1d5db',
        strokeWidth: 1
      })

      const cellText = new fabric.Text(cell || '', {
        left: position.x + (colIndex * cellWidth) + 8,
        top: position.y + yOffset + (rowIndex * rowHeight) + 8,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
        fill: '#374151'
      })

      rowElements.push(cellRect, cellText)
    })
  })

  // Add table icon
  const tableIcon = new fabric.Text('📋', {
    left: position.x + width - 35,
    top: position.y + 8,
    fontSize: 16
  })

  // Create group for all table elements
  const allElements = [tableRect, titleRect, titleText, ...headerElements, ...rowElements, tableIcon]
  
  const tableGroup = new fabric.Group(allElements, {
    left: position.x,
    top: position.y,
    cornerColor: '#10b981',
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerSize: 8
  })

  // Add metadata
  tableGroup.set('elementType', 'table')
  tableGroup.set('tableData', tableData)

  canvas.add(tableGroup)
  canvas.setActiveObject(tableGroup)
  canvas.renderAll()

  return tableGroup
}

// Sample table data for testing
export const sampleTableData: TableData[] = [
  {
    title: 'Coffee Price Comparison',
    headers: ['Origin', 'Price/lb', 'Quality', 'Availability'],
    rows: [
      ['Brazil Santos', '$4.20', 'Premium', 'High'],
      ['Colombian Supremo', '$5.80', 'Specialty', 'Medium'],
      ['Ethiopian Yirgacheffe', '$7.50', 'Specialty', 'Limited'],
      ['Guatemala Antigua', '$6.20', 'Premium', 'Medium'],
      ['Jamaica Blue Mountain', '$25.00', 'Ultra Premium', 'Very Limited']
    ]
  },
  {
    title: 'Meeting Attendees',
    headers: ['Name', 'Company', 'Role'],
    rows: [
      ['Daniel Wolthers', 'Wolthers & Associates', 'CEO'],
      ['Ana Silva', 'Fazenda Santa Clara', 'Farm Manager'],
      ['Carlos Rodriguez', 'Colombian Coffee Co.', 'Export Manager']
    ]
  },
  {
    title: 'Action Items',
    headers: ['Task', 'Assignee', 'Due Date', 'Status'],
    rows: [
      ['Review contracts', 'Daniel', '2025-01-20', 'Pending'],
      ['Quality testing', 'Ana', '2025-01-25', 'In Progress'],
      ['Shipping arrangements', 'Carlos', '2025-01-30', 'Not Started']
    ]
  }
]