'use client'

import React, { useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, StopCircle, RotateCcw } from 'lucide-react'

interface AudioRecorderProps {
  isRecording: boolean
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>
  recordingTime: number
  setRecordingTime: React.Dispatch<React.SetStateAction<number>>
  audioBlob: Blob | null
  setAudioBlob: React.Dispatch<React.SetStateAction<Blob | null>>
  isTranscribing: boolean
  setIsTranscribing: React.Dispatch<React.SetStateAction<boolean>>
  transcription: string
  setTranscription: React.Dispatch<React.SetStateAction<string>>
  isPlaying: boolean
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>
  audioWaveform: number[]
  setAudioWaveform: React.Dispatch<React.SetStateAction<number[]>>
  isEditing: boolean
}

export default function AudioRecorder({
  isRecording,
  setIsRecording,
  recordingTime,
  setRecordingTime,
  audioBlob,
  setAudioBlob,
  isTranscribing,
  setIsTranscribing,
  transcription,
  setTranscription,
  isPlaying,
  setIsPlaying,
  audioWaveform,
  setAudioWaveform,
  isEditing
}: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, setRecordingTime])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      // Set up audio analysis for waveform visualization
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      analyserRef.current = analyser
      
      // Update waveform visualization
      const updateWaveform = () => {
        if (analyser && isRecording) {
          analyser.getByteFrequencyData(dataArray)
          const waveform = Array.from(dataArray).slice(0, 20).map(value => value / 255)
          setAudioWaveform(waveform)
          requestAnimationFrame(updateWaveform)
        }
      }
      updateWaveform()

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
        audioContext.close()
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please check your permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioWaveform([])
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return
    
    setIsTranscribing(true)
    try {
      // Convert blob to base64 for API
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = reader.result as string
        
        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              audio: base64Audio.split(',')[1], // Remove data:audio/webm;base64, prefix
              mimeType: 'audio/webm'
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            setTranscription(data.transcription || 'No speech detected')
          } else {
            throw new Error('Transcription failed')
          }
        } catch (error) {
          console.error('Transcription error:', error)
          setTranscription('Transcription failed. Please try again.')
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Error preparing audio for transcription:', error)
      setTranscription('Error processing audio. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const playAudio = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current.src = audioUrl
      audioRef.current.play()
      setIsPlaying(true)
      
      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const resetRecording = () => {
    setAudioBlob(null)
    setTranscription('')
    setRecordingTime(0)
    setIsPlaying(false)
    setAudioWaveform([])
  }

  if (!isEditing && !audioBlob) {
    return null
  }

  return (
    <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111111]">
      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Audio Recording</h4>
      
      <div className="space-y-4">
        {/* Recording Controls */}
        {isEditing && (
          <div className="flex items-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
            
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-600 font-medium">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span>{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>
        )}

        {/* Waveform Visualization */}
        {isRecording && audioWaveform.length > 0 && (
          <div className="flex items-end space-x-1 h-16 bg-gray-100 dark:bg-[#0a0a0a] rounded p-2">
            {audioWaveform.map((amplitude, index) => (
              <div
                key={index}
                className="bg-emerald-500 rounded-t transition-all duration-100"
                style={{
                  height: `${Math.max(4, amplitude * 60)}px`,
                  width: '4px'
                }}
              />
            ))}
          </div>
        )}

        {/* Audio Playback Controls */}
        {audioBlob && (
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Recorded Audio ({formatTime(recordingTime)})
              </h5>
              {isEditing && (
                <button
                  onClick={resetRecording}
                  className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Delete recording"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={isPlaying ? pauseAudio : playAudio}
                className="flex items-center justify-center w-10 h-10 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              {isEditing && (
                <button
                  onClick={transcribeAudio}
                  disabled={isTranscribing}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isTranscribing ? (
                    <div className="flex items-center space-x-1">
                      <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                      <span>Transcribing...</span>
                    </div>
                  ) : (
                    'Transcribe'
                  )}
                </button>
              )}
            </div>
            
            {/* Transcription Result */}
            {transcription && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <p className="text-blue-700 dark:text-blue-400 font-medium mb-1">Transcription:</p>
                <p className="text-blue-600 dark:text-blue-300">{transcription}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}