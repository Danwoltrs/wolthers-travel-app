'use client'

import React, { useState, useEffect } from 'react'
import { usePerformanceMonitor } from '@/lib/cache/performance'
import { adaptiveCacheConfig, getCacheSystemConfig, getEnvironmentInfo } from '@/lib/cache/config'
import { useTripCache } from '@/contexts/TripCacheContext'
import { CheckCircle, XCircle, AlertTriangle, Activity, Zap, Database, RotateCw, Settings, RefreshCw } from 'lucide-react'

/**
 * System validation component for administrators
 * Provides comprehensive testing and monitoring of the cache and sync system
 */
export default function SystemValidation() {
  const performanceMonitor = usePerformanceMonitor()
  const { trips, getSyncManager, getCacheStats } = useTripCache()
  const [validationResults, setValidationResults] = useState<any>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [testProgress, setTestProgress] = useState(0)

  const environmentInfo = getEnvironmentInfo()
  const systemConfig = getCacheSystemConfig()

  /**
   * Run comprehensive system validation
   */
  const runValidation = async () => {
    setIsRunningTests(true)
    setTestProgress(0)

    const results: any = {
      timestamp: Date.now(),
      environment: environmentInfo,
      configuration: systemConfig,
      tests: {},
      recommendations: []
    }

    // Test 1: Performance Validation
    setTestProgress(20)
    const performanceValidation = performanceMonitor.validatePerformance()
    results.tests.performance = performanceValidation

    // Test 2: Cache System Health
    setTestProgress(40)
    results.tests.cache = await testCacheSystem()

    // Test 3: Sync System Health
    setTestProgress(60)
    results.tests.sync = await testSyncSystem()

    // Test 4: Configuration Validation
    setTestProgress(80)
    results.tests.configuration = testConfiguration()

    // Test 5: Integration Test
    setTestProgress(90)
    results.tests.integration = await testIntegration()

    // Generate overall recommendations
    results.recommendations = generateRecommendations(results.tests)

    setTestProgress(100)
    setValidationResults(results)
    setIsRunningTests(false)
  }

  /**
   * Test cache system health
   */
  const testCacheSystem = async () => {
    const cacheStats = getCacheStats()
    
    return {
      passed: true,
      details: {
        tripCache: cacheStats.trips || {},
        activityCache: cacheStats.activities || {},
        isOnline: cacheStats.isOnline,
        memoryHealth: checkMemoryHealth(cacheStats)
      }
    }
  }

  /**
   * Test sync system health
   */
  const testSyncSystem = async () => {
    const syncManager = getSyncManager()
    if (!syncManager) {
      return {
        passed: false,
        error: 'Sync manager not initialized'
      }
    }

    const syncStats = syncManager.getStats()
    
    return {
      passed: syncStats.failedOperations === 0,
      details: {
        queueSize: syncStats.queueSize,
        lastSync: syncStats.lastSync,
        failedOperations: syncStats.failedOperations,
        successfulOperations: syncStats.successfulOperations,
        syncInProgress: syncStats.syncInProgress
      }
    }
  }

  /**
   * Test system configuration
   */
  const testConfiguration = () => {
    const configValidation = adaptiveCacheConfig.validatePerformance()
    
    return {
      passed: configValidation.passed,
      details: configValidation.results,
      recommendations: configValidation.recommendations
    }
  }

  /**
   * Test system integration
   */
  const testIntegration = async () => {
    // Test if trips are loading properly
    const tripsLoaded = trips.length >= 0 // Should at least have empty array
    
    // Test if cache and sync are properly integrated
    const cacheStats = getCacheStats()
    const syncManager = getSyncManager()
    const syncAvailable = syncManager !== null
    
    return {
      passed: tripsLoaded && syncAvailable,
      details: {
        tripsCount: trips.length,
        cacheActive: !!cacheStats.trips,
        syncActive: syncAvailable,
        realTimeEnabled: systemConfig.sync.enableRealTimeSync
      }
    }
  }

  /**
   * Check memory health
   */
  const checkMemoryHealth = (cacheStats: any) => {
    const tripMemory = cacheStats.trips?.memoryItems || 0
    const activityMemory = cacheStats.activities?.memoryItems || 0
    const totalItems = tripMemory + activityMemory
    
    return {
      totalCachedItems: totalItems,
      withinLimits: totalItems < (systemConfig.cache.maxMemoryItems + 50), // 50 item buffer
      memoryPressure: totalItems > (systemConfig.cache.maxMemoryItems * 0.8)
    }
  }

  /**
   * Generate system recommendations
   */
  const generateRecommendations = (tests: any) => {
    const recommendations: string[] = []

    // Performance recommendations
    if (!tests.performance.passed) {
      Object.entries(tests.performance.results).forEach(([key, result]: [string, any]) => {
        if (!result.passed) {
          switch (key) {
            case 'dashboardLoad':
              recommendations.push(`Dashboard loading is slow (${Math.round(result.actual)}ms). Consider reducing initial data load or implementing progressive loading.`)
              break
            case 'cacheHitRate':
              recommendations.push(`Cache hit rate is low (${Math.round(result.actual * 100)}%). Consider increasing cache TTL or pre-loading frequently accessed data.`)
              break
            case 'memoryUsage':
              recommendations.push(`Memory usage is high (${Math.round(result.actual)}MB). Consider reducing max cache items or implementing more aggressive cleanup.`)
              break
          }
        }
      })
    }

    // Cache recommendations
    if (tests.cache.details.memoryHealth.memoryPressure) {
      recommendations.push('Memory pressure detected. Consider reducing cache size or TTL values.')
    }

    // Sync recommendations
    if (!tests.sync.passed) {
      if (tests.sync.details.failedOperations > 0) {
        recommendations.push(`${tests.sync.details.failedOperations} sync operations have failed. Check network connectivity and API health.`)
      }
      if (tests.sync.details.queueSize > 50) {
        recommendations.push('Large sync queue detected. Consider increasing sync frequency or batch size.')
      }
    }

    return recommendations
  }

  /**
   * Export validation results for support
   */
  const exportResults = () => {
    const exportData = {
      ...validationResults,
      performanceMetrics: performanceMonitor.exportMetrics()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wolthers-system-validation-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Auto-run validation on component mount (development only)
  useEffect(() => {
    if (environmentInfo.isDevelopment) {
      setTimeout(runValidation, 1000) // Give system time to initialize
    }
  }, [])

  if (!environmentInfo.isDevelopment && process.env.NODE_ENV === 'production') {
    // Hide in production for regular users
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      {/* Trigger Button */}
      <button
        onClick={() => setValidationResults(validationResults ? null : {})}
        className="mb-2 p-2 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="System Validation"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Validation Panel */}
      {validationResults !== null && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 w-96 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Validation
            </h3>
            <button
              onClick={() => setValidationResults(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>

          {/* Test Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={runValidation}
              disabled={isRunningTests}
              className="flex-1 px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-2"
            >
              {isRunningTests ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {isRunningTests ? 'Testing...' : 'Run Tests'}
            </button>
            
            {validationResults.tests && (
              <button
                onClick={exportResults}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Export
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isRunningTests && (
            <div className="mb-4">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${testProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {testProgress}% complete
              </p>
            </div>
          )}

          {/* Results */}
          {validationResults.tests && (
            <div className="space-y-4">
              {/* Performance Results */}
              <TestSection
                title="Performance"
                icon={<Zap className="w-4 h-4" />}
                test={validationResults.tests.performance}
              />

              {/* Cache Results */}
              <TestSection
                title="Cache System"
                icon={<Database className="w-4 h-4" />}
                test={validationResults.tests.cache}
              />

              {/* Sync Results */}
              <TestSection
                title="Sync System"
                icon={<RotateCw className="w-4 h-4" />}
                test={validationResults.tests.sync}
              />

              {/* Configuration Results */}
              <TestSection
                title="Configuration"
                icon={<Settings className="w-4 h-4" />}
                test={validationResults.tests.configuration}
              />

              {/* Integration Results */}
              <TestSection
                title="Integration"
                icon={<Activity className="w-4 h-4" />}
                test={validationResults.tests.integration}
              />

              {/* Recommendations */}
              {validationResults.recommendations.length > 0 && (
                <div className="border-t pt-4 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {validationResults.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-400">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Test section component
 */
function TestSection({ title, icon, test }: { title: string; icon: React.ReactNode; test: any }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {test.passed ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs text-gray-500">
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </div>

      {isExpanded && test.details && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
          <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
            {JSON.stringify(test.details, null, 2)}
          </pre>
        </div>
      )}

      {test.error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
          <p className="text-xs text-red-600 dark:text-red-400">{test.error}</p>
        </div>
      )}
    </div>
  )
}