'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Bold, Italic, Underline, List, ListOrdered, Quote, BarChart, Table, Code, Camera, Mic, FileText, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AudioRecorder from '@/components/meeting-notes/AudioRecorder'
import FileManager from '@/components/meeting-notes/FileManager'
import CameraInterface from '@/components/meeting-notes/CameraInterface'
import ChartsManager from '@/components/meeting-notes/ChartsManager'
import TablesManager from '@/components/meeting-notes/TablesManager'

interface ChartData {
  type: 'bar' | 'line' | 'donut' | 'sankey' | 'spider'
  title: string
  data: any
}

interface TableData {
  title: string
  headers: string[]
  rows: string[][]
}

interface MeetingNote {
  id: string
  meeting_id: string
  user_id: string
  content: {
    text: string
    charts: ChartData[]
    tables: TableData[]
    audioBlob?: Blob | null
    transcription?: string
    capturedImages?: File[]
    capturedDocuments?: File[]
  }
  created_at: string
  updated_at: string
  users?: {
    email: string
    first_name?: string
    last_name?: string
  }
}

interface MeetingNotesModalProps {
  isOpen: boolean
  onClose: () => void
  activityId: string
  activityTitle: string
}

export default function MeetingNotesModal({ 
  isOpen, 
  onClose, 
  activityId, 
  activityTitle 
}: MeetingNotesModalProps) {
  const { user } = useAuth()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Main state
  const [isSaving, setIsSaving] = useState(false)
  const [myNote, setMyNote] = useState<MeetingNote | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Content state
  const [noteText, setNoteText] = useState('')
  const [charts, setCharts] = useState<ChartData[]>([])
  const [tables, setTables] = useState<TableData[]>([])
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioWaveform, setAudioWaveform] = useState<number[]>([])
  
  // Camera and file state
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImages, setCapturedImages] = useState<File[]>([])
  const [capturedDocuments, setCapturedDocuments] = useState<File[]>([])
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrResults, setOcrResults] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // Modal state for builders
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [showTableBuilder, setShowTableBuilder] = useState(false)

  // Load notes when modal opens
  useEffect(() => {
    if (isOpen && user && activityId) {
      loadNotes()
    }
  }, [isOpen, user, activityId])

  // Track unsaved changes
  useEffect(() => {
    if (myNote) {
      const hasTextChanges = noteText !== (myNote.content?.text || '')
      const hasChartsChanges = JSON.stringify(charts) !== JSON.stringify(myNote.content?.charts || [])
      const hasTablesChanges = JSON.stringify(tables) !== JSON.stringify(myNote.content?.tables || [])
      const hasAudioChanges = audioBlob !== (myNote.content?.audioBlob || null)
      const hasImagesChanges = capturedImages.length !== (myNote.content?.capturedImages?.length || 0)
      const hasDocsChanges = capturedDocuments.length !== (myNote.content?.capturedDocuments?.length || 0)
      
      setHasUnsavedChanges(hasTextChanges || hasChartsChanges || hasTablesChanges || hasAudioChanges || hasImagesChanges || hasDocsChanges)
    }
  }, [noteText, charts, tables, audioBlob, capturedImages, capturedDocuments, myNote])

  const loadNotes = async () => {
    try {
      const { supabase } = await import('@/lib/supabase-client')
      
      const { data: notes, error } = await supabase
        .from('meeting_notes')
        .select(`
          *,
          users (
            email,
            first_name,
            last_name
          )
        `)
        .eq('meeting_id', activityId)
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notes:', error)
        return
      }

      if (notes) {
        setMyNote(notes)
        setNoteText(notes.content?.text || '')
        setCharts(notes.content?.charts || [])
        setTables(notes.content?.tables || [])
        setAudioBlob(notes.content?.audioBlob || null)
        setTranscription(notes.content?.transcription || '')
        setCapturedImages(notes.content?.capturedImages || [])
        setCapturedDocuments(notes.content?.capturedDocuments || [])
      } else {
        // Initialize with empty note but set activity title as default
        setNoteText(`Notes for: ${activityTitle}\n\n`)
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
  }

  const saveNotes = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase-client')
      
      const noteContent = {
        text: noteText,
        charts,
        tables,
        audioBlob,
        transcription,
        capturedImages,
        capturedDocuments
      }

      const noteData = {
        meeting_id: activityId,
        user_id: user.id,
        content: noteContent,
        updated_at: new Date().toISOString()
      }

      if (myNote) {
        // Update existing note
        const { data, error } = await supabase
          .from('meeting_notes')
          .update(noteData)
          .eq('id', myNote.id)
          .select()
          .single()

        if (error) throw error
        setMyNote(data)
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('meeting_notes')
          .insert({
            ...noteData,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        setMyNote(data)
      }
      
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save notes:', error)
      alert('Failed to save notes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Text formatting functions
  const insertTextAtCursor = (beforeText: string, afterText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = noteText.substring(start, end)
    
    const newText = noteText.substring(0, start) + beforeText + selectedText + afterText + noteText.substring(end)
    setNoteText(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + beforeText.length + selectedText.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const insertChart = (chartIndex: number) => {
    const chart = charts[chartIndex]
    if (!chart) return
    insertTextAtCursor(`\n\n[CHART:${chartIndex}:${chart.title}]\n\n`)
  }

  const insertTable = (tableIndex: number) => {
    const table = tables[tableIndex]
    if (!table) return
    insertTextAtCursor(`\n\n[TABLE:${tableIndex}:${table.title}]\n\n`)
  }

  const processOCR = async (imageFile: File, index: number) => {
    if (!activityId) {
      console.error('Cannot process OCR without an activity id')
      return
    }

    setIsProcessingOCR(true)
    setSelectedImageIndex(index)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const response = await fetch(`/api/activities/${activityId}/ocr`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'OCR processing failed')
      }

      const data = await response.json()
      const extractedText = data.text || 'No text detected'

      setOcrResults(prev => {
        const newResults = [...prev]
        newResults[index] = extractedText
        return newResults
      })

      if (extractedText && extractedText !== 'No text detected') {
        setNoteText(prev => prev + (prev ? '\n\n' : '') + `**Extracted from ${imageFile.name}:**\n${extractedText}`)
      }
    } catch (error) {
      console.error('OCR error:', error)
      setOcrResults(prev => {
        const newResults = [...prev]
        newResults[index] = 'Error processing image'
        return newResults
      })
      alert('Failed to extract text from image. Please try again.')
    } finally {
      setIsProcessingOCR(false)
      setSelectedImageIndex(null)
    }
  }

  const renderFormattedText = (text: string) => {
    if (!text) return ''

    let formattedText = text
    
    // Replace chart placeholders with actual charts
    formattedText = formattedText.replace(/\[CHART:(\d+):([^\]]+)\]/g, (match, index, title) => {
      const chartIndex = parseInt(index)
      const chart = charts[chartIndex]
      if (!chart) return match

      return `<div class="chart-container my-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">${title}</h4>
        <div class="chart-visualization">
          ${renderChartHTML(chart)}
        </div>
      </div>`
    })

    // Replace table placeholders with actual tables
    formattedText = formattedText.replace(/\[TABLE:(\d+):([^\]]+)\]/g, (match, index, title) => {
      const tableIndex = parseInt(index)
      const table = tables[tableIndex]
      if (!table) return match

      const tableHTML = `
        <div class="table-container my-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">${title}</h4>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
              <thead>
                <tr>
                  ${table.headers.map(header => 
                    `<th class="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">${header}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${table.rows.map(row => 
                  `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    ${row.map(cell => 
                      `<td class="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">${cell}</td>`
                    ).join('')}
                  </tr>`
                ).join('')}
              </tbody>
            </table>
          </div>
        </div>`
      
      return tableHTML
    })

    // Handle other markdown-like formatting
    formattedText = formattedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
      .replace(/\n/g, '<br>')

    // Wrap consecutive list items
    formattedText = formattedText
      .replace(/(<li>(?:(?!<li>).)*<\/li>(?:\s*<br>\s*<li>(?:(?!<li>).)*<\/li>)*)/g, '<ul class="list-disc list-inside space-y-1">$1</ul>')

    return formattedText
  }

  const renderChartHTML = (chart: ChartData) => {
    switch (chart.type) {
      case 'bar':
        const maxValue = Math.max(...chart.data.map((item: any) => item.value))
        return `
          <div class="space-y-2">
            ${chart.data.map((item: any) => `
              <div class="flex items-center space-x-2">
                <div class="w-16 text-xs text-gray-600 dark:text-gray-400 truncate">${item.label}</div>
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div class="bg-blue-500 h-4 rounded-full transition-all duration-500" style="width: ${(item.value / maxValue) * 100}%"></div>
                </div>
                <div class="w-8 text-xs text-gray-600 dark:text-gray-400 text-right">${item.value}</div>
              </div>
            `).join('')}
          </div>
        `
      
      case 'donut':
        const total = chart.data.reduce((sum: number, item: any) => sum + item.value, 0)
        let currentAngle = 0
        const donutSVG = chart.data.map((item: any) => {
          const percentage = item.value / total
          const angle = percentage * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle = endAngle
          
          const x1 = 50 + 35 * Math.cos((startAngle - 90) * Math.PI / 180)
          const y1 = 50 + 35 * Math.sin((startAngle - 90) * Math.PI / 180)
          const x2 = 50 + 35 * Math.cos((endAngle - 90) * Math.PI / 180)
          const y2 = 50 + 35 * Math.sin((endAngle - 90) * Math.PI / 180)
          
          const largeArcFlag = angle > 180 ? 1 : 0
          
          return `<path d="M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2} Z" fill="${item.color}" stroke="white" stroke-width="1" />`
        }).join('')

        return `
          <div class="flex items-center space-x-4">
            <svg viewBox="0 0 100 100" class="w-24 h-24">
              ${donutSVG}
              <circle cx="50" cy="50" r="20" fill="white" />
            </svg>
            <div class="space-y-1">
              ${chart.data.map((item: any) => `
                <div class="flex items-center space-x-2 text-xs">
                  <div class="w-3 h-3 rounded-full" style="background-color: ${item.color}"></div>
                  <span class="text-gray-700 dark:text-gray-300">${item.label}: ${item.value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `
      
      default:
        return `<div class="text-gray-500 italic">Chart visualization not available in text mode</div>`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="bg-white dark:bg-[#1a1a1a] h-screen w-screen overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 p-4 border-b border-golden-500 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Meeting Notes</h2>
              <p className="text-sm opacity-90">{activityTitle}</p>
              {myNote && myNote.users && (
                <p className="text-xs opacity-75 mt-1">
                  By {myNote.users.first_name || myNote.users.email} • {new Date(myNote.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Text Formatting */}
            <button
              onClick={() => insertTextAtCursor('**', '**')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor('*', '*')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor('__', '__')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Underline"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor('`', '`')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Code"
            >
              <Code className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* Lists */}
            <button
              onClick={() => insertTextAtCursor('\n- ')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor('\n1. ')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertTextAtCursor('\n> ')}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* Media */}
            <button
              onClick={() => setShowChartBuilder(true)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Insert Chart"
            >
              <BarChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowTableBuilder(true)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Insert Table"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsCameraOpen(true)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Take Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-1.5 rounded ${isRecording ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Insert Dropdowns */}
            {charts.length > 0 && (
              <div className="relative group">
                <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                  Charts ({charts.length})
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg hidden group-hover:block z-10 min-w-[150px]">
                  {charts.map((chart, index) => (
                    <button
                      key={index}
                      onClick={() => insertChart(index)}
                      className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {chart.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tables.length > 0 && (
              <div className="relative group">
                <button className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">
                  Tables ({tables.length})
                </button>
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg hidden group-hover:block z-10 min-w-[150px]">
                  {tables.map((table, index) => (
                    <button
                      key={index}
                      onClick={() => insertTable(index)}
                      className="block w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {table.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4">
              <textarea
                ref={textareaRef}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Start typing your notes..."
                className="w-full h-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Files & Media at bottom */}
            <FileManager
              capturedImages={capturedImages}
              setCapturedImages={setCapturedImages}
              capturedDocuments={capturedDocuments}
              setCapturedDocuments={setCapturedDocuments}
              isEditing={true}
              ocrResults={ocrResults}
              setOcrResults={setOcrResults}
              isProcessingOCR={isProcessingOCR}
              selectedImageIndex={selectedImageIndex}
              processOCR={processOCR}
            />
          </div>

          {/* Right Side - Preview */}
          <div className="w-1/2 border-l border-gray-200 dark:border-gray-600 p-4 overflow-y-auto">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">Preview</h4>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {noteText ? (
                <div dangerouslySetInnerHTML={{ __html: renderFormattedText(noteText) }} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">Preview will appear here as you type...</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 p-4">
          <div className="flex justify-end">
            <button
              onClick={saveNotes}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Notes'}</span>
            </button>
          </div>
        </div>

        {/* Camera Interface */}
        <CameraInterface
          isCameraOpen={isCameraOpen}
          setIsCameraOpen={setIsCameraOpen}
          setCapturedImages={setCapturedImages}
          isEditing={true}
        />

        {/* Audio Recording */}
        <AudioRecorder
          isRecording={isRecording}
          setIsRecording={setIsRecording}
          recordingTime={recordingTime}
          setRecordingTime={setRecordingTime}
          audioBlob={audioBlob}
          setAudioBlob={setAudioBlob}
          isTranscribing={isTranscribing}
          setIsTranscribing={setIsTranscribing}
          transcription={transcription}
          setTranscription={setTranscription}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          audioWaveform={audioWaveform}
          setAudioWaveform={setAudioWaveform}
          isEditing={true}
        />

        {/* Charts Manager Modal */}
        <ChartsManager
          charts={charts}
          setCharts={setCharts}
          isEditing={true}
        />

        {/* Tables Manager Modal */}
        <TablesManager
          tables={tables}
          setTables={setTables}
          isEditing={true}
        />
      </div>
    </div>
  )
}