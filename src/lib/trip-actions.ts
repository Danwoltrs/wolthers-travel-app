'use server'

import { revalidateTag } from 'next/cache'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { sendTripNotification } from '@/lib/send-trip-notification'
import { sendHostVisitConfirmationEmail, type HostVisitConfirmationData } from '@/lib/resend'

// Finalize or create a trip and revalidate caches
export async function createTrip(tripId: string, userId: string, clientMutationId?: string) {
  const supabase = createSupabaseServiceClient()

  if (clientMutationId) {
    const { error: mutationError } = await supabase
      .from('mutations')
      .insert({ id: clientMutationId, user_id: userId, operation: 'create_trip' })
      .select('id')
      .single()
    if (mutationError) {
      if (mutationError.code === '23505') {
        return null
      }
      throw new Error(mutationError.message)
    }
  }

  // Touch the trip record to ensure updated_at changes and data is persisted
  const { data, error } = await supabase
    .from('trips')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', tripId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag('trips')
  revalidateTag(`trips:user:${userId}`)
  await sendTripNotification({ type: 'created', tripId })
  return data
}

// Cancel a trip by setting its status to cancelled and revalidating caches
export async function cancelTrip(tripId: string, userId: string, clientMutationId?: string) {
  const supabase = createSupabaseServiceClient()

  if (clientMutationId) {
    const { error: mutationError } = await supabase
      .from('mutations')
      .insert({ id: clientMutationId, user_id: userId, operation: 'cancel_trip' })
      .select('id')
      .single()
    if (mutationError) {
      if (mutationError.code === '23505') {
        return { success: true }
      }
      throw new Error(mutationError.message)
    }
  }

  const { error } = await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', tripId)

  if (error) {
    throw new Error(error.message)
  }

  revalidateTag('trips')
  revalidateTag(`trips:user:${userId}`)
  await sendTripNotification({ type: 'cancelled', tripId })
  return { success: true }
}

// Finalize a trip schedule and notify relevant parties
export async function finalizeTripAndNotifyHosts(tripId: string, userId: string) {
  const supabase = createSupabaseServiceClient()

  console.log(`[Action] Finalizing trip ${tripId} by user ${userId}`)

  // 0. Fetch the user initiating the action to use as the inviter
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single()

  if (userError || !user || !user.email) {
    console.error(`[Action] Failed to fetch valid user data for inviter (ID: ${userId})`, userError)
    throw new Error('Action failed: A valid user with an email is required to send notifications.')
  }

  // 1. Update trip status to 'confirmed' and get the access code
  const { data: updatedTrip, error: updateError } = await supabase
    .from('trips')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', tripId)
    .select('id, title, access_code')
    .single()

  if (updateError) {
    console.error(`[Action] Failed to update trip status for ${tripId}:`, updateError)
    throw new Error(updateError.message)
  }

  console.log(`[Action] Trip ${tripId} status updated to confirmed.`)

  // 2. Fetch hosts and their associated meetings for this trip
  const { data: meetings, error: meetingsError } = await supabase
    .from('trip_meetings')
    .select(`
      id,
      meeting_date,
      start_time,
      companies (id, name, email),
      meeting_attendees(users(full_name))
    `)
    .eq('trip_id', tripId)
    .eq('is_supplier_meeting', true)

  if (meetingsError) {
    console.error(`[Action] Failed to fetch meetings for trip ${tripId}:`, meetingsError)
  }

  // 3. Trigger Host Confirmation Emails
  if (meetings && meetings.length > 0) {
    console.log(`[Action] Found ${meetings.length} host meetings to notify.`)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    for (const meeting of meetings) {
      if (!meeting.companies) continue

      const hostCompany = meeting.companies
      const hostEmail = hostCompany.email
      const hostName = hostCompany.name

      if (!hostEmail) {
        console.warn(`[Action] Skipping notification for company ${hostCompany.name} due to missing email.`)
        continue
      }

      const emailData: HostVisitConfirmationData = {
        hostName,
        companyName: hostCompany.name,
        tripTitle: updatedTrip.title,
        tripAccessCode: updatedTrip.access_code,
        visitDate: new Date(meeting.meeting_date).toLocaleDateString(),
        visitTime: meeting.start_time,
        guests: meeting.meeting_attendees.map((att: any) => att.users.full_name).filter(Boolean) || ['Wolthers Representatives'],
        inviterName: user.full_name || 'Wolthers Team',
        inviterEmail: user.email,
        yesUrl: `${baseUrl}/api/visit-response?meetingId=${meeting.id}&status=confirmed`,
        noUrl: `${baseUrl}/api/visit-response?meetingId=${meeting.id}&status=declined`,
      }

      await sendHostVisitConfirmationEmail(hostEmail, emailData)
    }
  }

  // 4. Revalidate caches
  revalidateTag('trips')
  revalidateTag(`trips:${tripId}`)
  revalidateTag(`trips:user:${userId}`)

  console.log(`[Action] Trip ${tripId} finalized and caches revalidated.`)

  return {
    success: true,
    message: `Trip ${updatedTrip.title} has been finalized.`,
    notifiedMeetings: meetings?.length || 0,
  }
}
