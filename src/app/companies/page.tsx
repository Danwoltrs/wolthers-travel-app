'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, AlertTriangle, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import CompaniesSidebar from '@/components/companies/CompaniesSidebar'
import EnhancedHeatmap from '@/components/companies/charts/EnhancedHeatmap'
import TravelTrendsChart from '@/components/companies/charts/TravelTrendsChart'
import RealTravelTrends from '@/components/companies/charts/RealTravelTrends'
import CropDashboard from '@/components/documents/CropDashboard'
import DocumentFinder from '@/components/documents/DocumentFinder'
import MobileDocumentView from '@/components/documents/MobileDocumentView'
import { useDocumentFinder } from '@/hooks/useDocumentFinder'
import { isMobileDevice } from '@/lib/utils'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function CompaniesPage() {
  const [selectedSection, setSelectedSection] = useState<'wolthers' | 'importers' | 'exporters'>('wolthers')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Mobile sidebar starts collapsed
  
  // Fetch real Wolthers staff data
  const { data: staffData, error: staffError, isLoading: staffLoading } = useSWR(
    '/api/users/wolthers-staff',
    fetcher
  )

  // Use the DocumentFinder hook for document management
  const { state, actions } = useDocumentFinder()

  // Check for mobile device on mount and window resize
  useEffect(() => {
    const checkDevice = () => {
      const mobile = isMobileDevice()
      setIsMobile(mobile)
      // Ensure sidebar is collapsed on mobile by default
      if (mobile) {
        setSidebarCollapsed(true)
      }
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const handleSectionChange = (section: 'wolthers' | 'importers' | 'exporters') => {
    setSelectedSection(section)
    // Auto-close sidebar on mobile when section changes
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }

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

  const sectionTitles = {
    wolthers: 'Wolthers & Associates',
    importers: 'Importers/Roasters',
    exporters: 'Exporters/Producers/Coops'
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE4D3] dark:from-[#1a1a1a] dark:to-[#0f0f0f]">
      {/* Sidebar */}
      <CompaniesSidebar 
        selectedSection={selectedSection}
        onSectionChange={handleSectionChange}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Breadcrumb Navigation */}
        <div className="sticky top-0 z-10 bg-slate-800 dark:bg-slate-900 border-b border-slate-700 dark:border-slate-800 px-8 py-4 lg:px-8 pl-16 lg:pl-8">
          <nav className="flex items-center space-x-2 text-sm text-amber-300 dark:text-amber-400">
            <span>Companies</span>
            <span>/</span>
            <span className="text-amber-100 dark:text-amber-200 font-medium">
              {sectionTitles[selectedSection]}
            </span>
          </nav>
        </div>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8 lg:p-8 pl-16 lg:pl-8">
          {/* Two Column Layout: Balanced Responsive Layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-start space-y-6 lg:space-y-0">
            
            {/* Left Column: Fixed max width of 770px */}
            <div className="w-full space-y-6 min-w-0" style={{ maxWidth: '770px' }}>
              {/* Enhanced Heatmap - MASTER WIDTH COMPONENT */}
              <EnhancedHeatmap 
                selectedSection={selectedSection}
              />
              
              {/* Real Travel Trends - Matches heatmap width */}
              <RealTravelTrends 
                selectedSection={selectedSection}
              />
              
              {/* Wolthers Staff */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4">
                  {selectedSection === 'wolthers' ? 'Wolthers Staff' : 
                   selectedSection === 'importers' ? 'Importer Contacts' : 'Exporter Contacts'}
                </h3>
                
                {selectedSection === 'wolthers' && (
                  <div className="space-y-4">
                    {staffLoading ? (
                      // Loading skeleton
                      <div className="space-y-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2 animate-pulse"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1 animate-pulse"></div>
                              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-40 animate-pulse"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : staffError ? (
                      <div className="text-center text-red-500 dark:text-red-400 py-8">
                        Error loading staff: {staffError.message || 'Failed to load staff data'}
                      </div>
                    ) : !staffData?.staff || staffData.staff.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No Wolthers staff found
                      </div>
                    ) : (
                      // Real staff data
                      staffData.staff.map((member: any, index: number) => {
                        // Generate initials from full name
                        const initials = member.full_name
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase() || 'UN';
                        
                        // Generate avatar colors based on index for visual variety
                        const avatarColors = [
                          'bg-emerald-500',
                          'bg-amber-500', 
                          'bg-blue-500',
                          'bg-purple-500',
                          'bg-rose-500',
                          'bg-indigo-500'
                        ];
                        const avatarColor = avatarColors[index % avatarColors.length];
                        
                        return (
                          <div key={member.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium`}>
                              {initials}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {member.full_name || 'Unknown User'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {selectedSection === 'importers' && (
                  <div className="space-y-4">
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Importer contact information will be displayed here
                    </div>
                  </div>
                )}

                {selectedSection === 'exporters' && (
                  <div className="space-y-4">
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Exporter contact information will be displayed here
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Full flexible width to fill remaining space */}
            <div className="w-full lg:flex-1 min-w-0 flex flex-col space-y-6">
              {/* Travel Coordination Trends at top */}
              <TravelTrendsChart 
                selectedSection={selectedSection}
              />
              
              {/* Document Management System below */}
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

              {/* Loading state for initial load */}
              {state.loading && state.suppliers.length === 0 && state.cropInformation.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-12 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-sage-600 dark:text-emerald-400 mx-auto mb-4" />
                    <p className="text-latte-600 dark:text-gray-400">Loading document management system...</p>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}