'use client'

import { useState } from 'react'
import { X, Mail, UserPlus, AlertCircle, User, Phone } from 'lucide-react'

interface UserInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  companyName: string
  onInvitationSent: (invitation: any) => void
}

const roles = [
  { value: 'staff', label: 'Staff', description: 'Basic user with limited permissions' },
  { value: 'driver', label: 'Driver', description: 'Can manage vehicle and transport logistics' },
  { value: 'manager', label: 'Manager', description: 'Can manage team and company resources' },
  { value: 'admin', label: 'Admin', description: 'Full access to company management' }
]

export default function UserInvitationModal({ 
  isOpen, 
  onClose, 
  companyId, 
  companyName,
  onInvitationSent 
}: UserInvitationModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [role, setRole] = useState<string>('staff')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/user-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email,
          whatsapp: whatsapp.trim(),
          companyId,
          role,
          message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(data.message)
      onInvitationSent(data.invitation)
      
      // Reset form
      setName('')
      setEmail('')
      setWhatsapp('')
      setRole('staff')
      setMessage('')
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(null)
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setName('')
      setEmail('')
      setWhatsapp('')
      setRole('staff')
      setMessage('')
      setError(null)
      setSuccess(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] w-full max-w-md">
          {/* Header */}
          <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-white dark:text-golden-400" />
              <h3 className="text-lg font-semibold text-white dark:text-golden-400">
                Invite User to {companyName}
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <Mail className="w-4 h-4" />
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading || !!success}
                  style={{ paddingLeft: '36px' }}
                  className="w-full pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading || !!success}
                  style={{ paddingLeft: '36px' }}
                  className="w-full pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50"
                  placeholder="user@company.com"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp Number
              </label>
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Phone className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  disabled={isLoading || !!success}
                  style={{ paddingLeft: '36px' }}
                  className="w-full pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50"
                  placeholder="+55 11 9xxxx-xxxx"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                disabled={isLoading || !!success}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading || !!success}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50"
                placeholder="Add a personal message to the invitation..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim() || !email.trim() || !!success}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}