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
  // Ensure we're working with Date objects and handle timezone properly
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // If dates are strings from database, they might be in UTC - normalize to local date
  if (typeof startDate === 'string' && startDate.includes('T')) {
    // ISO string with time - convert to local date only
    start.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
  }
  if (typeof endDate === 'string' && endDate.includes('T')) {
    // ISO string with time - convert to local date only
    end.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
  }
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const startDay = dayNames[start.getDay()]
  const endDay = dayNames[end.getDay()]
  
  // Check if it's the same day
  if (start.toDateString() === end.toDateString()) {
    return `${startDay} ${start.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`
  }
  
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    // Same month and year
    return `${startDay} ${start.getDate()} - ${endDay} ${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })}`
  }
  
  // Different months or years
  return `${startDay} ${start.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })} - ${endDay} ${end.getDate()} ${end.toLocaleDateString('en-US', { month: 'short' })}`
}

export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return ''
  
  const d = new Date(date)
  
  // Handle invalid dates
  if (isNaN(d.getTime())) return ''
  
  // Convert to local date only (no time) to avoid timezone issues
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

export function calculateDuration(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Handle timezone issues by normalizing to UTC dates
  const startUTC = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endUTC = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  
  const diffTime = Math.abs(endUTC.getTime() - startUTC.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // For inclusive date ranges (both start and end dates are included)
  return Math.max(1, diffDays + 1)
}

export function getTripStatus(startDate: Date | string, endDate: Date | string, isDraft: boolean = false): 'draft' | 'upcoming' | 'ongoing' | 'completed' {
  if (isDraft) return 'draft'

  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (now < start) return 'upcoming'
  if (now > end) return 'completed'
  return 'ongoing'
}

export function getTripProgress(startDate: Date | string, endDate: Date | string): number {
  const now = new Date()
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
  const now = new Date()
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

export function getTripStatusLabel(startDate: Date | string, endDate: Date | string, isDraft: boolean = false): string {
  if (isDraft) return 'TRIP DRAFT'
  
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
    case 'draft':
      return 'TRIP DRAFT'
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
  const dateRange = formatDateRange(startDate, endDate)
  const duration = calculateDuration(startDate, endDate)
  
  const durationText = duration === 1 ? '1 day' : `${duration} days`
  
  return { dateRange, duration: durationText }
}

/**
 * Masks an email address by showing only beginning part (e.g., "tom@w...")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  
  const [localPart, domain] = email.split('@')
  const domainStart = domain.charAt(0)
  
  // Truncate local part to maximum 3 characters for consistency
  const truncatedLocal = localPart.length > 3 ? localPart.substring(0, 3) : localPart
  
  return `${truncatedLocal}@${domainStart}...`
}

/**
 * Formats a date with timezone awareness and relative time
 */
export function formatLastLogin(date: string | Date | null): string {
  if (!date) return 'Never'
  
  const loginDate = new Date(date)
  const now = new Date()
  const diffTime = now.getTime() - loginDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))
  
  if (diffMinutes < 60) {
    return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    return loginDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}

/**
 * Copies text to clipboard and shows a temporary success state
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    let success = false
    try {
      success = document.execCommand('copy')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
    
    document.body.removeChild(textArea)
    return success
  }
}

/**
 * Formats a number with appropriate suffix (k, M, etc.)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

/**
 * Truncates phone number for consistent display
 */
export function truncatePhone(phone: string): string {
  if (!phone) return phone
  
  // Remove all non-digits except + at the start
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Truncate to maximum 12 characters for consistency
  if (cleaned.length > 12) {
    return cleaned.substring(0, 12) + '...'
  }
  
  return phone
}

/**
 * Detects if the current device supports touch interactions
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browser compatibility
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Detects if the current device is likely a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.innerWidth < 768 || isTouchDevice()
}

/**
 * Formats time for display with 12-hour format option
 */
export function formatTime(time: string, use24Hour: boolean = true): string {
  if (!time) return ''
  
  if (use24Hour) return time
  
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Formats duration from seconds to readable format (e.g., "4hr 30min")
 * Rounds minutes to the nearest 5-minute interval
 */
export function formatDurationReadable(seconds: number): string {
  if (!seconds || seconds < 0) return '0min'
  
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  let minutes = totalMinutes % 60
  
  // Round minutes to nearest 5-minute interval
  minutes = Math.round(minutes / 5) * 5
  
  // Ensure minimum 5 minutes for any non-zero duration
  if (minutes === 0 && hours === 0 && seconds > 0) {
    minutes = 5
  }
  
  // Handle case where rounding brings minutes to 60
  if (minutes === 60) {
    return `${hours + 1}hr`
  }
  
  if (hours > 0 && minutes > 0) {
    return `${hours}hr ${minutes}min`
  } else if (hours > 0) {
    return `${hours}hr`
  } else {
    return `${minutes}min`
  }
}

/**
 * Calculates the end time based on start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return ''
  
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
  
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
}

/**
 * Checks if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string, 
  duration1: number, 
  start2: string, 
  duration2: number
): boolean {
  const end1 = calculateEndTime(start1, duration1)
  const end2 = calculateEndTime(start2, duration2)
  
  return start1 < end2 && start2 < end1
}

/**
 * Formats file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}