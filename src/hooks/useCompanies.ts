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
      
      // Fallback to mock data for now
      setCompanies(getMockCompanies())
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

// Mock data for development
function getMockCompanies(): Company[] {
  return [
    {
      id: '1',
      name: 'Nordic Coffee Roasters',
      email: 'info@nordiccoffee.com',
      phone: '+45 12 34 56 78',
      website: 'https://nordiccoffee.com',
      company_type: 'roaster_dealer',
      company_subtype: 'Specialty Roaster',
      legacy_id: null,
      trip_count: 8,
      total_cost_usd: 45000,
      last_visit_date: '2025-07-30',
      primary_contact_name: 'Lars Hansen',
      primary_contact_email: 'lars@nordiccoffee.com',
      primary_contact_phone: '+45 98 76 54 32',
      notes: 'Premium specialty coffee roaster based in Copenhagen',
      is_active: true,
      tags: ['premium', 'specialty', 'nordic'],
      industry_certifications: ['Fair Trade', 'Organic', 'Rainforest Alliance'],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2025-08-01T14:30:00Z'
    },
    {
      id: '2',
      name: 'Brazilian Coffee Exporters',
      email: 'export@brazilcoffee.com.br',
      phone: '+55 11 1234 5678',
      website: 'https://brazilcoffee.com.br',
      company_type: 'exporter_coop',
      company_subtype: 'Large Exporter',
      legacy_id: 'BC-2020-001',
      trip_count: 12,
      total_cost_usd: 120000,
      last_visit_date: '2025-07-29',
      primary_contact_name: 'Carlos Rodriguez',
      primary_contact_email: 'carlos@brazilcoffee.com.br',
      primary_contact_phone: '+55 11 9876 5432',
      notes: 'Major exporter with multiple farms in Santos region',
      is_active: true,
      tags: ['brazil', 'santos', 'arabica'],
      industry_certifications: ['UTZ Certified', 'Organic'],
      created_at: '2023-06-20T08:00:00Z',
      updated_at: '2025-08-15T16:45:00Z'
    },
    {
      id: '3',
      name: 'Coffee Collective',
      email: 'hello@coffeecollective.dk',
      phone: '+45 60 15 15 25',
      website: 'https://coffeecollective.dk',
      company_type: 'roaster_dealer',
      company_subtype: 'Micro Roaster',
      legacy_id: null,
      trip_count: 5,
      total_cost_usd: 22000,
      last_visit_date: '2025-07-30',
      primary_contact_name: 'Peter Dupont',
      primary_contact_email: 'peter@coffeecollective.dk',
      primary_contact_phone: '+45 60 15 15 25',
      notes: 'Award-winning micro roaster with focus on direct trade',
      is_active: true,
      tags: ['micro-roaster', 'direct-trade', 'copenhagen'],
      industry_certifications: ['B Corp', 'Direct Trade'],
      created_at: '2024-03-10T09:30:00Z',
      updated_at: '2025-07-31T11:20:00Z'
    },
    {
      id: '4',
      name: 'Colombian Farmers Cooperative',
      email: 'info@colombiacoop.co',
      phone: '+57 1 234 5678',
      website: 'https://colombiacoop.co',
      company_type: 'exporter_coop',
      company_subtype: 'Farmers Cooperative',
      legacy_id: 'COL-COOP-2019',
      trip_count: 7,
      total_cost_usd: 38000,
      last_visit_date: '2025-08-10',
      primary_contact_name: 'Maria Gonzalez',
      primary_contact_email: 'maria@colombiacoop.co',
      primary_contact_phone: '+57 300 123 4567',
      notes: 'Cooperative representing 500+ small farmers',
      is_active: true,
      tags: ['colombia', 'cooperative', 'smallholder'],
      industry_certifications: ['Fair Trade', 'Organic', 'Shade Grown'],
      created_at: '2023-11-05T14:00:00Z',
      updated_at: '2025-08-12T09:15:00Z'
    },
    {
      id: '5',
      name: 'Global Coffee Logistics',
      email: 'logistics@globalcoffee.com',
      phone: '+1 555 123 4567',
      website: 'https://globalcoffeelogistics.com',
      company_type: 'service_provider',
      company_subtype: 'Logistics & Shipping',
      legacy_id: 'GCL-001',
      trip_count: 0,
      total_cost_usd: 0,
      last_visit_date: null,
      primary_contact_name: 'John Smith',
      primary_contact_email: 'john@globalcoffee.com',
      primary_contact_phone: '+1 555 123 4567',
      notes: 'Handles shipping and logistics for coffee imports',
      is_active: true,
      tags: ['logistics', 'shipping', 'import'],
      industry_certifications: ['ISO 9001', 'C-TPAT'],
      created_at: '2024-05-20T10:30:00Z',
      updated_at: '2024-05-20T10:30:00Z'
    },
    {
      id: '6',
      name: 'Ethiopian Coffee Union',
      email: 'info@ecu.et',
      phone: '+251 11 551 4316',
      website: 'https://ecu.et',
      company_type: 'exporter_coop',
      company_subtype: 'National Union',
      legacy_id: 'ETH-2018-U01',
      trip_count: 4,
      total_cost_usd: 28000,
      last_visit_date: '2025-06-15',
      primary_contact_name: 'Tadesse Meskela',
      primary_contact_email: 'tadesse@ecu.et',
      primary_contact_phone: '+251 911 123 456',
      notes: 'National union representing Ethiopian coffee farmers',
      is_active: true,
      tags: ['ethiopia', 'union', 'origin'],
      industry_certifications: ['Fair Trade', 'Organic'],
      created_at: '2023-08-12T07:45:00Z',
      updated_at: '2025-06-16T13:20:00Z'
    }
  ]
}