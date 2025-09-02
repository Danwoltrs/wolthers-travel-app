'use client'

import { useState, useEffect } from 'react'
import { X, User, Loader2, Check } from 'lucide-react'

interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  whatsapp?: string
  user_type: 'admin' | 'user' | 'viewer'
  is_global_admin: boolean
  company_id?: string
}

interface Company {
  id: string
  name: string
  fantasy_name?: string
}

interface UserEditModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onUserUpdated?: (updatedUser: User) => void
  currentUserId?: string // ID of the user performing the edit
}

export default function UserEditModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  currentUserId
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        whatsapp: user.whatsapp || '',
        user_type: user.user_type,
        is_global_admin: user.is_global_admin,
        company_id: user.company_id
      })
    }
  }, [user])

  // Fetch companies for company selection
  useEffect(() => {
    if (isOpen) {
      fetchCompanies()
    }
  }, [isOpen])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  const fetchCompanies = async () => {
    setIsLoadingCompanies(true)
    try {
      const [buyersResponse, suppliersResponse] = await Promise.all([
        fetch('/api/companies/buyers', { credentials: 'include' }),
        fetch('/api/companies/suppliers', { credentials: 'include' })
      ])

      const [buyersData, suppliersData] = await Promise.all([
        buyersResponse.json(),
        suppliersResponse.json()
      ])

      const wolthersCompany: Company = {
        id: '840783f4-866d-4bdb-9b5d-5d0facf62db0',
        name: 'Wolthers & Associates',
        fantasy_name: 'Wolthers Santos'
      }

      const allCompanies = [
        wolthersCompany,
        ...(buyersData.companies || []),
        ...(suppliersData.companies || [])
      ]

      setCompanies(allCompanies)
    } catch (err) {
      console.error('Failed to fetch companies:', err)
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    // Prevent users from removing their own global admin status
    if (user.id === currentUserId && user.is_global_admin && formData.is_global_admin === false) {
      setError('You cannot remove your own global administrator status.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      setSuccessMessage('User updated successfully!')
      onUserUpdated?.(data.user)
      
      // Close modal after brief delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const userTypeOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
    { value: 'viewer', label: 'Viewer' }
  ]

  const isEditingSelf = user.id === currentUserId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit User
            </h2>
          </div>
          <button
            onClick={isLoading ? undefined : onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg text-green-800 dark:text-green-200">
                <Check className="w-5 h-5" />
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="full_name"
                required
                value={formData.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Phone & WhatsApp */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  id="whatsapp"
                  value={formData.whatsapp || ''}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company
              </label>
              <select
                id="company_id"
                value={formData.company_id || ''}
                onChange={(e) => handleInputChange('company_id', e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading || isLoadingCompanies}
              >
                <option value="">No Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.fantasy_name || company.name}
                  </option>
                ))}
              </select>
              {isLoadingCompanies && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading companies...</p>
              )}
            </div>

            {/* User Type */}
            <div>
              <label htmlFor="user_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                User Type *
              </label>
              <select
                id="user_type"
                required
                value={formData.user_type || ''}
                onChange={(e) => handleInputChange('user_type', e.target.value as User['user_type'])}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoading}
              >
                {userTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Admin */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_global_admin || false}
                  onChange={(e) => handleInputChange('is_global_admin', e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  disabled={isLoading || (isEditingSelf && user.is_global_admin)}
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Global Administrator
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Can manage all companies and users in the system
                    {isEditingSelf && user.is_global_admin && (
                      <span className="text-amber-600 dark:text-amber-400 block">
                        You cannot remove your own global admin status
                      </span>
                    )}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}