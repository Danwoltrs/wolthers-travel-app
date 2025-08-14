/**
 * Cost calculation utilities for calendar events
 * Provides type-safe functions for cost estimation and tracking
 */

import { CalendarEvent, CostTracking, CostBreakdownItem, CostCalculationRequest, CostCalculationResponse } from '@/types'

/**
 * Calculate total cost for a calendar event with cost tracking
 */
export function calculateEventTotalCost(event: CalendarEvent): number {
  if (!event.costTracking) return 0

  const { costPerPerson, totalCost, costBreakdown } = event.costTracking

  // If total cost is specified, use it
  if (totalCost !== undefined) {
    return totalCost
  }

  // If cost per person is specified, multiply by attendee count
  if (costPerPerson !== undefined) {
    const attendeeCount = event.attendeeDetails?.length || 1
    return costPerPerson * attendeeCount
  }

  // If breakdown is available, sum all items
  if (costBreakdown && costBreakdown.length > 0) {
    return costBreakdown.reduce((total, item) => {
      const itemTotal = item.amount * (item.quantity || 1)
      return total + itemTotal
    }, 0)
  }

  return 0
}

/**
 * Calculate total cost for multiple events
 */
export function calculateMultiEventTotalCost(events: CalendarEvent[]): number {
  return events.reduce((total, event) => total + calculateEventTotalCost(event), 0)
}

/**
 * Get cost breakdown for display
 */
export function getEventCostBreakdown(event: CalendarEvent): CostBreakdownItem[] {
  if (event.costTracking?.costBreakdown) {
    return event.costTracking.costBreakdown
  }

  // Generate basic breakdown from other cost fields
  const breakdown: CostBreakdownItem[] = []

  if (event.costTracking?.costPerPerson) {
    breakdown.push({
      id: `${event.id}-per-person`,
      description: `${event.type} cost per person`,
      amount: event.costTracking.costPerPerson,
      currency: event.costTracking.currency || 'USD',
      quantity: event.attendeeDetails?.length || 1,
      notes: 'Per person cost'
    })
  } else if (event.costTracking?.totalCost) {
    breakdown.push({
      id: `${event.id}-total`,
      description: `${event.type} total cost`,
      amount: event.costTracking.totalCost,
      currency: event.costTracking.currency || 'USD',
      quantity: 1,
      notes: 'Total event cost'
    })
  }

  return breakdown
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Estimate cost based on event type and parameters
 */
export function estimateEventCost(request: CostCalculationRequest): CostCalculationResponse {
  // Basic cost estimation logic - can be enhanced with actual API calls
  const baseCosts: Record<string, number> = {
    flight: 500,
    hotel: 200,
    meeting: 0,
    lunch: 25,
    dinner: 50,
    conference_session: 100,
    networking: 30,
    presentation: 0,
    other: 0
  }

  const baseCost = baseCosts[request.eventType] || 0
  const costPerPerson = baseCost
  const totalCost = costPerPerson * request.attendeeCount

  const breakdown: CostBreakdownItem[] = []
  
  if (costPerPerson > 0) {
    breakdown.push({
      id: `estimate-${request.eventType}`,
      description: `Estimated ${request.eventType} cost`,
      amount: costPerPerson,
      currency: 'USD',
      quantity: request.attendeeCount,
      notes: 'Estimated cost based on event type'
    })
  }

  return {
    success: true,
    costPerPerson,
    totalCost,
    currency: 'USD',
    breakdown,
    notes: ['This is an estimated cost. Actual costs may vary.']
  }
}

/**
 * Validate cost tracking data
 */
export function validateCostTracking(costTracking: CostTracking): string[] {
  const errors: string[] = []

  if (costTracking.costPerPerson !== undefined && costTracking.costPerPerson < 0) {
    errors.push('Cost per person cannot be negative')
  }

  if (costTracking.totalCost !== undefined && costTracking.totalCost < 0) {
    errors.push('Total cost cannot be negative')
  }

  if (costTracking.currency && !isValidCurrency(costTracking.currency)) {
    errors.push('Invalid currency code')
  }

  if (costTracking.costBreakdown) {
    costTracking.costBreakdown.forEach((item, index) => {
      if (item.amount < 0) {
        errors.push(`Cost breakdown item ${index + 1} cannot have negative amount`)
      }
      if (item.quantity !== undefined && item.quantity <= 0) {
        errors.push(`Cost breakdown item ${index + 1} must have positive quantity`)
      }
    })
  }

  return errors
}

/**
 * Check if currency code is valid (basic check)
 */
function isValidCurrency(currency: string): boolean {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK']
  return validCurrencies.includes(currency.toUpperCase())
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): { code: string; name: string; symbol: string }[] {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr' }
  ]
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = getSupportedCurrencies().find(c => c.code === currencyCode.toUpperCase())
  return currency?.symbol || currencyCode
}