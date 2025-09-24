'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Save, Bold, Italic, List, ListOrdered, CheckSquare, Table, BarChart3, Clock, Users, Undo, Redo, Type, Building2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import TableModal from './TableModal'
import ChartModal from './ChartModal'
import CompanyAccessManager from './CompanyAccessManager'

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

interface NoteContent {
  html: string
  plainText: string
  elements?: Array<{
    type: 'table' | 'chart'
    data: any
    position: number
  }>
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

  // Load existing notes
  useEffect(() => {
    if (isOpen && activityId) {
      loadNotes()
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

  const loadNotes = async () => {
    try {
      const response = await fetch(`/api/activities/${activityId}/notes`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        const notes = result.notes || []
        
        // Find rich text note
        const richTextNote = notes.find((note: any) => note.note_type === 'rich_text')

        if (richTextNote && richTextNote.content) {
          if (typeof richTextNote.content === 'object') {
            setContent(richTextNote.content as NoteContent)
            if (editorRef.current) {
              editorRef.current.innerHTML = richTextNote.content.html || ''
            }
          } else {
            // Legacy plain text content
            const htmlContent = richTextNote.content.replace(/\n/g, '<br>')
            setContent({ 
              html: htmlContent, 
              plainText: richTextNote.content 
            })
            if (editorRef.current) {
              editorRef.current.innerHTML = htmlContent
            }
          }
          setLastSaved(new Date(richTextNote.updated_at))
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
        elements: content.elements
      }

      // Include company access information in the note metadata
      const noteData = {
        content: noteContent,
        note_type: 'rich_text',
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
        throw new Error('Failed to save note')
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

  const formatMeetingDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <div className="flex items-center space-x-2 flex-wrap gap-2">
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
              className="min-h-[300px] focus:outline-none prose prose-base max-w-none dark:prose-invert"
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#374151',
              }}
              onInput={handleContentChange}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="Start typing your meeting notes..."
            />
          </div>
        </div>

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