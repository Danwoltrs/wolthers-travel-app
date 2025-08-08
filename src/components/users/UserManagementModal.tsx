'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getUserPermissions } from '@/lib/permissions'
import UserProfileSection from './UserProfileSection'
import TeamManagementSection from './TeamManagementSection'
import { X, User, Users as UsersIcon } from 'lucide-react'

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !isAuthenticated) return null

  const permissions = getUserPermissions(user)
  const showTeamTab = permissions.canViewCompanyUsers || permissions.canViewAllUsers

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 dark:bg-emerald-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-emerald-200/30 dark:border-emerald-800/40 w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-200/30 dark:border-emerald-800/40 bg-gradient-to-r from-amber-50/80 to-white/80 dark:from-amber-900/20 dark:to-emerald-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-latte-800 dark:text-green-50">User Management</h2>
              <p className="text-sm text-pearl-600 dark:text-pearl-300 mt-1">
                Manage your profile and {showTeamTab ? 'team members' : 'account settings'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-pearl-500 dark:text-pearl-400 hover:text-latte-800 dark:hover:text-green-50 hover:bg-white/20 dark:hover:bg-emerald-500/20 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          {showTeamTab && (
            <div className="mt-4 flex space-x-1 bg-white/40 dark:bg-emerald-900/40 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-white dark:bg-emerald-800/60 text-latte-800 dark:text-green-50 shadow-sm'
                    : 'text-pearl-600 dark:text-pearl-300 hover:text-latte-800 dark:hover:text-green-50'
                }`}
              >
                <User className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('team')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'team'
                    ? 'bg-white dark:bg-emerald-800/60 text-latte-800 dark:text-green-50 shadow-sm'
                    : 'text-pearl-600 dark:text-pearl-300 hover:text-latte-800 dark:hover:text-green-50'
                }`}
              >
                <UsersIcon className="w-4 h-4" />
                {permissions.canViewAllUsers ? 'All Users' : 'Team Members'}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {activeTab === 'profile' ? (
            <div className="bg-white/90 dark:bg-emerald-900/20">
              <UserProfileSection user={user} isOwnProfile={true} />
            </div>
          ) : (
            <div className="bg-white/90 dark:bg-emerald-900/20">
              <TeamManagementSection 
                currentUser={user} 
                permissions={permissions} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}