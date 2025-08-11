'use client'

import { useState } from 'react'
import { X, Save, Shield, Building2, Phone, MessageSquare, Calendar, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { UserPermissions } from '@/lib/permissions'
import TravelHeatmap from './TravelHeatmap'

interface UserEditModalProps {
  user: any
  permissions: UserPermissions
  onClose: () => void
  onSave: () => void
}

export default function UserEditModal({ user, permissions, onClose, onSave }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    whatsapp: user.whatsapp || '',
    user_type: user.user_type || 'client',
    can_view_all_trips: user.can_view_all_trips || false,
    can_view_company_trips: user.can_view_company_trips || false,
    is_global_admin: user.is_global_admin || false,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Basic validation
      if (!formData.full_name.trim()) {
        throw new Error('Full name is required')
      }
      
      // Validate phone number format if provided
      if (formData.phone && !/^[+]?[0-9\s\-\(\)]{7,}$/.test(formData.phone)) {
        throw new Error('Please enter a valid phone number')
      }
      
      // Validate WhatsApp number format if provided - must include country code
      if (formData.whatsapp) {
        if (!/^\+\d{1,4}\s?\d{2,}\s?\d[\d\s\-\(\)]*$/.test(formData.whatsapp)) {
          throw new Error('WhatsApp number must include country code (e.g., +55 13 98123 9867)')
        }
        const digitsOnly = formData.whatsapp.replace(/[^\d]/g, '')
        if (digitsOnly.length < 8) {
          throw new Error('WhatsApp number too short - must include country code')
        }
      }

      const updateData: any = {
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
      }

      // Only allow role changes if user has permission
      if (permissions.canAssignRoles) {
        updateData.user_type = formData.user_type
        updateData.can_view_all_trips = formData.can_view_all_trips
        updateData.can_view_company_trips = formData.can_view_company_trips
        updateData.is_global_admin = formData.is_global_admin
      }

      // Get auth token for API request
      const authToken = localStorage.getItem('auth-token')
      if (!authToken) {
        throw new Error('Authentication required')
      }

      console.log('🔄 Updating user via API endpoint:', user.id)
      
      // Use the API endpoint instead of direct Supabase calls
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          updates: updateData
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ User updated successfully:', result)

      // Show success message
      const successMessage = document.createElement('div')
      successMessage.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-600 text-white flex items-center space-x-2'
      successMessage.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-sm font-medium">User updated successfully!</span>'
      document.body.appendChild(successMessage)
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage)
        }
      }, 3000)

      onSave()
    } catch (error) {
      console.error('❌ Error updating user:', error)
      
      // Show error message
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-red-600 text-white flex items-center space-x-2'
      errorMessage.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg><span class="text-sm font-medium">Error: ${error instanceof Error ? error.message : 'Unknown error'}</span>`
      document.body.appendChild(errorMessage)
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage)
        }
      }, 5000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] shadow-xl rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-golden-400 dark:bg-[#09261d] border-b border-pearl-200 dark:border-[#0a2e21] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white dark:text-golden-400">Edit User</h2>
          <button
            onClick={onClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-[#1a1a1a] overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-golden-600 dark:text-golden-400 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-gray-50 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-golden-600 dark:text-golden-400 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MessageSquare className="inline w-4 h-4 mr-1" />
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions - Only show if user has permission to assign roles */}
            {permissions.canAssignRoles && (
              <div>
                <h3 className="text-sm font-medium text-golden-600 dark:text-golden-400 mb-4">
                  <Shield className="inline w-4 h-4 mr-1" />
                  Role & Permissions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      User Role
                    </label>
                    <select
                      value={formData.user_type}
                      onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="guest">Guest</option>
                      <option value="client">Client</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Company Administrator</option>
                      <option value="wolthers_staff">Wolthers Staff</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.is_global_admin}
                        onChange={(e) => setFormData({ ...formData, is_global_admin: e.target.checked })}
                        disabled={!permissions.canEditAllUsers}
                        className="rounded border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] text-emerald-400 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Global Administrator</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.can_view_all_trips}
                        onChange={(e) => setFormData({ ...formData, can_view_all_trips: e.target.checked })}
                        className="rounded border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] text-emerald-400 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Can view all trips</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.can_view_company_trips}
                        onChange={(e) => setFormData({ ...formData, can_view_company_trips: e.target.checked })}
                        className="rounded border-gray-300 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] text-emerald-400 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Can view company trips</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Account Information - Read Only */}
            <div>
              <h3 className="text-sm font-medium text-golden-600 dark:text-golden-400 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                {user.last_login_at && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Last Login</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Date(user.last_login_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Last Modified</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Travel Statistics */}
            <div>
              <TravelHeatmap userId={user.id} compact={true} />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#2a2a2a] flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-[#2a2a2a] rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}