'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Building, MapPin, Phone, Mail, Loader2 } from 'lucide-react'
import { LegacyCompanyResult } from '@/types/company'

interface LegacyCompanySearchProps {
  onCompanySelect: (company: LegacyCompanyResult) => void
  onCreateNew: (searchTerm: string) => void
  placeholder?: string
  initialSearch?: string
}

export default function LegacyCompanySearch({
  onCompanySelect,
  onCreateNew,
  placeholder = "Search company in database...",
  initialSearch = ''
}: LegacyCompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [results, setResults] = useState<LegacyCompanyResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.trim().length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/companies/search-legacy?q=${encodeURIComponent(searchTerm)}&limit=15`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          setShowResults(true)
          setSelectedIndex(-1)
        } else {
          console.error('Search failed:', response.statusText)
          setResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleCompanySelect(results[selectedIndex])
        } else if (results.length === 0 && searchTerm.trim()) {
          onCreateNew(searchTerm.trim())
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle company selection
  const handleCompanySelect = (company: LegacyCompanyResult) => {
    setSearchTerm(company.displayName)
    setShowResults(false)
    setSelectedIndex(-1)
    onCompanySelect(company)
  }

  // Handle create new company
  const handleCreateNew = () => {
    setShowResults(false)
    onCreateNew(searchTerm.trim())
  }

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          style={{ paddingLeft: '36px' }}
          className="w-full pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          placeholder={placeholder}
        />
      </div>

      {/* Dropdown Results */}
      {showResults && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <>
              {results.map((company, index) => (
                <div
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    index === selectedIndex 
                      ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {company.displayName}
                      </div>
                      {company.location && (
                        <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3 h-3 mr-1" />
                          {company.location}
                        </div>
                      )}
                      {(company.group1 || company.group2) && (
                        <div className="flex items-center mt-1 text-xs text-gray-400 dark:text-gray-500">
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mr-2">
                            {company.group1 || company.group2}
                          </span>
                          {company.businessType && (
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                              {company.businessType}
                            </span>
                          )}
                        </div>
                      )}
                      {company.contacts.email && (
                        <div className="flex items-center mt-1 text-xs text-gray-400 dark:text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          {company.contacts.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Create New Option */}
              {searchTerm.trim() && (
                <div
                  onClick={handleCreateNew}
                  className={`p-4 cursor-pointer border-t-2 border-gray-200 dark:border-gray-600 ${
                    selectedIndex === results.length 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
                    <Building className="w-5 h-5" />
                    <div>
                      <div className="font-medium">Create new company</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        "{searchTerm}" not found. Create new company?
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : !isSearching && searchTerm.trim().length >= 2 ? (
            /* No Results - Create New */
            <div
              onClick={handleCreateNew}
              className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
                <Building className="w-5 h-5" />
                <div>
                  <div className="font-medium">Create new company</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No results found for "{searchTerm}". Click to create a new company.
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Search Instructions */}
          {searchTerm.trim().length < 2 && !isSearching && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">
                Type at least 2 characters to search companies
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}