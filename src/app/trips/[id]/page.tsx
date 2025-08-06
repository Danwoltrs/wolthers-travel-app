'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TripInterface from '@/components/trips/TripInterface'
import { useAuth } from '@/contexts/AuthContext'
import { mockTripData } from '@/lib/mockData'

export default function TripPage() {
  const params = useParams()
  const tripId = params.id as string
  const { isAuthenticated } = useAuth()
  const [isGuestAccess, setIsGuestAccess] = useState(false)

  useEffect(() => {
    const checkGuestAccess = async () => {
      try {
        
        // First check mock data
        const tripData = mockTripData.find(t => t.trip.accessCode === tripId)
        if (tripData) {
          setIsGuestAccess(!!tripData && !isAuthenticated)
          return
        }
        
        // If not in mock data, check if tripId looks like an access code
        // Access codes in database follow pattern like "CPH_NESP_BT_0825" or "AMS_DCI_QA_0825"
        const looksLikeAccessCode = /^[A-Z0-9_]{6,20}$/i.test(tripId)
        const guestAccess = looksLikeAccessCode && !isAuthenticated
        setIsGuestAccess(guestAccess)
      } catch (error) {
        console.error('Error checking guest access:', error)
        // Default to not guest access on error
        setIsGuestAccess(false)
      }
    }
    
    checkGuestAccess()
  }, [tripId, isAuthenticated])

  return (
    <TripInterface 
      tripId={tripId} 
      isGuestAccess={isGuestAccess}
    />
  )
}