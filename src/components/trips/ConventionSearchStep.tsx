import React, { useState, useEffect } from 'react'
import { Search, Calendar, MapPin, Globe, Plus, Check, Loader2, ExternalLink } from 'lucide-react'
import { TripFormData } from './TripCreationModal'
import { searchEvents } from '@/services/eventSearchService'
import { EnrichedEvent } from '@/services/eventSearchService'

interface ConventionSearchStepProps {
  formData: TripFormData & { selectedConvention?: EnrichedEvent }
  updateFormData: (data: Partial<TripFormData & { selectedConvention?: EnrichedEvent }>) => void
}

const allCoffeeConventions: EnrichedEvent[] = [
  {
    id: 'sintercafe-2025',
    name: 'Sintercafe 2025',
    organization: 'Costa Rica Coffee Industry Association',
    description: 'Annual international coffee week bringing together key decision makers from the most important coffee companies worldwide.',
    startDate: '2025-11-13',
    endDate: '2025-11-16',
    location: {
      name: 'InterContinental Costa Rica at Multiplaza Mall',
      city: 'San José',
      country: 'Costa Rica',
      address: 'Autopista Próspero Fernández, Escazú, San José'
    },
    website: 'https://sintercafe.com',
    confidence: 1.0,
    is_predefined: true
  },
  {
    id: 'sic-2025',
    name: 'Sustainable & Innovative Coffee Symposium 2025',
    organization: 'Sustainable Coffee Challenge',
    description: 'Focus on sustainability, innovation, and the future of coffee production and consumption.',
    startDate: '2025-10-08',
    endDate: '2025-10-10',
    location: {
      name: 'Amsterdam RAI Convention Centre',
      city: 'Amsterdam',
      country: 'Netherlands',
      address: 'Europaplein, 1078 GZ Amsterdam'
    },
    website: 'https://www.sustainablecoffeechallenge.org',
    confidence: 1.0,
    is_predefined: true
  },
  {
    id: 'host-2025',
    name: 'HOST Milano 2025',
    organization: 'Fiera Milano',
    description: 'International hospitality exhibition featuring coffee equipment, technology, and innovations.',
    startDate: '2025-10-17',
    endDate: '2025-10-21',
    location: {
      name: 'Fiera Milano',
      city: 'Milan',
      country: 'Italy',
      address: 'Strada Statale del Sempione, 28, 20017 Rho MI'
    },
    website: 'https://www.host.fieramilano.it',
    confidence: 1.0,
    is_predefined: true
  },
  {
    id: 'coffee-fest-winter-2026',
    name: 'Coffee Fest 2026',
    organization: 'Coffee Fest Events',
    description: 'Regional coffee trade show featuring equipment, education, and competitions for coffee professionals.',
    startDate: '2026-02-20',
    endDate: '2026-02-22',
    location: {
      name: 'Anaheim Convention Center',
      city: 'Anaheim',
      country: 'USA',
      address: '800 W Katella Ave, Anaheim, CA 92802'
    },
    website: 'https://www.coffeefest.com',
    confidence: 1.0,
    is_predefined: true
  },
  {
    id: 'nca-2026',
    name: 'National Coffee Association Convention 2026',
    organization: 'National Coffee Association of USA',
    description: 'The premier gathering for coffee industry professionals, featuring networking, education, and the latest industry trends.',
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    location: {
      name: 'Miami Beach Convention Center',
      city: 'Miami Beach',
      country: 'USA',
      address: '1901 Convention Center Dr, Miami Beach, FL 33139'
    },
    website: 'https://www.ncausa.org',
    confidence: 1.0,
    is_predefined: true
  },
  {
    id: 'sca-expo-2026',
    name: 'Specialty Coffee Expo 2026',
    organization: 'Specialty Coffee Association',
    description: 'The largest coffee trade show in the world, bringing together the global specialty coffee community.',
    startDate: '2026-04-23',
    endDate: '2026-04-25',
    location: {
      name: 'Chicago McCormick Place',
      city: 'Chicago',
      country: 'USA',
      address: '2301 S King Dr, Chicago, IL 60616'
    },
    website: 'https://specialtycoffee.org',
    confidence: 1.0,
    is_predefined: true
  },
  {
    id: 'world-of-coffee-2026',
    name: 'World of Coffee 2026',
    organization: 'Specialty Coffee Association Europe',
    description: 'Europe\'s premier specialty coffee event featuring competitions, education, and exhibition.',
    startDate: '2026-06-25',
    endDate: '2026-06-27',
    location: {
      name: 'Copenhagen Bella Center',
      city: 'Copenhagen',
      country: 'Denmark',
      address: 'Center Blvd 5, 2300 København S'
    },
    website: 'https://www.worldofcoffee.org',
    confidence: 1.0,
    is_predefined: true
  },
  {
    id: 'scaj-2026',
    name: 'SCAJ World Specialty Coffee Conference 2026',
    organization: 'Specialty Coffee Association of Japan',
    description: 'Asia\'s premier specialty coffee event showcasing innovations and trends in the Asian coffee market.',
    startDate: '2026-09-24',
    endDate: '2026-09-26',
    location: {
      name: 'Tokyo Big Sight',
      city: 'Tokyo',
      country: 'Japan',
      address: '3 Chome-11-1 Ariake, Koto City, Tokyo 135-0063'
    },
    website: 'https://www.scaj.org',
    confidence: 1.0,
    is_predefined: true
  }
]

// Filter to show only upcoming events, max 6
const predefinedConventions = allCoffeeConventions
  .filter(event => {
    const eventDate = new Date(event.startDate || '')
    const today = new Date()
    return eventDate > today
  })
  .slice(0, 6)

export default function ConventionSearchStep({ formData, updateFormData }: ConventionSearchStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<EnrichedEvent[]>([])
  const [showPredefined, setShowPredefined] = useState(true)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setShowPredefined(false)

    try {
      const events = await searchEvents(searchQuery)
      setSearchResults(events)
    } catch (error) {
      console.error('Event search error:', error)
      // Fallback result if search fails
      const fallbackResult: EnrichedEvent = {
        id: `fallback-${Date.now()}`,
        name: `${searchQuery} Conference 2025`,
        description: `Professional event related to ${searchQuery}`,
        confidence: 0.1
      }
      
      setSearchResults([fallbackResult])
    } finally {
      setIsSearching(false)
    }
  }

  const selectConvention = (event: EnrichedEvent) => {
    updateFormData({ 
      selectedConvention: event,
      title: `${event.name} ${new Date().getFullYear()}`,
      startDate: event.startDate ? new Date(event.startDate) : null,
      endDate: event.endDate ? new Date(event.endDate) : null,
      description: event.description
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
      <div className="relative mb-2">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for conventions, conferences, or events..."
              style={{ paddingLeft: '36px' }}
              className="w-full pr-4 py-3 border border-pearl-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isSearching}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
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
            {searchResults.map(event => (
              <div
                key={event.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  formData.selectedConvention?.id === event.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
                onClick={() => selectConvention(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-golden-400">
                        {event.name}
                      </h4>
                      {formData.selectedConvention?.id === event.id && (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                      {event.confidence && event.confidence < 1 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded">
                          AI Found
                        </span>
                      )}
                    </div>
                    
                    {event.organization && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                        {event.organization}
                      </div>
                    )}
                    
                    {event.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                        {event.description}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {event.location?.country && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {event.location.city ? `${event.location.city}, ` : ''}
                            {event.location.country}
                          </span>
                        </div>
                      )}
                      {(event.startDate || event.endDate) && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span className={`${
                            new Date(event.startDate || '').getFullYear() === 2025 
                              ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
                              : ''
                          }`}>
                            {event.startDate && new Date(event.startDate).toLocaleDateString()} 
                            {event.startDate && event.endDate && ' - '}
                            {event.endDate && new Date(event.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {event.website && (
                        <div className="flex items-center space-x-1">
                          <ExternalLink className="w-3 h-3" />
                          <a 
                            href={event.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-emerald-600 dark:hover:text-emerald-400"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Website
                          </a>
                        </div>
                      )}
                      {event.registrationUrl && (
                        <div className="flex items-center space-x-1">
                          <Plus className="w-3 h-3" />
                          <a 
                            href={event.registrationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Register
                          </a>
                        </div>
                      )}
                      {event.confidence && event.confidence >= 0.8 && (
                        <div className="flex items-center space-x-1">
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 dark:text-green-400 text-xs">Verified</span>
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
          <div className="space-y-2">
            {formData.selectedConvention.location && (
              <div className="flex items-center space-x-2 text-sm text-emerald-700 dark:text-emerald-400">
                <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>
                  {formData.selectedConvention.location.name || ''}
                  {formData.selectedConvention.location.city && `, ${formData.selectedConvention.location.city}`}
                  {formData.selectedConvention.location.country && ` - ${formData.selectedConvention.location.country}`}
                </span>
              </div>
            )}
            {(formData.selectedConvention.startDate || formData.selectedConvention.endDate) && (
              <div className="flex items-center space-x-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                <span>
                  {formData.selectedConvention.startDate && new Date(formData.selectedConvention.startDate).toLocaleDateString()}
                  {formData.selectedConvention.startDate && formData.selectedConvention.endDate && ' - '}
                  {formData.selectedConvention.endDate && new Date(formData.selectedConvention.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
            {formData.selectedConvention.description && (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 line-clamp-2">
                {formData.selectedConvention.description}
              </div>
            )}
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Great choice! Click "Next" to continue with attendee selection and travel arrangements.
            </p>
          </div>
        </div>
      )}

      {/* Add Custom Event Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
        <button 
          onClick={() => {
            const customEvent: EnrichedEvent = {
              id: `custom-${Date.now()}`,
              name: 'Custom Event',
              description: 'Create a custom event for your trip',
              confidence: 0,
              is_predefined: false
            }
            selectConvention(customEvent)
          }}
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <Plus className="w-4 h-4" />
          <span>Can't find your event? Add custom event</span>
        </button>
      </div>
    </div>
  )
}