// Cron job to process queued notifications (runs daily at 6 PM)
import { NextRequest, NextResponse } from 'next/server'
import { default as NotificationQueue } from '@/lib/notification-queue'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (basic security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[CRON] Unauthorized cron request')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CRON] Starting notification queue processing...')

    // Process all pending notifications
    const result = await NotificationQueue.processPendingNotifications()

    if (result.success) {
      console.log(`[CRON] Successfully processed ${result.processed} notifications`)
      return NextResponse.json({ 
        success: true, 
        processed: result.processed,
        message: `Processed ${result.processed} notifications successfully`
      })
    } else {
      console.error('[CRON] Failed to process notifications:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        processed: result.processed
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[CRON] Error in notification processing cron job:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process notification queue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also support POST for manual trigger
export async function POST(request: NextRequest) {
  try {
    console.log('[MANUAL] Manual trigger for notification queue processing...')

    // Verify authentication for manual triggers
    const authToken = request.cookies.get('auth-token')?.value
    if (!authToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Process all pending notifications
    const result = await NotificationQueue.processPendingNotifications()

    if (result.success) {
      console.log(`[MANUAL] Successfully processed ${result.processed} notifications`)
      return NextResponse.json({ 
        success: true, 
        processed: result.processed,
        message: `Manually processed ${result.processed} notifications`
      })
    } else {
      console.error('[MANUAL] Failed to process notifications:', result.error)
      return NextResponse.json({ 
        success: false, 
        error: result.error,
        processed: result.processed
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[MANUAL] Error in manual notification processing:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process notification queue',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}