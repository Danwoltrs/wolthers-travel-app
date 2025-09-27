'use client'

import React, { useState, useCallback } from 'react'
import { X, Upload, FileScan, Edit3, Save, AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReceiptData {
  merchant: string
  amount: number
  currency: string
  date: string
  category: string
  cardLastFour: string
  cardType: string
  confidence: {
    merchant: 'high' | 'medium' | 'low'
    amount: 'high' | 'medium' | 'low'
    date: 'high' | 'medium' | 'low'
  }
  items: any[]
  rawText: string
}

interface ReceiptUploadModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onExpenseAdded?: (expense: any) => void
}

export default function ReceiptUploadModal({ isOpen, onClose, tripId, onExpenseAdded }: ReceiptUploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editableData, setEditableData] = useState<Partial<ReceiptData>>({})

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  // Handle file input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }, [])

  // Process file
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      processImage(result)
    }
    reader.readAsDataURL(file)
  }, [])

  // Process image with OCR
  const processImage = async (imageData: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Convert base64 to blob
      const response = await fetch(imageData)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append('image', blob)

      // Send to Google Vision OCR
      const ocrResponse = await fetch('/api/receipts/google-ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!ocrResponse.ok) {
        throw new Error('OCR processing failed')
      }

      const result = await ocrResponse.json()

      if (result.success) {
        setReceiptData(result)
        setEditableData(result)
      } else {
        throw new Error(result.error || 'OCR processing failed')
      }
    } catch (err) {
      setError('Failed to process receipt. Please try manual entry.')
      // Set default data for manual entry
      setReceiptData({
        merchant: '',
        amount: 0,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        cardLastFour: '',
        cardType: '',
        confidence: { merchant: 'low', amount: 'low', date: 'low' },
        items: [],
        rawText: ''
      })
      setEditableData({
        merchant: '',
        amount: 0,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        category: 'other',
        cardLastFour: '',
        cardType: ''
      })
      setIsEditing(true)
    } finally {
      setIsProcessing(false)
    }
  }

  // Save expense
  const saveExpense = async () => {
    const dataToSave = isEditing ? { ...receiptData, ...editableData } : receiptData
    if (!dataToSave) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trip_id: tripId,
          amount: dataToSave.amount,
          currency: dataToSave.currency,
          category: dataToSave.category,
          description: `${dataToSave.merchant} - ${dataToSave.date}`,
          expense_date: dataToSave.date,
          expense_location: dataToSave.merchant,
          card_last_four: dataToSave.cardLastFour || null,
          card_type: dataToSave.cardType || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to save expense')
      }

      onExpenseAdded?.(dataToSave)
      onClose()
      resetModal()
    } catch (err) {
      console.error('Expense save error:', err)
      setError(`Failed to save expense: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setPreview(null)
    setReceiptData(null)
    setEditableData({})
    setError(null)
    setIsProcessing(false)
    setIsEditing(false)
    setDragActive(false)
  }

  // Handle body scroll lock
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-700 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FileScan className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Upload Receipt</h2>
          </div>
          <button
            onClick={() => {
              resetModal()
              onClose()
            }}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!receiptData ? (
            /* Upload Area */
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                dragActive
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="max-w-sm mx-auto rounded-lg shadow-md"
                  />
                  {isProcessing && (
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
                      <span>Processing receipt...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Drop your receipt here
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      or click to browse files
                    </p>
                  </div>
                  <button
                    onClick={() => document.getElementById('receipt-file-input')?.click()}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Choose File
                  </button>
                  <input
                    id="receipt-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          ) : (
            /* Receipt Data Review/Edit */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              {preview && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Receipt Image
                  </h3>
                  <img
                    src={preview}
                    alt="Receipt"
                    className="w-full max-w-md rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Data Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Expense Details
                  </h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'View Mode' : 'Edit Mode'}
                  </button>
                </div>

                {isEditing ? (
                  /* Editable Form */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Merchant
                      </label>
                      <input
                        type="text"
                        value={editableData.merchant || ''}
                        onChange={(e) => setEditableData(prev => ({ ...prev, merchant: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editableData.amount || 0}
                          onChange={(e) => setEditableData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Currency
                        </label>
                        <select
                          value={editableData.currency || 'USD'}
                          onChange={(e) => setEditableData(prev => ({ ...prev, currency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        >
                          <option value="USD">USD</option>
                          <option value="BRL">BRL</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={editableData.date || ''}
                        onChange={(e) => setEditableData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={editableData.category || 'other'}
                        onChange={(e) => setEditableData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      >
                        <option value="transport">Transport</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="meals">Meals</option>
                        <option value="activities">Activities</option>
                        <option value="business">Business</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card Type
                        </label>
                        <input
                          type="text"
                          value={editableData.cardType || ''}
                          onChange={(e) => setEditableData(prev => ({ ...prev, cardType: e.target.value }))}
                          placeholder="Visa, Mastercard, etc."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Last 4 Digits
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={editableData.cardLastFour || ''}
                          onChange={(e) => setEditableData(prev => ({ ...prev, cardLastFour: e.target.value }))}
                          placeholder="1234"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Read-only View */
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Merchant</label>
                      <p className="font-medium text-gray-900 dark:text-white">{receiptData.merchant}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Amount</label>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {receiptData.currency} {receiptData.amount.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Date</label>
                      <p className="font-medium text-gray-900 dark:text-white">{receiptData.date}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">{receiptData.category}</p>
                    </div>

                    {(receiptData.cardType || receiptData.cardLastFour) && (
                      <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400">Payment Method</label>
                        <div className="flex items-center gap-2">
                          {receiptData.cardType && (
                            <span className="font-medium text-gray-900 dark:text-white">{receiptData.cardType}</span>
                          )}
                          {receiptData.cardLastFour && (
                            <span className="text-gray-600 dark:text-gray-300">•••• {receiptData.cardLastFour}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {receiptData && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  resetModal()
                  onClose()
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveExpense}
                disabled={isProcessing}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Expense
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}