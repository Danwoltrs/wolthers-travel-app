'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Building2, Globe, Users, MapPin, TrendingUp, Calendar, Download } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import CompanyCard from '@/components/companies/CompanyCard'
import CompanyDetailModal from '@/components/companies/CompanyDetailModal'
import CompanyFilters from '@/components/companies/CompanyFilters'
import type { Company, CompanyFilters as CompanyFiltersType } from '@/types/company'

export default function CompaniesPage() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<CompanyFiltersType>({
    search: '',
    is_active: true,
    sort_by: 'name',
    sort_order: 'asc'
  })

  const { companies, loading, error, refetch } = useCompanies(filters)

  // Update search filter with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery }))
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  const handleCreateCompany = () => {
    setSelectedCompany(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCompany(null)
    refetch()
  }

  const handleExportData = () => {
    // TODO: Implement export functionality
    console.log('Exporting company data...')
  }

  const getCompanyTypeLabel = (type: string) => {
    switch (type) {
      case 'roaster_dealer':
        return 'Roaster/Dealer'
      case 'exporter_coop':
        return 'Exporter/Coop'
      case 'service_provider':
        return 'Service Provider'
      default:
        return type
    }
  }

  const getCompanyTypeColor = (type: string) => {
    switch (type) {
      case 'roaster_dealer':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'exporter_coop':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'service_provider':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE4D3] dark:from-[#1a1a1a] dark:to-[#0f0f0f]">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 dark:from-[#09261d] dark:to-[#052016] shadow-lg">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Title and Actions Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                Company Management
              </h1>
              <p className="text-emerald-100 mt-1">
                Manage your business relationships and partnerships
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleCreateCompany}
                className="px-4 py-2 bg-golden-400 hover:bg-golden-500 text-gray-900 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Company
              </button>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search companies by name, location, or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  className="w-full pr-4 py-3 border border-white/20 rounded-lg !bg-[#F5F1E8] dark:!bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-golden-400 focus:border-golden-400 transition-colors"
                />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {Object.keys(filters).filter(k => k !== 'search' && k !== 'sort_by' && k !== 'sort_order' && filters[k as keyof CompanyFiltersType]).length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-golden-400 text-gray-900 rounded-full text-xs font-medium">
                  {Object.keys(filters).filter(k => k !== 'search' && k !== 'sort_by' && k !== 'sort_order' && filters[k as keyof CompanyFiltersType]).length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Total Companies</p>
                  <p className="text-2xl font-bold text-white">{companies?.length || 0}</p>
                </div>
                <Building2 className="w-8 h-8 text-emerald-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Active Partners</p>
                  <p className="text-2xl font-bold text-white">
                    {companies?.filter(c => c.trip_count > 0).length || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-emerald-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Countries</p>
                  <p className="text-2xl font-bold text-white">
                    {/* TODO: Calculate unique countries */}
                    12
                  </p>
                </div>
                <Globe className="w-8 h-8 text-emerald-300" />
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">This Year's Spend</p>
                  <p className="text-2xl font-bold text-white">
                    ${companies?.reduce((sum, c) => sum + (c.total_cost_usd || 0), 0).toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-300" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {isFiltersOpen && (
        <div className="bg-white dark:bg-[#1a1a1a] border-b border-pearl-200 dark:border-[#2a2a2a] shadow-md">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <CompanyFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClose={() => setIsFiltersOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">Error loading companies: {error}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : companies && companies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {companies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onClick={() => handleCompanyClick(company)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a]">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No companies found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery ? 'Try adjusting your search or filters' : 'Get started by adding your first company'}
            </p>
            <button
              onClick={handleCreateCompany}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Company
            </button>
          </div>
        )}
      </div>

      {/* Company Detail Modal */}
      {isModalOpen && (
        <CompanyDetailModal
          company={selectedCompany}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}