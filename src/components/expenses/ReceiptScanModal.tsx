'use client'

import React, { useState, useCallback, useRef } from 'react'
import { X, Upload, Camera, FileText, Check, Edit2, CreditCard, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScannedReceiptData {
  amount: number
  currency: string
  date: string
  time: string
  venue: string
  category: 'transport' | 'accommodation' | 'meals' | 'activities' | 'business' | 'other'
  cardLast4?: string
  cardType?: 'personal' | 'company' | 'unknown'
  requiresReimbursement?: boolean
}

interface ReceiptScanModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onExpenseAdded?: (expense: any) => void
}

const categoryOptions = [
  { id: 'transport', label: 'Transportation', description: 'Taxi, Uber, train, flight' },
  { id: 'accommodation', label: 'Accommodation', description: 'Hotels, lodging' },
  { id: 'meals', label: 'Meals & Drinks', description: 'Breakfast, lunch, dinner, coffee, drinks' },
  { id: 'activities', label: 'Activities', description: 'Tours, entertainment, events' },
  { id: 'business', label: 'Business', description: 'Office supplies, meeting expenses' },
  { id: 'other', label: 'Other', description: 'Miscellaneous expenses' }
]

export default function ReceiptScanModal({ isOpen, onClose, tripId, onExpenseAdded }: ReceiptScanModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [scannedData, setScannedData] = useState<ScannedReceiptData[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'confirm'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    setUploadedFiles(prev => [...prev, ...fileArray])

    // Process files with OCR
    setIsProcessing(true)
    try {
      const processedData: ScannedReceiptData[] = []
      
      for (const file of fileArray) {
        try {
          // Create form data for file upload
          const formData = new FormData()
          formData.append('file', file)

          // Call OCR API
          const response = await fetch('/api/expenses/scan-receipt', {
            method: 'POST',
            credentials: 'include',
            body: formData
          })

          if (!response.ok) {
            throw new Error('OCR processing failed')
          }

          const result = await response.json()
          
          if (result.success && result.data) {
            const ocrData: ScannedReceiptData = {
              amount: result.data.amount || 0,
              currency: result.data.currency || 'BRL',
              date: result.data.date || new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().split(' ')[0].substring(0, 5),
              venue: result.data.venue || 'Unknown Venue',
              category: result.data.category || 'other',
              cardLast4: result.data.cardLast4,
              cardType: result.data.isPersonalCard ? 'personal' : (result.data.cardLast4 ? 'company' : 'unknown'),
              requiresReimbursement: result.data.requiresReimbursement || false
            }
            processedData.push(ocrData)
          } else {
            // Fallback to default data if OCR fails
            const fallbackData: ScannedReceiptData = {
              amount: 0,
              currency: 'BRL',
              date: new Date().toISOString().split('T')[0],
              time: new Date().toTimeString().split(' ')[0].substring(0, 5),
              venue: `Manual Entry - ${file.name}`,
              category: 'other',
              cardType: 'unknown',
              requiresReimbursement: false
            }
            processedData.push(fallbackData)
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError)
          // Add fallback entry for failed files
          const fallbackData: ScannedReceiptData = {
            amount: 0,
            currency: 'BRL',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            venue: `Failed to process - ${file.name}`,
            category: 'other',
            cardType: 'unknown',
            requiresReimbursement: false
          }
          processedData.push(fallbackData)
        }
      }

      setScannedData(prev => [...prev, ...processedData])
      setCurrentStep('review')
    } catch (error) {
      console.error('OCR processing failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const handleEditExpense = (index: number) => {
    setEditingIndex(index)
  }

  const handleSaveEdit = (index: number, updatedData: ScannedReceiptData) => {
    setScannedData(prev => prev.map((item, i) => i === index ? updatedData : item))
    setEditingIndex(null)
  }

  const handleConfirmExpenses = async () => {
    try {
      setIsProcessing(true)
      
      // Submit expenses to API
      for (const expense of scannedData) {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            trip_id: tripId,
            amount: expense.amount,
            currency: expense.currency,
            category: expense.category,
            description: `${expense.venue} - ${expense.date}`,
            expense_date: expense.date,
            expense_location: expense.venue,
            card_last_four: expense.cardLast4,
            is_personal_card: expense.cardType === 'personal',
            requires_reimbursement: expense.requiresReimbursement
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save expense')
        }
      }

      onExpenseAdded?.(scannedData)
      onClose()
      
      // Reset state
      setUploadedFiles([])
      setScannedData([])
      setCurrentStep('upload')
    } catch (error) {
      console.error('Failed to save expenses:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setUploadedFiles([])
    setScannedData([])
    setCurrentStep('upload')
    setEditingIndex(null)
    setIsProcessing(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-semibold">Scan Receipts</h2>
              <p className="text-emerald-100 text-sm">Upload receipts and review extracted data</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetModal()
              onClose()
            }}
            className="p-2 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {currentStep === 'upload' && (
            <div className="space-y-6">
              {/* Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Upload Receipt Images or PDFs
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Drag and drop files here, or click to browse
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    <span>Images</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>PDFs</span>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              {/* Uploaded Files Preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Uploaded Files</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Processing receipts with OCR...</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Review Extracted Data
                </h3>
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Add More Receipts
                </button>
              </div>

              <div className="space-y-4">
                {scannedData.map((expense, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Receipt {index + 1}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleEditExpense(index)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Amount</label>
                        <p className="font-medium">{expense.currency} {expense.amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Date</label>
                        <p className="font-medium">{expense.date}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Venue</label>
                        <p className="font-medium">{expense.venue}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Category</label>
                        <p className="font-medium capitalize">{expense.category}</p>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4" />
                      {expense.cardLast4 ? (
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          expense.cardType === 'company' 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        )}>
                          {expense.cardType === 'company' ? 'Company Card' : 'Personal Card'} •••• {expense.cardLast4}
                          {expense.requiresReimbursement && ' • Reimbursement Required'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                          Payment method unknown
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {scannedData.length} {scannedData.length === 1 ? 'expense' : 'expenses'} ready to save
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      resetModal()
                      onClose()
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmExpenses}
                    disabled={isProcessing || scannedData.length === 0}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Save Expenses
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}