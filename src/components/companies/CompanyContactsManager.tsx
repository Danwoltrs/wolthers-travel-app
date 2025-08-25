'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Mail, Phone, Edit3, Trash2, UserCheck, Shield } from 'lucide-react'

interface Contact {
  id: string
  full_name: string
  email: string
  phone?: string
  position?: string
  department?: string
  user_type: 'admin' | 'user' | 'viewer'
  is_active: boolean
  created_at: string
}

interface CompanyContactsManagerProps {
  companyId: string
  contacts?: any
}

export default function CompanyContactsManager({ companyId, contacts }: CompanyContactsManagerProps) {
  const [contactsList, setContactsList] = useState<Contact[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (contacts?.staff) {
      setContactsList(contacts.staff)
    }
  }, [contacts])

  const roleConfig = {
    admin: { 
      label: 'Admin', 
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
      icon: Shield,
      description: 'Full access to company data and settings'
    },
    user: { 
      label: 'User', 
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      icon: UserCheck,
      description: 'Can view and manage assigned trips'
    },
    viewer: { 
      label: 'Viewer', 
      color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400',
      icon: Users,
      description: 'Read-only access to company information'
    }
  }

  const handleAddContact = () => {
    setEditingContact(null)
    setShowAddModal(true)
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setShowAddModal(true)
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    try {
      setIsLoading(true)
      // TODO: Implement delete API call
      console.log('Deleting contact:', contactId)
      alert('Contact deletion will be implemented soon')
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    } finally {
      setIsLoading(false)
    }
  }

  const totalMembers = contactsList?.length || 0
  const adminCount = contactsList?.filter(c => c.user_type === 'admin').length || 0
  const activeMembers = contactsList?.filter(c => c.is_active).length || 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalMembers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{adminCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Team Members
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your company's team members and their access levels
          </p>
        </div>
        <button 
          onClick={handleAddContact}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>
      
      {/* Contacts List */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800">
        {contactsList && contactsList.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {contactsList.map((contact) => {
              const RoleIcon = roleConfig[contact.user_type]?.icon || Users
              
              return (
                <div key={contact.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-lg">
                          {contact.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {contact.full_name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${roleConfig[contact.user_type]?.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {roleConfig[contact.user_type]?.label}
                          </span>
                          {!contact.is_active && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          {contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        {(contact.position || contact.department) && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {contact.position && <span>{contact.position}</span>}
                            {contact.position && contact.department && <span> • </span>}
                            {contact.department && <span>{contact.department}</span>}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {roleConfig[contact.user_type]?.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditContact(contact)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Edit contact"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Remove contact"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No team members found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Add team members to manage your company's access and collaboration
            </p>
            <button 
              onClick={handleAddContact}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Team Member
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
            
            <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {editingContact ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Team member management form will be implemented here
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  onClick={() => {
                    alert('Team member form will be implemented soon')
                    setShowAddModal(false)
                  }}
                >
                  {editingContact ? 'Update' : 'Add'} Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}