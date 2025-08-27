export enum NavigationApp {
  GOOGLE_MAPS = 'google_maps',
  APPLE_MAPS = 'apple_maps',
  WAZE = 'waze'
}

export interface NavigationOptions {
  address?: string
  latitude?: number
  longitude?: number
  name?: string
}

export class NavigationService {
  /**
   * Generate navigation URL for specified app
   */
  static generateNavigationUrl(app: NavigationApp, options: NavigationOptions): string {
    const { address, latitude, longitude, name } = options

    // Prefer coordinates if available, fallback to address
    const query = (latitude && longitude) 
      ? `${latitude},${longitude}`
      : address || ''

    switch (app) {
      case NavigationApp.GOOGLE_MAPS:
        if (latitude && longitude) {
          return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${name ? encodeURIComponent(name) : ''}`
        }
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`

      case NavigationApp.APPLE_MAPS:
        if (latitude && longitude) {
          return `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`
        }
        return `https://maps.apple.com/?daddr=${encodeURIComponent(query)}&dirflg=d`

      case NavigationApp.WAZE:
        if (latitude && longitude) {
          return `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
        }
        // Waze doesn't handle address strings well, so use coordinates when possible
        return `https://www.waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`

      default:
        throw new Error(`Unsupported navigation app: ${app}`)
    }
  }

  /**
   * Generate all navigation URLs for a location
   */
  static generateAllNavigationUrls(options: NavigationOptions) {
    return {
      [NavigationApp.GOOGLE_MAPS]: this.generateNavigationUrl(NavigationApp.GOOGLE_MAPS, options),
      [NavigationApp.APPLE_MAPS]: this.generateNavigationUrl(NavigationApp.APPLE_MAPS, options),
      [NavigationApp.WAZE]: this.generateNavigationUrl(NavigationApp.WAZE, options)
    }
  }

  /**
   * Get navigation app display names
   */
  static getAppDisplayName(app: NavigationApp): string {
    switch (app) {
      case NavigationApp.GOOGLE_MAPS:
        return 'Google Maps'
      case NavigationApp.APPLE_MAPS:
        return 'Apple Maps'
      case NavigationApp.WAZE:
        return 'Waze'
      default:
        return app
    }
  }

  /**
   * Get navigation app icons (using Lucide icons)
   */
  static getAppIcon(app: NavigationApp): string {
    switch (app) {
      case NavigationApp.GOOGLE_MAPS:
        return 'map-pin'
      case NavigationApp.APPLE_MAPS:
        return 'map'
      case NavigationApp.WAZE:
        return 'navigation'
      default:
        return 'map-pin'
    }
  }

  /**
   * Detect user's platform for default navigation app
   */
  static getDefaultNavigationApp(): NavigationApp {
    if (typeof window === 'undefined') return NavigationApp.GOOGLE_MAPS
    
    const userAgent = window.navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    
    return isIOS ? NavigationApp.APPLE_MAPS : NavigationApp.GOOGLE_MAPS
  }
}