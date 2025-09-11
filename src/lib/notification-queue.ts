// Notification Queue System - Batches trip adjustments to prevent spam
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export interface QueuedNotification {
  id?: string
  trip_id: string
  trip_code: string
  notification_type: 'activity_added' | 'activity_updated' | 'activity_removed' | 'schedule_changed'
  change_details: {
    activity_title?: string
    activity_date?: string
    activity_time?: string
    change_type?: string
    old_value?: string
    new_value?: string
    description?: string
  }
  changed_by: string
  created_at: string
  scheduled_send_time: string // End of day
}

export interface DailyDigestData {
  tripId: string
  tripCode: string
  tripTitle: string
  participants: Array<{
    email: string
    name: string
  }>
  changes: QueuedNotification[]
  digestDate: string
}

export class NotificationQueue {
  private static async getEndOfDayTime(): Promise<Date> {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(18, 0, 0, 0) // 6 PM local time
    
    // If it's already past 6 PM, schedule for next day
    if (now > endOfDay) {
      endOfDay.setDate(endOfDay.getDate() + 1)
    }
    
    return endOfDay
  }

  static async queueTripAdjustmentNotification(notification: Omit<QueuedNotification, 'id' | 'created_at' | 'scheduled_send_time'>): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createSupabaseServiceClient()
      const scheduledTime = await this.getEndOfDayTime()
      
      console.log(`[NOTIFICATION QUEUE] Queuing trip adjustment notification for ${notification.trip_code} - will send at ${scheduledTime.toLocaleString()}`)
      
      const { error } = await supabase
        .from('notification_queue')
        .insert({
          ...notification,
          created_at: new Date().toISOString(),
          scheduled_send_time: scheduledTime.toISOString()
        })

      if (error) {
        console.error('[NOTIFICATION QUEUE] Failed to queue notification:', error)
        return { success: false, error: error.message }
      }

      console.log('[NOTIFICATION QUEUE] Notification queued successfully')
      return { success: true }

    } catch (error) {
      console.error('[NOTIFICATION QUEUE] Error queuing notification:', error)
      return { success: false, error: 'Failed to queue notification' }
    }
  }

  static async processPendingNotifications(): Promise<{ success: boolean; processed: number; error?: string }> {
    try {
      const supabase = createSupabaseServiceClient()
      const now = new Date()
      
      console.log('[NOTIFICATION QUEUE] Processing pending notifications...')
      
      // Get all pending notifications that are ready to send
      const { data: pendingNotifications, error: fetchError } = await supabase
        .from('notification_queue')
        .select('*')
        .lte('scheduled_send_time', now.toISOString())
        .eq('sent', false)
        .order('trip_id')
        .order('created_at')

      if (fetchError) {
        console.error('[NOTIFICATION QUEUE] Failed to fetch pending notifications:', fetchError)
        return { success: false, processed: 0, error: fetchError.message }
      }

      if (!pendingNotifications || pendingNotifications.length === 0) {
        console.log('[NOTIFICATION QUEUE] No pending notifications to process')
        return { success: true, processed: 0 }
      }

      // Group notifications by trip
      const notificationsByTrip = pendingNotifications.reduce((acc, notification) => {
        if (!acc[notification.trip_id]) acc[notification.trip_id] = []
        acc[notification.trip_id].push(notification)
        return acc
      }, {} as Record<string, QueuedNotification[]>)

      let processedCount = 0
      
      // Process each trip's notifications as a daily digest
      for (const [tripId, notifications] of Object.entries(notificationsByTrip)) {
        try {
          const digestData = await this.buildDailyDigest(tripId, notifications)
          if (digestData) {
            const emailResult = await this.sendDailyDigestEmail(digestData)
            
            if (emailResult.success) {
              // Mark notifications as sent
              const notificationIds = notifications.map(n => n.id).filter(Boolean)
              const { error: updateError } = await supabase
                .from('notification_queue')
                .update({ 
                  sent: true, 
                  sent_at: now.toISOString() 
                })
                .in('id', notificationIds)

              if (updateError) {
                console.error(`[NOTIFICATION QUEUE] Failed to mark notifications as sent for trip ${tripId}:`, updateError)
              } else {
                processedCount += notifications.length
                console.log(`[NOTIFICATION QUEUE] Successfully processed ${notifications.length} notifications for trip ${tripId}`)
              }
            } else {
              console.error(`[NOTIFICATION QUEUE] Failed to send digest email for trip ${tripId}:`, emailResult.error)
            }
          }
        } catch (error) {
          console.error(`[NOTIFICATION QUEUE] Error processing notifications for trip ${tripId}:`, error)
        }
      }

      console.log(`[NOTIFICATION QUEUE] Processing complete. Processed ${processedCount} notifications`)
      return { success: true, processed: processedCount }

    } catch (error) {
      console.error('[NOTIFICATION QUEUE] Error processing pending notifications:', error)
      return { success: false, processed: 0, error: 'Failed to process notifications' }
    }
  }

  private static async buildDailyDigest(tripId: string, notifications: QueuedNotification[]): Promise<DailyDigestData | null> {
    try {
      const supabase = createSupabaseServiceClient()
      
      // Fetch trip details
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          title,
          access_code,
          trip_participants (
            users (email, full_name),
            guest_name,
            guest_email
          )
        `)
        .eq('id', tripId)
        .single()

      if (error || !trip) {
        console.error('[NOTIFICATION QUEUE] Failed to fetch trip for digest:', error)
        return null
      }

      // Extract participant emails
      const participants = (trip.trip_participants || [])
        .map((p: any) => ({
          email: p.users?.email || p.guest_email || null,
          name: p.users?.full_name || p.guest_name || 'Guest'
        }))
        .filter((p: any) => p.email) // Only include participants with valid emails

      if (participants.length === 0) {
        console.log(`[NOTIFICATION QUEUE] No participants with emails found for trip ${tripId}`)
        return null
      }

      return {
        tripId,
        tripCode: trip.access_code,
        tripTitle: trip.title,
        participants,
        changes: notifications,
        digestDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }

    } catch (error) {
      console.error('[NOTIFICATION QUEUE] Error building daily digest:', error)
      return null
    }
  }

  private static async sendDailyDigestEmail(data: DailyDigestData): Promise<{ success: boolean; error?: string }> {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      const participantEmails = data.participants.map(p => p.email)
      const subject = `📋 Daily Update: ${data.changes.length} changes to ${data.tripCode}`
      
      // Group changes by type for better organization
      const changesByType = data.changes.reduce((acc, change) => {
        if (!acc[change.notification_type]) acc[change.notification_type] = []
        acc[change.notification_type].push(change)
        return acc
      }, {} as Record<string, QueuedNotification[]>)

      const getChangeIcon = (type: string) => {
        switch (type) {
          case 'activity_added': return '➕'
          case 'activity_updated': return '✏️'
          case 'activity_removed': return '❌'
          case 'schedule_changed': return '⏰'
          default: return '📝'
        }
      }

      const getChangeDescription = (type: string) => {
        switch (type) {
          case 'activity_added': return 'New Activities Added'
          case 'activity_updated': return 'Activities Modified'
          case 'activity_removed': return 'Activities Removed'
          case 'schedule_changed': return 'Schedule Changes'
          default: return 'Other Changes'
        }
      }

      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Trip Update - ${data.tripTitle}</title>
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e9ecef;">
            
            <!-- Header -->
            <div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #6366f1, #4f46e5);">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                📋 DAILY TRIP UPDATE
              </h1>
              <p style="color: #c7d2fe; margin: 10px 0 0; font-size: 16px;">
                Summary of changes made to your trip today
              </p>
            </div>
            
            <!-- Trip Info -->
            <div style="margin: 30px; padding: 20px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; color: white; text-align: center;">
              <h2 style="margin: 0 0 10px; font-size: 20px; font-weight: 700;">
                ${data.tripCode} - ${data.tripTitle}
              </h2>
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">
                ${data.changes.length} change${data.changes.length > 1 ? 's' : ''} made on ${data.digestDate}
              </p>
            </div>
            
            <!-- Changes by Type -->
            ${Object.entries(changesByType).map(([type, changes]) => `
              <div style="margin: 30px;">
                <h3 style="color: #1f2937; margin: 0 0 20px; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
                  <span style="margin-right: 10px; font-size: 20px;">${getChangeIcon(type)}</span>
                  ${getChangeDescription(type)} (${changes.length})
                </h3>
                
                ${changes.map((change, index) => `
                  <div style="margin-bottom: 15px; padding: 15px; background-color: ${index % 2 === 0 ? '#f8fafc' : '#f1f5f9'}; border-radius: 8px; border-left: 4px solid #6366f1;">
                    <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 10px;">
                      <h4 style="margin: 0; color: #1f2937; font-size: 16px; font-weight: 600; flex-grow: 1;">
                        ${change.change_details.activity_title || 'Schedule Change'}
                      </h4>
                      <span style="color: #6b7280; font-size: 12px; white-space: nowrap; margin-left: 15px;">
                        ${change.change_details.activity_date ? new Date(change.change_details.activity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        ${change.change_details.activity_time ? ` • ${change.change_details.activity_time}` : ''}
                      </span>
                    </div>
                    
                    ${change.change_details.description ? `
                      <p style="margin: 5px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
                        ${change.change_details.description}
                      </p>
                    ` : ''}
                    
                    ${change.change_details.old_value && change.change_details.new_value ? `
                      <div style="margin: 10px 0; padding: 10px; background-color: rgba(251, 146, 60, 0.1); border-radius: 6px;">
                        <p style="margin: 0; color: #92400e; font-size: 12px;">
                          <strong>Changed:</strong> "${change.change_details.old_value}" → "${change.change_details.new_value}"
                        </p>
                      </div>
                    ` : ''}
                    
                    <p style="margin: 10px 0 0; color: #6b7280; font-size: 12px;">
                      Changed by ${change.changed_by} • ${new Date(change.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                `).join('')}
              </div>
            `).join('')}
            
            <!-- Summary -->
            <div style="margin: 30px; padding: 20px; background-color: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
              <h3 style="margin: 0 0 10px; color: #065f46; font-size: 16px; font-weight: 600;">
                📊 Update Summary
              </h3>
              <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                Your trip itinerary has been updated with ${data.changes.length} change${data.changes.length > 1 ? 's' : ''} today. 
                All changes are now reflected in your trip dashboard and calendar exports.
              </p>
            </div>
            
            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px;">
              <a href="https://trips.wolthers.com/trips/${data.tripCode}" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 5px;">
                View Updated Itinerary
              </a>
              <a href="https://trips.wolthers.com/calendar/export/${data.tripCode}" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 0 5px;">
                Export to Calendar
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px; line-height: 1.6;">
                This is your daily digest of trip changes. Updates are sent once per day at 6 PM to prevent email spam.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 0; line-height: 1.6;">
                © ${new Date().getFullYear()} Wolthers & Associates • <a href="https://trips.wolthers.com" style="color: #6366f1; text-decoration: none;">trips.wolthers.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `

      const { data: emailData, error } = await resend.emails.send({
        from: 'Wolthers Travel Platform <noreply@trips.wolthers.com>',
        to: participantEmails,
        subject: subject,
        html: html,
      })

      if (error) {
        console.error('[NOTIFICATION QUEUE] Failed to send daily digest email:', error)
        return { success: false, error: error.message }
      }

      console.log(`[NOTIFICATION QUEUE] Daily digest email sent successfully:`, emailData?.id)
      return { success: true }

    } catch (error) {
      console.error('[NOTIFICATION QUEUE] Error sending daily digest email:', error)
      return { success: false, error: 'Failed to send daily digest email' }
    }
  }

  // Utility method to create the notification_queue table if it doesn't exist
  static async ensureQueueTableExists(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createSupabaseServiceClient()
      
      // Check if table exists, if not this will create it via migration
      const { error } = await supabase
        .from('notification_queue')
        .select('id')
        .limit(1)

      if (error && error.message.includes('relation "notification_queue" does not exist')) {
        console.log('[NOTIFICATION QUEUE] Table does not exist, needs to be created via migration')
        return { success: false, error: 'notification_queue table needs to be created' }
      }

      return { success: true }

    } catch (error) {
      console.error('[NOTIFICATION QUEUE] Error checking queue table:', error)
      return { success: false, error: 'Failed to check queue table' }
    }
  }
}

export default NotificationQueue