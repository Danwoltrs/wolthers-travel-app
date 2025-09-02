'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, MapPin, Phone, Mail, Building, Globe, Users, TreePine } from 'lucide-react'
import useSWR from 'swr'
import UnifiedCompanyCreationModal from './UnifiedCompanyCreationModal'
import CompanyDetailModal from './CompanyDetailModal'
import { useAuth } from '@/contexts/AuthContext'

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
  trips_count?: number
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
  onViewDashboard?: (company: Company) => void
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function SuppliersPanel({ className = '', onViewDashboard }: SuppliersPanelProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Check if user is Wolthers admin (can create companies and needs hard refresh)
  const isWolthersAdmin = user?.is_global_admin || user?.companyId === '840783f4-866d-4bdb-9b5d-5d0facf62db0'

  // Fetch suppliers data
  const { data, error, isLoading, mutate } = useSWR('/api/companies/suppliers', fetcher)

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
    <div className={`space-y-4 ${className}`}>
      {/* Header with Title and Company Count */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-golden-400">
          Suppliers - {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'company' : 'companies'}
        </h2>
      </div>

      {/* Search Bar and Add Button */}
      <div className="flex gap-4 justify-between items-center">
        <div className="relative flex-1">
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
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Supplier
        </button>
      </div>

      {/* Companies Table */}
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
        <div className="bg-white dark:bg-[#1a1a1a] border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden -mx-6">
          {/* Table Header */}
          <div className="bg-[#1E293B] dark:bg-[#1E293B] px-8 py-4 border-b border-gray-700 dark:border-gray-600">
            <div className="grid grid-cols-12 gap-6 text-sm font-medium text-amber-400 dark:text-amber-400">
              <div className="col-span-3">COMPANY NAME</div>
              <div className="col-span-4">HQ LOCATION</div>
              <div className="col-span-1">LOCATIONS</div>
              <div className="col-span-2 text-right">STAFF</div>
              <div className="col-span-2 text-right"># OF VISITS</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredSuppliers.map((supplier: Company, index: number) => (
              <CompanyTableRow 
                key={supplier.id} 
                company={supplier}
                index={index}
                onClick={() => onViewDashboard ? onViewDashboard(supplier) : setSelectedCompany(supplier)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unified Company Creation Modal */}
      <UnifiedCompanyCreationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        companyType="supplier"
        context="dashboard"
        onCompanyCreated={async (company) => {
          console.log('Supplier created from SuppliersPanel:', company)
          setShowAddModal(false)
          
          if (isWolthersAdmin) {
            // Hard refresh for Wolthers admins to ensure all data is updated
            window.location.reload()
          } else {
            // Smoothly refresh the suppliers data with loading state for other users
            await mutate()
          }
        }}
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

interface CompanyTableRowProps {
  company: Company
  index: number
  onClick: () => void
}

function CompanyTableRow({ company, index, onClick }: CompanyTableRowProps) {
  const headquarters = company.locations?.find(loc => loc.is_headquarters)
  
  return (
    <div
      onClick={onClick}
      className={`px-8 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
        index % 2 === 0 
          ? 'bg-[#FFFDF9] dark:bg-[#1a1a1a]' 
          : 'bg-[#FCFAF4] dark:bg-[#0f0f0f]'
      }`}
    >
      <div className="grid grid-cols-12 gap-6 items-center">
        {/* Company Name */}
        <div className="col-span-3">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {company.fantasy_name || company.name}
            </div>
            {company.fantasy_name && company.fantasy_name !== company.name && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {company.name}
              </div>
            )}
          </div>
        </div>
        
        {/* HQ Location */}
        <div className="col-span-4">
          {headquarters?.city && headquarters?.country ? (
            <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
              <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span>{headquarters.city}, {headquarters.country}</span>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
          )}
        </div>
        
        {/* Locations */}
        <div className="col-span-1">
          <span className="text-gray-700 dark:text-gray-300">
            {company.locations?.length || 0}
          </span>
        </div>
        
        {/* Staff */}
        <div className="col-span-2 text-right">
          <span className="text-gray-700 dark:text-gray-300">
            {company.staff_count || 0}
          </span>
        </div>
        
        {/* # of Visits */}
        <div className="col-span-2 text-right">
          <span className="text-gray-700 dark:text-gray-300">
            {company.trips_count || 0}
          </span>
        </div>
      </div>
    </div>
  )
}