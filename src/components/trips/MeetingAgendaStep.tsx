import React, { useState } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Plus, Trash2, Clock, MapPin, Users, FileText, X, Plane, Hotel, Coffee, Utensils } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  type: 'flight' | 'hotel' | 'meeting' | 'lunch' | 'dinner' | 'conference_session' | 'networking' | 'presentation' | 'other'
  date: string
  startTime: string
  endTime: string
  location?: string
  attendees?: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  notes?: string
  // Flight specific
  airline?: string
  flightNumber?: string
  departure?: { airport: string; city: string }
  arrival?: { airport: string; city: string }
  // Hotel specific
  hotelName?: string
  hotelAddress?: string
  checkIn?: string
  checkOut?: string
}

interface MeetingAgendaStepProps {
  formData: TripFormData & { meetings?: CalendarEvent[]; hotels?: any[]; flights?: any[] }
  updateFormData: (data: Partial<TripFormData & { meetings?: CalendarEvent[]; hotels?: any[]; flights?: any[] }>) => void
}

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

// Time slots from 6 AM to 8 PM
const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00'
]

export default function MeetingAgendaStep({ formData, updateFormData }: MeetingAgendaStepProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(formData.meetings || [])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

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

  // Handle opening the event creation modal
  const handleTimeSlotClick = (date: string, timeSlot: string) => {
    setSelectedDate(date)
    setSelectedTimeSlot(timeSlot)
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
    return events.filter(event => 
      event.date === date && 
      event.startTime <= timeSlot && 
      (event.endTime >= timeSlot || event.startTime === timeSlot)
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
        <div className="flex-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg overflow-hidden flex flex-col">
          {/* Header with dates */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-0 border-b border-gray-200 dark:border-[#2a2a2a] flex-shrink-0">
            <div className="p-3 bg-gray-50 dark:bg-[#2a2a2a] font-medium text-sm text-gray-700 dark:text-gray-300">
              Time
            </div>
            {tripDates.slice(0, 6).map(date => {
              const dateObj = new Date(date)
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const dayMonth = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              
              return (
                <div key={date} className="p-3 bg-gray-50 dark:bg-[#2a2a2a] text-center">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{dayName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{dayMonth}</div>
                </div>
              )
            })}
          </div>

          {/* Time slots grid - now takes full remaining height */}
          <div className="flex-1 overflow-y-auto">
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="grid grid-cols-1 lg:grid-cols-7 gap-0 border-b border-gray-100 dark:border-gray-700">
                <div className="p-4 bg-gray-50 dark:bg-[#2a2a2a] text-sm font-medium text-gray-600 dark:text-gray-400 text-center min-h-[100px] flex items-center justify-center">
                  {timeSlot}
                </div>
                {tripDates.slice(0, 6).map(date => {
                  const slotEvents = getEventsForSlot(date, timeSlot)
                  
                  return (
                    <div
                      key={`${date}-${timeSlot}`}
                      className="p-2 min-h-[100px] border-r border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
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
  onSave: (eventData: Partial<CalendarEvent>) => void
  onCancel: () => void
}> = ({ event, date, timeSlot, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    type: event?.type || 'meeting',
    startTime: event?.startTime || timeSlot,
    endTime: event?.endTime || timeSlot,
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
  })

  const selectedEventType = eventTypes.find(t => t.value === formData.type)
  const isFlightType = formData.type === 'flight'
  const isHotelType = formData.type === 'hotel'

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2a2a2a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
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

            {/* Location */}
            {!isFlightType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
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
                  placeholder={isHotelType ? "Hotel address" : "Event location"}
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