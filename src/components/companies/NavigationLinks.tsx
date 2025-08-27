'use client'

import { useState } from 'react'
import { Navigation, MapPin, Map, Route, ExternalLink, ChevronDown } from 'lucide-react'
import { NavigationService, NavigationApp, NavigationOptions } from '@/services/navigation'

interface NavigationLinksProps {
  location: {
    address?: string
    latitude?: number
    longitude?: number
    name?: string
  }
  className?: string
  showLabel?: boolean
  variant?: 'button' | 'dropdown' | 'inline'
}

export default function NavigationLinks({
  location,
  className = '',
  showLabel = true,
  variant = 'dropdown'
}: NavigationLinksProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!location.address && (!location.latitude || !location.longitude)) {
    return null
  }

  const navigationOptions: NavigationOptions = {
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    name: location.name
  }

  const allUrls = NavigationService.generateAllNavigationUrls(navigationOptions)
  const defaultApp = NavigationService.getDefaultNavigationApp()

  const handleNavigation = (app: NavigationApp) => {
    const url = NavigationService.generateNavigationUrl(app, navigationOptions)
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  const getAppIcon = (app: NavigationApp) => {
    switch (app) {
      case NavigationApp.GOOGLE_MAPS:
        return <MapPin className="w-4 h-4" />
      case NavigationApp.APPLE_MAPS:
        return <Map className="w-4 h-4" />
      case NavigationApp.WAZE:
        return <Navigation className="w-4 h-4" />
      default:
        return <Route className="w-4 h-4" />
    }
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {Object.entries(allUrls).map(([app, url]) => (
          <button
            key={app}
            onClick={() => handleNavigation(app as NavigationApp)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title={`Abrir no ${NavigationService.getAppDisplayName(app as NavigationApp)}`}
          >
            {getAppIcon(app as NavigationApp)}
            {NavigationService.getAppDisplayName(app as NavigationApp)}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <button
        onClick={() => handleNavigation(defaultApp)}
        className={`flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors ${className}`}
      >
        <Navigation className="w-4 h-4" />
        {showLabel && 'Navegar'}
        <ExternalLink className="w-3 h-3" />
      </button>
    )
  }

  // Dropdown variant (default)
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
      >
        <Navigation className="w-4 h-4" />
        {showLabel && 'Navegar'}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {Object.entries(allUrls).map(([app, url]) => (
                <button
                  key={app}
                  onClick={() => handleNavigation(app as NavigationApp)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
                >
                  {getAppIcon(app as NavigationApp)}
                  <span>{NavigationService.getAppDisplayName(app as NavigationApp)}</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />
                </button>
              ))}
            </div>
            
            {/* Address Preview */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {location.address || `${location.latitude}, ${location.longitude}`}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}