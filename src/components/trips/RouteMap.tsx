'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import type { ItineraryDay } from '@/types'

interface RouteMapProps {
  itineraryDays: ItineraryDay[]
  tripTitle: string
}

declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

export default function RouteMap({ itineraryDays, tripTitle }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap()
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
        document.head.removeChild(script)
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Navigation className="w-5 h-5 mr-2 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Route Map</h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            Start
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
            Stops
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            End
          </div>
        </div>
      </div>
      
      <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
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