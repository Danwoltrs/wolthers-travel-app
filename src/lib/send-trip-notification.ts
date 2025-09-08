import { Resend } from 'resend'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { sendGuestInvitationEmail } from '@/lib/email'
import readline from 'readline'

const resend = new Resend(process.env.RESEND_API_KEY)

interface Params {
  type: 'created' | 'cancelled' | 'invited'
  tripId: string
  inviteEmail?: string
}

function formatDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : ''
}

async function promptForCancellation(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question('Send cancellation email to all stakeholders? (y/N) ', answer => {
      rl.close()
      resolve(/^y(es)?$/i.test(answer.trim()))
    })
  })
}

export async function sendTripNotification({ type, tripId, inviteEmail }: Params) {
  const supabase = createSupabaseServiceClient()
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`id, name, start_date, end_date, trip_participants (
        role,
        users:users!trip_participants_user_id_fkey(email),
        guest_email
      )`)
    .eq('id', tripId)
    .single()

  if (error || !trip) {
    console.error('Failed to load trip for notifications', error)
    return { success: false }
  }

  if (type === 'invited' && inviteEmail) {
    try {
      await sendGuestInvitationEmail({
        to: inviteEmail,
        tripTitle: trip.name,
        tripStartDate: trip.start_date,
        tripEndDate: trip.end_date,
        invitedBy: 'Wolthers Travel',
        tripId: trip.id,
        variant: 'driver'
      })
      return { success: true }
    } catch (err) {
      console.error('Error sending invitation', err)
      return { success: false }
    }
  }

  const emails = (trip.trip_participants || [])
    .map((p: any) => p.users?.email || p.guest_email)
    .filter(Boolean)

  if (emails.length === 0) {
    console.log('No stakeholder emails found for trip', tripId)
    return { success: false }
  }

  if (type === 'cancelled') {
    const confirmed = await promptForCancellation()
    if (!confirmed) {
      console.log('Cancellation notification not sent')
      return { success: false }
    }
  }

  const subject = type === 'created'
    ? `New Trip Created: ${trip.name}`
    : `Trip Cancelled: ${trip.name}`

  const html = type === 'created'
    ? `<p>A new trip has been created.</p><p><strong>${trip.name}</strong></p><p>${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}</p>`
    : `<p>The trip <strong>${trip.name}</strong> scheduled for ${formatDate(trip.start_date)} - ${formatDate(trip.end_date)} has been cancelled.</p>`

  try {
    await resend.emails.send({
      from: 'Wolthers Travel Platform <noreply@trips.wolthers.com>',
      to: emails,
      subject,
      html,
    })
    return { success: true }
  } catch (err) {
    console.error('Error sending trip notification', err)
    return { success: false }
  }
}
