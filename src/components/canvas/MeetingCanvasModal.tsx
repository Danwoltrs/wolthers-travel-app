'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Maximize, Minimize, Save, Users, Clock } from 'lucide-react'
import { fabric } from 'fabric'
import { useAuth } from '@/contexts/AuthContext'
import CanvasToolbar from './CanvasToolbar'
import { formatDistanceToNow } from 'date-fns'

interface MeetingCanvasModalProps {
  isOpen: boolean
  onClose: () => void
  activityId: string
  activityTitle: string
  meetingDate?: Date
}

interface CanvasData {
  id: string
  canvas_data: any
  last_updated: string
  updated_by: string
  collaborators: string[]
}

export default function MeetingCanvasModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  meetingDate = new Date()
}: MeetingCanvasModalProps) {
  const { user } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  
  // State management
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null)
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: isFullscreen ? window.innerWidth : 1200,
      height: isFullscreen ? window.innerHeight - 160 : 600,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      hoverCursor: 'pointer',
      moveCursor: 'move',
      defaultCursor: 'default'
    })

    // Add grid background
    const gridSize = 20
    const grid = []
    const canvasWidth = canvas.width!
    const canvasHeight = canvas.height!
    
    for (let i = 0; i < Math.ceil(canvasWidth / gridSize); i++) {
      grid.push(
        new fabric.Line([i * gridSize, 0, i * gridSize, canvasHeight], {
          stroke: '#e5e7eb',
          strokeWidth: 1,
          selectable: false,
          evented: false
        })
      )
    }
    
    for (let i = 0; i < Math.ceil(canvasHeight / gridSize); i++) {
      grid.push(
        new fabric.Line([0, i * gridSize, canvasWidth, i * gridSize], {
          stroke: '#e5e7eb', 
          strokeWidth: 1,
          selectable: false,
          evented: false
        })
      )
    }

    canvas.add(...grid)
    
    // Send grid to back
    grid.forEach(line => canvas.sendToBack(line))

    // Enable snap to grid
    canvas.on('object:moving', (e) => {
      const obj = e.target!
      const snap = gridSize
      
      obj.set({
        left: Math.round(obj.left! / snap) * snap,
        top: Math.round(obj.top! / snap) * snap
      })
    })

    // Track changes for auto-save
    canvas.on('object:added', () => setHasUnsavedChanges(true))
    canvas.on('object:removed', () => setHasUnsavedChanges(true))
    canvas.on('object:modified', () => setHasUnsavedChanges(true))

    fabricCanvasRef.current = canvas

    // Load existing canvas data
    loadCanvasData()

    return () => {
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [isOpen, isFullscreen])

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !fabricCanvasRef.current) return

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveCanvas(true) // Silent save
      }
    }, 5000)

    return () => clearInterval(autoSaveInterval)
  }, [hasUnsavedChanges])

  // Handle window resize for fullscreen
  useEffect(() => {
    if (!isFullscreen || !fabricCanvasRef.current) return

    const handleResize = () => {
      const canvas = fabricCanvasRef.current!
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 160
      })
      canvas.renderAll()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isFullscreen])

  const loadCanvasData = async () => {
    try {
      const { supabase } = await import('@/lib/supabase-client')
      
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('id, canvas_data, updated_at, user_id, content')
        .eq('meeting_id', activityId)
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading canvas data:', error)
        return
      }

      if (data && data.canvas_data && fabricCanvasRef.current) {
        // Load canvas from JSON
        fabricCanvasRef.current.loadFromJSON(data.canvas_data, () => {
          fabricCanvasRef.current!.renderAll()
          setCanvasData({
            id: data.id,
            canvas_data: data.canvas_data,
            last_updated: data.updated_at,
            updated_by: data.user_id,
            collaborators: []
          })
          setLastSaved(new Date(data.updated_at))
          setHasUnsavedChanges(false)
        })
      } else {
        // New canvas - add welcome text
        if (fabricCanvasRef.current) {
          const welcomeText = new fabric.Text(`Notes for: ${activityTitle}`, {
            left: 50,
            top: 50,
            fontSize: 24,
            fontWeight: 'bold',
            fill: '#1f2937',
            fontFamily: 'Inter, sans-serif'
          })
          fabricCanvasRef.current.add(welcomeText)
          fabricCanvasRef.current.renderAll()
        }
      }
    } catch (error) {
      console.error('Failed to load canvas data:', error)
    }
  }

  const saveCanvas = async (silent = false) => {
    if (!fabricCanvasRef.current || !user) return

    if (!silent) setIsSaving(true)

    try {
      const { supabase } = await import('@/lib/supabase-client')
      const canvasJSON = fabricCanvasRef.current.toJSON()

      const canvasRecord = {
        meeting_id: activityId,
        user_id: user.id,
        canvas_data: canvasJSON,
        updated_at: new Date().toISOString(),
        content: {
          type: 'canvas',
          elements: fabricCanvasRef.current.getObjects().length,
          last_edited: new Date().toISOString()
        }
      }

      if (canvasData?.id) {
        // Update existing
        const { error } = await supabase
          .from('meeting_notes')
          .update(canvasRecord)
          .eq('id', canvasData.id)

        if (error) throw error
      } else {
        // Create new
        const { data, error } = await supabase
          .from('meeting_notes')
          .insert({
            ...canvasRecord,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (error) throw error
        
        setCanvasData({
          id: data.id,
          canvas_data: canvasJSON,
          last_updated: new Date().toISOString(),
          updated_by: user.id,
          collaborators: []
        })
      }

      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      if (!silent) {
        // Show save confirmation briefly
        setTimeout(() => setIsSaving(false), 500)
      }
    } catch (error) {
      console.error('Failed to save canvas:', error)
      if (!silent) {
        setIsSaving(false)
        alert('Failed to save canvas. Please try again.')
      }
    }
  }

  const addTextElement = () => {
    if (!fabricCanvasRef.current) return

    const text = new fabric.IText('Click to edit text', {
      left: 100,
      top: 100,
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      fill: '#1f2937',
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8
    })

    fabricCanvasRef.current.add(text)
    fabricCanvasRef.current.setActiveObject(text)
    fabricCanvasRef.current.renderAll()
  }

  const clearCanvas = () => {
    if (!fabricCanvasRef.current) return
    
    const objects = fabricCanvasRef.current.getObjects()
    // Keep grid lines (they're not selectable)
    const elementsToRemove = objects.filter(obj => obj.selectable !== false)
    
    if (elementsToRemove.length === 0) return
    
    if (confirm('Clear all elements from canvas?')) {
      elementsToRemove.forEach(obj => fabricCanvasRef.current!.remove(obj))
      fabricCanvasRef.current.renderAll()
      setHasUnsavedChanges(true)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isOpen) return null

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 ${isFullscreen ? '' : 'p-4'}`}>
      <div className={`bg-white dark:bg-[#1a1a1a] ${
        isFullscreen 
          ? 'h-screen w-screen' 
          : 'h-[calc(100vh-2rem)] w-full max-w-7xl mx-auto rounded-lg shadow-2xl'
      } overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 p-4 border-b border-golden-500 dark:border-[#0a2e21] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold">{activityTitle}</h2>
                <div className="text-sm opacity-75 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateTime(meetingDate)}</span>
                  </div>
                  {collaborators.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-1 text-sm opacity-70 flex items-center space-x-4">
                {lastSaved && (
                  <span>Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
                )}
                {hasUnsavedChanges && (
                  <span className="bg-orange-500/20 text-orange-200 px-2 py-0.5 rounded text-xs">
                    Unsaved changes
                  </span>
                )}
                {isSaving && (
                  <span className="bg-green-500/20 text-green-200 px-2 py-0.5 rounded text-xs">
                    Saving...
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => saveCanvas(false)}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save canvas"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Close canvas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Toolbar */}
        <CanvasToolbar
          canvas={fabricCanvasRef.current}
          onAddText={addTextElement}
          onClear={clearCanvas}
        />

        {/* Canvas Container */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-auto">
          <div className="w-full h-full flex items-center justify-center p-4">
            <canvas 
              ref={canvasRef}
              className="border border-gray-300 dark:border-gray-600 shadow-lg rounded-sm bg-white"
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center space-x-4">
            <span>Elements: {fabricCanvasRef.current?.getObjects().filter(obj => obj.selectable !== false).length || 0}</span>
            {fabricCanvasRef.current && (
              <span>Canvas: {fabricCanvasRef.current.width} × {fabricCanvasRef.current.height}</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>Zoom: 100%</span>
            <span>Grid: 20px</span>
          </div>
        </div>
      </div>
    </div>
  )
}