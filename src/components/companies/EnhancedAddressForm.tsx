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
  city?: string
  state?: string
  region?: string
  country?: string
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

  // AI-powered address detection
  const handleAddressChange = async (address: string) => {
    onChange({ address })
    
    if (!address || address.length < 3) return

    setIsDetecting(true)
    try {
      // Small delay to avoid excessive API calls
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const detectedLocation = detectLocationFromAddress(address)
      
      if (detectedLocation) {
        console.log('🤖 AI detected location:', detectedLocation)
        setSelectedLocation(detectedLocation)
        
        // Auto-fill the detected information
        onChange({
          address,
          city: detectedLocation.city,
          state: detectedLocation.state,
          region: detectedLocation.region || detectedLocation.coffeeRegion,
          country: 'Brazil'
        })
      }
    } catch (error) {
      console.error('Error detecting location:', error)
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
    
    if (field === 'city' && value) {
      const detectedRegion = getRegionByCity(value, data.state)
      if (detectedRegion) {
        updates.region = detectedRegion
      }
    }
    
    onChange(updates)
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

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
          <Check className="w-4 h-4" />
          <span>
            AI detected: {selectedLocation.city}, {selectedLocation.state}
            {selectedLocation.coffeeRegion && ` (${selectedLocation.coffeeRegion})`}
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
            placeholder="Enter complete address (AI will auto-detect location details)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Example: "Rua das Flores, 123, Centro, Varginha, MG" - AI will detect "Sul de Minas" region
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

      {/* Manual Input Grid */}
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Region * 
            {data.city && data.city.toLowerCase() === 'varginha' && (
              <span className="text-emerald-600 dark:text-emerald-400 text-xs ml-1">(AI: Sul de Minas)</span>
            )}
          </label>
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
        </div>
      </div>

      {/* Coffee Region Info */}
      {(data.region === 'Sul de Minas' || data.city?.toLowerCase().includes('varginha')) && (
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