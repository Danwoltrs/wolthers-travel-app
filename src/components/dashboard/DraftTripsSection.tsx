'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Trash2, Share2, Calendar, Building2, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface DraftTrip {
  id: string
  trip_id?: string
  title: string
  trip_type: string
  current_step: number
  completion_percentage: number
  created_at: string
  updated_at: string
  last_accessed_at: string
  access_code?: string
  draft_data: any
  expires_at?: string
}

interface DraftTripsSectionProps {
  onContinueTrip: (draftData: any) => void
}

export default function DraftTripsSection({ onContinueTrip }: DraftTripsSectionProps) {
  const [drafts, setDrafts] = useState<DraftTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDraftTrips()
  }, [])

  const loadDraftTrips = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('supabase-token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('/api/trips/drafts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setDrafts(data.drafts || [])

    } catch (error) {
      console.error('Failed to load draft trips:', error)
      setError('Failed to load draft trips')
    } finally {
      setLoading(false)
    }
  }


  const handleDelete = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return
    }

    try {
      console.log('Deleting draft with ID:', draftId)
      
      const response = await fetch(`/api/trips/drafts/${draftId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      console.log('Delete response status:', response.status)

      if (response.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId))
        console.log('Draft deleted successfully')
      } else {
        const error = await response.json()
        console.error('Delete error response:', error)
        alert(`Failed to delete draft: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete draft. Please try again.')
    }
  }

  const copyShareLink = (accessCode: string) => {
    const shareUrl = `${window.location.origin}/trips/continue/${accessCode}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStepName = (step: number, tripType: string) => {
    if (tripType === 'convention') {
      const steps = ['Trip Type', 'Event Search', 'Basic Information', 'Team & Travel', 'Review & Create']
      return steps[step - 1] || 'Unknown Step'
    } else if (tripType === 'in_land') {
      const steps = ['Trip Type', 'Basic Information', 'Itinerary Builder', 'Team & Vehicles', 'Review & Create']
      return steps[step - 1] || 'Unknown Step'
    }
    return `Step ${step}`
  }

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false
    const expiry = new Date(expiresAt)
    const now = new Date()
    const threeDays = 3 * 24 * 60 * 60 * 1000
    return expiry.getTime() - now.getTime() < threeDays
  }

  if (loading) {
    return (
      <div className="mb-12">
        <div className="section-lane-draft mb-6">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
            Draft Trips
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Continue where you left off
          </p>
        </div>
        <div className="text-center py-8">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading drafts...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-12">
        <div className="section-lane-draft mb-6">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
            Draft Trips
          </h2>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Continue where you left off
          </p>
        </div>
        <div className="text-center py-8 text-red-500 dark:text-red-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (drafts.length === 0) {
    return null // Don't show section if no drafts
  }

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="section-lane-draft mb-6">
        <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200">
          Draft Trips
        </h2>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Continue where you left off • {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Draft Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {drafts.map((draft) => (
          <div 
            key={draft.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500 dark:border-blue-400 p-4"
          >
            {/* Draft Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {draft.title || `${draft.trip_type.replace('_', ' ').toUpperCase()} Trip`}
                </h3>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>Last edited {formatDate(draft.updated_at)}</span>
                </div>
              </div>
              {isExpiringSoon(draft.expires_at) && (
                <div className="ml-2 flex-shrink-0">
                  <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Expires soon
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                <span>{getStepName(draft.current_step, draft.trip_type)}</span>
                <span>{draft.completion_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 dark:bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${draft.completion_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Trip Info */}
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="capitalize">{draft.trip_type.replace('_', ' ')} Trip</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Step {draft.current_step} of 5</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2">
              
              {draft.access_code && (
                <button
                  onClick={() => copyShareLink(draft.access_code!)}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm py-2 px-3 rounded-lg transition-colors"
                  title="Copy share link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={() => handleDelete(draft.id)}
                className="bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm py-2 px-3 rounded-lg transition-colors"
                title="Delete draft"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Clock className="w-3 h-3 text-white" />
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Draft trips are automatically saved</p>
            <p className="text-blue-700 dark:text-blue-300">
              Your progress is saved every few seconds while creating trips. Drafts expire after 30 days of inactivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}