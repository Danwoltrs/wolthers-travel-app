'use client'

import React, { useState, useEffect } from 'react'
import { useCacheMonitor } from '@/hooks/useSmartTrips'
import { getPerformanceIntegration } from '@/lib/performance/PerformanceIntegration'
import { Activity, Database, Wifi, WifiOff, Clock, TrendingUp, AlertTriangle } from 'lucide-react'

/**
 * Enhanced cache performance monitor with integrated performance system
 * Displays real-time cache statistics and comprehensive performance metrics
 */
export default function CachePerformanceMonitor() {
  const { getPerformanceMetrics } = useCacheMonitor()
  const [metrics, setMetrics] = useState<any>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const performanceIntegration = getPerformanceIntegration()

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const current = getPerformanceMetrics()
        const status = performanceIntegration.getSystemStatus()
        setMetrics(current)
        setSystemStatus(status)
      } catch (error) {
        console.error('CachePerformanceMonitor: Failed to update metrics:', error)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [getPerformanceMetrics, performanceIntegration])

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

            {/* System Health */}
            {systemStatus && (
              <div className="border-t pt-2 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span className="font-medium">System Health</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    systemStatus.overall === 'excellent' ? 'bg-green-100 text-green-700' :
                    systemStatus.overall === 'good' ? 'bg-blue-100 text-blue-700' :
                    systemStatus.overall === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {systemStatus.overall.toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  {systemStatus.alerts && systemStatus.alerts.length > 0 && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{systemStatus.alerts.length} active alerts</span>
                    </div>
                  )}
                  
                  <div className="text-gray-500">
                    Memory: {systemStatus.components?.memory?.status || 'unknown'}
                  </div>
                  <div className="text-gray-500">
                    Sync: {systemStatus.components?.sync?.status || 'unknown'}
                  </div>
                  
                  {systemStatus.recommendations && systemStatus.recommendations.length > 0 && (
                    <div className="mt-1 p-1 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
                      {systemStatus.recommendations[0]}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Targets */}
            <div className="border-t pt-2 dark:border-gray-600">
              <div className="text-xs space-y-1">
                <div className="font-medium text-gray-700 dark:text-gray-300">Targets:</div>
                <div className="text-gray-500">Dashboard Load: &lt;200ms</div>
                <div className="text-gray-500">Navigation: &lt;100ms</div>
                <div className="text-gray-500">Cache Hit Rate: &gt;80%</div>
                <div className="text-gray-500">Memory Usage: &lt;75%</div>
                <div className="text-gray-500">Sync Time: &lt;2s</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}