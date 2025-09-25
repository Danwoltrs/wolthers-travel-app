'use client'

import React, { useState } from 'react'
import { 
  Bold, 
  Italic, 
  Underline,
  List,
  ListOrdered,
  Hash,
  CheckSquare,
  AtSign,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  X
} from 'lucide-react'
import { fabric } from 'fabric'

interface TextFormattingToolbarProps {
  activeTextObject: fabric.IText | null
  canvas: fabric.Canvas | null
  onClose: () => void
  position: { x: number; y: number }
  isStatic?: boolean
}

export default function TextFormattingToolbar({ 
  activeTextObject, 
  canvas, 
  onClose, 
  position,
  isStatic = false
}: TextFormattingToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  
  const colors = [
    '#000000', '#1f2937', '#374151', '#6b7280',
    '#ef4444', '#dc2626', '#991b1b', '#7f1d1d',
    '#f97316', '#ea580c', '#c2410c', '#9a3412',
    '#eab308', '#ca8a04', '#a16207', '#854d0e',
    '#22c55e', '#16a34a', '#15803d', '#166534',
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6',
    '#ec4899', '#db2777', '#be185d', '#9d174d'
  ]

  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64]

  if (!activeTextObject) return null

  const applyFormatting = (type: string, value?: any) => {
    if (!activeTextObject || !canvas) return

    switch (type) {
      case 'bold':
        const currentWeight = activeTextObject.fontWeight
        activeTextObject.set('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold')
        break
      
      case 'italic':
        const currentStyle = activeTextObject.fontStyle
        activeTextObject.set('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic')
        break
      
      case 'underline':
        const currentUnderline = activeTextObject.underline
        activeTextObject.set('underline', !currentUnderline)
        break
      
      case 'color':
        activeTextObject.set('fill', value)
        break
      
      case 'fontSize':
        activeTextObject.set('fontSize', value)
        break
      
      case 'align':
        activeTextObject.set('textAlign', value)
        break
      
      case 'bulletList':
        addBulletPoints()
        break
      
      case 'numberedList':
        addNumberedList()
        break
      
      case 'header1':
        activeTextObject.set('fontSize', 32)
        activeTextObject.set('fontWeight', 'bold')
        break
      
      case 'header2':
        activeTextObject.set('fontSize', 24)
        activeTextObject.set('fontWeight', 'bold')
        break
      
      case 'header3':
        activeTextObject.set('fontSize', 20)
        activeTextObject.set('fontWeight', 'bold')
        break
      
      case 'checkbox':
        addCheckboxList()
        break
      
      case 'mention':
        addMention()
        break
    }
    
    canvas.renderAll()
  }

  const addBulletPoints = () => {
    if (!activeTextObject) return
    const currentText = activeTextObject.text || ''
    const lines = currentText.split('\n')
    const bulletLines = lines.map(line => line.trim() ? `• ${line.replace(/^[•\-\*]\s*/, '')}` : line)
    activeTextObject.set('text', bulletLines.join('\n'))
  }

  const addNumberedList = () => {
    if (!activeTextObject) return
    const currentText = activeTextObject.text || ''
    const lines = currentText.split('\n').filter(line => line.trim())
    const numberedLines = lines.map((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s*/, '')}`)
    activeTextObject.set('text', numberedLines.join('\n'))
  }

  const addCheckboxList = () => {
    if (!activeTextObject) return
    const currentText = activeTextObject.text || ''
    const lines = currentText.split('\n')
    const checkboxLines = lines.map(line => line.trim() ? `☐ ${line.replace(/^[☐☑]\s*/, '')}` : line)
    activeTextObject.set('text', checkboxLines.join('\n'))
  }

  const addMention = () => {
    if (!activeTextObject) return
    const currentText = activeTextObject.text || ''
    const mentionText = prompt('Enter name to mention:')
    if (mentionText) {
      activeTextObject.set('text', `${currentText} @${mentionText}`)
    }
  }

  const containerClass = isStatic 
    ? "w-full"
    : "absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-3 min-w-[320px]"
  
  const containerStyle = isStatic 
    ? {}
    : {
        left: position.x,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }

  return (
    <div
      className={containerClass}
      style={containerStyle}
    >
      {/* Header - only show in floating mode */}
      {!isStatic && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Text Formatting</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header for static mode */}
      {isStatic && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Text Formatting - {activeTextObject?.text?.slice(0, 30)}{activeTextObject?.text && activeTextObject.text.length > 30 ? '...' : ''}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Close formatting toolbar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className={isStatic ? "flex flex-wrap items-center gap-4" : "space-y-3"}>
        {/* Basic formatting */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => applyFormatting('bold')}
            className={`p-2 rounded transition-colors ${
              activeTextObject.fontWeight === 'bold' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => applyFormatting('italic')}
            className={`p-2 rounded transition-colors ${
              activeTextObject.fontStyle === 'italic' 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => applyFormatting('underline')}
            className={`p-2 rounded transition-colors ${
              activeTextObject.underline 
                ? 'bg-blue-500 text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>

          {!isStatic && <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />}

          {/* Alignment */}
          <button
            onClick={() => applyFormatting('align', 'left')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Align left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => applyFormatting('align', 'center')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => applyFormatting('align', 'right')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Align right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Font size */}
        <div className="flex items-center space-x-2">
          <Type className="w-4 h-4 text-gray-500" />
          <select
            value={activeTextObject.fontSize || 16}
            onChange={(e) => applyFormatting('fontSize', parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Palette className="w-4 h-4" />
              <div 
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: activeTextObject.fill as string || '#000000' }}
              />
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 p-2">
                <div className="grid grid-cols-8 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        applyFormatting('color', color)
                        setShowColorPicker(false)
                      }}
                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Headers */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => applyFormatting('header1')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
          >
            H1
          </button>
          <button
            onClick={() => applyFormatting('header2')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
          >
            H2
          </button>
          <button
            onClick={() => applyFormatting('header3')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
          >
            H3
          </button>
        </div>

        {/* Lists and special features */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => applyFormatting('bulletList')}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Bullet list"
          >
            <List className="w-4 h-4" />
            {!isStatic && <span>Bullets</span>}
          </button>
          
          <button
            onClick={() => applyFormatting('numberedList')}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Numbered list"
          >
            <ListOrdered className="w-4 h-4" />
            {!isStatic && <span>Numbers</span>}
          </button>
          
          <button
            onClick={() => applyFormatting('checkbox')}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
            title="Checklist"
          >
            <CheckSquare className="w-4 h-4" />
            {!isStatic && <span>Tasks</span>}
          </button>
          
          <button
            onClick={() => applyFormatting('mention')}
            className="flex items-center space-x-1 px-2 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded transition-colors"
            title="Mention someone"
          >
            <AtSign className="w-4 h-4" />
            {!isStatic && <span>Mention</span>}
          </button>
        </div>
      </div>
    </div>
  )
}