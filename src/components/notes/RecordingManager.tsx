'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Camera, Image, Play, Pause, Square, Volume2, VolumeX } from 'lucide-react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

interface MediaEntry {
  id: string
  timestamp: number
  type: 'image' | 'audio' | 'transcript'
  content: string | File
  description?: string
  relativeTime: string
}

interface RecordingManagerProps {
  onTranscriptUpdate: (transcript: string) => void
  onMediaAdd: (media: MediaEntry) => void
  isRecording: boolean
  onRecordingStateChange: (recording: boolean) => void
}

export default function RecordingManager({
  onTranscriptUpdate,
  onMediaAdd,
  isRecording,
  onRecordingStateChange
}: RecordingManagerProps) {
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [audioLevel, setAudioLevel] = useState<number>(0)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Speech recognition hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition({
    transcribing: isRecording,
    clearTranscriptOnListen: false
  })

  // Update transcript when it changes
  useEffect(() => {
    if (transcript && isRecording) {
      onTranscriptUpdate(transcript)
    }
  }, [transcript, isRecording, onTranscriptUpdate])

  // Track recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const now = new Date().getTime()
        const start = recordingStartTime.getTime()
        setRecordingDuration(Math.floor((now - start) / 1000))
      }, 1000)
    } else {
      setRecordingDuration(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRecording, recordingStartTime])

  // Audio level visualization
  useEffect(() => {
    if (isRecording && mediaRecorder && mediaRecorder.stream) {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        
        const source = audioContextRef.current.createMediaStreamSource(mediaRecorder.stream)
        source.connect(analyserRef.current)
        
        analyserRef.current.fftSize = 256
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        
        const updateAudioLevel = () => {
          if (analyserRef.current && isRecording) {
            analyserRef.current.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            setAudioLevel(average / 255)
            requestAnimationFrame(updateAudioLevel)
          }
        }
        
        updateAudioLevel()
      }
    }
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.close()
        audioContextRef.current = null
        analyserRef.current = null
      }
    }
  }, [isRecording, mediaRecorder])

  const startRecording = async () => {
    try {
      // Request microphone permission first
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support microphone access. Please use Chrome, Firefox, or Safari.')
        return
      }

      // Ask for permission
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (permission.state === 'denied') {
        alert('Microphone permission denied. Please enable microphone access in your browser settings and try again.')
        return
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      // Setup MediaRecorder for audio backup
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav'
      })
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: recorder.mimeType })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Add audio recording to media timeline
        const mediaEntry: MediaEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'audio',
          content: audioBlob,
          description: 'Meeting recording',
          relativeTime: formatRelativeTime(Date.now() - (recordingStartTime?.getTime() || 0))
        }
        
        onMediaAdd(mediaEntry)
        setAudioChunks([])
      }
      
      recorder.start(1000) // Record in 1-second chunks
      setMediaRecorder(recorder)
      setRecordingStartTime(new Date())
      
      // Start speech recognition
      await SpeechRecognition.startListening({
        continuous: true,
        language: 'en-US'
      })
      
      onRecordingStateChange(true)
    } catch (error: any) {
      console.error('Error starting recording:', error)
      
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please click "Allow" when prompted, or enable microphone access in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.')
      } else if (error.name === 'NotSupportedError') {
        alert('Your browser does not support audio recording. Please use Chrome, Firefox, or Safari.')
      } else {
        alert('Could not access microphone. Please check your browser settings and try again.')
      }
    }
  }

  const stopRecording = () => {
    // Stop speech recognition
    SpeechRecognition.stopListening()
    
    // Stop MediaRecorder
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    
    // Stop media stream
    if (mediaRecorder?.stream) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
    
    // Add final transcript to timeline
    if (transcript.trim()) {
      const transcriptEntry: MediaEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'transcript',
        content: transcript,
        description: 'Meeting transcript',
        relativeTime: formatRelativeTime(Date.now() - (recordingStartTime?.getTime() || 0))
      }
      
      onMediaAdd(transcriptEntry)
    }
    
    setRecordingStartTime(null)
    setMediaRecorder(null)
    onRecordingStateChange(false)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment' // Use back camera if available
        } 
      })
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setShowCamera(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const imageEntry: MediaEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'image',
            content: blob,
            description: 'Camera capture',
            relativeTime: formatRelativeTime(Date.now() - (recordingStartTime?.getTime() || 0))
          }
          
          onMediaAdd(imageEntry)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const imageEntry: MediaEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: 'image',
            content: file,
            description: `Uploaded: ${file.name}`,
            relativeTime: formatRelativeTime(Date.now() - (recordingStartTime?.getTime() || 0))
          }
          
          onMediaAdd(imageEntry)
        }
      })
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatRelativeTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
    }
  }

  const formatRecordingTime = (): string => {
    if (!recordingStartTime) return '0:00'
    return formatRelativeTime(Date.now() - recordingStartTime.getTime())
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  if (!browserSupportsSpeechRecognition) {
    return (
      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Speech recognition is not supported in this browser. Audio recording will still work.
        </p>
      </div>
    )
  }

  if (!isMicrophoneAvailable) {
    return (
      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-sm text-red-800 dark:text-red-200">
          Microphone access is required for recording and transcription.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Recording Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Record</span>
            </>
          )}
        </button>

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                {formatDuration(recordingDuration)}
              </span>
            </div>
            
            {/* Audio Level */}
            <div className="flex items-center space-x-1">
              {audioLevel > 0.1 ? (
                <Volume2 className="w-4 h-4 text-green-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
              <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-150"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Camera Controls */}
        <div className="flex items-center space-x-2 border-l border-gray-300 dark:border-gray-600 pl-3">
          <button
            onClick={showCamera ? stopCamera : startCamera}
            className={`p-2 rounded-lg transition-colors ${
              showCamera
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
            title={showCamera ? 'Stop camera' : 'Start camera'}
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            title="Upload images"
          >
            <Image className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Live Transcript */}
      {isRecording && transcript && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Live Transcript</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 italic">
            "{transcript}"
          </p>
        </div>
      )}

      {/* Camera View */}
      {showCamera && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-black rounded-lg object-cover"
          />
          <button
            onClick={captureImage}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-colors"
            title="Capture image"
          >
            <Camera className="w-5 h-5" />
          </button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}