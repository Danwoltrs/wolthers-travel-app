'use client'

import React, { useState } from 'react'
import { Table, X, Plus, Edit2, Check } from 'lucide-react'

interface TableData {
  title: string
  headers: string[]
  rows: string[][]
}

interface TablesManagerProps {
  tables: TableData[]
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>
  isEditing: boolean
}

export default function TablesManager({ tables, setTables, isEditing }: TablesManagerProps) {
  const [showTableBuilder, setShowTableBuilder] = useState(false)
  const [tableTitle, setTableTitle] = useState('')
  const [tableHeaders, setTableHeaders] = useState(['Header 1', 'Header 2'])
  const [tableRows, setTableRows] = useState([['Cell 1', 'Cell 2']])
  const [editingTable, setEditingTable] = useState<number | null>(null)
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null)

  const resetTableBuilder = () => {
    setTableTitle('')
    setTableHeaders(['Header 1', 'Header 2'])
    setTableRows([['Cell 1', 'Cell 2']])
    setEditingTable(null)
  }

  const openTableBuilder = () => {
    resetTableBuilder()
    setShowTableBuilder(true)
  }

  const editTable = (index: number) => {
    const table = tables[index]
    setTableTitle(table.title)
    setTableHeaders([...table.headers])
    setTableRows(table.rows.map(row => [...row]))
    setEditingTable(index)
    setShowTableBuilder(true)
  }

  const saveTable = () => {
    if (!tableTitle.trim()) {
      alert('Please enter a table title')
      return
    }

    const newTable: TableData = {
      title: tableTitle,
      headers: [...tableHeaders],
      rows: tableRows.map(row => [...row])
    }

    if (editingTable !== null) {
      setTables(prev => prev.map((table, index) => 
        index === editingTable ? newTable : table
      ))
    } else {
      setTables(prev => [...prev, newTable])
    }

    setShowTableBuilder(false)
    resetTableBuilder()
  }

  const removeTable = (index: number) => {
    setTables(prev => prev.filter((_, i) => i !== index))
  }

  const addColumn = () => {
    setTableHeaders(prev => [...prev, `Header ${prev.length + 1}`])
    setTableRows(prev => prev.map(row => [...row, `Cell ${row.length + 1}`]))
  }

  const removeColumn = (colIndex: number) => {
    if (tableHeaders.length <= 1) return
    setTableHeaders(prev => prev.filter((_, i) => i !== colIndex))
    setTableRows(prev => prev.map(row => row.filter((_, i) => i !== colIndex)))
  }

  const addRow = () => {
    const newRow = tableHeaders.map((_, i) => `Cell ${i + 1}`)
    setTableRows(prev => [...prev, newRow])
  }

  const removeRow = (rowIndex: number) => {
    if (tableRows.length <= 1) return
    setTableRows(prev => prev.filter((_, i) => i !== rowIndex))
  }

  const updateHeader = (index: number, value: string) => {
    setTableHeaders(prev => prev.map((header, i) => i === index ? value : header))
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    setTableRows(prev => prev.map((row, rIndex) => 
      rIndex === rowIndex 
        ? row.map((cell, cIndex) => cIndex === colIndex ? value : cell)
        : row
    ))
  }

  const startEditingCell = (rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex })
  }

  const finishEditingCell = () => {
    setEditingCell(null)
  }

  const updateTableCell = (tableIndex: number, rowIndex: number, colIndex: number, value: string) => {
    setTables(prev => prev.map((table, tIndex) => 
      tIndex === tableIndex 
        ? {
            ...table,
            rows: table.rows.map((row, rIndex) => 
              rIndex === rowIndex 
                ? row.map((cell, cIndex) => cIndex === colIndex ? value : cell)
                : row
            )
          }
        : table
    ))
  }

  return (
    <div>
      {/* Tables Display */}
      {tables.length > 0 && (
        <div className="space-y-4 mb-4">
          {tables.map((table, tableIndex) => (
            <div key={tableIndex} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {table.title}
                </h4>
                {isEditing && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => editTable(tableIndex)}
                      className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeTable(tableIndex)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                  <thead>
                    <tr>
                      {table.headers.map((header, colIndex) => (
                        <th key={colIndex} className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">
                            {isEditing && editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => updateTableCell(tableIndex, rowIndex, colIndex, e.target.value)}
                                onBlur={finishEditingCell}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    finishEditingCell()
                                  }
                                }}
                                className="w-full px-1 py-0.5 text-sm border border-blue-500 rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                autoFocus
                              />
                            ) : (
                              <div
                                onClick={() => isEditing && startEditingCell(rowIndex, colIndex)}
                                className={`min-h-[1.25rem] ${isEditing ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1' : ''}`}
                              >
                                {cell}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Table Button */}
      {isEditing && (
        <button
          onClick={openTableBuilder}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Table className="w-4 h-4" />
          <span>Add Table</span>
        </button>
      )}

      {/* Table Builder Modal */}
      {showTableBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] shadow-xl w-full max-w-4xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {editingTable !== null ? 'Edit Table' : 'Create Table'}
                </h3>
                <button
                  onClick={() => setShowTableBuilder(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Table Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Table Title
                  </label>
                  <input
                    type="text"
                    value={tableTitle}
                    onChange={(e) => setTableTitle(e.target.value)}
                    placeholder="Enter table title..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Table Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Table Data
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={addColumn}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add Column
                      </button>
                      <button
                        onClick={addRow}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add Row
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          {tableHeaders.map((header, index) => (
                            <th key={index} className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={header}
                                  onChange={(e) => updateHeader(index, e.target.value)}
                                  className="flex-1 px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                />
                                {tableHeaders.length > 1 && (
                                  <button
                                    onClick={() => removeColumn(index)}
                                    className="p-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            {row.map((cell, colIndex) => (
                              <td key={colIndex} className="border-b border-gray-200 dark:border-gray-600 px-3 py-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                    className="flex-1 px-1 py-0.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                  />
                                  {colIndex === 0 && tableRows.length > 1 && (
                                    <button
                                      onClick={() => removeRow(rowIndex)}
                                      className="p-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowTableBuilder(false)}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTable}
                    className="flex items-center space-x-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingTable !== null ? 'Update Table' : 'Add Table'}</span>
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