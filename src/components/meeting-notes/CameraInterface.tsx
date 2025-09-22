'use client'

import React, { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

interface CameraInterfaceProps {
  isCameraOpen: boolean
  setIsCameraOpen: React.Dispatch<React.SetStateAction<boolean>>
  setCapturedImages: React.Dispatch<React.SetStateAction<File[]>>
  isEditing: boolean
}

export default function CameraInterface({
  isCameraOpen,
  setIsCameraOpen,
  setCapturedImages,
  isEditing
}: CameraInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Use back camera on mobile
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        cameraStreamRef.current = stream
      }
      setIsCameraOpen(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check your permissions.')
    }
  }

  const closeCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob and create file
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `conference-slide-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setCapturedImages(prev => [...prev, file])
      }
    }, 'image/jpeg', 0.9)
  }

  if (!isEditing) {
    return null
  }

  return (
    <div>
      {/* Camera Button */}
      {!isCameraOpen && (
        <button
          onClick={openCamera}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          <span>Open Camera</span>
        </button>
      )}

      {/* Camera Interface */}
      {isCameraOpen && (
        <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111111]">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Camera</h4>
              <button
                onClick={closeCamera}
                className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center"
                >
                  <div className="w-12 h-12 bg-gray-300 rounded-full" />
                </button>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  )
}