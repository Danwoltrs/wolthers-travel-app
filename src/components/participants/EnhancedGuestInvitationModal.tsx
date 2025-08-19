'use client'

import { useState, useEffect } from 'react'
import { X, Mail, User, Building, Phone, MessageSquare, Send, AlertCircle, Search, Clock, Users, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GuestInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onInvitationSent: () => void
}

interface GuestInvitationData {
  guestName: string
  guestEmail: string
  guestCompany?: string
  guestTitle?: string
  guestPhone?: string
  message?: string
}

interface ExistingInvitation {
  id: string
  sent_at: string
  email_sent_count: number
  expires_at: string
}

interface SavedGuest {
  id: string
  full_name: string
  email: string
  phone?: string
  company_name?: string
  job_title?: string
  guest_type: string
  guest_category?: string
  total_trips_invited: number
  total_trips_attended: number
  last_trip_date?: string
  engagement_score: number
  tags?: string[]
}

type ModalMode = 'new' | 'search'

export function EnhancedGuestInvitationModal({ isOpen, onClose, tripId, onInvitationSent }: GuestInvitationModalProps) {
  const [mode, setMode] = useState<ModalMode>('search')
  const [formData, setFormData] = useState<GuestInvitationData>({
    guestName: '',
    guestEmail: '',
    guestCompany: '',
    guestTitle: '',
    guestPhone: '',
    message: ''
  })
  
  // Guest search state
  const [searchTerm, setSearchTerm] = useState('')
  const [savedGuests, setSavedGuests] = useState<SavedGuest[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<SavedGuest | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Reminder state
  const [existingInvitation, setExistingInvitation] = useState<ExistingInvitation | null>(null)
  const [isReminderMode, setIsReminderMode] = useState(false)
  const [canSendReminder, setCanSendReminder] = useState(false)

  // Search for saved guests
  useEffect(() => {
    if (!isOpen || mode !== 'search') return

    const searchGuests = async () => {
      setSearchLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        params.append('limit', '10')

        const response = await fetch(`/api/guests/directory?${params}`, {
          credentials: 'include'
        })

        if (response.ok) {
          const result = await response.json()
          setSavedGuests(result.guests || [])
        }
      } catch (error) {
        console.error('Failed to search guests:', error)
      } finally {
        setSearchLoading(false)
      }
    }

    const debounceTimeout = setTimeout(searchGuests, 300)
    return () => clearTimeout(debounceTimeout)
  }, [searchTerm, isOpen, mode])

  if (!isOpen) return null

  const handleInputChange = (field: keyof GuestInvitationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    
    // Reset reminder states when email changes
    if (field === 'guestEmail') {
      setExistingInvitation(null)
      setIsReminderMode(false)
      setCanSendReminder(false)
    }
  }

  const handleGuestSelect = (guest: SavedGuest) => {
    setSelectedGuest(guest)
    setFormData({
      guestName: guest.full_name,
      guestEmail: guest.email,
      guestCompany: guest.company_name || '',
      guestTitle: guest.job_title || '',
      guestPhone: guest.phone || '',
      message: ''
    })
    // Reset reminder states when selecting a new guest
    setExistingInvitation(null)
    setIsReminderMode(false)
    setCanSendReminder(false)
    setError(null)
    setMode('new') // Switch to form mode with pre-filled data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.guestName.trim() || !formData.guestEmail.trim()) {
      setError('Guest name and email are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/guests/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tripId,
          guestEmail: formData.guestEmail.trim(),
          guestName: formData.guestName.trim(),
          guestCompany: formData.guestCompany?.trim() || undefined,
          guestTitle: formData.guestTitle?.trim() || undefined,
          guestPhone: formData.guestPhone?.trim() || undefined,
          message: formData.message?.trim() || undefined,
          invitationType: 'company_guest', // External guests still use company_guest type (swapped logic)
          isReminder: isReminderMode
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle 409 conflict - existing invitation
        if (response.status === 409 && result.canSendReminder) {
          setExistingInvitation(result.existingInvitation)
          setCanSendReminder(true)
          setIsReminderMode(false)
          setError(null)
          return
        }
        throw new Error(result.error || 'Failed to send invitation')
      }

      setSuccess(true)
      setTimeout(() => {
        onInvitationSent()
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Failed to send invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      // Reset state
      setTimeout(() => {
        setMode('search')
        setFormData({
          guestName: '',
          guestEmail: '',
          guestCompany: '',
          guestTitle: '',
          guestPhone: '',
          message: ''
        })
        setSelectedGuest(null)
        setSearchTerm('')
        setError(null)
        setSuccess(false)
        setExistingInvitation(null)
        setIsReminderMode(false)
        setCanSendReminder(false)
      }, 300)
    }
  }

  const handleSendReminder = () => {
    setIsReminderMode(true)
    setExistingInvitation(null)
    setCanSendReminder(false)
    setError(null)
  }

  const handleCancelReminder = () => {
    setIsReminderMode(false)
    setExistingInvitation(null)
    setCanSendReminder(false)
    setError(null)
  }

  const formatLastTrip = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] shadow-xl rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] flex justify-between items-center">
          <h2 className="text-lg font-semibold">Invite External Guest</h2>
          <button 
            onClick={handleClose}
            disabled={loading}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-[#1a1a1a] overflow-y-auto max-h-[calc(90vh-120px)]">
          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-2">
                {isReminderMode ? 'Reminder Sent!' : 'Invitation Sent!'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {isReminderMode 
                  ? 'The reminder has been sent successfully.' 
                  : 'The guest invitation has been sent successfully.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-[#2a2a2a] p-1 rounded-lg mb-6">
                <button
                  onClick={() => setMode('search')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'search'
                      ? 'bg-white dark:bg-emerald-800/80 text-gray-800 dark:text-golden-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Search Previous Guests
                </button>
                <button
                  onClick={() => setMode('new')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'new'
                      ? 'bg-white dark:bg-emerald-800/80 text-gray-800 dark:text-golden-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Add New Guest
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-6">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Existing Invitation Notice */}
              {existingInvitation && canSendReminder && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Invitation Already Sent
                      </h4>
                      <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <p>
                          <strong>Email:</strong> {formData.guestEmail}
                        </p>
                        <p>
                          <strong>Originally sent:</strong> {new Date(existingInvitation.sent_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p>
                          <strong>Reminders sent:</strong> {existingInvitation.email_sent_count - 1}
                        </p>
                        <p>
                          <strong>Expires:</strong> {new Date(existingInvitation.expires_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button
                          onClick={handleSendReminder}
                          disabled={loading}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Send Reminder
                        </Button>
                        <Button
                          onClick={handleCancelReminder}
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/20"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reminder Mode Notice */}
              {isReminderMode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                      Sending reminder to {formData.guestEmail}
                    </p>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 text-xs mt-1 ml-6">
                    You can customize the message below before sending the reminder.
                  </p>
                </div>
              )}

              {mode === 'search' ? (
                /* Guest Search Mode */
                <div>
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, email, or company..."
                      style={{ paddingLeft: '36px' }}
                      className="w-full pr-3 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      disabled={loading}
                    />
                  </div>

                  {/* Search Results */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-600 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Searching...</p>
                      </div>
                    ) : savedGuests.length > 0 ? (
                      savedGuests.map((guest) => (
                        <div
                          key={guest.id}
                          onClick={() => handleGuestSelect(guest)}
                          className="p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-lg hover:border-emerald-500 dark:hover:border-emerald-600 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {guest.full_name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {guest.email}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Score: {guest.engagement_score}
                              </div>
                            </div>
                          </div>
                          
                          {guest.company_name && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              {guest.job_title && `${guest.job_title}, `}{guest.company_name}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {guest.total_trips_attended} trips
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last: {formatLastTrip(guest.last_trip_date)}
                              </span>
                            </div>
                            {guest.guest_category && (
                              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
                                {guest.guest_category}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : searchTerm ? (
                      <div className="text-center py-8">
                        <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">No guests found</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          Try a different search term or add a new guest
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Search for previous guests or add a new one
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* New Guest Form Mode */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {selectedGuest && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-4">
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        <strong>Selected guest:</strong> {selectedGuest.full_name} 
                        {selectedGuest.total_trips_attended > 0 && ` (${selectedGuest.total_trips_attended} previous trips)`}
                      </p>
                    </div>
                  )}

                  {/* Guest Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Guest Name *
                    </label>
                    <div className="relative">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.guestName}
                        onChange={(e) => handleInputChange('guestName', e.target.value)}
                        style={{ paddingLeft: '36px' }}
                        className="w-full pr-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Enter guest name"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Guest Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.guestEmail}
                        onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                        style={{ paddingLeft: '36px' }}
                        className="w-full pr-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="guest@company.com"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Company and Title Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company
                      </label>
                      <div className="relative">
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <Building className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={formData.guestCompany}
                          onChange={(e) => handleInputChange('guestCompany', e.target.value)}
                          style={{ paddingLeft: '36px' }}
                          className="w-full pr-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                          placeholder="Company name"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={formData.guestTitle}
                        onChange={(e) => handleInputChange('guestTitle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Job title"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <Phone className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={formData.guestPhone}
                        onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                        style={{ paddingLeft: '36px' }}
                        className="w-full pr-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="+1 (555) 123-4567"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Personal Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Personal Message (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute left-2 top-3 pointer-events-none">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                      </div>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={3}
                        style={{ paddingLeft: '36px' }}
                        className="w-full pr-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors"
                        placeholder="Add a personal message to the invitation..."
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode('search')}
                      disabled={loading}
                      className="flex-1 border-gray-300 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                    >
                      Back to Search
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 ${isReminderMode 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                      } text-white`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          {isReminderMode ? 'Sending Reminder...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          {isReminderMode ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Send Reminder
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Send Invitation
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}