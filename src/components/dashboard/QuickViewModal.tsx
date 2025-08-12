import React, { useState } from 'react'
import { X, Users, Car, Key, Edit3, Calendar, Settings } from 'lucide-react'
import type { TripCard as TripCardType } from '@/types'
import { getTripProgress, getTripStatus, formatDateRange } from '@/lib/utils'
import { useTripDetails } from '@/hooks/useTrips'

interface QuickViewModalProps {
  trip: TripCardType
  isOpen: boolean
  onClose: () => void
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

export default function QuickViewModal({ trip, isOpen, onClose }: QuickViewModalProps) {
  const [showCopyTooltip, setShowCopyTooltip] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'participants' | 'logistics'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  
  if (!isOpen) return null

  const progress = getTripProgress(trip.startDate, trip.endDate)
  const tripStatus = getTripStatus(trip.startDate, trip.endDate)
  
  // Get real trip details from Supabase
  const { trip: tripDetails, loading: tripLoading, error: tripError } = useTripDetails(trip.id)
  
  // Process itinerary items and meeting notes from real data
  const itineraryItems = tripDetails?.itinerary_items || []
  const meetings = itineraryItems.filter((item: any) => item.activity_type === 'meeting')
  const visits = itineraryItems.filter((item: any) => item.activity_type === 'visit')
  
  // Get meeting notes for meetings
  const meetingsWithNotes = meetings.map((meeting: any) => {
    // Find associated meeting notes - this will be populated by the backend join
    const notes = meeting.meeting_notes || []
    return {
      ...meeting,
      notes: notes
    }
  })
  
  // Group all activities by date for compact display
  const groupedActivities = itineraryItems.reduce((acc: any, item: any) => {
    const date = item.activity_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {})
  
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto border border-pearl-200 dark:border-[#2a2a2a]">
        {/* Header with Title and Edit Toggle */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-3 md:px-6 py-4 relative border-b border-pearl-200 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white dark:text-golden-400">{trip.title}</h2>
              <div className="text-sm text-white/70 dark:text-golden-400/70 font-medium">
                {formatDateRange(trip.startDate, trip.endDate)} | {trip.duration} days
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Edit Toggle */}
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isEditing 
                    ? 'bg-white/20 text-white dark:bg-emerald-800/50 dark:text-golden-400' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white dark:bg-emerald-800/30 dark:text-golden-400/80 dark:hover:bg-emerald-800/50 dark:hover:text-golden-400'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'View Mode' : 'Edit Mode'}</span>
              </button>
              
              <button
                onClick={onClose}
                className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          {isEditing && (
            <div className="flex mt-4 space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: Key },
                { id: 'schedule', label: 'Schedule', icon: Calendar },
                { id: 'participants', label: 'Participants', icon: Users },
                { id: 'logistics', label: 'Logistics', icon: Car }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-emerald-800/80 text-gray-800 dark:text-golden-400'
                        : 'text-white/70 dark:text-golden-400/70 hover:text-white hover:bg-white/10 dark:hover:text-golden-400 dark:hover:bg-emerald-800/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
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

        {/* Content */}
        <div className="p-3 md:p-6 space-y-6">
          {isEditing ? (
            /* Editing Mode - Show Tabs */
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">Trip Overview</h3>
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input 
                          type="text" 
                          defaultValue={trip.title}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea 
                          rows={3}
                          defaultValue={trip.subject}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                          <input 
                            type="date" 
                            defaultValue={new Date(trip.startDate).toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                          <input 
                            type="date" 
                            defaultValue={new Date(trip.endDate).toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2a2a2a] rounded-md hover:bg-gray-200 dark:hover:bg-[#3a3a3a]">Cancel</button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700">Save Changes</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">Schedule & Meetings</h3>
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Schedule editing interface coming soon</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add meetings, visits, and activities by day and time</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'participants' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">Participants</h3>
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Participant management interface coming soon</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Add/remove staff members, guests, and company representatives</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'logistics' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">Logistics</h3>
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
                    <div className="text-center py-8">
                      <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Logistics management interface coming soon</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Manage vehicles, drivers, and transportation arrangements</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* View Mode - Show Regular Content */
            <>
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
              {tripLoading ? (
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
                      {visits.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Visits
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-golden-400">
                      {meetings.length}
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
                      {visits.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Visits
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-golden-400">
                      {meetings.length}
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-3 md:p-6 border-t border-pearl-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111]">
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
              Close
            </button>
            {isEditing ? (
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-emerald-700 text-golden-400 rounded-lg hover:bg-emerald-800 transition-colors"
              >
                Done Editing
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