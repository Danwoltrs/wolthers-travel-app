/**
 * Documents Tab Component
 * 
 * Provides document management with file uploads, organization,
 * and sharing capabilities for trip-related documents.
 */

import React, { useState, useCallback } from 'react'
import { 
  FileText, 
  Upload, 
  Download, 
  Share2, 
  Trash2,
  Eye,
  Search,
  Filter,
  Folder,
  File,
  Image,
  FileX,
  Plus
} from 'lucide-react'
import type { TripCard } from '@/types'
import type { TabValidationState } from '@/types/enhanced-modal'

interface DocumentsTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'documents', updates: any) => void
  validationState: TabValidationState
}

export function DocumentsTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState 
}: DocumentsTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showUpload, setShowUpload] = useState(false)

  // Mock documents data
  const mockDocuments = [
    {
      id: '1',
      name: 'Trip Itinerary - Brazil Coffee Tour.pdf',
      type: 'pdf',
      size: '2.4 MB',
      category: 'itinerary',
      uploadedBy: 'Daniel Wolthers',
      uploadedAt: '2024-01-15T10:30:00Z',
      shared: true,
      url: '#'
    },
    {
      id: '2',
      name: 'Flight Confirmation - CPH to GRU.pdf',
      type: 'pdf',
      size: '892 KB',
      category: 'travel',
      uploadedBy: 'Tom Nielsen',
      uploadedAt: '2024-01-14T14:20:00Z',
      shared: false,
      url: '#'
    },
    {
      id: '3',
      name: 'Hotel Booking - Santos Plaza.pdf',
      type: 'pdf',
      size: '1.1 MB',
      category: 'accommodation',
      uploadedBy: 'Daniel Wolthers',
      uploadedAt: '2024-01-13T09:45:00Z',
      shared: true,
      url: '#'
    },
    {
      id: '4',
      name: 'Company Presentation - Q4 Import Plans.pptx',
      type: 'presentation',
      size: '15.7 MB',
      category: 'presentation',
      uploadedBy: 'Daniel Wolthers',
      uploadedAt: '2024-01-12T16:00:00Z',
      shared: false,
      url: '#'
    }
  ]

  const documentCategories = [
    { id: 'all', label: 'All Documents', count: mockDocuments.length },
    { id: 'itinerary', label: 'Itinerary', count: mockDocuments.filter(d => d.category === 'itinerary').length },
    { id: 'travel', label: 'Travel', count: mockDocuments.filter(d => d.category === 'travel').length },
    { id: 'accommodation', label: 'Accommodation', count: mockDocuments.filter(d => d.category === 'accommodation').length },
    { id: 'presentation', label: 'Presentations', count: mockDocuments.filter(d => d.category === 'presentation').length },
    { id: 'contracts', label: 'Contracts', count: 0 },
    { id: 'receipts', label: 'Receipts', count: 0 }
  ]

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case 'presentation':
        return <FileText className="w-8 h-8 text-orange-500" />
      case 'image':
        return <Image className="w-8 h-8 text-blue-500" />
      default:
        return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'itinerary':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'travel':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'accommodation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'presentation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'contracts':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'receipts':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Documents & Files
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              List
            </button>
          </div>
          
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        >
          {documentCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label} ({category.count})
            </option>
          ))}
        </select>
      </div>

      {/* Document Categories */}
      <div className="flex flex-wrap gap-2">
        {documentCategories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === category.id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.label} ({category.count})
          </button>
        ))}
      </div>

      {/* Documents Display */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
        {filteredDocuments.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="group p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-lg hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex flex-col items-center space-y-3">
                      {getFileIcon(doc.type)}
                      
                      <div className="text-center">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate w-full" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {doc.size}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(doc.category)}`}>
                          {doc.category}
                        </span>
                        {doc.shared && (
                          <Share2 className="w-3 h-3 text-emerald-500" />
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-emerald-600" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-amber-600" title="Share">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#111111]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getFileIcon(doc.type)}
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {doc.name}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{doc.size}</span>
                            <span>Uploaded by {doc.uploadedBy}</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(doc.category)}`}>
                          {doc.category}
                        </span>
                        
                        {doc.shared && (
                          <div className="flex items-center space-x-1">
                            <Share2 className="w-3 h-3 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">Shared</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-1">
                          <button className="p-1 text-gray-400 hover:text-blue-600" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-emerald-600" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-amber-600" title="Share">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-12 text-center">
            <FileX className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No documents match your search criteria' 
                : 'No documents uploaded yet'
              }
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search terms or filters'
                : 'Upload documents to organize trip information'
              }
            </p>
          </div>
        )}
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Supports PDF, DOCX, PPTX, XLSX, and image files up to 25MB
            </p>
            <button className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              Choose Files
            </button>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {mockDocuments.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Total Files
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {mockDocuments.filter(d => d.shared).length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Shared
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {documentCategories.length - 1}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Categories
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4 text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            21.2
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-1">
            Total MB
          </div>
        </div>
      </div>
    </div>
  )
}