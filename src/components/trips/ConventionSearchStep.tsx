import React, { useState, useEffect } from 'react'
import { Search, Calendar, MapPin, Globe, Plus, Check, Loader2, ExternalLink } from 'lucide-react'
import { TripFormData } from './TripCreationModal'

interface Convention {
  id: string
  name: string
  organization?: string
  website?: string
  typical_location?: string
  date_pattern?: string
  description?: string
  search_keywords?: string[]
  is_predefined?: boolean
}

interface ConventionEvent {
  id: string
  convention_id: string
  year: number
  start_date?: string
  end_date?: string
  location?: string
  venue?: string
  registration_url?: string
  estimated_cost?: number
  notes?: string
  is_confirmed?: boolean
}

interface ConventionSearchStepProps {
  formData: TripFormData & { selectedConvention?: Convention; selectedEvent?: ConventionEvent }
  updateFormData: (data: Partial<TripFormData & { selectedConvention?: Convention; selectedEvent?: ConventionEvent }>) => void
}

// Mock predefined conventions data - will be replaced with API calls
const predefinedConventions: Convention[] = [
  {
    id: '1',
    name: 'NCA Convention',
    organization: 'National Coffee Association USA',
    website: 'https://www.ncausa.org/Convention',
    typical_location: 'United States',
    date_pattern: 'Annual - Usually March/April',
    description: 'Premier coffee industry event in the United States',
    search_keywords: ['NCA', 'coffee', 'convention', 'national', 'usa'],
    is_predefined: true
  },
  {
    id: '2',
    name: 'Swiss Coffee Dinner',
    organization: 'Swiss Coffee Trade Association',
    website: 'https://www.sc-ta.ch/events/forum-dinner-2025/',
    typical_location: 'Switzerland',
    date_pattern: 'Annual - Usually November',
    description: 'Swiss Coffee Trade Association forum dinner',
    search_keywords: ['SCTA', 'swiss', 'coffee', 'dinner', 'forum'],
    is_predefined: true
  },
  {
    id: '3',
    name: 'Semana Internacional do Café',
    organization: 'SIC',
    website: '',
    typical_location: 'Brazil',
    date_pattern: 'Annual - Usually October/November',
    description: 'International Coffee Week in Brazil',
    search_keywords: ['SIC', 'semana', 'cafe', 'international', 'brazil'],
    is_predefined: true
  }
]

export default function ConventionSearchStep({ formData, updateFormData }: ConventionSearchStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Convention[]>([])
  const [showPredefined, setShowPredefined] = useState(true)

  useEffect(() => {
    // Filter predefined conventions based on search query
    const filtered = predefinedConventions.filter(conv => 
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.search_keywords?.some(keyword => 
        keyword.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    setSearchResults(filtered)
  }, [searchQuery])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowPredefined(false)

    try {
      const response = await fetch('/api/ai/search-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery: searchQuery.trim() })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()

      if (data.success && data.events) {
        const aiResults: Convention[] = data.events.map((event: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          name: event.name,
          organization: event.organization || 'Found via AI Search',
          website: event.website || '',
          typical_location: event.location || 'Various Locations',
          date_pattern: event.dates || 'To be determined',
          description: event.description || `Event related to ${searchQuery}`,
          search_keywords: [searchQuery],
          is_predefined: false
        }))

        // Filter out duplicates and add to existing results
        const existingNames = searchResults.map(r => r.name.toLowerCase())
        const newResults = aiResults.filter(result => 
          !existingNames.includes(result.name.toLowerCase())
        )
        
        setSearchResults(prev => [...prev, ...newResults])
      } else {
        // Fallback result if AI search returns no events
        const fallbackResult: Convention = {
          id: `fallback-${Date.now()}`,
          name: `${searchQuery} Conference 2025`,
          organization: 'Custom Event',
          description: `Professional event related to ${searchQuery}`,
          typical_location: 'To be determined',
          date_pattern: 'To be scheduled',
          is_predefined: false
        }
        
        setSearchResults(prev => [...prev, fallbackResult])
      }
    } catch (error) {
      console.error('Search error:', error)
      
      // Fallback on error
      const fallbackResult: Convention = {
        id: `error-fallback-${Date.now()}`,
        name: `${searchQuery} Event 2025`,
        organization: 'Custom Event',
        description: `Custom event for ${searchQuery} (AI search unavailable)`,
        typical_location: 'To be determined',
        date_pattern: 'To be scheduled',
        is_predefined: false
      }
      
      setSearchResults(prev => [...prev, fallbackResult])
    } finally {
      setIsSearching(false)
    }
  }

  const selectConvention = (convention: Convention) => {
    updateFormData({ 
      selectedConvention: convention,
      title: `${convention.name} ${new Date().getFullYear()}` 
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
          Search for Convention or Event
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Search our database of known events or let our AI find new ones for you.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for conventions, conferences, or events..."
              className="w-full pl-10 pr-4 py-2 border border-pearl-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Quick Access to Predefined Conventions */}
      {showPredefined && !searchQuery && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Popular Conventions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predefinedConventions.map(convention => (
              <button
                key={convention.id}
                onClick={() => selectConvention(convention)}
                className="text-left p-4 border border-pearl-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-golden-400 mb-1">
                  {convention.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {convention.organization}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {convention.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {(searchQuery || !showPredefined) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Results
            </h3>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowPredefined(true)
                  setSearchResults([])
                }}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Clear search
              </button>
            )}
          </div>

          <div className="space-y-3">
            {searchResults.map(convention => (
              <div
                key={convention.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.selectedConvention?.id === convention.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
                onClick={() => selectConvention(convention)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-golden-400">
                        {convention.name}
                      </h4>
                      {formData.selectedConvention?.id === convention.id && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                      {!convention.is_predefined && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded">
                          AI Found
                        </span>
                      )}
                    </div>
                    
                    {convention.organization && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {convention.organization}
                      </div>
                    )}
                    
                    {convention.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {convention.description}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {convention.typical_location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{convention.typical_location}</span>
                        </div>
                      )}
                      {convention.date_pattern && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{convention.date_pattern}</span>
                        </div>
                      )}
                      {convention.website && (
                        <div className="flex items-center space-x-1">
                          <ExternalLink className="w-3 h-3" />
                          <a 
                            href={convention.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-emerald-600 dark:hover:text-emerald-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="ml-2 text-gray-500 dark:text-gray-400">
                  Searching for events...
                </span>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No events found for "{searchQuery}". Try a different search term.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Convention Details */}
      {formData.selectedConvention && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-medium text-emerald-800 dark:text-emerald-300">
              Selected: {formData.selectedConvention.name}
            </h3>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            Great choice! Click "Next" to continue with attendee selection and travel arrangements.
          </p>
        </div>
      )}

      {/* Add Custom Event Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
        <button className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400">
          <Plus className="w-4 h-4" />
          <span>Can't find your event? Add custom event</span>
        </button>
      </div>
    </div>
  )
}