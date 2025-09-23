'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Maximize, Minimize, Save, Users, Clock } from 'lucide-react'
import { fabric } from 'fabric'
import { useAuth } from '@/contexts/AuthContext'
import CanvasToolbar from './CanvasToolbar'
import TextFormattingToolbar from './TextFormattingToolbar'
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
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null)
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Text formatting state
  const [activeTextObject, setActiveTextObject] = useState<fabric.IText | null>(null)
  const [showTextToolbar, setShowTextToolbar] = useState(false)
  const [textToolbarPosition, setTextToolbarPosition] = useState({ x: 0, y: 0 })

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: Math.min(window.innerWidth - 100, 1200), // Limit canvas width
      height: Math.min(window.innerHeight - 200, 800), // Limit canvas height
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
      hoverCursor: 'pointer',
      moveCursor: 'move',
      defaultCursor: 'default'
    })

    // Temporarily disable grid to debug visibility issues
    // TODO: Re-enable grid once elements are visible
    console.log('🚧 Grid temporarily disabled for debugging')

    // Snap to grid temporarily disabled for debugging
    // canvas.on('object:moving', (e) => {
    //   const obj = e.target!
    //   const snap = 20
    //   obj.set({
    //     left: Math.round(obj.left! / snap) * snap,
    //     top: Math.round(obj.top! / snap) * snap
    //   })
    // })

    // Track changes for auto-save
    canvas.on('object:added', () => setHasUnsavedChanges(true))
    canvas.on('object:removed', () => setHasUnsavedChanges(true))
    canvas.on('object:modified', () => setHasUnsavedChanges(true))

    // Fix drawing mode clearing issue
    canvas.on('path:created', () => {
      setHasUnsavedChanges(true)
    })

    // Text selection and editing handlers
    canvas.on('selection:created', (e) => {
      const selectedObject = e.selected?.[0]
      if (selectedObject && (selectedObject instanceof fabric.IText || selectedObject instanceof fabric.Text)) {
        setActiveTextObject(selectedObject as fabric.IText)
        updateTextToolbarPosition(selectedObject as fabric.IText)
        setShowTextToolbar(true)
      } else {
        setActiveTextObject(null)
        setShowTextToolbar(false)
      }
    })

    canvas.on('selection:updated', (e) => {
      const selectedObject = e.selected?.[0]
      if (selectedObject && (selectedObject instanceof fabric.IText || selectedObject instanceof fabric.Text)) {
        setActiveTextObject(selectedObject as fabric.IText)
        updateTextToolbarPosition(selectedObject as fabric.IText)
        setShowTextToolbar(true)
      } else {
        setActiveTextObject(null)
        setShowTextToolbar(false)
      }
    })

    canvas.on('selection:cleared', () => {
      setActiveTextObject(null)
      setShowTextToolbar(false)
    })

    // Handle text editing mode
    canvas.on('text:editing:entered', (e) => {
      const textObject = e.target as fabric.IText
      setActiveTextObject(textObject)
      setShowTextToolbar(true) // Keep toolbar visible during editing
    })

    canvas.on('text:editing:exited', (e) => {
      const textObject = e.target as fabric.IText
      setActiveTextObject(textObject)
      updateTextToolbarPosition(textObject)
      setShowTextToolbar(true)
      setHasUnsavedChanges(true)
    })

    fabricCanvasRef.current = canvas

    // Load existing canvas data
    loadCanvasData()

    return () => {
      canvas.dispose()
      fabricCanvasRef.current = null
    }
  }, [isOpen])

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

  // Handle window resize
  useEffect(() => {
    if (!fabricCanvasRef.current) return

    const handleResize = () => {
      const canvas = fabricCanvasRef.current!
      canvas.setDimensions({
        width: Math.min(window.innerWidth - 100, 1200),
        height: Math.min(window.innerHeight - 200, 800)
      })
      canvas.renderAll()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadCanvasData = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/notes`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.status === 401) {
        console.error('Unauthorized access to canvas data')
        return
      }

      if (!response.ok) {
        console.error('Failed to load canvas data:', response.status, response.statusText)
        return
      }

      const result = await response.json()
      const notes = result.notes || []
      
      // Find chart recreation note
      const canvasNote = notes.find((note: any) => note.note_type === 'chart_recreation')

      if (canvasNote && canvasNote.content && typeof canvasNote.content === 'object' && canvasNote.content.canvas_data && fabricCanvasRef.current) {
        // Load canvas from JSON stored in content.canvas_data
        fabricCanvasRef.current.loadFromJSON(canvasNote.content.canvas_data, () => {
          fabricCanvasRef.current!.renderAll()
          setCanvasData({
            id: canvasNote.id,
            canvas_data: canvasNote.content.canvas_data,
            last_updated: canvasNote.updated_at,
            updated_by: canvasNote.user_id,
            collaborators: []
          })
          setLastSaved(new Date(canvasNote.updated_at))
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
    console.log('SaveCanvas called with:', {
      activityId: activityId,
      activityIdType: typeof activityId,
      user: user,
      userId: user?.id,
      silent: silent
    })
    
    if (!fabricCanvasRef.current || !user) {
      console.log('Early return:', {
        fabricCanvasExists: !!fabricCanvasRef.current,
        userExists: !!user
      })
      return
    }

    if (!silent) setIsSaving(true)

    try {
      const canvasJSON = fabricCanvasRef.current.toJSON()

      const content = {
        canvas_data: canvasJSON,
        type: 'canvas',
        elements: fabricCanvasRef.current.getObjects().length,
        last_edited: new Date().toISOString()
      }

      if (canvasData?.id) {
        // Update existing note
        const response = await fetch(`/api/activities/${activityId}/notes`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            note_id: canvasData.id,
            content: content
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to update canvas: ${errorData.error || response.statusText}`)
        }

        const updatedNote = await response.json()
        
        setCanvasData({
          id: updatedNote.id,
          canvas_data: canvasJSON,
          last_updated: updatedNote.updated_at,
          updated_by: user.id,
          collaborators: []
        })
      } else {
        // Create new note
        const response = await fetch(`/api/activities/${activityId}/notes`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            note_type: 'chart_recreation'
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to create canvas: ${errorData.error || response.statusText}`)
        }

        const newNote = await response.json()
        
        setCanvasData({
          id: newNote.id,
          canvas_data: canvasJSON,
          last_updated: newNote.updated_at,
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
      console.error('Canvas save error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      console.error('Canvas save context:', {
        activityId: activityId,
        activityIdType: typeof activityId,
        userId: user?.id || 'NO_USER_ID',
        userEmail: user?.email || 'NO_USER_EMAIL',
        fabricCanvasExists: !!fabricCanvasRef.current,
        canvasElementsCount: fabricCanvasRef.current?.getObjects().length,
        canvasDataId: canvasData?.id || 'NO_CANVAS_DATA_ID'
      })
      if (!silent) {
        setIsSaving(false)
        alert('Failed to save canvas. Please try again.')
      }
    }
  }

  const updateTextToolbarPosition = (textObject: fabric.IText) => {
    if (!fabricCanvasRef.current) return
    
    const objectBounds = textObject.getBoundingRect()
    const canvasElement = fabricCanvasRef.current.upperCanvasEl
    const canvasRect = canvasElement.getBoundingClientRect()
    
    setTextToolbarPosition({
      x: canvasRect.left + objectBounds.left + objectBounds.width / 2,
      y: canvasRect.top + objectBounds.top
    })
  }

  const addTextElement = () => {
    console.log('📝 Adding text element. Canvas exists:', !!fabricCanvasRef.current)
    if (!fabricCanvasRef.current) {
      console.error('❌ Fabric canvas not available for adding text')
      return
    }

    // Position text in visible area (top-left of viewport)
    const visiblePosition = {
      x: 100,
      y: 100
    }

    const text = new fabric.IText('Click to edit text', {
      left: visiblePosition.x,
      top: visiblePosition.y,
      fontSize: 18,
      fontFamily: 'Inter, sans-serif',
      fill: '#1f2937',
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Add slight background for visibility
      padding: 4
    })

    console.log('✅ Text element created, adding to canvas:', text)
    console.log('📐 Canvas dimensions:', fabricCanvasRef.current.width, 'x', fabricCanvasRef.current.height)
    console.log('📍 Text position:', text.left, ',', text.top)
    fabricCanvasRef.current.add(text)
    
    // Set text object for toolbar display
    setActiveTextObject(text)
    setShowTextToolbar(true)
    
    // Force render and debug
    fabricCanvasRef.current.renderAll()
    
    // Debug canvas state
    console.log('✅ Text element added and canvas rendered')
    console.log('🔍 Total objects on canvas:', fabricCanvasRef.current.getObjects().length)
    console.log('🎯 Canvas element:', fabricCanvasRef.current.getElement())
    console.log('📊 Canvas context:', fabricCanvasRef.current.getContext())
    console.log('🎨 Text object bounds:', text.getBoundingRect())
    console.log('🔧 Text object visible:', text.visible)
    console.log('🎪 Text object opacity:', text.opacity)
    
    // Add a very visible test rectangle
    const testRect = new fabric.Rect({
      left: 50,
      top: 50,
      width: 100,
      height: 100,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 5
    })
    fabricCanvasRef.current.add(testRect)
    fabricCanvasRef.current.renderAll()
    console.log('🔴 Added test red rectangle at (50,50)')
    
    // Set active object after render
    fabricCanvasRef.current.setActiveObject(text)
    
    // Immediately enter editing mode so user can start typing
    setTimeout(() => {
      if (text instanceof fabric.IText) {
        text.enterEditing()
        text.selectAll()
        fabricCanvasRef.current.renderAll() // Force another render
      }
    }, 100)
  }

  const addTextBox = () => {
    console.log('📦 Adding text box. Canvas exists:', !!fabricCanvasRef.current)
    if (!fabricCanvasRef.current) {
      console.error('❌ Fabric canvas not available for adding text box')
      return
    }

    // Position text box in visible area
    const visiblePosition = {
      x: 150,
      y: 150
    }

    // Create background rectangle
    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      width: 200,
      height: 80,
      fill: '#ffffff',
      stroke: '#d1d5db',
      strokeWidth: 2,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8,
      selectable: false,
      evented: false
    })

    // Create text element
    const text = new fabric.IText('Click to edit text', {
      left: 20,
      top: 30,
      fontSize: 16,
      fontFamily: 'Inter, sans-serif',
      fill: '#1f2937',
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8,
      textAlign: 'left',
      width: 160
    })

    // Group rectangle and text together
    const textBox = new fabric.Group([rect, text], {
      left: visiblePosition.x,
      top: visiblePosition.y,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8
    })

    // Add metadata to identify as text box
    textBox.set('elementType', 'textBox')

    console.log('✅ Text box created, adding to canvas:', textBox)
    fabricCanvasRef.current.add(textBox)
    fabricCanvasRef.current.bringToFront(textBox)
    fabricCanvasRef.current.setActiveObject(textBox)
    fabricCanvasRef.current.renderAll()
    console.log('✅ Text box added and canvas rendered')
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
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="bg-white dark:bg-[#1a1a1a] h-screen w-screen overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] p-4 border-b border-golden-500 dark:border-[#0a2e21] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-green-700 dark:text-golden-400">{activityTitle}</h2>
                <div className="text-sm text-gray-700 dark:text-golden-400/70 flex items-center space-x-4">
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
              <div className="mt-1 text-sm text-gray-700 dark:text-golden-400/70 flex items-center space-x-4">
                {lastSaved && (
                  <span>Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>
                )}
                {hasUnsavedChanges && (
                  <span className="bg-orange-500/20 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded text-xs">
                    Unsaved changes
                  </span>
                )}
                {isSaving && (
                  <span className="bg-green-500/20 text-green-800 dark:text-green-200 px-2 py-0.5 rounded text-xs">
                    Saving...
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => saveCanvas(false)}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-golden-400"
                title="Save canvas"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </button>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-700 dark:text-golden-400"
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
          onAddTextBox={addTextBox}
          onClear={clearCanvas}
        />

        {/* Text Formatting Toolbar - positioned under main toolbar */}
        {showTextToolbar && activeTextObject && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
            <TextFormattingToolbar
              activeTextObject={activeTextObject}
              canvas={fabricCanvasRef.current}
              onClose={() => setShowTextToolbar(false)}
              position={{ x: 0, y: 0 }} // Position not used in static layout
              isStatic={true}
            />
          </div>
        )}

        {/* Canvas Container */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-visible">
          <div className="w-full h-full p-4">
            <canvas 
              ref={canvasRef}
              className="border-2 border-red-500 shadow-lg bg-white"
              style={{ display: 'block' }}
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