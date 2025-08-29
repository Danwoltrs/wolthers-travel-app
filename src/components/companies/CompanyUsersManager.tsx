'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Search, Filter, Mail, Phone, Edit, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react'
import UserEditModal from '@/components/users/UserEditModal'
import UserInvitationModal from '@/components/companies/UserInvitationModal'
import { getUserPermissions } from '@/lib/permissions'
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  whatsapp?: string
  user_type: 'admin' | 'user' | 'viewer' | 'wolthers_staff'
  role?: 'staff' | 'driver' | 'manager' | 'admin'
  last_login_at?: string
  last_login?: string
  created_at: string
  company?: {
    name: string
  }
  trip_stats?: {
    total: number
    ytd: number
    upcoming: number
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  expires_at: string
  companies: {
    name: string
    fantasy_name?: string
  }
  invited_by_user: {
    full_name: string
    email: string
  }
}

interface CompanyUsersManagerProps {
  companyId: string
  companyName: string
  isWolthers?: boolean
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function CompanyUsersManager({ companyId, companyName, isWolthers = false }: CompanyUsersManagerProps) {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'user' | 'viewer'>('all')
  const [filterRole, setFilterRole] = useState<'all' | 'staff' | 'driver' | 'manager' | 'admin'>('all')
  const [currentTab, setCurrentTab] = useState<'users' | 'invitations'>('users')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchInvitations()
  }, [companyId])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterType, filterRole])

  const fetchUserTripStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/stats?userId=${userId}`, {
        method: 'GET',
        credentials: 'include',
        signal: AbortSignal.timeout(5000)
      })

      if (!response.ok) {
        console.warn(`⚠️ Stats API error for user ${userId}:`, response.status)
        return { total: 0, ytd: 0, upcoming: 0 }
      }

      const statsData = await response.json()
      return {
        total: statsData.totalTrips || 0,
        ytd: statsData.tripsThisYear || 0,
        upcoming: statsData.upcomingTrips || 0
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch trip stats for user ${userId}:`, error)
      return { total: 0, ytd: 0, upcoming: 0 }
    }
  }

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const endpoint = isWolthers 
        ? '/api/users/wolthers-staff'
        : `/api/companies/${companyId}/users`
      
      const response = await fetch(endpoint, { credentials: 'include' })
      const data = await response.json()
      
      if (response.ok) {
        const usersList = data.users || data.staff || []
        console.log(`[CompanyUsersManager] Loaded ${usersList.length} users for ${companyName}`)
        
        // Fetch trip statistics for each user
        console.log('📊 Fetching trip statistics for users...')
        const usersWithStats = await Promise.all(
          usersList.map(async (user: User, index: number) => {
            // Add small delay to avoid overwhelming the API
            if (index > 0 && index % 3 === 0) {
              await new Promise(resolve => setTimeout(resolve, 100))
            }
            
            const tripStats = await fetchUserTripStats(user.id)
            return {
              ...user,
              trip_stats: tripStats
            }
          })
        )
        
        setUsers(usersWithStats)
        setError(null)
      } else {
        const errorMessage = data.error || `Failed to fetch users for ${companyName}`
        setError(errorMessage)
        console.error(`[CompanyUsersManager] Error:`, errorMessage, data.details)
      }
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/user-invitations?companyId=${companyId}`, { 
        credentials: 'include' 
      })
      const data = await response.json()
      
      if (response.ok) {
        setInvitations(data.invitations || [])
        console.log(`[CompanyUsersManager] Loaded ${data.invitations?.length || 0} invitations for ${companyName}`)
      } else {
        console.warn('Failed to fetch invitations:', data.error)
        setInvitations([])
      }
    } catch (err) {
      console.warn('Error fetching invitations:', err)
      setInvitations([])
    }
  }

  const filterUsers = () => {
    let filtered = [...users]
    
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      )
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterType)
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }
    
    setFilteredUsers(filtered)
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleColor = (userType: string): string => {
    switch (userType) {
      case 'admin': return 'Global Admin'
      case 'wolthers_staff': return 'User'
      case 'user': return 'User'
      case 'viewer': return 'Viewer'
      default: return 'User'
    }
  }

  const getRoleBadgeColor = (role?: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      case 'manager': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'driver': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      case 'staff': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const formatRole = (role?: string): string => {
    if (!role) return 'Staff'
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const getStatusBadge = (isActive: boolean, lastLogin?: string): JSX.Element => {
    if (lastLogin) {
      const loginDate = new Date(lastLogin)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - loginDate.getTime())
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diffWeeks = Math.floor(diffDays / 7)
      
      // Online if within 30 minutes
      if (diffMinutes <= 30) {
        return (
          <span className="text-green-400 font-medium">
            Online
          </span>
        )
      }
      
      // Show relative time
      if (diffHours < 24) {
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {diffHours === 0 ? 'Just now' : diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`}
          </span>
        )
      } else if (diffWeeks >= 1) {
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`}
          </span>
        )
      } else if (diffDays >= 1) {
        return (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {diffDays === 1 ? '1 day ago' : `${diffDays} days ago`}
          </span>
        )
      }
    }
    
    return (
      <span className="text-xs text-gray-400 dark:text-gray-500">
        Never
      </span>
    )
  }

  const handleUserClick = (user: User) => {
    setEditingUser(user)
    setShowEditModal(true)
    console.log('Opening edit modal for user:', user)
  }

  const handleAddUser = () => {
    setShowInviteModal(true)
    console.log('Opening user invitation modal')
  }

  const handleInvitationSent = async (invitation: any) => {
    console.log('Invitation sent:', invitation)
    // Refresh invitations list
    await fetchInvitations()
  }

  const handleApproveInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/user-invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve' })
      })

      if (response.ok) {
        console.log('Invitation approved')
        await fetchInvitations()
      } else {
        const data = await response.json()
        console.error('Failed to approve invitation:', data.error)
      }
    } catch (error) {
      console.error('Error approving invitation:', error)
    }
  }

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/user-invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'reject' })
      })

      if (response.ok) {
        console.log('Invitation rejected')
        await fetchInvitations()
      } else {
        const data = await response.json()
        console.error('Failed to reject invitation:', data.error)
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/companies/${companyId}/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, role: newRole })
      })

      if (response.ok) {
        console.log('User role updated')
        await fetchUsers()
      } else {
        const data = await response.json()
        console.error('Failed to update user role:', data.error)
      }
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingUser(null)
  }

  const handleSaveUser = async () => {
    // Refresh users list after save
    await fetchUsers()
    handleCloseEditModal()
  }

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Title with company name */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
            Team Management - {companyName}
          </h4>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setCurrentTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentTab === 'users'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Users ({filteredUsers.length})
          </button>
          <button
            onClick={() => setCurrentTab('invitations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentTab === 'invitations'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Invitations ({invitations.filter(i => i.status === 'pending').length})
          </button>
        </div>
      </div>

      {/* Search bar with Add User button */}
      <div className="px-6 pb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={currentTab === 'users' ? "Search name or email" : "Search invitations"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px' }}
            className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
        
        {currentTab === 'users' && (
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as 'all' | 'staff' | 'driver' | 'manager' | 'admin')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="driver">Driver</option>
            <option value="staff">Staff</option>
          </select>
        )}
        
        <button
          onClick={() => handleAddUser()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Full width table */}
      <div className="w-full">
        {/* Table Header */}
        {currentTab === 'users' ? (
          <div className="bg-[#1E293B] px-6 py-4 border-b border-gray-700">
            <div className="flex gap-6 text-sm font-medium text-amber-400">
              <div className="flex-[3] min-w-0">NAME</div>
              <div className="flex-[1.5] min-w-0">CONTACT</div>
              <div className="flex-[1] min-w-0">ROLE</div>
              <div className="flex-[1.5] min-w-0">LAST LOGIN</div>
              <div className="flex-[2] min-w-0">
                <div className="text-center">
                  <div className="text-amber-400">TRIPS</div>
                  <div className="flex text-xs text-amber-300/70 mt-1">
                    <span className="flex-1 text-left">Total</span>
                    <span className="flex-1 text-center">YTD</span>
                    <span className="flex-1 text-right">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#1E293B] px-6 py-4 border-b border-gray-700">
            <div className="flex gap-6 text-sm font-medium text-amber-400">
              <div className="flex-[2] min-w-0">EMAIL</div>
              <div className="flex-[1] min-w-0">ROLE</div>
              <div className="flex-[1] min-w-0">STATUS</div>
              <div className="flex-[1.5] min-w-0">INVITED BY</div>
              <div className="flex-[1.5] min-w-0">CREATED</div>
              <div className="flex-[1] min-w-0">ACTIONS</div>
            </div>
          </div>
        )}

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {currentTab === 'users' ? (
            // Users Table
            <>
              {filteredUsers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm || filterType !== 'all' ? 'No users match your criteria' : 'No users found for this company'}
                  </p>
                  {!isWolthers && !searchTerm && filterType === 'all' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors mx-auto">
                      <Plus className="w-4 h-4" />
                      Add Users to {companyName}
                    </button>
                  )}
                </div>
              ) : (
                filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    onMouseEnter={() => setHoveredUser(user.id)}
                    onMouseLeave={() => setHoveredUser(null)}
                    className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative ${
                      index % 2 === 0 ? 'bg-[#FFFDF9] dark:bg-gray-900/30' : 'bg-[#FCFAF4] dark:bg-gray-800/30'
                    } ${selectedUser?.id === user.id ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                  >
                    <div className="flex gap-6 items-center">
                      
                      <div className="flex-[3] min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.full_name}
                          </span>
                          {hoveredUser === user.id && (
                            <button
                              onClick={() => handleUserClick(user)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                              title="Edit user"
                            >
                              <Edit className="w-3 h-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-[1.5] min-w-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {(user.phone || user.whatsapp) && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{user.whatsapp || user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-[1] min-w-0">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {formatRole(user.role)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-[1.5] min-w-0">
                        <div className="space-y-1">
                          <div className="text-gray-700 dark:text-gray-300">
                            {getStatusBadge(true, user.last_login_at || user.last_login)}
                          </div>
                          {(user.last_login_at || user.last_login) && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {formatDate(user.last_login_at || user.last_login)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-[2] min-w-0">
                        <div className="text-center space-y-1">
                          <div className="flex text-sm text-gray-700 dark:text-gray-300">
                            <span className="flex-1 text-left">{user.trip_stats?.total || 0}</span>
                            <span className="flex-1 text-center">{user.trip_stats?.ytd || 0}</span>
                            <span className="flex-1 text-right">{user.trip_stats?.upcoming || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            // Invitations Table
            invitations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  No invitations found for this company
                </p>
              </div>
            ) : (
              invitations.map((invitation, index) => (
                <div
                  key={invitation.id}
                  className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#FFFDF9] dark:bg-gray-900/30' : 'bg-[#FCFAF4] dark:bg-gray-800/30'
                  }`}
                >
                  <div className="flex gap-6 items-center">
                    <div className="flex-[2] min-w-0">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {invitation.email}
                      </span>
                    </div>
                    
                    <div className="flex-[1] min-w-0">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                        {formatRole(invitation.role)}
                      </span>
                    </div>
                    
                    <div className="flex-[1] min-w-0">
                      <div className="flex items-center gap-2">
                        {invitation.status === 'pending' && (
                          <>
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-yellow-700 dark:text-yellow-300 text-sm">Pending</span>
                          </>
                        )}
                        {invitation.status === 'approved' && (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-700 dark:text-green-300 text-sm">Approved</span>
                          </>
                        )}
                        {invitation.status === 'rejected' && (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-700 dark:text-red-300 text-sm">Rejected</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-[1.5] min-w-0">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>{invitation.invited_by_user.full_name}</div>
                        <div className="text-xs">{invitation.invited_by_user.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex-[1.5] min-w-0">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex-[1] min-w-0">
                      {invitation.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApproveInvitation(invitation.id)}
                            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(invitation.id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>

      {/* User Edit Modal */}
      {showEditModal && editingUser && currentUser && (
        <UserEditModal
          user={editingUser}
          permissions={getUserPermissions(currentUser)}
          onClose={handleCloseEditModal}
          onSave={handleSaveUser}
        />
      )}

      {/* User Invitation Modal */}
      <UserInvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        companyId={companyId}
        companyName={companyName}
        onInvitationSent={handleInvitationSent}
      />
    </div>
  )
}