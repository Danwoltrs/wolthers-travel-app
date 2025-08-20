'use client'

import { Building2, Mail, Phone, Globe, Tag, Shield, User } from 'lucide-react'
import type { Company, CompanyType } from '@/types/company'

interface CompanyOverviewTabProps {
  company: Company
  editMode: boolean
  onUpdate: (updates: Partial<Company>) => void
}

export default function CompanyOverviewTab({ company, editMode, onUpdate }: CompanyOverviewTabProps) {
  const companyTypes: { value: CompanyType; label: string }[] = [
    { value: 'roaster_dealer', label: 'Roaster/Dealer' },
    { value: 'exporter_coop', label: 'Exporter/Coop' },
    { value: 'service_provider', label: 'Service Provider' }
  ]

  const handleTagAdd = (tag: string) => {
    if (tag && !company.tags.includes(tag)) {
      onUpdate({ tags: [...company.tags, tag] })
    }
  }

  const handleTagRemove = (tag: string) => {
    onUpdate({ tags: company.tags.filter(t => t !== tag) })
  }

  const handleCertificationAdd = (cert: string) => {
    if (cert && !company.industry_certifications.includes(cert)) {
      onUpdate({ industry_certifications: [...company.industry_certifications, cert] })
    }
  }

  const handleCertificationRemove = (cert: string) => {
    onUpdate({ industry_certifications: company.industry_certifications.filter(c => c !== cert) })
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Name *
            </label>
            {editMode ? (
              <input
                type="text"
                value={company.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
                required
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Type *
            </label>
            {editMode ? (
              <select
                value={company.company_type}
                onChange={(e) => onUpdate({ company_type: e.target.value as CompanyType })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              >
                {companyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {companyTypes.find(t => t.value === company.company_type)?.label}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subtype/Category
            </label>
            {editMode ? (
              <input
                type="text"
                value={company.company_subtype || ''}
                onChange={(e) => onUpdate({ company_subtype: e.target.value })}
                placeholder="e.g., Specialty Roaster, Large Exporter"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.company_subtype || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            {editMode ? (
              <select
                value={company.is_active ? 'active' : 'inactive'}
                onChange={(e) => onUpdate({ is_active: e.target.value === 'active' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                company.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {company.is_active ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Contact Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            {editMode ? (
              <input
                type="email"
                value={company.email || ''}
                onChange={(e) => onUpdate({ email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.email || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone
            </label>
            {editMode ? (
              <input
                type="tel"
                value={company.phone || ''}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.phone || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            {editMode ? (
              <input
                type="url"
                value={company.website || ''}
                onChange={(e) => onUpdate({ website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  '-'
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Legacy ID
            </label>
            {editMode ? (
              <input
                type="text"
                value={company.legacy_id || ''}
                onChange={(e) => onUpdate({ legacy_id: e.target.value })}
                placeholder="ID from old system"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.legacy_id || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Primary Contact
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            {editMode ? (
              <input
                type="text"
                value={company.primary_contact_name || ''}
                onChange={(e) => onUpdate({ primary_contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.primary_contact_name || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            {editMode ? (
              <input
                type="email"
                value={company.primary_contact_email || ''}
                onChange={(e) => onUpdate({ primary_contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.primary_contact_email || '-'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            {editMode ? (
              <input
                type="tel"
                value={company.primary_contact_phone || ''}
                onChange={(e) => onUpdate({ primary_contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100">{company.primary_contact_phone || '-'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tags and Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tags */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {company.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              >
                {tag}
                {editMode && (
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="ml-2 text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          
          {editMode && (
            <input
              type="text"
              placeholder="Add a tag and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleTagAdd((e.target as HTMLInputElement).value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
            />
          )}
        </div>

        {/* Certifications */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Certifications
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {company.industry_certifications.map((cert, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              >
                {cert}
                {editMode && (
                  <button
                    onClick={() => handleCertificationRemove(cert)}
                    className="ml-2 text-green-600 hover:text-red-500"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          
          {editMode && (
            <input
              type="text"
              placeholder="Add a certification and press Enter"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCertificationAdd((e.target as HTMLInputElement).value)
                  ;(e.target as HTMLInputElement).value = ''
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
            />
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-4">
          Notes
        </h3>
        
        {editMode ? (
          <textarea
            value={company.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100"
            placeholder="Add any additional notes about this company..."
          />
        ) : (
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {company.notes || 'No notes added yet.'}
          </p>
        )}
      </div>
    </div>
  )
}