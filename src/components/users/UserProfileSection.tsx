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
      const currentYear = new Date().getFullYear()
      const now = new Date().toISOString().split('T')[0]

      // Get all trips for this user through trip_participants
      const { data: userTrips, error: tripsError } = await supabase
        .from('trip_participants')
        .select(`
          trips (
            id,
            start_date
          )
        `)
        .eq('user_id', user.id)

      if (tripsError) {
        console.error('Trip stats error:', tripsError)
        return
      }

      if (userTrips) {
        // Filter trips this year
        const tripsThisYear = userTrips.filter(tp => {
          const trip = tp.trips
          if (!trip || !trip.start_date) return false
          const tripYear = new Date(trip.start_date).getFullYear()
          return tripYear === currentYear
        })

        // Filter upcoming trips
        const upcomingTrips = userTrips.filter(tp => {
          const trip = tp.trips
          if (!trip || !trip.start_date) return false
          return trip.start_date >= now
        })

        setTripStats({
          tripsThisYear: tripsThisYear.length,
          upcomingTrips: upcomingTrips.length
        })
      }
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
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          profile_picture_url: formData.profile_picture_url,
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
                className="text-xl font-semibold text-gray-900 border-b-2 border-emerald-500 focus:outline-none px-1"
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
                    className="text-sm text-gray-900 border-b border-gray-300 focus:border-emerald-500 focus:outline-none w-full"
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
                    className="text-sm text-gray-900 border-b border-gray-300 focus:border-emerald-500 focus:outline-none w-full"
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
          </div>
        </div>
      </div>

      {/* Travel Heatmap - Medium screens and up */}
      <div className="hidden md:block mt-6 pt-6 border-t border-gray-200 dark:border-[#2a2a2a]">
        <TravelHeatmap userId={user?.id} year={new Date().getFullYear()} />
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