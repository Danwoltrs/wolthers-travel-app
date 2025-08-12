'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Trip } from '@/types'
import { TripStatus } from '@/types'

interface TripNavigationBarProps {
  currentTripId: string
  currentTrip?: Trip
  userTrips: Trip[]
  isAuthenticated: boolean
  isGuestAccess: boolean
  isMobileMenuOpen?: boolean
  mobileMenuHeight?: number
}

export default function TripNavigationBar({ 
  currentTripId, 
  currentTrip,
  userTrips, 
  isAuthenticated, 
  isGuestAccess,
  isMobileMenuOpen = false,
  mobileMenuHeight = 0
}: TripNavigationBarProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50
      setIsScrolled(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Show trip tabs if:
  // 1. User is authenticated (normal case)
  // 2. OR user is a guest but has access to multiple trips (smart guest access)
  const showTripTabs = (isAuthenticated && !isGuestAccess && userTrips.length > 1) || 
                      (isGuestAccess && userTrips.length > 1)
  
  

  // Format current trip date
  const formatTripDate = (startDate: Date, endDate: Date) => {
    const formatDate = (date: Date) => {
      const day = date.getDate()
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      return `${day} ${month}`
    }
    
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.getDate()} - ${formatDate(endDate)}`
    } else {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`
    }
  }

  // Separate ongoing and future trips (excluding current trip)
  const otherTrips = userTrips.filter(trip => 
    trip.accessCode !== currentTripId && trip.id !== currentTripId
  )
  const ongoingTrips = otherTrips.filter(trip => trip.status === TripStatus.ONGOING)
  const futureTrips = otherTrips.filter(trip => trip.status === TripStatus.PLANNING || trip.status === TripStatus.CONFIRMED)
  
  // Sort by start date
  const sortedOngoing = ongoingTrips.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  const sortedFuture = futureTrips.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  
  const otherTripsToShow = [...sortedOngoing, ...sortedFuture]
  
  

  // Calculate top position based on scroll state and actual mobile menu height
  const getTopPosition = () => {
    const headerHeight = isScrolled ? 64 : 96 // Header height in pixels
    const menuHeight = isMobileMenuOpen ? mobileMenuHeight : 0
    return headerHeight + menuHeight
  }

  return (
    <div className={cn(
      "fixed left-0 right-0 z-50 shadow-lg transition-all duration-300",
      "bg-[#1E293B] dark:bg-[#1E293B] border-b border-slate-700 dark:border-[#2a3530]"
    )}
    style={{ 
      top: `${getTopPosition()}px`
    }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between py-2 gap-4">
          {/* Current Trip Info */}
          <div className={cn(
            "flex items-center gap-3 min-w-0 flex-1",
            showTripTabs ? "text-left" : "text-center justify-center"
          )}>
            {currentTrip && (
              <>
                <p className="text-amber-300/80 text-sm whitespace-nowrap">
                  {formatTripDate(currentTrip.startDate, currentTrip.endDate)}
                </p>
                <div className="text-amber-300/60">|</div>
                <h2 className="text-amber-400 font-semibold text-sm md:text-base leading-tight min-w-0">
                  <span className="block sm:hidden">
                    {currentTrip.title.length > 30 
                      ? currentTrip.title.substring(0, 30) + '...' 
                      : currentTrip.title}
                  </span>
                  <span className="hidden sm:block">
                    {currentTrip.title}
                  </span>
                </h2>
              </>
            )}
          </div>
          
          {/* Other Trip Tabs - Hidden on mobile */}
          {showTripTabs && otherTripsToShow.length > 0 && (
            <div className="hidden md:flex items-center overflow-x-auto scrollbar-hide">
              {otherTripsToShow.map((trip, index) => {
                const isOngoing = trip.status === TripStatus.ONGOING
                const isFuture = trip.status === TripStatus.PLANNING || trip.status === TripStatus.CONFIRMED
                
                return (
                  <React.Fragment key={trip.id}>
                    {index > 0 && (
                      <div className="text-slate-400 dark:text-slate-600 text-sm mx-1 select-none">
                        |
                      </div>
                    )}
                    <Link
                      href={`/trips/${trip.accessCode}`}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap',
                        'hover:bg-slate-700/70 dark:hover:bg-[#1f2d26]/80 focus:outline-none focus:ring-2 focus:ring-blue-400',
                        'cursor-pointer select-none rounded-sm',
                        isOngoing && 'text-white hover:text-amber-200',
                        isFuture && 'text-slate-400 dark:text-slate-500 hover:text-slate-300'
                      )}
                      title={trip.title}
                    >
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isOngoing && 'bg-green-400',
                          isFuture && 'bg-yellow-400 opacity-60'
                        )} />
                        <span className="truncate max-w-32">
                          {trip.accessCode}
                        </span>
                      </div>
                    </Link>
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}