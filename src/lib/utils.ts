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
  
  if (now < start) return 0
  if (now > end) return 100
  
  const total = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()
  return Math.round((elapsed / total) * 100)
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