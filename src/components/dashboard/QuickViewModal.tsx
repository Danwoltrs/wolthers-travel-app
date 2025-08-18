import React, { useState, useCallback, useEffect } from 'react'
import { X, Users, Car, Key, Edit3, Calendar, Settings, FileText, DollarSign, Save, AlertCircle, RefreshCw } from 'lucide-react'
import type { TripCard as TripCardType } from '@/types'
import { getTripProgress, getTripStatus, formatDateRange } from '@/lib/utils'
import { useTripDetails } from '@/hooks/useTrips'
import { useActivityManager } from '@/hooks/useActivityManager'
import { useEnhancedModal } from '@/hooks/useEnhancedModal'
import { EnhancedTabNavigation } from './EnhancedTabNavigation'
import { OverviewTab } from './tabs/OverviewTab'
import { ParticipantsTab } from './tabs/ParticipantsTab'
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
  
  // Enhanced modal state management
  const {
    modalState,
    setActiveTab,
    setEditingMode,
    updateFormData,
    saveFormData,
    hasUnsavedChanges,
    validationErrors,
    isAutoSaving
  } = useEnhancedModal(trip, { onSave, autoSaveEnabled: true })
  
  const { activeTab, editingMode } = modalState
  const isEditing = editingMode === 'edit'
  
  if (!isOpen) return null

  const progress = getTripProgress(trip.startDate, trip.endDate)
  const tripStatus = getTripStatus(trip.startDate, trip.endDate)
  
  // Get real trip details from Supabase
  const { trip: tripDetails, loading: tripLoading, error: tripError } = useTripDetails(trip.id)
  
  // Get activity data using the activity manager
  const { getActivityStats, getActivitiesByDate, loading: activitiesLoading } = useActivityManager(trip.id || '')
  
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
    if (!trip.accessCode) return
    try {
      await navigator.clipboard.writeText(trip.accessCode)
      setShowCopyTooltip(true)
      setTimeout(() => setShowCopyTooltip(false), 2000)
    } catch (err) {
      console.error('Failed to copy access code:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = trip.accessCode || ''
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
    if (!isEditing || activeTab !== 'schedule') return 'max-w-5xl w-full max-h-[90vh]'
    
    const days = trip.duration || 3
    
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
    
    return `w-full ${widthClass} h-[95vh]`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-2 md:p-4">
      <div className={`bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] flex flex-col ${
        getScheduleWidth()
      }`}>
        {/* Header with Title and Edit Toggle */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-3 md:px-6 py-4 relative border-b border-pearl-200 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-emerald-700 dark:text-golden-400">{trip.title}</h2>
              <div className="text-sm text-white/70 dark:text-golden-400/70 font-medium">
                {formatDateRange(trip.startDate, trip.endDate)} | {trip.duration} days
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Sync Calendar Button - Only show in Schedule tab editing mode */}
              {isEditing && activeTab === 'schedule' && (
                <button
                  onClick={() => {
                    // Call the sync function from ScheduleTab
                    if ((window as any).scheduleTabSyncCalendar) {
                      (window as any).scheduleTabSyncCalendar()
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-white/20 text-emerald-700 hover:bg-white/30 hover:text-emerald-600 dark:bg-emerald-800/50 dark:text-golden-400 dark:hover:bg-emerald-800/70"
                  title="Refresh calendar to sync latest changes"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Calendar</span>
                </button>
              )}
              
              {/* Edit Toggle */}
              {!readOnly && (
                <button
                  onClick={() => setEditingMode(isEditing ? 'view' : 'edit')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isEditing 
                      ? 'bg-white/20 text-emerald-700 hover:text-emerald-600 dark:bg-emerald-800/50 dark:text-golden-400' 
                      : 'bg-white/10 text-emerald-700/80 hover:bg-white/20 hover:text-emerald-700 dark:bg-emerald-800/30 dark:text-golden-400/80 dark:hover:bg-emerald-800/50 dark:hover:text-golden-400'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditing ? 'View Mode' : 'Edit Mode'}</span>
                </button>
              )}
              
              <button
                onClick={onClose}
                className="text-emerald-700 dark:text-golden-400 hover:text-emerald-600 dark:hover:text-golden-300 transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Enhanced Tab Navigation */}
          {isEditing && (
            <EnhancedTabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              validationState={modalState.validationState}
              saveStatus={modalState.saveStatus}
              className="mt-4"
            />
          )}
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
            {trip.subject}
          </p>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            /* Editing Mode - Enhanced Tabs */
            <div className="h-full flex flex-col">
              {/* Auto-save Status Bar */}
              {(hasUnsavedChanges || isAutoSaving) && (
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
              <div className="flex-1 overflow-y-auto p-3 md:p-6" ref={(el) => {
                // Auto-scroll to top when Schedule tab becomes active
                if (activeTab === 'schedule' && el) {
                  el.scrollTop = 0
                }
              }}>
                {activeTab === 'overview' && (
                  <OverviewTab 
                    trip={trip} 
                    tripDetails={tripDetails}
                    onUpdate={updateFormData}
                    validationState={modalState.validationState.overview}
                  />
                )}
                
                {activeTab === 'schedule' && (
                  <ScheduleTab 
                    trip={trip}
                    tripDetails={tripDetails}
                    onUpdate={updateFormData}
                    validationState={modalState.validationState.schedule}
                  />
                )}
                
                {activeTab === 'participants' && (
                  <ParticipantsTab 
                    trip={trip}
                    tripDetails={tripDetails}
                    onUpdate={updateFormData}
                    validationState={modalState.validationState.participants}
                  />
                )}
                
                {activeTab === 'logistics' && (
                  <LogisticsTab 
                    trip={trip}
                    tripDetails={tripDetails}
                    onUpdate={updateFormData}
                    validationState={modalState.validationState.logistics}
                  />
                )}
                
                {activeTab === 'documents' && (
                  <DocumentsTab 
                    trip={trip}
                    tripDetails={tripDetails}
                    onUpdate={updateFormData}
                    validationState={modalState.validationState.documents}
                  />
                )}
                
                {activeTab === 'expenses' && (
                  <ExpensesTab 
                    trip={trip}
                    tripDetails={tripDetails}
                    onUpdate={updateFormData}
                    validationState={modalState.validationState.expenses}
                  />
                )}
              </div>
            </div>
          ) : (
            /* View Mode - Show Regular Content */
            <div className="overflow-y-auto p-3 md:p-6 space-y-6">
              {/* Dynamic Layout - Companies and Staff */}
              <div className="space-y-4">
                {/* Mobile: Simple text layout */}
                <div className="md:hidden">
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {/* Guest Companies */}
                    {trip.client.length > 0 && (
                      <span>
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {trip.client.map(company => company.fantasyName || company.name).join(', ')}:
                        </span>
                        {' '}
                        {trip.guests.map(guestGroup => guestGroup.names.join(', ')).join(', ')}
                      </span>
                    )}
                    
                    {/* Wolthers Staff */}
                    {trip.wolthersStaff.length > 0 && (
                      <>
                        {trip.client.length > 0 && ' | '}
                        <span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">Wolthers staff:</span>
                          {' '}
                          {trip.wolthersStaff.map(staff => staff.fullName).join(', ')}
                        </span>
                      </>
                    )}
                    
                    {/* Vehicles */}
                    {trip.vehicles.length > 0 && (
                      <>
                        {(trip.client.length > 0 || trip.wolthersStaff.length > 0) && ' | '}
                        <span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">Vehicles:</span>
                          {' '}
                          {trip.vehicles.map(vehicle => `${vehicle.make} ${vehicle.model}`).join(', ')}
                        </span>
                      </>
                    )}
                    
                    {/* Drivers */}
                    {trip.drivers.length > 0 && (
                      <>
                        {(trip.client.length > 0 || trip.wolthersStaff.length > 0 || trip.vehicles.length > 0) && ' | '}
                        <span>
                          <span className="font-medium text-gray-900 dark:text-gray-200">Drivers:</span>
                          {' '}
                          {trip.drivers.map(driver => driver.fullName).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Desktop: Flexible Card Layout */}
                <div className="hidden md:block">
                  <div className="flex flex-wrap gap-4">
                    {/* Company Cards - Flexible sizing */}
                    {trip.client.map((company) => {
                      const companyGuests = trip.guests.find(g => g.companyId === company.id)
                      return (
                        <div key={company.id} className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-pearl-200 dark:border-[#2a2a2a] flex-1 min-w-[200px]">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                            {company.fantasyName || company.name}
                          </h4>
                          {companyGuests && (
                            <div className="space-y-1">
                              {companyGuests.names.map((name, index) => (
                                <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                  {name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Combined Wolthers Staff, Vehicles & Drivers Card */}
                    {(trip.wolthersStaff.length > 0 || trip.vehicles.length > 0 || trip.drivers.length > 0) && (
                      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-pearl-200 dark:border-[#2a2a2a] flex-[2] min-w-[400px]">
                        <div className="grid grid-cols-3 gap-6 divide-x divide-gray-200 dark:divide-[#2a2a2a]">
                          {/* Wolthers Staff */}
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                              Wolthers Staff
                            </h4>
                            {trip.wolthersStaff.length > 0 ? (
                              <div className="space-y-1">
                                {trip.wolthersStaff.map((staff) => (
                                  <div key={staff.id} className="text-sm text-gray-700 dark:text-gray-300">
                                    {staff.fullName}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No staff
                              </div>
                            )}
                          </div>
                          
                          {/* Vehicles */}
                          <div className="pl-6">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                              Vehicles
                            </h4>
                            {trip.vehicles.length > 0 ? (
                              <div className="space-y-1">
                                {trip.vehicles.map((vehicle) => (
                                  <div key={vehicle.id} className="text-sm text-gray-700 dark:text-gray-300">
                                    {vehicle.make} {vehicle.model}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No vehicles
                              </div>
                            )}
                          </div>
                          
                          {/* Drivers */}
                          <div className="pl-6">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                              Drivers
                            </h4>
                            {trip.drivers.length > 0 ? (
                              <div className="space-y-1">
                                {trip.drivers.map((driver) => (
                                  <div key={driver.id} className="text-sm text-gray-700 dark:text-gray-300">
                                    {driver.fullName}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                No drivers
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Separator Line */}
                <div className="border-t border-gray-200 dark:border-[#2a2a2a]"></div>
              </div>

              {/* Meetings & Visits */}
              {(tripLoading || activitiesLoading) ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading meeting details...</div>
                </div>
              ) : tripError ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
                  <div className="text-sm text-red-500">Error loading meeting details</div>
                </div>
              ) : sortedDates.length === 0 ? (
                <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">No activities scheduled yet</div>
                </div>
              ) : (
            <>
              {/* Small screens: Full width list layout */}
              <div className="block sm:hidden space-y-3">
                {sortedDates.map((date, dayIndex) => {
                  const dayActivities = groupedActivities[date]
                  const dayDate = new Date(date)
                  
                  return (
                    <div key={date}>
                      {/* Day Header - Full Width */}
                      <div className="bg-emerald-800 dark:bg-emerald-900 text-golden-400 px-3 py-3 -mx-3">
                        <h3 className="font-medium text-sm">
                          Day {dayIndex + 1} - {dayDate.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </h3>
                      </div>
                      
                      {/* Activities - Full Width */}
                      <div className="-mx-3">
                        {dayActivities.map((item: any, itemIndex: number) => {
                          const startTime = item.start_time ? item.start_time.slice(0, 5) : ''
                          const isEven = itemIndex % 2 === 0
                          
                          return (
                            <div 
                              key={item.id} 
                              className={`px-3 py-3 ${
                                isEven 
                                  ? 'bg-gray-50 dark:bg-[#1a1a1a]' 
                                  : 'bg-gray-100 dark:bg-[#242424]'
                              }`}
                            >
                              <div className="flex gap-3">
                                <span className="text-gray-500 dark:text-gray-400 font-mono text-xs min-w-[2.5rem]">
                                  {startTime}
                                </span>
                                <span className="text-gray-400 text-xs">-</span>
                                <div className="flex-1">
                                  <p className="text-gray-900 dark:text-gray-200 text-sm font-medium leading-tight">
                                    {item.title}
                                  </p>
                                  {item.host && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Host: {item.host}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop: Table layout */}
              <div className="hidden sm:block bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
                <div className="space-y-0">
                  {sortedDates.map((date, dayIndex) => {
                    const dayActivities = groupedActivities[date]
                    const dayDate = new Date(date)
                    
                    return (
                      <div key={date} className="border-b border-gray-200 dark:border-[#2a2a2a] last:border-b-0">
                        {/* Day Header - Centered */}
                        <div className="px-4 py-2 bg-emerald-800 dark:bg-emerald-900 text-center">
                          <div className="text-sm font-medium text-golden-400">
                            Day {dayIndex + 1} - {dayDate.toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        
                        {/* Activities for the Day */}
                        <div className="px-4 py-4 space-y-3">
                          {dayActivities.map((item: any, itemIndex: number) => {
                            const startTime = item.start_time ? item.start_time.slice(0, 5) : ''
                            const endTime = item.end_time ? item.end_time.slice(0, 5) : ''
                            const timeRange = startTime && endTime ? `${startTime}-${endTime}` : startTime
                            
                            return (
                              <div key={item.id} className="grid grid-cols-12 gap-4 items-start text-sm">
                                {/* Time */}
                                <div className="col-span-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
                                  {timeRange}
                                </div>
                                
                                {/* Activity */}
                                <div className="col-span-10">
                                  <div className="flex items-center gap-2">
                                    {item.is_confirmed && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                    )}
                                    <span className="text-gray-900 dark:text-gray-200 font-medium">
                                      {item.title}
                                    </span>
                                  </div>
                                  {item.host && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Host: {item.host}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 px-4 py-6 border-t border-gray-200 dark:border-[#2a2a2a]">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                      {activityStats.visits}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Visits
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                      {activityStats.meetings}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Meetings
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                      {trip.duration}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Days
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                      {trip.notesCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Notes
                    </div>
                  </div>
                </div>
              </div>

              {/* Small screens: Summary Stats */}
              <div className="block sm:hidden bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] mt-4 p-4">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                      {activityStats.visits}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Visits
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                      {activityStats.meetings}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Meetings
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                      {trip.duration}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Days
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                      {trip.notesCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Notes
                    </div>
                  </div>
                </div>
              </div>
            </>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="flex justify-between items-center p-3 md:p-6 border-t border-pearl-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111] flex-shrink-0">
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
                  onClick={() => {
                    if (hasUnsavedChanges && !confirm('You have unsaved changes. Are you sure you want to exit editing mode?')) {
                      return
                    }
                    setEditingMode('view')
                  }}
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