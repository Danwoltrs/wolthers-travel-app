'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Bold, Italic, List, ListOrdered, CheckSquare, Table, BarChart3, Clock, Users, Undo, Redo, Type, Building2, Mic, Camera, Download, FileDown, Mail, Square, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import TableModal from './TableModal'
import ChartModal from './ChartModal'
import CompanyAccessManager from './CompanyAccessManager'
import ActivityParticipantsManager from './ActivityParticipantsManager'
import RecordingManager from './RecordingManager'
import MediaTimeline from './MediaTimeline'
import NoteTemplates from './NoteTemplates'

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

interface NoteContent {
  html: string
  plainText: string
  elements?: Array<{
    type: 'table' | 'chart'
    data: any
    position: number
  }>
  media?: MediaEntry[]
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
  const [isMinimized, setIsMinimized] = useState(true)
  const recordingManagerRef = useRef<any>(null)

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
          
          const initialContent = `<h3>${activityTitle}</h3><p><strong>${formatMeetingDateTime(meetingDate)}</strong></p>${companies.length > 0 ? `<p><strong>Companies Present:</strong><br>${companyList}</p>` : ''}<p><br></p><p>Meeting notes...</p>`
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
      const response = await fetch('/api/trips/notes-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ tripId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          onNoteCountChange(result.notesCount || 0)
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
        media: mediaEntries
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

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording)
    if (recordingManagerRef.current) {
      recordingManagerRef.current.toggleRecording()
    }
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

  const exportForEmail = () => {
    const emailBody = `Meeting Notes: ${activityTitle}

Date: ${formatMeetingDateTime(meetingDate)}

${companiesWithAccess.length > 0 ? `Companies Present:
${companiesWithAccess.map(c => `• ${c.name}${c.representatives ? ` (${c.representatives.map(r => r.name).join(', ')})` : ''}`).join('\n')}

` : ''}Content:
${content.plainText}

${mediaEntries.length > 0 ? `Media Captured:
${mediaEntries.map(entry => `• ${entry.type.toUpperCase()} - ${entry.relativeTime}${entry.description ? ` (${entry.description})` : ''}${entry.type === 'transcript' && typeof entry.content === 'string' ? `\n  "${entry.content}"` : ''}`).join('\n')}

` : ''}---
Generated from Wolthers Travel App on ${new Date().toLocaleDateString()}`

    const subject = `Meeting Notes: ${activityTitle} - ${new Date().toLocaleDateString()}`
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailtoLink)
    setShowExportMenu(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-4xl h-[80vh] max-h-[800px] overflow-hidden flex flex-col rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a]">
        
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

            {/* Recording Controls */}
            <div className="flex items-center space-x-1 border-r border-gray-300 dark:border-gray-600 pr-3">
              <button
                onClick={handleRecordingToggle}
                className={`p-2 rounded transition-colors ${
                  isRecording 
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                    : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/40'
                }`}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setShowMediaTimeline(!showMediaTimeline)}
                className={`p-2 rounded transition-colors ${
                  showMediaTimeline 
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={showMediaTimeline ? "Hide Media Panel" : "Show Media Panel"}
              >
                <Camera className="w-4 h-4" />
              </button>

              {isRecording && (
                <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording</span>
                </div>
              )}
              {mediaEntries.length > 0 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                  {mediaEntries.length} media
                </span>
              )}
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

            {/* Selected text indicator */}
            {selectedText && (
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
    </div>
  )
}