'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, MapPin, Phone, Mail, Building, Globe, Users, TreePine } from 'lucide-react'
import useSWR from 'swr'
import AddCompanyModal from './AddCompanyModal'
import CompanyDetailModal from './CompanyDetailModal'

interface Company {
  id: string
  name: string
  fantasy_name?: string
  category: string
  client_type?: string
  company_type: string
  staff_count: number
  annual_trip_cost?: number
  locations?: CompanyLocation[]
}

interface CompanyLocation {
  id: string
  name: string
  is_headquarters: boolean
  address_line1?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  contact_person?: string
}

interface SuppliersPanelProps {
  className?: string
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function SuppliersPanel({ className = '' }: SuppliersPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch suppliers data
  const { data, error, isLoading } = useSWR('/api/companies/suppliers', fetcher)

  const suppliers = data?.companies || []
  const filteredSuppliers = suppliers.filter((supplier: Company) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.fantasy_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <TreePine className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-red-500 dark:text-red-400">Error loading suppliers</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {error.message || 'Failed to fetch supplier companies'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 lg:p-6 space-y-6 ${className}`}>
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-golden-400">
            Suppliers
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search suppliers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '40px' }}
          className="w-full pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Companies Grid */}
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <TreePine className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No suppliers match your search' : 'No supplier companies found'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {searchTerm ? 'Try a different search term' : 'Add companies to see them here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier: Company) => (
            <CompanyCard 
              key={supplier.id} 
              company={supplier}
              onClick={() => setSelectedCompany(supplier)}
            />
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        companyType="supplier"
      />

      {/* Company Detail Modal */}
      <CompanyDetailModal
        company={selectedCompany}
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
      />
    </div>
  )
}

interface CompanyCardProps {
  company: Company
  onClick: () => void
}

function CompanyCard({ company, onClick }: CompanyCardProps) {
  const headquarters = company.locations?.find(loc => loc.is_headquarters)
  
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer group"
    >
      {/* Company Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {company.fantasy_name || company.name}
          </h3>
          {company.fantasy_name && company.fantasy_name !== company.name && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {company.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
          <TreePine className="w-3 h-3" />
          Supplier
        </div>
      </div>

      {/* Location Info */}
      {headquarters && (
        <div className="space-y-2 mb-4">
          {headquarters.city && headquarters.country && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{headquarters.city}, {headquarters.country}</span>
            </div>
          )}
          {headquarters.contact_person && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{headquarters.contact_person}</span>
            </div>
          )}
        </div>
      )}

      {/* Company Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{company.locations?.length || 0} locations</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{company.staff_count || 0} staff</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            View Details
          </div>
        </div>
      </div>
    </div>
  )
}