import React, { useState, useEffect } from 'react'
import { MapPin, Building2, Users, Clock, Sparkles, Globe } from 'lucide-react'
import type { Company } from '@/types'

interface CoffeeRegion {
  id: string
  name: string
  description: string
  mainCities: string[]
  characteristics: string
  color: string
  estimatedCompanies: number
  country: string
}

// Base regions - will be enhanced with dynamic database regions
const BASE_COFFEE_REGIONS: CoffeeRegion[] = [
  {
    id: 'sul_de_minas',
    name: 'Sul de Minas',
    description: 'Traditional coffee region with sweet, balanced profiles',
    mainCities: ['Varginha', 'Guaxupé', 'Poços de Caldas', 'Três Pontas', 'Alfenas'],
    characteristics: 'Sweet coffees, cooperatives, traditional processing',
    color: '#22C55E',
    estimatedCompanies: 45,
    country: 'Brazil'
  },
  {
    id: 'mogiana',
    name: 'Mogiana',
    description: 'Historic region known for high-quality arabica',
    mainCities: ['Franca', 'São Sebastião do Paraíso', 'Altinópolis', 'Cravinhos'],
    characteristics: 'High altitude, specialty coffees, family farms',
    color: '#EF4444',
    estimatedCompanies: 28,
    country: 'Brazil'
  },
  {
    id: 'cerrado',
    name: 'Cerrado',
    description: 'Modern mechanized farms with consistent quality',
    mainCities: ['Patrocínio', 'Carmo do Paranaíba', 'Monte Carmelo', 'Rio Paranaíba'],
    characteristics: 'Large farms, mechanization, certified coffees',
    color: '#F59E0B',
    estimatedCompanies: 32,
    country: 'Brazil'
  },
  {
    id: 'matas_de_minas',
    name: 'Matas de Minas',
    description: 'Emerging region with unique terroir',
    mainCities: ['Manhuaçu', 'Caratinga', 'Espera Feliz', 'Abre Campo'],
    characteristics: 'Mountain coffees, natural processing, small producers',
    color: '#8B5CF6',
    estimatedCompanies: 18,
    country: 'Brazil'
  },
  {
    id: 'santos',
    name: 'Santos',
    description: 'Major coffee port and trading hub',
    mainCities: ['Santos', 'São Paulo', 'Campinas'],
    characteristics: 'Export services, logistics, port facilities',
    color: '#06B6D4',
    estimatedCompanies: 25,
    country: 'Brazil'
  }
]

interface RegionBasedCompanySelectorProps {
  onRegionSelect: (regionId: string, suggestedCompanies: Company[]) => void
  onCustomSearch: (searchTerm: string) => void
  onNaturalLanguageSearch?: (searchTerm: string) => void
  selectedRegions: string[]
  isLoading?: boolean
}

export default function RegionBasedCompanySelector({
  onRegionSelect,
  onCustomSearch,
  onNaturalLanguageSearch,
  selectedRegions,
  isLoading = false
}: RegionBasedCompanySelectorProps) {
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [coffeeRegions, setCoffeeRegions] = useState<CoffeeRegion[]>(BASE_COFFEE_REGIONS)
  const [loadingRegions, setLoadingRegions] = useState(false)

  // Load dynamic regions from database on component mount
  useEffect(() => {
    loadDynamicRegions()
  }, [])

  const loadDynamicRegions = async () => {
    try {
      setLoadingRegions(true)
      const response = await fetch('/api/regions/discover', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const { dynamicRegions } = await response.json()
        if (dynamicRegions && dynamicRegions.length > 0) {
          // Merge base regions with dynamically discovered regions
          const combinedRegions = [...BASE_COFFEE_REGIONS]
          
          dynamicRegions.forEach((dynRegion: any) => {
            if (!combinedRegions.find(r => r.id === dynRegion.id)) {
              combinedRegions.push({
                ...dynRegion,
                color: getColorForCountry(dynRegion.country)
              })
            }
          })
          
          setCoffeeRegions(combinedRegions)
        }
      }
    } catch (error) {
      console.error('Failed to load dynamic regions:', error)
    } finally {
      setLoadingRegions(false)
    }
  }

  const getColorForCountry = (country: string) => {
    const colorMap: { [key: string]: string } = {
      'Brazil': '#22C55E',
      'Colombia': '#F59E0B', 
      'Guatemala': '#8B5CF6',
      'Honduras': '#EF4444',
      'Costa Rica': '#06B6D4',
      'Nicaragua': '#F97316',
      'El Salvador': '#84CC16'
    }
    return colorMap[country] || '#6B7280'
  }

  // Natural language parsing function
  const parseNaturalLanguageInput = (input: string) => {
    const patterns = [
      /(\w+)\s+for\s+(\d+)\s*(days?|nights?)/gi,
      /(\w+)\s*[-–]\s*(\d+)\s*(days?|nights?)/gi,
      /visit\s+(\w+)\s+(\d+)\s*(days?|nights?)/gi,
      /(\w+)\s+(\d+)\s*(days?|nights?)/gi
    ]

    const locations = []
    let match

    for (const pattern of patterns) {
      pattern.lastIndex = 0 // Reset regex
      while ((match = pattern.exec(input)) !== null) {
        const location = match[1].toLowerCase()
        const duration = parseInt(match[2])
        const unit = match[3].toLowerCase()
        
        locations.push({
          location: location.charAt(0).toUpperCase() + location.slice(1),
          duration,
          unit: unit.startsWith('night') ? 'nights' : 'days'
        })
      }
    }

    return locations
  }

  const handleRegionClick = async (region: CoffeeRegion) => {
    if (selectedRegions.includes(region.id)) return
    
    setAiSuggesting(true)
    
    try {
      // Call AI service to get companies for this region
      const response = await fetch('/api/ai/region-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          regionId: region.id,
          regionName: region.name,
          cities: region.mainCities 
        })
      })
      
      if (response.ok) {
        const { suggestedCompanies } = await response.json()
        onRegionSelect(region.id, suggestedCompanies)
      }
    } catch (error) {
      console.error('Failed to fetch region companies:', error)
    } finally {
      setAiSuggesting(false)
    }
  }

  const handleAISearch = async () => {
    if (!customInput.trim()) return
    
    setAiSuggesting(true)
    
    // Try to parse natural language input first
    const parsedLocations = parseNaturalLanguageInput(customInput)
    
    if (parsedLocations.length > 0 && onNaturalLanguageSearch) {
      console.log('Parsed locations:', parsedLocations)
      onNaturalLanguageSearch(JSON.stringify({ 
        type: 'natural_language', 
        input: customInput,
        locations: parsedLocations 
      }))
    } else {
      // Fall back to custom search
      onCustomSearch(customInput)
    }
    
    // Reset after a delay to show the processing state
    setTimeout(() => setAiSuggesting(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2" style={{ color: '#006D5B' }}>
          AI-Powered Regional Company Discovery
        </h3>
        <p className="text-sm" style={{ color: '#333333' }}>
          Select a Brazilian coffee region to automatically discover and suggest companies
        </p>
      </div>

      {/* Region Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loadingRegions && (
          <div className="col-span-full text-center py-4">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <Globe className="w-4 h-4 animate-spin" />
              <span className="text-sm">Discovering regions from database...</span>
            </div>
          </div>
        )}
        {coffeeRegions.map((region) => {
          const isSelected = selectedRegions.includes(region.id)
          const isProcessing = aiSuggesting && isSelected
          
          return (
            <div
              key={region.id}
              onClick={() => !isSelected && !aiSuggesting && handleRegionClick(region)}
              className={`
                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${isProcessing ? 'opacity-75' : ''}
                ${aiSuggesting && !isSelected ? 'cursor-not-allowed opacity-50' : ''}
              `}
              style={{
                borderColor: isSelected ? region.color : undefined
              }}
            >
              {/* Region Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: region.color }}
                  />
                  <h4 className="font-medium" style={{ color: '#006D5B' }}>
                    {region.name}
                  </h4>
                  {region.country !== 'Brazil' && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {region.country}
                    </span>
                  )}
                </div>
                
                {isProcessing && (
                  <Sparkles className="w-5 h-5 animate-pulse text-blue-500" />
                )}
                
                <div className="flex items-center text-xs text-gray-500">
                  <Building2 className="w-3 h-3 mr-1" />
                  {region.estimatedCompanies}
                </div>
              </div>

              {/* Region Description */}
              <p className="text-sm text-gray-600 mb-3">
                {region.description}
              </p>

              {/* Cities */}
              <div className="mb-3">
                <div className="flex items-center mb-1">
                  <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-500">Main Cities</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {region.mainCities.slice(0, 3).map((city, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                    >
                      {city}
                    </span>
                  ))}
                  {region.mainCities.length > 3 && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">
                      +{region.mainCities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Characteristics */}
              <div className="text-xs text-gray-500">
                <span className="font-medium">Characteristics:</span> {region.characteristics}
              </div>

              {/* Selection State */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: region.color }}
                  >
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Custom AI Search */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-3" style={{ color: '#006D5B' }}>
          Custom AI Search
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Describe your trip needs and let AI suggest the best companies and route
        </p>
        
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="e.g., Santos for 2 days, Sul de Minas for 3 days, Cerrado for 2 nights"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAISearch}
            disabled={!customInput.trim() || aiSuggesting}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
            style={{
              backgroundColor: aiSuggesting || !customInput.trim() ? '#9CA3AF' : '#059669',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              if (customInput.trim() && !aiSuggesting) {
                e.currentTarget.style.backgroundColor = '#FCC542'
                e.currentTarget.style.color = '#006D5B'
              }
            }}
            onMouseLeave={(e) => {
              if (customInput.trim() && !aiSuggesting) {
                e.currentTarget.style.backgroundColor = '#059669'
                e.currentTarget.style.color = 'white'
              }
            }}
          >
            {aiSuggesting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI Suggest</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500">
          <strong>Try examples:</strong> "Santos for 2 days then Sul de Minas for 3 days", 
          "Mogiana 2 nights, Cerrado 1 day", "Visit Colombia Huila for 3 days"
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>AI is discovering companies and optimizing your route...</span>
          </div>
        </div>
      )}
    </div>
  )
}