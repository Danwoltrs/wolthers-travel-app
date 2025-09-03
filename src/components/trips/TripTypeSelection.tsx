import React, { useState } from 'react'
import { Calendar, MapPin, Search, Globe, Building2 } from 'lucide-react'

export type TripType = 'convention' | 'in_land'

interface TripTypeSelectionProps {
  selectedType: TripType | null
  onTypeSelect: (type: TripType) => void
}

export default function TripTypeSelection({ selectedType, onTypeSelect }: TripTypeSelectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-emerald-300 mb-4">
          Choose Trip Type
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Select the type of trip you want to create. This will determine the available options and workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Convention Trip Option */}
        <div 
          className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 p-6 ${
            selectedType === 'convention' 
              ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
              : 'border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-emerald-300 dark:hover:border-emerald-700'
          }`}
          onClick={() => onTypeSelect('convention')}
        >
          {/* Selection Indicator */}
          <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-200 ${
            selectedType === 'convention'
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selectedType === 'convention' && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${
                selectedType === 'convention' 
                  ? 'bg-emerald-100 dark:bg-emerald-800/50' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Calendar className={`w-6 h-6 ${
                  selectedType === 'convention' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300">
                  Convention Trip
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Industry events & conferences
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <Search className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Smart event search with pre-filled conventions (NCA, SCTA, SIC)
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Globe className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  AI-powered event discovery and intelligent naming
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Building2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Hotel and business class flight suggestions
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Perfect for: Conference attendance, trade shows, industry events
              </p>
            </div>
          </div>
        </div>

        {/* In-land Trip Option */}
        <div 
          className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 p-6 ${
            selectedType === 'in_land' 
              ? 'border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
              : 'border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] hover:border-emerald-300 dark:hover:border-emerald-700'
          }`}
          onClick={() => onTypeSelect('in_land')}
        >
          {/* Selection Indicator */}
          <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 transition-all duration-200 ${
            selectedType === 'in_land'
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {selectedType === 'in_land' && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${
                selectedType === 'in_land' 
                  ? 'bg-emerald-100 dark:bg-emerald-800/50' 
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <MapPin className={`w-6 h-6 ${
                  selectedType === 'in_land' 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-emerald-300">
                  In-land Trip
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Business visits & custom itineraries
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <Building2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Multi-company selection with dynamic user management
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <Search className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  AI-powered itinerary generation and optimization
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">
                  Company location suggestions and visit history
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Perfect for: Client visits, facility tours, business meetings
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedType && (
        <div className="mt-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {selectedType === 'convention' ? 'Convention Trip' : 'In-land Trip'} selected
            </p>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
            Click "Next" to continue with the {selectedType === 'convention' ? 'event search' : 'trip details'} configuration.
          </p>
        </div>
      )}
    </div>
  )
}