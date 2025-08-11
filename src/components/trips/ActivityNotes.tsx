'use client'

import React, { useState } from 'react'
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Presentation,
  X,
  Bold,
  Italic,
  List,
  Link,
  Save,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Activity } from '@/types'

interface Attachment {
  id: string
  name: string
  type: 'image' | 'pdf' | 'excel' | 'powerpoint' | 'word' | 'other'
  size: number
  url: string
  uploadedAt: Date
}

interface ActivityNotesProps {
  activity: Activity
  onClose: () => void
}

export default function ActivityNotes({ activity, onClose }: ActivityNotesProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [noteContent, setNoteContent] = useState(activity.notes || '')
  const [dragOver, setDragOver] = useState(false)

  // Mock existing attachments
  React.useEffect(() => {
    const mockAttachments: Attachment[] = [
      {
        id: '1',
        name: 'Meeting Agenda.pdf',
        type: 'pdf',
        size: 245760,
        url: '#',
        uploadedAt: new Date()
      },
      {
        id: '2',
        name: 'Coffee Samples.jpg',
        type: 'image',
        size: 1048576,
        url: '#',
        uploadedAt: new Date()
      }
    ]
    setAttachments(mockAttachments)
  }, [])

  const getFileIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-6 h-6 text-blue-500" />
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />
      case 'excel':
        return <FileSpreadsheet className="w-6 h-6 text-green-500" />
      case 'powerpoint':
        return <Presentation className="w-6 h-6 text-orange-500" />
      case 'word':
        return <FileText className="w-6 h-6 text-blue-600" />
      default:
        return <FileText className="w-6 h-6 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileUpload = (files: File[]) => {
    // Mock file upload
    files.forEach(file => {
      const newAttachment: Attachment = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        url: URL.createObjectURL(file),
        uploadedAt: new Date()
      }
      setAttachments(prev => [...prev, newAttachment])
    })
  }

  const getFileType = (filename: string): Attachment['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image'
      case 'pdf':
        return 'pdf'
      case 'xls':
      case 'xlsx':
        return 'excel'
      case 'ppt':
      case 'pptx':
        return 'powerpoint'
      case 'doc':
      case 'docx':
        return 'word'
      default:
        return 'other'
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleSave = () => {
    // Save note content
    console.log('Saving note:', noteContent)
    setIsEditing(false)
  }

  return (
    <div className="bg-gray-50 border-t border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900">
          Notes & Attachments
        </h4>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Attachments Section */}
      <div className="mb-6">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Attachments</h5>
        
        {/* Upload Area */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-4 transition-colors',
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drag & drop files here, or{' '}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(Array.from(e.target.files))
                    }
                  }}
                />
              </label>
            </p>
            <p className="text-xs text-gray-500">
              Supports: Images, PDFs, Excel, PowerPoint, Word documents
            </p>
          </div>
        </div>

        {/* Attachment List */}
        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(attachment.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} • {attachment.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-1 hover:bg-gray-100 rounded"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => removeAttachment(attachment.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Remove"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rich Text Editor */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-medium text-gray-700">Notes</h5>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-200 rounded">
                <Bold className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded">
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <button className="p-2 hover:bg-gray-200 rounded">
                <List className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded">
                <Link className="w-4 h-4" />
              </button>
            </div>
            
            {/* Editor */}
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="w-full h-32 p-4 resize-none focus:outline-none"
              placeholder={noteContent ? "" : "Add your notes here..."}
            />
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded-lg p-4 min-h-[8rem]">
            {noteContent ? (
              <div className="prose prose-sm max-w-none">
                {noteContent.split('\n').map((line, index) => (
                  <p key={index} className="mb-2 last:mb-0">
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No notes added yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}