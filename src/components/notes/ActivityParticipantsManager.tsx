'use client'

import React, { useState, useEffect } from 'react'
import { Users, Plus, X, Search, Mail, Building2 } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  company?: {
    id: string
    name: string
  }
}

interface ActivityParticipant {
  id: string
  participant_id: string
  role?: string
  attendance_status?: string
  user?: User
}

interface ActivityParticipantsManagerProps {
  activityId: string
  participants: ActivityParticipant[]
  onParticipantsChange: (participants: ActivityParticipant[]) => void
  readOnly?: boolean
}

export default function ActivityParticipantsManager({
  activityId,
  participants,
  onParticipantsChange,
  readOnly = false
}: ActivityParticipantsManagerProps) {
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch available users for adding as participants
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      if (!showAddModal) return

      setLoading(true)
      try {
        // Fetch all users that could potentially attend the seminar
        const response = await fetch('/api/users/search', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const users = await response.json()
          setAvailableUsers(users)
        }
      } catch (error) {
        console.error('Failed to fetch available users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableUsers()
  }, [showAddModal])

  const addParticipant = async (user: User) => {
    try {
      const response = await fetch(`/api/activities/${activityId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          participant_id: user.id,
          role: 'attendee',
          attendance_status: 'invited'
        })
      })

      if (response.ok) {
        const newParticipant = await response.json()
        const participantWithUser = {
          ...newParticipant,
          user
        }
        onParticipantsChange([...participants, participantWithUser])
        setShowAddModal(false)
      } else {
        console.error('Failed to add participant')
      }
    } catch (error) {
      console.error('Error adding participant:', error)
    }
  }

  const removeParticipant = async (participantId: string) => {
    try {
      const response = await fetch(`/api/activities/${activityId}/participants`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ participant_id: participantId })
      })

      if (response.ok) {
        onParticipantsChange(participants.filter(p => p.id !== participantId))
      } else {
        console.error('Failed to remove participant')
      }
    } catch (error) {
      console.error('Error removing participant:', error)
    }
  }

  const filteredUsers = availableUsers.filter(user => 
    !participants.some(p => p.participant_id === user.id) &&
    (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (readOnly) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Attendees ({participants.length})
          </span>
        </div>
        <div className="space-y-1">
          {participants.map(participant => (
            <div key={participant.id} className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{participant.user?.full_name || participant.user?.email}</span>
              {participant.user?.company && (
                <span className="text-gray-500 ml-2">
                  - {participant.user.company.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Additional Attendees ({participants.length})
          </span>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Person</span>
        </button>
      </div>

      <div className="space-y-2">
        {participants.map(participant => (
          <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {participant.user?.full_name || participant.user?.email}
                </span>
              </div>
              {participant.user?.company && (
                <div className="flex items-center space-x-2 mt-1">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {participant.user.company.name}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={() => removeParticipant(participant.id)}
              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Remove attendee"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {participants.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          No additional attendees added yet
        </div>
      )}

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-70 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] max-w-md w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Add Seminar Attendee</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-500 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* User List */}
              <div className="max-h-64 overflow-auto space-y-2">
                {loading ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Loading users...
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => addParticipant(user)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {user.full_name || user.email}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          {user.company && (
                            <div className="text-xs text-gray-400">
                              {user.company.name}
                            </div>
                          )}
                        </div>
                        <Plus className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    {searchQuery ? 'No users found matching your search' : 'No additional users available'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}