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
    { city: 'Monte Belo', state: 'Minas Gerais', stateCode: 'MG', coordinates: { lat: -21.3273, lng: -46.3739 } }
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
    'altinopolis': 'Alta Mogiana'
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