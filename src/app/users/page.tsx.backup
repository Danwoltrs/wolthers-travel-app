'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getUserPermissions } from '@/lib/permissions'
import UserProfileSection from '@/components/users/UserProfileSection'
import TeamManagementSection from '@/components/users/TeamManagementSection'
import { Loader2 } from 'lucide-react'

export default function UsersPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/')
      } else {
        setIsLoading(false)
      }
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user management...</p>
        </div>
      </div>
    )
  }

  const permissions = getUserPermissions(user)
  const showTeamSection = permissions.canViewCompanyUsers || permissions.canViewAllUsers

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-pearl-50 dark:from-[#0E3D2F] dark:via-[#1A4B3A] dark:to-[#0E3D2F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-36 sm:mt-28">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-latte-800 dark:text-green-50">User Management</h1>
          <p className="mt-2 text-pearl-600 dark:text-pearl-300">
            Manage your profile and {showTeamSection ? 'team members' : 'account settings'}
          </p>
        </div>

        {/* User's Own Profile Section */}
        <div className="bg-white/90 dark:bg-emerald-900/20 backdrop-blur-sm rounded-lg shadow-sm border border-emerald-200/30 dark:border-emerald-800/40 mb-8">
          <div className="px-6 py-4 border-b border-emerald-200/30 dark:border-emerald-800/40 bg-gradient-to-r from-amber-50/80 to-white/80 dark:from-amber-900/20 dark:to-emerald-900/10">
            <h2 className="text-lg font-semibold text-latte-800 dark:text-green-50">My Profile</h2>
            <p className="text-sm text-pearl-600 dark:text-pearl-300 mt-1">Manage your personal information and preferences</p>
          </div>
          <UserProfileSection user={user} isOwnProfile={true} />
        </div>

        {/* Horizontal Separator - Microsoft Style */}
        {showTeamSection && (
          <>
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-emerald-200/40 dark:border-emerald-700/40"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-gradient-to-br from-emerald-50 to-white dark:from-[#0E3D2F] dark:to-[#1A4B3A] text-sm font-medium text-pearl-600 dark:text-pearl-300">
                  Team & Organization
                </span>
              </div>
            </div>

            {/* Team Management Section */}
            <div className="bg-white/90 dark:bg-emerald-900/20 backdrop-blur-sm rounded-lg shadow-sm border border-emerald-200/30 dark:border-emerald-800/40">
              <div className="px-6 py-4 border-b border-emerald-200/30 dark:border-emerald-800/40 bg-gradient-to-r from-amber-50/80 to-white/80 dark:from-amber-900/20 dark:to-emerald-900/10">
                <h2 className="text-lg font-semibold text-latte-800 dark:text-green-50">
                  {permissions.canViewAllUsers ? 'All Users' : 'Team Members'}
                </h2>
                <p className="text-sm text-pearl-600 dark:text-pearl-300 mt-1">
                  {permissions.canViewAllUsers 
                    ? 'Manage users across all organizations' 
                    : 'View and manage your team members'}
                </p>
              </div>
              <TeamManagementSection 
                currentUser={user} 
                permissions={permissions} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}