'use client'

import { useState } from 'react'
import { X, Save, Shield, Building2, Phone, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { UserPermissions } from '@/lib/permissions'

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
      const updateData: any = {
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        updated_at: new Date().toISOString()
      }

      // Only allow role changes if user has permission
      if (permissions.canAssignRoles) {
        updateData.user_type = formData.user_type
        updateData.can_view_all_trips = formData.can_view_all_trips
        updateData.can_view_company_trips = formData.can_view_company_trips
        updateData.is_global_admin = formData.is_global_admin
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      if (error) throw error

      onSave()
    } catch (error) {
      console.error('Error updating user:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="inline w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MessageSquare className="inline w-4 h-4 mr-1" />
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Role & Permissions - Only show if user has permission to assign roles */}
            {permissions.canAssignRoles && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                  <Shield className="inline w-4 h-4 mr-1" />
                  Role & Permissions
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Role
                    </label>
                    <select
                      value={formData.user_type}
                      onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="guest">Guest</option>
                      <option value="client">Client</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Company Administrator</option>
                      <option value="wolthers_staff">Wolthers Staff</option>
                      {permissions.canEditAllUsers && (
                        <option value="global_admin">Global Administrator</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.is_global_admin}
                        onChange={(e) => setFormData({ ...formData, is_global_admin: e.target.checked })}
                        disabled={!permissions.canEditAllUsers}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Global Administrator</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.can_view_all_trips}
                        onChange={(e) => setFormData({ ...formData, can_view_all_trips: e.target.checked })}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Can view all trips</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.can_view_company_trips}
                        onChange={(e) => setFormData({ ...formData, can_view_company_trips: e.target.checked })}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Can view company trips</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Account Information - Read Only */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">User ID</p>
                  <p className="font-mono text-xs text-gray-700">{user.id}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="text-gray-700">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                {user.last_login_at && (
                  <div>
                    <p className="text-gray-500">Last Login</p>
                    <p className="text-gray-700">
                      {new Date(user.last_login_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {user.microsoft_oauth_id && (
                  <div>
                    <p className="text-gray-500">Microsoft ID</p>
                    <p className="font-mono text-xs text-gray-700">
                      {user.microsoft_oauth_id.substring(0, 12)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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