'use client'

import React, { useState } from 'react'
import { 
  Type, 
  PenTool, 
  Square, 
  Circle, 
  BarChart, 
  Table, 
  Image, 
  Camera, 
  Mic, 
  Palette, 
  Undo2, 
  Redo2,
  Trash2,
  Layout,
  ChevronDown
} from 'lucide-react'
import { fabric } from 'fabric'

interface CanvasToolbarProps {
  canvas: fabric.Canvas | null
  onAddText: () => void
  onClear: () => void
}

export default function CanvasToolbar({ canvas, onAddText, onClear }: CanvasToolbarProps) {
  const [selectedColor, setSelectedColor] = useState('#3b82f6')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(false)

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#1f2937', '#6b7280', '#f97316', '#dc2626'
  ]

  const addShape = (type: 'rectangle' | 'circle') => {
    if (!canvas) return

    let shape: fabric.Object

    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: 150,
        top: 150,
        width: 120,
        height: 80,
        fill: selectedColor,
        stroke: '#1f2937',
        strokeWidth: 2,
        cornerColor: '#3b82f6',
        cornerStyle: 'circle',
        transparentCorners: false,
        cornerSize: 8
      })
    } else {
      shape = new fabric.Circle({
        left: 150,
        top: 150,
        radius: 50,
        fill: selectedColor,
        stroke: '#1f2937',
        strokeWidth: 2,
        cornerColor: '#3b82f6',
        cornerStyle: 'circle',
        transparentCorners: false,
        cornerSize: 8
      })
    }

    canvas.add(shape)
    canvas.setActiveObject(shape)
    canvas.renderAll()
  }

  const toggleDrawingMode = () => {
    if (!canvas) return

    const newDrawingMode = !isDrawingMode
    setIsDrawingMode(newDrawingMode)

    canvas.isDrawingMode = newDrawingMode

    if (newDrawingMode) {
      canvas.freeDrawingBrush.color = selectedColor
      canvas.freeDrawingBrush.width = 3
      canvas.selection = false
    } else {
      canvas.selection = true
    }
  }

  const addChart = () => {
    if (!canvas) return

    // Create a placeholder for chart that will be replaced with actual chart component
    const chartPlaceholder = new fabric.Rect({
      left: 200,
      top: 200,
      width: 300,
      height: 200,
      fill: '#f3f4f6',
      stroke: '#d1d5db',
      strokeWidth: 2,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8
    })

    const chartText = new fabric.Text('📊 Chart Element\n(Click edit to configure)', {
      left: 220,
      top: 280,
      fontSize: 14,
      fontFamily: 'Inter, sans-serif',
      fill: '#6b7280',
      textAlign: 'center',
      originX: 'left',
      originY: 'center'
    })

    const chartGroup = new fabric.Group([chartPlaceholder, chartText], {
      left: 200,
      top: 200,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8
    })

    // Add metadata to identify as chart element
    chartGroup.set('elementType', 'chart')
    chartGroup.set('chartData', {
      type: 'bar',
      data: [
        { name: 'A', value: 20 },
        { name: 'B', value: 30 },
        { name: 'C', value: 25 }
      ]
    })

    canvas.add(chartGroup)
    canvas.setActiveObject(chartGroup)
    canvas.renderAll()
  }

  const addTable = () => {
    if (!canvas) return

    // Create a placeholder for table that will be replaced with actual table component
    const tablePlaceholder = new fabric.Rect({
      left: 250,
      top: 250,
      width: 250,
      height: 150,
      fill: '#ffffff',
      stroke: '#d1d5db',
      strokeWidth: 2,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8
    })

    const tableText = new fabric.Text('📋 Table Element\n(Click edit to configure)', {
      left: 270,
      top: 310,
      fontSize: 14,
      fontFamily: 'Inter, sans-serif',
      fill: '#6b7280',
      textAlign: 'center',
      originX: 'left',
      originY: 'center'
    })

    const tableGroup = new fabric.Group([tablePlaceholder, tableText], {
      left: 250,
      top: 250,
      cornerColor: '#3b82f6',
      cornerStyle: 'circle',
      transparentCorners: false,
      cornerSize: 8
    })

    // Add metadata to identify as table element
    tableGroup.set('elementType', 'table')
    tableGroup.set('tableData', {
      headers: ['Column 1', 'Column 2'],
      rows: [
        ['Row 1, Col 1', 'Row 1, Col 2'],
        ['Row 2, Col 1', 'Row 2, Col 2']
      ]
    })

    canvas.add(tableGroup)
    canvas.setActiveObject(tableGroup)
    canvas.renderAll()
  }

  const undo = () => {
    // TODO: Implement undo functionality
    console.log('Undo functionality to be implemented')
  }

  const redo = () => {
    // TODO: Implement redo functionality  
    console.log('Redo functionality to be implemented')
  }

  const applyTemplate = (templateType: string) => {
    if (!canvas) return

    switch (templateType) {
      case 'quadrant':
        applyQuadrantTemplate()
        break
      case 'cornell':
        applyCornellTemplate()
        break
      case 'meeting':
        applyMeetingTemplate()
        break
    }
    
    setShowTemplates(false)
  }

  const applyQuadrantTemplate = () => {
    if (!canvas) return

    // Clear existing content
    const objects = canvas.getObjects().filter(obj => obj.selectable !== false)
    objects.forEach(obj => canvas.remove(obj))

    const canvasWidth = canvas.width!
    const canvasHeight = canvas.height!
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    // Create quadrant lines
    const verticalLine = new fabric.Line([centerX, 50, centerX, canvasHeight - 50], {
      stroke: '#6b7280',
      strokeWidth: 2,
      selectable: false,
      evented: false
    })

    const horizontalLine = new fabric.Line([50, centerY, canvasWidth - 50, centerY], {
      stroke: '#6b7280',
      strokeWidth: 2,
      selectable: false,
      evented: false
    })

    // Add quadrant titles
    const titles = [
      { text: 'QUESTIONS', x: centerX / 2, y: centerY / 2 },
      { text: 'NOTES', x: centerX + centerX / 2, y: centerY / 2 },
      { text: 'PERSONAL ACTION ITEMS', x: centerX / 2, y: centerY + centerY / 2 },
      { text: 'ASSIGN TO OTHERS', x: centerX + centerX / 2, y: centerY + centerY / 2 }
    ]

    const titleObjects = titles.map(({ text, x, y }) => 
      new fabric.Text(text, {
        left: x,
        top: y - 50,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#1f2937',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        backgroundColor: '#f9fafb',
        padding: 8
      })
    )

    canvas.add(verticalLine, horizontalLine, ...titleObjects)
    canvas.renderAll()
  }

  const applyCornellTemplate = () => {
    if (!canvas) return

    const objects = canvas.getObjects().filter(obj => obj.selectable !== false)
    objects.forEach(obj => canvas.remove(obj))

    const canvasWidth = canvas.width!
    const canvasHeight = canvas.height!

    // Cornell note sections
    const cueColumn = new fabric.Line([canvasWidth * 0.3, 100, canvasWidth * 0.3, canvasHeight - 150], {
      stroke: '#6b7280',
      strokeWidth: 2,
      selectable: false,
      evented: false
    })

    const summarySection = new fabric.Line([50, canvasHeight - 150, canvasWidth - 50, canvasHeight - 150], {
      stroke: '#6b7280',
      strokeWidth: 2,
      selectable: false,
      evented: false
    })

    const titles = [
      { text: 'CUES', x: canvasWidth * 0.15, y: 80 },
      { text: 'NOTES', x: canvasWidth * 0.65, y: 80 },
      { text: 'SUMMARY', x: canvasWidth * 0.5, y: canvasHeight - 130 }
    ]

    const titleObjects = titles.map(({ text, x, y }) =>
      new fabric.Text(text, {
        left: x,
        top: y,
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#1f2937',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center',
        originX: 'center',
        backgroundColor: '#f9fafb',
        padding: 6
      })
    )

    canvas.add(cueColumn, summarySection, ...titleObjects)
    canvas.renderAll()
  }

  const applyMeetingTemplate = () => {
    if (!canvas) return

    const objects = canvas.getObjects().filter(obj => obj.selectable !== false)
    objects.forEach(obj => canvas.remove(obj))

    // Meeting template sections
    const sections = [
      { title: 'MEETING DETAILS', y: 60 },
      { title: 'ATTENDEES', y: 140 },
      { title: 'AGENDA & DISCUSSION', y: 220 },
      { title: 'DECISIONS MADE', y: 360 },
      { title: 'ACTION ITEMS', y: 440 }
    ]

    sections.forEach(({ title, y }) => {
      const titleText = new fabric.Text(title, {
        left: 60,
        top: y,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#1f2937',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#fef3c7',
        padding: 8
      })

      const underline = new fabric.Line([60, y + 25, 500, y + 25], {
        stroke: '#d1d5db',
        strokeWidth: 1,
        selectable: false,
        evented: false
      })

      canvas.add(titleText, underline)
    })

    canvas.renderAll()
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Left side - Main tools */}
        <div className="flex items-center space-x-1">
          {/* Text tool */}
          <button
            onClick={onAddText}
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Add text"
          >
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Text</span>
          </button>

          {/* Drawing tool */}
          <button
            onClick={toggleDrawingMode}
            className={`flex items-center space-x-1 px-2 py-1.5 text-sm rounded transition-colors ${
              isDrawingMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
            }`}
            title="Drawing mode"
          >
            <PenTool className="w-4 h-4" />
            <span className="hidden sm:inline">Draw</span>
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Shapes */}
          <button
            onClick={() => addShape('rectangle')}
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Add rectangle"
          >
            <Square className="w-4 h-4" />
            <span className="hidden sm:inline">Rectangle</span>
          </button>

          <button
            onClick={() => addShape('circle')}
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Add circle"
          >
            <Circle className="w-4 h-4" />
            <span className="hidden sm:inline">Circle</span>
          </button>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Visual elements */}
          <button
            onClick={addChart}
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
            title="Add chart"
          >
            <BarChart className="w-4 h-4" />
            <span className="hidden sm:inline">Chart</span>
          </button>

          <button
            onClick={addTable}
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded transition-colors"
            title="Add table"
          >
            <Table className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </button>

          {/* Media tools */}
          <button
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Add image"
          >
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Image</span>
          </button>

          <button
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Take photo"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Record audio"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* Middle - Templates */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded transition-colors"
          >
            <Layout className="w-4 h-4" />
            <span>Templates</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 min-w-[200px]">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => applyTemplate('quadrant')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  📋 Quadrant Method
                </button>
                <button
                  onClick={() => applyTemplate('cornell')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  📝 Cornell Notes
                </button>
                <button
                  onClick={() => applyTemplate('meeting')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  🤝 Meeting Minutes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Tools and color */}
        <div className="flex items-center space-x-1">
          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-1 px-2 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
              title="Choose color"
            >
              <Palette className="w-4 h-4" />
              <div 
                className="w-4 h-4 rounded border border-gray-300 dark:border-gray-500"
                style={{ backgroundColor: selectedColor }}
              />
            </button>

            {showColorPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 p-3">
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color)
                        setShowColorPicker(false)
                      }}
                      className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                        selectedColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* Undo/Redo */}
          <button
            onClick={undo}
            className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Clear canvas */}
          <button
            onClick={onClear}
            className="p-1.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}