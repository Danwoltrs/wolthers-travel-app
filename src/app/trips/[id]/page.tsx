'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import TripInterface from '@/components/trips/TripInterface'

export default function TripPage() {
  const params = useParams()
  const tripId = params.id as string

  return <TripInterface tripId={tripId} />
}