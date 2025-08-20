'use client'

import { useState } from 'react'
import CompaniesSidebar from '@/components/companies/CompaniesSidebar'
import EnhancedHeatmap from '@/components/companies/charts/EnhancedHeatmap'
import TravelTrendsChart from '@/components/companies/charts/TravelTrendsChart'

export default function CompaniesPage() {
  const [selectedSection, setSelectedSection] = useState<'wolthers' | 'importers' | 'exporters'>('wolthers')

  const handleSectionChange = (section: 'wolthers' | 'importers' | 'exporters') => {
    setSelectedSection(section)
  }

  const sectionTitles = {
    wolthers: 'Wolthers & Associates',
    importers: 'Importers/Roasters',
    exporters: 'Exporters/Producers/Coops'
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-[#F5F1E8] to-[#EDE4D3] dark:from-[#1a1a1a] dark:to-[#0f0f0f]">
      {/* Sidebar */}
      <CompaniesSidebar 
        selectedSection={selectedSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Breadcrumb Navigation */}
        <div className="sticky top-0 z-10 bg-slate-800 dark:bg-slate-900 border-b border-slate-700 dark:border-slate-800 px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm text-amber-300 dark:text-amber-400">
            <span>Companies</span>
            <span>/</span>
            <span className="text-amber-100 dark:text-amber-200 font-medium">
              {sectionTitles[selectedSection]}
            </span>
          </nav>
        </div>

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Charts Container */}
          <div className="space-y-8">
            {/* Charts Side by Side on Large Screens */}
            <div className="flex flex-col xl:flex-row xl:gap-8 xl:items-start space-y-8 xl:space-y-0">
              {/* Left Column: Heatmap + Stats Cards */}
              <div className="space-y-6">
                {/* Enhanced Heatmap */}
                <EnhancedHeatmap 
                  selectedSection={selectedSection}
                />

                {/* Stats Cards under Heatmap */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Total Trips Card */}
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-2">
                      Total Trips (2025)
                    </h3>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                      {selectedSection === 'wolthers' ? '127' : 
                       selectedSection === 'importers' ? '89' : '56'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +{selectedSection === 'wolthers' ? '23' : 
                         selectedSection === 'importers' ? '15' : '8'}% from last year
                    </p>
                  </div>

                  {/* Total Trip Costs Card */}
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-6 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400 mb-2">
                      Total Trip Costs (2025)
                    </h3>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      ${selectedSection === 'wolthers' ? '284,500' : 
                         selectedSection === 'importers' ? '156,300' : '98,750'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +{selectedSection === 'wolthers' ? '18' : 
                         selectedSection === 'importers' ? '12' : '9'}% from last year
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Travel Trends Chart */}
              <div className="xl:flex-1 xl:min-w-0">
                <TravelTrendsChart 
                  selectedSection={selectedSection}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    </div>
  )
}