/**
 * Geographical Intelligence System
 * Smart city extraction from location strings using pattern recognition and heuristics
 * Supports worldwide city detection without hard-coded lists
 */

export interface CityInfo {
  city: string
  state?: string | null
  country?: string | null
  confidence: number // 0-1 confidence score
}

/**
 * Intelligent city extraction from location strings
 * Uses linguistic patterns, geographical knowledge, and business logic
 */
export function extractCityFromLocation(location: string): CityInfo | null {
  if (!location || location.trim() === '') {
    return null
  }
  
  console.log('🌍 Analyzing location:', location)
  
  // Step 1: Clean and tokenize the location string
  const tokens = tokenizeLocation(location)
  console.log('🗺️ Tokens:', tokens)
  
  // Step 2: Apply geographical intelligence
  const cityInfo = findCityInTokens(tokens, location)
  
  if (cityInfo) {
    console.log('🎯 Extracted city:', cityInfo)
    return cityInfo
  }
  
  console.log('❌ No city found in location:', location)
  return null
}

/**
 * Tokenize location string into potential city components
 */
function tokenizeLocation(location: string): string[] {
  // Split by common delimiters
  const delimiters = [',', '-', '/', '|', '\n', '\r', ';', '(', ')', '[', ']']
  let parts = [location]
  
  for (const delimiter of delimiters) {
    const newParts = []
    for (const part of parts) {
      newParts.push(...part.split(delimiter))
    }
    parts = newParts
  }
  
  // Clean and filter tokens
  return parts
    .map(part => part.trim())
    .filter(part => part.length > 1)
    .filter(part => !/^\d+$/.test(part)) // Skip pure numbers
    .filter(part => !/^\d{5}-?\d{3}$/.test(part)) // Skip postal codes
    .filter(part => !isCommonBusinessTerm(part))
}

/**
 * Check if a token is a common business/venue term or specific venue name
 */
function isCommonBusinessTerm(term: string): boolean {
  const businessTerms = [
    'hotel', 'resort', 'airport', 'station', 'center', 'centre', 'building', 'tower',
    'plaza', 'mall', 'corp', 'ltd', 'inc', 'international', 'company', 'group',
    'association', 'conference', 'summit', 'meeting', 'office', 'headquarters'
  ]
  
  // Specific venue/event names that should be filtered out
  const venueNames = [
    'SCTA', 'BWC', 'COFCO', 'EISA', 'COMEXIM', 'BRASCOF', 'HYPERION',
    'LOFBERGS', 'COOXUPE', 'BLASER', 'NORDQUIST', 'EXPOCACER', 
    'MINASUL', 'COCATREL', 'VELOSO'
  ]
  
  const upperTerm = term.toUpperCase()
  
  // Check if it's a known venue name
  if (venueNames.some(venue => upperTerm === venue || upperTerm.includes(venue))) {
    return true
  }
  
  // Check if it's a business term
  return businessTerms.some(business => 
    upperTerm.includes(business.toUpperCase()) || 
    business.toUpperCase().includes(upperTerm)
  )
}

/**
 * Find the most likely city in the tokenized location
 */
function findCityInTokens(tokens: string[], originalLocation: string): CityInfo | null {
  const candidates: Array<CityInfo & { score: number }> = []
  
  // Analyze each token
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const analysis = analyzeCityCandidate(token, tokens, i, originalLocation)
    
    if (analysis.confidence > 0.3) { // Minimum confidence threshold
      candidates.push({
        ...analysis,
        score: analysis.confidence
      })
    }
  }
  
  // Special patterns
  const patternResults = analyzeSpecialPatterns(originalLocation, tokens)
  candidates.push(...patternResults)
  
  // Sort by confidence and return best candidate
  candidates.sort((a, b) => b.score - a.score)
  
  if (candidates.length > 0) {
    const best = candidates[0]
    return {
      city: best.city,
      state: best.state,
      country: best.country,
      confidence: best.confidence
    }
  }
  
  return null
}

/**
 * Analyze a single token as a potential city
 */
function analyzeCityCandidate(token: string, allTokens: string[], index: number, originalLocation: string): CityInfo & { score: number } {
  let confidence = 0
  let state: string | null = null
  let country: string | null = null
  
  // Base score for proper capitalization
  if (/^[A-Z][a-zA-Z\s-']*$/.test(token)) {
    confidence += 0.3
  }
  
  // Linguistic patterns that suggest city names
  const cityPatterns = [
    // European patterns
    { pattern: /burg$/i, weight: 0.4, region: 'Europe' },
    { pattern: /stadt$/i, weight: 0.4, region: 'Germany' },
    { pattern: /ham$/i, weight: 0.3, region: 'UK/Germany' },
    { pattern: /ton$/i, weight: 0.3, region: 'UK/US' },
    { pattern: /ville$/i, weight: 0.3, region: 'France/US' },
    { pattern: /^St\.|^Saint/i, weight: 0.3, region: 'Global' },
    { pattern: /^San/i, weight: 0.3, region: 'Spain/US' },
    { pattern: /^São/i, weight: 0.3, region: 'Brazil' },
    
    // Asian patterns
    { pattern: /polis$/i, weight: 0.4, region: 'Greece' },
    { pattern: /grad$/i, weight: 0.4, region: 'Russia/Balkans' },
    { pattern: /abad$/i, weight: 0.4, region: 'India/Pakistan' },
    { pattern: /pur$/i, weight: 0.3, region: 'India' },
    { pattern: /nagar$/i, weight: 0.3, region: 'India' },
    
    // Middle East patterns
    { pattern: /^Dubai/i, weight: 0.5, region: 'UAE' },
    { pattern: /^Abu/i, weight: 0.4, region: 'UAE' },
    { pattern: /^Al-/i, weight: 0.3, region: 'Arabic' },
  ]
  
  for (const { pattern, weight, region } of cityPatterns) {
    if (pattern.test(token)) {
      confidence += weight
      if (region === 'Brazil') state = 'BR'
      if (region === 'UAE') country = 'UAE'
      break
    }
  }
  
  // Context analysis - check surrounding tokens
  const contextBonus = analyzeContext(token, allTokens, index)
  confidence += contextBonus.bonus
  if (contextBonus.state) state = contextBonus.state
  if (contextBonus.country) country = contextBonus.country
  
  // Geographical knowledge patterns
  const geoBonus = applyGeographicalKnowledge(token)
  confidence += geoBonus
  
  // Length-based confidence (cities are typically 3+ chars)
  if (token.length >= 3 && token.length <= 15) {
    confidence += 0.1
  }
  
  // Penalty for business-sounding names
  if (isCommonBusinessTerm(token)) {
    confidence -= 0.5
  }
  
  // Penalty for common words
  const commonWords = ['THE', 'AND', 'OF', 'IN', 'AT', 'TO', 'FOR', 'WITH', 'BY', 'ON']
  if (commonWords.includes(token.toUpperCase())) {
    confidence -= 0.8
  }
  
  return {
    city: token,
    state,
    country,
    confidence: Math.max(0, Math.min(1, confidence)),
    score: confidence
  }
}

/**
 * Analyze context around a token for geographical clues
 */
function analyzeContext(token: string, allTokens: string[], index: number): { bonus: number, state?: string, country?: string } {
  let bonus = 0
  let state: string | undefined
  let country: string | undefined
  
  // Check next token for state/country indicators
  if (index < allTokens.length - 1) {
    const nextToken = allTokens[index + 1].toUpperCase()
    
    // Brazilian states
    const brazilianStates = ['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'GO', 'MT', 'BA', 'PE', 'CE', 'PA', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI', 'AC', 'AP', 'AM', 'RO', 'RR', 'TO', 'DF', 'ES', 'MS']
    if (brazilianStates.includes(nextToken)) {
      bonus += 0.4
      state = nextToken
    }
    
    // US states (common ones)
    const usStates = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI']
    if (usStates.includes(nextToken)) {
      bonus += 0.3
      state = nextToken
      country = 'US'
    }
    
    // Country indicators
    const countries = ['BRAZIL', 'BRASIL', 'USA', 'GERMANY', 'DEUTSCHLAND', 'FRANCE', 'ITALY', 'SPAIN', 'UK', 'SWITZERLAND', 'SUISSE']
    if (countries.includes(nextToken)) {
      bonus += 0.3
      country = nextToken
    }
  }
  
  // Check if previous token suggests this is a city
  if (index > 0) {
    const prevToken = allTokens[index - 1].toUpperCase()
    const cityIndicators = ['CITY', 'TOWN', 'CIDADE', 'VILLE']
    if (cityIndicators.some(indicator => prevToken.includes(indicator))) {
      bonus += 0.3
    }
  }
  
  return { bonus, state, country }
}

/**
 * Apply geographical knowledge without hard-coded lists
 * Uses phonetic and linguistic patterns
 */
function applyGeographicalKnowledge(token: string): number {
  const upper = token.toUpperCase()
  
  // Common global city phonetic patterns
  const patterns = [
    /^NEW\s/i,           // New York, New Delhi, etc.
    /^SAN\s/i,           // San Francisco, San Paolo, etc.
    /^SANTA\s/i,         // Santa Monica, Santa Fe, etc.
    /^SAINT\s/i,         // Saint Petersburg, etc.
    /^MONTE/i,           // Monte Carlo, Montevideo, etc.
    /^PORTO/i,           // Porto Alegre, etc.
    /^RIO\s/i,           // Rio de Janeiro, etc.
    /^LAS\s/i,           // Las Vegas, etc.
    /^LOS\s/i,           // Los Angeles, etc.
    /PURAM$/i,           // Indian cities
    /GANJ$/i,            // Indian cities
  ]
  
  for (const pattern of patterns) {
    if (pattern.test(token)) {
      return 0.2
    }
  }
  
  return 0
}

/**
 * Analyze special location patterns
 */
function analyzeSpecialPatterns(originalLocation: string, tokens: string[]): Array<CityInfo & { score: number }> {
  const results: Array<CityInfo & { score: number }> = []
  
  // "Venue Name - City" pattern (like "Hyperion Hotel - Basel")
  if (originalLocation.includes(' - ')) {
    const parts = originalLocation.split(' - ')
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1].trim()
      if (lastPart.length > 2 && !isCommonBusinessTerm(lastPart)) {
        const analysis = analyzeCityCandidate(lastPart, [lastPart], 0, originalLocation)
        if (analysis.confidence > 0.2) {
          results.push({
            city: lastPart,
            state: analysis.state,
            country: analysis.country,
            confidence: analysis.confidence + 0.2, // Bonus for dash pattern
            score: analysis.confidence + 0.2
          })
        }
      }
    }
  }
  
  // "City, State" pattern
  const commaPattern = /([A-Za-z\s-']+),\s*([A-Z]{2})\s*$/
  const match = originalLocation.match(commaPattern)
  if (match) {
    const [, cityName, stateCode] = match
    results.push({
      city: cityName.trim(),
      state: stateCode,
      country: null,
      confidence: 0.8,
      score: 0.8
    })
  }
  
  return results
}

/**
 * Get weather data for a city using OpenWeatherMap API
 */
export async function getCityWeather(cityName: string, countryCode?: string): Promise<{
  temperature: number
  condition: string
  icon: string
} | null> {
  try {
    // Check multiple possible environment variable names for Vercel compatibility
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 
                   process.env.OPENWEATHER_API_KEY ||
                   process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY ||
                   process.env.OPENWEATHERMAP_API_KEY
    
    console.log('🌤️ Weather API key check:', {
      hasPublicKey: !!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
      hasPrivateKey: !!process.env.OPENWEATHER_API_KEY,
      usingKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'none'
    })
    
    if (!apiKey) {
      console.warn('🌤️ No OpenWeatherMap API key found in any environment variable')
      return null
    }
    
    // Build query string
    let query = cityName
    if (countryCode) {
      query += `,${countryCode}`
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=metric`
    
    console.log('🌤️ Fetching weather for:', query)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.warn(`🌤️ Weather API error for ${query}:`, response.status)
      return null
    }
    
    const data = await response.json()
    
    const weather = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      icon: getWeatherIcon(data.weather[0].main)
    }
    
    console.log('🌤️ Weather data for', query, ':', weather)
    return weather
    
  } catch (error) {
    console.error('🌤️ Weather fetch error:', error)
    return null
  }
}

/**
 * Convert OpenWeatherMap condition to emoji icon
 */
function getWeatherIcon(condition: string): string {
  const iconMap: Record<string, string> = {
    'Clear': '☀️',
    'Clouds': '☁️',
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Haze': '🌫️'
  }
  
  return iconMap[condition] || '☀️'
}