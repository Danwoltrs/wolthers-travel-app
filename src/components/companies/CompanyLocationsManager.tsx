'use client'

import { useState, useEffect } from 'react'
import { 
  MapPin, Plus, Edit, Trash2, Building, Phone, Mail, User, 
  Save, X, AlertCircle, Home, Warehouse, Factory, Coffee
} from 'lucide-react'

interface CompanyLocation {
  id?: string
  name: string
  is_headquarters: boolean
  address_line1: string
  address_line2?: string
  city: string
  state_province?: string
  country: string
  postal_code?: string
  phone?: string
  email?: string
  contact_person?: string
  notes?: string
  is_active: boolean
  latitude?: number
  longitude?: number
}

interface CompanyLocationsManagerProps {
  companyId: string
  companyName: string
  locations: CompanyLocation[]
  onLocationsUpdate: (locations: CompanyLocation[]) => void
}

const LOCATION_TYPES = [
  { value: 'Head Office', icon: Building, color: 'blue' },
  { value: 'Branch Office', icon: Building, color: 'green' },
  { value: 'Warehouse', icon: Warehouse, color: 'orange' },
  { value: 'Production Facility', icon: Factory, color: 'red' },
  { value: 'Farm', icon: Coffee, color: 'brown' },
  { value: 'Distribution Center', icon: Warehouse, color: 'purple' },
]

export default function CompanyLocationsManager({ 
  companyId, 
  companyName, 
  locations, 
  onLocationsUpdate 
}: CompanyLocationsManagerProps) {
  const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emptyLocation: CompanyLocation = {
    name: '',
    is_headquarters: false,
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    country: '',
    postal_code: '',
    phone: '',
    email: '',
    contact_person: '',
    notes: '',
    is_active: true
  }

  const handleSaveLocation = async (location: CompanyLocation) => {
    setIsLoading(true)
    setError(null)

    try {
      const isNew = !location.id
      const endpoint = isNew 
        ? `/api/companies/${companyId}/locations`
        : `/api/companies/${companyId}/locations/${location.id}`
      
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...location,
          company_id: companyId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save location')
      }

      const savedLocation = await response.json()
      
      // Update locations list
      const updatedLocations = isNew
        ? [...locations, savedLocation.location]
        : locations.map(loc => loc.id === location.id ? savedLocation.location : loc)
      
      onLocationsUpdate(updatedLocations)
      setEditingLocation(null)
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/companies/${companyId}/locations/${locationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete location')
      }

      const updatedLocations = locations.filter(loc => loc.id !== locationId)
      onLocationsUpdate(updatedLocations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete location')
    } finally {
      setIsLoading(false)
    }
  }

  const getLocationIcon = (locationName: string) => {
    const type = LOCATION_TYPES.find(type => 
      locationName.toLowerCase().includes(type.value.toLowerCase().split(' ')[0])
    )
    return type || LOCATION_TYPES[0]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {companyName} Locations
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage headquarters and additional locations for trip planning
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => {
          const locationIcon = getLocationIcon(location.name)
          const IconComponent = locationIcon.icon
          
          return (
            <div 
              key={location.id}
              className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4 relative group hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full bg-${locationIcon.color}-100 dark:bg-${locationIcon.color}-900/30`}>
                    <IconComponent className={`w-4 h-4 text-${locationIcon.color}-600 dark:text-${locationIcon.color}-400`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {location.name}
                      {location.is_headquarters && (
                        <span className="px-2 py-1 bg-golden-100 dark:bg-golden-900/30 text-golden-700 dark:text-golden-400 text-xs font-medium rounded-full">
                          HQ
                        </span>
                      )}
                    </h4>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingLocation(location)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!location.is_headquarters && (
                    <button
                      onClick={() => handleDeleteLocation(location.id!)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div>{location.address_line1}</div>
                    {location.address_line2 && <div>{location.address_line2}</div>}
                    <div>
                      {location.city}
                      {location.state_province && `, ${location.state_province}`}
                      {location.postal_code && ` ${location.postal_code}`}
                    </div>
                    <div className="font-medium">{location.country}</div>
                  </div>
                </div>

                {/* Contact Info */}
                {location.contact_person && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{location.contact_person}</span>
                  </div>
                )}
                
                {location.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{location.phone}</span>
                  </div>
                )}
                
                {location.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{location.email}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {location.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{location.notes}</p>
                </div>
              )}
            </div>
          )
        })}

        {/* Empty State */}
        {locations.length === 0 && (
          <div className="col-span-full text-center py-12">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No locations found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add locations to help with trip planning and navigation
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Location Form Modal */}
      {(showAddForm || editingLocation) && (
        <LocationFormModal
          location={editingLocation || emptyLocation}
          isEditing={!!editingLocation}
          companyName={companyName}
          onSave={handleSaveLocation}
          onCancel={() => {
            setShowAddForm(false)
            setEditingLocation(null)
          }}
          isLoading={isLoading}
          existingLocations={locations}
        />
      )}
    </div>
  )
}

interface LocationFormModalProps {
  location: CompanyLocation
  isEditing: boolean
  companyName: string
  onSave: (location: CompanyLocation) => void
  onCancel: () => void
  isLoading: boolean
  existingLocations: CompanyLocation[]
}

function LocationFormModal({ 
  location, 
  isEditing, 
  companyName,
  onSave, 
  onCancel, 
  isLoading,
  existingLocations 
}: LocationFormModalProps) {
  const [formData, setFormData] = useState<CompanyLocation>(location)

  const hasHeadquarters = existingLocations.some(loc => loc.is_headquarters && loc.id !== location.id)

  const handleInputChange = (field: keyof CompanyLocation, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-none sm:rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-xl w-full h-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-golden-400 dark:bg-[#09261d] text-white dark:text-golden-400 px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {isEditing ? 'Edit Location' : 'Add New Location'}
            <span className="text-sm font-normal">— {companyName}</span>
          </h2>
          <button
            onClick={onCancel}
            className="text-white dark:text-golden-400 hover:text-gray-100 dark:hover:text-golden-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Location Name and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., São Paulo Branch, Warehouse #1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location Type
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHeadquarters"
                  checked={formData.is_headquarters}
                  onChange={(e) => handleInputChange('is_headquarters', e.target.checked)}
                  disabled={hasHeadquarters && !formData.is_headquarters}
                  className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isHeadquarters" className="text-sm text-gray-700 dark:text-gray-300">
                  Headquarters
                  {hasHeadquarters && !formData.is_headquarters && (
                    <span className="text-gray-400 ml-1">(Already exists)</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 1 *
              </label>
              <input
                type="text"
                required
                value={formData.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_line2 || ''}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State/Province
                </label>
                <input
                  type="text"
                  value={formData.state_province || ''}
                  onChange={(e) => handleInputChange('state_province', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                value={formData.postal_code || ''}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.contact_person || ''}
              onChange={(e) => handleInputChange('contact_person', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Additional information about this location..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update Location' : 'Add Location'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}