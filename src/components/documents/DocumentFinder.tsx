/**
 * DocumentFinder Component
 * Main Finder-style interface with column-based navigation
 * Implements macOS Finder conventions within Nordic minimalist design
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Grid3X3,
  List,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  FileText,
  FileSpreadsheet,
  FileBarChart,
  Archive,
  Download,
  Share,
  MoreVertical,
  Plus,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';

import { DocumentFinderProps, SupplierFolder, SupplierDocument, FinderViewState } from '@/types/document-finder';
import { formatFileSize, formatDate } from '@/lib/utils';
import SupplierFolderRow from './SupplierFolderRow';
import FileRow from './FileRow';

const DocumentFinder: React.FC<DocumentFinderProps> = ({
  suppliers,
  viewState,
  onNavigate,
  onSelectItem,
  onSearch,
  onFilter,
  onSort,
  onBulkAction,
  onUpload,
  loading = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(viewState.searchQuery);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, itemId: string} | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle search with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== viewState.searchQuery) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, viewState.searchQuery, onSearch]);

  // Get current breadcrumb path
  const getBreadcrumbs = () => {
    if (viewState.currentPath.length === 0) {
      return [{ label: 'Documents', path: [] }];
    }

    const breadcrumbs = [{ label: 'Documents', path: [] }];
    
    for (let i = 0; i < viewState.currentPath.length; i++) {
      const path = viewState.currentPath.slice(0, i + 1);
      breadcrumbs.push({
        label: viewState.currentPath[i],
        path
      });
    }

    return breadcrumbs;
  };

  // Get file type icon
  const getFileTypeIcon = (extension: string) => {
    switch (extension.toLowerCase()) {
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-emerald-400" />;
      case 'csv':
        return <FileBarChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'zip':
      case 'rar':
        return <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      default:
        return <File className="w-5 h-5 text-latte-600 dark:text-gray-400" />;
    }
  };

  // Handle sorting
  const handleSort = (column: string) => {
    const newDirection = viewState.sortBy === column && viewState.sortDirection === 'asc' 
      ? 'desc' 
      : 'asc';
    onSort(column, newDirection);
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (viewState.sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 opacity-50" />;
    }
    return viewState.sortDirection === 'asc' 
      ? <SortAsc className="w-3 h-3" />
      : <SortDesc className="w-3 h-3" />;
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0 && onUpload) {
      // Get current supplier from path if available
      const currentSupplierId = viewState.currentPath.length > 0 
        ? suppliers.find(s => s.name === viewState.currentPath[0])?.id 
        : undefined;
      onUpload(files, currentSupplierId);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0 && onUpload) {
      const currentSupplierId = viewState.currentPath.length > 0 
        ? suppliers.find(s => s.name === viewState.currentPath[0])?.id 
        : undefined;
      onUpload(files, currentSupplierId);
    }
  };

  // Handle context menu
  const handleContextMenu = (event: React.MouseEvent, itemId: string) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      itemId
    });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get current items to display
  const getCurrentItems = () => {
    if (viewState.currentPath.length === 0) {
      // Show all suppliers
      return { folders: suppliers, files: [] };
    } else if (viewState.currentPath.length === 1) {
      // Show years within a supplier
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
      // Show documents within a year
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

  const { folders, files } = getCurrentItems();
  const breadcrumbs = getBreadcrumbs();

  return (
    <div className={`document-finder bg-white dark:bg-sage-900/50 border border-golden-200 dark:border-emerald-600/30 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header with Search and Controls */}
      <div className="finder-header bg-gradient-to-r from-sage-600 to-sage-700 dark:from-emerald-700 dark:to-emerald-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Supplier Documents</h2>
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40 transition-all w-64"
              />
            </div>
            
            {/* View Controls */}
            <div className="flex items-center gap-2">
              <button 
                className={`p-2 rounded-md transition-colors ${viewState.viewMode === 'list' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => onSort('list', viewState.sortDirection)}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                className={`p-2 rounded-md transition-colors ${viewState.viewMode === 'grid' ? 'bg-white/20' : 'hover:bg-white/10'}`}
                onClick={() => onSort('grid', viewState.sortDirection)}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Button */}
            {onUpload && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.xlsx,.xls,.csv,.docx,.json,.zip"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-nav bg-golden-50 dark:bg-emerald-900/20 px-6 py-3 border-b border-golden-200 dark:border-emerald-600/30">
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-latte-600 dark:text-gray-400" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-latte-800 dark:text-gray-200 font-medium">{crumb.label}</span>
              ) : (
                <button 
                  className="text-sage-600 dark:text-emerald-400 hover:text-sage-800 dark:hover:text-emerald-200 transition-colors"
                  onClick={() => onNavigate(crumb.path)}
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          ))}
          {viewState.selectedItems.length > 0 && (
            <>
              <div className="ml-4 h-4 w-px bg-latte-300 dark:bg-gray-600" />
              <span className="ml-2 text-xs text-latte-600 dark:text-gray-400">
                {viewState.selectedItems.length} selected
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Main Finder Table */}
      <div 
        className={`finder-table ${dragOver ? 'bg-golden-50 dark:bg-emerald-900/30' : ''} transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Column Headers */}
        <div className="table-header bg-latte-100 dark:bg-sage-800 border-b border-golden-200 dark:border-emerald-600/30">
          <div className="grid grid-cols-[2fr,1fr,1fr,1fr] gap-4 px-6 py-3 text-sm font-semibold text-sage-700 dark:text-emerald-300">
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('name')}
            >
              Name
              {getSortIcon('name')}
            </button>
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('dateModified')}
            >
              Date Modified
              {getSortIcon('dateModified')}
            </button>
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('size')}
            >
              Size
              {getSortIcon('size')}
            </button>
            <button 
              className="flex items-center gap-2 hover:text-sage-900 dark:hover:text-emerald-200 justify-start transition-colors"
              onClick={() => handleSort('kind')}
            >
              Kind
              {getSortIcon('kind')}
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="table-body max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-sage-600 dark:text-emerald-400 mr-2" />
              <span className="text-latte-600 dark:text-gray-400">Loading documents...</span>
            </div>
          ) : (
            <>
              {/* Drag Over Overlay */}
              {dragOver && (
                <div className="absolute inset-0 bg-golden-100/80 dark:bg-emerald-900/80 flex items-center justify-center z-10 border-2 border-dashed border-sage-400 dark:border-emerald-400 m-4 rounded-lg">
                  <div className="text-center">
                    <Plus className="w-12 h-12 text-sage-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-sage-700 dark:text-emerald-300 font-medium">Drop files to upload</p>
                    <p className="text-sm text-sage-600 dark:text-emerald-400">Supports PDF, Excel, CSV, and more</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {folders.length === 0 && files.length === 0 && (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-latte-400 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-latte-700 dark:text-gray-300 mb-2">
                    {viewState.currentPath.length === 0 ? 'No suppliers found' : 'No documents found'}
                  </h3>
                  <p className="text-latte-600 dark:text-gray-400">
                    {searchQuery 
                      ? `No results for "${searchQuery}". Try adjusting your search.`
                      : 'Upload documents to get started.'
                    }
                  </p>
                </div>
              )}

              {/* Supplier Folders */}
              {folders.map((folder) => (
                <SupplierFolderRow
                  key={folder.id}
                  folder={folder}
                  isSelected={viewState.selectedItems.includes(folder.id)}
                  onSelect={(multi) => onSelectItem(folder.id, multi)}
                  onNavigate={() => onNavigate([...viewState.currentPath, folder.name])}
                  onContextMenu={(e) => handleContextMenu(e, folder.id)}
                />
              ))}

              {/* Document Files */}
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  document={file}
                  isSelected={viewState.selectedItems.includes(file.id)}
                  onSelect={(multi) => onSelectItem(file.id, multi)}
                  onContextMenu={(e) => handleContextMenu(e, file.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-sage-800 border border-golden-200 dark:border-emerald-600/30 rounded-lg shadow-lg py-2 z-50 min-w-48"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button className="w-full px-4 py-2 text-left hover:bg-golden-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Download
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-golden-50 dark:hover:bg-emerald-900/20 flex items-center gap-2 text-sm">
            <Share className="w-4 h-4" />
            Share
          </button>
          <div className="border-t border-golden-200 dark:border-emerald-600/30 my-1" />
          <button className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <MoreVertical className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentFinder;