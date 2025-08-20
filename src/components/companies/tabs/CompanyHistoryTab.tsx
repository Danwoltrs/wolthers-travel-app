'use client'

import { Clock, Calendar, Users, MapPin } from 'lucide-react'

interface CompanyHistoryTabProps {
  companyId: string
}

export default function CompanyHistoryTab({ companyId }: CompanyHistoryTabProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-golden-400">
        Visit History & Timeline
      </h3>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-pearl-200 dark:border-[#2a2a2a] p-8 text-center">
        <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Visit history coming soon. You'll see a timeline of all trips, meetings, and interactions with this company.
        </p>
      </div>
    </div>
  )
}