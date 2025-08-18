/**
 * Test Activity Cleanup Utility
 * 
 * Provides functions to clean up orphaned test activities from trips
 */

export async function cleanupTestActivities(tripId: string): Promise<{
  success: boolean
  deletedCount: number
  deletedActivities?: Array<{
    id: string
    title: string
    date: string
    time: string
  }>
  error?: string
}> {
  try {
    console.log('🧹 [CleanupUtil] Starting test activity cleanup for trip:', tripId)

    const response = await fetch('/api/activities/cleanup-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tripId }),
      credentials: 'include'
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ [CleanupUtil] Cleanup failed:', data.error)
      return {
        success: false,
        deletedCount: 0,
        error: data.error || `HTTP ${response.status}`
      }
    }

    console.log('✅ [CleanupUtil] Cleanup successful:', data)
    return {
      success: true,
      deletedCount: data.deletedCount,
      deletedActivities: data.deletedActivities
    }

  } catch (error: any) {
    console.error('❌ [CleanupUtil] Cleanup error:', error)
    return {
      success: false,
      deletedCount: 0,
      error: error.message || 'Unknown error'
    }
  }
}