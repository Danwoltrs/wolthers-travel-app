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
// Import Enhanced Driver & Vehicle Step statically
import EnhancedDriverVehicleStep from './EnhancedDriverVehicleStep'
import ConventionAirportTransportStep from './ConventionAirportTransportStep'
import ReviewStep from './ReviewStep'
import SimpleTeamParticipantsStep from './SimpleTeamParticipantsStep'
import CompanySelectionStep from './CompanySelectionStep'
import StartingPointSelectionStep from './StartingPointSelectionStep'
import EndingPointSelectionStep from './EndingPointSelectionStep'
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
  
  // Step 5: Ending Point Selection
  endingPoint?: string // Ending location for the trip
  departureFlightInfo?: any // Flight information for GRU airport drop-off
  preFlightDestination?: 'hotel' | 'office' // Destination before airport drop-off
  preFlightDestinationAddress?: string // Address for hotel/office before drop-off
  dropoffGroups?: any[] // Multi-company drop-off groups with guest information
  
  // Step 4: Calendar & Itinerary
  itineraryDays: ItineraryDay[]
  activities?: Activity[] // Calendar activities with travel time
  generatedActivities?: Activity[] // AI-generated activities for temp trips
  aiItineraryGenerated?: boolean // Flag to track if AI has generated activities
  
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
      { id: 3, name: 'Basic Information', description: 'Trip details and dates' },
      { id: 4, name: 'Team & Participants', description: 'Select Wolthers staff attending' },
      { id: 5, name: 'Meetings & Agenda', description: 'Plan conference sessions and meetings' },
      { id: 6, name: 'Hotels & Accommodation', description: 'Book hotels and lodging' },
      { id: 7, name: 'Airport Transport', description: 'Configure transport to/from airport' },
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
      { id: 7, name: 'Ending Point', description: 'Choose where the trip ends' },
      { id: 8, name: 'Calendar Schedule', description: 'Create itinerary with travel time optimization' },
      { id: 9, name: 'Review & Create', description: 'Review and finalize trip' }
    ]
  } else {
    return [
      { id: 1, name: 'Trip Type', description: 'Choose trip type' }
    ]
  }
}

  // Helper function to determine step based on existing trip data
  const determineStepFromTripData = (tripData: any): number => {
    if (!tripData) return 1;
    
    // Step 1: Trip type selection (if no trip_type)
    if (!tripData.trip_type && !tripData.tripType) return 1;
    
    // Step 2: Basic info (if no title or dates)
    if (!tripData.title || !tripData.start_date || !tripData.end_date) return 2;
    
    // Step 3: Team & Vehicle (if no participants assigned)
    if (!tripData.participants || tripData.participants.length === 0) return 3;
    
    // Step 4: Driver & Vehicle assignments
    if (!tripData.vehicleAssignments || Object.keys(tripData.vehicleAssignments).length === 0) return 4;
    
    // Step 5+: Move to next step based on completion_step or default
    return Math.max(tripData.completion_step || 5, 5);
  };

  // Helper function to convert trip data to form data structure
  const convertTripDataToFormData = (tripData: any): TripFormData => {
    if (!tripData) return initialFormData;
    
    return {
      tripType: tripData.trip_type || tripData.tripType || null,
      title: tripData.title || '',
      description: tripData.description || '',
      subject: tripData.subject || '',
      companies: tripData.companies || [],
      participants: tripData.participants || [],
      startDate: tripData.start_date ? new Date(tripData.start_date) : 
                 tripData.startDate ? new Date(tripData.startDate) : null,
      endDate: tripData.end_date ? new Date(tripData.end_date) : 
               tripData.endDate ? new Date(tripData.endDate) : null,
      accessCode: tripData.access_code || tripData.accessCode || '',
      itineraryDays: tripData.itineraryDays || [],
      wolthersStaff: tripData.wolthersStaff || [],
      vehicles: tripData.vehicles || [],
      vehicleAssignments: tripData.vehicleAssignments || [],
      meetings: tripData.meetings || [],
      hotels: tripData.hotels || [],
      flights: tripData.flights || [],
      startingPoint: tripData.startingPoint,
      endingPoint: tripData.endingPoint
    };
  };

export default function TripCreationModal({ isOpen, onClose, onTripCreated, resumeData }: TripCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    // If we have resumeData with step info, use that
    if (resumeData?.currentStep) return resumeData.currentStep;
    
    // If we're continuing an existing trip, determine step from trip data
    if (resumeData?.tripId && resumeData?.formData) {
      return determineStepFromTripData(resumeData.formData);
    }
    
    // Default to step 1 for new trips
    return 1;
  })
  
  const [formData, setFormData] = useState<TripFormData>(() => {
    // Priority 1: Use provided formData if available
    if (resumeData?.formData) {
      return resumeData.formData;
    }
    
    // Priority 2: Default empty form
    return initialFormData;
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() => ({
    isSaving: false,
    lastSaved: null,
    error: null,
    tripId: resumeData?.tripId,
    accessCode: resumeData?.formData?.accessCode || formData.accessCode
  }))
  
  // Personal message modal state
  const [showPersonalMessageModal, setShowPersonalMessageModal] = useState(false)
  const [currentHost, setCurrentHost] = useState<{name: string, email: string, companyName: string} | null>(null)
  const [hostQueue, setHostQueue] = useState<Array<{name: string, email: string, companyName: string}>>([])
  const [hostMessages, setHostMessages] = useState<Record<string, string>>({})
  const [sendingEmails, setSendingEmails] = useState(false)
  
  const { alert } = useDialogs()
  

  // Update currentStep when resumeData changes (for draft resumption)
  useEffect(() => {
    if (resumeData?.currentStep) {
      console.log('🔄 [TripCreation] Updating currentStep from resumeData:', resumeData.currentStep)
      setCurrentStep(resumeData.currentStep)
    }
  }, [resumeData?.currentStep])

  // Simplified creation - no progressive save needed

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
      console.log('📧 [TripCreation] Sending Wolthers staff itinerary emails...')
      
      // Prepare itinerary data from generated activities
      const itinerary = []
      if (tripData.generatedActivities && tripData.generatedActivities.length > 0) {
        // Group activities by date
        const activitiesByDate = tripData.generatedActivities.reduce((acc: any, activity: any) => {
          const date = activity.activity_date
          if (!acc[date]) {
            acc[date] = []
          }
          acc[date].push({
            time: activity.start_time || '09:00',
            title: activity.title || 'Activity',
            location: activity.location,
            duration: activity.end_time ? `${activity.start_time} - ${activity.end_time}` : undefined
          })
          return acc
        }, {})
        
        // Convert to array format
        Object.keys(activitiesByDate)
          .sort()
          .forEach(date => {
            itinerary.push({
              date,
              activities: activitiesByDate[date].sort((a: any, b: any) => a.time.localeCompare(b.time))
            })
          })
      }
      
      // Get vehicle and driver info
      const vehicleAssignment = tripData.vehicleAssignments?.[0]
      const vehicle = vehicleAssignment?.vehicle ? {
        make: vehicleAssignment.vehicle.make || 'Unknown',
        model: vehicleAssignment.vehicle.model || 'Unknown',
        licensePlate: vehicleAssignment.vehicle.licensePlate || 'N/A'
      } : undefined
      
      const driver = vehicleAssignment?.driver ? {
        name: vehicleAssignment.driver.fullName || vehicleAssignment.driver.full_name || 'Unknown Driver',
        email: vehicleAssignment.driver.email,
        phone: vehicleAssignment.driver.phone
      } : undefined
      
      const emailData = {
        tripTitle: tripData.title || 'New Trip',
        tripAccessCode: tripData.accessCode || saveStatus.accessCode || formData.accessCode,
        tripStartDate: tripData.startDate?.toISOString() || formData.startDate?.toISOString(),
        tripEndDate: tripData.endDate?.toISOString() || formData.endDate?.toISOString(),
        createdBy: 'Daniel Wolthers', // TODO: Get from current user context
        itinerary: itinerary,
        participants: (tripData.participants || []).map((p: any) => ({
          name: p.fullName || p.full_name || 'Team Member',
          email: p.email,
          role: p.role || 'Staff'
        })),
        companies: (tripData.companies || []).map((c: any) => ({
          name: c.fantasyName || c.name,
          representatives: c.selectedContacts?.map((contact: any) => ({
            name: contact.name,
            email: contact.email,
            role: contact.role || 'Guest'
          })) || []
        })),
        vehicle: vehicle,
        driver: driver
      }

      // Use finalize endpoint with new clean email templates instead of old busy template
      console.log('📧 [TripCreation] Using finalize endpoint for clean email templates...')
      const staffPromise = fetch(`/api/trips/${saveStatus.tripId}/finalize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sendEmails: true
        })
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

        // Host invitations are now handled by the finalize endpoint with clean templates
        console.log('📧 [TripCreation] Host invitations will be sent via finalize endpoint (already handled above)')
        // Remove this separate API call since finalize endpoint handles all participants
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
      console.log('🚀 [TripCreation] NEW CODE: Creating trip with simplified flow...')
      console.log('📝 [TripCreation] NEW CODE: Form data:', formData)
      console.log('🔍 [TripCreation] CRITICAL DEBUG - Current formData state:', {
        participants: formData.participants?.length || 0,
        companies: formData.companies?.length || 0,
        hostCompanies: formData.hostCompanies?.length || 0,
        vehicleAssignments: formData.vehicleAssignments?.length || 0,
        generatedActivities: formData.generatedActivities?.length || 0,
        accessCode: formData.accessCode
      })
      
      // Helper to normalize contact data coming from different steps
      const normalizeContacts = (contacts: any[] = []) =>
        contacts.map(contact => ({
          ...contact,
          name: contact.name || contact.full_name || contact.fullName || contact.email || 'Guest',
          full_name: contact.full_name || contact.name || contact.fullName || contact.email || 'Guest',
          email: contact.email || contact.contact_email || '',
          role: contact.role || contact.type || undefined,
          phone: contact.phone || contact.whatsapp || undefined
        }))

      // Normalize buyer companies so the API receives a consistent selectedContacts array
      const buyerCompanies = (formData.companies || []).map(company => ({
        ...company,
        selectedContacts: normalizeContacts((company as any).selectedContacts || (company as any).participants || []),
        participants: (company as any).participants || [],
        isHost: false,
        role: 'guest'
      }))

      // Normalize host companies separately with representative data
      const hostCompaniesWithContacts = (formData.hostCompanies || []).map(host => ({
        ...host,
        selectedContacts: normalizeContacts(host.representatives || host.selectedContacts || []),
        representatives: normalizeContacts(host.representatives || host.selectedContacts || []),
        isHost: true,
        role: 'host'
      }))

      // Transform meetings to activities format for the API
      const meetingsAsActivities = (formData.meetings || []).map((meeting: any) => ({
        id: meeting.id,
        title: meeting.title,
        type: meeting.type,
        activity_date: meeting.date, // Use activity_date instead of date
        start_time: `${meeting.date}T${meeting.startTime}:00`,
        end_time: meeting.endTime ? `${meeting.date}T${meeting.endTime}:00` : undefined,
        location: meeting.location,
        description: meeting.description,
        priority: meeting.priority,
        notes: meeting.notes,
        attendees: meeting.attendees,
        // Additional fields for compatibility
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        date: meeting.date // Keep for backwards compatibility
      }))

      // Transform formData to match create API expectations
      const transformedData = {
        ...formData,
        // Extract vehicles and drivers from vehicleAssignments
        vehicles: formData.vehicleAssignments?.map(assignment => assignment.vehicle).filter(Boolean) || [],
        drivers: formData.vehicleAssignments?.map(assignment => assignment.driver).filter(Boolean) || [],
        // Also provide single vehicle/driver for backward compatibility
        vehicle: formData.vehicleAssignments?.[0]?.vehicle || null,
        driver: formData.vehicleAssignments?.[0]?.driver || null,
        // Combine normalized buyer and host companies for the API payload
        companies: [...buyerCompanies, ...hostCompaniesWithContacts],
        // Also include hostCompanies separately for email templates with normalized contacts
        hostCompanies: hostCompaniesWithContacts,
        // Ensure generatedActivities are included, combining meetings and existing activities
        generatedActivities: [
          ...(formData.generatedActivities || []),
          ...(formData.activities || []),
          ...meetingsAsActivities
        ]
      }
      
      console.log('🔄 [TripCreation] Transformed data:', {
        vehicles: transformedData.vehicles?.length || 0,
        drivers: transformedData.drivers?.length || 0,
        participants: transformedData.participants?.length || 0,
        companies: transformedData.companies?.length || 0,
        hostCompanies: transformedData.hostCompanies?.length || 0,
        meetings: formData.meetings?.length || 0,
        meetingsAsActivities: meetingsAsActivities?.length || 0,
        generatedActivities: transformedData.generatedActivities?.length || 0
      })
      
      console.log('📊 [TripCreation] Detailed data check:', {
        participantNames: transformedData.participants?.map(p => p.fullName || p.full_name || p.email) || [],
        companyNames: transformedData.companies?.map(c => c.name || c.fantasyName) || [],
        companiesWithContacts: transformedData.companies?.map(c => ({
          name: c.name || c.fantasyName,
          contactCount: c.selectedContacts?.length || 0,
          contacts: c.selectedContacts?.map(contact => contact.name) || []
        })) || [],
        vehicleData: transformedData.vehicles?.map(v => `${v.make} ${v.model}`) || [],
        driverData: transformedData.drivers?.map(d => d.fullName || d.full_name) || []
      })
      
      // Single API call to create the complete trip with emails
      console.log('🎯 [TripCreation] ABOUT TO FETCH: /api/trips/create')
      console.log('🎯 [TripCreation] SENDING DATA:', transformedData)
      const response = await fetch('/api/trips/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(transformedData)
      })
      console.log('🎯 [TripCreation] FETCH COMPLETED, response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ [TripCreation] Create API failed:', error)
        throw new Error(error.message || 'Failed to create trip')
      }

      const result = await response.json()
      console.log('✅ [TripCreation] Trip created successfully:', result)

      const tripData = {
        id: result.trip.id,
        accessCode: result.trip.access_code,
        ...formData,
        companies: buyerCompanies,
        hostCompanies: hostCompaniesWithContacts,
        vehicles: transformedData.vehicles,
        drivers: transformedData.drivers,
        generatedActivities: transformedData.generatedActivities
      }

      console.log('📤 [TripCreation] Calling onTripCreated with data:', tripData)
      onTripCreated?.(tripData)
      
      console.log('🚪 [TripCreation] Closing modal...')
      handleClose()
      console.log('🎉 [TripCreation] Trip creation completed successfully!')
      
    } catch (error) {
      console.error('💥 [TripCreation] Error during trip creation:', error)
      await alert(`Failed to create trip: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Creation Failed', 'error')
    } finally {
      setIsSubmitting(false)
      console.log('🔄 [TripCreation] Reset submitting state')
    }
  }

  const handleClose = async () => {
    console.log('🚪 [TripCreation] Closing modal')
    
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
          // Team & Participants step - require at least one Wolthers staff member
          return formData.participants && formData.participants.length > 0
        case 5:
          // Meetings & Agenda step - optional but allow proceeding
          return true
        case 6:
          // Hotels & Accommodation step - optional but allow proceeding
          return true
        case 7:
          // Airport Transport step - always allow proceeding (transport is optional for conventions)
          return true
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
          // Ending Point Selection: require ending point selection
          return formData.endingPoint && formData.endingPoint.trim() !== ''
        case 8:
          // Calendar Schedule: allow proceeding (activities can be added later)
          return true
        case 9:
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
          </div>
          <button
            onClick={handleClose}
            className="transition-colors hover:opacity-80"
            style={{ color: '#006D5B' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>


        
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
            <SimpleTeamParticipantsStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 5 && (
            <MeetingAgendaStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 6 && (
            <HotelBookingStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'convention' && currentStep === 7 && (
            <ConventionAirportTransportStep
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
            <EndingPointSelectionStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 8 && (
            <EnhancedCalendarScheduleStep
              formData={formData}
              updateFormData={updateFormData}
            />
          )}
          
          {formData.tripType === 'in_land' && currentStep === 9 && (
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
                    <span className="hidden sm:inline">Creating Trip...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Create Trip</span>
                    <span className="sm:hidden">Create</span>
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