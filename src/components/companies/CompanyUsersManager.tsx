'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Search, Filter, Mail, Phone } from 'lucide-react'

interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  user_type: 'admin' | 'user' | 'viewer'
  is_active: boolean
  last_login?: string
  created_at: string
  company?: {
    name: string
  }
}

interface CompanyUsersManagerProps {
  companyId: string
  companyName: string
  isWolthers?: boolean
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function CompanyUsersManager({ companyId, companyName, isWolthers = false }: CompanyUsersManagerProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'user' | 'viewer'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [companyId])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterType])

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
        setUsers(usersList)
        console.log(`[CompanyUsersManager] Loaded ${usersList.length} users for ${companyName}`)
        
        // Clear any previous errors if successful
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
      case 'user': return 'User'
      case 'viewer': return 'Viewer'
      default: return 'User'
    }
  }

  const getStatusBadge = (isActive: boolean, lastLogin?: string): JSX.Element => {
    if (lastLogin && new Date(lastLogin) > new Date(Date.now() - 5 * 60 * 1000)) {
      return (
        <span className="text-green-400 font-medium">
          Online
        </span>
      )
    }
    
    return (
      <span className="text-gray-400">
        {formatDate(lastLogin)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a2e1e] via-[#0f3d28] to-[#1a5c3a]">
        <div className="animate-pulse space-y-4 p-8">
          <div className="h-8 bg-gray-600 rounded w-1/3"></div>
          <div className="h-16 bg-gray-600 rounded"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a2e1e] via-[#0f3d28] to-[#1a5c3a] p-8">
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a2e1e] via-[#0f3d28] to-[#1a5c3a]">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F5F1E8] to-[#EDE4D3] px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2D5347]">
              {isWolthers ? 'User Management' : `${companyName} Users`}
            </h1>
            <p className="text-[#5A7C6F] mt-1">
              {isWolthers ? 'Manage your profile and team members' : `Manage ${companyName} team members`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2D5347] hover:bg-[#1f3b31] text-golden-400 rounded-lg font-medium transition-colors">
              <Users className="w-4 h-4" />
              My Profile
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
              <Users className="w-4 h-4" />
              All Users
            </button>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-white/70" />
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#F5F1E8] text-gray-900 pl-10 pr-4 py-2 rounded-md border-0 focus:ring-2 focus:ring-emerald-500 placeholder-gray-500"
                style={{ minWidth: '300px' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{filteredUsers.length} users</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
            {isWolthers && (
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Invite User
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#1E293B] px-6 py-4 border-b border-gray-700">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-amber-400">
              <div className="col-span-1">
                <input type="checkbox" className="rounded" />
              </div>
              <div className="col-span-3">NAME</div>
              <div className="col-span-3">CONTACT</div>
              <div className="col-span-2">COMPANY</div>
              <div className="col-span-1">ROLE</div>
              <div className="col-span-2">LAST LOGIN</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-800">
            {filteredUsers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400 mb-4">
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
                  className={`px-6 py-4 hover:bg-gray-900/50 transition-colors ${
                    index % 2 === 0 ? 'bg-[#FFFDF9]' : 'bg-[#FCFAF4]'
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <input type="checkbox" className="rounded" />
                    </div>
                    
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {user.full_name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="text-gray-700">
                        {companyName || 'Wolthers'}
                      </span>
                    </div>
                    
                    <div className="col-span-1">
                      <span className="text-gray-700">
                        {getRoleColor(user.user_type)}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      {getStatusBadge(user.is_active, user.last_login)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}