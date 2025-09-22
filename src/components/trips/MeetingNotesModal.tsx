'use client'

import React, { useState, useEffect } from 'react'
import { X, Edit2, Save, Eye } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import TextEditor from '@/components/meeting-notes/TextEditor'
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
  
  // Main state
  const [isEditing, setIsEditing] = useState(false)
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
        .select('*')
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

  const startEditing = () => {
    setIsEditing(true)
  }

  const stopEditing = async () => {
    if (hasUnsavedChanges) {
      const shouldSave = confirm('You have unsaved changes. Do you want to save them before exiting edit mode?')
      if (shouldSave) {
        await saveNotes()
      }
    }
    setIsEditing(false)
  }

  const processOCR = async (imageFile: File, index: number) => {
    setIsProcessingOCR(true)
    setSelectedImageIndex(index)
    
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Image = reader.result as string
        
        try {
          const response = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              image: base64Image.split(',')[1], // Remove data:image/jpeg;base64, prefix
              mimeType: imageFile.type
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            const extractedText = data.text || 'No text detected'
            
            setOcrResults(prev => {
              const newResults = [...prev]
              newResults[index] = extractedText
              return newResults
            })
            
            // Optionally append to note text
            if (extractedText && extractedText !== 'No text detected') {
              setNoteText(prev => prev + (prev ? '\n\n' : '') + `**Extracted from ${imageFile.name}:**\n${extractedText}`)
            }
          } else {
            throw new Error('OCR processing failed')
          }
        } catch (error) {
          console.error('OCR error:', error)
          setOcrResults(prev => {
            const newResults = [...prev]
            newResults[index] = 'Error processing image'
            return newResults
          })
        }
      }
      reader.readAsDataURL(imageFile)
    } catch (error) {
      console.error('Error preparing image for OCR:', error)
      alert('Failed to extract text from image. Please try again.')
    } finally {
      setIsProcessingOCR(false)
      setSelectedImageIndex(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-golden-400 dark:border-[#2a2a2a] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 p-4 border-b border-golden-500 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Meeting Notes</h2>
              <p className="text-sm opacity-90">{activityTitle}</p>
            </div>
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              {isEditing ? (
                <div className="flex space-x-2">
                  <button
                    onClick={saveNotes}
                    disabled={isSaving}
                    className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={stopEditing}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Mode</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Text Editor */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notes</h3>
            
            {myNote?.content?.text || isEditing ? (
              <TextEditor
                content={noteText}
                setContent={setNoteText}
                isEditing={isEditing}
                charts={charts}
                tables={tables}
                onOpenChartBuilder={() => {}}
                onOpenTableBuilder={() => {}}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No notes yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start taking notes for this meeting
                </p>
                <button
                  onClick={startEditing}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Add Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Camera Interface */}
          <CameraInterface
            isCameraOpen={isCameraOpen}
            setIsCameraOpen={setIsCameraOpen}
            setCapturedImages={setCapturedImages}
            isEditing={isEditing}
          />

          {/* Files & Media */}
          <FileManager
            capturedImages={capturedImages}
            setCapturedImages={setCapturedImages}
            capturedDocuments={capturedDocuments}
            setCapturedDocuments={setCapturedDocuments}
            isEditing={isEditing}
            ocrResults={ocrResults}
            setOcrResults={setOcrResults}
            isProcessingOCR={isProcessingOCR}
            selectedImageIndex={selectedImageIndex}
            processOCR={processOCR}
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
            isEditing={isEditing}
          />

          {/* Charts */}
          <ChartsManager
            charts={charts}
            setCharts={setCharts}
            isEditing={isEditing}
          />

          {/* Tables */}
          <TablesManager
            tables={tables}
            setTables={setTables}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  )
}