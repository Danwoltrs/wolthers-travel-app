import { NextRequest, NextResponse } from 'next/server'
import { getCacheStats, clearCache, cleanupCache } from '@/lib/distance-cache'

export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats()
    
    return NextResponse.json({
      cache: {
        ...stats,
        status: 'active',
        description: 'Distance Matrix API cache statistics'
      },
      endpoints: {
        'GET /api/google-maps/cache': 'Get cache statistics',
        'POST /api/google-maps/cache': 'Manage cache (clear, cleanup)',
        'DELETE /api/google-maps/cache': 'Clear all cache entries'
      }
    })
  } catch (error) {
    console.error('Cache stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'cleanup':
        cleanupCache()
        return NextResponse.json({ 
          message: 'Cache cleanup completed',
          stats: getCacheStats()
        })

      case 'clear':
        clearCache()
        return NextResponse.json({ 
          message: 'Cache cleared successfully',
          stats: getCacheStats()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "cleanup" or "clear"' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cache management error:', error)
    return NextResponse.json(
      { error: 'Cache management operation failed' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    clearCache()
    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      stats: getCacheStats()
    })
  } catch (error) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}