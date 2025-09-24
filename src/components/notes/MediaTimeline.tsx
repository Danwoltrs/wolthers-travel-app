'use client'

import React, { useState, useEffect } from 'react'
import { Image as ImageIcon, Mic, FileText, Play, Pause, Download, X, Clock, Maximize2 } from 'lucide-react'

interface MediaEntry {
  id: string
  timestamp: number
  type: 'image' | 'audio' | 'transcript'
  content: string | File
  description?: string
  relativeTime: string
}

interface MediaTimelineProps {
  mediaEntries: MediaEntry[]
  onRemoveMedia: (id: string) => void
  onInsertMediaIntoEditor: (entry: MediaEntry) => void
  className?: string
}

export default function MediaTimeline({
  mediaEntries,
  onRemoveMedia,
  onInsertMediaIntoEditor,
  className = ''
}: MediaTimelineProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map())

  // Sort media entries by timestamp
  const sortedEntries = [...mediaEntries].sort((a, b) => a.timestamp - b.timestamp)

  useEffect(() => {
    // Cleanup audio elements on unmount
    return () => {
      audioElements.forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [audioElements])

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleImageClick = (imageId: string) => {
    setExpandedImage(expandedImage === imageId ? null : imageId)
  }

  const handleAudioPlay = async (entry: MediaEntry) => {
    if (entry.type !== 'audio' || !(entry.content instanceof File)) return

    const audioId = entry.id

    // Stop any currently playing audio
    if (playingAudio && playingAudio !== audioId) {
      const currentAudio = audioElements.get(playingAudio)
      if (currentAudio) {
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
    }

    let audio = audioElements.get(audioId)
    
    if (!audio) {
      audio = new Audio()
      audio.src = URL.createObjectURL(entry.content as File)
      
      audio.onended = () => {
        setPlayingAudio(null)
      }
      
      audio.onerror = () => {
        console.error('Error playing audio')
        setPlayingAudio(null)
      }
      
      setAudioElements(prev => new Map(prev).set(audioId, audio!))
    }

    if (playingAudio === audioId) {
      // Pause if currently playing
      audio.pause()
      setPlayingAudio(null)
    } else {
      // Play audio
      try {
        await audio.play()
        setPlayingAudio(audioId)
      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }
  }

  const handleDownloadMedia = (entry: MediaEntry) => {
    if (entry.content instanceof File) {
      const url = URL.createObjectURL(entry.content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${entry.type}_${formatTimestamp(entry.timestamp).replace(/:/g, '-')}.${
        entry.type === 'audio' ? 'webm' : 'jpg'
      }`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const renderImagePreview = (entry: MediaEntry) => {
    if (!(entry.content instanceof File)) return null

    const imageUrl = URL.createObjectURL(entry.content)

    return (
      <div className="relative group">
        <div 
          className={`overflow-hidden rounded-lg cursor-pointer transition-all ${
            expandedImage === entry.id ? 'max-w-full' : 'max-w-xs'
          }`}
          onClick={() => handleImageClick(entry.id)}
        >
          <img
            src={imageUrl}
            alt={entry.description || 'Captured image'}
            className={`w-full object-cover transition-all ${
              expandedImage === entry.id ? 'max-h-96' : 'max-h-32'
            }`}
          />
        </div>
        
        {/* Image Controls */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpandedImage(expandedImage === entry.id ? null : entry.id)
              }}
              className="p-1 bg-black/50 hover:bg-black/70 text-white rounded"
              title="Expand/Collapse"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onInsertMediaIntoEditor(entry)
              }}
              className="p-1 bg-black/50 hover:bg-black/70 text-white rounded"
              title="Insert into notes"
            >
              <FileText className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadMedia(entry)
              }}
              className="p-1 bg-black/50 hover:bg-black/70 text-white rounded"
              title="Download"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderAudioPreview = (entry: MediaEntry) => {
    if (!(entry.content instanceof File)) return null

    const isPlaying = playingAudio === entry.id

    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <button
          onClick={() => handleAudioPlay(entry)}
          className={`p-2 rounded-full transition-colors ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {entry.description || 'Audio recording'}
            </span>
            {isPlaying && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500">Playing</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => handleDownloadMedia(entry)}
          className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title="Download audio"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    )
  }

  const renderTranscriptPreview = (entry: MediaEntry) => {
    const content = typeof entry.content === 'string' ? entry.content : ''
    
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <FileText className="w-4 h-4 text-blue-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {content.length > 150 ? `${content.substring(0, 150)}...` : content}
            </p>
          </div>
          <button
            onClick={() => onInsertMediaIntoEditor(entry)}
            className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
            title="Insert into notes"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const getEntryIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-green-500" />
      case 'audio':
        return <Mic className="w-4 h-4 text-blue-500" />
      case 'transcript':
        return <FileText className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  if (sortedEntries.length === 0) {
    return (
      <div className={`p-6 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">No media captured yet</p>
        <p className="text-xs">Start recording to capture audio, images, and transcripts</p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Media Timeline ({sortedEntries.length} items)
        </h3>
      </div>

      <div className="space-y-3">
        {sortedEntries.map((entry) => (
          <div key={entry.id} className="relative">
            {/* Timeline connector */}
            <div className="absolute left-6 top-8 w-px h-full bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="flex space-x-3">
              {/* Timeline marker */}
              <div className="flex-shrink-0 w-12 flex flex-col items-center">
                <div className="w-8 h-8 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                  {getEntryIcon(entry.type)}
                </div>
                <span className="text-xs text-gray-500 mt-1">{entry.relativeTime}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {entry.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveMedia(entry.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Content based on type */}
                  {entry.type === 'image' && renderImagePreview(entry)}
                  {entry.type === 'audio' && renderAudioPreview(entry)}
                  {entry.type === 'transcript' && renderTranscriptPreview(entry)}
                  
                  {/* Description */}
                  {entry.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {entry.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}