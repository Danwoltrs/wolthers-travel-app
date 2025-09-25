'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Edit2, Trash2, Move, RotateCcw, Copy } from 'lucide-react'
import { fabric } from 'fabric'

interface ElementControlsProps {
  canvas: fabric.Canvas | null
  activeObject: fabric.Object | null
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}

export default function ElementControls({ 
  canvas, 
  activeObject, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: ElementControlsProps) {
  const [showControls, setShowControls] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const controlsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvas || !activeObject) {
      setShowControls(false)
      return
    }

    const updateControlsPosition = () => {
      const objectBounds = activeObject.getBoundingRect()
      const canvasElement = canvas.upperCanvasEl
      const canvasRect = canvasElement.getBoundingClientRect()
      
      setPosition({
        x: objectBounds.left + objectBounds.width - 10,
        y: objectBounds.top - 40
      })
      setShowControls(true)
    }

    // Update position when object changes
    updateControlsPosition()

    // Listen for object movements
    const handleObjectMoving = () => updateControlsPosition()
    const handleObjectModified = () => updateControlsPosition()
    const handleSelectionCleared = () => setShowControls(false)

    activeObject.on('moving', handleObjectMoving)
    activeObject.on('modified', handleObjectModified)
    canvas.on('selection:cleared', handleSelectionCleared)

    return () => {
      activeObject.off('moving', handleObjectMoving)
      activeObject.off('modified', handleObjectModified)
      canvas.off('selection:cleared', handleSelectionCleared)
    }
  }, [canvas, activeObject])

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    } else {
      // Default edit behavior based on element type
      const elementType = activeObject?.get('elementType')
      
      if (elementType === 'chart') {
        openChartEditor()
      } else if (elementType === 'table') {
        openTableEditor()
      } else if (activeObject instanceof fabric.IText || activeObject instanceof fabric.Text) {
        // Enter text editing mode
        if (activeObject instanceof fabric.IText) {
          activeObject.enterEditing()
        }
      }
    }
  }

  const openChartEditor = () => {
    // TODO: Open chart editor modal
    console.log('Opening chart editor for:', activeObject?.get('chartData'))
  }

  const openTableEditor = () => {
    // TODO: Open table editor modal
    console.log('Opening table editor for:', activeObject?.get('tableData'))
  }

  const handleDelete = () => {
    if (!canvas || !activeObject) return
    
    if (onDelete) {
      onDelete()
    } else {
      if (confirm('Delete this element?')) {
        canvas.remove(activeObject)
        canvas.renderAll()
      }
    }
  }

  const handleDuplicate = () => {
    if (!canvas || !activeObject) return

    if (onDuplicate) {
      onDuplicate()
    } else {
      activeObject.clone((cloned: fabric.Object) => {
        cloned.set({
          left: (cloned.left || 0) + 20,
          top: (cloned.top || 0) + 20,
        })
        
        if (cloned instanceof fabric.Group) {
          cloned.canvas = canvas
        }
        
        canvas.add(cloned)
        canvas.setActiveObject(cloned)
        canvas.renderAll()
      })
    }
  }

  const handleRotate = () => {
    if (!canvas || !activeObject) return
    
    const currentAngle = activeObject.angle || 0
    activeObject.rotate(currentAngle + 15)
    canvas.renderAll()
  }

  if (!showControls || !activeObject) {
    return null
  }

  return (
    <div
      ref={controlsRef}
      className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translateX(-100%)'
      }}
    >
      <div className="flex items-center space-x-1 p-1">
        {/* Drag handle indicator */}
        <div 
          className="flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-move rounded transition-colors"
          title="Drag to move"
        >
          <Move className="w-3 h-3" />
        </div>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

        {/* Edit button */}
        <button
          onClick={handleEdit}
          className="flex items-center justify-center w-6 h-6 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          title="Edit element"
        >
          <Edit2 className="w-3 h-3" />
        </button>

        {/* Duplicate button */}
        <button
          onClick={handleDuplicate}
          className="flex items-center justify-center w-6 h-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
          title="Duplicate element"
        >
          <Copy className="w-3 h-3" />
        </button>

        {/* Rotate button */}
        <button
          onClick={handleRotate}
          className="flex items-center justify-center w-6 h-6 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
          title="Rotate 15°"
        >
          <RotateCcw className="w-3 h-3" />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="flex items-center justify-center w-6 h-6 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Delete element"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

// Helper function to add element controls to canvas objects
export const addElementControlsToCanvas = (canvas: fabric.Canvas) => {
  // Add custom control styling
  fabric.Object.prototype.set({
    cornerColor: '#3b82f6',
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerSize: 8,
    borderColor: '#3b82f6',
    borderScaleFactor: 1.5,
    hasRotatingPoint: true,
    rotatingPointOffset: 40,
  })

  // Customize corner controls
  const cornerIcon = document.createElement('img')
  cornerIcon.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="white">
      <circle cx="6" cy="6" r="4" stroke="#3b82f6" stroke-width="2"/>
    </svg>
  `)

  // Add visual feedback for hover states
  canvas.on('mouse:over', (e) => {
    if (e.target && e.target.selectable) {
      e.target.set('borderColor', '#6366f1')
      canvas.renderAll()
    }
  })

  canvas.on('mouse:out', (e) => {
    if (e.target && e.target.selectable) {
      e.target.set('borderColor', '#3b82f6')
      canvas.renderAll()
    }
  })

  // Add selection effects
  canvas.on('selection:created', (e) => {
    if (e.selected && e.selected.length === 1) {
      const obj = e.selected[0]
      obj.set({
        borderColor: '#3b82f6',
        borderOpacityWhenMoving: 0.8,
      })
      canvas.renderAll()
    }
  })

  // Add smooth animations for object transformations
  canvas.on('object:scaling', (e) => {
    const obj = e.target!
    obj.set({
      strokeWidth: (obj.strokeWidth || 1) / Math.max(obj.scaleX || 1, obj.scaleY || 1)
    })
  })

  return canvas
}

// Hook to manage element controls state
export const useElementControls = (canvas: fabric.Canvas | null) => {
  const [activeObject, setActiveObject] = useState<fabric.Object | null>(null)
  const [controlsVisible, setControlsVisible] = useState(false)

  useEffect(() => {
    if (!canvas) return

    const handleSelectionCreated = (e: fabric.IEvent) => {
      if (e.selected && e.selected.length === 1) {
        setActiveObject(e.selected[0])
        setControlsVisible(true)
      }
    }

    const handleSelectionUpdated = (e: fabric.IEvent) => {
      if (e.selected && e.selected.length === 1) {
        setActiveObject(e.selected[0])
        setControlsVisible(true)
      }
    }

    const handleSelectionCleared = () => {
      setActiveObject(null)
      setControlsVisible(false)
    }

    canvas.on('selection:created', handleSelectionCreated)
    canvas.on('selection:updated', handleSelectionUpdated)
    canvas.on('selection:cleared', handleSelectionCleared)

    return () => {
      canvas.off('selection:created', handleSelectionCreated)
      canvas.off('selection:updated', handleSelectionUpdated)
      canvas.off('selection:cleared', handleSelectionCleared)
    }
  }, [canvas])

  return {
    activeObject,
    controlsVisible,
    setControlsVisible
  }
}