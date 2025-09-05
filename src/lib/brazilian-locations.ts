// Brazilian coffee regions and cities data structure
// Focused on coffee-producing regions and major business centers

export interface BrazilianLocation {
  city: string
  state: string
  stateCode: string
  region: string
  coffeeRegion?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export const BRAZILIAN_COFFEE_REGIONS = {
  'Sul de Minas': [
    { city: 'Varginha', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.5518, lng: -45.4306 } },
    { city: 'Poços de Caldas', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.7879, lng: -46.5617 } },
    { city: 'São Sebastião do Paraíso', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -20.9173, lng: -47.1184 } },
    { city: 'Alfenas', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.4287, lng: -45.9473 } },
    { city: 'Três Pontas', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.3676, lng: -45.5084 } },
    { city: 'Machado', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.6739, lng: -45.9204 } },
    { city: 'Guaxupé', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.3084, lng: -46.7115 } },
    { city: 'Monte Belo', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.3273, lng: -46.3739 } },
    // Additional Sul de Minas locations
    { city: 'Carmo do Rio Claro', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -20.9873, lng: -46.0984 } },
    { city: 'Monte Santo de Minas', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.1873, lng: -46.9784 } }
  ],
  'Cerrado Mineiro': [
    { city: 'Patrocínio', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -18.9439, lng: -46.9929 } },
    { city: 'Monte Carmelo', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -18.7289, lng: -47.4984 } },
    { city: 'Carmo do Paranaíba', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -19.0029, lng: -46.3158 } },
    { city: 'São Gotardo', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -19.3127, lng: -46.0429 } },
    { city: 'Campos Altos', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -19.6917, lng: -46.1775 } },
    { city: 'Araxá', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -19.5939, lng: -46.9439 } }
  ],
  'Zona da Mata': [
    { city: 'Manhuaçu', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -20.2584, lng: -42.0339 } },
    { city: 'Caratinga', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -19.7939, lng: -42.1373 } },
    { city: 'Muriaé', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.1317, lng: -42.3717 } },
    { city: 'Viçosa', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -20.7539, lng: -42.8817 } }
  ],
  'Montanhas do Espírito Santo': [
    { city: 'Venda Nova do Imigrante', state: 'Espírito Santo', stateCode: 'ES', coordinates: { lat: -20.3417, lng: -41.1317 } },
    { city: 'Domingos Martins', state: 'Espírito Santo', stateCode: 'ES', coordinates: { lat: -20.3617, lng: -40.6617 } },
    { city: 'Marechal Floriano', state: 'Espírito Santo', stateCode: 'ES', coordinates: { lat: -20.4117, lng: -40.6817 } },
    { city: 'Castelo', state: 'Espírito Santo', stateCode: 'ES', coordinates: { lat: -20.6017, lng: -41.1817 } }
  ],
  'Alta Mogiana': [
    { city: 'Franca', state: 'São Paulo', stateCode: 'SP', coordinates: { lat: -20.5384, lng: -47.4006 } },
    { city: 'Altinópolis', state: 'São Paulo', stateCode: 'SP', coordinates: { lat: -21.0284, lng: -47.3706 } },
    { city: 'Batatais', state: 'São Paulo', stateCode: 'SP', coordinates: { lat: -20.8884, lng: -47.5806 } },
    { city: 'São José do Rio Pardo', state: 'São Paulo', stateCode: 'SP', coordinates: { lat: -21.5984, lng: -46.8906 } }
  ]
} as const

export const MAJOR_BRAZILIAN_CITIES: BrazilianLocation[] = [
  // Major business centers
  { city: 'São Paulo', state: 'São Paulo', stateCode: 'SP', region: 'Sudeste', coordinates: { lat: -23.5505, lng: -46.6333 } },
  { city: 'Santos', state: 'São Paulo', stateCode: 'SP', region: 'Sudeste', coordinates: { lat: -23.9608, lng: -46.3333 } },
  { city: 'Rio de Janeiro', state: 'Rio de Janeiro', stateCode: 'RJ', region: 'Sudeste', coordinates: { lat: -22.9068, lng: -43.1729 } },
  { city: 'Belo Horizonte', state: 'Minas Gerais', stateCode: 'MG', region: 'Sudeste', coordinates: { lat: -19.9167, lng: -43.9345 } },
  { city: 'Brasília', state: 'Distrito Federal', stateCode: 'DF', region: 'Centro-Oeste', coordinates: { lat: -15.8267, lng: -47.9218 } },
  { city: 'Salvador', state: 'Bahia', stateCode: 'BA', region: 'Nordeste', coordinates: { lat: -12.9714, lng: -38.5014 } },
  { city: 'Fortaleza', state: 'Ceará', stateCode: 'CE', region: 'Nordeste', coordinates: { lat: -3.7319, lng: -38.5267 } },
  { city: 'Recife', state: 'Pernambuco', stateCode: 'PE', region: 'Nordeste', coordinates: { lat: -8.0476, lng: -34.8770 } },
  { city: 'Porto Alegre', state: 'Rio Grande do Sul', stateCode: 'RS', region: 'Sul', coordinates: { lat: -30.0346, lng: -51.2177 } },
  { city: 'Curitiba', state: 'Paraná', stateCode: 'PR', region: 'Sul', coordinates: { lat: -25.4284, lng: -49.2733 } },
  { city: 'Vitória', state: 'Espírito Santo', stateCode: 'ES', region: 'Sudeste', coordinates: { lat: -20.2976, lng: -40.2958 } }
]

// Combine all coffee regions into a single searchable array
export const ALL_COFFEE_LOCATIONS: BrazilianLocation[] = Object.entries(BRAZILIAN_COFFEE_REGIONS).flatMap(([region, cities]) =>
  cities.map(city => ({
    ...city,
    region: region,
    coffeeRegion: region
  }))
)

// Combined list for comprehensive search
export const ALL_BRAZILIAN_LOCATIONS: BrazilianLocation[] = [
  ...ALL_COFFEE_LOCATIONS,
  ...MAJOR_BRAZILIAN_CITIES
]

export const BRAZILIAN_STATES = [
  { name: 'Acre', code: 'AC' },
  { name: 'Alagoas', code: 'AL' },
  { name: 'Amapá', code: 'AP' },
  { name: 'Amazonas', code: 'AM' },
  { name: 'Bahia', code: 'BA' },
  { name: 'Ceará', code: 'CE' },
  { name: 'Distrito Federal', code: 'DF' },
  { name: 'Espírito Santo', code: 'ES' },
  { name: 'Goiás', code: 'GO' },
  { name: 'Maranhão', code: 'MA' },
  { name: 'Mato Grosso', code: 'MT' },
  { name: 'Mato Grosso do Sul', code: 'MS' },
  { name: 'Minas Gerais', code: 'MG' },
  { name: 'Pará', code: 'PA' },
  { name: 'Paraíba', code: 'PB' },
  { name: 'Paraná', code: 'PR' },
  { name: 'Pernambuco', code: 'PE' },
  { name: 'Piauí', code: 'PI' },
  { name: 'Rio de Janeiro', code: 'RJ' },
  { name: 'Rio Grande do Norte', code: 'RN' },
  { name: 'Rio Grande do Sul', code: 'RS' },
  { name: 'Rondônia', code: 'RO' },
  { name: 'Roraima', code: 'RR' },
  { name: 'Santa Catarina', code: 'SC' },
  { name: 'São Paulo', code: 'SP' },
  { name: 'Sergipe', code: 'SE' },
  { name: 'Tocantins', code: 'TO' }
]

// AI-powered location detection
export function detectLocationFromAddress(address: string): BrazilianLocation | null {
  if (!address) return null
  
  const addressLower = address.toLowerCase()
  
  // First try to find exact city matches in coffee regions
  for (const location of ALL_COFFEE_LOCATIONS) {
    if (addressLower.includes(location.city.toLowerCase())) {
      return location
    }
  }
  
  // Then try major cities
  for (const location of MAJOR_BRAZILIAN_CITIES) {
    if (addressLower.includes(location.city.toLowerCase())) {
      return location
    }
  }
  
  // Try state codes
  for (const state of BRAZILIAN_STATES) {
    if (addressLower.includes(state.code.toLowerCase()) || addressLower.includes(state.name.toLowerCase())) {
      // If we find a state but no specific city, return the capital or major city of that state
      const majorCityInState = MAJOR_BRAZILIAN_CITIES.find(city => city.stateCode === state.code)
      if (majorCityInState) {
        return majorCityInState
      }
    }
  }
  
  return null
}

// Get region by city name (specific coffee region knowledge)
export function getRegionByCity(cityName: string, stateName?: string): string {
  const city = cityName.toLowerCase()
  const state = stateName?.toLowerCase()
  
  // Specific coffee region mappings
  const coffeeRegionMappings: { [key: string]: string } = {
    'varginha': 'Sul de Minas',
    'poços de caldas': 'Sul de Minas', 
    'pocos de caldas': 'Sul de Minas',
    'três pontas': 'Sul de Minas',
    'tres pontas': 'Sul de Minas',
    'alfenas': 'Sul de Minas',
    'machado': 'Sul de Minas',
    'guaxupé': 'Sul de Minas',
    'guaxupe': 'Sul de Minas',
    'carmo do paranaíba': 'Cerrado Mineiro',
    'carmo do paranaiba': 'Cerrado Mineiro',
    'patrocínio': 'Cerrado Mineiro',
    'patrocinio': 'Cerrado Mineiro',
    'monte carmelo': 'Cerrado Mineiro',
    'manhuaçu': 'Zona da Mata',
    'manhuacu': 'Zona da Mata',
    'caratinga': 'Zona da Mata',
    'muriaé': 'Zona da Mata',
    'muriae': 'Zona da Mata',
    'franca': 'Alta Mogiana',
    'altinópolis': 'Alta Mogiana',
    'altinopolis': 'Alta Mogiana',
    'santos': 'Sudeste'  // Santos port city - important coffee trading hub
  }
  
  // Check specific mappings first
  if (coffeeRegionMappings[city]) {
    return coffeeRegionMappings[city]
  }
  
  // If in Minas Gerais, try to determine sub-region
  if (state === 'minas gerais' || state === 'mg') {
    // Default regions for different areas of MG
    if (city.includes('sul') || city.includes('varginha') || city.includes('poços')) {
      return 'Sul de Minas'
    }
    if (city.includes('cerrado') || city.includes('patrocínio') || city.includes('carmo')) {
      return 'Cerrado Mineiro'
    }
    if (city.includes('mata') || city.includes('manhuaçu')) {
      return 'Zona da Mata'
    }
    return 'Minas Gerais' // Generic fallback
  }
  
  // State-based fallbacks
  const stateToRegion: { [key: string]: string } = {
    'sp': 'São Paulo',
    'são paulo': 'São Paulo',
    'rj': 'Rio de Janeiro', 
    'rio de janeiro': 'Rio de Janeiro',
    'es': 'Espírito Santo',
    'espírito santo': 'Espírito Santo',
    'espirito santo': 'Espírito Santo',
    'pr': 'Paraná',
    'paraná': 'Paraná',
    'parana': 'Paraná',
    'mg': 'Minas Gerais',
    'minas gerais': 'Minas Gerais'
  }
  
  return stateToRegion[state || ''] || 'Brasil'
}

// Travel time calculation between cities (in hours)
export function calculateTravelTime(fromCity: string, toCity: string): number {
  const fromCityLower = fromCity.toLowerCase().trim()
  const toCityLower = toCity.toLowerCase().trim()
  
  console.log(`🚗 [Travel Calc] Calculating travel: ${fromCity} → ${toCity}`)
  
  // Same city - no travel time
  if (fromCityLower === toCityLower) {
    console.log(`🏙️ [Travel Calc] Same city detected: ${fromCity} = ${toCity} (0h)`)
    return 0
  }
  
  // Santos area optimization - most visits within walking distance
  if (isSantosArea(fromCity) && isSantosArea(toCity)) {
    console.log(`🚶 [Travel Calc] Santos area walking distance: ${fromCity} ↔ ${toCity} (0h)`)
    return 0 // Walking distance in Santos port area
  }
  
  // Varginha area optimization - short drives between offices
  if (isVarginhaArea(fromCity) && isVarginhaArea(toCity)) {
    console.log(`🚙 [Travel Calc] Varginha area short drive: ${fromCity} ↔ ${toCity} (0.1h)`)
    return 0.1 // 5-10 minutes drive, round up to minimal time
  }
  
  // Enhanced same-city detection using company names/addresses
  const fromLocation = ALL_BRAZILIAN_LOCATIONS.find(loc => 
    loc.city.toLowerCase().includes(fromCityLower) || fromCityLower.includes(loc.city.toLowerCase())
  )
  const toLocation = ALL_BRAZILIAN_LOCATIONS.find(loc => 
    loc.city.toLowerCase().includes(toCityLower) || toCityLower.includes(loc.city.toLowerCase())
  )
  
  // If both cities are found and are actually the same city (fuzzy matching)
  if (fromLocation && toLocation && fromLocation.city.toLowerCase() === toLocation.city.toLowerCase()) {
    console.log(`🏙️ [Travel Calc] Fuzzy same city match: ${fromCity} = ${toCity} via ${fromLocation.city} (0h)`)
    return 0
  }
  
  // Same coffee region - reduced travel time
  if (areCitiesInSameRegion(fromCity, toCity)) {
    const region1 = getRegionByCity(fromCity)
    const region2 = getRegionByCity(toCity)
    
    if (region1 === region2 && region1 !== 'Brasil') {
      console.log(`☕ [Travel Calc] Same coffee region: ${fromCity} ↔ ${toCity} in ${region1} (0.5h)`)
      return 0.5 // Same coffee region - optimized travel
    }
  }
  
  // Try to find locations with better fuzzy matching
  if (!fromLocation?.coordinates || !toLocation?.coordinates) {
    console.log(`⚠️ [Travel Calc] Missing coordinates for ${fromCity} or ${toCity}, using default 2h`)
    return 2 // Default 2 hours if coordinates not found
  }
  
  // Calculate distance using Haversine formula
  const distance = calculateDistance(
    fromLocation.coordinates.lat, fromLocation.coordinates.lng,
    toLocation.coordinates.lat, toLocation.coordinates.lng
  )
  
  console.log(`📏 [Travel Calc] Distance: ${distance.toFixed(2)} km between ${fromLocation.city} and ${toLocation.city}`)
  
  // Estimate travel time: average speed 60 km/h for Brazilian roads
  const travelTimeHours = distance / 60
  
  // Round to nearest 0.5 hours and ensure minimum 0.5 hours
  const finalTime = Math.max(0.5, Math.round(travelTimeHours * 2) / 2)
  console.log(`⏱️ [Travel Calc] Final travel time: ${finalTime}h for ${fromCity} → ${toCity}`)
  
  return finalTime
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

// Helper function to check if city is in Santos port area
export function isSantosArea(cityName: string): boolean {
  const city = cityName.toLowerCase()
  return city.includes('santos') || 
         city.includes('guarujá') || 
         city.includes('guaruja') ||
         city.includes('cubatão') ||
         city.includes('cubatao') ||
         city.includes('são vicente') ||
         city.includes('sao vicente')
}

// Helper function to check if city is in Varginha area
export function isVarginhaArea(cityName: string): boolean {
  const city = cityName.toLowerCase()
  return city.includes('varginha') ||
         city.includes('três pontas') ||
         city.includes('tres pontas') ||
         city.includes('alfenas') ||
         city.includes('machado') ||
         city.includes('guaxupé') ||
         city.includes('guaxupe')
}

// Check if cities are in the same region (for grouping meetings)
export function areCitiesInSameRegion(city1: string, city2: string): boolean {
  const loc1 = ALL_BRAZILIAN_LOCATIONS.find(loc => 
    loc.city.toLowerCase() === city1.toLowerCase()
  )
  const loc2 = ALL_BRAZILIAN_LOCATIONS.find(loc => 
    loc.city.toLowerCase() === city2.toLowerCase()
  )
  
  if (!loc1 || !loc2) return false
  
  // Consider cities in same region if they're in the same coffee region or state
  return loc1.coffeeRegion === loc2.coffeeRegion || 
         loc1.stateCode === loc2.stateCode ||
         (loc1.region === loc2.region && calculateTravelTime(city1, city2) <= 2)
}

// Get optimal meeting duration based on city (Santos gets shorter meetings)
export function getOptimalMeetingDuration(cityName: string): number {
  if (isSantosArea(cityName)) {
    return 2 // 2 hours for Santos port meetings (more efficient)
  }
  
  if (isVarginhaArea(cityName)) {
    return 3 // 3 hours for Varginha area (medium duration)
  }
  
  return 4 // 4 hours for other locations (comprehensive visits)
}

// Calculate maximum meetings per day for a city
export function getMaxMeetingsPerDay(cityName: string): number {
  if (isSantosArea(cityName)) {
    return 5 // Can fit 5 x 2-hour meetings in Santos (walking distance)
  }
  
  if (isVarginhaArea(cityName)) {
    return 3 // Can fit 3 x 3-hour meetings in Varginha (short drives)
  }
  
  return 2 // Standard 2 x 4-hour meetings for other cities
}

// Enhanced city detection from company address
export function extractCityFromAddress(address: string): string {
  if (!address) return ''
  
  const addressLower = address.toLowerCase()
  
  // First try exact matches in our known cities
  for (const location of ALL_BRAZILIAN_LOCATIONS) {
    if (addressLower.includes(location.city.toLowerCase())) {
      return location.city
    }
  }
  
  // If no exact match, try to extract from common address patterns
  const patterns = [
    /([\w\s]+),\s*[\w\s]*\s*-\s*[A-Z]{2}/,  // City, State - XX
    /([\w\s]+)\s*-\s*[A-Z]{2}/,            // City - XX
    /,\s*([\w\s]+),/,                     // , City,
    /^([\w\s]+),/,                        // City,
  ]
  
  for (const pattern of patterns) {
    const match = address.match(pattern)
    if (match && match[1]) {
      const extractedCity = match[1].trim()
      // Validate the extracted city is reasonable (not just numbers or single chars)
      if (extractedCity.length > 2 && !/^\d+$/.test(extractedCity)) {
        return extractedCity
      }
    }
  }
  
  return '' // No city found
}

// Check if two companies are in the same city (enhanced logic)
export function areCompaniesInSameCity(company1: any, company2: any): boolean {
  if (!company1 || !company2) return false
  
  // Extract city names from company data
  const city1 = company1.city || extractCityFromAddress(company1.address || '') || ''
  const city2 = company2.city || extractCityFromAddress(company2.address || '') || ''
  
  if (!city1 || !city2) return false
  
  const city1Lower = city1.toLowerCase().trim()
  const city2Lower = city2.toLowerCase().trim()
  
  // Direct city name comparison
  if (city1Lower === city2Lower) return true
  
  // Check if they're in special areas (Santos, Varginha) that are treated as same city
  if (isSantosArea(city1) && isSantosArea(city2)) return true
  if (isVarginhaArea(city1) && isVarginhaArea(city2)) return true
  
  // Check if they're in the same metro area or region
  if (areCitiesInSameRegion(city1, city2)) {
    const travelTime = calculateTravelTime(city1, city2)
    // Consider same city if travel time is very short (30 minutes or less)
    return travelTime <= 0.5
  }
  
  return false
}

// Starting point optimization logic
export function getStartingPointStrategy(startingPoint: string): {
  name: string
  routingStrategy: 'port-inland' | 'north-south' | 'hub-spoke' | 'fly-drive' | 'airport-pickup' | 'custom'
  priorityRegions: string[]
  description: string
} {
  switch (startingPoint) {
    case 'santos':
      return {
        name: 'Santos HQ Strategy',
        routingStrategy: 'port-inland',
        priorityRegions: ['Santos/Port Area', 'São Paulo Metropolitan', 'Sul de Minas', 'Cerrado Mineiro'],
        description: 'Visit Wolthers HQ and exporters in Santos, then work inland to coffee regions'
      }
    
    case 'cerrado':
      return {
        name: 'Cerrado Regional Strategy',
        routingStrategy: 'north-south',
        priorityRegions: ['Cerrado Mineiro', 'Sul de Minas', 'Alta Mogiana', 'Zona da Mata'],
        description: 'North-to-south routing through prime coffee-growing regions'
      }
    
    case 'uberlandia':
      return {
        name: 'Fly to Cerrado Strategy',
        routingStrategy: 'fly-drive',
        priorityRegions: ['Cerrado Mineiro', 'Sul de Minas', 'Alta Mogiana'],
        description: 'Fly to Cerrado - with either rental or Wolthers driver to pick us up'
      }
    
    case 'sao_paulo':
      return {
        name: 'Metropolitan Hub Strategy',
        routingStrategy: 'hub-spoke',
        priorityRegions: ['São Paulo Metropolitan', 'Alta Mogiana', 'Sul de Minas', 'Santos/Port Area'],
        description: 'Use São Paulo as central hub with day trips to various regions'
      }
    
    case 'gru_airport':
      return {
        name: 'GRU Airport Pickup Strategy',
        routingStrategy: 'airport-pickup',
        priorityRegions: ['São Paulo Metropolitan', 'Santos/Port Area', 'Sul de Minas', 'Cerrado Mineiro'],
        description: 'Pick up from GRU airport, then drive to Santos, São Paulo, or Interior'
      }
    
    default:
      return {
        name: 'Custom Strategy',
        routingStrategy: 'custom',
        priorityRegions: [],
        description: `Custom routing starting from ${startingPoint}`
      }
  }
}

// Optimize company order based on starting point
export function optimizeCompanyOrderByStartingPoint(
  companies: any[],
  startingPoint: string
): { company: any, city: string, region: string, priority: number }[] {
  const strategy = getStartingPointStrategy(startingPoint)
  
  return companies.map(company => {
    const city = company.city || extractCityFromAddress(company.address || '') || 'Unknown'
    const region = getRegionByCity(city, company.state)
    
    // Calculate priority based on starting point strategy
    let priority = 100 // Default priority
    
    switch (strategy.routingStrategy) {
      case 'port-inland':
        if (isSantosArea(city)) priority = 10
        else if (city.toLowerCase().includes('são paulo')) priority = 20
        else if (region === 'Sul de Minas') priority = 30
        else if (region === 'Cerrado Mineiro') priority = 40
        break
      
      case 'north-south':
        if (region === 'Cerrado Mineiro') priority = 10
        else if (region === 'Sul de Minas') priority = 20
        else if (region === 'Alta Mogiana') priority = 30
        else if (region === 'Zona da Mata') priority = 40
        break
      
      case 'fly-drive':
        // Prioritize by distance from Uberlândia/Cerrado
        if (region === 'Cerrado Mineiro') priority = 10
        else if (region === 'Sul de Minas') priority = 20
        else if (region === 'Alta Mogiana') priority = 30
        break
      
      case 'hub-spoke':
        // Prioritize by accessibility from São Paulo
        if (city.toLowerCase().includes('são paulo')) priority = 10
        else if (region === 'Alta Mogiana') priority = 20
        else if (region === 'Sul de Minas') priority = 30
        else if (isSantosArea(city)) priority = 40
        break
      
      case 'airport-pickup':
        // GRU Airport pickup - prioritize by proximity to airport/São Paulo
        if (city.toLowerCase().includes('são paulo')) priority = 10
        else if (isSantosArea(city)) priority = 20 // Easy drive from GRU to Santos
        else if (region === 'Alta Mogiana') priority = 30 // Interior drive
        else if (region === 'Sul de Minas') priority = 40
        else if (region === 'Cerrado Mineiro') priority = 50
        break
    }
    
    return { company, city, region, priority }
  }).sort((a, b) => a.priority - b.priority)
}