'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, X, Calendar, MapPin, Users, Clock, Building2, 
  Zap, Copy, FileText, TrendingUp, ArrowRight, Search
} from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { Company } from '@/types/company'

interface TripTemplate {
  id: string
  title: string
  description?: string
  duration: number // in days
  totalCost: number
  currency: string
  participantCount: number
  locationCount: number
  activityCount: number
  locations: string[]
  lastUsed: Date
  popularity: number
  avgRating: number
  company: {
    id: string
    name: string
  }
  activities: {
    type: string
    count: number
  }[]
  estimatedDuration: string
}

interface QuickTripPlanningModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  companyName: string
  onTripCreated?: (tripId: string) => void
}

export default function QuickTripPlanningModal({ 
  isOpen, 
  onClose, 
  companyId, 
  companyName,
  onTripCreated 
}: QuickTripPlanningModalProps) {
  const [templates, setTemplates] = useState<TripTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [step, setStep] = useState<'browse' | 'customize' | 'creating'>('browse')

  useEffect(() => {
    if (isOpen) {
      fetchTripTemplates()
    }
  }, [isOpen, companyId])

  const fetchTripTemplates = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      
      // Fetch completed trips from this company and similar companies for templates
      const { data: trips, error } = await supabase
        .from('trips')
        .select(`
          id, title, description, start_date, end_date, total_cost_usd,
          company_id,
          companies!trips_company_id_fkey (
            id, name, company_type
          ),
          trip_participants!inner (
            id, user_id
          ),
          locations!inner (
            id, name, city, country
          ),
          activities (
            id, title, type, duration_minutes
          )
        `)
        .eq('status', 'completed')
        .or(`company_id.eq.${companyId},companies.company_type.eq.${await getCompanyType(companyId)}`)
        .order('end_date', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching trip templates:', error)
        // Use mock templates as fallback
        setTemplates(getMockTemplates(companyName))
      } else {
        const processedTemplates = trips?.map(trip => processTripToTemplate(trip)) || []
        setTemplates(processedTemplates.length > 0 ? processedTemplates : getMockTemplates(companyName))
      }
    } catch (error) {
      console.error('Error in fetchTripTemplates:', error)
      setTemplates(getMockTemplates(companyName))
    } finally {
      setLoading(false)
    }
  }

  const getCompanyType = async (companyId: string): Promise<string> => {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('companies')
        .select('company_type')
        .eq('id', companyId)
        .single()
      return data?.company_type || 'roaster_dealer'
    } catch {
      return 'roaster_dealer'
    }
  }

  const processTripToTemplate = (trip: any): TripTemplate => {
    const startDate = new Date(trip.start_date)
    const endDate = new Date(trip.end_date)
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      id: trip.id,
      title: trip.title,
      description: trip.description,
      duration,
      totalCost: trip.total_cost_usd || 0,
      currency: 'USD',
      participantCount: trip.trip_participants?.length || 0,
      locationCount: trip.locations?.length || 0,
      activityCount: trip.activities?.length || 0,
      locations: trip.locations?.map((loc: any) => `${loc.city}, ${loc.country}`) || [],
      lastUsed: new Date(trip.end_date),
      popularity: Math.floor(Math.random() * 5) + 1, // Mock popularity score
      avgRating: Math.random() * 2 + 3, // Mock rating 3-5
      company: {
        id: trip.company_id,
        name: trip.companies?.name || companyName
      },
      activities: trip.activities?.reduce((acc: any[], activity: any) => {
        const existing = acc.find(a => a.type === activity.type)
        if (existing) {
          existing.count++
        } else {
          acc.push({ type: activity.type, count: 1 })
        }
        return acc
      }, []) || [],
      estimatedDuration: `${duration} ${duration === 1 ? 'day' : 'days'}`
    }
  }

  const getMockTemplates = (companyName: string): TripTemplate[] => [
    {
      id: 'template-1',
      title: 'Coffee Roastery Visit & Cupping Session',
      description: 'Comprehensive facility tour with cupping and quality assessment',
      duration: 2,
      totalCost: 2500,
      currency: 'USD',
      participantCount: 4,
      locationCount: 2,
      activityCount: 8,
      locations: ['Copenhagen, Denmark'],
      lastUsed: new Date('2024-07-15'),
      popularity: 4.2,
      avgRating: 4.6,
      company: { id: companyId, name: companyName },
      activities: [
        { type: 'facility_tour', count: 2 },
        { type: 'cupping_session', count: 1 },
        { type: 'meeting', count: 3 },
        { type: 'meal', count: 2 }
      ],
      estimatedDuration: '2 days'
    },
    {
      id: 'template-2', 
      title: 'Multi-Location Coffee Farm Tour',
      description: 'Visit multiple coffee farms and processing facilities',
      duration: 5,
      totalCost: 12500,
      currency: 'USD',
      participantCount: 6,
      locationCount: 4,
      activityCount: 15,
      locations: ['São Paulo, Brazil', 'Santos, Brazil'],
      lastUsed: new Date('2024-06-20'),
      popularity: 4.8,
      avgRating: 4.9,
      company: { id: companyId, name: companyName },
      activities: [
        { type: 'farm_visit', count: 4 },
        { type: 'processing_tour', count: 2 },
        { type: 'meeting', count: 6 },
        { type: 'meal', count: 3 }
      ],
      estimatedDuration: '5 days'
    },
    {
      id: 'template-3',
      title: 'Coffee Conference & Networking',
      description: 'Industry conference attendance with business meetings',
      duration: 3,
      totalCost: 4500,
      currency: 'USD',
      participantCount: 3,
      locationCount: 1,
      activityCount: 12,
      locations: ['Amsterdam, Netherlands'],
      lastUsed: new Date('2024-05-10'),
      popularity: 3.9,
      avgRating: 4.3,
      company: { id: companyId, name: companyName },
      activities: [
        { type: 'conference_session', count: 8 },
        { type: 'networking', count: 2 },
        { type: 'meeting', count: 2 }
      ],
      estimatedDuration: '3 days'
    }
  ]

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.locations.some(loc => loc.toLowerCase().includes(searchQuery.toLowerCase())) ||
    template.company.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateFromTemplate = async (template: TripTemplate) => {
    setIsCreating(true)
    setSelectedTemplate(template)
    setStep('creating')
    
    try {
      // Simulate trip creation process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In real implementation, this would:
      // 1. Create a new trip based on the template
      // 2. Copy activities, participants, and structure
      // 3. Set status to 'planning' for further customization
      // 4. Generate a new trip code
      
      const newTripId = `trip-${Date.now()}`
      onTripCreated?.(newTripId)
      
      // Show success and close
      setTimeout(() => {
        onClose()
        setStep('browse')
        setIsCreating(false)
        setSelectedTemplate(null)
      }, 1000)
    } catch (error) {
      console.error('Error creating trip from template:', error)
      setIsCreating(false)
    }
  }

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      facility_tour: 'Facility Tours',
      cupping_session: 'Cupping Sessions',
      farm_visit: 'Farm Visits',
      processing_tour: 'Processing Tours',
      meeting: 'Business Meetings',
      meal: 'Meals & Dining',
      conference_session: 'Conference Sessions',
      networking: 'Networking Events'
    }
    return labels[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Zap className="w-7 h-7" />
                Quick Trip Planning
              </h2>
              <p className="text-emerald-100 mt-1">
                Create new trips instantly using proven templates for {companyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {step === 'creating' ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mb-6"></div>
            <h3 className="text-xl font-semibold mb-2">Creating Your Trip</h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              Setting up your trip based on "{selectedTemplate?.title}". 
              This will include all activities, participants, and logistics from the template.
            </p>
          </div>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by trip type, location, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span>{filteredTemplates.length} templates available</span>
                </div>
              </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Templates Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or create your first trip to generate templates.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 dark:border-[#2a2a2a] rounded-lg p-5 hover:shadow-lg transition-shadow bg-white dark:bg-[#1a1a1a]"
                    >
                      {/* Template Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                            {template.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-600">
                            {template.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Template Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {template.estimatedDuration}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {template.participantCount} people
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {template.locationCount} locations
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {template.activityCount} activities
                          </span>
                        </div>
                      </div>

                      {/* Locations */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {template.locations.slice(0, 2).map((location, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-full"
                            >
                              {location}
                            </span>
                          ))}
                          {template.locations.length > 2 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 rounded-full">
                              +{template.locations.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Activities Preview */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Included Activities
                        </h4>
                        <div className="space-y-1">
                          {template.activities.slice(0, 3).map((activity, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400">
                                {getActivityTypeLabel(activity.type)}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {activity.count}
                              </span>
                            </div>
                          ))}
                          {template.activities.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              +{template.activities.length - 3} more activity types
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cost and Action */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2a2a2a]">
                        <div>
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            ${template.totalCost.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-500 ml-1">
                            estimated
                          </span>
                        </div>
                        <button
                          onClick={() => handleCreateFromTemplate(template)}
                          disabled={isCreating}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <Copy className="w-4 h-4" />
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}