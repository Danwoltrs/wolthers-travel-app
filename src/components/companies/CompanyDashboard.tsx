'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Calendar, FileText, BarChart3, MapPin, Phone, Mail, Search, Plus, AlertTriangle, RefreshCw, User, ChevronDown, Home, Building, LogOut, Sun, Moon, Edit } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import useSWR from 'swr'
import CompanyTravelHeatmap from './CompanyTravelHeatmap'
import CompanyUsersManager from './CompanyUsersManager'
import CompanyDocumentsView from './CompanyDocumentsView'
import CompaniesSidebar from './CompaniesSidebar'
import CompanyEditModal from './CompanyEditModal'
import EnhancedHeatmap from './charts/EnhancedHeatmap'
import RealTravelTrends from './charts/RealTravelTrends'
import TravelTrendsChart from './charts/TravelTrendsChart'
import CropDashboard from '@/components/documents/CropDashboard'
import DocumentFinder from '@/components/documents/DocumentFinder'
import MobileDocumentView from '@/components/documents/MobileDocumentView'
import { useDocumentFinder } from '@/hooks/useDocumentFinder'
import { isMobileDevice, cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

interface Company {
  id: string
  name: string
  fantasy_name?: string
  category: string
  email?: string
  phone?: string
  website?: string
  locations?: any[]
}

interface CompanyDashboardProps {
  company: Company
  onBack: () => void
  viewerCompanyId?: string // ID of the company viewing this dashboard
  showSidebar?: boolean // Whether to show the sidebar for Wolthers staff
  breadcrumbContext?: { base: string; section: string; item?: string } | null // Custom breadcrumb context
  selectedExternalCompany?: any // Currently selected external company
  onSectionChange?: (section: 'wolthers' | 'buyers' | 'suppliers') => void
  onViewDashboard?: (company: any) => void
  onNavigateToMain?: () => void // Navigate back to main companies overview
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function CompanyDashboard({ 
  company, 
  onBack, 
  viewerCompanyId, 
  showSidebar = false, 
  breadcrumbContext, 
  selectedExternalCompany,
  onSectionChange,
  onViewDashboard,
  onNavigateToMain 
}: CompanyDashboardProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [selectedSection, setSelectedSection] = useState<'wolthers' | 'buyers' | 'suppliers'>('buyers')
  const [showEditModal, setShowEditModal] = useState(false)
  
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  
  // Debug logging for sidebar visibility
  console.log('[CompanyDashboard] Debug info:', {
    companyName: company.name,
    companyId: company.id,
    viewerCompanyId,
    showSidebar,
    userCompanyId: user?.companyId,  // Fixed: use camelCase companyId
    userId: user?.id,
    userEmail: user?.email,
    propsShowSidebar: showSidebar,
    conditionalCheck: !showSidebar,
    willShowDualHeader: !showSidebar
  })

  // Fetch company-specific data - handle Wolthers & Associates as special case
  const isWolthersCompany = company.id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'
  const { data: companyDetails } = useSWR(
    isWolthersCompany ? null : `/api/companies/${company.id}`,
    fetcher
  )
  const { data: companyTrips } = useSWR(
    isWolthersCompany ? null : `/api/companies/${company.id}/trips`,
    fetcher
  )
  const { data: companyContacts } = useSWR(
    isWolthersCompany ? '/api/users/wolthers-staff' : `/api/companies/${company.id}/staff`,
    fetcher
  )
  const { data: companyDocuments } = useSWR(
    isWolthersCompany ? null : `/api/companies/${company.id}/documents`,
    fetcher
  )
  
  // Fetch data for charts to determine if they should be shown
  // For external companies, always use their specific company ID
  const { data: travelData } = useSWR(
    isWolthersCompany ? '/api/charts/travel-data' : `/api/charts/travel-data?companyId=${company.id}`,
    fetcher
  )
  const { data: tripsData } = useSWR(
    `/api/trips/real-data?companyId=${company.id}`,
    fetcher
  )

  // Use the DocumentFinder hook for document management with company context  
  const { state, actions } = useDocumentFinder({ companyId: company.id })

  const headquarters = companyDetails?.locations?.find((loc: any) => loc.is_primary_location || loc.is_headquarters)
  
  // Helper functions to check if charts have data
  const hasHeatmapData = () => {
    return travelData?.heatmapData?.yearlyData && Object.keys(travelData.heatmapData.yearlyData).length > 0
  }
  
  const hasRealTravelTrendsData = () => {
    return tripsData?.trips && tripsData.trips.length > 0
  }
  
  const hasTravelTrendsChartData = () => {
    return travelData?.trendsData?.totalTrips > 0
  }
  
  // Determine viewing context
  const isWolthersStaffView = viewerCompanyId && viewerCompanyId !== company.id
  const isExternalCompanyView = !viewerCompanyId || viewerCompanyId === company.id
  
  // Determine if costs should be shown (only when Wolthers is viewing other company's dashboard)
  const showCosts = isWolthersStaffView
  
  // Determine if current user can edit this company (external admin viewing their own company)
  const canEditCompany = isExternalCompanyView && user?.user_type === 'admin' && user?.companyId === company.id

  // Check for mobile device on mount and window resize
  useEffect(() => {
    const checkDevice = () => {
      const mobile = isMobileDevice()
      setIsMobile(mobile)
    }
    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen) {
        setIsUserDropdownOpen(false)
      }
    }
    
    if (isUserDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isUserDropdownOpen])

  // Handle file uploads
  const handleFileUpload = async (files: File[], supplierId?: string) => {
    try {
      setError(null)
      await actions.uploadFiles(files, supplierId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  // Handle navigation in mobile view
  const handleMobileBack = () => {
    const currentPath = state.viewState.currentPath
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1)
      actions.navigateBreadcrumb(Math.max(0, newPath.length - 1))
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    actions.refresh()
    setError(null)
  }

  // Handle crop information document clicks
  const handleCropDocumentClick = (document: any) => {
    console.log('Opening crop document:', document)
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

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE4D3] dark:from-[#1a1a1a] dark:to-[#0f0f0f]">
      {/* Show full CompaniesSidebar if requested (for Wolthers staff viewing external companies) */}
      {showSidebar && (
        <CompaniesSidebar 
          selectedSection={selectedSection}
          onSectionChange={(section) => {
            setSelectedSection(section)
            onSectionChange?.(section)
          }}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onViewDashboard={onViewDashboard}
          selectedExternalCompany={selectedExternalCompany} // Pass the selected external company
        />
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Header - Fixed at top with glassmorphic effect - only show for external users */}
        {!showSidebar && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border-b border-emerald-700 shadow-lg backdrop-blur-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            {/* Left side - Logo, Company Name, and Navigation */}
            <div className="flex items-center gap-6">
              {/* Back Button for external view (when no sidebar) */}
              {!showSidebar && (
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>
              )}
              
              {/* Wolthers Logo */}
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logos/wolthers-logo-off-white.svg"
                  alt="Wolthers & Associates"
                  width={120}
                  height={32}
                  priority
                  className="h-8 w-auto filter brightness-0 invert"
                />
              </Link>
              
              {/* Company Name/Logo with separator */}
              <div className="flex items-center gap-3">
                <div className="w-px h-6 bg-white/30"></div>
                <div className="flex items-center gap-2">
                  {companyDetails?.logo_url ? (
                    <div className="flex items-center gap-2">
                      <Image
                        src={companyDetails.logo_url}
                        alt={company.fantasy_name || company.name}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded object-contain bg-white/10 p-1"
                      />
                      <span className="text-white font-medium text-sm">
                        {company.fantasy_name || company.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white font-medium text-sm">
                      {company.name}
                    </span>
                  )}
                  
                  {/* Edit button for external admins */}
                  {canEditCompany && (
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="ml-2 p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
                      title="Edit company information"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Navigation, Company Info and User Menu with separator */}
            <div className="flex items-center gap-4">
              {/* Navigation Links */}
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">Trips</span>
              </Link>

              {/* Vertical Separator */}
              <div className="w-px h-8 bg-white/30"></div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || user.email}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-white font-medium text-sm">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-white/70 text-xs">
                      {user?.email}
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-white/70 transition-transform",
                    isUserDropdownOpen && "rotate-180"
                  )} />
                </button>

                {/* User Dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600">
                        Theme
                      </div>
                      <button
                        onClick={() => toggleTheme()}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
                      >
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        {theme === 'dark' ? 'Dark' : 'Light'}
                      </button>
                    </div>
                    
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={signOut}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

                {/* Simple Breadcrumb Navigation for Wolthers users viewing other companies */}
        {showSidebar && breadcrumbContext && (
          <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-900 dark:to-black border-b border-slate-700/50 dark:border-slate-800/50 px-8 py-3 backdrop-blur-sm">
            <nav className="text-sm">
              <span className="font-medium">
                <button 
                  onClick={onNavigateToMain || onBack}
                  className="hover:opacity-75 transition-opacity"
                  style={{ color: '#EBB427' }}
                >
                  {breadcrumbContext.base}
                </button>
                {breadcrumbContext.section && (
                  <>
                    <span style={{ color: '#FDE68A' }}> / </span>
                    <button 
                      onClick={onBack}
                      className="hover:opacity-75 transition-opacity"
                      style={{ color: '#FDE68A' }}
                    >
                      {breadcrumbContext.section}
                    </button>
                  </>
                )}
                {breadcrumbContext.item && (
                  <>
                    <span style={{ color: '#FDE68A' }}> / </span>
                    <span style={{ color: '#FDE68A' }}>{breadcrumbContext.item}</span>
                  </>
                )}
              </span>
            </nav>
          </div>
        )}

        {/* Dashboard Content - Match main dashboard layout exactly */}
        <div className="p-4 space-y-6 sm:p-8 sm:space-y-8">
          {/* Two Column Layout: Balanced Responsive Layout */}
          <div className="flex flex-col 2xl:flex-row gap-6 items-start space-y-6 2xl:space-y-0">

            {/* Left Column: Added 20px to ensure weeks 51-52 are visible */}
            <div
              className="w-full space-y-6 min-w-0"
              style={{ maxWidth: isMobile ? '100%' : '800px' }}
            >
              {/* Enhanced Heatmap - Company-specific data (only show if data exists) */}
              {hasHeatmapData() && (
                <EnhancedHeatmap
                  selectedSection={isWolthersCompany ? 'wolthers' : (company.category === 'buyer' ? 'buyers' : company.category === 'supplier' ? 'suppliers' : 'buyers')}
                  companyId={company.id}
                  companyName={company.fantasy_name || company.name}
                />
              )}
              
              {/* Real Travel Trends - Company-specific data (only show if data exists) */}
              {hasRealTravelTrendsData() && (
                <RealTravelTrends 
                  selectedSection={isWolthersCompany ? 'wolthers' : (company.category === 'buyer' ? 'buyers' : company.category === 'supplier' ? 'suppliers' : 'buyers')}
                  companyId={company.id}
                />
              )}
              
              {/* Company Users */}
              <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] ${isWolthersCompany ? 'p-6' : 'overflow-hidden'}`}>
                {isWolthersCompany ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4">
                      {company.fantasy_name || company.name} Team
                    </h3>
                  </>
                ) : null}
                {isWolthersCompany ? (
                  <div className="space-y-4">
                    {companyContacts?.users?.map((staff: any) => (
                      <div key={staff.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {staff.full_name ? staff.full_name.split(' ').map((n: string) => n[0]).join('') : staff.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {staff.full_name || staff.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {staff.email}
                          </div>
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded">
                          {staff.user_type || 'Staff'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <CompanyUsersManager 
                    companyId={company.id} 
                    companyName={company.fantasy_name || company.name}
                    isWolthers={company.category === 'service_provider'}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Full flexible width to fill remaining space */}
            <div className="w-full 2xl:flex-1 min-w-0 flex flex-col space-y-6">
              {/* Travel Coordination Trends at top (only show if data exists) */}
              {hasTravelTrendsChartData() && (
                <TravelTrendsChart 
                  selectedSection={isWolthersCompany ? 'wolthers' : (company.category === 'buyer' ? 'buyers' : company.category === 'supplier' ? 'suppliers' : 'buyers')}
                  companyId={company.id}
                />
              )}
              
              {/* Document Management System below */}

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

                  {/* Main Document Finder Interface - Same as Wolthers dashboard */}
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
      
      {/* Company Edit Modal */}
      <CompanyEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        company={company}
        onCompanyUpdated={() => {
          // Refresh the company data
          window.location.reload()
        }}
      />
    </div>
  )
}