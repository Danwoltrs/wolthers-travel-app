'use client'

import React, { useState, useEffect } from 'react'
import { useCacheMonitor } from '@/hooks/useSmartTrips'
import { Activity, Database, Wifi, WifiOff, Clock, TrendingUp } from 'lucide-react'

/**
 * Development-only component for monitoring cache performance
 * Displays real-time cache statistics and performance metrics
 */
export default function CachePerformanceMonitor() {
  const { getPerformanceMetrics } = useCacheMonitor()
  const [metrics, setMetrics] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateMetrics = () => {
      const current = getPerformanceMetrics()
      setMetrics(current)
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 1000) // Update every second

    return () => clearInterval(interval)
  }, [getPerformanceMetrics])

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null
  if (!metrics) return null

  const formatTime = (ms: number | null) => {
    if (ms === null) return 'Never'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}m`
  }

  const getCacheEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.8) return 'text-green-600'
    if (efficiency >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Toggle Cache Monitor"
      >
        <Activity className="w-4 h-4" />
      </button>

      {isVisible && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cache Performance</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {metrics.isOnline ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                Network
              </span>
              <span className={metrics.isOnline ? 'text-green-600' : 'text-red-600'}>
                {metrics.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Trip Cache Stats */}
            <div className="border-t pt-2 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Trip Cache</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Memory Items:</span>
                  <span className="ml-1 font-mono">{metrics.trips?.memoryItems || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fresh:</span>
                  <span className="ml-1 font-mono text-green-600">{metrics.trips?.fresh || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Stale:</span>
                  <span className="ml-1 font-mono text-yellow-600">{metrics.trips?.stale || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Expired:</span>
                  <span className="ml-1 font-mono text-red-600">{metrics.trips?.expired || 0}</span>
                </div>
              </div>
            </div>

            {/* Activity Cache Stats */}
            <div className="border-t pt-2 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="font-medium">Activity Cache</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Memory Items:</span>
                  <span className="ml-1 font-mono">{metrics.activities?.memoryItems || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fresh:</span>
                  <span className="ml-1 font-mono text-green-600">{metrics.activities?.fresh || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Stale:</span>
                  <span className="ml-1 font-mono text-yellow-600">{metrics.activities?.stale || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Expired:</span>
                  <span className="ml-1 font-mono text-red-600">{metrics.activities?.expired || 0}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="border-t pt-2 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium">Performance</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cache Efficiency:</span>
                  <span className={`font-mono ${getCacheEfficiencyColor(metrics.cacheEffectiveness)}`}>
                    {Math.round(metrics.cacheEffectiveness * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Refresh:</span>
                  <span className="font-mono text-gray-600">
                    {formatTime(metrics.lastRefreshAge)}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Targets */}
            <div className="border-t pt-2 dark:border-gray-600">
              <div className="text-xs space-y-1">
                <div className="font-medium text-gray-700 dark:text-gray-300">Targets:</div>
                <div className="text-gray-500">Dashboard Load: &lt;200ms</div>
                <div className="text-gray-500">Navigation: &lt;100ms</div>
                <div className="text-gray-500">Cache Hit Rate: &gt;80%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}