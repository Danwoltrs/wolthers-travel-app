'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  Download,
  Mail,
  Shield,
  Building2,
  Calendar,
  ChevronDown,
  User,
  Users,
  CheckSquare,
  X,
  Copy,
  Check,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  Plane
} from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { UserPermissions, filterUsersForViewer } from '@/lib/permissions'
import { maskEmail, formatLastLogin, copyToClipboard, formatNumber, truncatePhone } from '@/lib/utils'
import UserEditModal from './UserEditModal'
import InviteUserModal from './InviteUserModal'

interface TeamManagementSectionProps {
  currentUser: any
  permissions: UserPermissions
}

interface UserWithStats extends any {
  trip_stats?: {
    total_trips: number
    trips_this_year: number
    upcoming_trips: number
    most_visited_destination?: string
  }
}

type SortField = 'full_name' | 'email' | 'phone' | 'user_type' | 'company_name' | 'last_login_at' | 'created_at' | 'total_trips' | 'trips_this_year' | 'upcoming_trips'
type SortDirection = 'asc' | 'desc'

export default function TeamManagementSection({ currentUser, permissions }: TeamManagementSectionProps) {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [copiedEmails, setCopiedEmails] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, filterRole, sortField, sortDirection])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from('users').select(`
        *,
        companies!users_company_id_fkey(name)
      `)

      // Apply permission-based filtering at query level if possible
      if (!permissions.canViewAllUsers && currentUser?.company_id) {
        query = query.eq('company_id', currentUser.company_id)
      }

      const { data: usersData, error: usersError } = await query.order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch trip statistics and login location for each user
      const usersWithStats: UserWithStats[] = await Promise.all(
        (usersData || []).map(async (user) => {
          const stats = await fetchUserTripStats(user.id)
          const lastLoginLocation = await getLastLoginLocation(user.id, user.last_login_at)
          return {
            ...user,
            company_name: user.companies?.name || 'Wolthers & Associates',
            trip_stats: stats,
            last_login_location: lastLoginLocation
          }
        })
      )

      // Apply additional permission filtering
      const filteredData = filterUsersForViewer(usersWithStats, currentUser)
      setUsers(filteredData)
      setFilteredUsers(filteredData)
    } catch (error) {
      console.error('Error fetching users:', error)
      showToast('Failed to load users', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserTripStats = async (userId: string) => {
    try {
      const currentYear = new Date().getFullYear()
      const now = new Date().toISOString()

      // Get total trips count
      const { count: totalTrips } = await supabase
        .from('trip_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get trips this year count
      const { count: tripsThisYear } = await supabase
        .from('trip_participants')
        .select('trips!inner(*)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('trips.start_date', `${currentYear}-01-01`)
        .lte('trips.start_date', `${currentYear}-12-31`)

      // Get upcoming trips count
      const { count: upcomingTrips } = await supabase
        .from('trip_participants')
        .select('trips!inner(*)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gt('trips.start_date', now)

      return {
        total_trips: totalTrips || 0,
        trips_this_year: tripsThisYear || 0,
        upcoming_trips: upcomingTrips || 0,
        most_visited_destination: undefined
      }
    } catch (error) {
      console.error('Error fetching trip stats for user:', userId, error)
      return {
        total_trips: 0,
        trips_this_year: 0,
        upcoming_trips: 0,
        most_visited_destination: undefined
      }
    }
  }

  const getLastLoginLocation = async (userId: string, lastLoginAt: string | null) => {
    try {
      if (!lastLoginAt) return null
      
      // Check if we have a user sessions table or auth logs
      const { data: sessionData } = await supabase
        .from('user_sessions')
        .select('location, ip_address, country, city')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (sessionData?.city && sessionData?.country) {
        return `${sessionData.city}, ${sessionData.country}`
      }
      
      // Fallback: try to get location based on timezone or other data
      const { data: userData } = await supabase
        .from('users')
        .select('last_login_timezone, timezone')
        .eq('id', userId)
        .single()
      
      if (userData?.last_login_timezone || userData?.timezone) {
        const tz = userData.last_login_timezone || userData.timezone
        // Simple timezone to location mapping
        const timezoneLocations: Record<string, string> = {
          'Europe/Copenhagen': 'Copenhagen, DK',
          'Europe/Amsterdam': 'Amsterdam, NL', 
          'Europe/Berlin': 'Berlin, DE',
          'Europe/London': 'London, UK',
          'America/New_York': 'New York, US',
          'America/Los_Angeles': 'Los Angeles, US',
          'America/Sao_Paulo': 'São Paulo, BR',
          'America/Mexico_City': 'Mexico City, MX',
          'America/Chicago': 'Chicago, US',
          'Asia/Tokyo': 'Tokyo, JP',
          'Asia/Shanghai': 'Shanghai, CN',
          'Australia/Sydney': 'Sydney, AU',
          'UTC': null
        }
        return timezoneLocations[tz] || null
      }
      
      return null
      
    } catch (error) {
      console.error('Error fetching login location for user:', userId, error)
      return null
    }
  }

  const applyFilters = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterRole)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'full_name':
          aValue = a.full_name || ''
          bValue = b.full_name || ''
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'phone':
          aValue = a.phone || ''
          bValue = b.phone || ''
          break
        case 'user_type':
          aValue = a.user_type || ''
          bValue = b.user_type || ''
          break
        case 'company_name':
          aValue = a.company_name || ''
          bValue = b.company_name || ''
          break
        case 'last_login_at':
          aValue = a.last_login_at ? new Date(a.last_login_at).getTime() : 0
          bValue = b.last_login_at ? new Date(b.last_login_at).getTime() : 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'total_trips':
          aValue = a.trip_stats?.total_trips || 0
          bValue = b.trip_stats?.total_trips || 0
          break
        case 'trips_this_year':
          aValue = a.trip_stats?.trips_this_year || 0
          bValue = b.trip_stats?.trips_this_year || 0
          break
        case 'upcoming_trips':
          aValue = a.trip_stats?.upcoming_trips || 0
          bValue = b.trip_stats?.upcoming_trips || 0
          break
        default:
          aValue = a[sortField]
          bValue = b[sortField]
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc' 
          ? (aValue > bValue ? 1 : -1)
          : (aValue < bValue ? 1 : -1)
      }
    })

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
    console.log('Bulk action:', action, selectedUsers)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const [copiedPhones, setCopiedPhones] = useState<Set<string>>(new Set())

  const handleCopyEmail = async (email: string) => {
    const success = await copyToClipboard(email)
    if (success) {
      setCopiedEmails(prev => new Set(prev.add(email)))
      showToast('Email copied to clipboard', 'success')
      
      setTimeout(() => {
        setCopiedEmails(prev => {
          const newSet = new Set(prev)
          newSet.delete(email)
          return newSet
        })
      }, 2000)
    } else {
      showToast('Failed to copy email', 'error')
    }
  }

  const handleCopyPhone = async (phone: string) => {
    const sanitizedPhone = phone.replace(/[^\d+]/g, '')
    const success = await copyToClipboard(sanitizedPhone)
    if (success) {
      setCopiedPhones(prev => new Set(prev.add(phone)))
      showToast('Phone number copied to clipboard', 'success')
      
      setTimeout(() => {
        setCopiedPhones(prev => {
          const newSet = new Set(prev)
          newSet.delete(phone)
          return newSet
        })
      }, 2000)
    } else {
      showToast('Failed to copy phone number', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />
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

  const getAccountStatus = (lastLoginAt: string | null) => {
    if (!lastLoginAt) {
      return { status: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
    }
    
    const lastLogin = new Date(lastLoginAt)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= 7) {
      return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' }
    } else if (daysDiff <= 30) {
      return { status: 'recent', label: 'Recent', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { status: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const isUserOnline = (user: any) => {
    // If this is the current user viewing the page, they're definitely online
    if (currentUser && user.id === currentUser.id) {
      return true
    }
    
    if (!user.last_login_at) return false
    
    const lastLogin = new Date(user.last_login_at)
    const now = new Date()
    const minutesDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60))
    
    // Consider user online if last login was within 30 minutes
    return minutesDiff <= 30
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
      <div className="px-0 pt-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6 px-6">
          <div className="relative w-80">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-600 dark:text-golden-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
              className="w-full pr-4 py-2 border border-pearl-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:focus:ring-golden-400 focus:border-emerald-500 dark:focus:border-golden-400 text-sm text-emerald-800 dark:text-white"
            />
          </div>

          <div className="flex-1"></div>

          <div className="flex gap-2">
            <div className="hidden sm:flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4 mr-2" />
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              {searchTerm || filterRole !== 'all' ? ` (filtered)` : ''}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="inline-flex items-center px-4 py-2 border border-pearl-200 dark:border-gray-700 rounded-lg text-sm font-medium text-emerald-800 dark:text-golden-400 bg-white dark:bg-[#1a1a1a] hover:bg-emerald-50 dark:hover:bg-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-golden-400"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              
              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-[#1a1a1a] ring-1 ring-pearl-200 dark:ring-gray-700 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => { setFilterRole('all'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'all' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-golden-400' : 'text-emerald-800 dark:text-golden-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/50'}`}
                    >
                      All Roles
                    </button>
                    <button
                      onClick={() => { setFilterRole('wolthers_staff'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'wolthers_staff' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-golden-400' : 'text-emerald-800 dark:text-golden-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/50'}`}
                    >
                      Wolthers Staff
                    </button>
                    <button
                      onClick={() => { setFilterRole('admin'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'admin' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-golden-400' : 'text-emerald-800 dark:text-golden-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/50'}`}
                    >
                      Company Admins
                    </button>
                    <button
                      onClick={() => { setFilterRole('client'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'client' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-golden-400' : 'text-emerald-800 dark:text-golden-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/50'}`}
                    >
                      Clients
                    </button>
                    <button
                      onClick={() => { setFilterRole('driver'); setShowFilterMenu(false) }}
                      className={`block w-full text-left px-4 py-2 text-sm ${filterRole === 'driver' ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-golden-400' : 'text-emerald-800 dark:text-golden-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/50'}`}
                    >
                      Drivers
                    </button>
                  </div>
                </div>
              )}
            </div>

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

        {selectedUsers.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-emerald-50 to-amber-50 dark:from-emerald-900 dark:to-amber-900 border border-emerald-200 dark:border-emerald-700 flex items-center justify-between opacity-80 px-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-emerald-700 dark:text-amber-400 hover:text-emerald-800 dark:hover:text-amber-300 font-medium"
              >
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-emerald-800 dark:text-amber-400">
                {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('export')}
                className="inline-flex items-center px-3 py-1 border border-emerald-300 dark:border-emerald-700 rounded text-sm font-medium text-emerald-700 dark:text-amber-400 bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
              {permissions.canDeleteUsers && (
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="inline-flex items-center px-3 py-1 border border-red-300 dark:border-red-700 rounded text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900"
                >
                  <X className="w-4 h-4 mr-1" />
                  Deactivate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-900 w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-pearl-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-emerald-800 to-emerald-900 dark:from-emerald-900 dark:to-emerald-950">
              {/* First row - grouped headers */}
              <tr>
                {(permissions.canEditCompanyUsers || permissions.canEditAllUsers) && (
                  <th className="px-4 py-6 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                )}
                
                <th className="px-2 py-6 text-left w-48 max-w-48">
                  <button 
                    onClick={() => handleSort('full_name')}
                    className="group flex items-center space-x-1 text-xs font-semibold text-white dark:text-amber-400 uppercase tracking-wider hover:text-amber-200 dark:hover:text-amber-300"
                  >
                    <span>Name</span>
                    {getSortIcon('full_name')}
                  </button>
                </th>
                
                <th className="px-2 py-6 text-left w-36 max-w-36">
                  <button 
                    onClick={() => handleSort('email')}
                    className="group flex items-center space-x-1 text-xs font-semibold text-white dark:text-amber-400 uppercase tracking-wider hover:text-amber-200 dark:hover:text-amber-300"
                  >
                    <span>Contact</span>
                    {getSortIcon('email')}
                  </button>
                </th>
                
                <th className="px-6 py-6 text-left hidden md:table-cell">
                  <button 
                    onClick={() => handleSort('company_name')}
                    className="group flex items-center space-x-1 text-xs font-semibold text-white dark:text-amber-400 uppercase tracking-wider hover:text-amber-200 dark:hover:text-amber-300"
                  >
                    <span>Company</span>
                    {getSortIcon('company_name')}
                  </button>
                </th>
                
                <th className="px-4 py-6 text-left hidden lg:table-cell w-28 max-w-28">
                  <button 
                    onClick={() => handleSort('user_type')}
                    className="group flex items-center space-x-1 text-xs font-semibold text-white dark:text-amber-400 uppercase tracking-wider hover:text-amber-200 dark:hover:text-amber-300"
                  >
                    <span>Role</span>
                    {getSortIcon('user_type')}
                  </button>
                </th>
                
                <th className="px-2 py-6 text-left hidden md:table-cell">
                  <button 
                    onClick={() => handleSort('last_login_at')}
                    className="group flex items-center space-x-1 text-xs font-semibold text-white dark:text-amber-400 uppercase tracking-wider hover:text-amber-200 dark:hover:text-amber-300"
                  >
                    <span>Last Login</span>
                    {getSortIcon('last_login_at')}
                  </button>
                </th>
                
                {/* Grouped trips header */}
                <th colSpan={3} className="px-2 py-6 text-center hidden lg:table-cell relative">
                  <div className="flex flex-col h-full">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">TRIPS</span>
                    <div className="absolute bottom-1 left-0 right-0 flex text-[10px] text-white/60 normal-case">
                      <span className="flex-1 text-center">Total</span>
                      <span className="flex-1 text-center">YTD</span>
                      <span className="flex-1 text-center">Upcoming</span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-pearl-200 dark:divide-gray-700">
              {filteredUsers.map((user, index) => {
                return (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-20 ${
                      index % 2 === 0 
                        ? 'bg-white dark:bg-[#1A1A1A]' 
                        : 'bg-gray-100 dark:bg-[#242424]'
                    }`}
                  >
                    {(permissions.canEditCompanyUsers || permissions.canEditAllUsers) && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 dark:bg-gray-800"
                        />
                      </td>
                    )}
                    
                    <td className="px-2 py-4 whitespace-nowrap w-48 max-w-48">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-left w-full group relative flex items-center"
                        aria-label={`Edit user ${user.full_name}`}
                      >
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {user.full_name || 'Unnamed User'}
                        </div>
                        <Edit className="ml-2 w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-xs text-gray-500 dark:text-gray-400 lg:hidden">
                          {getUserTypeLabel(user.user_type)}
                        </div>
                      </button>
                    </td>
                    
                    <td className="px-2 py-4 whitespace-nowrap w-36 max-w-36">
                      <div className="flex flex-col space-y-0.5">
                        <div className="flex items-center space-x-1 max-w-full">
                          <button
                            onClick={() => handleCopyEmail(user.email)}
                            className="inline-flex items-center justify-center w-4 h-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 mr-1"
                            title="Copy full email"
                          >
                            {copiedEmails.has(user.email) ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0" title={user.email}>
                            {user.email}
                          </span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center space-x-1 max-w-full">
                            <button
                              onClick={() => handleCopyPhone(user.phone)}
                              className="inline-flex items-center justify-center w-4 h-4 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 mr-1"
                              title="Copy phone number"
                            >
                              {copiedPhones.has(user.phone) ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[calc(100%-2rem)]" title={user.phone}>
                              {truncatePhone(user.phone)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      <span className="truncate">
                        {user.company_name ? user.company_name.split(' ')[0] : 'Wolthers'}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4 hidden lg:table-cell w-28 max-w-28">
                      <span className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </td>

                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                      <div className="flex flex-col">
                        {isUserOnline(user) ? (
                          <>
                            <span className="text-xs font-medium text-green-500 dark:text-green-300">Online</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(user.last_login_at).toLocaleDateString()}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-medium">{formatLastLogin(user.last_login_at)}</span>
                            {user.last_login_at && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(user.last_login_at).toLocaleDateString()}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-2 py-4 whitespace-nowrap text-center hidden lg:table-cell w-16 max-w-16">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {formatNumber(user.trip_stats?.total_trips || 0)}
                      </span>
                    </td>
                    
                    <td className="px-2 py-4 whitespace-nowrap text-center hidden lg:table-cell w-16 max-w-16">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {user.trip_stats?.trips_this_year || 0}
                      </span>
                    </td>
                    
                    <td className="px-2 py-4 whitespace-nowrap text-center hidden lg:table-cell w-16 max-w-16">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {user.trip_stats?.upcoming_trips || 0}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="bg-white dark:bg-gray-900 border border-pearl-200 dark:border-gray-700 rounded-lg text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterRole !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by inviting team members'}
          </p>
          {permissions.canInviteUsers && (
            <div className="mt-6">
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Invite User
              </button>
            </div>
          )}
        </div>
      )}
      
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${
            toast.type === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {toast.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

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