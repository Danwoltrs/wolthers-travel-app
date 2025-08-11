import React, { useState } from 'react'
import { TripFormData } from './TripCreationModal'
import { Plus, Calendar, Clock, MapPin, Upload, Wand2, Loader2, FileText, AlertCircle } from 'lucide-react'
import type { Company, Activity, ItineraryDay } from '@/types'

interface ItineraryBuilderStepProps {
  formData: TripFormData
  updateFormData: (data: Partial<TripFormData>) => void
}

interface AIProcessingResult {
  success: boolean
  processedItinerary: Array<{
    date: string
    activities: Array<{
      time: string
      type: 'meeting' | 'visit' | 'travel' | 'meal' | 'hotel'
      title: string
      description?: string
      company?: string
      location?: string
      duration?: number
      suggestions?: {
        original: string
        improved: string
        reason: string
      }
    }>
    notes?: string
  }>
  recommendations?: string[]
}

export default function EnhancedItineraryBuilderStep({ formData, updateFormData }: ItineraryBuilderStepProps) {
  const [rawItinerary, setRawItinerary] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState<AIProcessingResult | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [inputMethod, setInputMethod] = useState<'manual' | 'text' | 'excel'>('text')

  // Calculate days between start and end date
  const getDaysArray = () => {
    if (!formData.startDate || !formData.endDate) return []
    
    const days = []
    const currentDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const days = getDaysArray()

  const handleAIProcessing = async () => {
    if (!rawItinerary.trim()) {
      alert('Please enter some itinerary information first.')
      return
    }

    setIsProcessing(true)
    setAISuggestions(null)

    try {
      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripTitle: formData.title,
          companies: formData.companies,
          startDate: formData.startDate?.toISOString().split('T')[0],
          endDate: formData.endDate?.toISOString().split('T')[0],
          rawItinerary: rawItinerary,
          preferences: {
            additionalNotes: formData.description
          }
        })
      })

      if (!response.ok) {
        throw new Error('AI processing failed')
      }

      const result: AIProcessingResult = await response.json()
      setAISuggestions(result)
      setShowAISuggestions(true)

    } catch (error) {
      console.error('AI processing error:', error)
      alert('AI processing failed. Please try again or continue manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyAISuggestions = () => {
    if (!aiSuggestions?.processedItinerary) return

    // Convert AI suggestions to ItineraryDay format
    const processedDays: ItineraryDay[] = aiSuggestions.processedItinerary.map(day => ({
      id: `day-${day.date}`,
      tripId: '', // Will be set when trip is created
      date: new Date(day.date),
      notes: day.notes || '',
      activities: day.activities.map((activity, index) => ({
        id: `activity-${day.date}-${index}`,
        itineraryDayId: `day-${day.date}`,
        time: activity.time,
        type: activity.type,
        title: activity.title,
        description: activity.description || '',
        companyId: getCompanyIdByName(activity.company),
        locationId: undefined, // Will be resolved later
        durationMinutes: activity.duration || 60,
        attendees: [],
        status: 'planned',
        confirmationStatus: 'pending',
        notes: activity.suggestions ? 
          `AI Improved: ${activity.suggestions.reason}` : '',
        createdAt: new Date()
      })),
      createdAt: new Date()
    }))

    updateFormData({ itineraryDays: processedDays })
    setShowAISuggestions(false)
    setRawItinerary('')
  }

  const getCompanyIdByName = (companyName?: string): string | undefined => {
    if (!companyName) return undefined
    const company = formData.companies.find(c => 
      c.name.toLowerCase().includes(companyName.toLowerCase()) ||
      c.fantasyName?.toLowerCase().includes(companyName.toLowerCase())
    )
    return company?.id
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setRawItinerary(text)
      setInputMethod('excel')
    }
    
    if (file.type.includes('text') || file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      alert('Please upload a text file or CSV file. Excel files require conversion to CSV first.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-golden-400 mb-4">
          Build Your Itinerary with AI
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Create your trip itinerary manually or let our AI process and optimize your existing schedule.
        </p>
      </div>

      {/* Input Method Selection */}
      <div className="border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4 bg-white dark:bg-[#1a1a1a]">
        <h3 className="font-medium text-gray-900 dark:text-golden-400 mb-3">
          Choose Input Method
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <button
            onClick={() => setInputMethod('text')}
            className={`p-3 rounded-lg border text-left transition-all ${
              inputMethod === 'text'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-pearl-200 dark:border-[#2a2a2a] hover:border-emerald-300 dark:hover:border-emerald-600'
            }`}
          >
            <FileText className="w-5 h-5 mb-2 text-emerald-600 dark:text-emerald-400" />
            <div className="font-medium text-gray-900 dark:text-golden-400">
              Text Input
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Type or paste your itinerary
            </div>
          </button>

          <button
            onClick={() => setInputMethod('excel')}
            className={`p-3 rounded-lg border text-left transition-all ${
              inputMethod === 'excel'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-pearl-200 dark:border-[#2a2a2a] hover:border-emerald-300 dark:hover:border-emerald-600'
            }`}
          >
            <Upload className="w-5 h-5 mb-2 text-emerald-600 dark:text-emerald-400" />
            <div className="font-medium text-gray-900 dark:text-golden-400">
              File Upload
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Upload CSV or text file
            </div>
          </button>

          <button
            onClick={() => setInputMethod('manual')}
            className={`p-3 rounded-lg border text-left transition-all ${
              inputMethod === 'manual'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-pearl-200 dark:border-[#2a2a2a] hover:border-emerald-300 dark:hover:border-emerald-600'
            }`}
          >
            <Plus className="w-5 h-5 mb-2 text-emerald-600 dark:text-emerald-400" />
            <div className="font-medium text-gray-900 dark:text-golden-400">
              Manual Entry
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Add activities step by step
            </div>
          </button>
        </div>

        {/* Text Input Method */}
        {(inputMethod === 'text' || inputMethod === 'excel') && (
          <div className="space-y-4">
            {inputMethod === 'excel' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File
                </label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-emerald-50 dark:file:bg-emerald-900/50 file:text-emerald-700 dark:file:text-emerald-300
                    hover:file:bg-emerald-100 dark:hover:file:bg-emerald-900/70"
                />
              </div>
            )}

            <div>
              <label htmlFor="rawItinerary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Itinerary Details
              </label>
              <textarea
                id="rawItinerary"
                rows={8}
                value={rawItinerary}
                onChange={(e) => setRawItinerary(e.target.value)}
                className="block w-full rounded-lg border border-pearl-200 dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 px-3 py-2"
                placeholder="Enter your itinerary details here...

Example:
Day 1:
9:00 AM - Meeting with Cooxupe headquarters
11:30 AM - Visit Cooxupe processing facility
1:00 PM - Lunch with management team
3:00 PM - Travel to hotel

Day 2:
8:00 AM - Breakfast meeting
10:00 AM - Tour of Monte Carmelo facility
..."
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleAIProcessing}
                disabled={!rawItinerary.trim() || isProcessing}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Process with AI</span>
                  </>
                )}
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                AI will improve grammar, formatting, timing, and location suggestions
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Suggestions Display */}
      {showAISuggestions && aiSuggestions && (
        <div className="border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-4 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-emerald-800 dark:text-emerald-300">
              AI Processing Results
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={applyAISuggestions}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm"
              >
                Apply Suggestions
              </button>
              <button
                onClick={() => setShowAISuggestions(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {aiSuggestions.processedItinerary.map((day, dayIndex) => (
              <div key={dayIndex} className="border border-emerald-200 dark:border-emerald-800/50 rounded-lg p-3 bg-white dark:bg-[#1a1a1a]">
                <h4 className="font-medium text-gray-900 dark:text-golden-400 mb-2">
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h4>
                
                <div className="space-y-2">
                  {day.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="flex items-start space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">
                        {activity.time}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </div>
                        {activity.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {activity.description}
                          </div>
                        )}
                        {activity.location && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {activity.location}
                          </div>
                        )}
                        {activity.suggestions && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Improved: {activity.suggestions.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {day.notes && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {day.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {aiSuggestions.recommendations && aiSuggestions.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                Recommendations
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                {aiSuggestions.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Manual/Current Itinerary Display */}
      {inputMethod === 'manual' && (
        <div className="space-y-6">
          {days.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Please select trip dates in the previous step to build your itinerary.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.itineraryDays.length > 0 ? (
                formData.itineraryDays.map((day, index) => (
                  <div key={index} className="border border-pearl-200 dark:border-[#2a2a2a] rounded-lg p-4 bg-white dark:bg-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-golden-400">
                        {day.date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {day.activities.length > 0 ? (
                      <div className="space-y-3">
                        {day.activities.map((activity, activityIndex) => (
                          <div key={activityIndex} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Clock className="w-4 h-4 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {activity.time}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {activity.title}
                                </span>
                              </div>
                              {activity.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {activity.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Clock className="w-8 h-8 mx-auto mb-2" />
                        <p>No activities added for this day</p>
                        <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm mt-2">
                          Add your first activity
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No itinerary created yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Use AI processing above or add activities manually
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}