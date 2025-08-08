'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  Grid3X3,
  List,
  Download,
  Mail,
  Shield,
  Building2,
  Calendar,
  ChevronDown,
  User,
  Users,
  CheckSquare,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { UserPermissions, filterUsersForViewer } from '@/lib/permissions'
import UserEditModal from './UserEditModal'
import InviteUserModal from './InviteUserModal'

interface TeamManagementSectionProps {
  currentUser: any
  permissions: UserPermissions
}

export default function TeamManagementSection({ currentUser, permissions }: TeamManagementSectionProps) {
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, filterRole])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from('users').select('*')

      // Apply permission-based filtering at query level if possible
      if (!permissions.canViewAllUsers && currentUser?.company_id) {
        query = query.eq('company_id', currentUser.company_id)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Apply additional permission filtering
      const filteredData = filterUsersForViewer(data || [], currentUser)
      setUsers(filteredData)
      setFilteredUsers(filteredData)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterRole)
    }

    setFilteredUsers(filtered)
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id))
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleBulkAction = async (action: string) => {
    // Implement bulk actions like deactivate, export, etc.
    console.log('Bulk action:', action, selectedUsers)
  }

  const getUserTypeLabel = (userType: string) => {
    const labels: Record<string, string> = {
      'global_admin': 'Global Admin',
      'wolthers_staff': 'Wolthers Staff',
      'admin': 'Company Admin',
      'client': 'Client',
      'driver': 'Driver',
      'guest': 'Guest'
    }
    return labels[userType] || userType
  }

  const getUserTypeBadgeColor = (userType: string) => {
    const colors: Record<string, string> = {
      'global_admin': 'bg-red-100 text-red-800',
      'wolthers_staff': 'bg-emerald-100 text-emerald-800',
      'admin': 'bg-blue-100 text-blue-800',
      'client': 'bg-gray-100 text-gray-800',
      'driver': 'bg-amber-100 text-amber-800',
      'guest': 'bg-gray-50 text-gray-600'
    }
    return colors[userType] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center space-x-2 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin"></div>
          <span>Loading team members...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => { setFilterRole('all'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      All Roles
                    </button>
                    <button
                      onClick={() => { setFilterRole('wolthers_staff'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'wolthers_staff' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Wolthers Staff
                    </button>
                    <button
                      onClick={() => { setFilterRole('admin'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'admin' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Company Admins
                    </button>
                    <button
                      onClick={() => { setFilterRole('client'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'client' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Clients
                    </button>
                    <button
                      onClick={() => { setFilterRole('driver'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'driver' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Drivers
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Add User Button */}
            {permissions.canInviteUsers && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-blue-800">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="inline-flex items-center px-3 py-1 border border-blue-300 rounded text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              {permissions.canDeleteUsers && (
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="inline-flex items-center px-3 py-1 border border-red-300 rounded text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Deactivate
                </button>
              )}
            </div>
          </div>
        )}

        {/* Users Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                className="relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Selection Checkbox */}
                {permissions.canEditCompanyUsers || permissions.canEditAllUsers ? (
                  <div className="absolute top-4 right-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                ) : null}

                {/* User Info */}
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold">
                    {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {user.full_name || 'Unnamed User'}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadgeColor(user.user_type)}`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {user.company_name && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Building2 className="w-3 h-3 mr-1" />
                      {user.company_name}
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  {user.last_login_at && (
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      Last active {new Date(user.last_login_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(permissions.canEditCompanyUsers || permissions.canEditAllUsers) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Edit
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-700">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {(permissions.canEditCompanyUsers || permissions.canEditAllUsers) && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    {(permissions.canEditCompanyUsers || permissions.canEditAllUsers) && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-semibold">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeBadgeColor(user.user_type)}`}>
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.company_name || 'Wolthers & Associates'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(permissions.canEditCompanyUsers || permissions.canEditAllUsers) && (
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterRole !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by inviting team members'}
            </p>
            {permissions.canInviteUsers && (
              <div className="mt-6">
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite User
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && editingUser && (
        <UserEditModal
          user={editingUser}
          permissions={permissions}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onSave={() => {
            fetchUsers()
            setShowEditModal(false)
            setEditingUser(null)
          }}
        />
      )}

      {showInviteModal && (
        <InviteUserModal
          currentUser={currentUser}
          permissions={permissions}
          onClose={() => setShowInviteModal(false)}
          onInvite={() => {
            fetchUsers()
            setShowInviteModal(false)
          }}
        />
      )}
    </>
  )
}