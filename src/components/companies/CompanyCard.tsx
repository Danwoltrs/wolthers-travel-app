'use client'

import { Building2, MapPin, Users, Calendar, TrendingUp, FileText, Phone, Mail, Globe } from 'lucide-react'
import type { CompanyCardData } from '@/types/company'

interface CompanyCardProps {
  company: CompanyCardData
  onClick: () => void
}

export default function CompanyCard({ company, onClick }: CompanyCardProps) {
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
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
      case 'exporter_coop':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
      case 'service_provider':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  const formatLastVisit = (date: string | null) => {
    if (!date) return 'Never visited'
    const visitDate = new Date(date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - visitDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} days ago`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      const years = Math.floor(diffDays / 365)
      return `${years} year${years > 1 ? 's' : ''} ago`
    }
  }

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group h-[420px] flex flex-col"
    >
      {/* Header Section - Golden */}
      <div className="bg-gradient-to-r from-golden-400 to-amber-400 dark:from-[#09261d] dark:to-[#0a2e21] p-4 rounded-t-lg">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 line-clamp-1 group-hover:text-gray-800 dark:group-hover:text-golden-300 transition-colors">
              {company.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCompanyTypeColor(company.company_type)}`}>
                {getCompanyTypeLabel(company.company_type)}
              </span>
              {company.tags && company.tags.length > 0 && (
                <span className="text-xs text-gray-700 dark:text-golden-400/70">
                  +{company.tags.length} tag{company.tags.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <Building2 className="w-5 h-5 text-gray-700 dark:text-golden-400 opacity-60" />
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-4 text-xs text-gray-700 dark:text-golden-400/80">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatLastVisit(company.last_visit_date)}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {company.trip_count || 0} trips
          </span>
          {company.total_cost_usd > 0 && (
            <span className="flex items-center gap-1">
              {formatCurrency(company.total_cost_usd)}
            </span>
          )}
        </div>
      </div>

      {/* Location Section - Light Brown */}
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-[#1f1f1f] dark:to-[#1a1a1a] p-4 border-b border-pearl-200 dark:border-[#2a2a2a]">
        {company.primary_location ? (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {company.primary_location.location_name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {company.primary_location.city}, {company.primary_location.country}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">No location set</span>
          </div>
        )}
      </div>

      {/* Contact Section */}
      <div className="p-4 flex-1 space-y-3">
        {/* Primary Contact */}
        {company.primary_contact_name && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Primary Contact
            </p>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {company.primary_contact_name}
              </p>
              {company.primary_contact_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {company.primary_contact_email}
                  </p>
                </div>
              )}
              {company.primary_contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {company.primary_contact_phone}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Company Contact */}
        {(company.email || company.phone || company.website) && (
          <div className="space-y-1 pt-2 border-t border-pearl-200 dark:border-[#2a2a2a]">
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {company.email}
                </p>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {company.phone}
                </p>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Certifications */}
        {company.industry_certifications && company.industry_certifications.length > 0 && (
          <div className="pt-2 border-t border-pearl-200 dark:border-[#2a2a2a]">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Certifications
            </p>
            <div className="flex flex-wrap gap-1">
              {company.industry_certifications.slice(0, 3).map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                >
                  {cert}
                </span>
              ))}
              {company.industry_certifications.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{company.industry_certifications.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-[#0f0f0f] rounded-b-lg border-t border-pearl-200 dark:border-[#2a2a2a]">
        <div className="flex justify-between items-center text-xs">
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Users className="w-3 h-3" />
              {company.staff_count || 0} staff
            </span>
            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <FileText className="w-3 h-3" />
              {company.document_count || 0} docs
            </span>
          </div>
          {!company.is_active && (
            <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-medium">
              Inactive
            </span>
          )}
        </div>
      </div>
    </div>
  )
}