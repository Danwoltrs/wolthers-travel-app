'use client'

import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Database, 
  Wifi, 
  WifiOff, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { getPerformanceMonitor } from '@/lib/performance/PerformanceMonitor'
import { getMemoryManager } from '@/lib/performance/MemoryManager'
import { useCacheMonitor } from '@/hooks/useSmartTrips'
import { useBackgroundSync } from '@/hooks/useBackgroundSync'

/**
 * Advanced Performance Dashboard for Development and Monitoring
 * Displays comprehensive performance metrics, alerts, and optimization controls
 */
export default function PerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'memory' | 'sync' | 'alerts' | 'tools'>('overview')
  const [performanceStats, setPerformanceStats] = useState<any>(null)
  const [memoryStats, setMemoryStats] = useState<any>(null)
  const [syncStats, setSyncStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const { getPerformanceMetrics } = useCacheMonitor()
  const { state: syncState, actions: syncActions } = useBackgroundSync()
  
  const performanceMonitor = getPerformanceMonitor()
  const memoryManager = getMemoryManager()

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const perfStats = performanceMonitor.getStats()
        const memStats = memoryManager.getMemoryStats()
        const cacheMetrics = getPerformanceMetrics()
        
        setPerformanceStats(perfStats)
        setMemoryStats(memStats)
        setSyncStats({
          ...syncState,
          cache: cacheMetrics
        })
        setAlerts(performanceMonitor.getActiveAlerts())
      } catch (error) {
        console.error('PerformanceDashboard: Failed to update metrics:', error)
      }
    }

    if (isVisible) {
      updateMetrics()
      
      if (autoRefresh) {
        const interval = setInterval(updateMetrics, 2000) // Update every 2 seconds
        return () => clearInterval(interval)
      }
    }
  }, [isVisible, autoRefresh, getPerformanceMetrics, syncState, performanceMonitor, memoryManager])

  // Subscribe to alerts
  useEffect(() => {
    const unsubscribe = performanceMonitor.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]) // Keep last 10 alerts
    })
    return unsubscribe
  }, [performanceMonitor])

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatTime = (ms: number | null) => {
    if (ms === null || ms === undefined) return 'Never'
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'critical': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />
      default: return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`mb-2 p-3 rounded-full shadow-lg transition-all duration-200 ${
          isVisible 
            ? 'bg-blue-700 text-white' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        title="Toggle Performance Dashboard"
      >
        <BarChart3 className="w-5 h-5" />
      </button>

      {isVisible && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl w-[600px] max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Performance Dashboard
              </h3>
              {performanceStats?.health && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(performanceStats.health)}`}>
                  {performanceStats.health.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-1 rounded ${autoRefresh ? 'text-green-600' : 'text-gray-400'}`}
                title={`Auto refresh ${autoRefresh ? 'on' : 'off'}`}
              >
                {autoRefresh ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'memory', label: 'Memory', icon: Database },
              { id: 'sync', label: 'Sync', icon: RefreshCw },
              { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
              { id: 'tools', label: 'Tools', icon: Settings }
            ].map(tab => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'alerts' && alerts.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {alerts.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* System Health */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Network</span>
                      {syncStats?.isOnline ? (
                        <Wifi className="w-4 h-4 text-green-600" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className={`text-lg font-bold ${syncStats?.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {syncStats?.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Sync Status</span>
                      {syncStats?.syncInProgress ? (
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {syncStats?.syncInProgress ? 'Syncing' : 'Ready'}
                    </p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Memory Usage:</span>
                      <span className="font-mono">
                        {memoryStats?.current ? formatBytes(memoryStats.current.heapUsed) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Queue Size:</span>
                      <span className="font-mono">{syncStats?.queueSize || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate:</span>
                      <span className="font-mono">
                        {syncStats?.cache?.cacheEffectiveness ? 
                          `${Math.round(syncStats.cache.cacheEffectiveness * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                      <span className="font-mono">
                        {formatTime(syncStats?.lastSyncTime)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {performanceStats?.recommendations && performanceStats.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Recommendations</h4>
                    <div className="space-y-1">
                      {performanceStats.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="space-y-4">
                {/* Memory Overview */}
                {memoryStats?.current && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Heap Used</span>
                        {getTrendIcon(memoryStats.trend?.trend)}
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatBytes(memoryStats.current.heapUsed)}
                      </p>
                      <p className="text-xs text-gray-500">
                        of {formatBytes(memoryStats.current.heapTotal)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Memory Pressure</span>
                        <span className={`w-2 h-2 rounded-full ${
                          memoryStats.trend?.memoryPressure === 'critical' ? 'bg-red-500' :
                          memoryStats.trend?.memoryPressure === 'high' ? 'bg-orange-500' :
                          memoryStats.trend?.memoryPressure === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                      </div>
                      <p className="text-lg font-bold capitalize text-gray-900 dark:text-gray-100">
                        {memoryStats.trend?.memoryPressure}
                      </p>
                    </div>
                  </div>
                )}

                {/* Memory Leaks */}
                {memoryStats?.leaks && memoryStats.leaks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Memory Leaks Detected
                    </h4>
                    <div className="space-y-1">
                      {memoryStats.leaks.slice(0, 3).map((leak: any, idx: number) => (
                        <div key={idx} className={`text-xs p-2 rounded ${
                          leak.severity === 'severe' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                          leak.severity === 'moderate' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                          'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                        }`}>
                          <div className="font-medium">{leak.component}</div>
                          <div>Growth: {formatBytes(leak.growthRate)}/min</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-4">
                {/* Sync Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Queue</span>
                      <Database className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {syncStats?.queueSize || 0}
                    </p>
                    <p className="text-xs text-gray-500">operations pending</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {syncStats?.successfulOperations && syncStats?.failedOperations ? 
                        `${Math.round((syncStats.successfulOperations / (syncStats.successfulOperations + syncStats.failedOperations)) * 100)}%` : 
                        'N/A'}
                    </p>
                  </div>
                </div>

                {/* Sync Actions */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => syncActions.forceSync()}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
                      disabled={syncStats?.syncInProgress}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Force Sync
                    </button>
                    <button
                      onClick={() => syncActions.clearQueue()}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Queue
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>No active alerts</p>
                  </div>
                ) : (
                  alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        alert.severity === 'critical'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : alert.severity === 'warning'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={() => performanceMonitor.resolveAlert(alert.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-4">
                {/* Memory Tools */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Memory Tools</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => memoryManager.forceCleanup()}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded text-sm hover:bg-green-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Force Cleanup
                    </button>
                    <button
                      onClick={() => memoryManager.takeSnapshot()}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Take Snapshot
                    </button>
                  </div>
                </div>

                {/* Cache Tools */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Cache Tools</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (typeof localStorage !== 'undefined') {
                          localStorage.clear()
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded text-sm hover:bg-orange-100 transition-colors"
                    >
                      <Database className="w-4 h-4" />
                      Clear Storage
                    </button>
                    <button
                      onClick={() => {
                        // Trigger manual GC if available
                        if (typeof (window as any).gc === 'function') {
                          (window as any).gc()
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded text-sm hover:bg-purple-100 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Trigger GC
                    </button>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Settings</h4>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Auto-refresh metrics</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Placeholder Camera component since it's not in the original icon set
const Camera = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)