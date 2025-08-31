'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Mail, Phone, MessageSquare, Edit3, Trash2, Building, Search, Filter, User, MapPin } from 'lucide-react'
import type { CompanyStaff, RoleType, ContactMethod } from '@/types/company'

interface CompanyStaffTabProps {
  companyId: string
  editMode: boolean
}

interface StaffFormData {
  full_name: string
  email: string
  phone: string
  whatsapp: string
  position: string
  department: string
  role_type: RoleType
  is_primary_contact: boolean
  is_decision_maker: boolean
  preferred_contact_method: ContactMethod
  language_preference: string
  timezone: string
  linkedin_url: string
  twitter_handle: string
  notes: string
  location_id: string
}

const defaultStaffData: StaffFormData = {
  full_name: '',
  email: '',
  phone: '',
  whatsapp: '',
  position: '',
  department: '',
  role_type: 'staff',
  is_primary_contact: false,
  is_decision_maker: false,
  preferred_contact_method: 'email',
  language_preference: 'en',
  timezone: '',
  linkedin_url: '',
  twitter_handle: '',
  notes: '',
  location_id: ''
}

const roleTypes: { value: RoleType; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'executive', label: 'Executive' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'consultant', label: 'Consultant' }
]

const contactMethods: { value: ContactMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'in_person', label: 'In Person' }
]

export default function CompanyStaffTab({ companyId, editMode }: CompanyStaffTabProps) {
  const [staff, setStaff] = useState<CompanyStaff[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<CompanyStaff | null>(null)
  const [formData, setFormData] = useState<StaffFormData>(defaultStaffData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<RoleType | ''>('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  // Mock data for now - will be replaced with API calls
  useEffect(() => {
    const mockStaff: CompanyStaff[] = [
      {
        id: '1',
        company_id: companyId,
        location_id: '1',
        full_name: 'Jan de Vries',
        email: 'jan@company.com',
        phone: '+31 20 123 4567',
        whatsapp: '+31 6 1234 5678',
        position: 'Managing Director',
        department: 'Management',
        role_type: 'executive',
        is_primary_contact: true,
        is_decision_maker: true,
        preferred_contact_method: 'email',
        language_preference: 'en',
        timezone: 'Europe/Amsterdam',
        linkedin_url: 'https://linkedin.com/in/jandevries',
        twitter_handle: '@jandevries',
        notes: 'Main decision maker for coffee purchasing',
        photo_url: null,
        is_active: true,
        last_contact_date: '2025-08-01',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2025-08-01T00:00:00Z',
        created_by: null,
        updated_by: null
      },
      {
        id: '2',
        company_id: companyId,
        location_id: '1',
        full_name: 'Emma van der Berg',
        email: 'emma@company.com',
        phone: '+31 20 123 4568',
        whatsapp: '+31 6 1234 5679',
        position: 'Head of Quality',
        department: 'Quality Assurance',
        role_type: 'manager',
        is_primary_contact: false,
        is_decision_maker: false,
        preferred_contact_method: 'whatsapp',
        language_preference: 'nl',
        timezone: 'Europe/Amsterdam',
        linkedin_url: '',
        twitter_handle: '',
        notes: 'Expert in coffee quality control and cupping',
        photo_url: null,
        is_active: true,
        last_contact_date: '2025-07-25',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2025-07-25T00:00:00Z',
        created_by: null,
        updated_by: null
      }
    ]
    setStaff(mockStaff)
  }, [companyId])

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.position?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = !filterRole || member.role_type === filterRole
    const matchesActive = filterActive === null || member.is_active === filterActive

    return matchesSearch && matchesRole && matchesActive
  })

  const handleAddStaff = () => {
    setEditingStaff(null)
    setFormData(defaultStaffData)
    setIsFormOpen(true)
  }

  const handleEditStaff = (staffMember: CompanyStaff) => {
    setEditingStaff(staffMember)
    setFormData({
      full_name: staffMember.full_name,
      email: staffMember.email || '',
      phone: staffMember.phone || '',
      whatsapp: staffMember.whatsapp || '',
      position: staffMember.position || '',
      department: staffMember.department || '',
      role_type: staffMember.role_type,
      is_primary_contact: staffMember.is_primary_contact,
      is_decision_maker: staffMember.is_decision_maker,
      preferred_contact_method: staffMember.preferred_contact_method,
      language_preference: staffMember.language_preference,
      timezone: staffMember.timezone || '',
      linkedin_url: staffMember.linkedin_url || '',
      twitter_handle: staffMember.twitter_handle || '',
      notes: staffMember.notes || '',
      location_id: staffMember.location_id || ''
    })
    setIsFormOpen(true)
  }

  const handleSaveStaff = async () => {
    // TODO: API call to save staff member
    console.log('Saving staff member:', formData)
    setIsFormOpen(false)
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      // TODO: API call to delete staff member
      console.log('Deleting staff member:', staffId)
    }
  }

  const getRoleColor = (role: RoleType) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'executive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'staff':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case 'consultant':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getContactIcon = (method: ContactMethod) => {
    switch (method) {
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'phone':
        return <Phone className="w-4 h-4" />
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />
      case 'in_person':
        return <User className="w-4 h-4" />
      default:
        return <Mail className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Staff Members ({filteredStaff.length})
        </h3>
        {editMode && (
          <button
            onClick={handleAddStaff}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search staff by name, email, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
                className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as RoleType | '')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
          >
            <option value="">All Roles</option>
            {roleTypes.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterActive === null ? '' : filterActive.toString()}
            onChange={(e) => setFilterActive(e.target.value === '' ? null : e.target.value === 'true')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Staff List */}
      {filteredStaff.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStaff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {staffMember.full_name}
                    </h4>
                    {staffMember.is_primary_contact && (
                      <span className="px-2 py-0.5 bg-golden-400 text-gray-900 rounded-full text-xs font-medium">
                        Primary
                      </span>
                    )}
                    {staffMember.is_decision_maker && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium">
                        Decision Maker
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(staffMember.role_type)}`}>
                      {roleTypes.find(r => r.value === staffMember.role_type)?.label}
                    </span>
                    {!staffMember.is_active && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>

                  {staffMember.position && (
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {staffMember.position}
                    </p>
                  )}
                  {staffMember.department && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {staffMember.department}
                    </p>
                  )}
                </div>

                {editMode && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditStaff(staffMember)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staffMember.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-2 text-sm">
                {staffMember.email && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <a
                      href={`mailto:${staffMember.email}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {staffMember.email}
                    </a>
                  </div>
                )}
                
                {staffMember.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <a
                      href={`tel:${staffMember.phone}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {staffMember.phone}
                    </a>
                  </div>
                )}

                {staffMember.whatsapp && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MessageSquare className="w-4 h-4" />
                    <a
                      href={`https://wa.me/${staffMember.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    >
                      {staffMember.whatsapp}
                    </a>
                  </div>
                )}
              </div>

              {/* Preferred Contact */}
              <div className="mt-4 pt-4 border-t border-pearl-200 dark:border-[#2a2a2a]">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  {getContactIcon(staffMember.preferred_contact_method)}
                  <span>Preferred: {contactMethods.find(m => m.value === staffMember.preferred_contact_method)?.label}</span>
                  {staffMember.language_preference !== 'en' && (
                    <>
                      <span className="mx-1">•</span>
                      <span>Language: {staffMember.language_preference.toUpperCase()}</span>
                    </>
                  )}
                </div>
                
                {staffMember.last_contact_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last contact: {new Date(staffMember.last_contact_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {staffMember.notes && (
                <div className="mt-3 pt-3 border-t border-pearl-200 dark:border-[#2a2a2a]">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{staffMember.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || filterRole || filterActive !== null 
              ? 'No staff members match your search criteria'
              : 'No staff members added yet'
            }
          </p>
          {editMode && !searchQuery && !filterRole && filterActive === null && (
            <button
              onClick={handleAddStaff}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Add First Staff Member
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Staff Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsFormOpen(false)} />

            <div className="relative bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] overflow-y-auto">
              <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role Type
                    </label>
                    <select
                      value={formData.role_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, role_type: e.target.value as RoleType }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    >
                      {roleTypes.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Contact Method
                    </label>
                    <select
                      value={formData.preferred_contact_method}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_contact_method: e.target.value as ContactMethod }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    >
                      {contactMethods.map(method => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language_preference}
                      onChange={(e) => setFormData(prev => ({ ...prev, language_preference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    >
                      <option value="en">English</option>
                      <option value="nl">Dutch</option>
                      <option value="de">German</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="pt">Portuguese</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_primary_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_primary_contact: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Primary Contact</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_decision_maker}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_decision_maker: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Decision Maker</span>
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    placeholder="Additional notes about this staff member..."
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-pearl-200 dark:border-[#2a2a2a] flex justify-end gap-3">
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaff}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingStaff ? 'Update Staff Member' : 'Save Staff Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}