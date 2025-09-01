import React, { useState } from 'react'
import { MapPin, Building2, Users, Clock, Sparkles } from 'lucide-react'
import type { Company } from '@/types'

interface BrazilianCoffeeRegion {
  id: string
  name: string
  description: string
  mainCities: string[]
  characteristics: string
  color: string
  estimatedCompanies: number
}

const COFFEE_REGIONS: BrazilianCoffeeRegion[] = [
  {
    id: 'sul_de_minas',
    name: 'Sul de Minas',
    description: 'Traditional coffee region with sweet, balanced profiles',
    mainCities: ['Varginha', 'Guaxupé', 'Poços de Caldas', 'Três Pontas', 'Alfenas'],
    characteristics: 'Sweet coffees, cooperatives, traditional processing',
    color: '#22C55E',
    estimatedCompanies: 45
  },
  {
    id: 'mogiana',
    name: 'Mogiana',
    description: 'Historic region known for high-quality arabica',
    mainCities: ['Franca', 'São Sebastião do Paraíso', 'Altinópolis', 'Cravinhos'],
    characteristics: 'High altitude, specialty coffees, family farms',
    color: '#EF4444',
    estimatedCompanies: 28
  },
  {
    id: 'cerrado',
    name: 'Cerrado',
    description: 'Modern mechanized farms with consistent quality',
    mainCities: ['Patrocínio', 'Carmo do Paranaíba', 'Monte Carmelo', 'Rio Paranaíba'],
    characteristics: 'Large farms, mechanization, certified coffees',
    color: '#F59E0B',
    estimatedCompanies: 32
  },
  {
    id: 'matas_de_minas',
    name: 'Matas de Minas',
    description: 'Emerging region with unique terroir',
    mainCities: ['Manhuaçu', 'Caratinga', 'Espera Feliz', 'Abre Campo'],
    characteristics: 'Mountain coffees, natural processing, small producers',
    color: '#8B5CF6',
    estimatedCompanies: 18
  }
]

interface RegionBasedCompanySelectorProps {
  onRegionSelect: (regionId: string, suggestedCompanies: Company[]) => void
  onCustomSearch: (searchTerm: string) => void
  selectedRegions: string[]
  isLoading?: boolean
}

export default function RegionBasedCompanySelector({
  onRegionSelect,
  onCustomSearch,
  selectedRegions,
  isLoading = false
}: RegionBasedCompanySelectorProps) {
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const handleRegionClick = async (region: BrazilianCoffeeRegion) => {
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
    onCustomSearch(customInput)
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
        {COFFEE_REGIONS.map((region) => {
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
            placeholder="e.g., 3-day trip to visit specialty coffee farms in Minas Gerais"
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
          <strong>Try examples:</strong> "Visit 5 farms in Sul de Minas over 2 days", 
          "Mogiana specialty coffee tour", "Cerrado cooperative visits"
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