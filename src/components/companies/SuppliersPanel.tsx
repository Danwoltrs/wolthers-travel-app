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
    <div className={`space-y-6 ${className}`}>
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
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#1E293B] px-8 py-4 border-b border-gray-700">
            <div className="grid grid-cols-12 gap-6 text-sm font-medium text-amber-400">
              <div className="col-span-3">COMPANY NAME</div>
              <div className="col-span-1">TYPE</div>
              <div className="col-span-3">HQ LOCATION</div>
              <div className="col-span-1">LOCATIONS</div>
              <div className="col-span-1">STAFF</div>
              <div className="col-span-2">PERSON IN CHARGE</div>
              <div className="col-span-1"># OF TRIPS</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-800">
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
      className={`px-8 py-4 hover:bg-gray-900/50 transition-colors cursor-pointer ${
        index % 2 === 0 ? 'bg-[#FFFDF9]' : 'bg-[#FCFAF4]'
      }`}
    >
      <div className="grid grid-cols-12 gap-6 items-center">
        {/* Company Name */}
        <div className="col-span-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {(company.fantasy_name || company.name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {company.fantasy_name || company.name}
              </div>
              {company.fantasy_name && company.fantasy_name !== company.name && (
                <div className="text-sm text-gray-600">
                  {company.name}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Type */}
        <div className="col-span-1">
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
            <TreePine className="w-3 h-3" />
            Supplier
          </span>
        </div>
        
        {/* HQ Location */}
        <div className="col-span-3">
          {headquarters?.city && headquarters?.country ? (
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span>{headquarters.city}, {headquarters.country}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
        
        {/* Locations */}
        <div className="col-span-1">
          <span className="text-gray-700">
            {company.locations?.length || 0}
          </span>
        </div>
        
        {/* Staff */}
        <div className="col-span-1">
          <span className="text-gray-700">
            {company.staff_count || 0}
          </span>
        </div>
        
        {/* Person in Charge */}
        <div className="col-span-2">
          {headquarters?.contact_person ? (
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <Users className="w-3 h-3 text-gray-400" />
              <span>{headquarters.contact_person}</span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>
        
        {/* # of Trips */}
        <div className="col-span-1">
          <span className="text-gray-700">
            {company.trips_count || 0}
          </span>
        </div>
      </div>
    </div>
  )
}