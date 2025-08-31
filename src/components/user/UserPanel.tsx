'use client'

import React, { useState } from 'react'
import { X, User, Key, Mail, Building, Shield, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface UserPanelProps {
  isOpen: boolean
  onClose: () => void
  focusPasswordChange?: boolean
}

interface PasswordData {
  current: string
  new: string
  confirm: string
}

const UserPanel: React.FC<UserPanelProps> = ({
  isOpen,
  onClose,
  focusPasswordChange = false
}) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(focusPasswordChange ? 'security' : 'profile')
  const [isVisible, setIsVisible] = useState(isOpen)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordData, setPasswordData] = useState<PasswordData>({
    current: '',
    new: '',
    confirm: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  React.useEffect(() => {
    setIsVisible(isOpen)
    if (isOpen && focusPasswordChange) {
      setActiveTab('security')
    }
  }, [isOpen, focusPasswordChange])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 150)
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
    setPasswordError('')
    setPasswordSuccess(false)
  }

  const validatePassword = (password: string): string[] => {
    const errors = []
    if (password.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter')
    if (!/\d/.test(password)) errors.push('One number')
    return errors
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess(false)

    // Validation
    if (!passwordData.new) {
      setPasswordError('Please enter a new password')
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('Passwords do not match')
      return
    }

    const passwordErrors = validatePassword(passwordData.new)
    if (passwordErrors.length > 0) {
      setPasswordError(`Password must have: ${passwordErrors.join(', ')}`)
      return
    }

    setIsUpdatingPassword(true)

    try {
      // API call to update password
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to update password')
        return
      }

      setPasswordSuccess(true)
      setPasswordData({ current: '', new: '', confirm: '' })
      
      setTimeout(() => {
        setPasswordSuccess(false)
      }, 3000)

    } catch (error) {
      setPasswordError('Network error. Please try again.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
        <div
          className={cn(
            "relative bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-xl shadow-2xl",
            "border border-pearl-200 dark:border-[#2a2a2a]",
            "w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] overflow-auto sm:overflow-hidden",
            "transform transition-all duration-200 flex flex-col",
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
          )}
        >
          {/* Header */}
          <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white dark:text-golden-400">
                User Profile
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-white/20 dark:hover:bg-golden-400/20 transition-colors"
              >
                <X className="w-5 h-5 text-white dark:text-golden-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-golden-400 dark:bg-[#09261d] px-6 border-b border-golden-300 dark:border-[#0a2e21]">
            <div className="flex space-x-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === 'profile'
                    ? "border-white dark:border-golden-300 text-white dark:text-golden-300"
                    : "border-transparent text-white/70 dark:text-golden-400/70 hover:text-white dark:hover:text-golden-300"
                )}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={cn(
                  "py-3 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === 'security'
                    ? "border-white dark:border-golden-300 text-white dark:text-golden-300"
                    : "border-transparent text-white/70 dark:text-golden-400/70 hover:text-white dark:hover:text-golden-300"
                )}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Security
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Name
                    </label>
                    <div className="px-3 py-2 border border-pearl-200 dark:border-[#2a2a2a] rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {user?.name || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <div className="px-3 py-2 border border-pearl-200 dark:border-[#2a2a2a] rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {user?.email}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      Role
                    </label>
                    <div className="px-3 py-2 border border-pearl-200 dark:border-[#2a2a2a] rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                      {user?.role?.replace('_', ' ') || 'Not assigned'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-2">Password & Security</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Set up a password to secure your account and enable faster sign-ins.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password (only show if user already has a password) */}
                  {!user?.otp_login && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.current}
                          onChange={(e) => handlePasswordChange('current', e.target.value)}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-golden-500 focus:border-golden-500"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.new}
                        onChange={(e) => handlePasswordChange('new', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-golden-500 focus:border-golden-500"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password requirements */}
                    {passwordData.new && (
                      <div className="mt-2 space-y-1">
                        {validatePassword(passwordData.new).map((error, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm}
                        onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-golden-500 focus:border-golden-500"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {passwordError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <span className="text-sm text-red-600 dark:text-red-400">{passwordError}</span>
                    </div>
                  )}

                  {/* Success message */}
                  {passwordSuccess && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-md">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-green-600 dark:text-green-400">Password updated successfully!</span>
                    </div>
                  )}

                  {/* Submit button */}
                  <Button
                    type="submit"
                    disabled={isUpdatingPassword || !passwordData.new || !passwordData.confirm}
                    className="w-full bg-golden-500 hover:bg-golden-600 dark:bg-golden-600 dark:hover:bg-golden-700 text-white font-medium py-2 transition-colors disabled:opacity-50"
                  >
                    {isUpdatingPassword ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating Password...
                      </div>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        {user?.otp_login ? 'Set Password' : 'Update Password'}
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default UserPanel