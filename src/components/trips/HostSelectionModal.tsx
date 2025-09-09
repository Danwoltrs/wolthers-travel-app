import React, { useState, useEffect } from 'react'
import { X, Users, Plus, Edit, Trash2, Phone, Mail, User } from 'lucide-react'

interface Contact {
  id?: string
  name: string
  role?: string
  email?: string
  phone?: string
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
  onSelectHost: (companyId: string, selectedContacts: Contact[]) => void
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
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState<Contact>({
    name: '',
    role: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)

  // Load existing contacts from database when modal opens
  useEffect(() => {
    if (isOpen && company.id) {
      loadCompanyContacts()
    }
  }, [isOpen, company.id])

  const loadCompanyContacts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/companies/${company.id}/contacts`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to load company contacts:', error)
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

  const toggleContactSelection = (contact: Contact) => {
    setSelectedContacts(prev => {
      const isSelected = prev.some(c => c.id === contact.id)
      if (isSelected) {
        return prev.filter(c => c.id !== contact.id)
      } else {
        return [...prev, contact]
      }
    })
  }

  const handleSelectHost = () => {
    onSelectHost(company.id, selectedContacts)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-pearl-200 dark:border-[#2a2a2a] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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
        <div className="flex flex-col h-[calc(90vh-80px)]">
          <div className="flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="text-center py-4">
                <div className="text-gray-500 dark:text-gray-400">Loading contacts...</div>
              </div>
            )}

            {!loading && (
              <>
                {/* Existing Contacts */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Company Contacts ({contacts.length})
                    </h4>
                    <button
                      onClick={handleAddContact}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Contact
                    </button>
                  </div>

                  {contacts.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">No contacts registered yet</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Click "Add Contact" to register company representatives
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((contact) => {
                        const isSelected = selectedContacts.some(c => c.id === contact.id)
                        return (
                          <div 
                            key={contact.id}
                            className={`border rounded-lg p-3 transition-colors cursor-pointer ${
                              isSelected 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => toggleContactSelection(contact)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleContactSelection(contact)}
                                    className="mr-3 text-emerald-600 rounded focus:ring-emerald-500"
                                  />
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                      {contact.name}
                                    </p>
                                    {contact.role && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {contact.role}
                                      </p>
                                    )}
                                    <div className="flex space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {contact.email && (
                                        <span className="flex items-center">
                                          <Mail className="w-3 h-3 mr-1" />
                                          {contact.email}
                                        </span>
                                      )}
                                      {contact.phone && (
                                        <span className="flex items-center">
                                          <Phone className="w-3 h-3 mr-1" />
                                          {contact.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditContact(contact)
                                  }}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded transition-colors"
                                  title="Edit contact"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteContact(contact.id!)
                                  }}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded transition-colors"
                                  title="Delete contact"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Contacts Summary */}
                {selectedContacts.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 mb-4">
                    <h5 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2">
                      Selected Contacts ({selectedContacts.length})
                    </h5>
                    <div className="space-y-1">
                      {selectedContacts.map((contact, index) => (
                        <div key={contact.id} className="text-sm text-emerald-700 dark:text-emerald-400">
                          {contact.name} {contact.role && `(${contact.role})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectHost}
              disabled={selectedContacts.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Select Host ({selectedContacts.length} contacts)
            </button>
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