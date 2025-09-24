'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, Calendar } from 'lucide-react'
import type { ItineraryDay } from '@/types'

interface RouteMapProps {
  itineraryDays: ItineraryDay[]
  tripTitle: string
  activities?: any[]
  tripStartDate?: Date
  tripEndDate?: Date
}

declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

// Helper function to generate ICS calendar file
const generateICSContent = (activities: any[], tripTitle: string) => {
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const escapeText = (text: string) => {
    return text.replace(/([\\;,\n])/g, '\\$1')
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wolthers & Associates//Trip Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ]

  activities.forEach((activity, index) => {
    const activityDate = new Date(activity.activity_date)
    const startTime = activity.start_time || '09:00:00'
    const endTime = activity.end_time || '10:00:00'
    
    const startDateTime = new Date(`${activity.activity_date}T${startTime}`)
    const endDateTime = new Date(`${activity.activity_date}T${endTime}`)

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${activity.id}@wolthers-travel.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDateTime)}`,
      `DTEND:${formatDate(endDateTime)}`,
      `SUMMARY:${escapeText(activity.title)}`,
      `DESCRIPTION:${escapeText(activity.description || '')}`,
      `LOCATION:${escapeText(activity.location || activity.custom_location || '')}`,
      `CATEGORIES:${tripTitle}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    )
  })

  icsContent.push('END:VCALENDAR')
  return icsContent.join('\r\n')
}

const downloadICSFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

export default function RouteMap({ itineraryDays, tripTitle, activities = [], tripStartDate, tripEndDate }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleExportAllToCalendar = () => {
    if (activities.length === 0) return
    
    const icsContent = generateICSContent(activities, tripTitle)
    const filename = `${tripTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_full_itinerary.ics`
    downloadICSFile(icsContent, filename)
  }

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap()
        return
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Script already exists, wait for it to load
        const checkGoogle = () => {
          if (window.google) {
            initializeMap()
          } else {
            setTimeout(checkGoogle, 100)
          }
        }
        checkGoogle()
        return
      }

      // Check if API key is available
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setError('Google Maps API key not configured')
        setIsLoading(false)
        return
      }

      // Create the script tag
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,geometry&loading=async&callback=initMap`
      script.async = true
      script.defer = true
      
      // Set up the callback
      window.initMap = initializeMap
      script.onload = () => {
        // Additional safety check - wait for all libs to load
        if (window.google?.maps?.Map && window.google?.maps?.Geocoder) {
          initializeMap()
        }
      }
      
      script.onerror = () => {
        setError('Failed to load Google Maps')
        setIsLoading(false)
      }

      document.head.appendChild(script)

      return () => {
        // Only clean up if this component added the script
        const scriptToRemove = document.querySelector('script[src*="maps.googleapis.com"]')
        if (scriptToRemove) {
          document.head.removeChild(scriptToRemove)
        }
        window.initMap = undefined
      }
    }

    const initializeMap = async () => {
      if (!mapRef.current) return

      try {
        // Wait for Google Maps API to be fully loaded
        if (!window.google?.maps?.Map || !window.google?.maps?.Geocoder) {
          console.warn('Google Maps API not fully loaded, waiting...')
          setTimeout(() => initializeMap(), 100)
          return
        }

        // Extract locations from activities (now async)
        const locations = await extractLocations()
        
        if (locations.length === 0) {
          setError('No locations found in itinerary')
          setIsLoading(false)
          return
        }

        // Initialize map with Map ID for Advanced Markers
        // Note: When using mapId, styles must be configured in Google Cloud Console
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 8,
          center: locations[0],
          mapTypeId: 'terrain',
          mapId: 'WOLTHERS_TRAVEL_MAP', // Required for Advanced Markers
          // styles removed - must be configured in Cloud Console when using mapId
        })

        mapInstanceRef.current = map

        // Add markers for each location using the new AdvancedMarkerElement with fallback
        const markers: any[] = []
        let useAdvancedMarkers = true
        
        try {
          const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker')
          
          locations.forEach((location, index) => {
            try {
              // Create a custom marker element
              const markerElement = document.createElement('div')
              markerElement.className = 'custom-marker'
              markerElement.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid #ffffff;
                background-color: ${index === 0 ? '#10b981' : index === locations.length - 1 ? '#ef4444' : '#f59e0b'};
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
              `

              const marker = new AdvancedMarkerElement({
                position: { lat: location.lat, lng: location.lng },
                map: map,
                title: location.title || `Stop ${index + 1}`,
                content: markerElement
              })
              
              markers.push(marker)
            } catch (markerError) {
              console.warn('Failed to create Advanced Marker, falling back to legacy marker:', markerError)
              useAdvancedMarkers = false
              throw markerError // Re-throw to trigger fallback
            }
          })
        } catch (error) {
          console.warn('Advanced Markers not available, using legacy markers:', error)
          useAdvancedMarkers = false
          
          // Fallback to legacy markers
          locations.forEach((location, index) => {
            const marker = new window.google.maps.Marker({
              position: { lat: location.lat, lng: location.lng },
              map: map,
              title: location.title || `Stop ${index + 1}`,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: index === 0 ? '#10b981' : index === locations.length - 1 ? '#ef4444' : '#f59e0b',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }
            })
            markers.push(marker)
          })
        }
        
        // Add info windows and click handlers for all markers
        locations.forEach((location, index) => {
          const marker = markers[index]
          if (!marker) return

          // Add info window with location details
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-sm mb-1">${location.title || `Stop ${index + 1}`}</h3>
                <p class="text-xs text-gray-600">${location.address || 'Location details'}</p>
              </div>
            `
          })

          marker.addListener('click', () => {
            // Close any open info windows
            markers.forEach(m => m.infoWindow?.close())
            infoWindow.open(map, marker)
          })

          marker.infoWindow = infoWindow
        })

        // Create route if we have multiple locations
        if (locations.length > 1) {
          try {
            const directionsService = new window.google.maps.DirectionsService()
            const directionsRenderer = new window.google.maps.DirectionsRenderer({
              suppressMarkers: true, // Use our custom markers
              polylineOptions: {
                strokeColor: '#10b981',
                strokeWeight: 4
              }
            })
            directionsRenderer.setMap(map)

            // Create waypoints for middle locations
            const waypoints = locations.slice(1, -1).map(location => ({
              location: { lat: location.lat, lng: location.lng },
              stopover: true
            }))

            directionsService.route({
              origin: { lat: locations[0].lat, lng: locations[0].lng },
              destination: { lat: locations[locations.length - 1].lat, lng: locations[locations.length - 1].lng },
              waypoints: waypoints,
              travelMode: window.google.maps.TravelMode.DRIVING
            }, (result: any, status: any) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(result)
                console.log('Directions loaded successfully')
              } else {
                console.warn('Directions request failed:', status)
                // Still show map with markers - directions are optional
                if (status === 'REQUEST_DENIED') {
                  console.error('Directions API: REQUEST_DENIED - Check API key billing and restrictions')
                } else if (status === 'OVER_QUERY_LIMIT') {
                  console.error('Directions API: OVER_QUERY_LIMIT - API quota exceeded')
                } else if (status === 'ZERO_RESULTS') {
                  console.warn('Directions API: ZERO_RESULTS - No route found between locations')
                }
                
                // Draw simple connecting lines as fallback
                const path = new window.google.maps.Polyline({
                  path: locations.map(loc => ({ lat: loc.lat, lng: loc.lng })),
                  geodesic: true,
                  strokeColor: '#94a3b8',
                  strokeOpacity: 0.6,
                  strokeWeight: 2,
                  icons: [{
                    icon: {
                      path: 'M 0,-1 0,1',
                      strokeOpacity: 1,
                      scale: 3
                    },
                    offset: '0',
                    repeat: '20px'
                  }]
                })
                path.setMap(map)
              }
            })
          } catch (error) {
            console.error('Failed to initialize directions:', error)
            // Map will still work with just markers
          }
        }

        // Fit map to show all markers
        const bounds = new window.google.maps.LatLngBounds()
        locations.forEach(location => bounds.extend({ lat: location.lat, lng: location.lng }))
        map.fitBounds(bounds)

        setIsLoading(false)
      } catch (err) {
        console.error('Map initialization error:', err)
        setError('Failed to initialize map')
        setIsLoading(false)
      }
    }

    const extractLocations = async () => {
      if (!activities || activities.length === 0) {
        console.warn('No activities provided to extract locations from')
        return []
      }

      const locations: Array<{ lat: number; lng: number; title: string; address: string }> = []
      
      // Helper function to geocode address using Google Maps API with retry logic
      const geocodeLocation = (address: string, retryCount = 0): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
          if (!window.google?.maps?.Geocoder) {
            console.warn('Google Maps Geocoder API not available for geocoding')
            resolve(null)
            return
          }

          const geocoder = new window.google.maps.Geocoder()
          
          // Add a small delay to avoid hitting rate limits
          const delay = retryCount * 100 // 0ms, 100ms, 200ms delays for retries
          setTimeout(() => {
            geocoder.geocode({ address }, (results: any[], status: string) => {
              if (status === 'OK' && results && results.length > 0) {
                const location = results[0].geometry.location
                resolve({
                  lat: location.lat(),
                  lng: location.lng()
                })
              } else if (status === 'OVER_QUERY_LIMIT' && retryCount < 2) {
                // Retry with exponential backoff for rate limits
                console.warn(`Geocoding rate limit hit for "${address}", retrying...`)
                setTimeout(() => {
                  geocodeLocation(address, retryCount + 1).then(resolve)
                }, Math.pow(2, retryCount) * 1000) // 1s, 2s delays
              } else {
                console.warn(`Geocoding failed for "${address}": ${status}`)
                resolve(null)
              }
            })
          }, delay)
        })
      }

      // Process activities to extract unique locations
      const uniqueLocations = new Map<string, any>()
      let geocodedCount = 0
      let failedCount = 0
      
      for (const activity of activities) {
        let locationKey = ''
        let address = ''

        if (activity.company_locations && activity.company_locations.latitude && activity.company_locations.longitude) {
          // Use database coordinates from joined company_locations table
          const location = activity.company_locations
          locationKey = `${location.name}_${location.latitude}_${location.longitude}`
          if (!uniqueLocations.has(locationKey)) {
            uniqueLocations.set(locationKey, {
              lat: parseFloat(location.latitude),
              lng: parseFloat(location.longitude),
              title: location.name,
              address: `${location.address_line1 || ''}, ${location.city || ''}, ${location.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
            })
          }
        } else if (activity.location || activity.custom_location) {
          // Use location string for geocoding (either location or custom_location field)
          address = activity.location || activity.custom_location
          locationKey = address
          
          if (!uniqueLocations.has(locationKey)) {
            try {
              // Try to geocode the custom location
              const coordinates = await geocodeLocation(address)
              if (coordinates) {
                uniqueLocations.set(locationKey, {
                  ...coordinates,
                  title: activity.title,
                  address: address
                })
                geocodedCount++
              } else {
                console.warn(`Could not geocode location: ${address}`)
                failedCount++
              }
            } catch (error) {
              console.error(`Error geocoding location "${address}":`, error)
              failedCount++
            }
          }
        }
      }

      // Convert map values to array
      const locationArray = Array.from(uniqueLocations.values())
      
      console.log(`Geocoding results: ${geocodedCount} successful, ${failedCount} failed`)
      
      // If no locations were geocoded successfully, provide fallback Amsterdam coordinates
      if (locationArray.length === 0) {
        console.warn('No valid locations found, using fallback Amsterdam coordinates')
        return [
          { lat: 52.3676, lng: 4.9041, title: 'Amsterdam Center', address: 'Amsterdam, Netherlands' },
          { lat: 52.3105, lng: 4.7683, title: 'Schiphol Airport', address: 'Amsterdam Airport Schiphol' },
          { lat: 52.2434, lng: 4.8467, title: 'Westpoort Industrial Park', address: 'Westpoort Industrial Park, Amsterdam' }
        ]
      }

      console.log(`Extracted ${locationArray.length} unique locations from activities`)
      return locationArray
    }

    loadGoogleMaps()
  }, [itineraryDays, activities])

  if (error) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-[#D4C5B0] dark:border-[#2a2a2a] overflow-hidden">
        <div className="p-6 pb-4 bg-[#2D5347] text-white">
          <h2 className="text-lg font-semibold text-white">{tripTitle}</h2>
        </div>
        <div className="flex items-center justify-center h-64 bg-[#F9F6F0] dark:bg-[#111111]">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-[#D4C5B0] dark:border-[#2a2a2a] overflow-hidden">
      <div className="flex items-center justify-between p-3 md:p-6 pb-4 bg-[#2D5347] text-white">
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="text-base md:text-lg font-semibold text-white">{tripTitle}</h2>
          {/* Hide legend on mobile */}
          <div className="hidden md:flex items-center space-x-4 text-sm text-white/80">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-400 rounded-full mr-2"></div>
              Start
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-amber-400 rounded-full mr-2"></div>
              Stops
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
              End
            </div>
          </div>
        </div>
        
        {activities.length > 0 && (
          <>
            {/* Mobile: Just calendar icon with + */}
            <button
              onClick={handleExportAllToCalendar}
              className="md:hidden p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title="Add all to calendar"
            >
              <Calendar className="w-5 h-5" />
            </button>
            {/* Desktop: Full button with text */}
            <button
              onClick={handleExportAllToCalendar}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              Export All to Calendar
            </button>
          </>
        )}
      </div>
      
      <div className="relative h-96 bg-[#F9F6F0] dark:bg-[#111111] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F9F6F0] dark:bg-[#111111] z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading map...</p>
            </div>
          </div>
        )}
        <div 
          ref={mapRef} 
          className="w-full h-full"
          style={{ minHeight: '384px' }}
        />
      </div>
    </div>
  )
}