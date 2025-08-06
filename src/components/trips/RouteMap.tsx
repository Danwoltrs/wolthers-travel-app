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
      `LOCATION:${escapeText(activity.custom_location || '')}`,
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

      // Create the script tag
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAkTsr23yiFNyelupLP_NPEa3BuLIHTbKk'}&libraries=geometry`
      script.async = true
      script.defer = true
      
      // Set up the callback
      window.initMap = initializeMap
      script.onload = () => {
        if (window.google) {
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

    const initializeMap = () => {
      if (!mapRef.current) return

      try {
        // Extract locations from activities
        const locations = extractLocations()
        
        if (locations.length === 0) {
          setError('No locations found in itinerary')
          setIsLoading(false)
          return
        }

        // Initialize map
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 8,
          center: locations[0],
          mapTypeId: 'terrain',
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
            }
          ]
        })

        mapInstanceRef.current = map

        // Add markers for each location
        const markers: any[] = []
        locations.forEach((location, index) => {
          const marker = new window.google.maps.Marker({
            position: location,
            map: map,
            title: `Stop ${index + 1}`,
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

        // Create route if we have multiple locations
        if (locations.length > 1) {
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
            location: location,
            stopover: true
          }))

          directionsService.route({
            origin: locations[0],
            destination: locations[locations.length - 1],
            waypoints: waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING
          }, (result: any, status: any) => {
            if (status === 'OK') {
              directionsRenderer.setDirections(result)
            } else {
              console.warn('Directions request failed:', status)
            }
          })
        }

        // Fit map to show all markers
        const bounds = new window.google.maps.LatLngBounds()
        locations.forEach(location => bounds.extend(location))
        map.fitBounds(bounds)

        setIsLoading(false)
      } catch (err) {
        console.error('Map initialization error:', err)
        setError('Failed to initialize map')
        setIsLoading(false)
      }
    }

    const extractLocations = () => {
      // Mock locations for demonstration
      // In real implementation, extract from itinerary activities
      return [
        { lat: 14.6349, lng: -90.5069 }, // Guatemala City
        { lat: 14.7167, lng: -91.1833 }, // Quetzaltenango
        { lat: 15.3333, lng: -90.4000 }, // Cobán
        { lat: 14.8333, lng: -89.9167 }  // Antigua Guatemala
      ]
    }

    loadGoogleMaps()
  }, [itineraryDays])

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
      <div className="flex items-center justify-between p-6 pb-4 bg-[#2D5347] text-white">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">{tripTitle}</h2>
          <div className="flex items-center space-x-4 text-sm text-white/80">
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
          <button
            onClick={handleExportAllToCalendar}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            Export All to Calendar
          </button>
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