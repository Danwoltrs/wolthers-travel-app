import React, { useState } from 'react'
import { X, MessageCircle, Send } from 'lucide-react'

interface PersonalMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (message: string) => void
  hostName: string
  companyName: string
  isLoading?: boolean
}

export default function PersonalMessageModal({
  isOpen,
  onClose,
  onSend,
  hostName,
  companyName,
  isLoading = false
}: PersonalMessageModalProps) {
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    onSend(message.trim())
  }

  const handleSkip = () => {
    onSend('') // Send empty message to skip
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg max-w-lg w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Add Personal Message</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Would you like to include a personal message for <strong>{hostName}</strong> at <strong>{companyName}</strong>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This message will be included in the visit confirmation email and will help personalize your invitation.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="personal-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                id="personal-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! We're excited to visit your facilities and learn more about your coffee operations. Looking forward to meeting your team and discussing potential collaboration opportunities..."
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors"
                maxLength={500}
                disabled={isLoading}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Add a personal touch to make your invitation more engaging
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {message.length}/500
                </span>
              </div>
            </div>

            {/* Preview */}
            {message.trim() && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border-l-4 border-emerald-500">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{message.trim()}"</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 text-right mt-2">— You</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                disabled={isLoading}
              >
                Skip Message
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{message.trim() ? 'Send with Message' : 'Send Invitation'}</span>
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