import { useState, useEffect } from 'react'
import { CompanyWithLocations, ClientType } from '@/types'

interface UseCompaniesWithLocationsReturn {
  companies: CompanyWithLocations[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCompaniesWithLocations(): UseCompaniesWithLocationsReturn {
  const [companies, setCompanies] = useState<CompanyWithLocations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/companies/with-locations', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Transform the API response to match our interface
      const transformedCompanies: CompanyWithLocations[] = data.companies?.map((company: any) => ({
        id: company.company_id,
        name: company.company_name,
        email: company.company_email,
        phone: company.company_phone,
        fantasyName: company.fantasy_name,
        clientType: (company.client_type as ClientType) || ClientType.ROASTERS,
        totalTripCostsThisYear: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        locations: [] // Will be populated by individual location calls
      })) || []
      
      // Fetch locations for each company
      const companiesWithLocations = await Promise.all(
        transformedCompanies.map(async (company) => {
          try {
            const locationsResponse = await fetch(`/api/companies/${company.id}/locations?meeting_only=false`, {
              credentials: 'include'
            })
            
            if (locationsResponse.ok) {
              const locationsData = await locationsResponse.json()
              // Transform locations to match our interface
              company.locations = (locationsData.locations || []).map((location: any) => ({
                id: location.id,
                companyId: company.id,
                name: location.location_name || location.name,
                addressLine1: location.address_line_1,
                addressLine2: location.address_line_2,
                city: location.city,
                state: location.state_province,
                postalCode: location.postal_code,
                country: location.country,
                googleMapsLink: location.google_maps_link,
                coordinates: location.latitude && location.longitude ? 
                  { lat: location.latitude, lng: location.longitude } : undefined,
                isPrimary: location.is_primary_location || false,
                createdAt: new Date(location.created_at || Date.now())
              }))
            }
          } catch (locationError) {
            console.warn(`Failed to fetch locations for company ${company.id}:`, locationError)
          }
          
          return company
        })
      )
      
      setCompanies(companiesWithLocations)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching companies with locations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    await fetchCompanies()
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  return {
    companies,
    isLoading,
    error,
    refetch
  }
}