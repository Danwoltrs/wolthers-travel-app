'use client'

import { useState } from 'react'
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  Calendar,
  MapPin,
  Edit2,
  Save,
  X,
  Bell,
  MessageSquare,
  Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface UserProfileSectionProps {
  user: any
  isOwnProfile: boolean
  onUpdate?: () => void
}

export default function UserProfileSection({ user, isOwnProfile, onUpdate }: UserProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    notification_preferences: user?.notification_preferences || {
      email: true,
      whatsapp: false,
      in_app: true
    }
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          timezone: formData.timezone,
          notification_preferences: formData.notification_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setIsEditing(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getUserTypeLabel = (userType: string) => {
    const labels: Record<string, string> = {
      'global_admin': 'Global Administrator',
      'wolthers_staff': 'Wolthers Staff',
      'admin': 'Company Administrator',
      'client': 'Client',
      'driver': 'Driver',
      'guest': 'Guest'
    }
    return labels[userType] || userType
  }

  const getUserTypeBadgeColor = (userType: string) => {
    const colors: Record<string, string> = {
      'global_admin': 'bg-red-100 text-red-800 border-red-200',
      'wolthers_staff': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'admin': 'bg-blue-100 text-blue-800 border-blue-200',
      'client': 'bg-gray-100 text-gray-800 border-gray-200',
      'driver': 'bg-amber-100 text-amber-800 border-amber-200',
      'guest': 'bg-gray-50 text-gray-600 border-gray-200'
    }
    return colors[userType] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          
          {/* Basic Info */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="text-xl font-semibold text-gray-900 border-b-2 border-emerald-500 focus:outline-none px-1"
              />
            ) : (
              <h3 className="text-xl font-semibold text-gray-900">{user?.full_name}</h3>
            )}
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUserTypeBadgeColor(user?.user_type)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {getUserTypeLabel(user?.user_type)}
              </span>
              {user?.microsoft_oauth_id && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  Microsoft Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        {isOwnProfile && (
          <div>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact Information</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Add phone number"
                    className="text-sm text-gray-900 border-b border-gray-300 focus:border-emerald-500 focus:outline-none w-full"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">WhatsApp</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="Add WhatsApp number"
                    className="text-sm text-gray-900 border-b border-gray-300 focus:border-emerald-500 focus:outline-none w-full"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{user?.whatsapp || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Organization & Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Organization & Settings</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Building2 className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm text-gray-900">{user?.company_name || 'Wolthers & Associates'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Timezone</p>
                {isEditing ? (
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="text-sm text-gray-900 border-b border-gray-300 focus:border-emerald-500 focus:outline-none w-full"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-900">{user?.timezone || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="text-sm text-gray-900">
                  {user?.last_login_at 
                    ? new Date(user.last_login_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      {isOwnProfile && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            <Bell className="inline w-4 h-4 mr-2" />
            Notification Preferences
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notification_preferences.email}
                onChange={(e) => setFormData({
                  ...formData,
                  notification_preferences: {
                    ...formData.notification_preferences,
                    email: e.target.checked
                  }
                })}
                disabled={!isEditing}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Email Notifications</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notification_preferences.whatsapp}
                onChange={(e) => setFormData({
                  ...formData,
                  notification_preferences: {
                    ...formData.notification_preferences,
                    whatsapp: e.target.checked
                  }
                })}
                disabled={!isEditing}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">WhatsApp Notifications</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notification_preferences.in_app}
                onChange={(e) => setFormData({
                  ...formData,
                  notification_preferences: {
                    ...formData.notification_preferences,
                    in_app: e.target.checked
                  }
                })}
                disabled={!isEditing}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">In-App Notifications</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}