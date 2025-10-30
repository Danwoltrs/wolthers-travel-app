'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Sparkles, ChevronDown, Search, Check } from 'lucide-react'
import { 
  ALL_BRAZILIAN_LOCATIONS, 
  BRAZILIAN_COFFEE_REGIONS, 
  detectLocationFromAddress, 
  getRegionByCity,
  type BrazilianLocation 
} from '@/lib/brazilian-locations'

interface AddressData {
  address?: string
  street?: string
  streetNumber?: string
  city?: string
  state?: string
  region?: string
  country?: string
  neighbourhood?: string
  zipCode?: string
}

interface EnhancedAddressFormProps {
  data: AddressData
  onChange: (updates: Partial<AddressData>) => void
  showFullAddress?: boolean
  className?: string
}

export default function EnhancedAddressForm({ 
  data, 
  onChange, 
  showFullAddress = true,
  className = "" 
}: EnhancedAddressFormProps) {
  const [isDetecting, setIsDetecting] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<BrazilianLocation | null>(null)
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredLocations, setFilteredLocations] = useState<BrazilianLocation[]>([])

  // Filter locations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLocations([])
      return
    }

    const query = searchQuery.toLowerCase()
    const matches = ALL_BRAZILIAN_LOCATIONS.filter(location => 
      location.city.toLowerCase().includes(query) ||
      location.state.toLowerCase().includes(query) ||
      location.region.toLowerCase().includes(query) ||
      (location.coffeeRegion && location.coffeeRegion.toLowerCase().includes(query))
    ).slice(0, 10) // Limit to 10 results

    setFilteredLocations(matches)
  }, [searchQuery])

  // AI-powered address detection with Google Geocoding API
  const handleAddressChange = async (address: string) => {
    onChange({ address })

    if (!address || address.length < 10) return

    setIsDetecting(true)
    try {
      // Small delay to avoid excessive API calls
      await new Promise(resolve => setTimeout(resolve, 800))

      // Call Google Geocoding API to parse the full address
      const response = await fetch('/api/locations/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })

      if (!response.ok) {
        console.warn('Geocoding failed, falling back to keyword detection')
        throw new Error('Geocoding failed')
      }

      const geocodedData = await response.json()
      console.log('🤖 AI parsed address:', geocodedData)

      const components = geocodedData.addressComponents

      // Determine if this is a Brazilian address
      const isBrazil = components.country === 'Brazil' || components.country === 'Brasil'

      if (isBrazil) {
        // For Brazil, detect coffee region
        const detectedLocation = detectLocationFromAddress(address)

        if (detectedLocation) {
          setSelectedLocation(detectedLocation)
        }

        // Auto-fill all fields for Brazilian address
        onChange({
          address,
          street: components.street || '',
          streetNumber: components.streetNumber || '',
          neighbourhood: components.neighborhood || '',
          city: components.city || detectedLocation?.city || '',
          state: components.state || detectedLocation?.state || '',
          region: detectedLocation?.region || detectedLocation?.coffeeRegion || '',
          country: 'Brazil',
          zipCode: components.postalCode || ''
        })
      } else {
        // For international addresses, auto-fill all available fields
        setDetectedCountry(components.country)

        onChange({
          address,
          street: components.street || '',
          streetNumber: components.streetNumber || '',
          neighbourhood: components.neighborhood || '',
          city: components.city || '',
          state: components.state || '',
          region: '', // Let user fill this for international
          country: components.country || 'Brazil',
          zipCode: components.postalCode || ''
        })
      }
    } catch (error) {
      console.error('Error parsing address:', error)
      // Fallback to simple keyword detection if geocoding fails
      try {
        const addressLower = address.toLowerCase()
        let detectedCountry = 'Brazil'

        if (addressLower.includes('japan') || addressLower.includes('tokyo')) {
          detectedCountry = 'Japan'
        } else if (addressLower.includes('usa') || addressLower.includes('united states')) {
          detectedCountry = 'United States'
        } else if (addressLower.includes('canada')) {
          detectedCountry = 'Canada'
        }

        if (detectedCountry !== 'Brazil') {
          setDetectedCountry(detectedCountry)
          onChange({ address, country: detectedCountry })
        }
      } catch (fallbackError) {
        console.error('Fallback detection also failed:', fallbackError)
      }
    } finally {
      setIsDetecting(false)
    }
  }

  // Handle location selection from dropdown
  const handleLocationSelect = (location: BrazilianLocation) => {
    setSelectedLocation(location)
    setShowSuggestions(false)
    setSearchQuery('')
    
    onChange({
      city: location.city,
      state: location.state,
      region: location.region || location.coffeeRegion,
      country: 'Brazil'
    })
  }

  // Manual region detection when city/state changes
  const handleCityStateChange = (field: 'city' | 'state', value: string) => {
    const updates: Partial<AddressData> = { [field]: value }

    if (field === 'city' && value && data.country === 'Brazil') {
      const detectedRegion = getRegionByCity(value, data.state)
      if (detectedRegion) {
        updates.region = detectedRegion
      }
    }

    onChange(updates)
  }

  // Handle country change - clear state/region if switching between Brazil and other countries
  const handleCountryChange = (newCountry: string) => {
    const wasBrazil = data.country === 'Brazil'
    const isBrazil = newCountry === 'Brazil'

    // If switching between Brazil and non-Brazil, clear state and region
    if (wasBrazil !== isBrazil) {
      onChange({
        country: newCountry,
        state: '',
        region: ''
      })
    } else {
      onChange({ country: newCountry })
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AI Detection Status */}
      {isDetecting && (
        <div className="flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>AI detecting location...</span>
        </div>
      )}

      {/* Selected Location Display - Brazilian */}
      {selectedLocation && data.country === 'Brazil' && (
        <div className="flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
          <Check className="w-4 h-4" />
          <span>
            ✨ AI auto-filled: {selectedLocation.city}, {selectedLocation.state}
            {selectedLocation.coffeeRegion && ` → ${selectedLocation.coffeeRegion}`}. All fields populated automatically!
          </span>
        </div>
      )}

      {/* Selected Country Display - International */}
      {detectedCountry && detectedCountry !== 'Brazil' && data.country === detectedCountry && (
        <div className="flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
          <Check className="w-4 h-4" />
          <span>
            ✨ AI auto-filled: {detectedCountry} address parsed! Street, Number, City, State, ZIP Code populated. Please add Region manually.
          </span>
        </div>
      )}

      {/* Full Address Field */}
      {showFullAddress && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Full Address
          </label>
          <textarea
            value={data.address || ''}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Paste complete address here - AI will auto-fill ALL fields below"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            ✨ Smart Parsing: Just paste the full address and AI will automatically fill Street, Number, City, State, ZIP Code, Country, and Region. Works worldwide!
          </p>
        </div>
      )}

      {/* Location Search/Selection */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <Search className="w-4 h-4 inline mr-1" />
          Search Location (or select manually below)
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search cities, states, or coffee regions (e.g., Varginha, Sul de Minas)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && filteredLocations.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredLocations.map((location, index) => (
                <button
                  key={index}
                  onClick={() => handleLocationSelect(location)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {location.city}, {location.stateCode}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {location.coffeeRegion || location.region}
                    {location.coffeeRegion && <span className="text-emerald-600 dark:text-emerald-400 ml-1">(Coffee Region)</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Input Grid - Row 1: Street and Number */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Street *
          </label>
          <input
            type="text"
            value={data.street || ''}
            onChange={(e) => onChange({ street: e.target.value })}
            placeholder="e.g., Rua das Flores, Avenida Paulista"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number *
          </label>
          <input
            type="text"
            value={data.streetNumber || ''}
            onChange={(e) => onChange({ streetNumber: e.target.value })}
            placeholder="e.g., 123, S/N"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Manual Input Grid - Row 2: City, State, Region */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            City *
          </label>
          <input
            type="text"
            value={data.city || ''}
            onChange={(e) => handleCityStateChange('city', e.target.value)}
            placeholder="e.g., Varginha"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            State *
          </label>
          {data.country === 'Brazil' ? (
            <select
              value={data.state || ''}
              onChange={(e) => handleCityStateChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select State</option>
              <option value="Minas Gerais">Minas Gerais (MG)</option>
              <option value="São Paulo">São Paulo (SP)</option>
              <option value="Espírito Santo">Espírito Santo (ES)</option>
              <option value="Rio de Janeiro">Rio de Janeiro (RJ)</option>
              <option value="Paraná">Paraná (PR)</option>
              <option value="Bahia">Bahia (BA)</option>
              <option value="Goiás">Goiás (GO)</option>
              <option value="Distrito Federal">Distrito Federal (DF)</option>
            </select>
          ) : (
            <input
              type="text"
              value={data.state || ''}
              onChange={(e) => handleCityStateChange('state', e.target.value)}
              placeholder="e.g., Tokyo, California, Ontario"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Region *
            {data.country === 'Brazil' && data.city && data.city.toLowerCase() === 'varginha' && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs ml-1">(AI: Sul de Minas)</span>
            )}
          </label>
          {data.country === 'Brazil' ? (
            <select
              value={data.region || ''}
              onChange={(e) => onChange({ region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select Region</option>
              <optgroup label="Coffee Regions">
                <option value="Sul de Minas">Sul de Minas</option>
                <option value="Cerrado Mineiro">Cerrado Mineiro</option>
                <option value="Zona da Mata">Zona da Mata</option>
                <option value="Alta Mogiana">Alta Mogiana</option>
                <option value="Montanhas do Espírito Santo">Montanhas do Espírito Santo</option>
              </optgroup>
              <optgroup label="Geographic Regions">
                <option value="Sudeste">Sudeste</option>
                <option value="Sul">Sul</option>
                <option value="Nordeste">Nordeste</option>
                <option value="Centro-Oeste">Centro-Oeste</option>
                <option value="Norte">Norte</option>
              </optgroup>
              <optgroup label="States">
                <option value="São Paulo">São Paulo</option>
                <option value="Minas Gerais">Minas Gerais</option>
                <option value="Rio de Janeiro">Rio de Janeiro</option>
                <option value="Espírito Santo">Espírito Santo</option>
              </optgroup>
            </select>
          ) : (
            <input
              type="text"
              value={data.region || ''}
              onChange={(e) => onChange({ region: e.target.value })}
              placeholder="e.g., Kanto, New England, Bavaria"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          )}
        </div>
      </div>

      {/* Manual Input Grid - Row 3: Country, Neighbourhood, ZIP Code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Country *
          </label>
          <select
            value={data.country || 'Brazil'}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="Brazil">Brazil</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Italy">Italy</option>
            <option value="Spain">Spain</option>
            <option value="Portugal">Portugal</option>
            <option value="Netherlands">Netherlands</option>
            <option value="Belgium">Belgium</option>
            <option value="Switzerland">Switzerland</option>
            <option value="Austria">Austria</option>
            <option value="Japan">Japan</option>
            <option value="South Korea">South Korea</option>
            <option value="China">China</option>
            <option value="Australia">Australia</option>
            <option value="New Zealand">New Zealand</option>
            <option value="Mexico">Mexico</option>
            <option value="Colombia">Colombia</option>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Neighbourhood
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <input
            type="text"
            value={data.neighbourhood || ''}
            onChange={(e) => onChange({ neighbourhood: e.target.value })}
            placeholder="e.g., Centro, Jardins"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ZIP Code *
          </label>
          <input
            type="text"
            value={data.zipCode || ''}
            onChange={(e) => onChange({ zipCode: e.target.value })}
            placeholder="e.g., 37010-000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Coffee Region Info - Only show for Brazilian addresses */}
      {data.country === 'Brazil' && (data.region === 'Sul de Minas' || data.city?.toLowerCase().includes('varginha')) && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">Coffee Region: Sul de Minas</span>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
            Major coffee producing region including Varginha, Poços de Caldas, Três Pontas, and surrounding areas.
          </p>
        </div>
      )}

      {/* Click away handler */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}