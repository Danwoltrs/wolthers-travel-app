'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Bold, Italic, List, ListOrdered, CheckSquare, Table, BarChart3, Clock, Users, Undo, Redo, Type, Building2, Mic, Camera, Download, FileDown, Mail, Square, ChevronDown, ChevronUp, Paperclip, Upload, File, Trash2, Maximize, Minimize } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import TableModal from './TableModal'
import ChartModal from './ChartModal'
import CompanyAccessManager from './CompanyAccessManager'
import ActivityParticipantsManager from './ActivityParticipantsManager'
import RecordingManager from './RecordingManager'
import MediaTimeline from './MediaTimeline'
import NoteTemplates from './NoteTemplates'
import EmailPromptModal from './EmailPromptModal'

interface SimpleNotesModalProps {
  isOpen: boolean
  onClose: () => void
  activityId: string
  activityTitle: string
  meetingDate?: Date
  companies?: Array<{
    id: string
    name: string
    representatives?: Array<{ name: string; email: string }>
  }>
  onNoteCountChange?: (newCount: number) => void
  tripId?: string
}

interface MediaEntry {
  id: string
  timestamp: number
  type: 'image' | 'audio' | 'transcript'
  content: string | File
  description?: string
  relativeTime: string
}

interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: Date
  uploadedBy: string
}

interface NoteContent {
  html: string
  plainText: string
  elements?: Array<{
    type: 'table' | 'chart'
    data: any
    position: number
  }>
  media?: MediaEntry[]
  attachments?: FileAttachment[]
}

export default function SimpleNotesModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  meetingDate = new Date(),
  companies = [],
  onNoteCountChange,
  tripId
}: SimpleNotesModalProps) {
  const { user } = useAuth()
  const editorRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState<NoteContent>({ html: '', plainText: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [showTableModal, setShowTableModal] = useState(false)
  const [showChartModal, setShowChartModal] = useState(false)
  const [companiesWithAccess, setCompaniesWithAccess] = useState<Array<{
    id: string
    name: string
    representatives?: Array<{ name: string; email: string }>
  }>>(companies)
  const [activityParticipants, setActivityParticipants] = useState<Array<{
    id: string
    participant_id: string
    role?: string
    attendance_status?: string
    user?: {
      id: string
      email: string
      full_name: string
      company?: { id: string; name: string }
    }
  }>>([])
  const [mediaEntries, setMediaEntries] = useState<MediaEntry[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [showMediaTimeline, setShowMediaTimeline] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)
  const [fileAttachments, setFileAttachments] = useState<FileAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [audioWaveData, setAudioWaveData] = useState<number[]>(new Array(30).fill(0))
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState<string>('')
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false)
  const recordingManagerRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Load existing notes
  useEffect(() => {
    if (isOpen && activityId) {
      loadNotes()
      loadActivityParticipants()
    }
  }, [isOpen, activityId])

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveNote(true) // Silent save
      }
    }, 5000)

    return () => clearInterval(autoSaveInterval)
  }, [hasUnsavedChanges])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        const target = event.target as Element
        if (!target.closest('.export-menu-container')) {
          setShowExportMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Cleanup audio resources when modal closes
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording()
      }
    }
  }, [isOpen])

  const loadNotes = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/notes`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        const notes = result.notes || []
        
        // Find the user's note (there should be only one per activity per user)
        const userNote = notes.length > 0 ? notes[0] : null

        if (userNote && userNote.content) {
          if (typeof userNote.content === 'object') {
            const noteContent = userNote.content as NoteContent
            setContent(noteContent)
            if (editorRef.current) {
              editorRef.current.innerHTML = noteContent.html || ''
            }
            // Load media entries if they exist
            if (noteContent.media && Array.isArray(noteContent.media)) {
              setMediaEntries(noteContent.media)
            }
            // Load file attachments if they exist
            if (noteContent.attachments && Array.isArray(noteContent.attachments)) {
              setFileAttachments(noteContent.attachments.map(att => ({
                ...att,
                uploadedAt: new Date(att.uploadedAt)
              })))
            }
          } else {
            // Legacy plain text content
            const htmlContent = userNote.content.replace(/\n/g, '<br>')
            setContent({ 
              html: htmlContent, 
              plainText: userNote.content 
            })
            if (editorRef.current) {
              editorRef.current.innerHTML = htmlContent
            }
          }
          setLastSaved(new Date(userNote.updated_at))
        } else {
          // New note - add meeting title and attendees
          const companyList = companies.length > 0 
            ? companies.map(c => {
                const reps = c.representatives && c.representatives.length > 0 
                  ? ` (${c.representatives.map(r => r.name).join(', ')})` 
                  : ''
                return `${c.name}${reps}`
              }).join('<br>')
            : ''
          
          const initialContent = `<h3>${activityTitle}</h3><p><strong>${formatMeetingDateTime(new Date())}</strong></p>${companies.length > 0 ? `<p><strong>Companies Present:</strong><br>${companyList}</p>` : ''}<p><br></p><p class="placeholder-text" style="color: #9ca3af; font-style: italic;">Click here to start writing your meeting notes...</p>`
          setContent({ html: initialContent, plainText: activityTitle })
          if (editorRef.current) {
            editorRef.current.innerHTML = initialContent
          }
        }
      }
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
  }

  const loadActivityParticipants = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/participants`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        setActivityParticipants(result.participants || [])
      }
    } catch (error) {
      console.error('Failed to load activity participants:', error)
    }
  }

  const refreshNoteCount = async () => {
    if (!tripId || !onNoteCountChange) return
    
    try {
      console.log('SimpleNotesModal: Refreshing note count for trip:', tripId)
      
      // Use GET request with query parameter for consistency
      const response = await fetch(`/api/trips/notes-summary?trip_ids=${tripId}`, {
        method: 'GET',
        credentials: 'include' // Use cookie-based authentication
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Extract the count for this specific trip from the data object
          onNoteCountChange(result.data[tripId] || 0)
        }
      }
    } catch (error) {
      console.error('Failed to refresh note count:', error)
    }
  }

  const saveNote = async (silent = false) => {
    if (!editorRef.current || !user) return

    if (!silent) setIsSaving(true)

    try {
      const htmlContent = editorRef.current.innerHTML
      const plainTextContent = editorRef.current.innerText
      
      const noteContent: NoteContent = {
        html: htmlContent,
        plainText: plainTextContent,
        elements: content.elements,
        media: mediaEntries,
        attachments: fileAttachments
      }

      // Include company access information in the note metadata
      const noteData = {
        content: noteContent,
        company_access: companiesWithAccess.map(company => ({
          company_id: company.id,
          company_name: company.name,
          representatives: company.representatives || []
        }))
      }

      const response = await fetch(`/api/activities/${activityId}/notes`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData)
      })

      if (response.ok) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        setContent(noteContent)
        
        // Refresh note count for trip cards/quick view
        await refreshNoteCount()
        
        if (!silent) {
          setTimeout(() => setIsSaving(false), 500)
        }
      } else {
        // Get the actual error details from the API response
        const errorData = await response.text()
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        })
        throw new Error(`Failed to save note: ${response.status} ${response.statusText} - ${errorData}`)
      }
    } catch (error) {
      console.error('Failed to save note:', error)
      if (!silent) {
        setIsSaving(false)
        alert('Failed to save note. Please try again.')
      }
    }
  }

  const handleContentChange = () => {
    if (editorRef.current) {
      setHasUnsavedChanges(true)
    }
  }

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim())
    } else {
      setSelectedText('')
    }
  }

  const handleEditorClick = () => {
    if (editorRef.current) {
      const placeholderElement = editorRef.current.querySelector('.placeholder-text')
      if (placeholderElement) {
        placeholderElement.remove()
        // Focus the editor after removing placeholder
        editorRef.current.focus()
        
        // Place cursor at the end of content
        const range = document.createRange()
        const selection = window.getSelection()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        selection?.removeAllRanges()
        selection?.addRange(range)
      }
    }
  }

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    handleContentChange()
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }

  const insertList = (ordered: boolean = false) => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      // Convert selected text to list
      const selectedText = selection.toString()
      const lines = selectedText.split('\n').filter(line => line.trim())
      const listItems = lines.map(line => `<li>${line.trim()}</li>`).join('')
      const listHtml = ordered ? `<ol>${listItems}</ol>` : `<ul>${listItems}</ul>`
      
      document.execCommand('insertHTML', false, listHtml)
    } else {
      // Insert empty list
      formatText(ordered ? 'insertOrderedList' : 'insertUnorderedList')
    }
    handleContentChange()
  }

  const insertCheckboxList = () => {
    const checkboxHtml = `<div contenteditable="false" style="display: flex; align-items: center; margin: 4px 0;">
      <input type="checkbox" style="margin-right: 8px;" onchange="this.nextSibling.style.textDecoration = this.checked ? 'line-through' : 'none'">
      <span contenteditable="true" style="flex: 1;">Task item</span>
    </div>`
    document.execCommand('insertHTML', false, checkboxHtml)
    handleContentChange()
  }

  const insertTable = (tableHtml: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertHTML', false, tableHtml)
      handleContentChange()
    }
  }

  const insertChart = (chartHtml: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertHTML', false, chartHtml)
      handleContentChange()
    }
  }

  const insertTemplate = (templateHtml: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertHTML', false, templateHtml)
      handleContentChange()
    }
  }

  const handleMediaAdd = (media: MediaEntry) => {
    setMediaEntries(prev => [...prev, media])
    setHasUnsavedChanges(true)
    
    // Auto-insert transcript into editor
    if (media.type === 'transcript' && media.content && typeof media.content === 'string') {
      insertTranscriptIntoEditor(media.content)
    }
  }

  const handleMediaRemove = (mediaId: string) => {
    setMediaEntries(prev => prev.filter(entry => entry.id !== mediaId))
    setHasUnsavedChanges(true)
  }

  const handleTranscriptUpdate = (transcript: string) => {
    // Live transcript updates during recording - no need to save immediately
    if (editorRef.current && transcript.trim()) {
      const existingTranscript = editorRef.current.querySelector('[data-live-transcript]')
      if (existingTranscript) {
        existingTranscript.textContent = `"${transcript}"`
      } else {
        // Insert live transcript indicator
        const transcriptElement = `<div data-live-transcript style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 8px; margin: 8px 0; font-style: italic; color: #1e40af;">"${transcript}"</div>`
        document.execCommand('insertHTML', false, transcriptElement)
      }
    }
  }

  const insertTranscriptIntoEditor = (transcript: string) => {
    if (editorRef.current) {
      // Remove any live transcript indicators
      const liveTranscript = editorRef.current.querySelector('[data-live-transcript]')
      if (liveTranscript) {
        liveTranscript.remove()
      }
      
      // Insert final transcript
      const finalTranscript = `<div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 8px; margin: 8px 0;"><strong>Transcript:</strong><br>${transcript}</div>`
      document.execCommand('insertHTML', false, finalTranscript)
      handleContentChange()
    }
  }

  const insertMediaIntoEditor = (media: MediaEntry) => {
    if (editorRef.current) {
      editorRef.current.focus()
      
      if (media.type === 'image' && media.content instanceof File) {
        const imageUrl = URL.createObjectURL(media.content)
        const imageHtml = `<div style="margin: 16px 0; text-align: center;"><img src="${imageUrl}" alt="${media.description || 'Captured image'}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"><br><small style="color: #666; font-style: italic;">${media.description || 'Captured image'} - ${media.relativeTime}</small></div>`
        document.execCommand('insertHTML', false, imageHtml)
      } else if (media.type === 'transcript' && typeof media.content === 'string') {
        insertTranscriptIntoEditor(media.content)
      }
      
      handleContentChange()
    }
  }

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)
      
      // Create audio context for waveform visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyzer = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      analyzer.fftSize = 256
      analyzer.smoothingTimeConstant = 0.3
      source.connect(analyzer)
      
      audioContextRef.current = audioContext
      analyzerRef.current = analyzer
      
      // Start media recorder
      const recorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Add to media entries
        const mediaEntry: MediaEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'audio',
          content: audioBlob,
          description: 'Voice recording',
          relativeTime: formatRelativeTime(0)
        }
        
        handleMediaAdd(mediaEntry)
        
        // Process transcription
        await processRecordingTranscription(audioBlob)
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      
      // Start waveform animation
      updateWaveform()
      
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Failed to access microphone. Please check your permissions and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop())
      setAudioStream(null)
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    setMediaRecorder(null)
    setIsRecording(false)
    setAudioWaveData(new Array(30).fill(0))
    analyzerRef.current = null
  }

  const updateWaveform = () => {
    if (!analyzerRef.current) return
    
    const bufferLength = analyzerRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyzerRef.current.getByteFrequencyData(dataArray)
    
    // Calculate average amplitude for visualization
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
    const normalizedValue = average / 255 // Normalize to 0-1
    
    setAudioWaveData(prev => {
      const newData = [...prev.slice(1), normalizedValue]
      return newData
    })
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(updateWaveform)
    }
  }

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const formatRelativeTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const processRecordingTranscription = async (audioBlob: Blob) => {
    try {
      setIsProcessingTranscript(true)
      
      // Convert audio to text using the existing transcription API
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      formData.append('activityId', activityId)
      
      const transcriptionResponse = await fetch(`/api/activities/${activityId}/transcribe`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (transcriptionResponse.ok) {
        const transcriptionResult = await transcriptionResponse.json()
        const transcript = transcriptionResult.transcript || 'Unable to transcribe audio'
        
        setCurrentTranscript(transcript)
        setShowTranscriptDialog(true)
      } else {
        console.error('Transcription failed:', transcriptionResponse.statusText)
        alert('Failed to transcribe audio. You can still access the recording in the media timeline.')
      }
    } catch (error) {
      console.error('Transcription error:', error)
      alert('Failed to process recording. You can still access the recording in the media timeline.')
    } finally {
      setIsProcessingTranscript(false)
    }
  }

  const generateAISummary = async (transcript: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai/summarize-transcript', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          context: {
            activityTitle,
            meetingDate: meetingDate.toISOString(),
            companies: companiesWithAccess.map(c => c.name)
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        return result.summary || 'Unable to generate summary'
      } else {
        console.error('AI summary failed:', response.statusText)
        return 'Unable to generate AI summary'
      }
    } catch (error) {
      console.error('AI summary error:', error)
      return 'Unable to generate AI summary'
    }
  }

  const handleTranscriptChoice = async (choice: 'ai_summary' | 'full_transcript' | 'skip') => {
    setShowTranscriptDialog(false)
    
    if (choice === 'skip') {
      return
    }
    
    let contentToInsert = ''
    
    if (choice === 'full_transcript') {
      contentToInsert = `<div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 12px; margin: 16px 0;"><strong>Recording Transcript:</strong><br><em>${new Date().toLocaleTimeString()}</em><br><br>${currentTranscript.replace(/\n/g, '<br>')}</div>`
    } else if (choice === 'ai_summary') {
      // Show loading state
      if (editorRef.current) {
        const loadingContent = `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0;"><strong>Generating AI Summary...</strong><br><em>Processing your recording...</em></div>`
        editorRef.current.focus()
        document.execCommand('insertHTML', false, loadingContent)
        handleContentChange()
      }
      
      // Generate AI summary
      const summary = await generateAISummary(currentTranscript)
      
      // Replace loading with actual summary
      if (editorRef.current) {
        // Remove the loading div
        const loadingDiv = editorRef.current.querySelector('div[style*="fef3c7"]')
        if (loadingDiv) {
          loadingDiv.remove()
        }
        
        contentToInsert = `<div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 16px 0;"><strong>AI Summary:</strong><br><em>${new Date().toLocaleTimeString()}</em><br><br>${summary.replace(/\n/g, '<br>')}</div>`
      }
    }
    
    // Insert content into editor
    if (contentToInsert && editorRef.current) {
      editorRef.current.focus()
      document.execCommand('insertHTML', false, contentToInsert)
      handleContentChange()
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!user || files.length === 0) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`)
          continue
        }

        // Create form data for upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('activityId', activityId)

        // Upload to Supabase storage via API
        const uploadResponse = await fetch('/api/files/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          
          // Create attachment object
          const attachment: FileAttachment = {
            id: uploadResult.id || crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: uploadResult.url,
            uploadedAt: new Date(),
            uploadedBy: user.full_name || user.email
          }

          // Add to attachments list
          setFileAttachments(prev => [...prev, attachment])
          setHasUnsavedChanges(true)
        } else {
          const error = await uploadResponse.json()
          console.error('Upload failed:', error)
          alert(`Failed to upload "${file.name}": ${error.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
    }
  }

  const removeAttachment = (attachmentId: string) => {
    setFileAttachments(prev => prev.filter(att => att.id !== attachmentId))
    setHasUnsavedChanges(true)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatMeetingDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Export Functions
  const exportAsHTML = async () => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meeting Notes - ${activityTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #e5e7eb; margin-bottom: 20px; padding-bottom: 15px; }
        .meta { color: #6b7280; font-size: 14px; margin: 5px 0; }
        .content { margin: 20px 0; }
        .media-item { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; background: #f9fafb; }
        .transcript { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin: 10px 0; }
        .companies { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px; border-radius: 6px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${activityTitle}</h1>
        <div class="meta">Date: ${formatMeetingDateTime(meetingDate)}</div>
        ${companiesWithAccess.length > 0 ? `
        <div class="companies">
            <strong>Companies with Access:</strong><br>
            ${companiesWithAccess.map(c => `${c.name}${c.representatives ? ` (${c.representatives.map(r => r.name).join(', ')})` : ''}`).join('<br>')}
        </div>` : ''}
    </div>
    
    <div class="content">
        ${content.html}
    </div>
    
    ${mediaEntries.length > 0 ? `
    <div class="media-section">
        <h2>Media Timeline</h2>
        ${mediaEntries.map(entry => `
            <div class="media-item">
                <strong>${entry.type.toUpperCase()}</strong> - ${entry.relativeTime}<br>
                ${entry.description ? `<em>${entry.description}</em><br>` : ''}
                ${entry.type === 'transcript' && typeof entry.content === 'string' ? 
                    `<div class="transcript">${entry.content}</div>` : 
                    entry.type === 'image' ? 
                        `<p>Image captured (${entry.description || 'Untitled'})</p>` : 
                        `<p>Audio recording (${entry.description || 'Untitled'})</p>`
                }
            </div>
        `).join('')}
    </div>` : ''}
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        Generated from Wolthers Travel App - ${new Date().toLocaleString()}
    </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-notes-${activityTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const exportAsText = () => {
    let textContent = `MEETING NOTES\n`
    textContent += `${'='.repeat(50)}\n\n`
    textContent += `Activity: ${activityTitle}\n`
    textContent += `Date: ${formatMeetingDateTime(meetingDate)}\n\n`
    
    if (companiesWithAccess.length > 0) {
      textContent += `Companies Present:\n`
      companiesWithAccess.forEach(c => {
        textContent += `- ${c.name}`
        if (c.representatives) {
          textContent += ` (${c.representatives.map(r => r.name).join(', ')})`
        }
        textContent += `\n`
      })
      textContent += `\n`
    }
    
    textContent += `CONTENT:\n`
    textContent += `${'-'.repeat(20)}\n`
    textContent += `${content.plainText}\n\n`
    
    if (mediaEntries.length > 0) {
      textContent += `MEDIA TIMELINE:\n`
      textContent += `${'-'.repeat(20)}\n`
      mediaEntries.forEach(entry => {
        textContent += `[${entry.relativeTime}] ${entry.type.toUpperCase()}`
        if (entry.description) textContent += ` - ${entry.description}`
        textContent += `\n`
        if (entry.type === 'transcript' && typeof entry.content === 'string') {
          textContent += `"${entry.content}"\n`
        }
        textContent += `\n`
      })
    }
    
    textContent += `\nGenerated: ${new Date().toLocaleString()}`
    
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meeting-notes-${activityTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  const handleEmailSend = async (recipients: string[]) => {
    const subject = `Meeting Notes: ${activityTitle} - ${new Date().toLocaleDateString()}`
    
    const response = await fetch('/api/notes/email', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        activityTitle: activityTitle,
        meetingDate: meetingDate,
        content: content,
        companies: companiesWithAccess,
        mediaEntries: mediaEntries,
        attachments: fileAttachments
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        return result
      } else {
        throw new Error(result.error || 'Failed to send emails')
      }
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send emails')
    }
  }

  const exportForEmail = () => {
    setShowExportMenu(false)
    setShowEmailModal(true)
  }

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (modalRef.current?.requestFullscreen) {
          await modalRef.current.requestFullscreen()
        } else if ((modalRef.current as any)?.webkitRequestFullscreen) {
          await (modalRef.current as any).webkitRequestFullscreen()
        } else if ((modalRef.current as any)?.mozRequestFullScreen) {
          await (modalRef.current as any).mozRequestFullScreen()
        } else if ((modalRef.current as any)?.msRequestFullscreen) {
          await (modalRef.current as any).msRequestFullscreen()
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen()
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen()
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-50 bg-black/60 flex items-center justify-center p-2 md:p-4">
      <div 
        ref={modalRef}
        className={`bg-white dark:bg-[#1a1a1a] w-full overflow-hidden flex flex-col shadow-2xl border border-pearl-200 dark:border-[#2a2a2a] ${
          isFullscreen 
            ? 'h-screen max-w-none rounded-none' 
            : 'max-w-6xl h-[85vh] max-h-none rounded-lg'
        }`}
      >
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] p-4 border-b border-golden-500 dark:border-[#0a2e21] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-green-700 dark:text-golden-400">{activityTitle}</h2>
                <div className="text-sm text-gray-700 dark:text-golden-400/70 flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatMeetingDateTime(meetingDate)}</span>
                  </div>
                  {companiesWithAccess.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>{companiesWithAccess.length} {companiesWithAccess.length === 1 ? 'company' : 'companies'} with access</span>
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
                onClick={() => saveNote(false)}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-golden-400"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </button>

              {/* Export Menu */}
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors text-gray-700 dark:text-golden-400"
                >
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Export</span>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                    <div className="py-1">
                      <button
                        onClick={exportAsHTML}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Export as HTML</span>
                      </button>
                      <button
                        onClick={exportAsText}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Export as Text</span>
                      </button>
                      <button
                        onClick={exportForEmail}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Prepare for Email</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-700 dark:text-golden-400"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-700 dark:text-golden-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center space-x-2 flex-wrap gap-2 relative">
            {/* Templates */}
            <NoteTemplates onInsertTemplate={insertTemplate} />

            {/* Text Formatting */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                onClick={() => formatText('bold')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('italic')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                onClick={() => insertList(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => insertList(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                onClick={insertCheckboxList}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Checkbox List"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            </div>

            {/* Advanced Elements */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                onClick={() => setShowTableModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Insert Table"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowChartModal(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Insert Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* File Attachments */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                onClick={handleFileSelect}
                disabled={isUploading}
                className={`p-2 rounded transition-colors ${
                  isUploading 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Attach Files"
              >
                {isUploading ? <Upload className="w-4 h-4 animate-pulse" /> : <Paperclip className="w-4 h-4" />}
              </button>
              {fileAttachments.length > 0 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  {fileAttachments.length} files
                </span>
              )}
            </div>

            {/* Single Recording Button */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                onClick={handleRecordingToggle}
                className={`p-2 rounded transition-colors ${
                  isRecording 
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => formatText('undo')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button
                onClick={() => formatText('redo')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Waveform Visualization */}
            {isRecording && (
              <div className="ml-auto flex items-center space-x-2">
                <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 dark:bg-red-900/10 rounded">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">Recording</span>
                </div>
                <div className="flex items-center h-8 px-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-end space-x-1 h-6">
                    {audioWaveData.map((amplitude, index) => (
                      <div
                        key={index}
                        className="w-1 bg-gradient-to-t from-emerald-500 to-emerald-300 dark:from-emerald-400 dark:to-emerald-200 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(2, amplitude * 24)}px`,
                          opacity: isRecording ? 0.8 + (amplitude * 0.2) : 0.3
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Selected text indicator */}
            {selectedText && !isRecording && (
              <div className="flex items-center space-x-2 ml-auto">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  "{selectedText.substring(0, 30)}{selectedText.length > 30 ? '...' : ''}"
                </span>
                <button
                  onClick={() => insertList(false)}
                  className="text-xs bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  Make Bullets
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white dark:bg-[#1a1a1a] overflow-auto">
          <div className="max-w-3xl mx-auto p-6">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[300px] focus:outline-none prose prose-base max-w-none dark:prose-invert text-gray-700 dark:text-[#F5F5DC]"
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
              }}
              data-placeholder="Start typing your meeting notes..."
              onInput={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              onClick={handleEditorClick}
              placeholder="Start typing your meeting notes..."
            />
          </div>
        </div>

        {/* Media Timeline Panel */}
        {showMediaTimeline && (
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recording & Media
                </span>
                {mediaEntries.length > 0 && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    {mediaEntries.length} items
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title={isMinimized ? "Expand Panel" : "Minimize Panel"}
                >
                  {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setShowMediaTimeline(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Close Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            {!isMinimized && (
              <div className="max-w-3xl mx-auto p-4">
                {/* Recording Controls */}
                <div className="mb-4">
                  <RecordingManager
                    ref={recordingManagerRef}
                    onTranscriptUpdate={handleTranscriptUpdate}
                    onMediaAdd={handleMediaAdd}
                    isRecording={isRecording}
                    onRecordingStateChange={setIsRecording}
                  />
                </div>
                
                {/* Media Timeline */}
                <MediaTimeline
                  mediaEntries={mediaEntries}
                  onRemoveMedia={handleMediaRemove}
                  onInsertMediaIntoEditor={insertMediaIntoEditor}
                />
              </div>
            )}
          </div>
        )}

        {/* Status Bar with Company Access */}
        <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {/* Company Access Management */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <CompanyAccessManager
              activityId={activityId}
              companies={companiesWithAccess}
              onCompaniesChange={setCompaniesWithAccess}
              readOnly={false}
            />
          </div>

          {/* Activity Participants Management */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
            <ActivityParticipantsManager
              activityId={activityId}
              participants={activityParticipants}
              onParticipantsChange={setActivityParticipants}
              readOnly={false}
            />
          </div>

          {/* File Attachments Management */}
          {fileAttachments.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <File className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    File Attachments ({fileAttachments.length})
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {fileAttachments.map(attachment => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <a 
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                            >
                              {attachment.name}
                            </a>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(attachment.size)} • {attachment.uploadedBy} • {attachment.uploadedAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeAttachment(attachment.id)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors ml-2 flex-shrink-0"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Editor Stats */}
          <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span>Rich Text Editor</span>
              <span>Auto-save enabled</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Words: {content.plainText ? content.plainText.split(' ').length : 0}</span>
              <span>Characters: {content.plainText ? content.plainText.length : 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {/* Table Modal */}
      <TableModal 
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onInsert={insertTable}
      />

      {/* Chart Modal */}
      <ChartModal 
        isOpen={showChartModal}
        onClose={() => setShowChartModal(false)}
        onInsert={insertChart}
      />

      {/* Transcript Processing Dialog */}
      {showTranscriptDialog && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-4 text-white">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Recording Processed Successfully
              </h3>
              <p className="text-sm text-white/90 mt-1">
                Choose how to add this recording to your notes
              </p>
            </div>
            
            <div className="p-6">
              {isProcessingTranscript ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Processing your recording...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">This may take a moment</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Preview:</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border max-h-32 overflow-y-auto">
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                        "{currentTranscript.length > 200 ? currentTranscript.substring(0, 200) + '...' : currentTranscript}"
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      What would you like to add to your notes?
                    </p>
                    
                    <button
                      onClick={() => handleTranscriptChoice('ai_summary')}
                      className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">🤖</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300">
                            AI Summary (Recommended)
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Get a concise, intelligent summary of key points and insights
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleTranscriptChoice('full_transcript')}
                      className="w-full p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">📝</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                            Full Transcript
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Add the complete word-for-word transcription
                          </p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleTranscriptChoice('skip')}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">×</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                            Don't Add to Notes
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Keep the audio recording only (available in media timeline)
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Prompt Modal */}
      <EmailPromptModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleEmailSend}
        activityTitle={activityTitle}
        companies={companiesWithAccess}
        activityParticipants={activityParticipants}
        tripId={tripId}
      />
    </div>
  )
}