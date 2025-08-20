'use client'

import { useState, useEffect } from 'react'
import { Route, MapPin, Clock, Navigation, Zap, AlertTriangle, CheckCircle } from 'lucide-react'
import { optimizeTripRoute, formatTravelTime, formatDistance } from '@/lib/trip-route-optimizer'
import type { TripLocation, OptimizedRoute, RouteSuggestion } from '@/lib/trip-route-optimizer'

interface RouteOptimizationPanelProps {
  tripId: string
  locations: TripLocation[]
  onOptimizedRouteChange?: (route: OptimizedRoute) => void
}

export default function RouteOptimizationPanel({ 
  tripId, 
  locations, 
  onOptimizedRouteChange 
}: RouteOptimizationPanelProps) {
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  useEffect(() => {
    if (locations.length >= 2) {
      handleOptimizeRoute()
    }
  }, [locations])

  const handleOptimizeRoute = async () => {
    if (locations.length < 2) return

    setIsOptimizing(true)
    try {
      // Find start and end locations (hotels/airports typically)
      const startLocation = locations.find(loc => loc.type === 'hotel' || loc.type === 'airport')
      const endLocation = locations.find(loc => 
        (loc.type === 'hotel' || loc.type === 'airport') && loc.id !== startLocation?.id
      )

      const route = await optimizeTripRoute(locations, {
        startLocation,
        endLocation,
        prioritizeTime: true,
        respectTimeSlots: true
      })

      setOptimizedRoute(route)
      onOptimizedRouteChange?.(route)
    } catch (error) {
      console.error('Route optimization failed:', error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getSuggestionIcon = (type: RouteSuggestion['type']) => {
    switch (type) {
      case 'time_optimization':
        return <Clock className="w-4 h-4" />
      case 'proximity_grouping':
        return <MapPin className="w-4 h-4" />
      case 'priority_reorder':
        return <Zap className="w-4 h-4" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getSuggestionColor = (impact: RouteSuggestion['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      case 'medium':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
      case 'low':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
    }
  }

  const getLocationIcon = (type: TripLocation['type']) => {
    switch (type) {
      case 'hotel':
        return '🏨'
      case 'company':
        return '🏢'
      case 'restaurant':
        return '🍽️'
      case 'airport':
        return '✈️'
      case 'activity':
        return '📍'
      default:
        return '📍'
    }
  }

  if (locations.length < 2) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <div className="text-center">
          <Route className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Add at least 2 locations to see route optimization suggestions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Optimization Controls */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 flex items-center gap-2">
            <Route className="w-5 h-5" />
            Route Optimization
          </h3>
          <button
            onClick={handleOptimizeRoute}
            disabled={isOptimizing}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
          </button>
        </div>

        {optimizedRoute && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Distance</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatDistance(optimizedRoute.totalDistance)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Travel Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatTravelTime(optimizedRoute.totalTravelTime)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {optimizedRoute.estimatedStartTime}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {optimizedRoute.estimatedEndTime}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Optimization Suggestions */}
      {optimizedRoute && optimizedRoute.suggestions.length > 0 && showSuggestions && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-golden-400">
              Optimization Suggestions
            </h4>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {optimizedRoute.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${getSuggestionColor(suggestion.impact)}`}
              >
                {getSuggestionIcon(suggestion.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{suggestion.message}</p>
                  {suggestion.timeSaved && (
                    <p className="text-xs mt-1">
                      Time saved: {formatTravelTime(suggestion.timeSaved)}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  suggestion.impact === 'high' 
                    ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                    : suggestion.impact === 'medium'
                    ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {suggestion.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimized Route Display */}
      {optimizedRoute && (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-golden-400 mb-4">
            Optimized Route
          </h4>
          
          <div className="space-y-3">
            {optimizedRoute.orderedLocations.map((location, index) => (
              <div key={location.id} className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-lg">{getLocationIcon(location.type)}</span>
                </div>
                
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {location.name}
                  </h5>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {location.address}
                  </p>
                  {location.timeSlots?.preferredStart && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Preferred: {location.timeSlots.preferredStart}
                      {location.timeSlots.duration && ` (${location.timeSlots.duration}min)`}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    Priority: {location.priority}/5
                  </div>
                  {index < optimizedRoute.segments.length && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Next: {formatDistance(optimizedRoute.segments[index].distance)} 
                      ({formatTravelTime(optimizedRoute.segments[index].duration)})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}