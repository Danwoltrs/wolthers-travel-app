import React, { useState, useEffect } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Plus, Minus, Trash2, Clock, MapPin, Users, FileText, X, Plane, Hotel, Coffee, Utensils, DollarSign, Building2 } from 'lucide-react'
import { CalendarEvent, MeetingAgendaStepProps, CompanyWithLocations, CompanyLocation, CostTracking } from '@/types'
import { useCompaniesWithLocations } from '@/hooks/useCompaniesWithLocations'

const eventTypes = [
  { value: 'flight', label: 'Flight', icon: <Plane className="w-4 h-4" />, color: 'bg-blue-500', textColor: 'text-white' },
  { value: 'hotel', label: 'Hotel', icon: <Hotel className="w-4 h-4" />, color: 'bg-purple-500', textColor: 'text-white' },
  { value: 'conference_session', label: 'Conference Session', icon: <FileText className="w-4 h-4" />, color: 'bg-emerald-500', textColor: 'text-white' },
  { value: 'meeting', label: 'Business Meeting', icon: <Users className="w-4 h-4" />, color: 'bg-orange-500', textColor: 'text-white' },
  { value: 'lunch', label: 'Lunch', icon: <Coffee className="w-4 h-4" />, color: 'bg-yellow-500', textColor: 'text-white' },
  { value: 'dinner', label: 'Dinner', icon: <Utensils className="w-4 h-4" />, color: 'bg-red-500', textColor: 'text-white' },
  { value: 'networking', label: 'Networking', icon: <Users className="w-4 h-4" />, color: 'bg-green-500', textColor: 'text-white' },
  { value: 'presentation', label: 'Presentation', icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-500', textColor: 'text-white' },
  { value: 'other', label: 'Other', icon: <Calendar className="w-4 h-4" />, color: 'bg-gray-500', textColor: 'text-white' }
]

// Time slots from 6 AM to 8 PM with military time ranges
const timeSlots = [
  '06:00-07:00', '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00',
  '18:00-19:00', '19:00-20:00', '20:00-21:00'
]

// Helper to get start time from slot
const getStartTimeFromSlot = (timeSlot: string): string => {
  return timeSlot.split('-')[0]
}

// Helper to get end time from slot
const getEndTimeFromSlot = (timeSlot: string): string => {
  return timeSlot.split('-')[1]
}

// Currency options for cost tracking
const currencyOptions = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'CHF', label: 'CHF (CHF)' },
  { value: 'GBP', label: 'GBP (£)' }
]

export default function MeetingAgendaStep({ formData, updateFormData }: MeetingAgendaStepProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(formData.meetings || [])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  
  // Use the companies hook
  const { companies, isLoading: isLoadingCompanies, error: companiesError, refetch } = useCompaniesWithLocations()

  // Error handling for companies
  useEffect(() => {
    if (companiesError) {
      console.error('Error loading companies:', companiesError)
    }
  }, [companiesError])

  // Generate array of dates between start and end date for the trip
  const getTripDates = (): string[] => {
    if (!formData.startDate || !formData.endDate) return []
    
    const dates: string[] = []
    const currentDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  // Add day before start date
  const addDayBefore = () => {
    if (!formData.startDate) return
    
    const newStartDate = new Date(formData.startDate)
    newStartDate.setDate(newStartDate.getDate() - 1)
    
    updateFormData({
      startDate: newStartDate
    })
  }

  // Add day after end date
  const addDayAfter = () => {
    if (!formData.endDate) return
    
    const newEndDate = new Date(formData.endDate)
    newEndDate.setDate(newEndDate.getDate() + 1)
    
    updateFormData({
      endDate: newEndDate
    })
  }

  // Remove day from beginning
  const removeDayBefore = () => {
    if (!formData.startDate || !formData.endDate) return
    
    // Don't allow removing if only 1 day
    const days = Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return
    
    const newStartDate = new Date(formData.startDate)
    newStartDate.setDate(newStartDate.getDate() + 1)
    
    // Remove any events from the day being removed
    const firstDate = formData.startDate.toISOString().split('T')[0]
    const updatedEvents = events.filter(event => event.date !== firstDate)
    setEvents(updatedEvents)
    updateFormData({ meetings: updatedEvents })
    
    updateFormData({
      startDate: newStartDate
    })
  }

  // Remove day from end
  const removeDayAfter = () => {
    if (!formData.startDate || !formData.endDate) return
    
    // Don't allow removing if only 1 day
    const days = Math.ceil((formData.endDate.getTime() - formData.startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 0) return
    
    const newEndDate = new Date(formData.endDate)
    newEndDate.setDate(newEndDate.getDate() - 1)
    
    // Remove any events from the day being removed
    const lastDate = formData.endDate.toISOString().split('T')[0]
    const updatedEvents = events.filter(event => event.date !== lastDate)
    setEvents(updatedEvents)
    updateFormData({ meetings: updatedEvents })
    
    updateFormData({
      endDate: newEndDate
    })
  }

  // Handle opening the event creation modal
  const handleTimeSlotClick = (date: string, timeSlot: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot(getStartTimeFromSlot(timeSlot)) // Extract start time
    setEditingEvent(null)
    setShowEventModal(true)
  }

  // Handle editing an existing event
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setSelectedDate(event.date)
    setSelectedTimeSlot(event.startTime)
    setShowEventModal(true)
  }

  // Save an event (create or update)
  const saveEvent = (eventData: Partial<CalendarEvent>) => {
    const updatedEvents = [...events]
    
    if (editingEvent) {
      // Update existing event
      const index = updatedEvents.findIndex(e => e.id === editingEvent.id)
      if (index !== -1) {
        updatedEvents[index] = { ...updatedEvents[index], ...eventData }
      }
    } else {
      // Create new event
      const newEvent: CalendarEvent = {
        id: `event_${Date.now()}`,
        title: eventData.title || '',
        type: eventData.type || 'meeting',
        date: selectedDate,
        startTime: selectedTimeSlot,
        endTime: eventData.endTime || selectedTimeSlot,
        priority: 'medium',
        ...eventData
      }
      updatedEvents.push(newEvent)
    }
    
    setEvents(updatedEvents)
    updateFormData({ 
      meetings: updatedEvents,
      // Also update hotels and flights arrays for proper form data structure
      hotels: updatedEvents.filter(e => e.type === 'hotel').map(e => ({
        id: e.id,
        name: e.hotelName || e.title,
        address: e.hotelAddress || e.location,
        checkInDate: e.checkIn,
        checkOutDate: e.checkOut,
        notes: e.notes
      })),
      flights: updatedEvents.filter(e => e.type === 'flight').map(e => ({
        id: e.id,
        airline: e.airline,
        flightNumber: e.flightNumber,
        departure: e.departure,
        arrival: e.arrival,
        notes: e.notes
      }))
    })
    setShowEventModal(false)
  }

  // Remove an event
  const removeEvent = (eventId: string) => {
    const updatedEvents = events.filter(e => e.id !== eventId)
    setEvents(updatedEvents)
    updateFormData({ meetings: updatedEvents })
  }

  // Get events for a specific date and time slot
  const getEventsForSlot = (date: string, timeSlot: string): CalendarEvent[] => {
    const slotStart = getStartTimeFromSlot(timeSlot)
    const slotEnd = getEndTimeFromSlot(timeSlot)
    
    return events.filter(event => 
      event.date === date && 
      event.startTime <= slotStart && 
      (event.endTime >= slotStart || event.startTime === slotStart)
    )
  }

  const tripDates = getTripDates()

  return (
    <div className="flex flex-col h-full min-h-[80vh]">
      <div className="flex-shrink-0 mb-3">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Meetings & Schedule
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on any time slot to add flights, hotels, meetings, lunches, or dinners. All scheduling is handled here.
        </p>
      </div>

      {/* Calendar Grid */}
      {tripDates.length > 0 ? (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden flex flex-col" style={{ width: 'fit-content', minWidth: '600px' }}>
          {/* Header with dates and add/remove buttons */}
          <div className="grid gap-0 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0" style={{ gridTemplateColumns: `120px 40px repeat(${Math.min(tripDates.length, 6)}, 180px) 40px` }}>
            <div className="p-3 bg-gray-50 dark:bg-[#2a2a2a] font-medium text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-[#2a2a2a]">
              Time
            </div>
            
            {/* Add day before button */}
            <div className="p-1 bg-gray-50 dark:bg-[#2a2a2a] text-center border-r border-gray-200 dark:border-[#2a2a2a]">
              <button
                onClick={addDayBefore}
                className="w-full h-8 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Add day before"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            {tripDates.slice(0, 6).map((date, index) => {
              const dateObj = new Date(date)
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const dayMonth = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const isFirstDay = index === 0
              const isLastDay = index === tripDates.length - 1
              const canRemove = getTripDates().length > 1
              
              return (
                <div key={date} className="p-2 bg-gray-50 dark:bg-[#2a2a2a] text-center border-r border-gray-200 dark:border-[#2a2a2a] relative">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{dayName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{dayMonth}</div>
                  
                  {/* Minus button on first day - positioned on the left side */}
                  {isFirstDay && (
                    <button
                      onClick={removeDayBefore}
                      className="absolute top-1 left-1 w-4 h-4 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove first day"
                      disabled={!canRemove}
                    >
                      <Minus className="w-2 h-2" />
                    </button>
                  )}
                  
                  {/* Minus button on last day - positioned on the right side */}
                  {isLastDay && index > 0 && (
                    <button
                      onClick={removeDayAfter}
                      className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove last day"
                      disabled={!canRemove}
                    >
                      <Minus className="w-2 h-2" />
                    </button>
                  )}
                </div>
              )
            })}
            
            {/* Add day after button */}
            <div className="p-1 bg-gray-50 dark:bg-[#2a2a2a] text-center border-l border-gray-200 dark:border-[#2a2a2a]">
              <button
                onClick={addDayAfter}
                className="w-full h-8 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Add day after"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Time slots grid - now takes full remaining height */}
          <div className="flex-1 overflow-y-auto">
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="grid gap-0 border-b border-gray-100 dark:border-gray-700" style={{ gridTemplateColumns: `120px 40px repeat(${Math.min(tripDates.length, 6)}, 180px) 40px` }}>
                <div className="p-4 bg-gray-50 dark:bg-[#2a2a2a] text-sm font-medium text-gray-600 dark:text-gray-400 text-center min-h-[100px] flex items-center justify-center border-r border-gray-200 dark:border-[#2a2a2a]">
                  {timeSlot}
                </div>
                {/* Empty cell for add day before button column */}
                <div className="p-1 min-h-[100px] border-r border-gray-200 dark:border-[#2a2a2a]"></div>
                
                {tripDates.slice(0, 6).map((date, index) => {
                  const slotEvents = getEventsForSlot(date, timeSlot)
                  const isLastColumn = index === Math.min(tripDates.length - 1, 5)
                  
                  return (
                    <div
                      key={`${date}-${timeSlot}`}
                      className={`p-2 min-h-[100px] hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors ${!isLastColumn ? 'border-r border-gray-200 dark:border-[#2a2a2a]' : ''}`}
                      onClick={() => handleTimeSlotClick(date, timeSlot)}
                    >
                      {slotEvents.map(event => {
                        const eventType = eventTypes.find(t => t.value === event.type)
                        
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded mb-1 flex items-center justify-between ${eventType?.color} ${eventType?.textColor}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditEvent(event)
                            }}
                          >
                            <div className="flex items-center space-x-1 flex-1 min-w-0">
                              {eventType?.icon}
                              <span className="truncate">{event.title || eventType?.label}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeEvent(event.id)
                              }}
                              className="ml-1 hover:bg-black/10 rounded p-0.5 flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
                
                {/* Empty cell for add day after button column */}
                <div className="p-1 min-h-[100px] border-l border-gray-200 dark:border-[#2a2a2a]"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Please set trip dates to view the calendar.
        </div>
      )}

      {/* Event Creation/Edit Modal */}
      {showEventModal && (
        <EventModal
          event={editingEvent}
          date={selectedDate}
          timeSlot={selectedTimeSlot}
          companies={companies}
          isLoadingCompanies={isLoadingCompanies}
          onSave={saveEvent}
          onCancel={() => setShowEventModal(false)}
        />
      )}
    </div>
  )
}

// Event Modal Component for creating/editing events
const EventModal: React.FC<{
  event: CalendarEvent | null
  date: string
  timeSlot: string
  companies: CompanyWithLocations[]
  isLoadingCompanies: boolean
  onSave: (eventData: Partial<CalendarEvent>) => void
  onCancel: () => void
}> = ({ event, date, timeSlot, companies, isLoadingCompanies, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    type: event?.type || 'meeting',
    startTime: event?.startTime || timeSlot,
    endTime: event?.endTime || calculateDefaultEndTime(timeSlot),
    location: event?.location || '',
    attendees: event?.attendees || '',
    description: event?.description || '',
    notes: event?.notes || '',
    // Flight specific
    airline: event?.airline || '',
    flightNumber: event?.flightNumber || '',
    departure: event?.departure || { airport: '', city: '' },
    arrival: event?.arrival || { airport: '', city: '' },
    // Hotel specific
    hotelName: event?.hotelName || '',
    hotelAddress: event?.hotelAddress || '',
    checkIn: event?.checkIn || date,
    checkOut: event?.checkOut || date,
    // Enhanced fields
    costTracking: event?.costTracking || { currency: 'USD' },
    companyAssociation: event?.companyAssociation || {},
    selectedCompanyId: event?.companyAssociation?.companyId || '',
    selectedLocationId: event?.companyAssociation?.companyLocationId || ''
  })

  // Calculate default end time (1 hour after start time)
  function calculateDefaultEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endHour = hours + 1
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const selectedEventType = eventTypes.find(t => t.value === formData.type)
  const isFlightType = formData.type === 'flight'
  const isHotelType = formData.type === 'hotel'
  const isMeetingType = ['meeting', 'lunch', 'dinner', 'presentation'].includes(formData.type)
  const isCostTrackingType = ['flight', 'hotel', 'meeting', 'lunch', 'dinner'].includes(formData.type)

  // Handle company selection
  const handleCompanyChange = (companyId: string) => {
    const selectedCompany = companies.find(c => c.id === companyId)
    setFormData(prev => ({
      ...prev,
      selectedCompanyId: companyId,
      selectedLocationId: '',
      companyAssociation: {
        companyId: companyId,
        companyName: selectedCompany?.name || '',
        companyLocationId: '',
        locationDetails: undefined
      }
    }))
  }

  // Handle location selection
  const handleLocationChange = (locationId: string) => {
    const selectedCompany = companies.find(c => c.id === formData.selectedCompanyId)
    const selectedLocation = selectedCompany?.locations?.find(l => l.id === locationId)
    
    setFormData(prev => ({
      ...prev,
      selectedLocationId: locationId,
      location: selectedLocation ? `${selectedLocation.name}, ${selectedLocation.addressLine1 || ''}` : '',
      companyAssociation: {
        ...prev.companyAssociation,
        companyLocationId: locationId,
        locationDetails: selectedLocation ? {
          name: selectedLocation.name,
          addressLine1: selectedLocation.addressLine1,
          addressLine2: selectedLocation.addressLine2,
          city: selectedLocation.city,
          state: selectedLocation.state,
          postalCode: selectedLocation.postalCode,
          country: selectedLocation.country,
          coordinates: selectedLocation.coordinates
        } : undefined
      }
    }))
  }

  // Handle cost tracking changes
  const handleCostChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      costTracking: {
        ...prev.costTracking,
        [field]: value
      }
    }))
  }

  // Get selected company locations
  const selectedCompany = companies.find(c => c.id === formData.selectedCompanyId)
  const companyLocations = selectedCompany?.locations || []

  const handleSave = () => {
    // Prepare the event data with enhanced fields
    const eventData = {
      ...formData,
      // Ensure we don't pass UI-only fields to the parent
      selectedCompanyId: undefined,
      selectedLocationId: undefined
    }
    onSave(eventData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-lg border border-gray-200 dark:border-[#2a2a2a] w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {event ? 'Edit Event' : 'Add Event'} - {new Date(date).toLocaleDateString()}
            </h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {eventTypes.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value as any }))}
                    className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center space-x-1 ${
                      formData.type === type.value 
                        ? `${type.color} ${type.textColor} border-transparent`
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                placeholder={`e.g., ${selectedEventType?.label}`}
              />
            </div>

            {/* Time inputs */}
            {!isHotelType && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value, endTime: calculateDefaultEndTime(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Flight specific fields */}
            {isFlightType && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Airline
                    </label>
                    <input
                      type="text"
                      value={formData.airline}
                      onChange={(e) => setFormData(prev => ({ ...prev, airline: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="e.g., Swiss Air"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Flight Number
                    </label>
                    <input
                      type="text"
                      value={formData.flightNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="e.g., LX123"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Departure Airport
                    </label>
                    <input
                      type="text"
                      value={formData.departure.airport}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        departure: { ...prev.departure, airport: e.target.value } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="e.g., ZUR"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Arrival Airport
                    </label>
                    <input
                      type="text"
                      value={formData.arrival.airport}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        arrival: { ...prev.arrival, airport: e.target.value } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="e.g., JFK"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Hotel specific fields */}
            {isHotelType && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hotel Name
                  </label>
                  <input
                    type="text"
                    value={formData.hotelName}
                    onChange={(e) => setFormData(prev => ({ ...prev, hotelName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    placeholder="e.g., Hotel Schweizerhof"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Check In
                    </label>
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Check Out
                    </label>
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Company Selection for Business Events */}
            {isMeetingType && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company
                  </label>
                  <select
                    value={formData.selectedCompanyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    disabled={isLoadingCompanies}
                  >
                    <option value="">Select a company...</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingCompanies && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading companies...</p>
                  )}
                </div>

                {/* Company Location Selection */}
                {formData.selectedCompanyId && companyLocations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <select
                      value={formData.selectedLocationId}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    >
                      <option value="">Select a location...</option>
                      {companyLocations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}{location.addressLine1 ? ` - ${location.addressLine1}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Location */}
            {!isFlightType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isMeetingType && formData.selectedCompanyId ? 'Additional Location Notes' : 'Location'}
                </label>
                <input
                  type="text"
                  value={isHotelType ? formData.hotelAddress : formData.location}
                  onChange={(e) => setFormData(prev => 
                    isHotelType 
                      ? { ...prev, hotelAddress: e.target.value }
                      : { ...prev, location: e.target.value }
                  )}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  placeholder={isHotelType ? "Hotel address" : (isMeetingType && formData.selectedCompanyId ? "Room, floor, or additional details" : "Event location")}
                  readOnly={isMeetingType && formData.selectedLocationId ? false : false}
                />
              </div>
            )}

            {/* Attendees (for meetings) */}
            {!isFlightType && !isHotelType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attendees
                </label>
                <input
                  type="text"
                  value={formData.attendees}
                  onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  placeholder="Who will attend?"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                rows={3}
                placeholder="Event description..."
              />
            </div>

            {/* Cost Tracking Section */}
            {isCostTrackingType && (
              <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Cost Tracking
                </h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.costTracking?.currency || 'USD'}
                        onChange={(e) => handleCostChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white text-sm"
                      >
                        {currencyOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cost per Person
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costTracking?.costPerPerson || ''}
                        onChange={(e) => handleCostChange('costPerPerson', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Cost
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.costTracking?.totalCost || ''}
                        onChange={(e) => handleCostChange('totalCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cost Notes
                    </label>
                    <textarea
                      value={formData.costTracking?.costNotes || ''}
                      onChange={(e) => handleCostChange('costNotes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      rows={2}
                      placeholder="Additional cost information..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {event ? 'Update' : 'Add'} Event
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}