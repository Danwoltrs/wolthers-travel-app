'use client'

import { useState, useEffect } from 'react'
import type { Company, CompanyFilters } from '@/types/company'

export function useCompanies(filters?: CompanyFilters) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.company_type?.length) params.append('types', filters.company_type.join(','))
      if (filters?.is_active !== undefined) params.append('active', filters.is_active.toString())
      if (filters?.has_recent_trips) params.append('recent_trips', 'true')
      if (filters?.min_trip_count) params.append('min_trips', filters.min_trip_count.toString())
      if (filters?.max_trip_count) params.append('max_trips', filters.max_trip_count.toString())
      if (filters?.tags?.length) params.append('tags', filters.tags.join(','))
      if (filters?.certifications?.length) params.append('certs', filters.certifications.join(','))
      if (filters?.sort_by) params.append('sort', filters.sort_by)
      if (filters?.sort_order) params.append('order', filters.sort_order)

      const response = await fetch(`/api/companies?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`)
      }

      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (err) {
      console.error('Error fetching companies:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch companies')
      
      // Set empty array instead of falling back to mock data
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [JSON.stringify(filters)])

  return {
    companies,
    loading,
    error,
    refetch: fetchCompanies
  }
}

