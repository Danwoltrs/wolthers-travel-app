import React, { useState, useEffect } from 'react';
import { CoffeeEvent, scrapeCoffeeEvents, searchCoffeeEvents } from '@/services/coffee-events/scraper';
import { Calendar, MapPin, Search, Plus, Check, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { TripFormData } from '../trips/TripCreationModal';

interface CoffeeEventCarouselProps {
  formData?: TripFormData & { selectedConvention?: any }
  updateFormData?: (data: Partial<TripFormData & { selectedConvention?: any }>) => void
}

export const CoffeeEventCarousel: React.FC<CoffeeEventCarouselProps> = ({ formData, updateFormData }) => {
  const [events, setEvents] = useState<CoffeeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Use API route instead of direct scraping
        const response = await fetch('/api/coffee-events?scraping=false');
        const data = await response.json();
        
        if (data.success && data.events) {
          setEvents(data.events);
        } else {
          console.error('Failed to fetch coffee events:', data.error);
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching coffee events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // Reset to all events
      setIsLoading(true);
      try {
        const response = await fetch('/api/coffee-events?scraping=false');
        const data = await response.json();
        
        if (data.success && data.events) {
          setEvents(data.events);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching coffee events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/coffee-events?query=${encodeURIComponent(searchQuery)}&scraping=false`);
      const data = await response.json();
      
      if (data.success && data.events) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error searching coffee events:', error);
      setEvents([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectConvention = (event: CoffeeEvent) => {
    if (updateFormData) {
      const eventData = {
        id: event.id,
        name: event.name,
        organization: event.organization || 'Coffee Industry Event',
        description: event.description || `Professional coffee industry event: ${event.name}`,
        startDate: event.date.toISOString().split('T')[0],
        endDate: event.date.toISOString().split('T')[0],
        location: {
          name: event.location,
          city: event.location,
          country: 'TBD'
        },
        website: event.url,
        confidence: 1.0,
        is_predefined: true
      };

      updateFormData({
        selectedConvention: eventData,
        title: `${event.name} ${new Date().getFullYear()}`,
        startDate: event.date,
        endDate: event.date,
        description: event.description || `Business trip for ${event.name}`
      });
    }
  };

  const renderEventCard = (event: CoffeeEvent) => {
    const isSelected = formData?.selectedConvention?.id === event.id;
    
    return (
      <button
        key={event.id}
        onClick={() => selectConvention(event)}
        className={clsx(
          'text-left p-4 border rounded-lg transition-all cursor-pointer',
          isSelected
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-emerald-300 dark:hover:border-emerald-600'
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-golden-400">
                {event.name}
              </h3>
              {isSelected && (
                <Check className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {event.organization || 'Coffee Industry Event'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
              {event.description || `Professional coffee industry event featuring networking, education, and industry insights.`}
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{event.date.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
              {event.url && (
                <div className="flex items-center space-x-1">
                  <ExternalLink className="w-3 h-3" />
                  <a
                    href={event.url}
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
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
          Coffee Industry Conventions & Events
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Select from upcoming coffee industry events including World of Coffee, NCA, SCA, Swiss Coffee events, and Santos seminars.
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
              placeholder="Search coffee conventions and events..."
              style={{ paddingLeft: '36px' }}
              className="w-full pr-4 py-3 border border-pearl-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2 font-medium"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
          </button>
        </div>
      </div>

      {/* Coffee Industry Events */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Popular Coffee Industry Conventions
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <span className="ml-2 text-gray-500 dark:text-gray-400">
              Loading coffee industry events...
            </span>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events
              .filter(event => 
                !searchQuery || 
                event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (event.organization && event.organization.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map(renderEventCard)
            }
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No coffee industry events found. Please try again later.
          </div>
        )}
      </div>

      {/* Selected Convention Details */}
      {formData?.selectedConvention && (
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
                  {typeof formData.selectedConvention.location === 'string' 
                    ? formData.selectedConvention.location
                    : `${formData.selectedConvention.location.name || ''}, ${formData.selectedConvention.location.city || ''} - ${formData.selectedConvention.location.country || ''}`
                  }
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
            if (updateFormData) {
              const customEvent = {
                id: `custom-${Date.now()}`,
                name: 'Custom Coffee Event',
                description: 'Create a custom coffee industry event for your trip',
                confidence: 0,
                is_predefined: false
              };
              updateFormData({
                selectedConvention: customEvent,
                title: 'Custom Coffee Event Trip',
                description: 'Business trip for custom coffee industry event'
              });
            }
          }}
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
        >
          <Plus className="w-4 h-4" />
          <span>Can't find your event? Add custom coffee event</span>
        </button>
      </div>
    </div>
  );
};