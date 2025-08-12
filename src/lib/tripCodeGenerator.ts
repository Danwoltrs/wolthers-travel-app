import { TripFormData } from '@/components/trips/TripCreationModal'

// Utility to abbreviate company names
function abbreviateCompanyName(name: string): string {
  // Handle specific cases first
  const specialAbbreviations: { [key: string]: string } = {
    'Douqué': 'DQ',
    'Joh Johansson': 'JohJoh',
    'Mitsui': 'MIT',
    'Swiss Coffee Trade Association': 'SCTA',
    'National Coffee Association': 'NCA',
    'Swiss Import Company': 'SIC'
  }

  if (specialAbbreviations[name]) {
    return specialAbbreviations[name]
  }

  // Generic abbreviation: first letters of significant words
  const words = name.split(/\s+/)
  const significantWords = words.filter(word => 
    word.length > 2 && 
    !['and', 'the', 'of', 'for'].includes(word.toLowerCase())
  )

  return significantWords
    .map(word => word[0].toUpperCase())
    .join('')
    .slice(0, 4)
}

// Formats month abbreviation
function getMonthAbbreviation(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[date.getMonth()]
}

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

  const year = startDate.getFullYear().toString().slice(-2)
  const month = startDate.getMonth() + 1

  // Event-specific trip codes
  const eventPatterns: { [key: string]: string } = {
    'SCTA': 'SCTA',
    'NCA': 'NCA',
    'SIC': 'SIC'
  }

  // Check if an event pattern matches the title
  const eventMatch = Object.entries(eventPatterns).find(([key, value]) => 
    title.toUpperCase().includes(key)
  )

  if (eventMatch) {
    return `${eventMatch[1]}-${startDate.getFullYear()}`
  }

  // Multi-client handling
  if (companies.length > 1) {
    const clientCodes = companies
      .slice(0, 2)  // Take first two companies
      .map(company => abbreviateCompanyName(company.name))
      .join('')

    return `${clientCodes}-${month}${year}`
  }

  // Single client handling
  if (companies.length === 1) {
    const clientCode = abbreviateCompanyName(companies[0].name)
    const monthAbbr = getMonthAbbreviation(startDate)

    // Randomize between two formats
    return Math.random() > 0.5 
      ? `${clientCode}-${monthAbbr}-${startDate.getFullYear()}`
      : `${clientCode}-${month}${year}`
  }

  // Fallback random code
  return `TRIP-${year}${month}${Math.floor(Math.random() * 100)}`
}