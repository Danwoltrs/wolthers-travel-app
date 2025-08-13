import React, { useState } from 'react'
import { TripFormData } from './TripCreationModal'
import { Calendar, Plus, Trash2, Clock, MapPin, Users, FileText } from 'lucide-react'

interface Meeting {
  id: string
  title: string
  type: 'conference_session' | 'networking' | 'presentation' | 'meeting' | 'other'
  date: string
  startTime: string
  endTime: string
  location: string
  attendees: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  notes?: string
}

interface MeetingAgendaStepProps {
  formData: TripFormData & { meetings?: Meeting[] }
  updateFormData: (data: Partial<TripFormData & { meetings?: Meeting[] }>) => void
}

const meetingTypes = [
  { value: 'conference_session', label: 'Conference Session', icon: '🎯', color: 'blue' },
  { value: 'networking', label: 'Networking Event', icon: '🤝', color: 'green' },
  { value: 'presentation', label: 'Presentation', icon: '📊', color: 'purple' },
  { value: 'meeting', label: 'Business Meeting', icon: '💼', color: 'orange' },
  { value: 'other', label: 'Other', icon: '📅', color: 'gray' }
]

const priorityColors = {
  low: 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300',
  high: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
}

export default function MeetingAgendaStep({ formData, updateFormData }: MeetingAgendaStepProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(formData.meetings || [])

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

  // Add a new meeting/event
  const addMeeting = () => {
    const tripDates = getTripDates()
    const newMeeting: Meeting = {
      id: `meeting_${Date.now()}`,
      title: '',
      type: 'conference_session',
      date: tripDates[0] || formData.startDate?.toISOString().split('T')[0] || '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      attendees: '',
      description: '',
      priority: 'medium',
      notes: ''
    }

    const updatedMeetings = [...meetings, newMeeting]
    setMeetings(updatedMeetings)
    updateFormData({ meetings: updatedMeetings })
  }

  // Update meeting information
  const updateMeeting = (meetingId: string, updates: Partial<Meeting>) => {
    const updatedMeetings = meetings.map(meeting =>
      meeting.id === meetingId ? { ...meeting, ...updates } : meeting
    )
    
    setMeetings(updatedMeetings)
    updateFormData({ meetings: updatedMeetings })
  }

  // Remove a meeting
  const removeMeeting = (meetingId: string) => {
    const updatedMeetings = meetings.filter(meeting => meeting.id !== meetingId)
    setMeetings(updatedMeetings)
    updateFormData({ meetings: updatedMeetings })
  }

  // Group meetings by date
  const meetingsByDate = meetings.reduce((acc, meeting) => {
    if (!acc[meeting.date]) {
      acc[meeting.date] = []
    }
    acc[meeting.date].push(meeting)
    return acc
  }, {} as Record<string, Meeting[]>)

  // Sort meetings by time within each date
  Object.keys(meetingsByDate).forEach(date => {
    meetingsByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  const tripDates = getTripDates()
  const totalMeetings = meetings.length
  const highPriorityMeetings = meetings.filter(m => m.priority === 'high').length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          Meetings & Agenda Planning
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Plan your conference sessions, meetings, and networking events.
        </p>

        {/* Summary Stats */}
        {meetings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Total Events</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-300">{totalMeetings}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-300">High Priority</p>
                  <p className="text-lg font-bold text-red-900 dark:text-red-300">{highPriorityMeetings}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">Days Covered</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-300">
                    {Object.keys(meetingsByDate).length} / {tripDates.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Agenda View */}
        {tripDates.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Daily Agenda</h3>
            <div className="space-y-4">
              {tripDates.map(date => {
                const dayMeetings = meetingsByDate[date] || []
                const dateObj = new Date(date)
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                const dayMonth = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                
                return (
                  <div key={date} className="bg-gray-50 dark:bg-[#2a2a2a] rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {dayName}, {dayMonth}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {dayMeetings.length} event{dayMeetings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {dayMeetings.length > 0 ? (
                      <div className="space-y-2">
                        {dayMeetings.map(meeting => {
                          const meetingType = meetingTypes.find(t => t.value === meeting.type)
                          return (
                            <div key={meeting.id} className={`p-3 rounded border ${priorityColors[meeting.priority]}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span>{meetingType?.icon}</span>
                                  <span className="font-medium">{meeting.title || 'Untitled Event'}</span>
                                  <span className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 border">
                                    {meetingType?.label}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <Clock className="w-3 h-3" />
                                  <span>{meeting.startTime} - {meeting.endTime}</span>
                                </div>
                              </div>
                              {meeting.location && (
                                <div className="mt-1 flex items-center space-x-1 text-sm">
                                  <MapPin className="w-3 h-3" />
                                  <span>{meeting.location}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No events scheduled</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Meeting List */}
        <div className="space-y-6">
          {meetings.map((meeting, index) => {
            const meetingType = meetingTypes.find(t => t.value === meeting.type)
            
            return (
              <div key={meeting.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Event {index + 1}
                  </h3>
                  {meetings.length > 1 && (
                    <button
                      onClick={() => removeMeeting(meeting.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      value={meeting.title}
                      onChange={(e) => updateMeeting(meeting.id, { title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="e.g., Opening Keynote - Future of Coffee Industry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Type *
                    </label>
                    <select
                      value={meeting.type}
                      onChange={(e) => updateMeeting(meeting.id, { type: e.target.value as Meeting['type'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    >
                      {meetingTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={meeting.priority}
                      onChange={(e) => updateMeeting(meeting.id, { priority: e.target.value as Meeting['priority'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <select
                      value={meeting.date}
                      onChange={(e) => updateMeeting(meeting.id, { date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    >
                      {tripDates.map(date => {
                        const dateObj = new Date(date)
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
                        const dayMonth = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        return (
                          <option key={date} value={date}>
                            {dayName}, {dayMonth}
                          </option>
                        )
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={meeting.startTime}
                      onChange={(e) => updateMeeting(meeting.id, { startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={meeting.endTime}
                      onChange={(e) => updateMeeting(meeting.id, { endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={meeting.location}
                      onChange={(e) => updateMeeting(meeting.id, { location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="e.g., Conference Hall A, Zurich Convention Center"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Attendees
                    </label>
                    <input
                      type="text"
                      value={meeting.attendees}
                      onChange={(e) => updateMeeting(meeting.id, { attendees: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="e.g., Industry experts, Coffee producers, Daniel Wolthers"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={meeting.description || ''}
                      onChange={(e) => updateMeeting(meeting.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="Brief description of the event, objectives, or key topics..."
                      rows={2}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={meeting.notes || ''}
                      onChange={(e) => updateMeeting(meeting.id, { notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                      placeholder="Preparation notes, follow-up actions, or important reminders..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add Meeting Button */}
          <button
            onClick={addMeeting}
            className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
          >
            <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-medium">Add Event to Agenda</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}