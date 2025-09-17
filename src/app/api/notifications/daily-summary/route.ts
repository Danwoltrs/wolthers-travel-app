import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { sendTripChangeNotificationEmail, TripChangeNotificationData } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [Daily Summary] Starting end-of-day notification processing...')

    // Create Supabase client with service role for background processing
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    )

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const yesterdayDate = yesterday.toISOString().split('T')[0] // YYYY-MM-DD format
    const todayDate = today.toISOString().split('T')[0]

    console.log(`📅 [Daily Summary] Processing changes from ${yesterdayDate}`)

    // Get all unnotified changes from yesterday
    const { data: changes, error: changesError } = await supabase
      .from('trip_changes')
      .select(`
        *,
        trips:trip_id (
          id,
          title,
          access_code,
          start_date,
          created_by,
          users:created_by (
            full_name,
            email
          )
        )
      `)
      .gte('created_at', `${yesterdayDate}T00:00:00Z`)
      .lt('created_at', `${todayDate}T00:00:00Z`)
      .is('notified_at', null)
      .order('trip_id')

    if (changesError) {
      console.error('❌ [Daily Summary] Error fetching changes:', changesError)
      return NextResponse.json({ error: 'Failed to fetch changes' }, { status: 500 })
    }

    if (!changes || changes.length === 0) {
      console.log('✅ [Daily Summary] No changes to process')
      return NextResponse.json({ 
        success: true, 
        message: 'No changes to process',
        processedTrips: 0,
        totalNotifications: 0
      })
    }

    console.log(`📊 [Daily Summary] Found ${changes.length} changes across trips`)

    // Group changes by trip
    const changesByTrip = changes.reduce((acc: any, change: any) => {
      const tripId = change.trip_id
      if (!acc[tripId]) {
        acc[tripId] = {
          trip: change.trips,
          changes: []
        }
      }
      acc[tripId].changes.push(change)
      return acc
    }, {})

    let processedTrips = 0
    let totalNotifications = 0
    let errorCount = 0
    const results: any[] = []

    // Process each trip
    for (const [tripId, tripData] of Object.entries(changesByTrip)) {
      const { trip, changes: tripChanges } = tripData as any
      
      console.log(`🎯 [Daily Summary] Processing ${tripChanges.length} changes for trip: ${trip.title}`)

      try {
        // Get all affected participants for this trip
        const affectedEmails = new Set<string>()
        
        // Collect all affected participants from changes
        tripChanges.forEach((change: any) => {
          if (change.affected_participants && Array.isArray(change.affected_participants)) {
            change.affected_participants.forEach((email: string) => affectedEmails.add(email))
          }
        })

        // If no specific affected participants, get all trip participants
        if (affectedEmails.size === 0) {
          const { data: participants } = await supabase
            .from('trip_participants')
            .select('users:user_id(email, full_name)')
            .eq('trip_id', tripId)

          if (participants) {
            participants.forEach((p: any) => {
              if (p.users?.email) {
                affectedEmails.add(p.users.email)
              }
            })
          }
        }

        console.log(`👥 [Daily Summary] Sending notifications to ${affectedEmails.size} participants`)

        // Create notification batch record
        const batchId = crypto.randomUUID()
        
        const { error: batchError } = await supabase
          .from('notification_batches')
          .insert({
            id: batchId,
            trip_id: tripId,
            batch_date: yesterdayDate,
            total_changes: tripChanges.length,
            recipients: Array.from(affectedEmails)
          })

        if (batchError) {
          console.error(`❌ [Daily Summary] Failed to create batch record:`, batchError)
        }

        // Prepare change data for email template
        const emailChanges = tripChanges.map((change: any) => ({
          type: change.change_type,
          description: formatChangeDescription(change.change_type, change.change_data),
          details: formatChangeDetails(change.change_data, change.old_data),
          time: change.change_data?.time || change.change_data?.start_time,
          location: change.change_data?.location || change.change_data?.address,
          previousValue: change.old_data ? extractPreviousValue(change.change_type, change.old_data) : undefined,
          newValue: change.change_data ? extractNewValue(change.change_type, change.change_data) : undefined
        }))

        // Send emails to each affected participant
        const emailResults = []
        
        for (const email of affectedEmails) {
          try {
            // Get participant name (try to find in trip participants first)
            const { data: participant } = await supabase
              .from('trip_participants')
              .select('users:user_id(full_name)')
              .eq('trip_id', tripId)
              .eq('users.email', email)
              .single()

            const recipientName = participant?.users?.full_name || email.split('@')[0]

            const emailData: TripChangeNotificationData = {
              tripTitle: trip.title,
              tripAccessCode: trip.access_code,
              tripDate: new Date(trip.start_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric', 
                month: 'long',
                day: 'numeric'
              }),
              organizerName: trip.users?.full_name || 'Trip Organizer',
              organizerEmail: trip.users?.email || 'trips@trips.wolthers.com',
              recipientName,
              recipientEmail: email,
              changes: emailChanges,
              summaryDate: yesterday.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
              }),
              totalChanges: tripChanges.length
            }

            const result = await sendTripChangeNotificationEmail(email, emailData)
            emailResults.push({
              email,
              success: result.success,
              error: result.error
            })

            if (result.success) {
              totalNotifications++
            } else {
              errorCount++
            }

            // Add delay between emails for rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000))

          } catch (emailError) {
            console.error(`❌ [Daily Summary] Failed to send email to ${email}:`, emailError)
            emailResults.push({
              email,
              success: false,
              error: emailError instanceof Error ? emailError.message : 'Unknown error'
            })
            errorCount++
          }
        }

        // Update batch record with email results
        await supabase
          .from('notification_batches')
          .update({
            email_results: emailResults
          })
          .eq('id', batchId)

        // Mark all changes as notified
        await supabase
          .from('trip_changes')
          .update({
            notified_at: new Date().toISOString(),
            notification_batch_id: batchId
          })
          .in('id', tripChanges.map((c: any) => c.id))

        results.push({
          tripId,
          tripTitle: trip.title,
          changesProcessed: tripChanges.length,
          notificationsSent: emailResults.filter(r => r.success).length,
          errors: emailResults.filter(r => !r.success).length
        })

        processedTrips++

      } catch (tripError) {
        console.error(`❌ [Daily Summary] Error processing trip ${tripId}:`, tripError)
        errorCount++
        results.push({
          tripId,
          tripTitle: trip.title,
          error: tripError instanceof Error ? tripError.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ [Daily Summary] Processing complete: ${processedTrips} trips, ${totalNotifications} notifications sent, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Processed ${processedTrips} trips with changes`,
      processedTrips,
      totalNotifications,
      errorCount,
      results
    })

  } catch (error) {
    console.error('❌ [Daily Summary] Critical error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process daily summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper functions to format change data for emails

function formatChangeDescription(changeType: string, changeData: any): string {
  switch (changeType) {
    case 'activity_added':
      return `New Activity Added: ${changeData.title || 'Untitled Activity'}`
    case 'activity_deleted':
      return `Activity Removed: ${changeData.title || 'Activity'}`
    case 'activity_modified':
      return `Activity Updated: ${changeData.title || 'Activity'}`
    case 'time_changed':
      return `Time Changed: ${changeData.title || 'Activity'}`
    case 'location_changed':
      return `Location Changed: ${changeData.title || 'Activity'}`
    case 'participant_added':
      return `Participant Added: ${changeData.name || 'New Participant'}`
    case 'participant_removed':
      return `Participant Removed: ${changeData.name || 'Participant'}`
    default:
      return `Trip Updated`
  }
}

function formatChangeDetails(changeData: any, oldData?: any): string {
  if (changeData.description) {
    return changeData.description
  }

  // Generate meaningful details based on available data
  const details = []
  
  if (changeData.time || changeData.start_time) {
    details.push(`Time: ${changeData.time || changeData.start_time}`)
  }
  
  if (changeData.location || changeData.address) {
    details.push(`Location: ${changeData.location || changeData.address}`)
  }
  
  if (changeData.duration) {
    details.push(`Duration: ${changeData.duration}`)
  }

  if (oldData && changeData) {
    const changes = []
    if (oldData.time !== changeData.time && changeData.time) {
      changes.push(`Time updated to ${changeData.time}`)
    }
    if (oldData.location !== changeData.location && changeData.location) {
      changes.push(`Location updated to ${changeData.location}`)
    }
    if (changes.length > 0) {
      return changes.join(', ')
    }
  }

  return details.length > 0 ? details.join(' • ') : 'Details updated'
}

function extractPreviousValue(changeType: string, oldData: any): string | undefined {
  switch (changeType) {
    case 'time_changed':
      return oldData?.time || oldData?.start_time
    case 'location_changed':
      return oldData?.location || oldData?.address
    default:
      return undefined
  }
}

function extractNewValue(changeType: string, changeData: any): string | undefined {
  switch (changeType) {
    case 'time_changed':
      return changeData?.time || changeData?.start_time
    case 'location_changed':
      return changeData?.location || changeData?.address
    default:
      return undefined
  }
}