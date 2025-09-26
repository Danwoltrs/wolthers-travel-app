'use client'

import React, { useState, useCallback, useRef } from 'react'
import { X, Camera, Check, Edit2, Plus, ChevronRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReceiptData {
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
  items: any[]
  rawText: string
}

interface ReceiptScanModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onExpenseAdded?: (expense: any) => void
}

export default function ReceiptScanModal({ isOpen, onClose, tripId, onExpenseAdded }: ReceiptScanModalProps) {
  const [currentStep, setCurrentStep] = useState<'landing' | 'camera' | 'review' | 'manual'>('landing')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCurrentStep('camera')
    } catch (err) {
      setError('Could not access camera. Please use file upload instead.')
    }
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    ctx?.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageData)

    // Stop camera stream
    const stream = video.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())

    // Process the captured image
    processImage(imageData)
  }

  // Process captured or uploaded image
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
        setCurrentStep('review')
      } else {
        throw new Error(result.error || 'OCR processing failed')
      }

    } catch (err) {
      setError('Failed to process receipt. Please try again.')
      console.error('OCR error:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setCapturedImage(result)
      processImage(result)
    }
    reader.readAsDataURL(file)
  }

  // Save expense
  const saveExpense = async () => {
    if (!receiptData) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trip_id: tripId,
          amount: receiptData.amount,
          currency: receiptData.currency,
          category: receiptData.category,
          description: `${receiptData.merchant} - ${receiptData.date}`,
          expense_date: receiptData.date,
          expense_location: receiptData.merchant
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save expense')
      }

      onExpenseAdded?.(receiptData)
      onClose()
      resetModal()
    } catch (err) {
      setError('Failed to save expense. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setCurrentStep('landing')
    setCapturedImage(null)
    setReceiptData(null)
    setError(null)
    setIsProcessing(false)

    // Stop any active camera streams
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      {currentStep === 'landing' && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 m-4 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Scan Receipt
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Take a photo or upload an image to extract expense details
          </p>

          <div className="space-y-3">
            <button
              onClick={startCamera}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>

            <label className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              Upload Image
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={() => {
              resetModal()
              onClose()
            }}
            className="mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {currentStep === 'camera' && (
        <div className="relative w-full h-full flex flex-col">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="flex-1 object-cover"
          />

          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button
              onClick={() => {
                resetModal()
                setCurrentStep('landing')
              }}
              className="bg-black/20 backdrop-blur-sm text-white p-2 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="bg-black/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
              Position receipt in frame
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={capturePhoto}
              className="bg-white text-gray-900 p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
            >
              <Camera className="w-8 h-8" />
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {currentStep === 'review' && receiptData && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 m-4 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Review Details
            </h2>
            <button
              onClick={() => {
                resetModal()
                onClose()
              }}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {capturedImage && (
            <div className="mb-4">
              <img
                src={capturedImage}
                alt="Captured receipt"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Merchant</label>
              <p className="font-medium text-gray-900 dark:text-white">{receiptData.merchant}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  receiptData.confidence.merchant === 'high' ? 'bg-green-500' :
                  receiptData.confidence.merchant === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {receiptData.confidence.merchant} confidence
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Amount</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {receiptData.currency} {receiptData.amount.toFixed(2)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  receiptData.confidence.amount === 'high' ? 'bg-green-500' :
                  receiptData.confidence.amount === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {receiptData.confidence.amount} confidence
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Date</label>
              <p className="font-medium text-gray-900 dark:text-white">{receiptData.date}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  receiptData.confidence.date === 'high' ? 'bg-green-500' :
                  receiptData.confidence.date === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {receiptData.confidence.date} confidence
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Category</label>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{receiptData.category}</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setCurrentStep('manual')}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={saveExpense}
              disabled={isProcessing}
              className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>
      )}

      {isProcessing && currentStep !== 'review' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Processing receipt...</p>
          </div>
        </div>
      )}
    </div>
  )
}