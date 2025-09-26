'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, Camera, Upload, Zap, RotateCcw, Check, AlertCircle, FileText, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ExtractedReceiptData {
  amount: number
  currency: string
  date: string
  venue: string
  category: 'transport' | 'accommodation' | 'meals' | 'activities' | 'business' | 'other'
  cardLast4?: string
  isPersonalCard?: boolean
  confidence: number
  extractedText: string
}

interface MobileReceiptScannerProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onExpenseAdded?: (expense: any) => void
}

type ScannerStep = 'camera' | 'preview' | 'extracted' | 'confirm'

export default function MobileReceiptScanner({ isOpen, onClose, tripId, onExpenseAdded }: MobileReceiptScannerProps) {
  // Device detection
  const [isMobile, setIsMobile] = useState(false)
  
  // Core state
  const [currentStep, setCurrentStep] = useState<ScannerStep>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Camera state
  const [isStreaming, setIsStreaming] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device or connection')
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 3/4 } // Better for receipt scanning
        },
        audio: false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err: any) {
      console.error('Camera access error:', err)
      
      let errorMessage = 'Camera access denied.'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported. Try using HTTPS or a supported browser.'
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.'
      } else if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        errorMessage = 'Camera requires HTTPS connection. Please use the Vercel deployment link or localhost.'
      }
      
      setError(errorMessage)
    }
  }, [facingMode])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }, [])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !isStreaming) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' })
        const imageUrl = URL.createObjectURL(blob)
        
        setCapturedFile(file)
        setCapturedImage(imageUrl)
        setCurrentStep('preview')
        stopCamera()
        
        // Vibrate for feedback (if supported)
        if (navigator.vibrate) {
          navigator.vibrate(100)
        }
      }
    }, 'image/jpeg', 0.9)
  }, [isStreaming, stopCamera])

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    const imageUrl = URL.createObjectURL(file)
    setCapturedFile(file)
    setCapturedImage(imageUrl)
    setCurrentStep('preview')
    stopCamera()
  }, [stopCamera])

  // Process receipt with OCR using Google Vision API
  const processReceipt = useCallback(async () => {
    console.log('🚀 processReceipt called', { hasCapturedFile: !!capturedFile })
    if (!capturedFile) return

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', capturedFile) // Google Vision API expects 'image' field

      // Use Google Vision API endpoint for better OCR results
      console.log('📡 Calling OCR API endpoint...')
      const response = await fetch('/api/receipts/google-ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      console.log('📡 OCR API response:', { status: response.status, ok: response.ok })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ OCR API error response:', errorText)
        throw new Error('Failed to process receipt')
      }

      const result = await response.json()
      console.log('✅ OCR result received:', { success: result.success, amount: result.amount, merchant: result.merchant })

      if (result.success) {
        setExtractedData({
          amount: result.amount || 0,
          currency: result.currency || 'BRL',
          date: result.date || new Date().toISOString().split('T')[0],
          venue: result.merchant || 'Unknown Venue',
          category: result.category || 'other',
          cardLast4: undefined, // Google Vision doesn't extract card info
          isPersonalCard: undefined,
          confidence: result.confidence?.amount === 'high' ? 0.9 : 
                     result.confidence?.amount === 'medium' ? 0.7 : 0.5,
          extractedText: result.rawText || ''
        })
        setCurrentStep('extracted')
      } else {
        throw new Error(result.error || 'Failed to extract data')
      }
    } catch (err) {
      console.error('Google Vision OCR failed:', err)
      setError('Failed to read receipt. You can enter the details manually.')
      // Still go to extracted step but with empty data for manual entry
      setExtractedData({
        amount: 0,
        currency: 'BRL',
        date: new Date().toISOString().split('T')[0],
        venue: 'Enter venue name',
        category: 'other',
        confidence: 0,
        extractedText: 'Manual entry required'
      })
      setCurrentStep('extracted')
    } finally {
      setIsProcessing(false)
    }
  }, [capturedFile])

  // Save expense
  const saveExpense = useCallback(async () => {
    if (!extractedData) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trip_id: tripId,
          amount: extractedData.amount,
          currency: extractedData.currency,
          category: extractedData.category,
          description: `${extractedData.venue} - ${extractedData.date}`,
          expense_date: extractedData.date,
          expense_location: extractedData.venue,
          card_last_four: extractedData.cardLast4,
          is_personal_card: extractedData.isPersonalCard,
          requires_reimbursement: extractedData.isPersonalCard
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save expense')
      }

      onExpenseAdded?.(extractedData)
      onClose()
      resetScanner()
    } catch (err) {
      console.error('Failed to save expense:', err)
      setError('Failed to save expense. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [extractedData, tripId, onExpenseAdded, onClose])

  // Reset scanner state
  const resetScanner = useCallback(() => {
    setCurrentStep('camera')
    setCapturedImage(null)
    setCapturedFile(null)
    setExtractedData(null)
    setIsProcessing(false)
    setError(null)
    
    // Clean up image URLs
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage)
    }
  }, [capturedImage])

  // Toggle camera facing mode
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // Handle modal open/close
  useEffect(() => {
    if (isOpen && currentStep === 'camera' && isMobile) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, currentStep, isMobile, startCamera, stopCamera])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY
      
      // Lock body scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Restore scroll position
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera()
    }
  }, [facingMode, startCamera, isStreaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [capturedImage])

  if (!isOpen) return null

  return (
    <div 
      className="fixed bg-black z-[9999] flex flex-col overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100dvh', // Use dynamic viewport height for mobile
        minHeight: '100vh',
        width: '100vw',
        zIndex: 9999,
        maxHeight: '100vh'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white relative z-10">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6" />
          <div>
            <h2 className="text-lg font-semibold">
              {currentStep === 'camera' ? (isMobile ? 'Scan Receipt' : 'Upload Receipts') : 
               currentStep === 'preview' ? 'Receipt Preview' :
               currentStep === 'extracted' ? 'Verify Details' : 'Confirm Expense'}
            </h2>
            <p className="text-sm text-emerald-100">
              {currentStep === 'camera' ? (isMobile ? 'Position receipt in frame' : 'Select receipt images from your computer') :
               currentStep === 'preview' ? 'Ready to scan' :
               currentStep === 'extracted' ? 'Review extracted data' : 'Ready to save'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentStep === 'camera' && isMobile && (
            <button
              onClick={toggleCamera}
              className="p-2 hover:bg-emerald-800 rounded-lg transition-colors"
              title="Flip camera"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => {
              resetScanner()
              onClose()
            }}
            className="p-2 hover:bg-emerald-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Camera Step */}
        {currentStep === 'camera' && (
          <>
            {!isMobile ? (
              /* Desktop File Upload Interface */
              <div className="flex flex-col h-full bg-white dark:bg-gray-900 p-8">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Upload Receipt Images</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Select one or more receipt images from your computer
                    </p>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        Choose Files
                      </button>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Supports: JPG, PNG, WebP, GIF (max 20MB each)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col h-full bg-gray-900">
                {/* Error content and buttons centered together */}
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center text-white max-w-md">
                    <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">Camera Access Required</p>
                    <p className="text-gray-400 mb-8">{error}</p>
                    
                    {/* Buttons moved up to be part of centered content */}
                    <div className="space-y-3">
                      <button
                        onClick={startCamera}
                        className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Camera className="w-5 h-5" />
                        Try Camera Again
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        Upload Image Instead
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Video stream */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Receipt Frame Overlay with cutout for clear center */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Create 4 blur rectangles around the center frame */}
                  {/* Top blur area */}
                  <div className="absolute top-0 left-0 right-0 backdrop-blur-lg bg-black/40" 
                       style={{ height: 'calc(50% - 192px)' }}></div>
                  
                  {/* Bottom blur area */}
                  <div className="absolute bottom-0 left-0 right-0 backdrop-blur-lg bg-black/40" 
                       style={{ height: 'calc(50% - 192px)' }}></div>
                  
                  {/* Left blur area */}
                  <div className="absolute left-0 backdrop-blur-lg bg-black/40" 
                       style={{ 
                         top: 'calc(50% - 192px)', 
                         height: '384px',
                         width: 'calc(50% - 160px)'
                       }}></div>
                  
                  {/* Right blur area */}
                  <div className="absolute right-0 backdrop-blur-lg bg-black/40" 
                       style={{ 
                         top: 'calc(50% - 192px)', 
                         height: '384px',
                         width: 'calc(50% - 160px)'
                       }}></div>
                  
                  {/* Position the receipt frame */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-80 h-96 max-w-[90vw] max-h-[60vh]">
                      
                      {/* Receipt frame border */}
                      <div className="absolute inset-0 border-4 border-emerald-400 rounded-2xl bg-transparent shadow-lg z-10">
                        {/* Corner guides */}
                        <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl shadow-lg"></div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl shadow-lg"></div>
                        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl shadow-lg"></div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl shadow-lg"></div>
                      </div>
                      
                      {/* Instructions inside clear frame */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-20">
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 mb-4 shadow-lg">
                          <p className="text-sm font-medium text-center">📄 Fit entire receipt in frame</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top tip */}
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 max-w-xs z-20">
                  <p className="text-white text-xs text-center">
                    💡 Keep receipt flat, well-lit, and avoid shadows
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && capturedImage && (
          <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative max-w-full max-h-full">
                <Image
                  src={capturedImage}
                  alt="Captured receipt"
                  width={400}
                  height={500}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Extracted Data Step */}
        {currentStep === 'extracted' && extractedData && (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Receipt Preview */}
              {capturedImage && (
                <div className="flex justify-center">
                  <div className="relative">
                    <Image
                      src={capturedImage}
                      alt="Receipt"
                      width={200}
                      height={250}
                      className="rounded-lg shadow-md object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Extracted Data Form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Extracted Data</h3>
                  {extractedData.confidence > 0.7 ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">High Confidence</span>
                  ) : extractedData.confidence > 0.4 ? (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Medium Confidence</span>
                  ) : (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Low Confidence</span>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <div className="flex gap-2">
                    <select 
                      value={extractedData.currency}
                      onChange={(e) => setExtractedData({...extractedData, currency: e.target.value})}
                      className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="BRL">BRL</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={extractedData.amount}
                      onChange={(e) => setExtractedData({...extractedData, amount: parseFloat(e.target.value) || 0})}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={extractedData.date}
                    onChange={(e) => setExtractedData({...extractedData, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Venue</label>
                  <input
                    type="text"
                    value={extractedData.venue}
                    onChange={(e) => setExtractedData({...extractedData, venue: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Enter venue name"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({...extractedData, category: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="transport">Transportation</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="meals">Meals & Drinks</option>
                    <option value="activities">Activities</option>
                    <option value="business">Business</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Payment Method */}
                {extractedData.cardLast4 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</h4>
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-gray-200 dark:bg-gray-600 rounded">
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {extractedData.isPersonalCard ? 'Personal' : 'Company'} Card •••• {extractedData.cardLast4}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Processing Notice</h4>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
        {currentStep === 'camera' && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <Upload className="w-6 h-6" />
            </button>
            <button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className={cn(
                "w-16 h-16 rounded-full border-4 border-emerald-500 bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center",
                !isStreaming && "opacity-50 cursor-not-allowed"
              )}
            >
              <Camera className="w-8 h-8 text-white" />
            </button>
            <div className="w-12"></div> {/* Spacer for symmetry */}
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentStep('camera')
                startCamera()
              }}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={processReceipt}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Reading...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Scan Receipt
                </>
              )}
            </button>
          </div>
        )}

        {currentStep === 'extracted' && (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentStep('camera')
                startCamera()
              }}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={saveExpense}
              disabled={isProcessing || !extractedData?.amount || !extractedData?.venue}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save Expense
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={!isMobile}
        capture={isMobile ? "environment" : undefined}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
        }}
        className="hidden"
      />
    </div>
  )
}