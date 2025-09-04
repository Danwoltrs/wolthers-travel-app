import React, { useState, useEffect } from 'react'
import { X, Users, MapPin, Clock, ArrowRight, ArrowDown } from 'lucide-react'
import type { Activity, Company, User } from '@/types'

interface ActivitySplitModalProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity
  companies: Company[]
  participants: User[]
  onSplit: (groupA: SplitGroup, groupB: SplitGroup) => void
}

export interface SplitGroup {
  title: string
  location?: string
  participants: string[] // Company/participant IDs
  startTime: string
  endTime: string
  notes?: string
}

interface ParticipantItem {
  id: string
  name: string
  type: 'company' | 'participant'
}

export default function ActivitySplitModal({ 
  isOpen, 
  onClose, 
  activity, 
  companies, 
  participants, 
  onSplit 
}: ActivitySplitModalProps) {
  const [groupA, setGroupA] = useState<SplitGroup>({
    title: `${activity.title} - Group A`,
    location: activity.location,
    participants: [],
    startTime: activity.start_time || '09:00',
    endTime: activity.end_time || '10:00',
    notes: ''
  })

  const [groupB, setGroupB] = useState<SplitGroup>({
    title: `${activity.title} - Group B`,
    location: activity.location,
    participants: [],
    startTime: activity.start_time || '09:00',
    endTime: activity.end_time || '10:00',
    notes: ''
  })

  const [splitType, setSplitType] = useState<'parallel' | 'sequential'>('parallel')

  // Combine companies and participants into a single list
  const allParticipants: ParticipantItem[] = [
    ...companies.map(company => ({
      id: company.id,
      name: company.name,
      type: 'company' as const
    })),
    ...participants.map(participant => ({
      id: participant.id,
      name: participant.full_name || participant.email,
      type: 'participant' as const
    }))
  ]

  const unassignedParticipants = allParticipants.filter(
    participant => !groupA.participants.includes(participant.id) && !groupB.participants.includes(participant.id)
  )

  // Handle participant assignment
  const moveToGroup = (participantId: string, targetGroup: 'A' | 'B') => {
    if (targetGroup === 'A') {
      setGroupA(prev => ({
        ...prev,
        participants: [...prev.participants, participantId]
      }))
      setGroupB(prev => ({
        ...prev,
        participants: prev.participants.filter(id => id !== participantId)
      }))
    } else {
      setGroupB(prev => ({
        ...prev,
        participants: [...prev.participants, participantId]
      }))
      setGroupA(prev => ({
        ...prev,
        participants: prev.participants.filter(id => id !== participantId)
      }))
    }
  }

  const removeFromGroup = (participantId: string, group: 'A' | 'B') => {
    if (group === 'A') {
      setGroupA(prev => ({
        ...prev,
        participants: prev.participants.filter(id => id !== participantId)
      }))
    } else {
      setGroupB(prev => ({
        ...prev,
        participants: prev.participants.filter(id => id !== participantId)
      }))
    }
  }

  // Handle split type change
  useEffect(() => {
    if (splitType === 'sequential') {
      // For sequential, Group B starts when Group A ends
      const groupAEndTime = groupA.endTime
      setGroupB(prev => ({
        ...prev,
        startTime: groupAEndTime,
        endTime: addHoursToTime(groupAEndTime, 2) // Default 2 hour duration
      }))
    } else {
      // For parallel, both groups have the same time
      setGroupB(prev => ({
        ...prev,
        startTime: groupA.startTime,
        endTime: groupA.endTime
      }))
    }
  }, [splitType, groupA.endTime, groupA.startTime])

  function addHoursToTime(timeString: string, hours: number): string {
    const [h, m] = timeString.split(':').map(Number)
    const totalMinutes = h * 60 + m + hours * 60
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMinutes = totalMinutes % 60
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`
  }

  const handleSplit = () => {
    if (groupA.participants.length === 0 || groupB.participants.length === 0) {
      alert('Both groups must have at least one participant')
      return
    }
    onSplit(groupA, groupB)
    onClose()
  }

  const getParticipantName = (id: string): string => {
    const participant = allParticipants.find(p => p.id === id)
    return participant?.name || 'Unknown'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-pearl-200 dark:border-[#2a2a2a] bg-golden-400 dark:bg-[#09261d] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white dark:text-golden-400">
              Split Activity
            </h2>
            <p className="text-white/70 dark:text-golden-400/70 text-sm">
              Divide "{activity.title}" into separate groups
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Split Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-3">
              Split Type
            </h3>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="splitType"
                  value="parallel"
                  checked={splitType === 'parallel'}
                  onChange={(e) => setSplitType(e.target.value as 'parallel')}
                  className="rounded border-gray-300 dark:border-[#2a2a2a]"
                />
                <span className="text-gray-700 dark:text-gray-300">Parallel (Same time)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="splitType"
                  value="sequential"
                  checked={splitType === 'sequential'}
                  onChange={(e) => setSplitType(e.target.value as 'sequential')}
                  className="rounded border-gray-300 dark:border-[#2a2a2a]"
                />
                <span className="text-gray-700 dark:text-gray-300">Sequential (One after another)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Unassigned Participants */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Available Participants ({unassignedParticipants.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {unassignedParticipants.map(participant => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 border border-gray-200 dark:border-[#3a3a3a] rounded-lg bg-gray-50 dark:bg-[#2a2a2a]"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        participant.type === 'company' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {participant.name}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => moveToGroup(participant.id, 'A')}
                        className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                      >
                        A
                      </button>
                      <button
                        onClick={() => moveToGroup(participant.id, 'B')}
                        className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors"
                      >
                        B
                      </button>
                    </div>
                  </div>
                ))}
                {unassignedParticipants.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                    All participants assigned
                  </p>
                )}
              </div>
            </div>

            {/* Group A */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-purple-600 dark:text-purple-400 mb-3">
                Group A ({groupA.participants.length})
              </h3>
              
              {/* Group A Configuration */}
              <div className="space-y-4 mb-4 p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={groupA.title}
                    onChange={(e) => setGroupA(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={groupA.location || ''}
                    onChange={(e) => setGroupA(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Optional location"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={groupA.startTime}
                      onChange={(e) => setGroupA(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={groupA.endTime}
                      onChange={(e) => setGroupA(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Group A Participants */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {groupA.participants.map(participantId => (
                  <div
                    key={participantId}
                    className="flex items-center justify-between p-2 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-100 dark:bg-purple-900/30"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {getParticipantName(participantId)}
                    </span>
                    <button
                      onClick={() => removeFromGroup(participantId, 'A')}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {groupA.participants.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                    No participants assigned
                  </p>
                )}
              </div>
            </div>

            {/* Group B */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-orange-600 dark:text-orange-400 mb-3">
                Group B ({groupB.participants.length})
              </h3>
              
              {/* Group B Configuration */}
              <div className="space-y-4 mb-4 p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={groupB.title}
                    onChange={(e) => setGroupB(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={groupB.location || ''}
                    onChange={(e) => setGroupB(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Optional location"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={groupB.startTime}
                      onChange={(e) => setGroupB(prev => ({ ...prev, startTime: e.target.value }))}
                      disabled={splitType === 'sequential'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={groupB.endTime}
                      onChange={(e) => setGroupB(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Group B Participants */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {groupB.participants.map(participantId => (
                  <div
                    key={participantId}
                    className="flex items-center justify-between p-2 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-100 dark:bg-orange-900/30"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {getParticipantName(participantId)}
                    </span>
                    <button
                      onClick={() => removeFromGroup(participantId, 'B')}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {groupB.participants.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                    No participants assigned
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Visual Timeline */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-[#2a2a2a] rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-3">
              Timeline Preview
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {groupA.title} ({groupA.startTime} - {groupA.endTime})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {groupB.title} ({groupB.startTime} - {groupB.endTime})
                  </span>
                </div>
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {splitType === 'parallel' ? (
                  <ArrowDown className="w-6 h-6" />
                ) : (
                  <ArrowRight className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-pearl-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#2a2a2a] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            disabled={groupA.participants.length === 0 || groupB.participants.length === 0}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <span>Create Split Activities</span>
          </button>
        </div>
      </div>
    </div>
  )
}