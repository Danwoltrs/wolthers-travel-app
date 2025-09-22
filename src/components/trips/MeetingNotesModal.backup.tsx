'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Plus, 
  Save,
  Upload,
  FileText,
  Image as ImageIcon,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Camera,
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Table,
  BarChart3,
  Edit3,
  Eye,
  EyeOff,
  User,
  Clock,
  Volume2
} from 'lucide-react'
import { cn, formatDate as utilsFormatDate } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

interface Activity {
  id: string
  title: string
  description?: string
  activity_date: string
  start_time?: string
  end_time?: string
}

interface Note {
  id: string
  user_id: string
  content: any // Rich text JSON content
  is_private: boolean
  created_at: string
  updated_at: string
  created_by_name: string
  attachments?: NoteAttachment[]
}

interface NoteAttachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  uploaded_at: string
}

interface MeetingNotesModalProps {
  activity: Activity
  tripType: 'convention' | 'in_land'
  isOpen: boolean
  onClose: () => void
}

export default function MeetingNotesModal({ 
  activity, 
  tripType, 
  isOpen, 
  onClose 
}: MeetingNotesModalProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'my-notes' | 'all-notes' | 'private-notes'>('my-notes')
  const [notes, setNotes] = useState<Note[]>([])
  const [myNote, setMyNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Rich text editor refs
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioWaveform, setAudioWaveform] = useState<number[]>([])
  
  // Camera and OCR state
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImages, setCapturedImages] = useState<File[]>([])
  const [capturedDocuments, setCapturedDocuments] = useState<File[]>([])
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrResults, setOcrResults] = useState<string[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    selectedText: string
    selectionStart: number
    selectionEnd: number
  }>({
    show: false,
    x: 0,
    y: 0,
    selectedText: '',
    selectionStart: 0,
    selectionEnd: 0
  })
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Load notes when modal opens
  useEffect(() => {
    if (isOpen && activity.id) {
      loadNotes()
    }
  }, [isOpen, activity.id])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/activities/${activity.id}/notes`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
        
        // Find current user's note
        const userNote = data.notes?.find((note: Note) => note.user_id === user?.id && !note.is_private)
        if (userNote) {
          setMyNote(userNote)
          setNoteContent(userNote.content?.text || '')
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveNote = async () => {
    if (!noteContent.trim() || !user) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/activities/${activity.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          content: { text: noteContent, version: '1.0' },
          is_private: isPrivate,
          created_by_name: user.full_name || user.email
        })
      })

      if (response.ok) {
        const savedNote = await response.json()
        setMyNote(savedNote)
        setIsEditing(false)
        loadNotes() // Refresh all notes
      }
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setSaving(false)
    }
  }

  const startEditing = () => {
    setIsEditing(true)
    if (myNote) {
      setNoteContent(myNote.content?.text || '')
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setNoteContent(myNote?.content?.text || '')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    // Handle timezone properly - if it's a date-only string, add timezone offset
    if (typeof dateString === 'string' && dateString.includes('T')) {
      date.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      
      // Create audio context for waveform visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      source.connect(analyser)
      analyserRef.current = analyser
      
      // Visualize audio levels
      const updateWaveform = () => {
        if (analyser && isRecording) {
          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength
          setAudioWaveform(prev => [...prev.slice(-50), average].slice(-50)) // Keep last 50 samples
          requestAnimationFrame(updateWaveform)
        }
      }
      updateWaveform()
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        audioContext.close()
        
        // Stop the stream
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setAudioWaveform([])
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audioRef.current = audio
      
      audio.onended = () => {
        setIsPlaying(false)
      }
      
      audio.play()
      setIsPlaying(true)
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return
    
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('activity_id', activity.id)
      
      const response = await fetch(`/api/activities/${activity.id}/transcribe`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        setTranscription(result.transcription)
        
        // Append transcription to note content
        const transcriptText = `\n\n--- Audio Transcription (${formatTime(recordingTime)}) ---\n${result.transcription}`
        setNoteContent(prev => prev + transcriptText)
      } else {
        console.error('Transcription failed')
        alert('Failed to transcribe audio. Please try again.')
      }
    } catch (error) {
      console.error('Error transcribing audio:', error)
      alert('Error transcribing audio. Please try again.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const clearRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    setTranscription('')
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Camera and OCR functions
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      cameraStreamRef.current = stream
      setIsCameraOpen(true)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error opening camera:', error)
      alert('Could not access camera. Please check permissions.')
    }
  }

  const closeCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop())
      cameraStreamRef.current = null
    }
    setIsCameraOpen(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob and add to captured images
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `conference-slide-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setCapturedImages(prev => [...prev, file])
      }
    }, 'image/jpeg', 0.9)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }

  const processFiles = (files: File[]) => {
    const imageFiles: File[] = []
    const documentFiles: File[] = []

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file)
      } else {
        // Documents: PDF, Word, Excel, PowerPoint, text files, etc.
        const documentTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'application/json',
          'application/xml'
        ]
        
        if (documentTypes.includes(file.type) || file.name.match(/\.(txt|doc|docx|pdf|xls|xlsx|ppt|pptx|csv|json|xml)$/i)) {
          documentFiles.push(file)
        }
      }
    })

    if (imageFiles.length > 0) {
      setCapturedImages(prev => [...prev, ...imageFiles])
    }
    if (documentFiles.length > 0) {
      setCapturedDocuments(prev => [...prev, ...documentFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const processOCR = async (imageFile: File, index: number) => {
    setIsProcessingOCR(true)
    setSelectedImageIndex(index)

    try {
      // Create form data for the image
      const formData = new FormData()
      formData.append('image', imageFile)

      // Call OCR API endpoint (we'll create this)
      const response = await fetch(`/api/activities/${activity.id}/ocr`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        throw new Error('OCR processing failed')
      }

      const result = await response.json()
      const extractedText = result.text || ''

      // Update OCR results
      setOcrResults(prev => {
        const newResults = [...prev]
        newResults[index] = extractedText
        return newResults
      })

      // Add extracted text to note content
      if (extractedText.trim()) {
        const currentContent = noteContent
        const newContent = currentContent + (currentContent ? '\n\n' : '') + 
                          `📸 **Image ${index + 1} - ${imageFile.name}:**\n${extractedText}\n`
        setNoteContent(newContent)
      }

    } catch (error) {
      console.error('OCR Error:', error)
      alert('Failed to extract text from image. Please try again.')
    } finally {
      setIsProcessingOCR(false)
      setSelectedImageIndex(null)
    }
  }

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index))
    setOcrResults(prev => prev.filter((_, i) => i !== index))
  }

  const removeDocument = (index: number) => {
    setCapturedDocuments(prev => prev.filter((_, i) => i !== index))
  }

  // Rich text formatting functions
  const insertTextAtCursor = (beforeText: string, afterText: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = noteContent.substring(start, end)
    
    const newText = noteContent.substring(0, start) + 
                   beforeText + selectedText + afterText + 
                   noteContent.substring(end)
    
    setNoteContent(newText)
    
    // Restore cursor position after state update
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = start + beforeText.length + selectedText.length + afterText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }
    }, 0)
  }

  const formatBold = () => {
    insertTextAtCursor('**', '**')
  }

  const formatItalic = () => {
    insertTextAtCursor('*', '*')
  }

  const formatBulletList = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = noteContent.lastIndexOf('\n', start - 1) + 1
    const newText = noteContent.substring(0, lineStart) + 
                   '• ' + 
                   noteContent.substring(lineStart)
    
    setNoteContent(newText)
    setTimeout(() => {
      if (textarea) {
        textarea.setSelectionRange(start + 2, start + 2)
        textarea.focus()
      }
    }, 0)
  }

  const formatNumberedList = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = noteContent.lastIndexOf('\n', start - 1) + 1
    const newText = noteContent.substring(0, lineStart) + 
                   '1. ' + 
                   noteContent.substring(lineStart)
    
    setNoteContent(newText)
    setTimeout(() => {
      if (textarea) {
        textarea.setSelectionRange(start + 3, start + 3)
        textarea.focus()
      }
    }, 0)
  }

  const formatCheckbox = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = noteContent.lastIndexOf('\n', start - 1) + 1
    const newText = noteContent.substring(0, lineStart) + 
                   '☐ ' + 
                   noteContent.substring(lineStart)
    
    setNoteContent(newText)
    setTimeout(() => {
      if (textarea) {
        textarea.setSelectionRange(start + 2, start + 2)
        textarea.focus()
      }
    }, 0)
  }

  // Table builder state
  const [showTableBuilder, setShowTableBuilder] = useState(false)
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [tableData, setTableData] = useState<string[][]>([[]])
  const [tableTitle, setTableTitle] = useState('')

  const insertTable = () => {
    setShowTableBuilder(true)
    setTableTitle('') // Reset table title
    // Initialize table data
    const newTableData = Array(tableRows).fill(null).map(() => 
      Array(tableCols).fill('')
    )
    // Set default headers
    newTableData[0] = Array(tableCols).fill(null).map((_, i) => `Header ${i + 1}`)
    setTableData(newTableData)
  }

  const insertImage = () => {
    const imageTemplate = '![Image description](image-url-here)'
    insertTextAtCursor(imageTemplate)
  }

  const insertImageAtPosition = (imageFile: File, position?: number) => {
    const imageName = imageFile.name
    const imageTemplate = `\n![${imageName}](${URL.createObjectURL(imageFile)})\n`
    
    if (position !== undefined) {
      // Insert at specific position
      const newContent = noteContent.substring(0, position) + 
                        imageTemplate + 
                        noteContent.substring(position)
      setNoteContent(newContent)
    } else {
      // Insert at cursor position
      insertTextAtCursor(imageTemplate)
    }
  }

  // Handle image drag and drop
  const handleImageDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const textarea = textareaRef.current
    if (!textarea) return

    // Calculate text position from mouse coordinates
    textarea.focus()
    if (document.caretPositionFromPoint) {
      const range = document.caretPositionFromPoint(e.clientX, e.clientY)
      if (range) {
        textarea.setSelectionRange(range.offset, range.offset)
      }
    } else if ((document as any).caretRangeFromPoint) {
      const range = (document as any).caretRangeFromPoint(e.clientX, e.clientY)
      if (range) {
        textarea.setSelectionRange(range.startOffset, range.startOffset)
      }
    }

    const insertPosition = textarea.selectionStart

    // Check if it's a dragged image from gallery
    const imageMarkdown = e.dataTransfer.getData('text/plain')
    if (imageMarkdown && imageMarkdown.startsWith('![')) {
      const newContent = noteContent.substring(0, insertPosition) + 
                        '\n' + imageMarkdown + '\n' + 
                        noteContent.substring(insertPosition)
      setNoteContent(newContent)
      return
    }

    // Handle dropped files from external sources
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      let content = noteContent
      let position = insertPosition
      
      imageFiles.forEach(file => {
        const imageMarkdown = `\n![${file.name}](${URL.createObjectURL(file)})\n`
        content = content.substring(0, position) + imageMarkdown + content.substring(position)
        position += imageMarkdown.length
      })
      
      setNoteContent(content)
    }
  }

  const handleImageDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
  }

  // Chart builder state
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'bar' | 'donut' | 'sankey' | 'spider'>('bar')
  const [chartTitle, setChartTitle] = useState('')
  const [chartData, setChartData] = useState<{label: string, value: number}[]>([{label: 'Series 1', value: 10}])
  const [sankeyData, setSankeyData] = useState<{source: string, target: string, value: number}[]>([
    {source: 'A', target: 'B', value: 10},
    {source: 'B', target: 'C', value: 5}
  ])
  
  // Editable table/chart state
  const [editingTableIndex, setEditingTableIndex] = useState<number | null>(null)
  const [editingChartIndex, setEditingChartIndex] = useState<number | null>(null)

  const insertChart = () => {
    setShowChartBuilder(true)
    setChartTitle('My Chart')
    setChartType('bar')
    setChartData([{label: 'Series 1', value: 10}, {label: 'Series 2', value: 20}, {label: 'Series 3', value: 15}])
    setSankeyData([{source: 'A', target: 'B', value: 10}, {source: 'B', target: 'C', value: 5}])
  }

  // Context menu and batch transformation functions
  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const selectedText = noteContent.substring(textarea.selectionStart, textarea.selectionEnd)
    
    if (selectedText.trim()) {
      e.preventDefault()
      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        selectedText: selectedText,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd
      })
    }
  }

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, show: false }))
  }

  const transformSelectedText = (transformType: 'bullet' | 'numbered' | 'checkbox' | 'bold' | 'italic') => {
    const textarea = textareaRef.current
    if (!textarea || !contextMenu.selectedText) return

    const selectedLines = contextMenu.selectedText.split('\n')
    let transformedText = ''

    switch (transformType) {
      case 'bullet':
        transformedText = selectedLines.map(line => {
          const cleaned = line.replace(/^(•|\d+\.|☐|☑)\s*/, '').trim()
          return cleaned ? `• ${cleaned}` : line
        }).join('\n')
        break
        
      case 'numbered':
        transformedText = selectedLines.map((line, index) => {
          const cleaned = line.replace(/^(•|\d+\.|☐|☑)\s*/, '').trim()
          return cleaned ? `${index + 1}. ${cleaned}` : line
        }).join('\n')
        break
        
      case 'checkbox':
        transformedText = selectedLines.map(line => {
          const cleaned = line.replace(/^(•|\d+\.|☐|☑)\s*/, '').trim()
          return cleaned ? `☐ ${cleaned}` : line
        }).join('\n')
        break
        
      case 'bold':
        transformedText = `**${contextMenu.selectedText}**`
        break
        
      case 'italic':
        transformedText = `*${contextMenu.selectedText}*`
        break
    }

    const newContent = noteContent.substring(0, contextMenu.selectionStart) + 
                      transformedText + 
                      noteContent.substring(contextMenu.selectionEnd)
    
    setNoteContent(newContent)
    closeContextMenu()
    
    // Restore focus and selection
    setTimeout(() => {
      if (textarea) {
        const newSelectionEnd = contextMenu.selectionStart + transformedText.length
        textarea.setSelectionRange(contextMenu.selectionStart, newSelectionEnd)
        textarea.focus()
      }
    }, 0)
  }

  // Handle clicking outside context menu
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (contextMenu.show) {
      closeContextMenu()
    }
  }

  // Keyboard shortcuts and smart list handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Handle Enter key for smart list continuation
    if (e.key === 'Enter') {
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = noteContent.substring(0, cursorPos)
      const textAfterCursor = noteContent.substring(cursorPos)
      
      // Find the current line
      const currentLineStart = textBeforeCursor.lastIndexOf('\n') + 1
      const currentLine = textBeforeCursor.substring(currentLineStart)
      
      // Check for bullet points
      if (currentLine.match(/^•\s/)) {
        e.preventDefault()
        const newContent = textBeforeCursor + '\n• ' + textAfterCursor
        setNoteContent(newContent)
        setTimeout(() => {
          textarea.setSelectionRange(cursorPos + 3, cursorPos + 3)
          textarea.focus()
        }, 0)
        return
      }
      
      // Check for numbered lists
      const numberedMatch = currentLine.match(/^(\d+)\.\s/)
      if (numberedMatch) {
        e.preventDefault()
        const nextNumber = parseInt(numberedMatch[1]) + 1
        const newContent = textBeforeCursor + `\n${nextNumber}. ` + textAfterCursor
        setNoteContent(newContent)
        setTimeout(() => {
          textarea.setSelectionRange(cursorPos + nextNumber.toString().length + 3, cursorPos + nextNumber.toString().length + 3)
          textarea.focus()
        }, 0)
        return
      }
      
      // Check for checkboxes
      if (currentLine.match(/^☐\s/) || currentLine.match(/^☑\s/)) {
        e.preventDefault()
        const newContent = textBeforeCursor + '\n☐ ' + textAfterCursor
        setNoteContent(newContent)
        setTimeout(() => {
          textarea.setSelectionRange(cursorPos + 3, cursorPos + 3)
          textarea.focus()
        }, 0)
        return
      }
    }

    // Handle Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          formatBold()
          break
        case 'i':
          e.preventDefault()
          formatItalic()
          break
        default:
          break
      }
    }
  }

  // Simple markdown-like rendering
  const renderFormattedText = (text: string) => {
    if (!text) return 'No content'
    
    // Split by lines to preserve structure
    const lines = text.split('\n')
    
    return lines.map((line, index) => {
      let processedLine = line
      
      // Bold formatting
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Italic formatting  
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Lists and checkboxes
      if (line.startsWith('• ')) {
        return (
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-emerald-600 font-bold">•</span>
            <span dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />
          </div>
        )
      } else if (line.match(/^\d+\.\s/)) {
        const match = line.match(/^(\d+)\.\s(.*)/)
        if (match) {
          return (
            <div key={index} className="flex items-start space-x-2 my-1">
              <span className="text-emerald-600 font-bold">{match[1]}.</span>
              <span dangerouslySetInnerHTML={{ __html: match[2] }} />
            </div>
          )
        }
      } else if (line.startsWith('☐ ')) {
        return (
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-gray-400">☐</span>
            <span dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />
          </div>
        )
      } else if (line.startsWith('☑ ')) {
        return (
          <div key={index} className="flex items-start space-x-2 my-1">
            <span className="text-emerald-600">☑</span>
            <span className="line-through text-gray-500" dangerouslySetInnerHTML={{ __html: processedLine.substring(2) }} />
          </div>
        )
      }
      
      // Handle tables
      const tableMatch = line.match(/^\[TABLE:(.*?)\]$/)
      if (tableMatch) {
        try {
          const tableInfo = JSON.parse(tableMatch[1])
          const isEditingThisTable = editingTableIndex === index
          
          return (
            <div key={index} className="my-4">
              <div className="flex items-center justify-between mb-2">
                {tableInfo.title && (
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {tableInfo.title}
                  </h4>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingTableIndex(isEditingThisTable ? null : index)}
                    className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                  >
                    {isEditingThisTable ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg">
                  <thead className="bg-gray-50 dark:bg-[#111111]">
                    <tr>
                      {tableInfo.data[0]?.map((header: string, colIndex: number) => (
                        <th 
                          key={colIndex} 
                          className="px-4 py-2 border-b border-gray-300 dark:border-[#2a2a2a] text-left font-medium text-gray-900 dark:text-gray-100"
                        >
                          {isEditingThisTable ? (
                            <input
                              type="text"
                              value={header}
                              onChange={(e) => {
                                // Update header logic would go here
                                console.log('Update header:', e.target.value)
                              }}
                              className="w-full bg-transparent border-none outline-none font-medium"
                            />
                          ) : (
                            header
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableInfo.data.slice(1).map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-[#1a1a1a]' : 'bg-gray-50 dark:bg-[#111111]'}>
                        {row.map((cell: string, colIndex: number) => (
                          <td 
                            key={colIndex} 
                            className="px-4 py-2 border-b border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300"
                          >
                            {isEditingThisTable ? (
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => {
                                  // Update cell logic would go here
                                  console.log('Update cell:', e.target.value)
                                }}
                                className="w-full bg-transparent border-none outline-none"
                              />
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        } catch (e) {
          return <div key={index} className="text-red-500">Invalid table data</div>
        }
      }

      // Handle charts
      const chartMatch = line.match(/^\[CHART:(.*?)\]$/)
      if (chartMatch) {
        try {
          const chartInfo = JSON.parse(chartMatch[1])
          const isEditingThisChart = editingChartIndex === index
          
          return (
            <div key={index} className="my-4 p-4 bg-gray-50 dark:bg-[#111111] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center flex-1">
                  {chartInfo.title}
                </h4>
                <button
                  onClick={() => setEditingChartIndex(isEditingThisChart ? null : index)}
                  className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                >
                  {isEditingThisChart ? 'Save' : 'Edit'}
                </button>
              </div>
              {chartInfo.type === 'bar' && (
                <div className="space-y-3">
                  {chartInfo.data.map((item: {label: string, value: number}, chartIndex: number) => (
                    <div key={chartIndex} className="flex items-center space-x-3">
                      <span className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate font-medium">
                        {item.label}
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-[#2a2a2a] rounded-full h-8 relative shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-8 rounded-full flex items-center justify-end pr-3 shadow-sm transition-all duration-300 ease-out"
                          style={{ width: `${Math.max(15, (item.value / Math.max(...chartInfo.data.map((d: any) => d.value))) * 100)}%` }}
                        >
                          <span className="text-white text-sm font-bold">{item.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {chartInfo.type === 'line' && (
                <div className="relative h-48 bg-gradient-to-b from-gray-50 to-white dark:from-[#111111] dark:to-[#1a1a1a] rounded-lg p-4">
                  <svg className="w-full h-full">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Data points and line */}
                    {chartInfo.data.map((item: {label: string, value: number}, chartIndex: number) => {
                      const maxValue = Math.max(...chartInfo.data.map((d: any) => d.value))
                      const x = (chartIndex / (chartInfo.data.length - 1)) * 80 + 10 // 10% margin on each side
                      const y = 90 - (item.value / maxValue) * 70 // 70% of height for data, inverted for SVG
                      
                      return (
                        <g key={chartIndex}>
                          {/* Data point */}
                          <circle 
                            cx={`${x}%`} 
                            cy={`${y}%`} 
                            r="4" 
                            fill="#10b981" 
                            stroke="#ffffff" 
                            strokeWidth="2"
                            className="drop-shadow-sm"
                          />
                          {/* Value label */}
                          <text 
                            x={`${x}%`} 
                            y={`${y - 8}%`} 
                            textAnchor="middle" 
                            className="text-xs font-medium fill-gray-600 dark:fill-gray-400"
                          >
                            {item.value}
                          </text>
                          {/* X-axis label */}
                          <text 
                            x={`${x}%`} 
                            y="95%" 
                            textAnchor="middle" 
                            className="text-xs fill-gray-500 dark:fill-gray-500"
                          >
                            {item.label}
                          </text>
                          
                          {/* Connect points with line */}
                          {chartIndex > 0 && (
                            <line
                              x1={`${((chartIndex - 1) / (chartInfo.data.length - 1)) * 80 + 10}%`}
                              y1={`${90 - (chartInfo.data[chartIndex - 1].value / maxValue) * 70}%`}
                              x2={`${x}%`}
                              y2={`${y}%`}
                              stroke="#10b981"
                              strokeWidth="3"
                              strokeLinecap="round"
                              className="drop-shadow-sm"
                            />
                          )}
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
              {chartInfo.type === 'donut' && (
                <div className="flex justify-center">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                      {chartInfo.data.map((item: {label: string, value: number}, chartIndex: number) => {
                        const total = chartInfo.data.reduce((sum: number, d: any) => sum + d.value, 0)
                        const percentage = (item.value / total) * 100
                        const strokeDasharray = `${percentage * 2.51} ${251 - percentage * 2.51}` // 251 ≈ circumference of r=40
                        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
                        const color = colors[chartIndex % colors.length]
                        const strokeDashoffset = chartIndex === 0 ? 0 : -chartInfo.data.slice(0, chartIndex).reduce((sum: number, d: any) => sum + d.value, 0) / total * 251
                        
                        return (
                          <circle
                            key={chartIndex}
                            cx="50%"
                            cy="50%"
                            r="40%"
                            fill="none"
                            stroke={color}
                            strokeWidth="12"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-300"
                          />
                        )
                      })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {chartInfo.data.reduce((sum: number, item: any) => sum + item.value, 0)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                    </div>
                  </div>
                  <div className="ml-6 flex flex-col justify-center space-y-2">
                    {chartInfo.data.map((item: {label: string, value: number}, chartIndex: number) => {
                      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
                      const color = colors[chartIndex % colors.length]
                      
                      return (
                        <div key={chartIndex} className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.label}: {item.value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {chartInfo.type === 'sankey' && (
                <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#111111] dark:to-[#1a1a1a] rounded-lg p-6 overflow-hidden">
                  <svg className="w-full h-full">
                    {/* Extract unique nodes */}
                    {(() => {
                      const nodes = new Set()
                      chartInfo.data.forEach((flow: any) => {
                        nodes.add(flow.source)
                        nodes.add(flow.target)
                      })
                      const nodeArray = Array.from(nodes)
                      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
                      
                      return (
                        <g>
                          {/* Draw nodes */}
                          {nodeArray.map((node: any, nodeIndex: number) => {
                            const x = nodeIndex < nodeArray.length / 2 ? '20%' : '80%'
                            const y = `${20 + (nodeIndex % Math.ceil(nodeArray.length / 2)) * (60 / Math.ceil(nodeArray.length / 2))}%`
                            
                            return (
                              <g key={nodeIndex}>
                                <rect
                                  x={x}
                                  y={y}
                                  width="120"
                                  height="40"
                                  rx="20"
                                  fill={colors[nodeIndex % colors.length]}
                                  className="drop-shadow-sm"
                                />
                                <text
                                  x={`calc(${x} + 60)`}
                                  y={`calc(${y} + 25)`}
                                  textAnchor="middle"
                                  className="text-sm font-medium fill-white"
                                >
                                  {node}
                                </text>
                              </g>
                            )
                          })}
                          
                          {/* Draw flows */}
                          {chartInfo.data.map((flow: any, flowIndex: number) => {
                            const sourceIndex = nodeArray.indexOf(flow.source)
                            const targetIndex = nodeArray.indexOf(flow.target)
                            const sourceX = sourceIndex < nodeArray.length / 2 ? 20 + 12 : 80 - 12
                            const targetX = targetIndex < nodeArray.length / 2 ? 20 + 12 : 80 - 12
                            const sourceY = 20 + (sourceIndex % Math.ceil(nodeArray.length / 2)) * (60 / Math.ceil(nodeArray.length / 2)) + 4
                            const targetY = 20 + (targetIndex % Math.ceil(nodeArray.length / 2)) * (60 / Math.ceil(nodeArray.length / 2)) + 4
                            
                            return (
                              <g key={flowIndex}>
                                <path
                                  d={`M ${sourceX}% ${sourceY}% C ${(sourceX + targetX) / 2}% ${sourceY}% ${(sourceX + targetX) / 2}% ${targetY}% ${targetX}% ${targetY}%`}
                                  stroke="#10b981"
                                  strokeWidth={Math.max(2, flow.value / 2)}
                                  fill="none"
                                  strokeOpacity="0.7"
                                  className="drop-shadow-sm"
                                />
                                <text
                                  x={`${(sourceX + targetX) / 2}%`}
                                  y={`${(sourceY + targetY) / 2}%`}
                                  textAnchor="middle"
                                  className="text-xs font-medium fill-emerald-600 dark:fill-emerald-400"
                                >
                                  {flow.value}
                                </text>
                              </g>
                            )
                          })}
                        </g>
                      )
                    })()}
                  </svg>
                </div>
              )}
              {chartInfo.type === 'spider' && (
                <div className="flex justify-center">
                  <div className="relative w-64 h-64">
                    <svg className="w-full h-full">
                      {/* Background grid */}
                      <defs>
                        <pattern id="spider-grid" width="100%" height="100%">
                          {[1, 2, 3, 4, 5].map(level => (
                            <circle
                              key={level}
                              cx="50%"
                              cy="50%"
                              r={`${level * 10}%`}
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="1"
                              opacity="0.3"
                            />
                          ))}
                        </pattern>
                      </defs>
                      
                      {/* Grid lines and labels */}
                      {chartInfo.data.map((item: any, index: number) => {
                        const angle = (index * 2 * Math.PI) / chartInfo.data.length - Math.PI / 2
                        const x2 = 50 + 45 * Math.cos(angle)
                        const y2 = 50 + 45 * Math.sin(angle)
                        const labelX = 50 + 55 * Math.cos(angle)
                        const labelY = 50 + 55 * Math.sin(angle)
                        
                        return (
                          <g key={index}>
                            {/* Grid line */}
                            <line
                              x1="50%"
                              y1="50%"
                              x2={`${x2}%`}
                              y2={`${y2}%`}
                              stroke="#e5e7eb"
                              strokeWidth="1"
                              opacity="0.5"
                            />
                            {/* Label */}
                            <text
                              x={`${labelX}%`}
                              y={`${labelY}%`}
                              textAnchor="middle"
                              className="text-xs font-medium fill-gray-600 dark:fill-gray-400"
                            >
                              {item.label}
                            </text>
                          </g>
                        )
                      })}
                      
                      {/* Background circles */}
                      {[1, 2, 3, 4, 5].map(level => (
                        <circle
                          key={level}
                          cx="50%"
                          cy="50%"
                          r={`${level * 9}%`}
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          opacity="0.3"
                        />
                      ))}
                      
                      {/* Data polygon */}
                      <polygon
                        points={chartInfo.data.map((item: any, index: number) => {
                          const angle = (index * 2 * Math.PI) / chartInfo.data.length - Math.PI / 2
                          const maxValue = 10 // assuming spider chart scale is 0-10
                          const radius = (item.value / maxValue) * 45
                          const x = 50 + radius * Math.cos(angle)
                          const y = 50 + radius * Math.sin(angle)
                          return `${x},${y}`
                        }).join(' ')}
                        fill="#10b981"
                        fillOpacity="0.3"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        className="drop-shadow-sm"
                      />
                      
                      {/* Data points */}
                      {chartInfo.data.map((item: any, index: number) => {
                        const angle = (index * 2 * Math.PI) / chartInfo.data.length - Math.PI / 2
                        const maxValue = 10
                        const radius = (item.value / maxValue) * 45
                        const x = 50 + radius * Math.cos(angle)
                        const y = 50 + radius * Math.sin(angle)
                        
                        return (
                          <circle
                            key={index}
                            cx={`${x}%`}
                            cy={`${y}%`}
                            r="4"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="drop-shadow-sm"
                          />
                        )
                      })}
                    </svg>
                    
                    {/* Center label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {(chartInfo.data.reduce((sum: number, item: any) => sum + item.value, 0) / chartInfo.data.length).toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Avg</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="ml-6 flex flex-col justify-center space-y-1">
                    {chartInfo.data.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.label}: {item.value}/10
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        } catch (e) {
          return <div key={index} className="text-red-500">Invalid chart data</div>
        }
      }

      // Handle images
      const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/)
      if (imageMatch) {
        const [, altText, imageUrl] = imageMatch
        return (
          <div key={index} className="my-4">
            <img 
              src={imageUrl} 
              alt={altText} 
              className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-[#2a2a2a]"
              style={{ maxHeight: '400px' }}
            />
            {altText && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center italic">
                {altText}
              </p>
            )}
          </div>
        )
      }
      
      // Regular text
      return (
        <div key={index} className="my-1">
          <span dangerouslySetInnerHTML={{ __html: processedLine || '&nbsp;' }} />
        </div>
      )
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl border border-[#D4C5B0] dark:border-[#2a2a2a] flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-800 text-white p-4 rounded-t-lg border-b border-emerald-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{activity.title}</h2>
              <p className="text-sm text-emerald-100">
                {(() => {
                  const date = new Date(activity.activity_date + 'T12:00:00') // Add noon time to avoid timezone issues
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                })()}
                {activity.start_time && ` • ${activity.start_time.slice(0, 5)}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-emerald-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111]">
          <div className="flex space-x-8 px-4">
            <button
              onClick={() => setActiveTab('my-notes')}
              className={cn(
                "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'my-notes'
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              My Notes
            </button>
            <button
              onClick={() => setActiveTab('all-notes')}
              className={cn(
                "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'all-notes'
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              All Notes ({notes.filter(n => !n.is_private).length})
            </button>
            <button
              onClick={() => setActiveTab('private-notes')}
              className={cn(
                "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === 'private-notes'
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Private Notes
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* My Notes Tab */}
              {activeTab === 'my-notes' && (
                <div className="h-full flex flex-col">
                  {/* Toolbar */}
                  {isEditing && (
                    <div className="border-b border-gray-200 dark:border-[#2a2a2a] p-3 bg-gray-50 dark:bg-[#111111]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={formatBold}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Bold (Ctrl+B)"
                          >
                            <Bold className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={formatItalic}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Italic (Ctrl+I)"
                          >
                            <Italic className="w-4 h-4" />
                          </button>
                          <div className="w-px h-6 bg-gray-300 dark:bg-[#2a2a2a]" />
                          <button 
                            onClick={formatBulletList}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Bullet List"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={formatNumberedList}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Numbered List"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={formatCheckbox}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Checkbox"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                          <div className="w-px h-6 bg-gray-300 dark:bg-[#2a2a2a]" />
                          <button 
                            onClick={insertImage}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Insert Image"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={openCamera}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Take Photo (Mobile Camera)"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={insertTable}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Insert Table"
                          >
                            <Table className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={insertChart}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                            title="Insert Chart"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Audio Recording Section */}
                        <div className="flex items-center space-x-2 pl-4 border-l border-gray-300 dark:border-[#2a2a2a]">
                          {!isRecording ? (
                            <button
                              onClick={startRecording}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-red-500"
                              title="Start recording"
                            >
                              <Mic className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={stopRecording}
                              className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-red-600 bg-red-50 dark:bg-red-900/20"
                              title="Stop recording"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                          
                          {isRecording && (
                            <div className="flex items-center space-x-2 text-sm text-red-600">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              <span className="font-mono">{formatTime(recordingTime)}</span>
                              {/* Audio Waveform Visualization */}
                              <div className="flex items-end space-x-px ml-3">
                                {audioWaveform.map((level, index) => (
                                  <div
                                    key={index}
                                    className="bg-red-500 rounded-sm transition-all duration-100"
                                    style={{
                                      width: '2px',
                                      height: `${Math.max(2, (level / 255) * 20)}px`
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {audioBlob && !isRecording && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={playRecording}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                                title={isPlaying ? "Pause" : "Play recording"}
                              >
                                {isPlaying ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </button>
                              <span className="text-sm text-gray-500">{formatTime(recordingTime)}</span>
                              <button
                                onClick={transcribeAudio}
                                disabled={isTranscribing}
                                className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                              </button>
                              <button
                                onClick={clearRecording}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-red-500"
                                title="Clear recording"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isPrivate}
                              onChange={(e) => setIsPrivate(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-gray-600 dark:text-gray-400">Private</span>
                            {isPrivate ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Editor/Viewer */}
                  <div className="flex-1 p-4">
                    {isEditing ? (
                      <div className="h-full">
                        <textarea
                          ref={textareaRef}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onContextMenu={handleContextMenu}
                          onClick={handleTextareaClick}
                          onDrop={handleImageDrop}
                          onDragOver={handleImageDragOver}
                          placeholder="Start typing your notes... (Drag images here to insert)"
                          className="w-full h-full p-4 border border-gray-300 dark:border-[#2a2a2a] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        />
                        
                        {/* Context Menu */}
                        {contextMenu.show && (
                          <div
                            className="fixed bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-lg py-2 z-50"
                            style={{
                              left: contextMenu.x,
                              top: contextMenu.y,
                              transform: 'translate(-50%, -100%)'
                            }}
                          >
                            <button
                              onClick={() => transformSelectedText('bullet')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center space-x-2"
                            >
                              <List className="w-4 h-4" />
                              <span>Convert to Bullet List</span>
                            </button>
                            <button
                              onClick={() => transformSelectedText('numbered')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center space-x-2"
                            >
                              <ListOrdered className="w-4 h-4" />
                              <span>Convert to Numbered List</span>
                            </button>
                            <button
                              onClick={() => transformSelectedText('checkbox')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center space-x-2"
                            >
                              <CheckSquare className="w-4 h-4" />
                              <span>Convert to Checkboxes</span>
                            </button>
                            <div className="border-t border-gray-200 dark:border-[#2a2a2a] my-1" />
                            <button
                              onClick={() => transformSelectedText('bold')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center space-x-2"
                            >
                              <Bold className="w-4 h-4" />
                              <span>Make Bold</span>
                            </button>
                            <button
                              onClick={() => transformSelectedText('italic')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-[#2a2a2a] flex items-center space-x-2"
                            >
                              <Italic className="w-4 h-4" />
                              <span>Make Italic</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full">
                        {myNote ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                <User className="w-4 h-4" />
                                <span>{myNote.created_by_name}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{formatDate(myNote.updated_at)}</span>
                                {myNote.is_private && (
                                  <EyeOff className="w-4 h-4 ml-2" />
                                )}
                              </div>
                              <button
                                onClick={startEditing}
                                className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                                <span>Edit</span>
                              </button>
                            </div>
                            <div className="prose prose-sm max-w-none">
                              {renderFormattedText(myNote.content?.text || '')}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <FileText className="w-12 h-12 text-gray-400 mb-4" />
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
                              <Plus className="w-4 h-4" />
                              <span>Add Note</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Camera Interface */}
                  {isCameraOpen && (
                    <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111111]">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Camera</h4>
                          <button
                            onClick={closeCamera}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded text-gray-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="relative bg-black rounded-lg overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-64 object-cover"
                          />
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                            <button
                              onClick={capturePhoto}
                              className="w-16 h-16 bg-white rounded-full border-4 border-gray-300 hover:border-emerald-500 transition-colors"
                            >
                              <Camera className="w-8 h-8 text-gray-600 mx-auto" />
                            </button>
                          </div>
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    </div>
                  )}

                  {/* Files & Media Gallery */}
                  {(capturedImages.length > 0 || capturedDocuments.length > 0 || isEditing) && (
                    <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111111]">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Files & Media ({capturedImages.length + capturedDocuments.length})
                        </h4>
                        {isEditing && (
                          <div className="flex space-x-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.xml"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                              Upload Files
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Drag and Drop Zone */}
                      {isEditing && (
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors ${
                            isDragOver 
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <div className="flex space-x-2 text-gray-400">
                              <Camera className="w-8 h-8" />
                              <FileText className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Drag and drop files here
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              or click "Upload Files" to browse • Images, PDFs, Word docs, Excel, PowerPoint, and more
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Two-column layout for Images and Documents */}
                      {(capturedImages.length > 0 || capturedDocuments.length > 0) ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Images Column */}
                          {capturedImages.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                <Camera className="w-4 h-4 mr-2" />
                                Images ({capturedImages.length})
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {capturedImages.map((image, index) => (
                                  <div key={index} className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] overflow-hidden">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`Image ${index + 1}`}
                                      className="w-full h-32 object-cover cursor-move"
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('application/x-image-file', index.toString())
                                        e.dataTransfer.setData('text/plain', `![${image.name}](${URL.createObjectURL(image)})`)
                                        e.dataTransfer.effectAllowed = 'copy'
                                      }}
                                      title="Drag to insert into notes"
                                    />
                                    <div className="p-2">
                                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                                        {image.name}
                                      </p>
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => processOCR(image, index)}
                                          disabled={isProcessingOCR && selectedImageIndex === index}
                                          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          {isProcessingOCR && selectedImageIndex === index ? (
                                            <div className="flex items-center justify-center">
                                              <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full mr-1" />
                                              OCR...
                                            </div>
                                          ) : (
                                            'Extract Text'
                                          )}
                                        </button>
                                        {isEditing && (
                                          <button
                                            onClick={() => removeImage(index)}
                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                      {ocrResults[index] && (
                                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                                          <p className="text-green-700 dark:text-green-400 font-medium mb-1">Extracted:</p>
                                          <p className="text-green-600 dark:text-green-300 line-clamp-3">
                                            {ocrResults[index]}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Documents Column */}
                          {capturedDocuments.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                <FileText className="w-4 h-4 mr-2" />
                                Documents ({capturedDocuments.length})
                              </h5>
                              <div className="space-y-3">
                                {capturedDocuments.map((document, index) => {
                                  const getFileIcon = (fileName: string) => {
                                    const ext = fileName.split('.').pop()?.toLowerCase()
                                    switch (ext) {
                                      case 'pdf': return '📄'
                                      case 'doc':
                                      case 'docx': return '📝'
                                      case 'xls':
                                      case 'xlsx': return '📊'
                                      case 'ppt':
                                      case 'pptx': return '📊'
                                      case 'txt': return '📝'
                                      case 'csv': return '📋'
                                      case 'json': return '📋'
                                      case 'xml': return '📋'
                                      default: return '📄'
                                    }
                                  }
                                  
                                  const formatFileSize = (bytes: number) => {
                                    if (bytes === 0) return '0 B'
                                    const k = 1024
                                    const sizes = ['B', 'KB', 'MB', 'GB']
                                    const i = Math.floor(Math.log(bytes) / Math.log(k))
                                    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
                                  }

                                  return (
                                    <div key={index} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] p-3">
                                      <div className="flex items-start space-x-3">
                                        <div className="text-2xl">{getFileIcon(document.name)}</div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                            {document.name}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatFileSize(document.size)} • {document.type || 'Unknown type'}
                                          </p>
                                        </div>
                                        {isEditing && (
                                          <button
                                            onClick={() => removeDocument(index)}
                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <div className="flex justify-center space-x-2 mb-2">
                            <Camera className="w-8 h-8" />
                            <FileText className="w-8 h-8" />
                          </div>
                          <p className="text-sm">No files uploaded yet</p>
                          <p className="text-xs">Upload images, documents, or drag and drop files to get started</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table Builder Modal */}
                  {showTableBuilder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-end mb-4">
                          <button
                            onClick={() => setShowTableBuilder(false)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Table Title (Optional)</label>
                          <input
                            type="text"
                            value={tableTitle}
                            onChange={(e) => setTableTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                            placeholder="Enter table title..."
                          />
                        </div>
                        
                        <div className="mb-4 flex items-center space-x-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rows</label>
                            <input
                              type="number"
                              min="2"
                              max="10"
                              value={tableRows}
                              onChange={(e) => {
                                const rows = parseInt(e.target.value) || 2
                                setTableRows(rows)
                                const newData = Array(rows).fill(null).map((_, i) => 
                                  Array(tableCols).fill(null).map((_, j) => 
                                    i === 0 ? `Header ${j + 1}` : tableData[i]?.[j] || ''
                                  )
                                )
                                setTableData(newData)
                              }}
                              className="w-20 px-3 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Columns</label>
                            <input
                              type="number"
                              min="2"
                              max="6"
                              value={tableCols}
                              onChange={(e) => {
                                const cols = parseInt(e.target.value) || 2
                                setTableCols(cols)
                                const newData = Array(tableRows).fill(null).map((_, i) => 
                                  Array(cols).fill(null).map((_, j) => 
                                    i === 0 ? `Header ${j + 1}` : tableData[i]?.[j] || ''
                                  )
                                )
                                setTableData(newData)
                              }}
                              className="w-20 px-3 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                        
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full border border-gray-300 dark:border-[#2a2a2a] rounded-lg">
                            <thead className="bg-gray-50 dark:bg-[#111111]">
                              <tr>
                                {tableData[0]?.map((_, colIndex) => (
                                  <th key={colIndex} className="p-2">
                                    <input
                                      type="text"
                                      value={tableData[0][colIndex]}
                                      onChange={(e) => {
                                        const newData = [...tableData]
                                        newData[0][colIndex] = e.target.value
                                        setTableData(newData)
                                      }}
                                      className="w-full px-2 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 font-medium"
                                      placeholder={`Header ${colIndex + 1}`}
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.slice(1).map((row, rowIndex) => (
                                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white dark:bg-[#1a1a1a]' : 'bg-gray-50 dark:bg-[#111111]'}>
                                  {row.map((cell, colIndex) => (
                                    <td key={colIndex} className="p-2">
                                      <input
                                        type="text"
                                        value={cell}
                                        onChange={(e) => {
                                          const newData = [...tableData]
                                          newData[rowIndex + 1][colIndex] = e.target.value
                                          setTableData(newData)
                                        }}
                                        className="w-full px-2 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                        placeholder={`Cell ${rowIndex + 1}-${colIndex + 1}`}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setShowTableBuilder(false)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const tableMarkdown = `\n[TABLE:${JSON.stringify({data: tableData, title: tableTitle})}]\n`
                              insertTextAtCursor(tableMarkdown)
                              setShowTableBuilder(false)
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            Insert Table
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chart Builder Modal */}
                  {showChartBuilder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-end mb-4">
                          <button
                            onClick={() => setShowChartBuilder(false)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] rounded"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Title</label>
                            <input
                              type="text"
                              value={chartTitle}
                              onChange={(e) => setChartTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                              placeholder="Enter chart title"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chart Type</label>
                            <select
                              value={chartType}
                              onChange={(e) => setChartType(e.target.value as any)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                            >
                              <option value="bar">Bar Chart</option>
                              <option value="line">Line Chart</option>
                              <option value="donut">Donut Chart</option>
                              <option value="sankey">Sankey Diagram</option>
                              <option value="spider">Spider/Radar Chart</option>
                            </select>
                          </div>
                          
                          {/* Data input section - varies by chart type */}
                          {chartType === 'sankey' ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Flow Connections</label>
                              <div className="space-y-2">
                                {sankeyData.map((item, index) => (
                                  <div key={index} className="flex space-x-2">
                                    <input
                                      type="text"
                                      value={item.source}
                                      onChange={(e) => {
                                        const newData = [...sankeyData]
                                        newData[index].source = e.target.value
                                        setSankeyData(newData)
                                      }}
                                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                      placeholder="From"
                                    />
                                    <span className="flex items-center text-gray-500">→</span>
                                    <input
                                      type="text"
                                      value={item.target}
                                      onChange={(e) => {
                                        const newData = [...sankeyData]
                                        newData[index].target = e.target.value
                                        setSankeyData(newData)
                                      }}
                                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                      placeholder="To"
                                    />
                                    <input
                                      type="number"
                                      value={item.value}
                                      onChange={(e) => {
                                        const newData = [...sankeyData]
                                        newData[index].value = parseInt(e.target.value) || 0
                                        setSankeyData(newData)
                                      }}
                                      className="w-20 px-3 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                      placeholder="Flow"
                                    />
                                    {sankeyData.length > 1 && (
                                      <button
                                        onClick={() => {
                                          const newData = sankeyData.filter((_, i) => i !== index)
                                          setSankeyData(newData)
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    setSankeyData([...sankeyData, {source: 'New Source', target: 'New Target', value: 10}])
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-[#333]"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add Flow</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {chartType === 'spider' ? 'Categories & Scores' : 'Data Points'}
                              </label>
                              <div className="space-y-2">
                                {chartData.map((item, index) => (
                                  <div key={index} className="flex space-x-2">
                                    <input
                                      type="text"
                                      value={item.label}
                                      onChange={(e) => {
                                        const newData = [...chartData]
                                        newData[index].label = e.target.value
                                        setChartData(newData)
                                      }}
                                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                      placeholder={chartType === 'spider' ? 'Category' : 'Label'}
                                    />
                                    <input
                                      type="number"
                                      value={item.value}
                                      onChange={(e) => {
                                        const newData = [...chartData]
                                        newData[index].value = parseInt(e.target.value) || 0
                                        setChartData(newData)
                                      }}
                                      className="w-20 px-3 py-1 border border-gray-300 dark:border-[#2a2a2a] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                                      placeholder={chartType === 'spider' ? 'Score' : 'Value'}
                                      min={chartType === 'spider' ? 0 : undefined}
                                      max={chartType === 'spider' ? 10 : undefined}
                                    />
                                    {chartData.length > 1 && (
                                      <button
                                        onClick={() => {
                                          const newData = chartData.filter((_, i) => i !== index)
                                          setChartData(newData)
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    setChartData([...chartData, {
                                      label: chartType === 'spider' ? `Category ${chartData.length + 1}` : `Series ${chartData.length + 1}`, 
                                      value: chartType === 'spider' ? 5 : 10
                                    }])
                                  }}
                                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-[#333]"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add {chartType === 'spider' ? 'Category' : 'Data Point'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => setShowChartBuilder(false)}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              const chartInfo = {
                                type: chartType, 
                                title: chartTitle, 
                                data: chartType === 'sankey' ? sankeyData : chartData
                              }
                              const chartMarkdown = `\n[CHART:${JSON.stringify(chartInfo)}]\n`
                              insertTextAtCursor(chartMarkdown)
                              setShowChartBuilder(false)
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          >
                            Insert Chart
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="border-t border-gray-200 dark:border-[#2a2a2a] p-4 bg-gray-50 dark:bg-[#111111]">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveNote}
                          disabled={saving || !noteContent.trim()}
                          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {saving ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>{saving ? 'Saving...' : 'Save Note'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Notes Tab */}
              {activeTab === 'all-notes' && (
                <div className="h-full overflow-y-auto p-4">
                  {notes.filter(n => !n.is_private).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FileText className="w-12 h-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No shared notes yet
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Notes from meeting participants will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notes.filter(n => !n.is_private).map((note) => (
                        <div
                          key={note.id}
                          className="bg-gray-50 dark:bg-[#111111] rounded-lg p-4 border border-gray-200 dark:border-[#2a2a2a]"
                        >
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{note.created_by_name}</span>
                            <Clock className="w-4 h-4 ml-2" />
                            <span>{formatDate(note.updated_at)}</span>
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap">
                              {note.content?.text || 'No content'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Private Notes Tab */}
              {activeTab === 'private-notes' && (
                <div className="h-full overflow-y-auto p-4">
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <EyeOff className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Private Notes
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Coming soon - private notes feature
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}