import { NextRequest, NextResponse } from 'next/server'
import { trackActivityAdded, trackActivityDeleted, trackActivityModified, trackParticipantAdded } from '@/lib/trip-change-tracker'

/**
 * Test endpoint to simulate trip changes for testing the notification system
 */
export async function POST(request: NextRequest) {
  try {
    const { tripId, userId } = await request.json()

    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }

    console.log(`🧪 [Test Changes] Creating sample changes for trip ${tripId}`)

    const results = []

    // Test 1: Activity Added
    const addResult = await trackActivityAdded(
      tripId,
      {
        title: 'Coffee Cupping Session',
        start_time: '10:00 AM',
        location: 'Fazenda Santa Monica',
        duration: '2 hours'
      },
      userId,
      ['test@example.com', 'daniel@wolthers.com']
    )
    results.push({ test: 'Activity Added', success: addResult.success, error: addResult.error })

    // Test 2: Activity Modified (Time Change)
    const modifyResult = await trackActivityModified(
      tripId,
      {
        title: 'Farm Tour',
        start_time: '2:30 PM', // Changed from 2:00 PM
        location: 'Fazenda Boa Vista',
        duration: '3 hours'
      },
      {
        title: 'Farm Tour',
        start_time: '2:00 PM', // Original time
        location: 'Fazenda Boa Vista',
        duration: '3 hours'
      },
      userId,
      ['daniel@wolthers.com']
    )
    results.push({ test: 'Activity Time Changed', success: modifyResult.success, error: modifyResult.error })

    // Test 3: Activity Deleted
    const deleteResult = await trackActivityDeleted(
      tripId,
      {
        title: 'Processing Plant Visit',
        start_time: '4:00 PM',
        location: 'Local Processing Facility'
      },
      userId,
      ['daniel@wolthers.com']
    )
    results.push({ test: 'Activity Deleted', success: deleteResult.success, error: deleteResult.error })

    // Test 4: Participant Added
    const participantResult = await trackParticipantAdded(
      tripId,
      {
        full_name: 'Test Participant',
        email: 'test.participant@example.com',
        role: 'Guest'
      },
      userId
    )
    results.push({ test: 'Participant Added', success: participantResult.success, error: participantResult.error })

    const successCount = results.filter(r => r.success).length
    const errorCount = results.filter(r => !r.success).length

    console.log(`✅ [Test Changes] Created ${successCount} test changes, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Created ${successCount} test changes for trip ${tripId}`,
      results,
      next_steps: [
        'Wait a moment for changes to be recorded',
        'Call POST /api/notifications/trigger-daily to process notifications',
        'Check your email for change notifications'
      ]
    })

  } catch (error) {
    console.error('❌ [Test Changes] Error creating test changes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create test changes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to show test instructions
 */
export async function GET() {
  return NextResponse.json({
    system: 'Trip Change Notification Testing',
    description: 'Create sample trip changes to test the daily notification system',
    usage: {
      endpoint: 'POST /api/notifications/test-changes',
      body: {
        tripId: 'string (required) - The trip ID to create changes for',
        userId: 'string (optional) - The user ID creating the changes'
      }
    },
    test_flow: [
      '1. POST /api/notifications/test-changes with a valid tripId',
      '2. POST /api/notifications/trigger-daily to process notifications',
      '3. Check email for change notification summaries'
    ],
    sample_request: {
      tripId: 'your-trip-id-here',
      userId: 'your-user-id-here'
    }
  })
}