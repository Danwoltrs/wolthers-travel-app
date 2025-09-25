'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Camera, Upload, Check, AlertTriangle, Loader2, Receipt, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExtractedReceiptData {
  merchant: string
  amount: number
  currency: string
  date: string
  category: string
  confidence: {
    merchant: 'high' | 'medium' | 'low'
    amount: 'high' | 'medium' | 'low'
    date: 'high' | 'medium' | 'low'
  }
  items?: Array<{
    description: string
    quantity: number
    price: number
  }>
}

interface ReceiptScanModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ExtractedReceiptData) => Promise<void>
  tripId: string
}

export default function ReceiptScanModal({
  isOpen,
  onClose,
  onSave,
  tripId
}: ReceiptScanModalProps) {
  const [currentStep, setCurrentStep] = useState<'landing' | 'camera' | 'review' | 'manual'>('landing')
  const [capturedImage, setCapturedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const closeCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
  }

  const resetModal = () => {
    setCurrentStep('landing')
    setCapturedImage(null)
    setImagePreview('')
    setExtractedData(null)
    setIsProcessing(false)
    setIsSaving(false)
    setError('')
    closeCamera()
  }

  const openCamera = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        cameraStreamRef.current = stream
      }
      setCurrentStep('camera')
    } catch (error) {
      console.error('Camera access error:', error)
      setError('Unable to access camera. Please check your permissions.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setCapturedImage(file)
        setImagePreview(URL.createObjectURL(file))
        closeCamera()
        processReceipt(file)
      }
    }, 'image/jpeg', 0.9)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('File too large. Maximum size is 20MB.')
        return
      }

      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Unsupported file format. Please use JPEG, PNG, or WebP.')
        return
      }

      setCapturedImage(file)
      setImagePreview(URL.createObjectURL(file))
      processReceipt(file)
    }
  }

  const processReceipt = async (file: File) => {
    setIsProcessing(true)
    setError('')
    setCurrentStep('review')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/receipts/ocr`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process receipt')
      }

      // Mock extracted data for demo (in real implementation, this would come from the API)
      const mockExtractedData: ExtractedReceiptData = {
        merchant: result.merchant || 'Restaurant ABC',
        amount: result.amount || 45.67,
        currency: result.currency || 'BRL',
        date: result.date || new Date().toISOString().split('T')[0],
        category: result.category || 'meals',
        confidence: {
          merchant: result.confidence?.merchant || 'high',
          amount: result.confidence?.amount || 'high',
          date: result.confidence?.date || 'medium'
        },
        items: result.items || []
      }

      setExtractedData(mockExtractedData)
    } catch (error) {
      console.error('Receipt processing error:', error)
      setError('Failed to extract data from receipt. You can enter details manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      case 'low': return 'text-red-600 bg-red-50'
    }
  }

  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return <Check className="w-3 h-3" />
      case 'medium': return <AlertTriangle className="w-3 h-3" />
      case 'low': return <AlertTriangle className="w-3 h-3" />
    }
  }

  const handleSave = async () => {
    if (!extractedData) return

    setIsSaving(true)
    try {
      await onSave(extractedData)
      resetModal()
      onClose()
    } catch (error) {
      setError('Failed to save expense. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const expenseCategories = [
    { id: 'transportation', label: 'Transportation' },
    { id: 'accommodation', label: 'Accommodation' },
    { id: 'meals', label: 'Meals & Entertainment' },
    { id: 'supplies', label: 'Supplies' },
    { id: 'other', label: 'Other' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white dark:bg-[#1a1a1a] text-left shadow-xl transition-all sm:my-8">
          {/* Header */}
          <div className="bg-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Receipt className="w-6 h-6 text-white" />
                <h3 className="text-lg font-semibold text-white">
                  {currentStep === 'landing' && 'Add New Expense'}
                  {currentStep === 'camera' && 'Scan Receipt'}
                  {currentStep === 'review' && 'Review & Edit'}
                  {currentStep === 'manual' && 'Enter Manually'}
                </h3>
              </div>
              <button
                onClick={() => {
                  resetModal()
                  onClose()
                }}
                className="rounded-md p-2 text-white hover:bg-emerald-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Landing Step */}
          {currentStep === 'landing' && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={openCamera}
                  className="group relative overflow-hidden rounded-xl border-2 border-emerald-200 hover:border-emerald-300 p-8 text-center transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                      <Camera className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">📷 Scan Receipt</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Use your camera to capture and automatically extract receipt data
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentStep('manual')}
                  className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-gray-300 p-8 text-center transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Edit3 className="w-8 h-8 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">✏️ Enter Manually</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Manually enter expense details and optionally attach receipt
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Or upload from gallery</span>
                </button>
              </div>
            </div>
          )}

          {/* Camera Step */}
          {currentStep === 'camera' && (
            <div className="p-6">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 sm:h-96 object-cover"
                />

                {/* Receipt Frame Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-40 border-2 border-white border-dashed rounded-lg opacity-50" />
                </div>

                {/* Capture Button */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-emerald-400 transition-colors flex items-center justify-center"
                  >
                    <div className="w-12 h-12 bg-gray-300 rounded-full" />
                  </button>
                </div>

                {/* Back Button */}
                <div className="absolute top-4 left-4">
                  <button
                    onClick={() => {
                      closeCamera()
                      setCurrentStep('landing')
                    }}
                    className="p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Position the receipt within the frame and tap the capture button
                </p>
              </div>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Receipt Image Preview */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Receipt Image</h4>
                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Receipt"
                        className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Extracted Data Form */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Extracted Data</h4>
                    {isProcessing && (
                      <div className="flex items-center space-x-2 text-emerald-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Reading receipt...</span>
                      </div>
                    )}
                  </div>

                  {extractedData && !isProcessing && (
                    <div className="space-y-4">
                      {/* Merchant */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Merchant
                          </label>
                          <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                            getConfidenceColor(extractedData.confidence.merchant)
                          )}>
                            {getConfidenceIcon(extractedData.confidence.merchant)}
                            <span>{extractedData.confidence.merchant}</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={extractedData.merchant}
                          onChange={(e) => setExtractedData({
                            ...extractedData,
                            merchant: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Amount
                          </label>
                          <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                            getConfidenceColor(extractedData.confidence.amount)
                          )}>
                            {getConfidenceIcon(extractedData.confidence.amount)}
                            <span>{extractedData.confidence.amount}</span>
                          </div>
                        </div>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <select
                            value={extractedData.currency}
                            onChange={(e) => setExtractedData({
                              ...extractedData,
                              currency: e.target.value
                            })}
                            className="rounded-l-md border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                          >
                            <option value="BRL">BRL</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                          <input
                            type="number"
                            step="0.01"
                            value={extractedData.amount}
                            onChange={(e) => setExtractedData({
                              ...extractedData,
                              amount: parseFloat(e.target.value) || 0
                            })}
                            className="flex-1 rounded-r-md border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Date
                          </label>
                          <div className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                            getConfidenceColor(extractedData.confidence.date)
                          )}>
                            {getConfidenceIcon(extractedData.confidence.date)}
                            <span>{extractedData.confidence.date}</span>
                          </div>
                        </div>
                        <input
                          type="date"
                          value={extractedData.date}
                          onChange={(e) => setExtractedData({
                            ...extractedData,
                            date: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Category
                        </label>
                        <select
                          value={extractedData.category}
                          onChange={(e) => setExtractedData({
                            ...extractedData,
                            category: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                        >
                          {expenseCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentStep('landing')}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={!extractedData || isSaving}
                  className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSaving ? 'Saving...' : 'Save Expense'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Manual Entry Step */}
          {currentStep === 'manual' && (
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Merchant / Description
                  </label>
                  <input
                    type="text"
                    placeholder="Enter merchant name or expense description"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <select className="rounded-l-md border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100">
                        <option value="BRL">BRL</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="flex-1 rounded-r-md border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date
                    </label>
                    <input
                      type="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:bg-gray-700 dark:text-gray-100">
                    {expenseCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Receipt (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                          <span>Upload a file</span>
                          <input type="file" accept="image/*" className="sr-only" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 20MB</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentStep('landing')}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Back
                </button>
                <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  Save Expense
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  )
}