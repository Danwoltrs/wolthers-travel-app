'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, AlertTriangle, RefreshCw } from 'lucide-react'
import useSWR from 'swr'
import CompaniesSidebar from '@/components/companies/CompaniesSidebar'
import { useAuth } from '@/contexts/AuthContext'
import EnhancedHeatmap from '@/components/companies/charts/EnhancedHeatmap'
import TravelTrendsChart from '@/components/companies/charts/TravelTrendsChart'
import RealTravelTrends from '@/components/companies/charts/RealTravelTrends'
import CropDashboard from '@/components/documents/CropDashboard'
import DocumentFinder from '@/components/documents/DocumentFinder'
import MobileDocumentView from '@/components/documents/MobileDocumentView'
import BuyersPanel from '@/components/companies/BuyersPanel'
import SuppliersPanel from '@/components/companies/SuppliersPanel'
import AddCompanyModal from '@/components/companies/AddCompanyModal'
import CompanyDashboard from '@/components/companies/CompanyDashboard'
import UnifiedUsersPanel from '@/components/companies/UnifiedUsersPanel'
import { useDocumentFinder } from '@/hooks/useDocumentFinder'
import { isMobileDevice } from '@/lib/utils'

// Fetcher function for SWR
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function CompaniesPage() {
  const [selectedSection, setSelectedSection] = useState<'wolthers' | 'buyers' | 'suppliers'>('wolthers')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // Mobile sidebar starts collapsed
  const [showAddBuyerModal, setShowAddBuyerModal] = useState(false)
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false)
  const [showCompanyDashboard, setShowCompanyDashboard] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  
  const { user } = useAuth()
  
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

  const handleSectionChange = (section: 'wolthers' | 'buyers' | 'suppliers') => {
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

  // Handle viewing company dashboard
  const handleViewCompanyDashboard = (company: any) => {
    setSelectedCompany(company)
    setShowCompanyDashboard(true)
  }

  // Handle closing company dashboard
  const handleCloseDashboard = () => {
    setShowCompanyDashboard(false)
    setSelectedCompany(null)
  }

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
    buyers: 'Buyers',
    suppliers: 'Suppliers'
  }

  // If showing company dashboard, render it instead of main layout
  if (showCompanyDashboard && selectedCompany) {
    const shouldShowSidebar = !!user?.companyId && user.companyId !== selectedCompany.id
    console.log('[CompaniesPage] Full user object analysis:', {
      user: user,
      userKeys: user ? Object.keys(user) : 'no user',
      selectedCompanyName: selectedCompany.name,
      selectedCompanyId: selectedCompany.id,
      userCompanyId: user?.company_id,  // OLD FIELD
      userCompanyIdNew: user?.companyId, // CORRECT FIELD
      userEmail: user?.email,
      shouldShowSidebar,
      comparisonResult: user?.companyId !== selectedCompany.id
    })
    
    return (
      <CompanyDashboard 
        company={selectedCompany}
        onBack={handleCloseDashboard}
        viewerCompanyId={user?.companyId} // Current user's company ID
        showSidebar={shouldShowSidebar} // Show sidebar if Wolthers viewing other company
      />
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE4D3] dark:from-[#1a1a1a] dark:to-[#0f0f0f]">
      {/* Sidebar */}
      <CompaniesSidebar 
        selectedSection={selectedSection}
        onSectionChange={handleSectionChange}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onAddBuyer={() => setShowAddBuyerModal(true)}
        onAddSupplier={() => setShowAddSupplierModal(true)}
        onViewDashboard={handleViewCompanyDashboard} // Pass dashboard handler to sidebar
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
          <div className="flex flex-col 2xl:flex-row gap-6 items-start space-y-6 2xl:space-y-0">
            
            {/* Left Column: Added 20px to ensure weeks 51-52 are visible */}
            <div className="w-full space-y-6 min-w-0" style={{ maxWidth: '800px' }}>
              {/* Enhanced Heatmap - MASTER WIDTH COMPONENT */}
              <EnhancedHeatmap 
                selectedSection={selectedSection}
              />
              
              {/* Real Travel Trends - Matches heatmap width */}
              <RealTravelTrends 
                selectedSection={selectedSection}
              />
              
              {/* Companies and Users */}
              {selectedSection === 'wolthers' ? (
                <UnifiedUsersPanel onViewDashboard={handleViewCompanyDashboard} />
              ) : (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4">
                    {selectedSection === 'buyers' ? 'Buyer Companies' : 'Supplier Companies'}
                  </h3>
                  
                  {selectedSection === 'buyers' && (
                    <BuyersPanel onViewDashboard={handleViewCompanyDashboard} />
                  )}

                  {selectedSection === 'suppliers' && (
                    <SuppliersPanel onViewDashboard={handleViewCompanyDashboard} />
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Full flexible width to fill remaining space */}
            <div className="w-full 2xl:flex-1 min-w-0 flex flex-col space-y-6">
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

      {/* Add Company Modals */}
      <AddCompanyModal
        isOpen={showAddBuyerModal}
        onClose={() => setShowAddBuyerModal(false)}
        companyType="buyer"
      />
      
      <AddCompanyModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        companyType="supplier"
      />
    </div>
  )
}