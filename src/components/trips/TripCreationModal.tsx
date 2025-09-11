import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, X, Plus, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useDialogs } from '@/hooks/use-modal'
import TripTypeSelection, { TripType } from './TripTypeSelection'
import { CoffeeEventCarousel } from '../trip/CoffeeEventCarousel'
import BasicInfoStep from './BasicInfoStep'
import CalendarItineraryStep from './CalendarItineraryStep'
import MeetingAgendaStep from './MeetingAgendaStep'
import HotelBookingStep from './HotelBookingStep'
import FlightBookingStep from './FlightBookingStep'
import dynamic from 'next/dynamic'

// Dynamically import Enhanced Driver & Vehicle Step to prevent SSR issues
const EnhancedDriverVehicleStep = dynamic(() => import('./EnhancedDriverVehicleStep'), {
  ssr: false,
  loading: () => (
    <div className="space-y-8">
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading drivers & vehicles...</div>
      </div>
    </div>
  )
})
import ReviewStep from './ReviewStep'
import SimpleTeamParticipantsStep from './SimpleTeamParticipantsStep'
import CompanySelectionStep from './CompanySelectionStep'
import StartingPointSelectionStep from './StartingPointSelectionStep'
import EnhancedCalendarScheduleStep from './EnhancedCalendarScheduleStep'
import PersonalMessageModal from './PersonalMessageModal'
import type { 
  Company, 
  User, 
  Vehicle, 
  Activity, 
  ItineraryDay, 
  CalendarEvent, 
  CompanyWithLocations 
} from '@/types'

// Import ParticipantWithDates from TeamVehicleStep
import type { ParticipantWithDates } from './TeamVehicleStep'

// Define additional data types for hotels, flights, and meetings
interface Hotel {
  id: string
  name: string
  address: string
  checkInDate: string
  checkOutDate: string
  nights: number
  cost?: number
  notes?: string
}

interface Flight {
  id: string
  airline: string
  flightNumber: string
  departure: {
    airport: string
    city: string
    date: string
    time: string
  }
  arrival: {
    airport: string
    city: string
    date: string
    time: string
  }
  cost?: number
  bookingReference?: string
  notes?: string
}

interface Meeting {
  id: string
  title: string
  type: 'conference_session' | 'networking' | 'presentation' | 'meeting' | 'other'
  date: string
  startTime: string
  endTime: string
  location: string
  attendees: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  notes?: string
}

export interface TripFormData {
  // Step 0: Trip Type
  tripType: TripType | null
  
  // Step 1: Basic Information
  title: string
  description: string
  subject: string
  companies: Company[] // Buyer companies (traveling WITH you)
  participants: User[] // Wolthers staff
  startDate: Date | null
  endDate: Date | null
  accessCode?: string  // Generated and optional trip code
  // Estimated Budget is now hidden and optional, commented out
  // estimatedBudget?: number
  
  // Step 2: Team & Participants (new structure)
  buyerCompanies?: Company[] // Companies traveling with you
  participantsWithDates?: ParticipantWithDates[] // Staff with date ranges
  
  // Step 3: Host/Visits Selector (new structure)
  hostCompanies?: Company[] // Companies you will visit
  selectedRegions?: string[] // AI-selected regions
  participantCompanyMatrix?: { [hostId: string]: string[] } // Which buyers visit which hosts
  
  // Step 4: Starting Point Selection
  startingPoint?: string // Starting location for the trip
  flightInfo?: any // Flight information for GRU airport pickup
  nextDestination?: 'hotel' | 'office' // Destination after airport pickup
  destinationAddress?: string // Address for hotel/office destination after pickup
  pickupGroups?: any[] // Multi-company pickup groups with guest information
  
  // Step 4: Calendar & Itinerary
  itineraryDays: ItineraryDay[]
  activities?: Activity[] // Calendar activities with travel time
  generatedActivities?: Activity[] // AI-generated activities for temp trips
  
  // Legacy fields for compatibility
  wolthersStaff: User[]
  vehicles: Vehicle[]
  
  // Vehicle allocation data
  vehicleAssignments?: any[]  // Vehicle assignment data from vehicle allocation system
  
  // Conference-specific data
  meetings?: CalendarEvent[]
  hotels?: Hotel[]
  flights?: Flight[]
  
  // Enhanced data for cost tracking and company integration
  companyLocations?: CompanyWithLocations[]
}

interface SaveStatus {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  tripId?: string
  accessCode?: string
  continueUrl?: string
}

interface TripCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onTripCreated?: (trip: any) => void
  resumeData?: {
    tripId?: string
    formData: TripFormData
    currentStep: number
  }
}

const initialFormData: TripFormData = {
  tripType: null,
  title: '',
  description: '',
  subject: '',
  companies: [],
  participants: [],
  startDate: null,
  endDate: null,
  // Estimated Budget is hidden, commented out
  // estimatedBudget: undefined,
  itineraryDays: [],
  wolthersStaff: [],
  vehicles: [],
  vehicleAssignments: [],
  meetings: [],
  hotels: [],
  flights: []
}

// Dynamic steps based on trip type
const getStepsForTripType = (tripType: TripType | null) => {
  if (tripType === 'convention') {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' },
      { id: 2, name: 'Event Search', description: 'Find your convention or event' },
      { id: 3, name: 'Basic Information', description: 'Trip details and attendees' },
      { id: 4, name: 'Meetings & Agenda', description: 'Plan conference sessions and meetings' },
      { id: 5, name: 'Hotels & Accommodation', description: 'Book hotels and lodging' },
      { id: 6, name: 'Flights & Travel', description: 'Arrange international flights and travel' },
      { id: 7, name: 'Drivers & Vehicles', description: 'Assign staff, drivers and fleet vehicles' },
      { id: 8, name: 'Review & Create', description: 'Review and finalize trip' }
    ]
  } else if (tripType === 'in_land') {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' },
      { id: 2, name: 'Basic Information', description: 'Trip details and dates' },
      { id: 3, name: 'Team & Participants', description: 'Select team members and companies' },
      { id: 4, name: 'Drivers & Vehicles', description: 'Assign staff as drivers and fleet vehicles' },
      { id: 5, name: 'Host/Visits Selector', description: 'Select host companies for the trip' },
      { id: 6, name: 'Starting Point', description: 'Choose where the trip begins' },
      { id: 7, name: 'Calendar Schedule', description: 'Create itinerary with travel time optimization' },
      { id: 8, name: 'Review & Create', description: 'Review and finalize trip' }
    ]
  } else {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' }
    ]
  }
}

export default function TripCreationModal({ isOpen, onClose, onTripCreated, resumeData }: TripCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(resumeData?.currentStep || 1)
  const [formData, setFormData] = useState<TripFormData>(resumeData?.formData || initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
    tripId: resumeData?.tripId
  })
  const [showSaveNotification, setShowSaveNotification] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    // Get auto-save preference from localStorage, default to true
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trip-creation-auto-save-enabled')
      return saved ? JSON.parse(saved) : true
    }
    return true
  })
  
  // Personal message modal state
  const [showPersonalMessageModal, setShowPersonalMessageModal] = useState(false)
  const [currentHost, setCurrentHost] = useState<{name: string, email: string, companyName: string} | null>(null)
  const [hostQueue, setHostQueue] = useState<Array<{name: string, email: string, companyName: string}>>([])
  const [hostMessages, setHostMessages] = useState<Record<string, string>>({})
  const [sendingEmails, setSendingEmails] = useState(false)
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveDataRef = useRef<string>('')
  const { alert } = useDialogs()
  
  // Generate client temp ID for idempotent trip creation - use session storage to persist
  const clientTempIdRef = useRef<string>('')
  
  useEffect(() => {
    if (resumeData?.tripId) {
      clientTempIdRef.current = ''
    } else {
      // Check if we already have a temp ID in session storage
      const storedTempId = sessionStorage.getItem('trip-creation-temp-id')
      if (storedTempId) {
        clientTempIdRef.current = storedTempId
      } else {
        const newTempId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        clientTempIdRef.current = newTempId
        sessionStorage.setItem('trip-creation-temp-id', newTempId)
      }
    }
  }, [resumeData?.tripId])

  // Progressive save function with improved state management
  const saveProgress = async (stepData: TripFormData, step: number, showNotification = false) => {
    if (!formData.tripType) {
      console.log('⚠️ [TripCreation] No trip type set, skipping save')
      return
    }
    
    console.log('💾 [TripCreation] Starting progressive save:', {
      step,
      tripId: saveStatus.tripId,
      hasActivities: stepData.activities?.length || 0,
      showNotification
    })
    
    // Don't save if data hasn't changed
    const currentDataString = JSON.stringify({ stepData, step })
    if (currentDataString === lastSaveDataRef.current && saveStatus.tripId) {
      console.log('⏭️ [TripCreation] No changes detected, skipping save')
      return
    }
    
    setSaveStatus(prev => ({ ...prev, isSaving: true, error: null }))
    
    try {
      // Use cookies for authentication instead of localStorage token
      // The httpOnly auth-token cookie will be sent automatically
      const response = await fetch('/api/trips/progressive-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({
          tripId: saveStatus.tripId,
          currentStep: step,
          stepData: stepData,
          completionPercentage: Math.round((step / steps.length) * 100),
          tripType: formData.tripType,
          accessCode: stepData.accessCode || formData.accessCode,
          clientTempId: clientTempIdRef.current
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('📋 Progressive save error response:', errorText)
        throw new Error(`Save failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      console.log('✅ [TripCreation] Progressive save successful:', {
        tripId: result.tripId,
        accessCode: result.accessCode,
        savedActivities: result.activities?.length || 0,
        isNewTrip: !saveStatus.tripId
      })
      
      setSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        tripId: result.tripId,
        accessCode: result.accessCode,
        continueUrl: result.continueUrl,
        error: null
      }))
      
      // Update form data with any server-generated IDs for activities
      if (result.activities && result.activities.length > 0) {
        console.log('🔄 [TripCreation] Updating form data with server activity IDs')
        setFormData(prev => ({
          ...prev,
          activities: result.activities
        }))
      }
      
      lastSaveDataRef.current = currentDataString
      
      if (showNotification || (step === 3 && !saveStatus.tripId)) {
        setShowSaveNotification(true)
        setTimeout(() => setShowSaveNotification(false), 3000)
        
        // Show continuation URL for new trips
        if (step === 3 && result.continueUrl && !saveStatus.tripId) {
          console.log('🔗 [TripCreation] Trip saved! Continue later at:', result.continueUrl)
        }
      }
      
    } catch (error) {
      console.error('❌ [TripCreation] Progressive save error:', error)
      setSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save progress'
      }))
      
      // Show error notification for user feedback
      if (showNotification) {
        console.error('🚨 [TripCreation] Save failed with notification requested')
      }
    }
  }

  // Smart auto-save: Only update existing trips, never create new ones
  useEffect(() => {
    if (!autoSaveEnabled || !isOpen || !formData.tripType || currentStep < 3) {
      return
    }
    
    // Only auto-save if we already have a trip ID (from progressive save or resume)
    const existingTripId = saveStatus.tripId || resumeData?.tripId
    if (!existingTripId) {
      return // Don't auto-save until after first manual save creates the trip
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (only for updates)
    saveTimeoutRef.current = setTimeout(() => {
      if (existingTripId && !saveStatus.isSaving) {
        console.log('🔄 Auto-saving existing trip:', existingTripId)
        saveProgress(formData, currentStep, false) // false = don't show notification
      }
    }, 3000) // Auto-save after 3 seconds of no changes
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, currentStep, isOpen, autoSaveEnabled, saveStatus.tripId, saveStatus.isSaving])

  // Handle auto-save toggle change
  const handleAutoSaveToggle = (enabled: boolean) => {
    setAutoSaveEnabled(enabled)
    localStorage.setItem('trip-creation-auto-save-enabled', JSON.stringify(enabled))
    
    if (!enabled && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Helper function to process host messages queue
  const processHostQueue = () => {
    if (hostQueue.length > 0) {
      const nextHost = hostQueue[0]
      setCurrentHost(nextHost)
      setShowPersonalMessageModal(true)
    } else {
      // All hosts processed, send emails with messages
      sendEmailsWithMessages()
    }
  }

  // Handle personal message modal submission
  const handlePersonalMessage = (message: string) => {
    if (currentHost) {
      // Store the message for this host
      setHostMessages(prev => ({
        ...prev,
        [`${currentHost.email}`]: message
      }))
      
      // Remove current host from queue
      setHostQueue(prev => prev.slice(1))
      setCurrentHost(null)
      setShowPersonalMessageModal(false)
      
      // Process next host or send emails
      setTimeout(processHostQueue, 100)
    }
  }

  // Send emails with collected personal messages
  const sendEmailsWithMessages = async () => {
    setSendingEmails(true)
    console.log('📧 [TripCreation] Sending emails with personal messages...')
    
    try {
      // Now send emails with collected messages
      await sendTripInvitationEmails(formData)
      console.log('✅ [TripCreation] All emails sent successfully with personal messages')
    } catch (emailError) {
      console.error('❌ [TripCreation] Failed to send emails with messages:', emailError)
    }
    
    setSendingEmails(false)
    setHostMessages({})
    
    // Close the modal after all emails are sent
    console.log('🚪 [TripCreation] Closing modal after email sending...')
    handleClose()
  }

  // Helper function to send trip invitation emails and host invitations
  const sendTripInvitationEmails = async (tripData: any) => {
    const promises = []
    
    // Send Wolthers staff invitations
    if (tripData.participants && tripData.participants.length > 0) {
      console.log('📧 [TripCreation] Sending Wolthers staff invitations...')
      
      const emailData = {
        tripTitle: tripData.title || 'New Trip',
        tripAccessCode: tripData.accessCode || saveStatus.accessCode || formData.accessCode,
        tripStartDate: tripData.startDate?.toISOString() || formData.startDate?.toISOString(),
        tripEndDate: tripData.endDate?.toISOString() || formData.endDate?.toISOString(),
        createdBy: 'Daniel Wolthers', // TODO: Get from current user context
        participants: (tripData.participants || []).map((p: any) => ({
          name: p.fullName || p.full_name || 'Team Member',
          email: p.email,
          role: p.role || 'Staff'
        })),
        companies: (tripData.companies || []).map((c: any) => ({
          name: c.name,
          representatives: []
        }))
      }

      const staffPromise = fetch('/api/emails/trip-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(emailData)
      })
      promises.push(staffPromise)
    }

    // Send host invitations for external companies
    if (tripData.companies && tripData.companies.length > 0) {
      console.log('📧 [TripCreation] Preparing host invitations...')
      
      // Collect all hosts from selected companies with contacts
      const hosts = []
      for (const company of tripData.companies) {
        if (company.selectedContacts && company.selectedContacts.length > 0) {
          for (const contact of company.selectedContacts) {
            hosts.push({
              name: contact.name,
              email: contact.email,
              companyName: company.fantasyName || company.name,
              whatsApp: contact.phone
            })
          }
        }
      }

      if (hosts.length > 0) {
        console.log(`📧 [TripCreation] Sending host invitations to ${hosts.length} hosts...`)
        
        const hostEmailData = {
          hosts: hosts.map(host => {
            // Get the buyer company names from the trip data
            const buyerCompanies = (tripData.companies || [])
              .filter(c => c.selectedContacts && c.selectedContacts.length > 0)
              .map(c => c.fantasyName || c.name)
            
            return {
              ...host,
              personalMessage: hostMessages[host.email] || '',
              visitingCompanyName: buyerCompanies.join(', ') || 'Our Team', // The buyer companies visiting
              visitDate: tripData.startDate ? new Date(tripData.startDate).toLocaleDateString() : '',
              visitTime: 'Morning (9:00 AM - 12:00 PM)' // Default visit time, can be customized later
            }
          }),
          tripTitle: tripData.title || 'New Trip',
          tripAccessCode: tripData.accessCode || saveStatus.accessCode || formData.accessCode,
          tripStartDate: tripData.startDate?.toISOString() || formData.startDate?.toISOString(),
          tripEndDate: tripData.endDate?.toISOString() || formData.endDate?.toISOString(),
          inviterName: 'Daniel Wolthers', // TODO: Get from current user context
          inviterEmail: 'daniel@wolthers.com', // TODO: Get from current user context
          wolthersTeam: (tripData.participants || []).map((p: any) => ({
            name: p.fullName || p.full_name || 'Team Member',
            role: p.role || 'Staff'
          }))
        }

        const hostPromise = fetch('/api/emails/host-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(hostEmailData)
        })
        promises.push(hostPromise)
      } else {
        console.log('📧 [TripCreation] No host contacts selected, skipping host invitations')
      }
    }

    if (promises.length === 0) {
      console.log('📧 [TripCreation] No participants or hosts found, skipping all email notifications')
      return
    }

    // Execute all email sending in parallel
    const results = await Promise.allSettled(promises)
    
    // Check results and log any errors
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ [TripCreation] Email batch ${index + 1} failed:`, result.reason)
      } else if (!result.value.ok) {
        console.error(`❌ [TripCreation] Email batch ${index + 1} returned error status:`, result.value.status)
      } else {
        console.log(`✅ [TripCreation] Email batch ${index + 1} sent successfully`)
      }
    })

    // If any critical errors occurred, log but don't fail the trip creation
    const failedCount = results.filter(r => r.status === 'rejected').length
    if (failedCount > 0) {
      console.warn(`⚠️ [TripCreation] ${failedCount}/${results.length} email batches failed, but trip was created successfully`)
    }
  }

  if (!isOpen) return null

  const steps = getStepsForTripType(formData.tripType)

  const updateFormData = (data: Partial<TripFormData>) => {
    // Special handling for predefined events
    if (data.selectedConvention && data.accessCode) {
      // When a predefined event is selected with an access code, preserve it
      console.log('🎯 Setting predefined event with access code:', data.accessCode)
      setFormData(prev => ({ ...prev, ...data }))
    } else {
      setFormData(prev => ({ ...prev, ...data }))
    }
  }

  const handleNext = async () => {
    if (currentStep < steps.length) {
      // Save progress before moving to next step
      await saveProgress(formData, currentStep, currentStep === 2) // Show notification on step 3 (when trip is created)
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      console.log('🚀 [TripCreation] Starting trip finalization process...')
      console.log('📋 [TripCreation] Current saveStatus:', saveStatus)
      console.log('📝 [TripCreation] Form data to finalize:', formData)
      
      // First save the final step data
      console.log('💾 [TripCreation] Saving final step data...')
      await saveProgress(formData, currentStep, false)
      console.log('✅ [TripCreation] Final step data saved successfully')
      
      // If we have a trip ID from progressive saves, finalize it
      if (saveStatus.tripId) {
        console.log('🎯 [TripCreation] Finalizing existing trip with ID:', saveStatus.tripId)
        console.log('🔗 [TripCreation] Access code:', saveStatus.accessCode)
        
        const response = await fetch(`/api/trips/${saveStatus.tripId}/finalize`, {
          method: 'PATCH',
          credentials: 'include'
        })
        
        console.log('🌐 [TripCreation] Finalize API response status:', response.status)
        
        if (!response.ok) {
          const error = await response.json()
          console.error('❌ [TripCreation] Finalize API failed:', error)
          throw new Error(error.message || 'Failed to finalize trip')
        }
        
        const result = await response.json()
        console.log('✅ [TripCreation] Trip finalized successfully:', result)
        
        const tripData = { 
          id: saveStatus.tripId, 
          accessCode: saveStatus.accessCode,
          ...formData 
        }
        
        console.log('📤 [TripCreation] Calling onTripCreated with data:', tripData)
        onTripCreated?.(tripData)
        
        // Check if we have hosts and start personal message flow
        const hosts = []
        if (tripData.companies && tripData.companies.length > 0) {
          for (const company of tripData.companies) {
            if (company.selectedContacts && company.selectedContacts.length > 0) {
              for (const contact of company.selectedContacts) {
                hosts.push({
                  name: contact.name,
                  email: contact.email,
                  companyName: company.fantasyName || company.name
                })
              }
            }
          }
        }

        if (hosts.length > 0) {
          console.log(`📧 [TripCreation] Found ${hosts.length} hosts, starting personal message flow...`)
          setHostQueue(hosts)
          setIsSubmitting(false) // Allow modal interaction
          processHostQueue() // Start the personal message flow
          return // Don't close modal yet
        } else {
          // No hosts, send emails directly
          try {
            console.log('📧 [TripCreation] No hosts found, sending staff emails directly...')
            await sendTripInvitationEmails(tripData)
            console.log('✅ [TripCreation] Trip invitation emails sent successfully')
          } catch (emailError) {
            console.error('❌ [TripCreation] Failed to send invitation emails:', emailError)
            // Don't fail the entire process if email fails
          }
        }
        
        // Clear temp ID after successful creation
        sessionStorage.removeItem('trip-creation-temp-id')
        console.log('🧹 [TripCreation] Cleared session storage temp ID')
      } else {
        // Create new trip directly if no progressive save occurred
        console.log('⚠️ [TripCreation] No trip ID found, creating new trip directly')
        console.log('📝 [TripCreation] Form data for direct creation:', formData)
        
        const newTrip = {
          id: `trip-${Date.now()}`,
          ...formData,
          createdAt: new Date()
        }
        
        console.log('📤 [TripCreation] Calling onTripCreated for direct creation with:', newTrip)
        onTripCreated?.(newTrip)
        
        // Check if we have hosts and start personal message flow for direct creation
        const hosts = []
        if (newTrip.companies && newTrip.companies.length > 0) {
          for (const company of newTrip.companies) {
            if (company.selectedContacts && company.selectedContacts.length > 0) {
              for (const contact of company.selectedContacts) {
                hosts.push({
                  name: contact.name,
                  email: contact.email,
                  companyName: company.fantasyName || company.name
                })
              }
            }
          }
        }

        if (hosts.length > 0) {
          console.log(`📧 [TripCreation] Found ${hosts.length} hosts for direct creation, starting personal message flow...`)
          setHostQueue(hosts)
          setIsSubmitting(false) // Allow modal interaction
          processHostQueue() // Start the personal message flow
          return // Don't close modal yet
        } else {
          // No hosts, send emails directly
          try {
            console.log('📧 [TripCreation] No hosts found, sending staff emails directly for direct creation...')
            await sendTripInvitationEmails(newTrip)
            console.log('✅ [TripCreation] Trip invitation emails sent successfully')
          } catch (emailError) {
            console.error('❌ [TripCreation] Failed to send invitation emails:', emailError)
            // Don't fail the entire process if email fails
          }
        }
      }
      
      console.log('🚪 [TripCreation] Closing modal...')
      handleClose()
      console.log('🏁 [TripCreation] Trip finalization process completed successfully!')
    } catch (error) {
      console.error('💥 [TripCreation] Error during trip finalization:', error)
      await alert(`Failed to finalize trip: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Finalization Failed', 'error')
    } finally {
      setIsSubmitting(false)
      console.log('🔄 [TripCreation] Reset submitting state')
    }
  }

  const handleClose = async () => {
    console.log('🚪 [TripCreation] Closing modal - checking if data should be saved')
    
    // Save progress before closing if we have meaningful data
    if (formData.tripType && (currentStep > 2 || (currentStep === 2 && (formData.title || formData.companies.length > 0)))) {
      console.log('💾 [TripCreation] Saving progress before close')
      await saveProgress(formData, currentStep, false)
    }
    
    // Clear temp ID from session storage when modal is closed
    sessionStorage.removeItem('trip-creation-temp-id')
    console.log('🧹 [TripCreation] Cleared session storage')
    
    // Reset form state
    setFormData(initialFormData)
    setCurrentStep(1)
    setSaveStatus({
      isSaving: false,
      lastSaved: null,
      error: null
    })
    
    console.log('🔄 [TripCreation] Form state reset, calling onClose')
    onClose()
    
    // No more hard refresh - let the dashboard handle cache updates properly
    console.log('✅ [TripCreation] Modal closed cleanly without hard refresh')
  }

  const canProceed = () => {
    if (!formData.tripType) {
      return currentStep === 1 ? false : formData.tripType !== null
    }

    if (formData.tripType === 'convention') {
      switch (currentStep) {
        case 1:
          return formData.tripType !== null
        case 2:
          return (formData as any).selectedConvention !== undefined
        case 3:
          return formData.title && formData.startDate && formData.endDate
        case 4:
          // Meetings & Agenda step - optional but allow proceeding
          return true
        case 5:
          // Hotels & Accommodation step - optional but allow proceeding
          return true
        case 6:
          // Flights & Travel step - optional but allow proceeding
          return true
        case 7:
          // Drivers & Vehicles step - require at least one driver and either assigned vehicle OR rental
          const conventionHasDriver = formData.participants && formData.participants.some((p: any) => p.isDriver)
          const conventionHasAssignedVehicle = formData.vehicleAssignments && Object.keys(formData.vehicleAssignments).length > 0
          const conventionUseRental = (formData as any).useRental
          return conventionHasDriver && (conventionHasAssignedVehicle || conventionUseRental)
        case 8:
          return true
        default:
          return false
      }
    } else if (formData.tripType === 'in_land') {
      switch (currentStep) {
        case 1:
          return formData.tripType !== null
        case 2:
          // Basic Information: only require title, dates
          return formData.title && formData.startDate && formData.endDate
        case 3:
          // Team & Participants: require Wolthers staff
          return formData.participants && formData.participants.length > 0
        case 4:
          // Drivers & Vehicles: require at least one driver and either assigned vehicle OR rental
          const hasDriver = formData.participants && formData.participants.some((p: any) => p.isDriver)
          const hasAssignedVehicle = formData.vehicleAssignments && Object.keys(formData.vehicleAssignments).length > 0
          const useRental = (formData as any).useRental
          return hasDriver && (hasAssignedVehicle || useRental)
        case 5:
          // Host/Visits Selector: allow proceeding (host companies optional)
          return true
        case 6:
          // Starting Point Selection: require starting point selection
          return formData.startingPoint && formData.startingPoint.trim() !== ''
        case 7:
          // Calendar Schedule: allow proceeding (activities can be added later)
          return true
        case 8:
          return true
        default:
          return false
      }
    }

    return false
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white dark:bg-[#0f1419] rounded-none md:rounded-2xl shadow-2xl border-0 md:border border-pearl-200 dark:border-[#2a2a2a] w-full h-full md:h-auto md:max-w-7xl md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-pearl-200 dark:border-[#2a2a2a] flex-shrink-0 rounded-t-none md:rounded-t-2xl" style={{ backgroundColor: '#FBBF23' }}>
          <div className="flex items-center space-x-3">
            <Plus className="w-6 h-6" style={{ color: '#006D5B' }} />
            <h2 className="text-lg md:text-xl font-semibold" style={{ color: '#006D5B' }}>
              <span className="hidden sm:inline">
                {resumeData ? 'Continue Trip Creation' : 'Create New Trip'}
                {formData.tripType && currentStep > 1 && (
                  <span style={{ color: '#333333' }}> - {steps[currentStep - 1]?.name}</span>
                )}
              </span>
              <span className="sm:hidden">
                {resumeData ? 'Continue Trip' : 'New Trip'}
                {formData.tripType && currentStep > 1 && (
                  <span style={{ color: '#333333' }}> - {steps[currentStep - 1]?.name}</span>
                )}
              </span>
            </h2>
            {/* Save Status Indicator and Auto-save Toggle */}
            <div className="flex items-center space-x-1 md:space-x-3">
              {/* Save Status */}
              <div className="flex items-center space-x-1 md:space-x-2">
                {saveStatus.isSaving && (
                  <div className="flex items-center space-x-1" style={{ color: '#333333' }}>
                    <Save className="w-3 md:w-4 h-3 md:h-4 animate-pulse" />
                    <span className="text-xs md:text-sm hidden xs:inline">Saving...</span>
                  </div>
                )}
                {saveStatus.lastSaved && !saveStatus.isSaving && !saveStatus.error && (
                  <div className="flex items-center space-x-1" style={{ color: '#333333' }}>
                    <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />
                    <span className="text-xs md:text-sm hidden xs:inline">Saved {formatSaveTime(saveStatus.lastSaved)}</span>
                  </div>
                )}
                {saveStatus.error && (
                  <div className="flex items-center space-x-1 text-red-200">
                    <AlertCircle className="w-3 md:w-4 h-3 md:h-4" />
                    <span className="text-xs md:text-sm hidden xs:inline">Save failed</span>
                  </div>
                )}
              </div>

              {/* Auto-save Toggle - only show after step 3 when we can have a trip ID */}
              {currentStep >= 3 && (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <label className="flex items-center space-x-1 md:space-x-2 cursor-pointer" style={{ color: '#333333' }}>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={autoSaveEnabled}
                        onChange={(e) => handleAutoSaveToggle(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-6 md:w-8 h-3 md:h-4 rounded-full transition-colors ${
                        autoSaveEnabled 
                          ? 'bg-green-500' 
                          : 'bg-gray-400 dark:bg-gray-600'
                      }`}>
                        <div className={`w-2 md:w-3 h-2 md:h-3 bg-white rounded-full shadow-sm transition-transform transform ${
                          autoSaveEnabled ? 'translate-x-3 md:translate-x-4' : 'translate-x-0.5'
                        } mt-0.5`} />
                      </div>
                    </div>
                    <span className="text-xs md:text-sm hidden sm:inline select-none">Auto-save</span>
                  </label>
                  {autoSaveEnabled && saveStatus.tripId && (
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" title="Auto-save active - Updates existing trip every 3 seconds"></div>
                  )}
                  {autoSaveEnabled && !saveStatus.tripId && (
                    <div className="w-1 h-1 bg-orange-400 rounded-full" title="Auto-save ready - Will activate after first manual save"></div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="transition-colors hover:opacity-80"
            style={{ color: '#006D5B' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>


        {/* Save Notification */}
        {showSaveNotification && (
          <div className="absolute top-20 right-6 bg-green-500 dark:bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg z-50 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Progress saved successfully!</span>
            {saveStatus.continueUrl && currentStep === 3 && (
              <span className="text-xs opacity-90">You can continue later</span>
            )}
          </div>
        )}
        
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-8 lg:py-10 min-h-0 h-full bg-white dark:bg-[#0f1419]">
          {/* Step 1: Trip Type Selection */}
          {currentStep === 1 && (
            <TripTypeSelection
              selectedType={formData.tripType}
              onTypeSelect={(type) => {
                updateFormData({ tripType: type })
                // Automatically proceed to next step
                setTimeout(() => {
                  setCurrentStep(2)
                }, 300) // Small delay for smooth transition
              }}
            />
          )}
          
          {/* Convention Trip Steps */}
          {formData.tripType === 'convention' && currentStep === 2 && (
            <CoffeeEventCarousel 
              formData={formData as any}
              updateFormData={updateFormData}
              onEventSelected={handleNext}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 3 && (
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 4 && (
            <MeetingAgendaStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 5 && (
            <HotelBookingStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 6 && (
            <FlightBookingStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 7 && (
            <EnhancedDriverVehicleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 8 && (
            <ReviewStep formData={formData} />
          )}
          
          {/* In-land Trip Steps */}
          {formData.tripType === 'in_land' && currentStep === 2 && (
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 3 && (
            <SimpleTeamParticipantsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 4 && (
            <EnhancedDriverVehicleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 5 && (
            <CompanySelectionStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 6 && (
            <StartingPointSelectionStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 7 && (
            <EnhancedCalendarScheduleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 8 && (
            <ReviewStep formData={formData} />
          )}
        </div>

        {/* Footer - Navigation Buttons */}
        <div className="border-t border-pearl-200 dark:border-[#2a2a2a] px-4 md:px-6 lg:px-8 py-4 md:py-5 flex justify-between flex-shrink-0 bg-gray-50 dark:bg-[#1a1a1a] items-center rounded-b-none md:rounded-b-2xl">
          <div className="flex space-x-2 md:space-x-3">
            <button
              onClick={handleClose}
              className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Manual Save Button - hide on very small screens */}
            {currentStep > 1 && formData.tripType && (
              <button
                onClick={() => saveProgress(formData, currentStep, true)}
                disabled={saveStatus.isSaving}
                className="hidden xs:flex px-2 md:px-3 py-2 text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-[#2a2a2a] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors items-center"
                title="Save progress"
              >
                {saveStatus.isSaving ? (
                  <Save className="w-4 h-4 animate-pulse" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="ml-1 hidden md:inline">Save</span>
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-3 md:px-4 py-2 text-sm md:text-base bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-xl transition-colors flex items-center"
                style={{
                  backgroundColor: !canProceed() ? '#9CA3AF' : '#059669'
                }}
                onMouseEnter={(e) => {
                  if (canProceed()) {
                    e.currentTarget.style.backgroundColor = '#FCC542'
                    e.currentTarget.style.color = '#006D5B'
                  }
                }}
                onMouseLeave={(e) => {
                  if (canProceed()) {
                    e.currentTarget.style.backgroundColor = '#059669'
                    e.currentTarget.style.color = 'white'
                  }
                }}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="px-3 md:px-4 py-2 text-sm md:text-base rounded-xl transition-colors"
                style={{
                  backgroundColor: (!canProceed() || isSubmitting) ? '#9CA3AF' : '#059669',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (canProceed() && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#FCC542'
                    e.currentTarget.style.color = '#006D5B'
                  }
                }}
                onMouseLeave={(e) => {
                  if (canProceed() && !isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#059669'
                    e.currentTarget.style.color = 'white'
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="hidden sm:inline">{saveStatus.tripId ? 'Finalizing...' : 'Creating...'}</span>
                    <span className="sm:hidden">{saveStatus.tripId ? 'Finalizing' : 'Creating'}</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">{saveStatus.tripId ? 'Finalize Trip' : 'Create Trip'}</span>
                    <span className="sm:hidden">{saveStatus.tripId ? 'Finalize' : 'Create'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Personal Message Modal */}
      {showPersonalMessageModal && currentHost && (
        <PersonalMessageModal
          isOpen={showPersonalMessageModal}
          onClose={() => {
            // Cancel the entire personal message flow
            setShowPersonalMessageModal(false)
            setCurrentHost(null)
            setHostQueue([])
            setHostMessages({})
            handleClose() // Close the main modal
          }}
          onSend={handlePersonalMessage}
          hostName={currentHost.name}
          companyName={currentHost.companyName}
          isLoading={sendingEmails}
        />
      )}
    </div>
  )
}

// Helper function to format save time
function formatSaveTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  
  if (diffSecs < 60) {
    return 'just now'
  } else if (diffMins < 60) {
    return `${diffMins}m ago`
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
}