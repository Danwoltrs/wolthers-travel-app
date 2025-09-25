'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { X, Camera, Zap, RotateCcw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LiveOCRCameraProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

interface DetectedText {
  text: string
  bbox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
}

export default function LiveOCRCamera({ isOpen, onClose, onCapture }: LiveOCRCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()

  const [isStreaming, setIsStreaming] = useState(false)
  const [detectedText, setDetectedText] = useState<DetectedText[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [error, setError] = useState<string | null>(null)

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError(null)
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
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
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Camera access denied. Please enable camera permissions.')
    }
  }, [facingMode])

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Lightweight text detection using Web APIs (if available)
  const detectTextInFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current || isProcessing) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const overlayCanvas = overlayCanvasRef.current
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    overlayCanvas.width = video.videoWidth  
    overlayCanvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    const overlayCtx = overlayCanvas.getContext('2d')
    
    if (!ctx || !overlayCtx) return

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Clear previous overlay
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

    try {
      // Check if browser supports text detection
      if ('TextDetector' in window) {
        setIsProcessing(true)
        // @ts-ignore - TextDetector is experimental
        const textDetector = new TextDetector()
        const detectedTexts = await textDetector.detect(canvas)
        
        const textData: DetectedText[] = detectedTexts.map((detection: any) => ({
          text: detection.rawValue,
          bbox: detection.boundingBox,
          confidence: 1.0 // TextDetector doesn't provide confidence
        }))

        setDetectedText(textData)
        drawTextOverlay(overlayCtx, textData, canvas.width, canvas.height)
        setIsProcessing(false)
      } else {
        // Fallback: Use a simplified approach with contrast detection
        detectHighContrastAreas(ctx, overlayCtx, canvas.width, canvas.height)
      }
    } catch (err) {
      console.log('Text detection not available, using fallback')
      detectHighContrastAreas(ctx, overlayCtx, canvas.width, canvas.height)
      setIsProcessing(false)
    }

    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(detectTextInFrame)
  }, [isProcessing])

  // Draw text overlay on detected areas
  const drawTextOverlay = (ctx: CanvasRenderingContext2D, textData: DetectedText[], canvasWidth: number, canvasHeight: number) => {
    ctx.strokeStyle = '#10B981' // Emerald green
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'
    ctx.lineWidth = 2
    ctx.font = '12px Inter, sans-serif'

    textData.forEach((detection) => {
      const { bbox, text, confidence } = detection
      
      // Draw bounding box
      ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height)
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height)
      
      // Draw text if confidence is high enough
      if (confidence > 0.7 && text.trim().length > 2) {
        ctx.fillStyle = '#10B981'
        ctx.fillText(text.substring(0, 20), bbox.x, bbox.y - 5)
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'
      }
    })
  }

  // Fallback: Detect high contrast areas that might contain text
  const detectHighContrastAreas = (ctx: CanvasRenderingContext2D, overlayCtx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data
    
    // Simple edge detection for text-like regions
    const threshold = 50
    const regions: Array<{x: number, y: number, width: number, height: number}> = []
    
    // Sample every 20 pixels for performance
    for (let y = 0; y < height - 20; y += 20) {
      for (let x = 0; x < width - 20; x += 20) {
        const i = (y * width + x) * 4
        const nextI = ((y + 1) * width + x) * 4
        
        if (i < data.length && nextI < data.length) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
          const nextGray = (data[nextI] + data[nextI + 1] + data[nextI + 2]) / 3
          
          if (Math.abs(gray - nextGray) > threshold) {
            regions.push({x, y, width: 60, height: 20})
          }
        }
      }
    }

    // Draw detected regions
    overlayCtx.strokeStyle = '#F59E0B' // Amber
    overlayCtx.fillStyle = 'rgba(245, 158, 11, 0.1)'
    overlayCtx.lineWidth = 1
    
    regions.forEach(region => {
      overlayCtx.fillRect(region.x, region.y, region.width, region.height)
      overlayCtx.strokeRect(region.x, region.y, region.width, region.height)
    })
  }

  // Capture current frame
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture(file)
        stopCamera()
        onClose()
      }
    }, 'image/jpeg', 0.9)
  }, [onCapture, onClose, stopCamera])

  // Toggle camera facing mode
  const toggleCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }, [])

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
      // Start text detection after a short delay
      setTimeout(() => {
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          detectTextInFrame()
        }
      }, 1000)
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera, detectTextInFrame])

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera()
    }
  }, [facingMode, startCamera, isStreaming])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm text-white relative z-10">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-lg font-semibold">Live OCR Camera</h2>
            <p className="text-sm text-gray-300">Point at receipt text to see live detection</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Flip camera"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              stopCamera()
              onClose()
            }}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera Preview */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">Camera Access Required</p>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Try Again
              </button>
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
            
            {/* Text overlay canvas */}
            <canvas
              ref={overlayCanvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ zIndex: 2 }}
            />
            
            {/* Hidden canvas for processing */}
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Receipt Frame Guide */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
              {/* Receipt-shaped frame guide */}
              <div className="absolute inset-x-8 top-16 bottom-32">
                <div className="relative w-full h-full max-w-sm mx-auto">
                  {/* Main receipt frame */}
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/80 rounded-lg bg-emerald-400/5">
                    {/* Corner guides */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                    
                    {/* Receipt sections guide */}
                    <div className="absolute inset-2">
                      {/* Header section */}
                      <div className="h-12 border-b border-emerald-400/50 flex items-center justify-center">
                        <span className="text-emerald-400 text-xs font-medium">STORE NAME</span>
                      </div>
                      
                      {/* Items section */}
                      <div className="flex-1 py-2 space-y-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-3 bg-emerald-400/20 rounded opacity-50"></div>
                        ))}
                      </div>
                      
                      {/* Total section */}
                      <div className="h-8 border-t border-emerald-400/50 flex items-center justify-center">
                        <span className="text-emerald-400 text-xs font-medium">TOTAL</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Center crosshairs */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-emerald-400"></div>
                    <div className="w-0.5 h-8 bg-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 max-w-xs">
                <p className="text-white text-xs text-center leading-relaxed">
                  {detectedText.length > 0 
                    ? `🎯 ${detectedText.length} text regions detected - tap capture when ready`
                    : "📄 Position receipt within frame for best results"
                  }
                </p>
              </div>
              
              {/* Tips */}
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 max-w-sm">
                <div className="text-white text-xs text-center space-y-1">
                  <p className="font-medium text-emerald-400">💡 Tips for best results:</p>
                  <p>• Fit entire receipt in frame</p>
                  <p>• Ensure good lighting</p>
                  <p>• Keep receipt flat & straight</p>
                  <p>• Avoid shadows & glare</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-black/80 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center">
          <button
            onClick={captureFrame}
            disabled={!isStreaming}
            className={cn(
              "w-16 h-16 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex items-center justify-center",
              !isStreaming && "opacity-50 cursor-not-allowed"
            )}
          >
            <Check className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-300">
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isStreaming ? "bg-emerald-400" : "bg-red-400"
            )} />
            <span>{isStreaming ? 'Live' : 'Connecting...'}</span>
          </div>
          
          {isProcessing && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Detecting...</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3" />
            <span>{facingMode === 'environment' ? 'Back' : 'Front'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}