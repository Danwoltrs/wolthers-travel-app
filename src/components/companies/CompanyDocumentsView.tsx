'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Eye, Calendar, Search, Filter } from 'lucide-react'

interface Document {
  id: string
  filename: string
  file_path: string
  file_size: number
  file_size_mb: string
  file_type: string
  uploaded_at: string
  description?: string
  trip_title: string
  trip_code: string
  trip_id: string
}

interface CompanyDocumentsViewProps {
  companyId: string
  documents?: any
}

export default function CompanyDocumentsView({ companyId, documents }: CompanyDocumentsViewProps) {
  const [documentsList, setDocumentsList] = useState<Document[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (documents?.documents) {
      setDocumentsList(documents.documents)
    }
  }, [documents])

  const filteredDocuments = documentsList.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.trip_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'all' || doc.file_type === selectedType

    return matchesSearch && matchesType
  })

  const fileTypeColors: { [key: string]: string } = {
    'pdf': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    'doc': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    'docx': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    'xls': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    'xlsx': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    'ppt': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
    'pptx': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
    'jpg': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
    'jpeg': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
    'png': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
  }

  const handleDownload = async (document: Document) => {
    try {
      setIsLoading(true)
      // TODO: Implement download functionality
      console.log('Downloading document:', document.filename)
      alert('Document download will be implemented soon')
    } catch (error) {
      console.error('Error downloading document:', error)
      alert('Failed to download document')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = (document: Document) => {
    // TODO: Implement preview functionality
    console.log('Previewing document:', document.filename)
    alert('Document preview will be implemented soon')
  }

  const uniqueFileTypes = [...new Set(documentsList.map(doc => doc.file_type))].filter(Boolean)
  const totalSize = documentsList.reduce((acc, doc) => acc + doc.file_size, 0)
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{documentsList.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Size</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSizeMB} MB</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">File Types</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{uniqueFileTypes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Trip Documents
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Documents from trips you've participated in
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents by name, trip, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
            className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        >
          <option value="all">All Types</option>
          {uniqueFileTypes.map(type => (
            <option key={type} value={type}>{type.toUpperCase()}</option>
          ))}
        </select>
      </div>
      
      {/* Documents List */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800">
        {filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                          {document.filename}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          fileTypeColors[document.file_type] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                        }`}>
                          {document.file_type?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{document.trip_code}</span>
                        </div>
                        <span>•</span>
                        <span>{document.file_size_mb} MB</span>
                        <span>•</span>
                        <span>{new Date(document.uploaded_at).toLocaleDateString()}</span>
                      </div>
                      
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                        From: {document.trip_title}
                      </p>
                      
                      {document.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handlePreview(document)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Preview document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      disabled={isLoading}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {searchTerm || selectedType !== 'all' ? 'No documents match your filters' : 'No documents available'}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Documents from trips you participate in will appear here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}