/**
 * Availability calculation and derivation helpers for participants
 */

import { Database } from '@/types/database'

export type AvailabilityStatus = 'available' | 'unavailable' | 'partial' | 'unknown'

export interface AvailabilityPeriod {
  date: string
  status: 'available' | 'busy' | 'partial'
}

export interface PersonAvailability {
  personId: string
  overallStatus: AvailabilityStatus
  dailyStatus: Record<string, 'available' | 'busy' | 'partial'>
  conflictDays: string[]
  availableDays: string[]
}

/**
 * Derive overall availability status for a person during a date range
 */
export function deriveAvailabilityStatus(
  periods: AvailabilityPeriod[],
  dateRange: { start: string; end: string }
): AvailabilityStatus {
  if (!periods || periods.length === 0) {
    return 'unknown'
  }

  const totalDays = getDaysInRange(dateRange)
  const availableDays = periods.filter(p => p.status === 'available').length
  const busyDays = periods.filter(p => p.status === 'busy').length
  const partialDays = periods.filter(p => p.status === 'partial').length

  // If all days are available
  if (availableDays === totalDays) {
    return 'available'
  }

  // If any day is busy
  if (busyDays > 0) {
    return 'unavailable'
  }

  // If there are partial days but no busy days
  if (partialDays > 0) {
    return 'partial'
  }

  // If we have some available days but not all (gaps in schedule data)
  if (availableDays > 0 && availableDays < totalDays) {
    return 'partial'
  }

  return 'unknown'
}

/**
 * Get number of days in a date range
 */
export function getDaysInRange(dateRange: { start: string; end: string }): number {
  const start = new Date(dateRange.start)
  const end = new Date(dateRange.end)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end dates
}

/**
 * Get all dates in a range as array of YYYY-MM-DD strings
 */
export function getDatesInRange(dateRange: { start: string; end: string }): string[] {
  const dates: string[] = []
  const start = new Date(dateRange.start)
  const end = new Date(dateRange.end)
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0])
  }
  
  return dates
}

/**
 * Check if person has any scheduling conflicts during trip dates
 */
export function hasScheduleConflicts(
  personId: string,
  tripDates: { start: string; end: string },
  existingActivities: Database['public']['Tables']['activities']['Row'][]
): boolean {
  const tripDateRange = getDatesInRange(tripDates)
  
  return existingActivities.some(activity => {
    if (activity.activity_date) {
      const activityDate = activity.activity_date
      return tripDateRange.includes(activityDate) && 
             activity.status !== 'cancelled'
    }
    return false
  })
}

/**
 * Get availability tooltip content for person
 */
export function getAvailabilityTooltip(
  availability: PersonAvailability,
  dateRange: { start: string; end: string }
): string {
  const { overallStatus, conflictDays, availableDays } = availability
  const totalDays = getDaysInRange(dateRange)

  switch (overallStatus) {
    case 'available':
      return `Available all ${totalDays} days`
    case 'unavailable':
      return `${conflictDays.length} conflict${conflictDays.length > 1 ? 's' : ''} during trip`
    case 'partial':
      return `${availableDays.length}/${totalDays} days available`
    default:
      return 'Availability unknown'
  }
}

/**
 * Get CSS classes for availability status
 */
export function getAvailabilityClasses(status: AvailabilityStatus): {
  chip: string
  icon: string
  background: string
} {
  switch (status) {
    case 'available':
      return {
        chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
        icon: 'text-emerald-500',
        background: 'bg-emerald-50 dark:bg-emerald-900/20'
      }
    case 'unavailable':
      return {
        chip: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        icon: 'text-red-500',
        background: 'bg-red-50 dark:bg-red-900/20'
      }
    case 'partial':
      return {
        chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
        icon: 'text-amber-500',
        background: 'bg-amber-50 dark:bg-amber-900/20'
      }
    default:
      return {
        chip: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: 'text-gray-400',
        background: 'bg-gray-50 dark:bg-gray-900/20'
      }
  }
}

/**
 * Mock availability data for development
 */
export function getMockAvailability(
  personId: string,
  dateRange: { start: string; end: string }
): PersonAvailability {
  const dates = getDatesInRange(dateRange)
  const dailyStatus: Record<string, 'available' | 'busy' | 'partial'> = {}
  
  // Generate deterministic mock data based on person ID
  const seed = personId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  dates.forEach((date, index) => {
    const dayValue = (seed + index) % 10
    if (dayValue < 7) {
      dailyStatus[date] = 'available'
    } else if (dayValue < 9) {
      dailyStatus[date] = 'partial'
    } else {
      dailyStatus[date] = 'busy'
    }
  })

  const availableDays = Object.entries(dailyStatus)
    .filter(([_, status]) => status === 'available')
    .map(([date]) => date)
  
  const conflictDays = Object.entries(dailyStatus)
    .filter(([_, status]) => status === 'busy')
    .map(([date]) => date)

  const periods: AvailabilityPeriod[] = Object.entries(dailyStatus)
    .map(([date, status]) => ({ date, status }))

  return {
    personId,
    overallStatus: deriveAvailabilityStatus(periods, dateRange),
    dailyStatus,
    conflictDays,
    availableDays
  }
}

/**
 * Batch check availability for multiple people
 */
export async function batchCheckAvailability(
  personIds: string[],
  dateRange: { start: string; end: string }
): Promise<Record<string, PersonAvailability>> {
  // In a real implementation, this would query the schedules table
  // For now, return mock data
  const result: Record<string, PersonAvailability> = {}
  
  personIds.forEach(personId => {
    result[personId] = getMockAvailability(personId, dateRange)
  })
  
  return result
}