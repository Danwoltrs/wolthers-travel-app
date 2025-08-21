/**
 * Documents Tab Component
 * 
 * Finder-style document management interface for coffee supply chain documents.
 * Integrates CropDashboard and DocumentFinder for comprehensive document handling.
 */

import React, { useState, useCallback, useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { TripCard } from '@/types'
import type { TabValidationState } from '@/types/enhanced-modal'
import { useDocumentFinder, DocumentFinderContext } from '@/hooks/useDocumentFinder'
import { isMobileDevice } from '@/lib/utils'
import CropDashboard from '@/components/documents/CropDashboard'
import DocumentFinder from '@/components/documents/DocumentFinder'
import MobileDocumentView from '@/components/documents/MobileDocumentView'

interface DocumentsTabProps {
  trip: TripCard
  tripDetails?: any
  onUpdate: (tab: 'documents', updates: any) => void
  validationState: TabValidationState
  mode?: 'view' | 'edit'
}

export function DocumentsTab({ 
  trip, 
  tripDetails, 
  onUpdate, 
  validationState,
  mode = 'edit'
}: DocumentsTabProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create trip context for document filtering
  const documentContext: DocumentFinderContext = {
    tripId: trip.id,
    includeGeneral: mode === 'view' // In view mode, show general company docs too
  }

  // Use the DocumentFinder hook for state management and API integration with trip context
  const { state, actions } = useDocumentFinder(documentContext)

  // Check for mobile device on mount and window resize
  useEffect(() => {
    const checkDevice = () => setIsMobile(isMobileDevice())
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Handle crop information document clicks
  const handleCropDocumentClick = useCallback((document: any) => {
    console.log('Opening crop document:', document)
    // Implement document preview/download logic here
  }, [])

  // Handle file uploads
  const handleFileUpload = useCallback(async (files: File[], supplierId?: string) => {
    try {
      setError(null)
      await actions.uploadFiles(files, supplierId)
      // Optionally show success notification
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }, [actions])

  // Handle navigation in mobile view
  const handleMobileBack = useCallback(() => {
    const currentPath = state.viewState.currentPath
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1)
      actions.navigateBreadcrumb(Math.max(0, newPath.length - 1))
    }
  }, [state.viewState.currentPath, actions])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    actions.refresh()
    setError(null)
  }, [actions])

  // Error handling component
  const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">Error loading documents</span>
      </div>
      <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  )

  // Show loading state if initial data is loading
  if (state.loading && state.suppliers.length === 0 && state.cropInformation.length === 0) {
    return (
      <div className="documents-tab h-full flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-sage-600 dark:text-emerald-400 mx-auto mb-4" />
          <p className="text-latte-600 dark:text-gray-400">Loading document management system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="documents-tab h-full flex flex-col space-y-6">
      {/* Trip Context Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
            {mode === 'edit' ? 'Trip Documents' : 'Document Library'}
          </h3>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded font-medium">
                Trip: {trip.destination}
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
              {mode === 'edit' ? 'Trip Documents Only' : 'All Documents'}
            </span>
          </div>
        </div>
        {mode === 'view' && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded">
            View Mode
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={handleRefresh}
        />
      )}

      {/* Show state error if present */}
      {state.error && (
        <ErrorDisplay 
          error={state.error} 
          onRetry={handleRefresh}
        />
      )}

      {/* Crop Information Dashboard */}
      <CropDashboard 
        cropInformation={state.cropInformation}
        loading={state.loading}
        onDocumentClick={handleCropDocumentClick}
        onRefresh={handleRefresh}
        className="flex-shrink-0"
      />

      {/* Main Document Finder Interface */}
      <div className="flex-1 min-h-0">
        {isMobile ? (
          <MobileDocumentView
            suppliers={state.suppliers}
            viewState={state.viewState}
            onNavigate={(path) => {
              if (path.length === 1) {
                actions.navigateToSupplier(state.suppliers.find(s => s.name === path[0])?.id || '')
              } else if (path.length === 2) {
                actions.navigateToYear(parseInt(path[1]))
              } else if (path.length === 0) {
                actions.navigateBreadcrumb(-1)
              }
            }}
            onSelectItem={actions.selectItem}
            onSearch={actions.search}
            onBack={handleMobileBack}
            loading={state.loading}
            className="h-full"
          />
        ) : (
          <DocumentFinder
            suppliers={state.suppliers}
            viewState={state.viewState}
            onNavigate={(path) => {
              if (path.length === 1) {
                actions.navigateToSupplier(state.suppliers.find(s => s.name === path[0])?.id || '')
              } else if (path.length === 2) {
                actions.navigateToYear(parseInt(path[1]))
              } else if (path.length === 0) {
                actions.navigateBreadcrumb(-1)
              }
            }}
            onSelectItem={actions.selectItem}
            onSearch={actions.search}
            onFilter={actions.applyFilters}
            onSort={actions.changeSorting}
            onBulkAction={actions.performBulkAction}
            onUpload={handleFileUpload}
            loading={state.loading}
            className="h-full"
          />
        )}
      </div>

      {/* Bulk Actions Toolbar (shown when items are selected) */}
      {state.bulkActions.selectedItems.length > 0 && (
        <div className="bg-sage-600 dark:bg-emerald-600 text-white rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {state.bulkActions.selectedItems.length} items selected
            </span>
            <div className="flex items-center gap-2">
              {state.bulkActions.availableActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => actions.performBulkAction(action)}
                  disabled={state.bulkActions.isProcessing}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={actions.clearSelection}
            className="text-white/80 hover:text-white text-sm"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Trip Context Information */}
      {mode === 'edit' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 mt-0.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                Showing trip-specific documents
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Only documents created or uploaded during "{trip.destination}" trip are displayed. 
                Switch to view mode to see all company documents.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}