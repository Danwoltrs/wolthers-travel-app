'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Calendar, FileText, BarChart3, MapPin, Phone, Mail } from 'lucide-react'
import useSWR from 'swr'
import CompanyTravelHeatmap from './CompanyTravelHeatmap'
import CompanyContactsManager from './CompanyContactsManager'
import CompanyDocumentsView from './CompanyDocumentsView'

interface Company {
  id: string
  name: string
  fantasy_name?: string
  category: string
  email?: string
  phone?: string
  website?: string
  locations?: any[]
}

interface CompanyDashboardProps {
  company: Company
  onBack: () => void
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json())

export default function CompanyDashboard({ company, onBack }: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'contacts' | 'documents'>('overview')

  // Fetch company-specific data
  const { data: companyDetails } = useSWR(`/api/companies/${company.id}`, fetcher)
  const { data: companyTrips } = useSWR(`/api/companies/${company.id}/trips`, fetcher)
  const { data: companyContacts } = useSWR(`/api/companies/${company.id}/staff`, fetcher)
  const { data: companyDocuments } = useSWR(`/api/companies/${company.id}/documents`, fetcher)

  const headquarters = companyDetails?.locations?.find((loc: any) => loc.is_primary_location || loc.is_headquarters)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trips', label: 'Travel Heatmap', icon: Calendar },
    { id: 'contacts', label: 'Team', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {company.fantasy_name || company.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {company.category.replace('_', ' ')} Dashboard
                </p>
              </div>
            </div>
            
            {/* Company Info */}
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              {headquarters?.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{headquarters.city}, {headquarters.country}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{company.email}</span>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{company.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <CompanyOverview company={companyDetails || company} />
        )}
        {activeTab === 'trips' && (
          <CompanyTravelHeatmap companyId={company.id} trips={companyTrips} />
        )}
        {activeTab === 'contacts' && (
          <CompanyContactsManager companyId={company.id} contacts={companyContacts} />
        )}
        {activeTab === 'documents' && (
          <CompanyDocumentsView companyId={company.id} documents={companyDocuments} />
        )}
      </div>
    </div>
  )
}

// Overview Tab Component
function CompanyOverview({ company }: { company: Company }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Company Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Company Name
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {company.name}
            </p>
          </div>
          {company.fantasy_name && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Fantasy Name
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {company.fantasy_name}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">
              {company.category?.replace('_', ' ')}
            </p>
          </div>
          {company.website && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Website
              </label>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {company.website}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



