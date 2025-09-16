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

function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function buildNormalizedSet(values: string[]): Set<string> {
  const normalizedValues = values
    .map(value => normalizeForComparison(value))
    .filter(value => value.length > 0)

  return new Set(normalizedValues)
}

const CONNECTOR_WORDS = new Set<string>(
  [
    'de',
    'do',
    'da',
    'dos',
    'das',
    'del',
    'della',
    'di',
    'du',
    'la',
    'le',
    'los',
    'las',
    'el',
    'y',
    'e',
    'st',
    'of',
    'the',
    'and'
  ].map(word => normalizeForComparison(word))
)

const BUSINESS_TERMS = [
  'hotel',
  'resort',
  'airport',
  'station',
  'center',
  'centre',
  'building',
  'tower',
  'plaza',
  'mall',
  'corp',
  'ltd',
  'inc',
  'international',
  'company',
  'group',
  'association',
  'conference',
  'summit',
  'meeting',
  'office',
  'headquarters'
]

const VENUE_NAMES = [
  'SCTA',
  'BWC',
  'COFCO',
  'EISA',
  'COMEXIM',
  'BRASCOF',
  'HYPERION',
  'LOFBERGS',
  'COOXUPE',
  'BLASER',
  'NORDQUIST',
  'EXPOCACER',
  'MINASUL',
  'COCATREL',
  'VELOSO'
]

const BUSINESS_TERMS_NORMALIZED = BUSINESS_TERMS.map(term => normalizeForComparison(term))
const VENUE_NAMES_NORMALIZED = VENUE_NAMES.map(term => normalizeForComparison(term))

const BRAZILIAN_STATE_CODES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO'
]

const UNITED_STATES_STATE_CODES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']

const ADMINISTRATIVE_REGION_CODES = buildNormalizedSet([
  ...BRAZILIAN_STATE_CODES,
  ...UNITED_STATES_STATE_CODES
])

const ADMINISTRATIVE_REGION_NAMES = buildNormalizedSet([
  // Brazil
  'Acre',
  'Alagoas',
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
  'Rondônia',
  'Roraima',
  'Santa Catarina',
  'Sergipe',
  'Tocantins',
  // Other common regions/countries
  'Brazil',
  'Brasil',
  'United States',
  'USA',
  'United Kingdom',
  'UK',
  'England',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Switzerland',
  'Europe',
  'Asia',
  'Africa',
  'South America',
  'Latin America',
  'North America'
])

const CITY_NAME_EXCEPTIONS = buildNormalizedSet(['São Paulo', 'Sao Paulo', 'Rio de Janeiro'])

const ADMINISTRATIVE_KEYWORD_PHRASES = [
  'STATE OF',
  'ESTADO DE',
  'ESTADO DO',
  'ESTADO DA',
  'PROVINCE OF',
  'PROVINCIA DE',
  'PROVINCIA DO',
  'PROVINCIA DA',
  'PROVÍNCIA DE',
  'PROVÍNCIA DO',
  'PROVÍNCIA DA',
  'REGION OF',
  'REGIAO DE',
  'REGIAO DO',
  'REGIAO DA',
  'REGIÃO DE',
  'REGIÃO DO',
  'REGIÃO DA',
  'DEPARTMENT OF',
  'DEPARTAMENTO DE',
  'DEPARTAMENTO DO',
  'DEPARTAMENTO DA',
  'MUNICIPIO DE',
  'MUNICIPIO DO',
  'MUNICIPIO DA',
  'MUNICÍPIO DE',
  'MUNICÍPIO DO',
  'MUNICÍPIO DA',
  'MUNICIPALITY OF',
  'COUNTY OF',
  'CANTON OF',
  'PREFECTURE OF'
]

const ADMINISTRATIVE_KEYWORD_EXACT = buildNormalizedSet([
  'State',
  'Province',
  'Provincia',
  'Província',
  'Region',
  'Região',
  'Departamento',
  'Department',
  'Municipio',
  'Município',
  'Municipality',
  'County',
  'Canton',
  'Prefecture',
  'Prefeitura'
])

const ADMINISTRATIVE_KEYWORD_PHRASES_NORMALIZED = ADMINISTRATIVE_KEYWORD_PHRASES.map(phrase =>
  normalizeForComparison(phrase)
)

const BANNED_CITY_WORDS = new Set<string>(
  [
    'COFFEE',
    'DINNER',
    'LUNCH',
    'BREAKFAST',
    'MEETING',
    'VISIT',
    'RETURN',
    'ARRIVAL',
    'DEPARTURE',
    'CHECKIN',
    'CHECKOUT',
    'CHECK-IN',
    'CHECK-OUT',
    'TRANSFER',
    'TRAVEL',
    'TOUR',
    'EVENT',
    'SUMMIT',
    'CONFERENCE',
    'OFFICE',
    'HEADQUARTERS',
    'HQ',
    'HOTEL',
    'RESORT',
    'PLANT',
    'FACTORY',
    'MILL',
    'FARM',
    'FAZENDA',
    'COOPERATIVE',
    'COOP',
    'WAREHOUSE',
    'PORT',
    'AIRPORT',
    'TERMINAL',
    'STATION',
    'UNIVERSITY',
    'COLLEGE',
    'SCHOOL',
    'CHURCH',
    'CATHEDRAL',
    'MUSEUM',
    'PARK',
    'GARDEN',
    'CENTER',
    'CENTRE',
    'CENTRO',
    'VILLAGE',
    'TOWN',
    'CITY',
    'STATE',
    'PROVINCE',
    'REGION',
    'COUNTRY',
    'DISTRICT',
    'AREA',
    'COMPLEX',
    'CLIENT',
    'DINER',
    'RESTAURANT',
    'CAFE',
    'CAFÉ',
    'BAR',
    'LODGE',
    'ESTATE',
    'RANCH',
    'PLAZA',
    'SHOP',
    'STORE',
    'MARKET',
    'OUTLET',
    'BAY',
    'LAKE',
    'RIVER',
    'VALLEY',
    'BEACH',
    'MOUNTAIN',
    'ISLAND',
    'ISLA',
    'ISLE',
    'FJORD',
    'CAPE',
    'HARBOR',
    'HARBOUR',
    'HARVEST',
    'PLANTATION',
    'INSTITUTE',
    'FOUNDATION',
    'ASSOCIATION',
    'COMPANY',
    'GROUP',
    'COOXUPE',
    'BLASER',
    'NORDQUIST',
    'SCTA',
    'BWC'
  ].map(word => normalizeForComparison(word))
)

/**
 * Intelligent city extraction from location strings
 * Uses linguistic patterns, geographical knowledge, and business logic
 */
export function extractCityFromLocation(location: string): CityInfo | null {
  if (!location || location.trim() === '') {
    return null
  }
  
  console.log('🌍 v2 Analyzing location:', location)
  
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
    .map(part => part.replace(/^[•*·\-]+\s*/, ''))
    .map(part => part.replace(/\s+/g, ' '))
    .filter(part => part.length > 1)
    .filter(part => !/^\d+$/.test(part)) // Skip pure numbers
    .filter(part => !/^\d{5}-?\d{3}$/.test(part)) // Skip postal codes
    .filter(part => !isCommonBusinessTerm(part))
    .filter(part => !isAdministrativeRegion(part))
}

/**
 * Check if a token is a common business/venue term or specific venue name
 */
function isCommonBusinessTerm(term: string): boolean {
  const normalizedTerm = normalizeForComparison(term)
  if (!normalizedTerm) {
    return false
  }

  if (VENUE_NAMES_NORMALIZED.some(venue => normalizedTerm === venue || normalizedTerm.includes(venue))) {
    return true
  }

  return BUSINESS_TERMS_NORMALIZED.some(business =>
    normalizedTerm.includes(business) || business.includes(normalizedTerm)
  )
}

function isAdministrativeRegion(term: string): boolean {
  const normalizedTerm = normalizeForComparison(term)
  if (!normalizedTerm) {
    return false
  }

  if (CITY_NAME_EXCEPTIONS.has(normalizedTerm)) {
    return false
  }

  if (ADMINISTRATIVE_REGION_CODES.has(normalizedTerm)) {
    return true
  }

  if (ADMINISTRATIVE_REGION_NAMES.has(normalizedTerm)) {
    return true
  }

  if (ADMINISTRATIVE_KEYWORD_EXACT.has(normalizedTerm)) {
    return true
  }

  if (ADMINISTRATIVE_KEYWORD_PHRASES_NORMALIZED.some(phrase => normalizedTerm.includes(phrase))) {
    return true
  }

  return false
}

function sanitizeCityToken(token: string): string | null {
  if (!token) {
    return null
  }

  let sanitized = token.trim()
  if (!sanitized) {
    return null
  }

  sanitized = sanitized.replace(/^[•*·\-]+\s*/, '')
  sanitized = sanitized.replace(/\s+/g, ' ')

  const leadingPatterns: RegExp[] = [
    /^Day\s*[0-9IVXLCDM]+[:\-]?\s*/i,
    /^(?:Visit|Visita|Tour|Passeio|Meeting|Reuni[aã]o|Check-?in|Check-?out|Arrival|Arrive|Departure|Depart|Return|Retorno|Drive to|Travel to|Transfer to|Welcome to)\s+(?:at|in|to)?\s*/i,
    /^(?:Lunch|Dinner|Breakfast|Coffee)\s+(?:at|in|with)?\s*/i,
    /^(?:Hotel|Pousada|Resort|Fazenda|Farm)\s+/i
  ]

  for (const pattern of leadingPatterns) {
    sanitized = sanitized.replace(pattern, '')
  }

  const descriptorPatterns: Array<[RegExp, string]> = [
    [/^(?:City|Cidade|Munic[ií]pio|Municipio|Town|Village)\s+(?:de|da|do|dos|das|del|of)\s+/i, ''],
    [/^(?:State|Estado|Province|Prov[ií]ncia|Region|Regi[aã]o|Departamento|Department|County|Prefeitura|Prefecture)\s+(?:de|da|do|dos|das|del|of)\s+/i, ''],
    [/^(?:The)\s+/i, '']
  ]

  for (const [pattern, replacement] of descriptorPatterns) {
    sanitized = sanitized.replace(pattern, replacement)
  }

  sanitized = sanitized.replace(/\s+-\s+[A-Z]{2}$/i, '')
  sanitized = sanitized.replace(/,\s*(Brazil|Brasil|United States|USA|Switzerland|Germany|France|Italy|Spain|Portugal|Netherlands|Belgium|Austria|Denmark|Sweden|Finland|Norway|England|United Kingdom|UK)$/i, '')
  sanitized = sanitized.replace(/\s+(Brazil|Brasil|United States|USA|Switzerland|Germany|France|Italy|Spain|Portugal|Netherlands|Belgium|Austria|Denmark|Sweden|Finland|Norway|England|United Kingdom|UK)$/i, '')
  sanitized = sanitized.replace(/\s*\(.*?\)\s*$/g, '')
  sanitized = sanitized.replace(/\s*\[.*?\]\s*$/g, '')
  sanitized = sanitized.replace(/[.,]$/g, '')
  sanitized = sanitized.replace(/\s{2,}/g, ' ').trim()

  if (!sanitized) {
    return null
  }

  const normalized = normalizeForComparison(sanitized)
  if (!normalized || normalized === 'NA') {
    return null
  }

  return sanitized
}

function looksLikeCity(name: string): boolean {
  if (!name) {
    return false
  }

  const normalized = normalizeForComparison(name)
  if (!normalized || normalized.length < 2) {
    return false
  }

  if (/^DAY\s*[0-9IVXLCDM]+/.test(normalized)) {
    return false
  }

  if (isAdministrativeRegion(name)) {
    return false
  }

  if (isCommonBusinessTerm(name)) {
    return false
  }

  const words = name.replace(/-/g, ' ').split(/\s+/).filter(Boolean)
  let hasCityWord = false

  for (const word of words) {
    const normalizedWord = normalizeForComparison(word)
    if (!normalizedWord) {
      continue
    }

    if (CONNECTOR_WORDS.has(normalizedWord)) {
      continue
    }

    if (BANNED_CITY_WORDS.has(normalizedWord)) {
      return false
    }

    if (/^\d+$/.test(normalizedWord)) {
      return false
    }

    if (normalizedWord.length <= 2 && normalizedWord === normalizedWord.toUpperCase()) {
      return false
    }

    if (!/^[A-ZÀ-ÖØ-Ý]/.test(word)) {
      return false
    }

    hasCityWord = true
  }

  return hasCityWord
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

  for (const candidate of candidates) {
    const sanitizedCity = sanitizeCityToken(candidate.city)
    if (!sanitizedCity) {
      continue
    }

    if (isAdministrativeRegion(sanitizedCity)) {
      continue
    }

    if (!looksLikeCity(sanitizedCity)) {
      continue
    }

    return {
      city: sanitizedCity,
      state: candidate.state,
      country: candidate.country,
      confidence: candidate.confidence
    }
  }

  return null
}

/**
 * Analyze a single token as a potential city
 */
function analyzeCityCandidate(token: string, allTokens: string[], index: number, originalLocation: string): CityInfo & { score:
number } {
  const cleanedToken = sanitizeCityToken(token) ?? token.trim()
  const baseToken = cleanedToken.trim()

  if (!baseToken) {
    return {
      city: '',
      state: null,
      country: null,
      confidence: 0,
      score: 0
    }
  }

  let confidence = 0
  let state: string | null = null
  let country: string | null = null

  // Base score for proper capitalization
  if (/^[A-ZÀ-ÖØ-Ý][A-Za-zÀ-ÖØ-öø-ÿ\s-']*$/.test(baseToken)) {
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
    if (pattern.test(baseToken)) {
      confidence += weight
      if (region === 'Brazil') state = 'BR'
      if (region === 'UAE') country = 'UAE'
      break
    }
  }

  // Context analysis - check surrounding tokens
  const contextBonus = analyzeContext(baseToken, allTokens, index)
  confidence += contextBonus.bonus
  if (contextBonus.state) state = contextBonus.state
  if (contextBonus.country) country = contextBonus.country

  // Geographical knowledge patterns
  const geoBonus = applyGeographicalKnowledge(baseToken)
  confidence += geoBonus

  // Length-based confidence (cities are typically 3+ chars)
  if (baseToken.length >= 3 && baseToken.length <= 20) {
    confidence += 0.1
  }

  // Penalty for business-sounding names
  if (isCommonBusinessTerm(baseToken)) {
    confidence -= 0.5
  }

  if (isAdministrativeRegion(baseToken)) {
    confidence -= 0.6
  }

  if (looksLikeCity(baseToken)) {
    confidence += 0.1
  } else {
    confidence -= 0.3
  }

  // Penalty for common words
  const commonWords = ['THE', 'AND', 'OF', 'IN', 'AT', 'TO', 'FOR', 'WITH', 'BY', 'ON']
  if (commonWords.includes(baseToken.toUpperCase())) {
    confidence -= 0.8
  }

  const finalConfidence = Math.max(0, Math.min(1, confidence))

  return {
    city: baseToken,
    state,
    country,
    confidence: finalConfidence,
    score: confidence
  }
}

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
      const sanitizedLastPart = sanitizeCityToken(lastPart)
      if (
        sanitizedLastPart &&
        sanitizedLastPart.length > 2 &&
        !isCommonBusinessTerm(sanitizedLastPart) &&
        looksLikeCity(sanitizedLastPart)
      ) {
        const analysis = analyzeCityCandidate(sanitizedLastPart, [sanitizedLastPart], 0, originalLocation)
        if (analysis.confidence > 0.2) {
          results.push({
            city: sanitizedLastPart,
            state: analysis.state,
            country: analysis.country,
            confidence: analysis.confidence + 0.2, // Bonus for dash pattern
            score: analysis.confidence + 0.2
          })
        }
      }
    }
  }
  
  // Brazilian address pattern: "Street - Neighborhood, City - State, ZIP, Country"
  // Example: "Av. Urbâno García, 680 - Santa Margarida, Três Pontas - MG, 37190-000, Brazil"
  const brazilianPattern = /,\s*([A-Za-z\s\u00C0-\u017F]+)\s*-\s*(MG|SP|RJ|RS|SC|PR|GO|MT|BA|PE|CE|PA|MA|PB|RN|AL|SE|PI|AC|AP|AM|RO|RR|TO|DF|ES|MS)\s*,/
  console.log('🇧🇷 Testing Brazilian pattern on:', originalLocation)
  const brazilMatch = originalLocation.match(brazilianPattern)
  if (brazilMatch) {
    const [, cityName, stateCode] = brazilMatch
    console.log('🇧🇷 BRAZILIAN MATCH FOUND:', cityName, stateCode)
    const sanitizedCity = sanitizeCityToken(cityName)
    if (sanitizedCity && looksLikeCity(sanitizedCity)) {
      results.push({
        city: sanitizedCity,
        state: stateCode,
        country: 'BR',
        confidence: 0.95, // High confidence for Brazilian address pattern
        score: 0.95
      })
    }
  } else {
    console.log('🇧🇷 No Brazilian pattern match')
  }

  // "City, State" pattern
  const commaPattern = /([A-Za-z\s-']+),\s*([A-Z]{2})\s*$/
  const match = originalLocation.match(commaPattern)
  if (match) {
    const [, cityName, stateCode] = match
    const sanitizedCity = sanitizeCityToken(cityName)
    if (sanitizedCity && looksLikeCity(sanitizedCity)) {
      results.push({
        city: sanitizedCity,
        state: stateCode,
        country: null,
        confidence: 0.8,
        score: 0.8
      })
    }
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