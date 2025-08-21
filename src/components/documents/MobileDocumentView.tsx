/**
 * MobileDocumentView Component
 * Mobile-optimized version of the Finder interface
 * Provides touch-friendly navigation and card-based layout
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  MoreVertical,
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileBarChart,
  Download,
  Share,
  Eye,
  Plus,
  Grid,
  List,
  RefreshCw
} from 'lucide-react';
import { SupplierFolder, SupplierDocument, FinderViewState } from '@/types/document-finder';
import { formatFileSize, formatDate } from '@/lib/utils';

interface MobileDocumentViewProps {
  suppliers: SupplierFolder[];
  viewState: FinderViewState;
  onNavigate: (path: string[]) => void;
  onSelectItem: (itemId: string, multi?: boolean) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
  loading?: boolean;
  className?: string;
}

const MobileDocumentView: React.FC<MobileDocumentViewProps> = ({
  suppliers,
  viewState,
  onNavigate,
  onSelectItem,
  onSearch,
  onBack,
  loading = false,
  className = ''
}) => {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState(viewState.searchQuery);

  // Get current items to display
  const getCurrentItems = () => {
    if (viewState.currentPath.length === 0) {
      return { folders: suppliers, files: [] };
    } else if (viewState.currentPath.length === 1) {
      const supplier = suppliers.find(s => s.name === viewState.currentPath[0]);
      return { 
        folders: supplier?.subFolders.map(yearFolder => ({
          ...yearFolder,
          name: yearFolder.year.toString(),
          itemCount: yearFolder.documents.length
        })) || [], 
        files: [] 
      };
    } else if (viewState.currentPath.length === 2) {
      const supplier = suppliers.find(s => s.name === viewState.currentPath[0]);
      const year = parseInt(viewState.currentPath[1]);
      const yearFolder = supplier?.subFolders.find(yf => yf.year === year);
      return { 
        folders: [], 
        files: yearFolder?.documents || [] 
      };
    }
    return { folders: [], files: [] };
  };

  // Get file type icon
  const getFileTypeIcon = (extension: string, size: 'small' | 'large' = 'large') => {
    const iconSize = size === 'large' ? 'w-8 h-8' : 'w-5 h-5';
    
    switch (extension.toLowerCase()) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className={`${iconSize} text-green-600 dark:text-emerald-400`} />;
      case 'csv':
        return <FileBarChart className={`${iconSize} text-purple-600 dark:text-purple-400`} />;
      case 'pdf':
        return <FileText className={`${iconSize} text-red-600 dark:text-red-400`} />;
      default:
        return <File className={`${iconSize} text-latte-600 dark:text-gray-400`} />;
    }
  };

  const { folders, files } = getCurrentItems();

  // Get current title
  const getCurrentTitle = () => {
    if (viewState.currentPath.length === 0) {
      return 'Documents';
    }
    return viewState.currentPath[viewState.currentPath.length - 1];
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setSearchExpanded(false);
  };

  return (
    <div className={`mobile-document-view bg-white dark:bg-sage-900 min-h-screen ${className}`}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-sage-600 to-sage-700 dark:from-emerald-700 dark:to-emerald-800 text-white">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {viewState.currentPath.length > 0 && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-semibold truncate">{getCurrentTitle()}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchExpanded(!searchExpanded)}
              className={`p-2 rounded-full transition-colors ${searchExpanded ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFilterExpanded(!filterExpanded)}
              className={`p-2 rounded-full transition-colors ${filterExpanded ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchExpanded && (
          <form onSubmit={handleSearchSubmit} className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40 transition-all"
                autoFocus
              />
            </div>
          </form>
        )}

        {/* Selection Info */}
        {viewState.selectedItems.length > 0 && (
          <div className="bg-white/10 px-4 py-2 border-t border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {viewState.selectedItems.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
                  <Share className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-md transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {filterExpanded && (
        <div className="bg-golden-50 dark:bg-emerald-900/20 border-b border-golden-200 dark:border-emerald-600/30 px-4 py-3">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-latte-700 dark:text-gray-300 mb-1">
                File Type
              </label>
              <div className="flex gap-2 overflow-x-auto">
                {['all', 'pdf', 'xlsx', 'csv'].map((type) => (
                  <button
                    key={type}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-sage-800 border border-golden-200 dark:border-emerald-600/30 rounded-full text-sm text-latte-700 dark:text-gray-300 hover:bg-golden-100 dark:hover:bg-emerald-800/50"
                  >
                    {type.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-latte-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <div className="flex gap-2 overflow-x-auto">
                {['Today', 'This Week', 'This Month', 'This Year'].map((range) => (
                  <button
                    key={range}
                    className="whitespace-nowrap px-3 py-1 bg-white dark:bg-sage-800 border border-golden-200 dark:border-emerald-600/30 rounded-full text-sm text-latte-700 dark:text-gray-300 hover:bg-golden-100 dark:hover:bg-emerald-800/50"
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-sage-600 dark:text-emerald-400 mr-2" />
            <span className="text-latte-600 dark:text-gray-400">Loading...</span>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* Empty State */}
            {folders.length === 0 && files.length === 0 && (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-latte-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-latte-700 dark:text-gray-300 mb-2">
                  No items found
                </h3>
                <p className="text-latte-600 dark:text-gray-400 text-sm px-4">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : 'This folder is empty'
                  }
                </p>
              </div>
            )}

            {/* Supplier Folders */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`mobile-folder-card bg-white dark:bg-sage-800/50 border border-golden-200 dark:border-emerald-600/30 rounded-lg p-4 ${
                  viewState.selectedItems.includes(folder.id) 
                    ? 'ring-2 ring-sage-500 dark:ring-emerald-400 bg-golden-50 dark:bg-emerald-900/20' 
                    : 'hover:shadow-md'
                } transition-all duration-200`}
                onClick={() => onNavigate([...viewState.currentPath, folder.name])}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Folder className="w-8 h-8 text-sage-500 dark:text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-latte-800 dark:text-gray-200 truncate">
                      {folder.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-latte-600 dark:text-gray-400">
                      <span>{folder.itemCount} items</span>
                      <span>{formatDate(folder.lastModified)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(folder.id);
                    }}
                    className="flex-shrink-0 p-2 text-sage-600 dark:text-emerald-400 hover:bg-sage-100 dark:hover:bg-emerald-700/20 rounded-full transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Document Files */}
            {files.map((file) => (
              <div
                key={file.id}
                className={`mobile-file-card bg-white dark:bg-sage-800/50 border border-golden-200 dark:border-emerald-600/30 rounded-lg p-4 ${
                  viewState.selectedItems.includes(file.id)
                    ? 'ring-2 ring-sage-500 dark:ring-emerald-400 bg-golden-50 dark:bg-emerald-900/20'
                    : 'hover:shadow-md'
                } transition-all duration-200`}
                onClick={() => onSelectItem(file.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getFileTypeIcon(file.extension)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-latte-800 dark:text-gray-200 line-clamp-2 mb-1">
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-latte-600 dark:text-gray-400 mb-2">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.lastModified)}</span>
                    </div>
                    
                    {/* File badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {file.isNew && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          New
                        </span>
                      )}
                      {file.isShared && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                          <Share className="w-3 h-3" />
                          Shared
                        </span>
                      )}
                      <span className="px-2 py-1 bg-latte-100 dark:bg-sage-700 text-latte-700 dark:text-gray-300 rounded-full text-xs">
                        {file.kind}
                      </span>
                    </div>

                    {/* Tags */}
                    {file.tags && file.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {file.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-latte-200 dark:bg-sage-600 text-latte-600 dark:text-gray-400 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {file.tags.length > 3 && (
                          <span className="px-2 py-1 text-latte-500 dark:text-gray-500 text-xs">
                            +{file.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle preview
                      }}
                      className="p-2 text-sage-600 dark:text-emerald-400 hover:bg-sage-100 dark:hover:bg-emerald-700/20 rounded-full transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle download
                      }}
                      className="p-2 text-sage-600 dark:text-emerald-400 hover:bg-sage-100 dark:hover:bg-emerald-700/20 rounded-full transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle more options
                      }}
                      className="p-2 text-sage-600 dark:text-emerald-400 hover:bg-sage-100 dark:hover:bg-emerald-700/20 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="w-14 h-14 bg-sage-600 dark:bg-emerald-600 hover:bg-sage-700 dark:hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default MobileDocumentView;