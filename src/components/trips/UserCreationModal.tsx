import React, { useState } from 'react'
import { X, User, Mail, Phone, Building2 } from 'lucide-react'
import type { User as UserType, Company } from '@/types'
import { UserRole } from '@/types'

interface UserCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onUserCreated: (user: UserType) => void
  preSelectedCompanyId?: string
  availableCompanies: Company[]
}

interface UserFormData {
  fullName: string
  email: string
  phone: string
  companyId: string
  role: UserRole
  notes: string
}

const initialFormData: UserFormData = {
  fullName: '',
  email: '',
  phone: '',
  companyId: '',
  role: UserRole.VISITOR,
  notes: ''
}

export default function UserCreationModal({ 
  isOpen, 
  onClose, 
  onUserCreated, 
  preSelectedCompanyId,
  availableCompanies 
}: UserCreationModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    ...initialFormData,
    companyId: preSelectedCompanyId || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const updateFormData = (updates: Partial<UserFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Replace with actual API call
      const newUser: UserType = {
        id: `temp-user-${Date.now()}`, // Will be replaced by backend
        email: formData.email,
        fullName: formData.fullName,
        companyId: formData.companyId || undefined,
        role: formData.role,
        permissions: {},
        lastLogin: undefined,
        isActive: true,
        createdAt: new Date()
      }

      onUserCreated(newUser)
      handleClose()
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      ...initialFormData,
      companyId: preSelectedCompanyId || ''
    })
    onClose()
  }

  const canSubmit = formData.fullName.trim().length > 0 && formData.email.trim().length > 0

  const selectedCompany = availableCompanies.find(c => c.id === formData.companyId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-xl shadow-xl border border-pearl-200 dark:border-[#2a2a2a] w-full h-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] flex flex-col overflow-auto sm:overflow-hidden">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-white dark:text-golden-400" />
            <h2 className="text-xl font-semibold text-white dark:text-golden-400">
              Add New Contact
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white dark:text-golden-400 hover:text-gray-200 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Selected Company Info */}
              {selectedCompany && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">
                      Adding contact for: {selectedCompany.fantasyName || selectedCompany.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData({ fullName: e.target.value })}
                  className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                  placeholder="e.g., João Silva"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => updateFormData({ email: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="joao.silva@company.com"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData({ phone: e.target.value })}
                    className="block w-full pl-10 pr-3 py-2 rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+55 11 9999-9999"
                  />
                </div>
              </div>

              {/* Company Selection */}
              {!preSelectedCompanyId && (
                <div>
                  <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company
                  </label>
                  <select
                    id="companyId"
                    value={formData.companyId}
                    onChange={(e) => updateFormData({ companyId: e.target.value })}
                    className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                  >
                    <option value="">Select Company (Optional)</option>
                    {availableCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.fantasyName || company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => updateFormData({ role: e.target.value as UserRole })}
                  className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                >
                  <option value={UserRole.VISITOR}>Visitor</option>
                  <option value={UserRole.VISITOR_ADMIN}>Visitor Admin</option>
                  <option value={UserRole.COMPANY_ADMIN}>Company Admin</option>
                  <option value={UserRole.HOST}>Host</option>
                  <option value={UserRole.GUEST}>Guest</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Role determines access permissions and trip visibility
                </p>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                  className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                  placeholder="Any additional information about this contact..."
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Quick Setup:</strong> Only name and email are required to continue with trip creation. 
                  Additional details can be updated later from the user management page.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-pearl-200 dark:border-[#2a2a2a] px-6 py-4 flex justify-between">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}