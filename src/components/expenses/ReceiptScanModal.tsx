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

  // Initialize camera with high quality settings
  const startCamera = async () => {
    try {
      // Request highest quality video for clearer receipt scanning
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 3840, min: 1920 }, // Request 4K if available, min Full HD
          height: { ideal: 2160, min: 1080 }, // Request 4K if available, min Full HD
          aspectRatio: { ideal: 16/9 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video metadata to load before playing
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve()
            }
          }
        })
        
        // Play video
        await videoRef.current.play()
        console.log('📹 Camera started successfully with resolution:', {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        })
      }
      
      setCurrentStep('camera')
      setError(null) // Clear any previous errors
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Camera access denied. Please allow camera permissions or use file upload.')
    }
  }

  // Capture photo with high quality
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.error('❌ Could not get canvas context')
      setError('Failed to capture image. Please try again.')
      return
    }

    // Use full video resolution for better OCR results
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    console.log('📸 Capturing photo at resolution:', {
      width: canvas.width,
      height: canvas.height
    })

    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0)
    
    // Convert to JPEG with good quality (0.92 = high quality with reasonable file size)
    const imageData = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedImage(imageData)

    console.log('✅ Photo captured successfully, size:', Math.round(imageData.length / 1024), 'KB')

    // Stop camera stream to free resources
    const stream = video.srcObject as MediaStream
    stream.getTracks().forEach(track => {
      track.stop()
      console.log('📹 Camera track stopped:', track.kind)
    })

    // Process the captured image
    processImage(imageData)
  }

  // Process captured or uploaded image
  const processImage = async (imageData: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      console.log('🔄 Starting image processing...')
      
      // Convert base64 to blob
      const response = await fetch(imageData)
      const blob = await response.blob()

      console.log('📦 Image blob created:', {
        size: Math.round(blob.size / 1024) + ' KB',
        type: blob.type
      })

      // Create form data
      const formData = new FormData()
      formData.append('image', blob, 'receipt.jpg')

      console.log('📤 Sending to Google Vision OCR API...')

      // Send to Google Vision OCR
      const ocrResponse = await fetch('/api/receipts/google-ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      console.log('📥 OCR API response:', {
        status: ocrResponse.status,
        statusText: ocrResponse.statusText,
        ok: ocrResponse.ok
      })

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ OCR API error:', errorData)
        throw new Error(errorData.error || `OCR failed with status ${ocrResponse.status}`)
      }

      const result = await ocrResponse.json()
      console.log('✅ OCR result received:', {
        success: result.success,
        merchant: result.merchant,
        amount: result.amount,
        hasRawText: !!result.rawText
      })

      if (result.success) {
        setReceiptData(result)
        setCurrentStep('review')
      } else {
        throw new Error(result.error || 'OCR processing failed')
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process receipt. Please try again.'
      console.error('❌ OCR processing error:', err)
      setError(errorMessage)
      
      // Reset to landing page so user can try again
      setTimeout(() => {
        setCurrentStep('landing')
      }, 3000)
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
    setError(null) // Clear previous errors
    
    console.log('💾 Saving expense:', {
      trip_id: tripId,
      amount: receiptData.amount,
      currency: receiptData.currency,
      category: receiptData.category,
      merchant: receiptData.merchant,
      date: receiptData.date
    })
    
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

      console.log('📥 Save expense response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Failed to save expense:', errorData)
        throw new Error(errorData.error || `Failed to save expense (${response.status})`)
      }

      const result = await response.json()
      console.log('✅ Expense saved successfully:', result)

      onExpenseAdded?.(receiptData)
      onClose()
      resetModal()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save expense. Please try again.'
      console.error('❌ Save expense error:', err)
      setError(errorMessage)
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

          {/* Top controls - close button only */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => {
                resetModal()
                setCurrentStep('landing')
              }}
              className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Helper text - positioned at top center */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm whitespace-nowrap">
              Position receipt in frame
            </div>
          </div>

          {/* Capture button - positioned much higher to avoid bottom bar */}
          <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={capturePhoto}
              className="bg-white text-gray-900 p-6 rounded-full shadow-2xl hover:scale-105 transition-transform active:scale-95"
            >
              <Camera className="w-10 h-10" />
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
              <label className="text-sm text-gray-500 dark:text-gray-400">Amount & Currency</label>
              <div className="flex gap-2 items-center mt-1">
                <select
                  value={receiptData.currency}
                  onChange={(e) => setReceiptData({ ...receiptData, currency: e.target.value })}
                  className="w-32 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 font-medium"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CHF">CHF</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="DKK">DKK (kr)</option>
                  <option value="SEK">SEK (kr)</option>
                  <option value="NOK">NOK (kr)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="MXN">MXN ($)</option>
                  <option value="ARS">ARS ($)</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={receiptData.amount}
                  onChange={(e) => setReceiptData({ ...receiptData, amount: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 font-medium"
                />
              </div>
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