'use client'

import { useState, useRef, useEffect } from 'react'
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
  Upload,
  Camera,
  Plane
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import TravelHeatmap from './TravelHeatmap'

interface UserProfileSectionProps {
  user: any
  isOwnProfile: boolean
  onUpdate?: () => void
}

export default function UserProfileSection({ user, isOwnProfile, onUpdate }: UserProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tripStats, setTripStats] = useState({ tripsThisYear: 0, upcomingTrips: 0 })
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    profile_picture_url: user?.profile_picture_url || '',
    notification_preferences: user?.notification_preferences || {
      email: true,
      whatsapp: false,
      in_app: true
    }
  })

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      whatsapp: user?.whatsapp || '',
      profile_picture_url: user?.profile_picture_url || '',
      notification_preferences: user?.notification_preferences || {
        email: true,
        whatsapp: false,
        in_app: true
      }
    })
    setIsEditing(false)
    setLastSaveTime(null) // Clear any "just saved" indicator
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Please select an image smaller than 2MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData({ ...formData, profile_picture_url: result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setFormData({ ...formData, profile_picture_url: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getInitials = () => {
    const name = user?.full_name || 'U'
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()
  }

  const fetchTripStats = async () => {
    if (!user?.id) return

    try {
      // Use authenticated API endpoint instead of direct Supabase calls
      const authToken = localStorage.getItem('auth-token')
      if (!authToken) {
        console.error('No authentication token found for trip stats')
        return
      }

      console.log('UserProfile: Fetching trip statistics via authenticated API...')
      const response = await fetch('/api/user/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error' }))
        console.error('Trip stats API error:', errorData)
        return
      }

      const stats = await response.json()
      console.log('UserProfile: Received trip statistics:', stats)

      setTripStats({
        tripsThisYear: stats.tripsThisYear,
        upcomingTrips: stats.upcomingTrips
      })
    } catch (error) {
      console.error('Error fetching trip stats:', error)
    }
  }

  useEffect(() => {
    fetchTripStats()
  }, [user?.id])

  const handleSave = async () => {
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
      
      // Validate WhatsApp number format if provided
      if (formData.whatsapp && !/^[+]?[0-9\s\-\(\)]{7,}$/.test(formData.whatsapp)) {
        throw new Error('Please enter a valid WhatsApp number')
      }

      // Get auth token
      const authToken = localStorage.getItem('auth-token')
      if (!authToken) {
        throw new Error('Authentication required')
      }

      // Call API endpoint to update profile
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          updates: {
            full_name: formData.full_name,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            profile_picture_url: formData.profile_picture_url,
            notification_preferences: formData.notification_preferences
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const result = await response.json()
      console.log('Profile updated successfully:', result)

      // Update the last save time
      setLastSaveTime(result.updated_at)
      
      // Clear the "Just saved" indicator after 5 seconds
      setTimeout(() => {
        setLastSaveTime(null)
      }, 5000)
      
      // Update the form data with any server-side changes
      if (result.user) {
        setFormData({
          full_name: result.user.full_name || '',
          email: result.user.email || '',
          phone: result.user.phone || '',
          whatsapp: result.user.whatsapp || '',
          profile_picture_url: result.user.profile_picture_url || '',
          notification_preferences: result.user.notification_preferences || {
            email: true,
            whatsapp: false,
            in_app: true
          }
        })
      }

      setIsEditing(false)
      if (onUpdate) onUpdate()
      
      // Show success message
      const successMessage = document.createElement('div')
      successMessage.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-600 text-white flex items-center space-x-2'
      successMessage.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-sm font-medium">Profile updated successfully!</span>'
      document.body.appendChild(successMessage)
      setTimeout(() => {
        document.body.removeChild(successMessage)
      }, 3000)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = document.createElement('div')
      errorMessage.className = 'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg bg-red-600 text-white flex items-center space-x-2'
      errorMessage.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="6 18L18 6M6 6l12 12"></path></svg><span class="text-sm font-medium">Error: ${error.message}</span>`
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
      'global_admin': 'bg-red-100 text-red-800 border-red-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
      'wolthers_staff': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
      'admin': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
      'client': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
      'driver': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
      'guest': 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    }
    return colors[userType] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
  }

  return (
    <div className="">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            {formData.profile_picture_url ? (
              <img
                src={formData.profile_picture_url}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                {getInitials()}
              </div>
            )}
            
            {/* Upload button overlay when editing */}
            {isEditing && isOwnProfile && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-white hover:text-emerald-300 transition-colors"
                  title="Upload photo"
                >
                  <Camera className="w-6 h-6" />
                </button>
                {formData.profile_picture_url && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-white hover:text-red-300 transition-colors ml-2"
                    title="Remove photo"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
            )}
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          
          {/* Basic Info */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-pearl-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-golden-400 focus:border-emerald-500 dark:focus:border-golden-400 text-xl font-semibold text-emerald-800 dark:text-white bg-white dark:bg-[#1a1a1a]"
                placeholder="Enter full name"
              />
            ) : (
              <h3 className="text-xl font-semibold text-gray-900 dark:text-amber-400">{user?.full_name}</h3>
            )}
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUserTypeBadgeColor(user?.user_type)}`}>
                <Shield className="w-3 h-3 mr-1" />
                {getUserTypeLabel(user?.user_type)}
              </span>
              {user?.microsoft_oauth_id && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
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
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:bg-emerald-600 dark:text-yellow-400 dark:border-emerald-600 dark:hover:bg-emerald-700"
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
          <h4 className="text-sm font-semibold text-gray-900 dark:text-amber-300 uppercase tracking-wider">Contact Information</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-900 dark:text-white">{user?.email}</p>
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
                    className="w-full px-3 py-2 border border-pearl-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-golden-400 focus:border-emerald-500 dark:focus:border-golden-400 text-sm text-emerald-800 dark:text-white bg-white dark:bg-[#1a1a1a]"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">{user?.phone || 'Not provided'}</p>
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
                    className="w-full px-3 py-2 border border-pearl-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-golden-400 focus:border-emerald-500 dark:focus:border-golden-400 text-sm text-emerald-800 dark:text-white bg-white dark:bg-[#1a1a1a]"
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">{user?.whatsapp || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Organization & Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-amber-300 uppercase tracking-wider">Organization & Settings</h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Building2 className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm text-gray-900 dark:text-white">{user?.company_name || 'Wolthers & Associates'}</p>
              </div>
            </div>


            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Last Login</p>
                <p className="text-sm text-gray-900 dark:text-white">
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

            {/* Trip Statistics */}
            <div className="flex items-center space-x-3">
              <Plane className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Trip Statistics</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {tripStats.tripsThisYear} trips this year | {tripStats.upcomingTrips} upcoming trips
                </p>
              </div>
            </div>

            {/* Profile Update History */}
            <div className="flex items-center space-x-3">
              <Edit2 className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Profile Last Updated</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {lastSaveTime 
                    ? (
                        <span className="flex items-center space-x-1">
                          <span>{new Date(lastSaveTime).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ml-2">
                            Just saved
                          </span>
                        </span>
                      )
                    : user?.last_profile_update 
                      ? new Date(user.last_profile_update).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : user?.updated_at
                        ? new Date(user.updated_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never updated'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Travel Heatmap - Medium screens and up */}
      <div className="hidden md:block mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
        <TravelHeatmap userId={user?.id} />
      </div>

      {/* Notification Preferences */}
      {isOwnProfile && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-amber-300 uppercase tracking-wider mb-4">
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
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
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
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">WhatsApp Notifications</span>
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
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 dark:bg-[#1a1a1a] dark:border-[#2a2a2a]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">In-App Notifications</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}