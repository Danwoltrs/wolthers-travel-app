import { createServerSupabaseClient } from '@/lib/supabase-server'
import { 
  sendHostInvitationEmail, 
  sendGuestItineraryEmail, 
  sendStaffInvitationEmail,
  sendHostMeetingRequestEmail,
  HostInvitationEmailData,
  GuestItineraryData,
  StaffInvitationEmailData,
  HostMeetingRequestData
} from '@/lib/resend'
import { generateMeetingResponseUrls } from '@/lib/meeting-response-tokens'

export interface ParticipantEmailContext {
  tripId: string
  tripTitle: string
  tripAccessCode: string
  tripStartDate: string
  tripEndDate: string
  createdBy: string
  createdByEmail: string
  participants: Array<{
    id: string
    name: string
    email: string
    role: string
  }>
}

export interface EmailResult {
  success: boolean
  error?: string
  emailType?: string
}

/**
 * Service for sending role-based emails when participants are added to trips
 */
export class ParticipantEmailService {
  
  /**
   * Send appropriate email based on participant role
   */
  static async sendParticipantEmail(
    participantId: string, 
    participantRole: string, 
    context: ParticipantEmailContext
  ): Promise<EmailResult> {
    const supabase = createServerSupabaseClient()
    
    try {
      // First try to get participant from users table (for registered users)
      let participant = null
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email, company_id, companies!inner(name)')
        .eq('id', participantId)
        .single()

      if (!userError && userData) {
        participant = userData
      } else {
        // If not found in users table, check trip_participants for guest data
        const { data: guestData, error: guestError } = await supabase
          .from('trip_participants')
          .select(`
            user_id,
            guest_email,
            guest_name,
            guest_company,
            company_id,
            companies!inner(name)
          `)
          .eq('trip_id', context.tripId)
          .eq('user_id', participantId)
          .single()

        if (!guestError && guestData) {
          // Format guest data to match user format
          participant = {
            id: guestData.user_id,
            full_name: guestData.guest_name,
            email: guestData.guest_email,
            company_id: guestData.company_id,
            companies: { name: guestData.guest_company || guestData.companies?.name }
          }
        }
      }

      if (!participant) {
        console.error('Failed to fetch participant:', userError)
        return { 
          success: false, 
          error: `Failed to fetch participant details: ${userError?.message || 'Participant not found'}` 
        }
      }

      // Skip if participant has no email
      if (!participant.email) {
        console.log(`⚠️ Skipping email for participant ${participant.full_name} - no email address`)
        return { success: true, emailType: 'skipped_no_email' }
      }

      // Route to appropriate email handler based on role
      switch (participantRole.toLowerCase()) {
        case 'host':
          return await this.sendHostEmail(participant, context)
        
        case 'client_representative':
        case 'external_guest':
          return await this.sendGuestEmail(participant, context)
        
        case 'staff':
        case 'wolthers_staff':
          return await this.sendStaffEmail(participant, context)
        
        default:
          console.log(`⚠️ Unknown participant role: ${participantRole} - skipping email`)
          return { success: true, emailType: 'skipped_unknown_role' }
      }

    } catch (error) {
      console.error('Error in sendParticipantEmail:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Send host invitation/meeting request email
   */
  private static async sendHostEmail(
    participant: any, 
    context: ParticipantEmailContext
  ): Promise<EmailResult> {
    const supabase = createServerSupabaseClient()
    
    // Check if this is a meeting request or general host invitation
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .in('itinerary_day_id', 
        supabase
          .from('itinerary_days')
          .select('id')
          .eq('trip_id', context.tripId)
      )
      .eq('company_id', participant.company_id)
      .limit(1)

    // Get Wolthers team members for this trip
    const { data: wolthersTeam } = await supabase
      .from('trip_participants')
      .select(`
        users!inner(full_name, role)
      `)
      .eq('trip_id', context.tripId)
      .eq('role', 'staff')

    const teamMembers = wolthersTeam?.map(tp => ({
      name: tp.users.full_name,
      role: tp.users.role
    })) || []

    if (activities && activities.length > 0) {
      // Send meeting request for specific activity
      const activity = activities[0]
      const meetingRequestData: HostMeetingRequestData = {
        hostName: participant.full_name,
        hostEmail: participant.email,
        companyName: participant.companies.name,
        meetingTitle: activity.title,
        meetingDate: activity.start_time,
        meetingTime: new Date(activity.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        meetingDuration: activity.duration_minutes ? `${activity.duration_minutes} minutes` : undefined,
        meetingLocation: activity.location,
        meetingDescription: activity.description,
        wolthersTeam: teamMembers,
        tripTitle: context.tripTitle,
        tripAccessCode: context.tripAccessCode,
        inviterName: context.createdBy,
        inviterEmail: context.createdByEmail,
        ...generateMeetingResponseUrls(
          process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          {
            activityId: activity.id,
            hostEmail: participant.email,
            companyName: participant.companies.name
          }
        )
      }

      const result = await sendHostMeetingRequestEmail(participant.email, meetingRequestData)
      return { 
        success: result.success, 
        error: result.error,
        emailType: 'meeting_request' 
      }

    } else {
      // Send general host invitation
      const hostInvitationData: HostInvitationEmailData = {
        hostName: participant.full_name,
        hostEmail: participant.email,
        companyName: participant.companies.name,
        tripTitle: context.tripTitle,
        tripAccessCode: context.tripAccessCode,
        tripStartDate: context.tripStartDate,
        tripEndDate: context.tripEndDate,
        inviterName: context.createdBy,
        inviterEmail: context.createdByEmail,
        wolthersTeam: teamMembers,
        confirmationUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/host/confirm/${context.tripId}`,
        platformLoginUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/host/login`,
        visitingCompanyName: 'Wolthers & Associates',
        visitDate: new Date(context.tripStartDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        visitTime: '9:00 AM' // Default time, could be made configurable
      }

      const result = await sendHostInvitationEmail(participant.email, hostInvitationData)
      return { 
        success: result.success, 
        error: result.error,
        emailType: 'host_invitation' 
      }
    }
  }

  /**
   * Send guest itinerary email
   */
  private static async sendGuestEmail(
    participant: any, 
    context: ParticipantEmailContext
  ): Promise<EmailResult> {
    const supabase = createServerSupabaseClient()
    
    // Get trip itinerary
    const { data: itineraryDays } = await supabase
      .from('itinerary_days')
      .select(`
        date,
        activities (
          title,
          start_time,
          duration_minutes,
          location,
          type,
          description
        )
      `)
      .eq('trip_id', context.tripId)
      .order('date', { ascending: true })

    // Format itinerary for email
    const itinerary = itineraryDays?.map(day => ({
      date: day.date,
      activities: day.activities.map(activity => ({
        time: new Date(activity.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        title: activity.title,
        location: activity.location,
        duration: activity.duration_minutes ? `${activity.duration_minutes} minutes` : undefined,
        type: activity.type as 'meeting' | 'transport' | 'meal' | 'activity' | 'accommodation',
        description: activity.description
      }))
    })) || []

    // Get transportation and accommodation details
    const { data: trip } = await supabase
      .from('trips')
      .select('step_data')
      .eq('id', context.tripId)
      .single()

    const stepData = trip?.step_data || {}

    const guestItineraryData: GuestItineraryData = {
      guestName: participant.full_name,
      guestEmail: participant.email,
      tripTitle: context.tripTitle,
      tripAccessCode: context.tripAccessCode,
      tripStartDate: context.tripStartDate,
      tripEndDate: context.tripEndDate,
      createdBy: context.createdBy,
      itinerary,
      accommodation: stepData.accommodation ? {
        name: stepData.accommodation.name,
        address: stepData.accommodation.address,
        phone: stepData.accommodation.phone,
        checkIn: stepData.accommodation.checkIn,
        checkOut: stepData.accommodation.checkOut
      } : undefined,
      transportation: stepData.transportation ? {
        type: stepData.transportation.type,
        details: stepData.transportation.details,
        arrivalTime: stepData.transportation.arrivalTime,
        departureTime: stepData.transportation.departureTime
      } : undefined,
      emergencyContacts: [
        {
          name: context.createdBy,
          role: 'Trip Organizer',
          email: context.createdByEmail
        },
        {
          name: 'Wolthers Travel Emergency',
          role: 'Emergency Support',
          email: 'trips@trips.wolthers.com',
          phone: '+55 11 99999-9999' // Could be made configurable
        }
      ],
      specialInstructions: stepData.specialInstructions
    }

    const result = await sendGuestItineraryEmail(participant.email, guestItineraryData)
    return { 
      success: result.success, 
      error: result.error,
      emailType: 'guest_itinerary' 
    }
  }

  /**
   * Send staff notification email
   */
  private static async sendStaffEmail(
    participant: any, 
    context: ParticipantEmailContext
  ): Promise<EmailResult> {
    const staffInvitationData: StaffInvitationEmailData = {
      inviterName: context.createdBy,
      inviterEmail: context.createdByEmail,
      newStaffName: participant.full_name,
      role: 'Staff Member',
      tripTitle: context.tripTitle,
      whatsApp: '+55 11 99999-9999' // Could be made configurable
    }

    const result = await sendStaffInvitationEmail(participant.email, staffInvitationData)
    return { 
      success: result.success, 
      error: result.error,
      emailType: 'staff_notification' 
    }
  }

  /**
   * Track email status in database
   */
  static async trackEmailStatus(
    tripId: string,
    participantId: string,
    emailType: string,
    status: 'sent' | 'failed',
    error?: string
  ): Promise<void> {
    const supabase = createServerSupabaseClient()
    
    try {
      // First update the trip_participants table
      await supabase
        .from('trip_participants')
        .update({
          email_sent: status === 'sent',
          email_sent_at: status === 'sent' ? new Date().toISOString() : null,
          email_type: emailType,
          email_error: error || null
        })
        .eq('trip_id', tripId)
        .eq('user_id', participantId)

      // Then insert into tracking table
      await supabase
        .from('trip_participant_emails')
        .insert({
          trip_id: tripId,
          participant_id: participantId,
          email_type: emailType,
          status,
          error_message: error,
          sent_at: status === 'sent' ? new Date().toISOString() : null
        })

      console.log(`📊 Email tracking: ${emailType} ${status} for participant ${participantId}`)
    } catch (dbError) {
      console.error('❌ Failed to track email status in database:', dbError)
      // Don't throw - email tracking failure shouldn't break participant addition
    }
  }

  /**
   * Send emails for multiple participants with comprehensive error handling
   */
  static async sendParticipantEmails(
    participantRoles: Array<{ participantId: string; role: string }>,
    context: ParticipantEmailContext
  ): Promise<{ success: boolean; results: EmailResult[]; errors: string[] }> {
    const results: EmailResult[] = []
    const errors: string[] = []

    console.log(`📧 Starting email sending for ${participantRoles.length} participants on trip: ${context.tripTitle}`)

    for (const { participantId, role } of participantRoles) {
      try {
        console.log(`📬 Sending ${role} email to participant: ${participantId}`)
        
        const result = await this.sendParticipantEmail(participantId, role, context)
        results.push(result)

        // Track email status in database
        if (result.emailType && result.emailType !== 'skipped_no_email' && result.emailType !== 'skipped_unknown_role') {
          await this.trackEmailStatus(
            context.tripId,
            participantId,
            result.emailType,
            result.success ? 'sent' : 'failed',
            result.error
          )
        }

        // Log results
        if (result.success) {
          if (result.emailType?.startsWith('skipped')) {
            console.log(`⚠️ Skipped email for participant ${participantId}: ${result.emailType}`)
          } else {
            console.log(`✅ Successfully sent ${result.emailType} email to participant ${participantId}`)
          }
        } else {
          console.error(`❌ Failed to send email to participant ${participantId}: ${result.error}`)
          errors.push(`${participantId} (${role}): ${result.error}`)
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error(`❌ Exception sending email to participant ${participantId}:`, error)
        
        results.push({ success: false, error: errorMsg })
        errors.push(`${participantId} (${role}): ${errorMsg}`)
        
        // Track failed email attempt
        await this.trackEmailStatus(
          context.tripId,
          participantId,
          'general_notification',
          'failed',
          errorMsg
        )
      }
    }

    // Final summary
    const successCount = results.filter(r => r.success).length
    const skipCount = results.filter(r => r.emailType?.startsWith('skipped')).length
    
    console.log(`📧 Email sending summary: ${successCount}/${participantRoles.length} successful, ${skipCount} skipped, ${errors.length} failed`)
    
    if (errors.length > 0) {
      console.error('❌ Email sending errors:', errors)
    }

    return {
      success: errors.length === 0,
      results,
      errors
    }
  }
}