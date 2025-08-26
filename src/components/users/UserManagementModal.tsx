'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const { user, isAuthenticated, refreshUserProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile')
  const [isMounted, setIsMounted] = useState(false)
  
  // Enhanced refresh function that includes logging
  const handleProfileUpdate = async () => {
    console.log('🔄 UserManagementModal: Profile update triggered')
    await refreshUserProfile()
    console.log('✅ UserManagementModal: Profile update completed')
  }

  // Ensure component is mounted before using portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

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

  if (!isOpen || !isAuthenticated || !isMounted) return null

  const permissions = getUserPermissions(user)
  const showTeamTab = permissions.canViewCompanyUsers || permissions.canViewAllUsers

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-[9999] p-2 md:p-4">
      <div className="bg-[#EDE4D3] dark:bg-[#1a1a1a] rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto border border-pearl-200 dark:border-[#2a2a2a]">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] px-3 md:px-6 py-4 relative flex items-center justify-between border-b border-pearl-200 dark:border-[#0a2e21]">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-emerald-600 dark:text-golden-400">User Management</h2>
              <p className="text-sm text-white dark:text-gray-300 mt-1">
                Manage your profile and {showTeamTab ? 'team members' : 'account settings'}
              </p>
            </div>
            
            {/* Tab Buttons in Header */}
            {showTeamTab && (
              <div className="flex space-x-1 bg-yellow-200 dark:bg-black/20 p-1 rounded-lg mx-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 md:px-6 py-1.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'bg-emerald-600 text-white rounded-md shadow-sm dark:bg-emerald-800/80 dark:text-golden-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-emerald-800 dark:hover:text-golden-400'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={() => setActiveTab('team')}
                  className={`px-4 md:px-6 py-1.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === 'team'
                      ? 'bg-emerald-600 text-white rounded-md shadow-sm dark:bg-emerald-800/80 dark:text-golden-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-emerald-800 dark:hover:text-golden-400'
                  }`}
                >
                  <UsersIcon className="w-4 h-4" />
                  {permissions.canViewAllUsers ? 'All Users' : 'Team Members'}
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

        </div>

        {/* Content */}
        <div className="p-3 md:p-6 space-y-6">
          {activeTab === 'profile' ? (
            <div className="bg-[#F5F1E8] dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
              <UserProfileSection user={user} isOwnProfile={true} onUpdate={handleProfileUpdate} />
            </div>
          ) : (
            <div className="bg-[#F5F1E8] dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
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

  return createPortal(modalContent, document.body)
}