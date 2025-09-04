import { TripFormData } from '@/components/trips/TripCreationModal'

interface TripSlugParams {
  trip_type: 'conference' | 'event' | 'business' | 'client_visit'
  companies: Array<{ id: string; name: string; company_id?: string }>
  month: number
  year: number
  code?: string  // For conference/event trips
  company_id?: string
  title?: string
}

// Utility to abbreviate company names with enhanced logic
function abbreviateCompanyName(name: string): string {
  // Handle specific cases first
  const specialAbbreviations: { [key: string]: string } = {
    'Douqué': 'DQ',
    'Joh Johansson': 'JohJoh', 
    'Mitsui': 'MITS',
    'Swiss Coffee Trade Association': 'SCTA',
    'National Coffee Association': 'NCA', 
    'Swiss Import Company': 'SIC',
    'Wolthers & Associates': 'WA',
    'UCC Holdings': 'UCC',
    'Keyence Corporation': 'KEYC'
  }

  if (specialAbbreviations[name]) {
    return specialAbbreviations[name]
  }

  // Generic abbreviation: first letters of significant words
  const words = name.split(/\s+/)
  const significantWords = words.filter(word => 
    word.length > 2 && 
    !['and', 'the', 'of', 'for', '&'].includes(word.toLowerCase())
  )

  if (significantWords.length === 0) {
    // Fallback: use first word if no significant words found
    return name.substring(0, 4).toUpperCase()
  }

  const abbreviation = significantWords
    .map(word => word[0].toUpperCase())
    .join('')
    .slice(0, 4)

  return abbreviation || name.substring(0, 4).toUpperCase()
}

// Utility to create smart codes from trip titles for in-land trips
function generateTitleBasedCode(title: string, month: number, year: number): string {
  if (!title) return ''
  
  // Clean the title and remove common words
  const commonWords = ['trip', 'visit', 'meeting', 'conference', 'event', 'the', 'and', 'to', 'at', 'in', 'of', 'for']
  const words = title.toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 1 && 
      !commonWords.includes(word) &&
      !/^\d+$/.test(word) // Remove pure numbers
    )
  
  if (words.length === 0) {
    return `TRIP-${getMonthAbbreviation(month)}${formatYear(year)}`
  }
  
  // Handle special company names that should be preserved
  const specialNames: { [key: string]: string } = {
    'douqué': 'Douque',
    'douque': 'Douque', 
    'mitsui': 'Mitsui',
    'keyence': 'Keyence',
    'wolthers': 'Wolthers'
  }
  
  // Take first significant word (usually company/location name)
  let mainWord = words[0]
  
  // Apply special name formatting
  if (specialNames[mainWord]) {
    mainWord = specialNames[mainWord]
  } else {
    // Capitalize first letter
    mainWord = mainWord.charAt(0).toUpperCase() + mainWord.slice(1)
  }
  
  // Format: MainWord-MonYY (e.g., "Douque-Sep25")
  return `${mainWord}-${getMonthAbbreviation(month)}${formatYear(year)}`
}

// Formats month abbreviation
function getMonthAbbreviation(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[month - 1] || 'Jan'
}

// Formats month as 2-digit string
function formatMonth(month: number): string {
  return month.toString().padStart(2, '0')
}

// Formats year as 2-digit string
function formatYear(year: number): string {
  return year.toString().slice(-2)
}

/**
 * Generates trip slug based on business logic patterns
 * Conference/Event: <CODE>-<YEAR> (e.g., NCA-2026)
 * Single company: <COMPANY>_<MMYY> or <COMPANY>_<MonYY>
 * Multiple companies: <COMPANY1>_<COMPANY2>_..._<YY> (alphabetized, max 4)
 */
export function makeTripSlug(params: TripSlugParams): string {
  const { trip_type, companies, month, year, code, title } = params

  // Conference/Event trips: Use provided code or extract from title
  if (trip_type === 'conference' || trip_type === 'event') {
    if (code) {
      return `${code.toUpperCase()}-${year}`
    }
    
    // Try to extract code from title
    const eventPatterns: { [key: string]: string } = {
      'SCTA': 'SCTA',
      'NCA': 'NCA', 
      'SIC': 'SIC'
    }
    
    const eventMatch = Object.entries(eventPatterns).find(([key]) => 
      title?.toUpperCase().includes(key)
    )
    
    if (eventMatch) {
      return `${eventMatch[1]}-${year}`
    }
    
    // Fallback: use first word of title or generic event code
    const titleCode = title?.split(' ')[0]?.toUpperCase().slice(0, 4) || 'EVENT'
    return `${titleCode}-${year}`
  }

  // Business/In-land trips - prioritize title-based generation
  if (trip_type === 'business' || trip_type === 'client_visit') {
    // Try title-based generation first for in-land trips
    if (title) {
      const titleCode = generateTitleBasedCode(title, month, year)
      if (titleCode && !titleCode.startsWith('TRIP-')) {
        return titleCode
      }
    }
  }

  // Normal company-based trips (fallback or when no title)
  if (companies.length === 0) {
    return `TRIP-${formatYear(year)}${formatMonth(month)}${Math.floor(Math.random() * 100)}`
  }

  if (companies.length === 1) {
    // Single company: <COMPANY>_<MMYY> or <COMPANY>_<MonYY>
    const companyCode = abbreviateCompanyName(companies[0].name)
    
    // Randomize between numeric and text month format
    const useTextMonth = Math.random() > 0.5
    
    if (useTextMonth) {
      return `${companyCode}_${getMonthAbbreviation(month)}${formatYear(year)}`
    } else {
      return `${companyCode}_${formatMonth(month)}${formatYear(year)}`
    }
  }

  // Multiple companies: <COMPANY1>_<COMPANY2>_..._<YY>
  const companyCodes = companies
    .map(company => abbreviateCompanyName(company.name))
    .sort() // Alphabetical order
    .slice(0, 4) // Max 4 companies
    .map(code => code.slice(0, 4)) // Truncate long codes
    .join('_')
  
  return `${companyCodes}_${formatYear(year)}`
}

// Legacy function for backward compatibility
export function generateTripCode(formData: TripFormData): string {
  const { 
    tripType, 
    companies, 
    startDate, 
    title 
  } = formData

  if (!startDate) {
    return `TRIP-${new Date().getFullYear()}${Math.floor(Math.random() * 1000)}`
  }

  const month = startDate.getMonth() + 1
  const year = startDate.getFullYear()

  // Map old trip types to new system
  const mappedTripType = tripType === 'business' ? 'business' : 
                        tripType === 'conference' ? 'conference' :
                        tripType === 'event' ? 'event' : 'business'

  return makeTripSlug({
    trip_type: mappedTripType as any,
    companies: companies || [],
    month,
    year,
    title
  })
}