'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Building, Phone, Mail, Edit3, Trash2, Navigation, ExternalLink } from 'lucide-react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import type { CompanyLocation } from '@/types/company'

interface CompanyLocationsTabProps {
  companyId: string
  editMode: boolean
}

interface LocationFormData {
  location_name: string
  address_line_1: string
  address_line_2: string
  city: string
  state_province: string
  postal_code: string
  country: string
  location_type: string
  is_primary_location: boolean
  is_meeting_location: boolean
  phone: string
  email: string
  contact_person: string
  meeting_room_capacity: number | null
  has_presentation_facilities: boolean
  has_catering: boolean
  parking_availability: string
  accessibility_notes: string
  notes: string
  latitude: number | null
  longitude: number | null
}

const defaultLocation: LocationFormData = {
  location_name: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'Netherlands',
  location_type: 'office',
  is_primary_location: false,
  is_meeting_location: true,
  phone: '',
  email: '',
  contact_person: '',
  meeting_room_capacity: null,
  has_presentation_facilities: false,
  has_catering: false,
  parking_availability: '',
  accessibility_notes: '',
  notes: '',
  latitude: null,
  longitude: null
}

const locationTypes = [
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'store', label: 'Store' },
  { value: 'factory', label: 'Factory' },
  { value: 'headquarters', label: 'Headquarters' },
  { value: 'branch', label: 'Branch' },
  { value: 'other', label: 'Other' }
]

export default function CompanyLocationsTab({ companyId, editMode }: CompanyLocationsTabProps) {
  const [locations, setLocations] = useState<CompanyLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<CompanyLocation | null>(null)
  const [formData, setFormData] = useState<LocationFormData>(defaultLocation)
  const [selectedLocation, setSelectedLocation] = useState<CompanyLocation | null>(null)
  const [mapCenter, setMapCenter] = useState({ lat: 52.3676, lng: 4.9041 }) // Amsterdam center
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/companies/${companyId}/locations?meeting_only=false`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setLocations(data.locations || [])
        } else {
          console.error('Failed to fetch locations:', await response.text())
          setLocations([])
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
        setLocations([])
      } finally {
        setIsLoading(false)
      }
    }

    if (companyId) {
      fetchLocations()
    }
  }, [companyId])

  const handleAddLocation = () => {
    setEditingLocation(null)
    setFormData(defaultLocation)
    setIsFormOpen(true)
  }

  const handleEditLocation = (location: any) => {
    setEditingLocation(location)
    setFormData({
      location_name: location.location_name || '',
      address_line_1: location.address_line_1 || '',
      address_line_2: location.address_line_2 || '',
      city: location.city || '',
      state_province: location.state_province || '',
      postal_code: location.postal_code || '',
      country: location.country || '',
      location_type: location.location_type || 'office',
      is_primary_location: location.is_primary_location || false,
      is_meeting_location: location.is_meeting_location || true,
      phone: location.phone || '',
      email: location.email || '',
      contact_person: location.contact_person || '',
      meeting_room_capacity: location.meeting_room_capacity || null,
      has_presentation_facilities: location.has_presentation_facilities || false,
      has_catering: location.has_catering || false,
      parking_availability: location.parking_availability || '',
      accessibility_notes: location.accessibility_notes || '',
      notes: location.notes || '',
      latitude: location.latitude,
      longitude: location.longitude
    })
    setIsFormOpen(true)
  }

  const handleGeocodeAddress = async () => {
    if (!window.google) return

    const address = `${formData.address_line_1}, ${formData.city}, ${formData.country}`
    setGeocoding(true)

    try {
      const geocoder = new window.google.maps.Geocoder()
      const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results) {
            resolve(results)
          } else {
            reject(new Error('Geocoding failed'))
          }
        })
      })

      if (results.length > 0) {
        const location = results[0].geometry.location
        setFormData(prev => ({
          ...prev,
          latitude: location.lat(),
          longitude: location.lng()
        }))
        setMapCenter({ lat: location.lat(), lng: location.lng() })
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      alert('Could not find coordinates for this address. Please enter them manually.')
    } finally {
      setGeocoding(false)
    }
  }

  const handleSaveLocation = async () => {
    // TODO: Implement location save functionality
    console.log('Saving location:', formData)
    alert('Location save functionality will be implemented soon')
    setIsFormOpen(false)
  }

  const handleDeleteLocation = async (locationId: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      // TODO: Implement location delete functionality
      console.log('Deleting location:', locationId)
      alert('Location delete functionality will be implemented soon')
    }
  }

  const openInGoogleMaps = (location: any) => {
    if (location.latitude && location.longitude) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      window.open(url, '_blank')
    } else {
      const address = `${location.address_line_1}, ${location.city}, ${location.country}`
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Company Locations
        </h3>
        {editMode && (
          <button 
            onClick={handleAddLocation}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        )}
      </div>

      {/* Locations List */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {location.location_name}
                  </h4>
                  {location.is_primary_location && (
                    <span className="px-2 py-0.5 bg-golden-400 text-gray-900 rounded-full text-xs font-medium">
                      Primary
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    location.location_type === 'headquarters' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                      : location.location_type === 'office'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {locationTypes.find(t => t.value === location.location_type)?.label || location.location_type}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {location.address_line_1}
                      {location.address_line_2 && <>, {location.address_line_2}</>}
                      <br />
                      {location.city}, {location.state_province} {location.postal_code}
                      <br />
                      {location.country}
                    </span>
                  </p>
                  {location.contact_person && (
                    <p className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      {location.contact_person}
                    </p>
                  )}
                  {location.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {location.phone}
                    </p>
                  )}
                  {location.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {location.email}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => openInGoogleMaps(location)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                {editMode && (
                  <>
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Meeting Facilities */}
            {location.is_meeting_location && (
              <div className="pt-4 border-t border-pearl-200 dark:border-[#2a2a2a]">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting Facilities
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>Capacity: {location.meeting_room_capacity || 'Not specified'}</div>
                  <div>Presentation: {location.has_presentation_facilities ? 'Yes' : 'No'}</div>
                  <div>Catering: {location.has_catering ? 'Yes' : 'No'}</div>
                  <div>Parking: {location.parking_availability || 'Not specified'}</div>
                </div>
              </div>
            )}

            {location.notes && (
              <div className="pt-3 border-t border-pearl-200 dark:border-[#2a2a2a] mt-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">{location.notes}</p>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      {/* Map View */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4">
          Location Map
        </h4>
        <div className="h-96 w-full rounded-lg overflow-hidden">
          <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={12}
            >
              {locations.map((location) => (
                location.latitude && location.longitude && (
                  <Marker
                    key={location.id}
                    position={{ lat: location.latitude, lng: location.longitude }}
                    onClick={() => setSelectedLocation(location)}
                    icon={{
                      path: window.google?.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: location.is_primary_location ? '#F59E0B' : '#059669',
                      fillOpacity: 1,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                    }}
                  />
                )
              ))}
              
              {selectedLocation && selectedLocation.latitude && selectedLocation.longitude && (
                <InfoWindow
                  position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
                  onCloseClick={() => setSelectedLocation(null)}
                >
                  <div className="p-2">
                    <h5 className="font-semibold">{selectedLocation.location_name}</h5>
                    <p className="text-sm text-gray-600">
                      {selectedLocation.address_line_1}<br />
                      {selectedLocation.city}, {selectedLocation.country}
                    </p>
                    {selectedLocation.contact_person && (
                      <p className="text-sm mt-1">Contact: {selectedLocation.contact_person}</p>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>

      {/* Add/Edit Location Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsFormOpen(false)} />
            
            <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-pearl-200 dark:border-[#2a2a2a] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={formData.location_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location Type
                    </label>
                    <select
                      value={formData.location_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                    >
                      {locationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        value={formData.address_line_1}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={formData.address_line_2}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State/Province
                      </label>
                      <input
                        type="text"
                        value={formData.state_province}
                        onChange={(e) => setFormData(prev => ({ ...prev, state_province: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">Coordinates</h4>
                    <button
                      type="button"
                      onClick={handleGeocodeAddress}
                      disabled={geocoding || !formData.address_line_1 || !formData.city}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      {geocoding ? 'Getting Coordinates...' : 'Get Coordinates'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        placeholder="52.3676"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                        placeholder="4.9041"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_primary_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_primary_location: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Primary Location</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_meeting_location}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_meeting_location: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Can Host Meetings</span>
                  </label>
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
                  onClick={handleSaveLocation}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingLocation ? 'Update Location' : 'Save Location'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}