'use client'

import React, { useState, useEffect } from 'react'
import { X, Mail, Users, Building2, UserCheck, Check, Send, AlertCircle } from 'lucide-react'

interface EmailRecipient {
  id: string
  email: string
  name: string
  type: 'host' | 'guest' | 'staff'
  company?: string
}

interface EmailPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (recipients: string[]) => Promise<void>
  activityTitle: string
  companies: Array<{
    id: string
    name: string
    representatives?: Array<{ name: string; email: string }>
  }>
  activityParticipants: Array<{
    id: string
    participant_id: string
    role?: string
    attendance_status?: string
    user?: {
      id: string
      email: string
      full_name: string
      company?: { id: string; name: string }
    }
  }>
  tripId?: string
}

export default function EmailPromptModal({
  isOpen,
  onClose,
  onSend,
  activityTitle,
  companies = [],
  activityParticipants = [],
  tripId
}: EmailPromptModalProps) {
  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set())
  const [customEmail, setCustomEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Load recipients when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRecipients()
    }
  }, [isOpen, companies, activityParticipants, tripId])

  const loadRecipients = async () => {
    const allRecipients: EmailRecipient[] = []

    // Add company representatives (hosts)
    companies.forEach(company => {
      if (company.representatives) {
        company.representatives.forEach(rep => {
          if (rep.email) {
            allRecipients.push({
              id: `host-${company.id}-${rep.email}`,
              email: rep.email,
              name: rep.name,
              type: 'host',
              company: company.name
            })
          }
        })
      }
    })

    // Load trip participants directly (more reliable than activity participants)
    if (tripId) {
      try {
        const response = await fetch(`/api/trips/${tripId}/participants`, {
          credentials: 'include'
        })
        if (response.ok) {
          const { staff, guests, pendingInvitations } = await response.json()
          
          // Add staff participants
          if (staff) {
            staff.forEach((staffMember: any) => {
              if (staffMember.users?.email) {
                allRecipients.push({
                  id: `staff-${staffMember.users.id}`,
                  email: staffMember.users.email,
                  name: staffMember.users.full_name || staffMember.users.email.split('@')[0],
                  type: 'staff',
                  company: 'Wolthers & Associates'
                })
              }
            })
          }
          
          // Add guest participants (both registered users and guests)
          if (guests) {
            guests.forEach((guest: any) => {
              if (guest.guest_email) {
                allRecipients.push({
                  id: `guest-${guest.id}`,
                  email: guest.guest_email,
                  name: guest.guest_name || guest.guest_email.split('@')[0],
                  type: 'guest',
                  company: guest.guest_company
                })
              }
            })
          }
          
          // Add pending invitations
          if (pendingInvitations) {
            pendingInvitations.forEach((invitation: any) => {
              if (invitation.guest_email) {
                allRecipients.push({
                  id: `pending-${invitation.id}`,
                  email: invitation.guest_email,
                  name: invitation.guest_name || invitation.guest_email.split('@')[0],
                  type: 'guest',
                  company: invitation.guest_company
                })
              }
            })
          }
        } else {
          console.error('Failed to fetch trip participants:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to load trip participants:', error)
      }
    }

    // Remove duplicates based on email
    const uniqueRecipients = allRecipients.filter((recipient, index, self) => 
      index === self.findIndex(r => r.email === recipient.email)
    )

    setRecipients(uniqueRecipients)
    
    // Auto-select all recipients by default
    setSelectedRecipients(new Set(uniqueRecipients.map(r => r.id)))
  }

  const handleRecipientToggle = (recipientId: string) => {
    setSelectedRecipients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recipientId)) {
        newSet.delete(recipientId)
      } else {
        newSet.add(recipientId)
      }
      return newSet
    })
  }

  const handleSelectAll = (type?: 'host' | 'guest' | 'staff') => {
    const relevantRecipients = type ? recipients.filter(r => r.type === type) : recipients
    const allSelected = relevantRecipients.every(r => selectedRecipients.has(r.id))
    
    setSelectedRecipients(prev => {
      const newSet = new Set(prev)
      relevantRecipients.forEach(recipient => {
        if (allSelected) {
          newSet.delete(recipient.id)
        } else {
          newSet.add(recipient.id)
        }
      })
      return newSet
    })
  }

  const addCustomEmail = () => {
    const email = customEmail.trim()
    if (email && email.includes('@')) {
      const customRecipient: EmailRecipient = {
        id: `custom-${Date.now()}`,
        email: email,
        name: email.split('@')[0],
        type: 'guest'
      }
      setRecipients(prev => [...prev, customRecipient])
      setSelectedRecipients(prev => new Set([...prev, customRecipient.id]))
      setCustomEmail('')
    }
  }

  const handleSend = async () => {
    const selectedEmails = recipients
      .filter(r => selectedRecipients.has(r.id))
      .map(r => r.email)

    if (selectedEmails.length === 0) {
      setErrorMessage('Please select at least one recipient')
      return
    }

    setIsSending(true)
    setSendStatus('sending')
    setErrorMessage('')

    try {
      await onSend(selectedEmails)
      setSendStatus('success')
      setTimeout(() => {
        onClose()
        setSendStatus('idle')
        setSelectedRecipients(new Set())
      }, 2000)
    } catch (error) {
      console.error('Failed to send emails:', error)
      setErrorMessage('Failed to send emails. Please try again.')
      setSendStatus('error')
    } finally {
      setIsSending(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'host': return <Building2 className="w-3 h-3" />
      case 'staff': return <UserCheck className="w-3 h-3" />
      default: return <Users className="w-3 h-3" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'host': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'staff': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const groupedRecipients = {
    host: recipients.filter(r => r.type === 'host'),
    guest: recipients.filter(r => r.type === 'guest'),
    staff: recipients.filter(r => r.type === 'staff')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] p-4 border-b border-golden-500 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-green-700 dark:text-golden-400" />
              <div>
                <h3 className="text-lg font-semibold text-green-700 dark:text-golden-400">
                  Email Meeting Notes
                </h3>
                <p className="text-sm text-gray-700 dark:text-golden-400/70">
                  {activityTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-700 dark:text-golden-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          
          {/* Status Messages */}
          {sendStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center space-x-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">Emails sent successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{errorMessage}</span>
            </div>
          )}

          {/* Recipients Selection */}
          <div className="space-y-4">
            
            {/* Company Representatives (Hosts) */}
            {groupedRecipients.host.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-golden-400 flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>Company Representatives ({groupedRecipients.host.length})</span>
                  </h4>
                  <button
                    onClick={() => handleSelectAll('host')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {groupedRecipients.host.every(r => selectedRecipients.has(r.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-1">
                  {groupedRecipients.host.map(recipient => (
                    <div
                      key={recipient.id}
                      className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.has(recipient.id)}
                        onChange={() => handleRecipientToggle(recipient.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <div className="flex-1 flex items-center space-x-2 min-w-0">
                        <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 text-xs rounded border ${getTypeColor(recipient.type)}`}>
                          {getTypeIcon(recipient.type)}
                          <span>Host</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {recipient.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {recipient.email} • {recipient.company}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trip Guests */}
            {groupedRecipients.guest.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-golden-400 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Trip Participants ({groupedRecipients.guest.length})</span>
                  </h4>
                  <button
                    onClick={() => handleSelectAll('guest')}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  >
                    {groupedRecipients.guest.every(r => selectedRecipients.has(r.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-1">
                  {groupedRecipients.guest.map(recipient => (
                    <div
                      key={recipient.id}
                      className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.has(recipient.id)}
                        onChange={() => handleRecipientToggle(recipient.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <div className="flex-1 flex items-center space-x-2 min-w-0">
                        <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 text-xs rounded border ${getTypeColor(recipient.type)}`}>
                          {getTypeIcon(recipient.type)}
                          <span>Guest</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {recipient.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {recipient.email}{recipient.company && ` • ${recipient.company}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wolthers Staff */}
            {groupedRecipients.staff.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-golden-400 flex items-center space-x-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Wolthers Staff ({groupedRecipients.staff.length})</span>
                  </h4>
                  <button
                    onClick={() => handleSelectAll('staff')}
                    className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                  >
                    {groupedRecipients.staff.every(r => selectedRecipients.has(r.id)) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-1">
                  {groupedRecipients.staff.map(recipient => (
                    <div
                      key={recipient.id}
                      className="flex items-center space-x-2 py-1 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.has(recipient.id)}
                        onChange={() => handleRecipientToggle(recipient.id)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <div className="flex-1 flex items-center space-x-2 min-w-0">
                        <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 text-xs rounded border ${getTypeColor(recipient.type)}`}>
                          {getTypeIcon(recipient.type)}
                          <span>Staff</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {recipient.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {recipient.email} • Wolthers & Associates
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Custom Email */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-golden-400 mb-2">
                Add Additional Email
              </h4>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomEmail()}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  onClick={addCustomEmail}
                  disabled={!customEmail.trim() || !customEmail.includes('@')}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedRecipients.size} recipient{selectedRecipients.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={selectedRecipients.size === 0 || isSending}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Notes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}