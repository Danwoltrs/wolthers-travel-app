export interface BaseEmailData {
  tripTitle: string
  tripAccessCode: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text?: string
}

export interface TripCreationEmailData extends BaseEmailData {
  createdBy: string
  recipients: Array<{ name: string; email: string; role?: string }>
}

export interface TripCancellationEmailData extends BaseEmailData {
  cancelledBy: string
  cancellationReason?: string
  stakeholders: Array<{ name: string; email: string; role?: string }>
}

export interface TripItineraryEmailData {
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  createdBy: string
  itinerary: Array<{
    date: string
    activities: Array<{
      time: string
      title: string
      location?: string
      duration?: string
      hostName?: string
      type?: string
    }>
  }>
  participants: Array<{
    name: string
    email: string
    role?: string
  }>
  companies: Array<{
    name: string
    fantasyName?: string
    fantasy_name?: string
    representatives?: Array<{
      name: string
      email: string
    }>
  }>
  vehicle?: {
    make: string
    model: string
    licensePlate?: string
  }
  driver?: {
    name: string
    phone?: string
  }
}

export interface StaffInvitationEmailData {
  tripTitle?: string
  tripAccessCode: string
  inviterName: string
  inviterEmail: string
  newStaffName: string
  role: string
  whatsApp?: string
}

export interface HostInvitationEmailData extends BaseEmailData {
  hostName: string
  companyName: string
  inviterName: string
  inviterEmail: string
  wolthersTeam: Array<{ name: string; role?: string }>
  visitDate?: string
  visitTime?: string
}

export interface HostVisitConfirmationData extends BaseEmailData {
  hostName: string
  companyName: string
  companyFantasyName?: string
  visitDate: string
  visitTime: string
  guests: string[]
  wolthersTeam?: string[]
  inviterName: string
  inviterEmail: string
  yesUrl: string
  noUrl: string
}

export interface HostMeetingRequestData {
  hostName: string
  hostEmail: string
  companyName: string
  meetingTitle: string
  meetingDate: string
  meetingTime: string
  meetingDuration?: string
  meetingLocation?: string
  meetingDescription?: string
  wolthersTeam: Array<{
    name: string
    role?: string
  }>
  tripTitle?: string
  tripAccessCode?: string
  inviterName: string
  inviterEmail: string
  acceptUrl: string
  declineUrl: string
  rescheduleUrl: string
  personalMessage?: string
  whatsApp?: string
}

export interface GuestItineraryData {
  guestName: string
  guestEmail: string
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  createdBy: string
  itinerary: Array<{
    date: string
    activities: Array<{
      time: string
      title: string
      location?: string
      duration?: string
      type?: 'meeting' | 'transport' | 'meal' | 'activity' | 'accommodation'
      description?: string
    }>
  }>
  accommodation?: {
    name: string
    address?: string
    phone?: string
    checkIn?: string
    checkOut?: string
  }
  transportation?: {
    type: 'flight' | 'train' | 'car' | 'other'
    details: string
    arrivalTime?: string
    departureTime?: string
  }
  emergencyContacts: Array<{
    name: string
    role: string
    phone?: string
    email?: string
  }>
  specialInstructions?: string
}

export interface VisitDeclinedData extends BaseEmailData {
  creatorName: string
  hostName: string
  companyName: string
  visitDate: string
}

export interface NewTimeProposedData extends BaseEmailData {
  creatorName: string
  hostName: string
  newDate: string
  newTime: string
}

export interface MeetingResponseNotificationData {
  organizerName: string
  organizerEmail: string
  hostName: string
  hostEmail: string
  companyName: string
  meetingTitle: string
  originalDate: string
  originalTime: string
  responseType: 'accept' | 'decline' | 'reschedule'
  responseMessage?: string
  rescheduleDetails?: {
    requestedDate?: string
    requestedTime?: string
  }
  tripTitle?: string
  tripAccessCode?: string
  respondedAt: string
}

export interface TripChangeNotificationData {
  tripTitle: string
  tripAccessCode: string
  tripDate: string
  organizerName: string
  organizerEmail: string
  recipientName: string
  recipientEmail: string
  changes: Array<{
    type: 'activity_added' | 'activity_deleted' | 'activity_modified' | 'time_changed' | 'location_changed' | 'participant_added' | 'participant_removed'
    description: string
    details: string
    time?: string
    location?: string
    previousValue?: string
    newValue?: string
  }>
  summaryDate: string
  totalChanges: number
}
