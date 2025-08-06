import React from 'react'
import { X, Users, Car, Key } from 'lucide-react'
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
    try {
      await navigator.clipboard.writeText(trip.accessCode)
      // You could add a toast notification here
      console.log('Access code copied:', trip.accessCode)
    } catch (err) {
      console.error('Failed to copy access code:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = trip.accessCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-pearl-200 dark:border-[#2a2a2a]">
        {/* Header with Title */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 relative flex items-center justify-between border-b border-pearl-200 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between w-full mr-4">
            <h2 className="text-xl font-bold text-white dark:text-golden-400">{trip.title}</h2>
            <div className="text-right">
              <div className="text-sm text-white dark:text-golden-400 font-medium">
                {formatDateRange(trip.startDate, trip.endDate)} | {trip.duration} days
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
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
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#111111] border-b border-gray-200 dark:border-[#2a2a2a]">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {trip.subject}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Companies Visiting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trip.client.map((company) => {
                const companyGuests = trip.guests.find(g => g.companyId === company.id)
                return (
                  <div key={company.id} className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-pearl-200 dark:border-[#2a2a2a]">
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
          </div>

          {/* Wolthers Staff & Fleet/Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wolthers Staff Card */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-pearl-200 dark:border-[#2a2a2a]">
                <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                  Wolthers Staff
                </h4>
                <div className="space-y-1">
                  {trip.wolthersStaff.map((staff) => (
                    <div key={staff.id} className="text-sm text-gray-700 dark:text-gray-300">
                      {staff.fullName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fleet & Drivers Card */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-pearl-200 dark:border-[#2a2a2a]">
                <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-3">
                  Fleet & Drivers
                </h4>
                
                {trip.vehicles.length === 0 && trip.drivers.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No vehicles or drivers assigned
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Vehicles - Left Side */}
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2 block">
                        Vehicles
                      </span>
                      <div className="space-y-1">
                        {trip.vehicles.length > 0 ? (
                          trip.vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="text-sm text-gray-700 dark:text-gray-300">
                              {vehicle.make} {vehicle.model}
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No vehicles
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Vertical divider */}
                    <div className="border-l border-gray-200 dark:border-[#2a2a2a] pl-4">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2 block">
                        Drivers
                      </span>
                      <div className="space-y-1">
                        {trip.drivers.length > 0 ? (
                          trip.drivers.map((driver) => (
                            <div key={driver.id} className="text-sm text-gray-700 dark:text-gray-300">
                              {driver.fullName}
                            </div>
                          ))
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

          {/* Divider Line */}
          <div className="border-t border-gray-200 dark:border-[#2a2a2a] my-6"></div>

          {/* Meetings & Visits Table */}
          {tripLoading ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading meeting details...</div>
            </div>
          ) : tripError ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
              <div className="text-sm text-red-500">Error loading meeting details</div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-[#2a2a2a]">
                <div className="col-span-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Date</div>
                <div className="col-span-10 text-sm font-semibold text-gray-700 dark:text-gray-300">Daily Activities</div>
              </div>
              
              {/* Table Rows - One per Day */}
              <div className="divide-y divide-gray-200 dark:divide-[#2a2a2a]">
                {sortedDates.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No activities scheduled yet
                  </div>
                ) : (
                  sortedDates.map((date, dayIndex) => {
                    const isOdd = dayIndex % 2 === 0
                    const dayActivities = groupedActivities[date]
                    const dayDate = new Date(date)
                    const formattedDate = dayDate.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric' 
                    })
                    
                    return (
                      <div 
                        key={date}
                        className={`grid grid-cols-12 gap-4 px-4 py-4 ${
                          isOdd ? 'bg-white dark:bg-[#1a1a1a]' : 'bg-gray-50 dark:bg-[#111111]'
                        }`}
                      >
                        {/* Date */}
                        <div className="col-span-2 text-sm text-gray-900 dark:text-gray-200 font-medium">
                          <div>{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        
                        {/* Activities for the Day */}
                        <div className="col-span-10 space-y-2">
                          {dayActivities.map((item: any, itemIndex: number) => {
                            const startTime = item.start_time ? item.start_time.slice(0, 5) : ''
                            const endTime = item.end_time ? item.end_time.slice(0, 5) : ''
                            const timeRange = startTime && endTime ? `${startTime}-${endTime}` : startTime
                            
                            return (
                              <div key={item.id} className="flex items-start gap-4 text-sm">
                                {/* Time */}
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono w-20 flex-shrink-0">
                                  {timeRange}
                                </div>
                                
                                {/* Activity */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {item.is_confirmed && (
                                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                    )}
                                    <span className="uppercase font-medium text-gray-900 dark:text-gray-200 text-xs tracking-wide">
                                      {item.activity_type}
                                    </span>
                                    <span className="text-gray-400">-</span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {item.title}
                                    </span>
                                  </div>
                                  {item.custom_location && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">
                                      {item.custom_location}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4 px-4 py-6 border-t border-gray-200 dark:border-[#2a2a2a]">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                    {visits.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Visits
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                    {meetings.length}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Meetings
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                    {trip.duration}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Days
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                    {trip.notesCount || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Notes
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-pearl-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#111111]">
          {/* Left side - Access Code */}
          <button
            onClick={handleCopyAccessCode}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors"
            title={`Copy access code: ${trip.accessCode}`}
          >
            <Key className="w-4 h-4" />
            <span className="text-sm font-mono">{trip.accessCode}</span>
          </button>
          
          {/* Right side - Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.location.href = `/trips/${trip.accessCode}`}
              className="px-4 py-2 bg-golden-500 dark:bg-[#123d32] text-white dark:text-[#F3E8A6] rounded-lg hover:bg-golden-600 dark:hover:bg-[#0E3D2F] transition-colors"
            >
              View Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}