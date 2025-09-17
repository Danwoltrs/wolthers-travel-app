import { NextRequest, NextResponse } from 'next/server'

/**
 * Trigger the daily summary notifications manually
 * This endpoint can be called by cron jobs or for testing
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Trigger Daily] Manually triggering daily summary...')

    // Call the daily summary endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/notifications/daily-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ [Trigger Daily] Daily summary failed:', result)
      return NextResponse.json({
        success: false,
        error: 'Daily summary processing failed',
        details: result
      }, { status: 500 })
    }

    console.log('✅ [Trigger Daily] Daily summary completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Daily summary triggered successfully',
      result
    })

  } catch (error) {
    console.error('❌ [Trigger Daily] Error triggering daily summary:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger daily summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check the status of the daily notification system
 */
export async function GET() {
  try {
    // Return system status and configuration
    return NextResponse.json({
      system: 'Daily Trip Change Notifications',
      status: 'active',
      description: 'Sends end-of-day email summaries for trip changes',
      endpoints: {
        trigger: '/api/notifications/trigger-daily',
        process: '/api/notifications/daily-summary'
      },
      schedule: 'Recommended: Daily at 6 PM local time',
      features: [
        'Tracks activity additions, deletions, and modifications',
        'Monitors time and location changes',
        'Handles participant additions and removals',
        'Groups changes by trip and sends consolidated emails',
        'Respects affected participant lists for targeted notifications',
        'Rate-limited email sending to prevent API limits'
      ]
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}