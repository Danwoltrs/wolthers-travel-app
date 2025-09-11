import React, { useState, useEffect } from 'react'
import { X, Users, Plus, Edit, Trash2, Phone, Mail, User } from 'lucide-react'

interface Contact {
  id?: string
  name: string
  role?: string
  email?: string
  phone?: string
}

interface CompanyUser {
  id: string
  full_name: string
  email: string
  phone?: string
  role?: string
  user_type?: string
}

interface HostSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  company: {
    id: string
    name: string
    fantasy_name?: string
    city?: string
    state?: string
  }
  onSelectHost: (companyId: string, selectedContacts: (Contact | CompanyUser)[]) => void
  existingContacts?: Contact[]
}

export default function HostSelectionModal({ 
  isOpen, 
  onClose, 
  company, 
  onSelectHost,
  existingContacts = []
}: HostSelectionModalProps) {
  const [contacts, setContacts] = useState<Contact[]>(existingContacts)
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [selectedContacts, setSelectedContacts] = useState<(Contact | CompanyUser)[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState<Contact>({
    name: '',
    role: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)

  // Load existing contacts and users from database when modal opens
  useEffect(() => {
    if (isOpen && company.id) {
      loadCompanyData()
      // Reset selected contacts for each company to avoid cross-company selection
      setSelectedContacts([])
    }
  }, [isOpen, company.id])

  const loadCompanyData = async () => {
    try {
      setLoading(true)
      
      // Load contacts and users in parallel
      const [contactsResponse, usersResponse] = await Promise.all([
        fetch(`/api/companies/${company.id}/contacts`, {
          credentials: 'include'
        }),
        fetch(`/api/companies/${company.id}/users`, {
          credentials: 'include'
        })
      ])
      
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        setContacts(contactsData.contacts || [])
      }
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setCompanyUsers(usersData.users || [])
      }
    } catch (error) {
      console.error('Failed to load company data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = () => {
    setContactForm({ name: '', role: '', email: '', phone: '' })
    setEditingContactId(null)
    setShowAddForm(true)
  }

  const handleEditContact = (contact: Contact) => {
    setContactForm({ ...contact })
    setEditingContactId(contact.id || null)
    setShowAddForm(true)
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!contactForm.name.trim()) {
      errors.push('Name is required')
    }
    
    if (contactForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      errors.push('Please enter a valid email address')
    }
    
    if (contactForm.phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(contactForm.phone)) {
      errors.push('Please enter a valid phone number (minimum 10 digits)')
    }
    
    return errors
  }

  const handleSaveContact = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'))
      return
    }

    const contactData = {
      name: contactForm.name.trim(),
      role: contactForm.role?.trim() || undefined,
      email: contactForm.email?.trim() || undefined,
      phone: contactForm.phone?.trim() || undefined,
      company_id: company.id
    }

    try {
      setLoading(true)
      const url = editingContactId 
        ? `/api/companies/${company.id}/contacts/${editingContactId}`
        : `/api/companies/${company.id}/contacts`
      
      const method = editingContactId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contactData)
      })

      if (response.ok) {
        const savedContact = await response.json()
        
        if (editingContactId) {
          setContacts(prev => prev.map(c => c.id === editingContactId ? savedContact : c))
        } else {
          setContacts(prev => [...prev, savedContact])
        }
        
        setShowAddForm(false)
        setContactForm({ name: '', role: '', email: '', phone: '' })
        setEditingContactId(null)
      } else {
        const error = await response.json()
        alert('Failed to save contact: ' + (error.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Failed to save contact:', error)
      alert('Failed to save contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/companies/${company.id}/contacts/${contactId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== contactId))
        setSelectedContacts(prev => prev.filter(c => c.id !== contactId))
      } else {
        alert('Failed to delete contact')
      }
    } catch (error) {
      console.error('Failed to delete contact:', error)
      alert('Failed to delete contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper functions to identify and work with contacts vs users
  const isCompanyUser = (item: Contact | CompanyUser): item is CompanyUser => {
    return 'full_name' in item
  }

  const getItemId = (item: Contact | CompanyUser): string => {
    return item.id || ''
  }

  const getItemName = (item: Contact | CompanyUser): string => {
    return isCompanyUser(item) ? item.full_name : item.name
  }

  const getItemEmail = (item: Contact | CompanyUser): string | undefined => {
    return item.email
  }

  const getItemPhone = (item: Contact | CompanyUser): string | undefined => {
    return item.phone
  }

  const getItemRole = (item: Contact | CompanyUser): string | undefined => {
    return item.role
  }

  const toggleContactSelection = (item: Contact | CompanyUser) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => getItemId(c) === getItemId(item))
      if (isSelected) {
        return prev.filter(c => getItemId(c) !== getItemId(item))
      } else {
        return [...prev, item]
      }
    })
  }

  const handleSelectHost = () => {
    onSelectHost(company.id, selectedContacts)
    onClose()
  }

  const handleAddLater = () => {
    onSelectHost(company.id, []) // Add company with no contacts selected
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-xl w-full max-w-md max-h-[60vh] overflow-hidden">
        {/* Header */}
        <div className="bg-golden-400 dark:bg-[#09261d] p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white dark:text-golden-400">
              Select Host Representatives
            </h3>
            <p className="text-white/70 dark:text-golden-400/70 text-sm">
              {company.fantasy_name || company.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(60vh-80px)]">
          <div className="flex-1 overflow-y-auto p-4">
            {loading && (
              <div className="text-center py-4">
                <div className="text-gray-500 dark:text-gray-400">Loading representatives...</div>
              </div>
            )}

            {!loading && (
              <>
                {/* Empty State */}
                {companyUsers.length === 0 && contacts.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded mb-4">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No representatives found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      This company has no existing users or contacts. You can add contacts manually or use "Add Later" to configure representatives later.
                    </p>
                  </div>
                )}

                {/* Company Users Section */}
                {companyUsers.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Company Users ({companyUsers.length})
                      </h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="w-6 py-1"></th>
                            <th className="text-left py-1 px-1 font-medium text-gray-900 dark:text-white text-xs">Name</th>
                            <th className="text-left py-1 px-1 font-medium text-gray-900 dark:text-white text-xs">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {companyUsers.map((user) => {
                            const isSelected = selectedContacts.some(c => getItemId(c) === user.id)
                            return (
                              <tr 
                                key={user.id}
                                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                                }`}
                                onClick={() => toggleContactSelection(user)}
                              >
                                <td className="py-1 px-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleContactSelection(user)}
                                    className="text-emerald-600 rounded focus:ring-emerald-500 w-3 h-3"
                                  />
                                </td>
                                <td className="py-1 px-1">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-xs">
                                      {user.full_name}
                                    </p>
                                    {user.role && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {user.role}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1 px-1 text-gray-600 dark:text-gray-400 text-xs">
                                  {user.email || '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Existing Contacts */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      Contacts ({contacts.length})
                    </h4>
                    <button
                      onClick={handleAddContact}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-xs flex items-center transition-colors"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="text-center py-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <User className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">No contacts yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Click "Add" to register representatives
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="w-6 py-1"></th>
                            <th className="text-left py-1 px-1 font-medium text-gray-900 dark:text-white text-xs">Name</th>
                            <th className="text-left py-1 px-1 font-medium text-gray-900 dark:text-white text-xs">WhatsApp</th>
                            <th className="w-12 py-1 text-xs">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map((contact) => {
                            const isSelected = selectedContacts.some(c => getItemId(c) === getItemId(contact))
                            return (
                              <tr 
                                key={contact.id}
                                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                                }`}
                                onClick={() => toggleContactSelection(contact)}
                              >
                                <td className="py-1 px-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleContactSelection(contact)}
                                    className="text-emerald-600 rounded focus:ring-emerald-500 w-3 h-3"
                                  />
                                </td>
                                <td className="py-1 px-1">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white text-xs">
                                      {contact.name}
                                    </p>
                                    {contact.role && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {contact.role}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1 px-1 text-gray-600 dark:text-gray-400 text-xs">
                                  {contact.phone || '-'}
                                </td>
                                <td className="py-1 px-1">
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleEditContact(contact)
                                      }}
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-0.5 rounded transition-colors"
                                      title="Edit"
                                    >
                                      <Edit className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteContact(contact.id!)
                                      }}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-0.5 rounded transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Selected Representatives Summary */}
                {selectedContacts.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded p-2 mb-2">
                    <h5 className="font-medium text-emerald-900 dark:text-emerald-300 text-xs mb-1">
                      Selected ({selectedContacts.length})
                    </h5>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400">
                      {selectedContacts.map((item, index) => (
                        <span key={getItemId(item)} className="inline-block mr-2">
                          {getItemName(item)}{index < selectedContacts.length - 1 ? ',' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex justify-between">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <div className="flex space-x-2">
              <button
                onClick={handleAddLater}
                className="px-3 py-1.5 border border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              >
                Add Later
              </button>
              <button
                onClick={handleSelectHost}
                disabled={selectedContacts.length === 0}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded text-sm transition-colors"
              >
                Select Host ({selectedContacts.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Contact Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingContactId ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setContactForm({ name: '', role: '', email: '', phone: '' })
                    setEditingContactId(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role/Position
                  </label>
                  <input
                    type="text"
                    value={contactForm.role}
                    onChange={(e) => setContactForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Sales Manager, Owner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="+55 (11) 99999-9999"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setContactForm({ name: '', role: '', email: '', phone: '' })
                      setEditingContactId(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveContact}
                    disabled={!contactForm.name.trim() || loading}
                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {loading ? 'Saving...' : (editingContactId ? 'Save Changes' : 'Add Contact')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}