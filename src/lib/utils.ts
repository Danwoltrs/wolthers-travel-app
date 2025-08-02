import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const startDay = dayNames[start.getDay()]
  const endDay = dayNames[end.getDay()]
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    // Same month and year
    return `${startDay} ${start.getDate()} - ${endDay} ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`
  }
  
  // Different months or years
  return `${startDay} ${start.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })} - ${endDay} ${end.getDate()} ${end.toLocaleDateString('en-US', { month: 'short' })}`
}

export function calculateDuration(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getTripStatus(startDate: Date | string, endDate: Date | string): 'upcoming' | 'ongoing' | 'completed' {
  // Fixed date for demo purposes: August 1st, 2025
  const now = new Date('2025-08-01')
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (now < start) return 'upcoming'
  if (now > end) return 'completed'
  return 'ongoing'
}

export function getTripProgress(startDate: Date | string, endDate: Date | string): number {
  // Fixed date for demo purposes: August 1st, 2025
  const now = new Date('2025-08-01')
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // For upcoming trips, show 0%
  if (now < start) return 0
  
  // For completed trips, show 100%
  if (now > end) return 100
  
  // For ongoing trips, calculate actual progress
  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  const progress = Math.round((elapsed / total) * 100)
  
  // Ensure progress is between 1-99 for ongoing trips (never 0 or 100 while ongoing)
  return Math.max(1, Math.min(99, progress))
}

export function getDaysUntilTrip(startDate: Date | string): string {
  // Fixed date for demo purposes: August 1st, 2025
  const now = new Date('2025-08-01')
  const start = new Date(startDate)
  
  // If trip has already started or passed, return empty string
  if (now >= start) return ''
  
  const diffTime = start.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays > 14) {
    const weeks = Math.ceil(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} to go`
  }
  
  return `${diffDays} day${diffDays > 1 ? 's' : ''} to go`
}

export function getTripStatusLabel(startDate: Date | string, endDate: Date | string): string {
  const status = getTripStatus(startDate, endDate)
  
  switch (status) {
    case 'upcoming': {
      const countdown = getDaysUntilTrip(startDate)
      return countdown || 'Starting soon'
    }
    case 'ongoing': {
      const progress = getTripProgress(startDate, endDate)
      return `ONGOING · ${progress}%`
    }
    case 'completed':
      return 'COMPLETED'
    default:
      return 'UNKNOWN'
  }
}

export function getTripProgressColor(startDate: Date | string, endDate: Date | string): string {
  const status = getTripStatus(startDate, endDate)
  
  switch (status) {
    case 'upcoming':
      return 'bg-pearl-300'
    case 'ongoing':
      return 'bg-green-500'
    case 'completed':
      return 'bg-golden-600'
    default:
      return 'bg-pearl-300'
  }
}

export function formatTripDates(startDate: Date | string, endDate: Date | string): { dateRange: string; duration: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const duration = calculateDuration(startDate, endDate)
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const startDay = dayNames[start.getDay()]
  const endDay = dayNames[end.getDay()]
  
  let dateRange: string
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    // Same month and year
    dateRange = `${startDay} ${start.getDate()} - ${endDay} ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`
  } else {
    // Different months or years
    dateRange = `${startDay} ${start.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })} - ${endDay} ${end.getDate()} ${end.toLocaleDateString('en-US', { month: 'short' })}`
  }
  
  const durationText = duration === 1 ? '1 day' : `${duration} days`
  
  return { dateRange, duration: durationText }
}