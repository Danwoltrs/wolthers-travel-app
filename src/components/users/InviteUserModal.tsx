'use client'

import { useState } from 'react'
import { X, Send, UserPlus, Mail, Shield, Building2, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { UserPermissions } from '@/lib/permissions'

interface InviteUserModalProps {
  currentUser: any
  permissions: UserPermissions
  onClose: () => void
  onInvite: () => void
}

export default function InviteUserModal({ currentUser, permissions, onClose, onInvite }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    user_type: 'client',
    company_id: currentUser?.company_id || null,
    send_email: true,
    custom_message: ''
  })
  const [isSending, setIsSending] = useState(false)
  const [bulkEmails, setBulkEmails] = useState('')
  const [inviteMode, setInviteMode] = useState<'single' | 'bulk'>('single')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)

    try {
      if (inviteMode === 'single') {
        // Create user account
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email: formData.email,
            full_name: formData.full_name,
            user_type: formData.user_type,
            company_id: formData.company_id,
            invited_by: currentUser.id,
            invitation_sent_at: new Date().toISOString(),
            is_global_admin: false,
            can_view_all_trips: formData.user_type === 'wolthers_staff',
            can_view_company_trips: formData.user_type === 'admin' || formData.user_type === 'wolthers_staff',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (userError) throw userError

        // Send invitation email if requested
        if (formData.send_email && newUser) {
          // Here you would implement email sending
          console.log('Sending invitation email to:', formData.email)
          // await sendInvitationEmail(newUser, formData.custom_message)
        }
      } else {
        // Bulk invite
        const emails = bulkEmails
          .split(/[\n,;]/)
          .map(e => e.trim())
          .filter(e => e && e.includes('@'))

        for (const email of emails) {
          const { error } = await supabase
            .from('users')
            .insert({
              email,
              full_name: email.split('@')[0],
              user_type: formData.user_type,
              company_id: formData.company_id,
              invited_by: currentUser.id,
              invitation_sent_at: new Date().toISOString(),
              is_global_admin: false,
              can_view_all_trips: false,
              can_view_company_trips: formData.user_type === 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (error) {
            console.error(`Failed to invite ${email}:`, error)
          }
        }
      }

      onInvite()
    } catch (error) {
      console.error('Error inviting user:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] flex flex-col overflow-auto sm:overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Invite Users</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Invite Mode Tabs */}
          <div className="mt-4 flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setInviteMode('single')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                inviteMode === 'single'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="inline w-4 h-4 mr-1" />
              Single Invite
            </button>
            <button
              type="button"
              onClick={() => setInviteMode('bulk')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                inviteMode === 'bulk'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="inline w-4 h-4 mr-1" />
              Bulk Invite
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {inviteMode === 'single' ? (
              <>
                {/* Single User Invite */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">User Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail className="inline w-4 h-4 mr-1" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Invitation Message (Optional)
                  </label>
                  <textarea
                    value={formData.custom_message}
                    onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                    placeholder="Add a personal message to the invitation email..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Bulk Invite */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Bulk Email Addresses</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Enter multiple email addresses separated by commas, semicolons, or new lines
                  </p>
                  <textarea
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    placeholder="user1@example.com, user2@example.com&#10;user3@example.com"
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {bulkEmails
                      .split(/[\n,;]/)
                      .filter(e => e.trim() && e.includes('@')).length} valid email{bulkEmails.split(/[\n,;]/).filter(e => e.trim() && e.includes('@')).length !== 1 ? 's' : ''} detected
                  </p>
                </div>
              </>
            )}

            {/* Role & Permissions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                <Shield className="inline w-4 h-4 mr-1" />
                Role & Access
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
                    {/* Roles for Wolthers & Associates staff members */}
                    {formData.company_id === null && permissions.canAssignRoles && (
                      <>
                        <option value="wolthers_staff">Staff - General team member</option>
                        <option value="wolthers_finance">Finance - Financial management</option>
                        <option value="car_manager">Car Manager - Fleet management</option>
                        <option value="admin">Company Admin - User management</option>
                      </>
                    )}
                    
                    {/* Roles for external users */}
                    {formData.company_id !== null && (
                      <>
                        <option value="guest">Guest - View only access</option>
                        <option value="client">Client - Standard user</option>
                        <option value="driver">Driver - Fleet access</option>
                        <option value="visitor">Visitor - Limited access</option>
                        <option value="visitor_admin">Visitor Admin - Manage visitors</option>
                        <option value="host">Host - Trip host</option>
                      </>
                    )}
                    
                    {/* Default fallback for external users if company_id is not set */}
                    {formData.company_id === '' && (
                      <>
                        <option value="guest">Guest - View only access</option>
                        <option value="client">Client - Standard user</option>
                        <option value="driver">Driver - Fleet access</option>
                        <option value="visitor">Visitor - Limited access</option>
                        <option value="visitor_admin">Visitor Admin - Manage visitors</option>
                        <option value="host">Host - Trip host</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Company Assignment - Only for global admins */}
                {permissions.canEditAllUsers && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building2 className="inline w-4 h-4 mr-1" />
                      Assign to Company
                    </label>
                    <select
                      value={formData.company_id || ''}
                      onChange={(e) => setFormData({ ...formData, company_id: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Wolthers & Associates (Default)</option>
                      {/* Here you would load companies from the database */}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Email Options */}
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.send_email}
                  onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  Send invitation email immediately
                </span>
              </label>
              <p className="mt-1 ml-7 text-xs text-gray-500">
                Users will receive an email with login instructions
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div className="text-sm text-gray-500">
            {inviteMode === 'single' 
              ? 'User will be created and invited'
              : `${bulkEmails.split(/[\n,;]/).filter(e => e.trim() && e.includes('@')).length} users will be invited`}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : inviteMode === 'single' ? 'Send Invite' : `Send ${bulkEmails.split(/[\n,;]/).filter(e => e.trim() && e.includes('@')).length} Invites`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}