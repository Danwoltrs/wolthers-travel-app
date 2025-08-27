import { useState, useRef, useEffect } from 'react'
import { LegacyCompanyResult } from '@/types/company'

export interface UseLegacyCompanySearchOptions {
  onSelect?: (company: LegacyCompanyResult) => void
  debounceMs?: number
  minSearchLength?: number
  maxResults?: number
}

export function useLegacyCompanySearch(options: UseLegacyCompanySearchOptions = {}) {
  const {
    onSelect,
    debounceMs = 300,
    minSearchLength = 2,
    maxResults = 15
  } = options

  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<LegacyCompanyResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Reset when search term changes
  useEffect(() => {
    setError(null)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.trim().length < minSearchLength) {
      setResults([])
      setIsSearching(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(
          `/api/companies/search-legacy?q=${encodeURIComponent(searchTerm)}&limit=${maxResults}`,
          { credentials: 'include' }
        )
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const data = await response.json()
        setResults(data.results || [])
      } catch (err) {
        console.error('Legacy company search error:', err)
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, debounceMs)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, minSearchLength, maxResults, debounceMs])

  const selectCompany = (company: LegacyCompanyResult) => {
    setSearchTerm(company.displayName)
    setResults([])
    onSelect?.(company)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setResults([])
    setError(null)
  }

  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    error,
    selectCompany,
    clearSearch,
    hasResults: results.length > 0,
    canCreateNew: searchTerm.trim().length >= minSearchLength && results.length === 0 && !isSearching
  }
}