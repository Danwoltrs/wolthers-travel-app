'use client'

import { useState, useEffect } from 'react'
import { Users, ChevronDown, ChevronRight, Eye, Building, Search, Mail, Phone, UserPlus, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import CompanyEditModal from '@/components/companies/CompanyEditModal'
import UserEditModal from '@/components/companies/UserEditModal'

interface Company {
  id: string
  name: string
  fantasy_name?: string
  category: 'buyer' | 'supplier' | 'service_provider'
  subcategories: string[]
  staff_count: number
  users?: User[]
  locations?: any[]
}

interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  user_type: 'admin' | 'user' | 'viewer'
  is_active: boolean
  last_login?: string
  company_id?: string
}

interface UnifiedUsersPanelProps {
  onViewDashboard: (company: Company) => void
  onAddUsers?: (company: Company) => void
  refreshTrigger?: number
}

export default function UnifiedUsersPanel({ onViewDashboard, onAddUsers, refreshTrigger = 0 }: UnifiedUsersPanelProps) {
  const { user: currentUser } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [companyUsers, setCompanyUsers] = useState<{ [companyId: string]: User[] }>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showCompanyEditModal, setShowCompanyEditModal] = useState(false)
  const [showUserEditModal, setShowUserEditModal] = useState(false)
  const [showDeleteCompanyModal, setShowDeleteCompanyModal] = useState(false)
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    refreshData()
  }, [refreshTrigger])

  const fetchCompanies = async () => {
    setError(null)
    try {
      // Fetch all companies (buyers + suppliers + Wolthers)
      const [buyersResponse, suppliersResponse] = await Promise.all([
        fetch('/api/companies/buyers', { credentials: 'include' }).catch(err => {
          console.warn('Failed to fetch buyers:', err)
          return { ok: false, json: () => Promise.resolve({ companies: [] }) }
        }),
        fetch('/api/companies/suppliers', { credentials: 'include' }).catch(err => {
          console.warn('Failed to fetch suppliers:', err)
          return { ok: false, json: () => Promise.resolve({ companies: [] }) }
        })
      ])

      const [buyersData, suppliersData] = await Promise.all([
        buyersResponse.json(),
        suppliersResponse.json()
      ])

      // Add Wolthers & Associates with proper ID to match the actual company
      const wolthersCompany: Company = {
        id: '840783f4-866d-4bdb-9b5d-5d0facf62db0', // Use actual Wolthers company ID
        name: 'Wolthers & Associates',
        fantasy_name: 'Wolthers Santos',
        category: 'service_provider',
        subcategories: ['laboratory'],
        staff_count: 4
      }

      const allCompanies = [
        wolthersCompany,
        ...(buyersData.companies || []),
        ...(suppliersData.companies || [])
      ]

      setCompanies(allCompanies)
    } catch (err) {
      setError('Failed to fetch companies')
      console.error('Error fetching companies:', err)
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    await fetchCompanies()
    const expanded = Array.from(expandedCompanies)
    setCompanyUsers({})
    await Promise.all(expanded.map(id => fetchCompanyUsers(id, true)))
    setIsLoading(false)
  }

  const fetchCompanyUsers = async (companyId: string, force = false) => {
    if (companyUsers[companyId] && !force) return // Already fetched

    try {
      const endpoint = companyId === '840783f4-866d-4bdb-9b5d-5d0facf62db0' 
        ? '/api/users/wolthers-staff'
        : `/api/companies/${companyId}/users`
      
      const response = await fetch(endpoint, { credentials: 'include' })
      const data = await response.json()
      
      setCompanyUsers(prev => ({
        ...prev,
        [companyId]: data.users || data.staff || []
      }))
    } catch (err) {
      console.error('Error fetching company users:', err)
      setCompanyUsers(prev => ({
        ...prev,
        [companyId]: []
      }))
    }
  }

  const toggleCompanyExpansion = async (companyId: string) => {
    const newExpanded = new Set(expandedCompanies)
    
    if (expandedCompanies.has(companyId)) {
      newExpanded.delete(companyId)
    } else {
      newExpanded.add(companyId)
      await fetchCompanyUsers(companyId)
    }
    
    setExpandedCompanies(newExpanded)
  }

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.fantasy_name && company.fantasy_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'service_provider': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
      case 'buyer': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'supplier': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const getRoleColor = (userType: string): string => {
    switch (userType) {
      case 'admin': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      case 'user': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'viewer': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  // Check if current user is global admin
  const isGlobalAdmin = currentUser?.role === 'global_admin'

  // Handler functions for edit/delete operations
  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setShowCompanyEditModal(true)
  }

  const handleDeleteCompany = (company: Company) => {
    // Prevent deletion of Wolthers & Associates
    if (company.id === '840783f4-866d-4bdb-9b5d-5d0facf62db0') {
      setError('Cannot delete Wolthers & Associates company.')
      setTimeout(() => setError(null), 5000)
      return
    }
    setSelectedCompany(company)
    setShowDeleteCompanyModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowUserEditModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteUserModal(true)
  }

  const confirmDeleteCompany = async () => {
    if (!selectedCompany) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete company')
      }

      setShowDeleteCompanyModal(false)
      setSelectedCompany(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDeleteUser = async () => {
    if (!selectedUser) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      setShowDeleteUserModal(false)
      setSelectedUser(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCompanyUpdated = async () => {
    setShowCompanyEditModal(false)
    setSelectedCompany(null)
    await refreshData()
  }

  const handleUserUpdated = async () => {
    setShowUserEditModal(false)
    setSelectedUser(null)
    await refreshData()
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-red-500 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
              All Companies & Users
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredCompanies.length} companies with expandable user lists
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '36px' }}
          className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Companies List */}
      <div className="space-y-3">
        {filteredCompanies.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No companies match your search' : 'No companies found'}
            </p>
          </div>
        ) : (
          filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Company Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleCompanyExpansion(company.id)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {expandedCompanies.has(company.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {company.fantasy_name || company.name}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(company.category)}`}>
                        {company.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{company.staff_count || 0} users</span>
                      </div>
                      {company.subcategories && company.subcategories.length > 0 && (
                        <span className="text-xs">
                          {company.subcategories.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  {onAddUsers && (
                    <button
                      onClick={() => onAddUsers(company)}
                      className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                      title="Add Users"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                  {isGlobalAdmin && (
                    <>
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit Company"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company)}
                        disabled={company.id === '840783f4-866d-4bdb-9b5d-5d0facf62db0'}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={company.id === '840783f4-866d-4bdb-9b5d-5d0facf62db0' ? 'Cannot delete Wolthers & Associates' : 'Delete Company'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onViewDashboard(company)}
                    className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                    title="View Dashboard"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Expanded Users List */}
              {expandedCompanies.has(company.id) && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  {companyUsers[company.id] ? (
                    companyUsers[company.id].length > 0 ? (
                      <div className="space-y-2">
                        {companyUsers[company.id].map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-[#1a1a1a] rounded border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                                <span className="text-emerald-700 dark:text-emerald-300 font-medium text-xs">
                                  {user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              
                              {/* User Info */}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {user.full_name}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.user_type)}`}>
                                    {user.user_type}
                                  </span>
                                  {user.is_active && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    <span>{user.email}</span>
                                  </div>
                                  {user.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      <span>{user.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* User Actions */}
                            {isGlobalAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                  title="Edit user"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  disabled={user.id === currentUser?.id}
                                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={user.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                        No users found for this company
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {companies.filter(c => c.category === 'service_provider').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Service Providers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {companies.filter(c => c.category === 'buyer').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Buyers</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {companies.filter(c => c.category === 'supplier').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Suppliers</div>
        </div>
      </div>

      {/* Modal Components */}
      <CompanyEditModal
        isOpen={showCompanyEditModal}
        onClose={() => {
          setShowCompanyEditModal(false)
          setSelectedCompany(null)
        }}
        company={selectedCompany}
        onCompanyUpdated={handleCompanyUpdated}
      />

      <UserEditModal
        isOpen={showUserEditModal}
        onClose={() => {
          setShowUserEditModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
        currentUserId={currentUser?.id}
      />

      <ConfirmationModal
        isOpen={showDeleteCompanyModal}
        onClose={() => {
          setShowDeleteCompanyModal(false)
          setSelectedCompany(null)
        }}
        onConfirm={confirmDeleteCompany}
        title="Delete Company"
        message={`Are you sure you want to delete "${selectedCompany?.fantasy_name || selectedCompany?.name}"? This action cannot be undone and will also delete all associated users and data.`}
        confirmText="Delete Company"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showDeleteUserModal}
        onClose={() => {
          setShowDeleteUserModal(false)
          setSelectedUser(null)
        }}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${selectedUser?.full_name}" (${selectedUser?.email})? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}