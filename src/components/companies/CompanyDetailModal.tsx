'use client'

import { useState, useEffect } from 'react'
import { X, Building2, MapPin, Users, BarChart3, FileText, Clock, Save, Edit3 } from 'lucide-react'
import type { Company, CompanyDetailView } from '@/types/company'
import CompanyOverviewTab from './tabs/CompanyOverviewTab'
import CompanyLocationsTab from './tabs/CompanyLocationsTab'
import CompanyStaffTab from './tabs/CompanyStaffTab'
import CompanyStatisticsTab from './tabs/CompanyStatisticsTab'
import CompanyDocumentsTab from './tabs/CompanyDocumentsTab'
import CompanyHistoryTab from './tabs/CompanyHistoryTab'

interface CompanyDetailModalProps {
  company: Company | null
  isOpen: boolean
  onClose: () => void
}

type TabType = 'overview' | 'locations' | 'staff' | 'statistics' | 'documents' | 'history'

export default function CompanyDetailModal({ company, isOpen, onClose }: CompanyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Company | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (company) {
      setFormData({ ...company })
    } else {
      // Initialize new company
      setFormData({
        id: '',
        name: '',
        email: '',
        phone: '',
        website: '',
        company_type: 'roaster_dealer',
        company_subtype: '',
        legacy_id: null,
        trip_count: 0,
        total_cost_usd: 0,
        last_visit_date: null,
        primary_contact_name: '',
        primary_contact_email: '',
        primary_contact_phone: '',
        notes: '',
        is_active: true,
        tags: [],
        industry_certifications: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      setEditMode(true) // New company starts in edit mode
    }
  }, [company])

  if (!isOpen || !formData) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `/api/companies/${formData.id}` : '/api/companies'
      
      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save company')
      }

      setHasChanges(false)
      setEditMode(false)
      onClose()
    } catch (error) {
      console.error('Error saving company:', error)
      alert('Failed to save company. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setFormData(company ? { ...company } : null)
        setHasChanges(false)
        setEditMode(false)
        if (!company) onClose() // Close if canceling new company
      }
    } else {
      setEditMode(false)
      if (!company) onClose()
    }
  }

  const updateFormData = (updates: Partial<Company>) => {
    if (formData) {
      setFormData({ ...formData, ...updates })
      setHasChanges(true)
    }
  }

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'History', icon: Clock }
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl border border-pearl-200 dark:border-[#2a2a2a] w-full max-w-[95vw] xl:max-w-[90vw] h-[95vh] flex flex-col">
          {/* Header */}
          <div className="bg-golden-400 dark:bg-[#09261d] px-6 py-4 border-b border-pearl-200 dark:border-[#0a2e21] rounded-t-lg">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-golden-400">
                  {formData.id ? formData.name : 'New Company'}
                </h2>
                <p className="text-sm text-gray-700 dark:text-golden-400/70 mt-1">
                  {formData.id ? 'Manage company details and relationships' : 'Create a new company profile'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {formData.id && (
                  <>
                    {editMode ? (
                      <>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 text-gray-700 dark:text-golden-400/80 hover:text-gray-900 dark:hover:text-golden-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving || !hasChanges}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-900 dark:text-golden-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-900 dark:text-golden-400 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </>
                )}
                {!formData.id && (
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.name}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-gray-900 dark:text-golden-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Creating...' : 'Create Company'}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-900 dark:text-golden-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-emerald-900 dark:bg-[#111111] border-b border-pearl-200 dark:border-[#2a2a2a]">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={!formData.id && tab.id !== 'overview'}
                    className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-emerald-800/80 text-gray-800 dark:text-golden-400 border-b-2 border-golden-400'
                        : 'text-white/70 dark:text-golden-400/70 hover:text-white dark:hover:text-golden-400 hover:bg-white/10 dark:hover:bg-emerald-800/50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <CompanyOverviewTab
                company={formData}
                editMode={editMode}
                onUpdate={updateFormData}
              />
            )}
            {activeTab === 'locations' && formData.id && (
              <CompanyLocationsTab
                companyId={formData.id}
                editMode={editMode}
              />
            )}
            {activeTab === 'staff' && formData.id && (
              <CompanyStaffTab
                companyId={formData.id}
                editMode={editMode}
              />
            )}
            {activeTab === 'statistics' && formData.id && (
              <CompanyStatisticsTab
                companyId={formData.id}
              />
            )}
            {activeTab === 'documents' && formData.id && (
              <CompanyDocumentsTab
                companyId={formData.id}
                editMode={editMode}
              />
            )}
            {activeTab === 'history' && formData.id && (
              <CompanyHistoryTab
                companyId={formData.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}