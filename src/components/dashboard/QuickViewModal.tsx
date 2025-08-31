import React, { useState, useCallback, useEffect } from 'react'
import { X, Users, Car, Key, Edit3, Calendar, Settings, FileText, DollarSign, Save, AlertCircle, RefreshCw } from 'lucide-react'
import type { TripCard as TripCardType } from '@/types'
import { getTripProgress, getTripStatus, formatDateRange, calculateDuration } from '@/lib/utils'
import { useTripDetails } from '@/hooks/useTrips'
import { useActivityManager } from '@/hooks/useActivityManager'
import { useEnhancedModal } from '@/hooks/useEnhancedModal'
import { EnhancedTabNavigation } from './EnhancedTabNavigation'
import { OverviewTab } from './tabs/OverviewTab'
import { ParticipantsSection } from '@/components/participants'
import { LogisticsTab } from './tabs/LogisticsTab'
import { ScheduleTab } from './tabs/ScheduleTab'
import { DocumentsTab } from './tabs/DocumentsTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import type { EnhancedModalTab, EnhancedModalState, SaveStatus } from '@/types/enhanced-modal'

interface QuickViewModalProps {
  trip: TripCardType
  isOpen: boolean
  onClose: () => void
  onSave?: (tripData: any) => Promise<void>
  readOnly?: boolean
}

// Mock destination companies data based on real Wolthers trips
const getDestinationCompanies = (tripId: string) => {
  const destinationData: Record<string, Array<{date: string, location: string, company: string, keyHosts: string}>> = {
    '1': [ // Brazil Coffee Farm Tour
      { date: 'Jul 29', location: 'Santos', company: 'Unicafé', keyHosts: 'Fabio Mattos' },
      { date: 'Jul 29', location: 'Santos', company: 'Comexim', keyHosts: 'Maurício Dicunto' },
      { date: 'Jul 30', location: 'Varginha', company: 'Brascof', keyHosts: 'Wilian, Thiago' },
      { date: 'Jul 30', location: 'Varginha', company: 'Minasul', keyHosts: 'Caroline Nery' },
      { date: 'Jul 30', location: 'Varginha', company: 'Cocatrel', keyHosts: 'Gabriel Miari' },
      { date: 'Aug 1', location: 'Poços de Caldas', company: 'Exp. Bourbon', keyHosts: 'Icaro Carneiro' },
      { date: 'Aug 2', location: 'Carmo do Paranaiba', company: 'Veloso Farm', keyHosts: 'Paulo Veloso Junior' }
    ],
    '2': [ // European Coffee Summit
      { date: 'Jul 30', location: 'Copenhagen', company: 'Nordic Coffee Roasters', keyHosts: 'Hansen, Nielsen' },
      { date: 'Jul 30', location: 'Copenhagen', company: 'Coffee Collective', keyHosts: 'Peter Dupont' },
      { date: 'Aug 2', location: 'Stockholm', company: 'Löfbergs', keyHosts: 'Erik Lundberg' },
      { date: 'Aug 4', location: 'Oslo', company: 'Solberg & Hansen', keyHosts: 'Magnus Solberg' }
    ],
    '3': [ // Colombia Coffee Expo
      { date: 'Aug 8', location: 'Bogotá', company: 'FNC', keyHosts: 'Carlos Rodriguez' },
      { date: 'Aug 10', location: 'Medellín', company: 'Pergamino Café', keyHosts: 'Alejandro Cadena' },
      { date: 'Aug 11', location: 'Manizales', company: 'Coocentral', keyHosts: 'Maria Gonzalez' }
    ],
    '4': [ // Guatemala Highland Visit
      { date: 'Aug 18', location: 'Antigua', company: 'Finca El Injerto', keyHosts: 'Arturo Aguirre' },
      { date: 'Aug 20', location: 'Huehuetenango', company: 'La Morelia', keyHosts: 'Pedro Echeverría' },
      { date: 'Aug 21', location: 'Cobán', company: 'Finca Santa Isabel', keyHosts: 'Roberto Dalton' }
    ],
    '5': [ // NCA Convention 2025
      { date: 'Sep 15', location: 'New Orleans', company: 'Community Coffee', keyHosts: 'Matt Saurage' },
      { date: 'Sep 16', location: 'New Orleans', company: 'French Truck Coffee', keyHosts: 'Sean O\'Connor' },
      { date: 'Sep 18', location: 'New Orleans', company: 'Addiction Coffee', keyHosts: 'John Smith' }
    ],
    '6': [ // Swiss Coffee Dinner 2025
      { date: 'Jun 10', location: 'Zurich', company: 'Cafés Richard', keyHosts: 'Klaus Weber' },
      { date: 'Jun 11', location: 'Geneva', company: 'Boissons du Monde', keyHosts: 'Pierre Dubois' }
    ],
    '7': [ // Kenya Coffee Origin Tour
      { date: 'May 5', location: 'Nairobi', company: 'Dormans Coffee', keyHosts: 'Samuel Kimani' },
      { date: 'May 7', location: 'Nyeri', company: 'Barichu Cooperative', keyHosts: 'Grace Wanjiku' },
      { date: 'May 9', location: 'Kirinyaga', company: 'New Ngariama Cooperative', keyHosts: 'Peter Mwangi' }
    ],
    '8': [ // Vietnam Coffee Industry Summit
      { date: 'Apr 20', location: 'Ho Chi Minh City', company: 'Trung Nguyên', keyHosts: 'Nguyen Van Duc' },
      { date: 'Apr 22', location: 'Buon Ma Thuot', company: 'Highland Coffee', keyHosts: 'Tran Minh Hai' },
      { date: 'Apr 23', location: 'Da Lat', company: 'K\'Coffee', keyHosts: 'Le Thi Lan' }
    ]
  }
  
  return destinationData[tripId] || []
}

// Helper function to group destinations by location and date
const groupDestinationsByLocation = (destinations: Array<{date: string, location: string, company: string, keyHosts: string}>) => {
  const locationGroups = new Map<string, Array<{date: string, company: string, keyHosts: string}>>()
  
  // First, group by location
  destinations.forEach(dest => {
    if (!locationGroups.has(dest.location)) {
      locationGroups.set(dest.location, [])
    }
    locationGroups.get(dest.location)!.push({
      date: dest.date,
      company: dest.company,
      keyHosts: dest.keyHosts
    })
  })
  
  // Then, create grouped results with date ranges
  const grouped: Array<{dateRange: string, location: string, companies: Array<{company: string, keyHosts: string}>}> = []
  
  locationGroups.forEach((visits, location) => {
    const uniqueDates = Array.from(new Set(visits.map(v => v.date))).sort()
    const allCompanies = visits.map(v => ({ company: v.company, keyHosts: v.keyHosts }))
    
    let dateRange: string
    if (uniqueDates.length === 1) {
      dateRange = uniqueDates[0]
    } else {
      // Create date range like "28-29 Jul"
      const firstDate = uniqueDates[0]
      const lastDate = uniqueDates[uniqueDates.length - 1]
      
      // Extract day numbers and month
      const firstDay = firstDate.split(' ')[1] // "29" from "Jul 29"
      const lastDay = lastDate.split(' ')[1]   // "30" from "Jul 30"
      const month = firstDate.split(' ')[0]    // "Jul" from "Jul 29"
      
      if (firstDay && lastDay && month) {
        dateRange = `${firstDay}-${lastDay} ${month}`
      } else {
        dateRange = `${firstDate}-${lastDate}`
      }
    }
    
    grouped.push({
      dateRange,
      location,
      companies: allCompanies
    })
  })
  
  return grouped
}

export default function QuickViewModal({ trip, isOpen, onClose, onSave, readOnly = false }: QuickViewModalProps) {
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)
  const [localTrip, setLocalTrip] = useState<TripCardType>(trip)
  const [liveParticipantStats, setLiveParticipantStats] = useState({ 
    total: trip.wolthersStaff.length, 
    staff: trip.wolthersStaff.length, 
    guests: trip.guests.length,
    staffMembers: trip.wolthersStaff.map(staff => ({ id: staff.id, fullName: staff.fullName })),
    guestMembers: trip.guests.map(guest => ({ id: guest.id, fullName: guest.name }))
  })
  
  // Enhanced modal state management
  const {
    modalState,
    formData,
    setActiveTab,
    setEditingMode,
    updateFormData,
    saveFormData,
    hasUnsavedChanges,
    validationErrors,
    isAutoSaving
  } = useEnhancedModal(localTrip, { onSave, autoSaveEnabled: true })
  
  // Update localTrip.wolthersStaff when live participant data changes
  React.useEffect(() => {
    setLocalTrip(prev => ({
      ...prev,
      wolthersStaff: liveParticipantStats.staffMembers.map(staff => ({
        id: staff.id,
        fullName: staff.fullName,
        email: '', // We don't have email in the live data, but it's needed for the type
        role: 'staff' as any
      }))
    }))
  }, [liveParticipantStats.staffMembers])

  // Handle form data updates that affect the trip object
  const handleTripUpdate = useCallback((tab: string, updates: any) => {
    updateFormData(tab as any, updates)
    
    // If trip dates are being updated, update local trip state
    if (updates.trip && (updates.trip.startDate || updates.trip.endDate)) {
      setLocalTrip(prev => ({
        ...prev,
        startDate: updates.trip.startDate || prev.startDate,
        endDate: updates.trip.endDate || prev.endDate
      }))
    }
  }, [updateFormData])
  
  // Keep localTrip in sync with prop changes
  useEffect(() => {
    setLocalTrip(trip)
  }, [trip])
  
  const { activeTab, editingMode } = modalState
  const isEditing = editingMode === 'edit'
  
  // Handle mode switching with save prompt
  const handleModeSwitch = useCallback(() => {
    if (isEditing && hasUnsavedChanges) {
      // Ask user if they want to save changes before switching to view mode
      const shouldSave = window.confirm(
        "You have unsaved changes. Do you want to save them before switching to view mode?"
      )
      
      if (shouldSave) {
        // Save and then switch to view mode
        saveFormData().then(() => {
          setEditingMode('view')
        }).catch(() => {
          // If save fails, stay in edit mode
          console.error('Failed to save changes')
        })
      } else {
        // Switch without saving
        setEditingMode('view')
      }
    } else {
      // No unsaved changes, just switch mode
      setEditingMode(isEditing ? 'view' : 'edit')
    }
  }, [isEditing, hasUnsavedChanges, saveFormData, setEditingMode])
  
  if (!isOpen) return null

  const progress = getTripProgress(localTrip.startDate, localTrip.endDate)
  const tripStatus = getTripStatus(localTrip.startDate, localTrip.endDate)
  
  // Get real trip details from Supabase
  const { trip: tripDetails, loading: tripLoading, error: tripError } = useTripDetails(localTrip.id)
  
  // Get activity data using the activity manager
  const { getActivityStats, getActivitiesByDate, loading: activitiesLoading } = useActivityManager(localTrip.id || '')
  
  // Get activity statistics for visits and meetings count
  const activityStats = getActivityStats()
  
  // Use the new activity manager to get grouped activities
  const groupedActivities = getActivitiesByDate()
  
  // Sort activities within each day by time
  Object.keys(groupedActivities).forEach(date => {
    groupedActivities[date].sort((a: any, b: any) => {
      const timeA = a.start_time || '00:00:00'
      const timeB = b.start_time || '00:00:00'
      return timeA.localeCompare(timeB)
    })
  })
  
  // Sort dates
  const sortedDates = Object.keys(groupedActivities).sort()

  const handleCopyAccessCode = async () => {
    if (!localTrip.accessCode) return
    try {
      await navigator.clipboard.writeText(localTrip.accessCode)
      setShowCopyTooltip(true)
      setTimeout(() => setShowCopyTooltip(false), 2000)
    } catch (err) {
      console.error('Failed to copy access code:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = localTrip.accessCode || ''
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShowCopyTooltip(true)
      setTimeout(() => setShowCopyTooltip(false), 2000)
    }
  }

  // Calculate flexible width based on trip duration for schedule mode
  const getScheduleWidth = () => {
    if (!isEditing || activeTab !== 'schedule') return 'w-full h-full sm:max-w-5xl sm:max-h-[90vh]'
    
    const days = calculateDuration(localTrip.startDate, localTrip.endDate)
    
    // Mobile: always full width
    // Desktop: scale based on days but respect maximum, accounting for + button padding
    let widthClass = ''
    if (days <= 2) {
      widthClass = 'max-w-4xl lg:max-w-5xl' // Slightly larger for padding accommodation
    } else if (days <= 3) {
      widthClass = 'max-w-5xl lg:max-w-6xl' // Increased for current 3-day optimal size + padding
    } else if (days <= 5) {
      widthClass = 'max-w-6xl lg:max-w-7xl' // Medium for 4-5 days + padding
    } else if (days <= 7) {
      widthClass = 'max-w-7xl lg:max-w-[88vw]' // Large for 6-7 days + padding
    } else {
      widthClass = 'max-w-[92vw]' // Maximum for 8+ days + padding
    }
    
    return `w-full h-full sm:h-[95vh] ${widthClass}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-start md:items-center justify-center z-50 p-0 sm:p-2 md:p-4 overflow-y-auto">
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl border border-pearl-200 dark:border-[#2a2a2a] flex flex-col ${
        getScheduleWidth()
      }`}>
        {/* Header with Title and Edit Toggle */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-3 md:px-6 py-4 relative border-b border-pearl-200 dark:border-[#0a2e21] rounded-t-xl">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#006D5B] dark:text-golden-400">{localTrip.title}</h2>
              <div className="text-sm text-[#333333] dark:text-golden-400/70 font-medium">
                {formatDateRange(localTrip.startDate, localTrip.endDate)} | {calculateDuration(localTrip.startDate, localTrip.endDate)} days
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Edit Toggle */}
              {!readOnly && (
                <button
                  onClick={handleModeSwitch}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isEditing 
                      ? 'bg-[#009B77] text-white hover:bg-[#008066] dark:bg-emerald-800/50 dark:text-golden-400' 
                      : 'bg-white/10 text-[#333333] hover:bg-white/20 hover:text-[#006D5B] dark:bg-emerald-800/30 dark:text-golden-400/80 dark:hover:bg-emerald-800/50 dark:hover:text-golden-400'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditing ? 'View Mode' : 'Edit Mode'}</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="text-[#009B77] dark:text-golden-400 hover:text-[#006D5B] dark:hover:text-golden-300 transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Enhanced Tab Navigation - Always shown */}
          <EnhancedTabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            validationState={modalState.validationState}
            saveStatus={modalState.saveStatus}
            className="mt-4"
          />
        </div>

        {/* Progress Bar */}
        {tripStatus === 'ongoing' && (
          <div className="h-6 relative overflow-hidden bg-emerald-900 dark:bg-[#111111]">
            <div 
              className="absolute left-0 top-0 h-full transition-all duration-700 shadow-sm bg-emerald-700 dark:bg-[#123d32]"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-white z-10">
                {progress}% COMPLETE
              </span>
            </div>
          </div>
        )}

        {/* Trip Description */}
        <div className="px-3 md:px-6 py-4 bg-gray-50 dark:bg-[#111111] border-b border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {localTrip.subject}
          </p>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-hidden">
          {/* Tabbed Interface - Always shown */}
          <div className="h-full flex flex-col">
            {/* Auto-save Status Bar - Only in edit mode */}
            {isEditing && (hasUnsavedChanges || isAutoSaving) && (
              <div className="px-3 md:px-6 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isAutoSaving ? (
                      <>
                        <div className="animate-spin h-3 w-3 border border-amber-500 border-t-transparent rounded-full"></div>
                        <span className="text-xs text-amber-700 dark:text-amber-300">Auto-saving changes...</span>
                      </>
                    ) : hasUnsavedChanges ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-amber-700 dark:text-amber-300">Unsaved changes</span>
                      </>
                    ) : null}
                  </div>
                  {modalState.lastSaved && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Last saved: {modalState.lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 touch-pan-y" ref={(el) => {
              // Auto-scroll to top when Schedule tab becomes active
              if (activeTab === 'schedule' && el) {
                el.scrollTop = 0
              }
            }}>
              {activeTab === 'overview' && (
                <OverviewTab 
                  trip={localTrip} 
                  tripDetails={tripDetails}
                  onUpdate={handleTripUpdate}
                  validationState={modalState.validationState.overview}
                  liveParticipantStats={liveParticipantStats}
                  mode={editingMode}
                  activityStats={getActivityStats()}
                  groupedActivities={groupedActivities}
                  activitiesLoading={activitiesLoading}
                  tripError={tripError}
                  sortedDates={sortedDates}
                />
              )}
              
              {activeTab === 'schedule' && (
                <ScheduleTab 
                  trip={localTrip}
                  tripDetails={tripDetails}
                  onUpdate={handleTripUpdate}
                  validationState={modalState.validationState.schedule}
                  mode={editingMode}
                />
              )}
              
              {activeTab === 'participants' && (
                <ParticipantsSection 
                  tripId={localTrip.id}
                  tripDateRange={{ 
                    start: localTrip.startDate instanceof Date ? localTrip.startDate.toISOString().split('T')[0] : localTrip.startDate, 
                    end: localTrip.endDate instanceof Date ? localTrip.endDate.toISOString().split('T')[0] : localTrip.endDate 
                  }}
                  onParticipantStatsChange={setLiveParticipantStats}
                  mode={editingMode}
                />
              )}
              
              {activeTab === 'logistics' && (
                <LogisticsTab 
                  trip={localTrip}
                  tripDetails={tripDetails}
                  onUpdate={handleTripUpdate}
                  validationState={modalState.validationState.logistics}
                  mode={editingMode}
                />
              )}
              
              {activeTab === 'documents' && (
                <DocumentsTab 
                  trip={localTrip}
                  tripDetails={tripDetails}
                  onUpdate={handleTripUpdate}
                  validationState={modalState.validationState.documents}
                  mode={editingMode}
                />
              )}
              
              {activeTab === 'expenses' && (
                <ExpensesTab 
                  trip={localTrip}
                  tripDetails={tripDetails}
                  onUpdate={handleTripUpdate}
                  validationState={modalState.validationState.expenses}
                  mode={editingMode}
                />
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="flex justify-between items-center p-3 md:p-6 border-t border-pearl-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111] flex-shrink-0 rounded-b-xl">
          {/* Left side - Access Code */}
          {trip.accessCode && (
            <div className="relative">
              <button
                onClick={handleCopyAccessCode}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
                title={`Copy access code: ${trip.accessCode}`}
              >
                <Key className="w-4 h-4" />
                <span className="text-sm font-mono">{trip.accessCode}</span>
              </button>
              {showCopyTooltip && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                  Trip code copied!
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          )}
          
          {/* Right side - Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              {hasUnsavedChanges && isEditing ? 'Close (Unsaved)' : 'Close'}
            </button>
            {isEditing ? (
              <div className="flex space-x-3">
                {hasUnsavedChanges && (
                  <button
                    onClick={saveFormData}
                    disabled={modalState.saveStatus.isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-emerald-700 text-golden-400 rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50"
                  >
                    {modalState.saveStatus.isSaving ? (
                      <div className="animate-spin h-4 w-4 border border-golden-400 border-t-transparent rounded-full"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{modalState.saveStatus.isSaving ? 'Saving...' : 'Save Now'}</span>
                  </button>
                )}
                <button
                  onClick={handleModeSwitch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {hasUnsavedChanges ? 'Discard & Exit' : 'Done Editing'}
                </button>
              </div>
            ) : !readOnly ? (
              <button
                onClick={() => window.location.href = `/trips/${trip.accessCode || trip.id}`}
                className="px-4 py-2 bg-emerald-700 text-golden-400 rounded-lg hover:bg-emerald-800 transition-colors"
              >
                View Details
              </button>
            ) : (
              <button
                onClick={() => window.location.href = `/trips/${trip.accessCode || trip.id}`}
                className="px-4 py-2 bg-emerald-700 text-golden-400 rounded-lg hover:bg-emerald-800 transition-colors"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}