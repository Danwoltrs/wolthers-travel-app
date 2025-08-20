'use client'

import { FileText, Upload, Folder, Download } from 'lucide-react'

interface CompanyDocumentsTabProps {
  companyId: string
  editMode: boolean
}

export default function CompanyDocumentsTab({ companyId, editMode }: CompanyDocumentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
          Documents & Files
        </h3>
        {editMode && (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2">
              <Folder className="w-4 h-4" />
              New Folder
            </button>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Document management coming soon. You'll be able to organize files in folders by trip, year, and category with version control.
        </p>
      </div>
    </div>
  )
}