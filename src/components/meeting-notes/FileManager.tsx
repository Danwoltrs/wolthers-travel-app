'use client'

import React, { useRef, useState } from 'react'
import { Camera, FileText, X } from 'lucide-react'

interface FileManagerProps {
  capturedImages: File[]
  setCapturedImages: React.Dispatch<React.SetStateAction<File[]>>
  capturedDocuments: File[]
  setCapturedDocuments: React.Dispatch<React.SetStateAction<File[]>>
  isEditing: boolean
  ocrResults: string[]
  setOcrResults: React.Dispatch<React.SetStateAction<string[]>>
  isProcessingOCR: boolean
  selectedImageIndex: number | null
  processOCR: (imageFile: File, index: number) => Promise<void>
}

export default function FileManager({
  capturedImages,
  setCapturedImages,
  capturedDocuments,
  setCapturedDocuments,
  isEditing,
  ocrResults,
  setOcrResults,
  isProcessingOCR,
  selectedImageIndex,
  processOCR
}: FileManagerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
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

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index))
    setOcrResults(prev => prev.filter((_, i) => i !== index))
  }

  const removeDocument = (index: number) => {
    setCapturedDocuments(prev => prev.filter((_, i) => i !== index))
  }

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

  if (!(capturedImages.length > 0 || capturedDocuments.length > 0 || isEditing)) {
    return null
  }

  return (
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
                {capturedDocuments.map((document, index) => (
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
                ))}
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
  )
}