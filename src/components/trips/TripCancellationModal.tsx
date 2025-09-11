import React, { useState } from 'react'
import { X, AlertTriangle, Mail, Users } from 'lucide-react'

interface TripCancellationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (sendNotifications: boolean, reason?: string) => void
  tripTitle: string
  tripAccessCode: string
  participantCount: number
  loading?: boolean
}

export default function TripCancellationModal({
  isOpen,
  onClose,
  onConfirm,
  tripTitle,
  tripAccessCode,
  participantCount,
  loading = false
}: TripCancellationModalProps) {
  const [sendNotifications, setSendNotifications] = useState(true)
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(sendNotifications, reason.trim() || undefined)
  }

  const handleClose = () => {
    if (!loading) {
      setReason('')
      setSendNotifications(true)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] border border-red-200 dark:border-red-800/30 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 dark:bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-lg font-medium">Cancel Trip</h2>
          </div>
          {!loading && (
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Trip Details */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
            <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
              {tripTitle}
            </h3>
            <p className="text-sm text-red-600 dark:text-red-300">
              Trip Code: {tripAccessCode}
            </p>
          </div>

          {/* Warning Message */}
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to cancel this trip? This action cannot be undone.
            </p>
            
            {participantCount > 0 && (
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  {participantCount} participant{participantCount !== 1 ? 's' : ''} will be affected
                </span>
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cancellation Reason (Optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
              rows={3}
              placeholder="Provide a reason for cancellation (optional)..."
              disabled={loading}
            />
          </div>

          {/* Email Notification Option */}
          {participantCount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="sendNotifications"
                    checked={sendNotifications}
                    onChange={(e) => setSendNotifications(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500 focus:ring-2"
                    disabled={loading}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="sendNotifications" className="flex items-center space-x-2 cursor-pointer">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Email all stakeholders
                    </span>
                  </label>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Send cancellation notification to all trip participants and company representatives
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-[#2a2a2a] px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            disabled={loading}
          >
            Keep Trip
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Cancel Trip</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}