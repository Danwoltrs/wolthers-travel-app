/**
 * Production-ready configuration for the smart caching and sync system
 * Environment-aware settings with optimized defaults
 */

import { performanceOptimizer } from './performance'

export interface CacheSystemConfig {
  // Cache Configuration
  cache: {
    freshTTL: number
    staleTTL: number
    maxMemoryItems: number
    storageKeyPrefix: string
    enableCompression: boolean
    enableMetrics: boolean
  }
  
  // Sync Configuration  
  sync: {
    syncInterval: number
    retryAttempts: number
    batchSize: number
    conflictStrategy: 'server_wins' | 'client_wins' | 'merge' | 'prompt_user'
    enableRealTimeSync: boolean
    enableBackgroundSync: boolean
    maxQueueSize: number
  }
  
  // Performance Configuration
  performance: {
    enableOptimization: boolean
    enableMonitoring: boolean
    targetMetrics: {
      dashboardLoadTime: number
      navigationTime: number
      cacheHitRate: number
      maxMemoryUsage: number
    }
    autoTuning: boolean
  }
  
  // Development Configuration
  development: {
    enableDebugMode: boolean
    enablePerformanceMonitor: boolean
    enableVerboseLogging: boolean
    simulateSlowNetwork: boolean
    simulateOfflineMode: boolean
  }
}

/**
 * Environment-specific configurations
 */
const DEVELOPMENT_CONFIG: CacheSystemConfig = {
  cache: {
    freshTTL: 2 * 60 * 1000,    // 2 minutes (shorter for development)
    staleTTL: 5 * 60 * 1000,    // 5 minutes
    maxMemoryItems: 50,         // Smaller cache for development
    storageKeyPrefix: 'wolthers-dev',
    enableCompression: false,   // Disable compression for debugging
    enableMetrics: true
  },
  
  sync: {
    syncInterval: 10 * 1000,    // 10 seconds (more frequent)
    retryAttempts: 2,           // Fewer retries
    batchSize: 5,               // Smaller batches
    conflictStrategy: 'merge',
    enableRealTimeSync: true,
    enableBackgroundSync: true,
    maxQueueSize: 100
  },
  
  performance: {
    enableOptimization: false,  // Disable in dev for debugging
    enableMonitoring: true,
    targetMetrics: {
      dashboardLoadTime: 500,   // More relaxed targets
      navigationTime: 200,
      cacheHitRate: 0.7,
      maxMemoryUsage: 100 * 1024 * 1024 // 100MB
    },
    autoTuning: false
  },
  
  development: {
    enableDebugMode: true,
    enablePerformanceMonitor: true,
    enableVerboseLogging: true,
    simulateSlowNetwork: false,
    simulateOfflineMode: false
  }
}

const PRODUCTION_CONFIG: CacheSystemConfig = {
  cache: {
    freshTTL: 5 * 60 * 1000,    // 5 minutes
    staleTTL: 15 * 60 * 1000,   // 15 minutes  
    maxMemoryItems: 100,        // Standard cache size
    storageKeyPrefix: 'wolthers',
    enableCompression: true,    // Enable compression for storage efficiency
    enableMetrics: true
  },
  
  sync: {
    syncInterval: 30 * 1000,    // 30 seconds
    retryAttempts: 3,
    batchSize: 10,
    conflictStrategy: 'merge',
    enableRealTimeSync: true,
    enableBackgroundSync: true,
    maxQueueSize: 1000
  },
  
  performance: {
    enableOptimization: true,   // Enable all optimizations
    enableMonitoring: true,
    targetMetrics: {
      dashboardLoadTime: 200,   // Strict production targets
      navigationTime: 100,
      cacheHitRate: 0.85,
      maxMemoryUsage: 50 * 1024 * 1024 // 50MB
    },
    autoTuning: true           // Enable auto-tuning
  },
  
  development: {
    enableDebugMode: false,
    enablePerformanceMonitor: false, // Disable in production UI
    enableVerboseLogging: false,
    simulateSlowNetwork: false,
    simulateOfflineMode: false
  }
}

const STAGING_CONFIG: CacheSystemConfig = {
  ...PRODUCTION_CONFIG,
  
  // Staging-specific overrides
  cache: {
    ...PRODUCTION_CONFIG.cache,
    storageKeyPrefix: 'wolthers-staging'
  },
  
  development: {
    ...PRODUCTION_CONFIG.development,
    enableDebugMode: true,      // Enable debugging in staging
    enablePerformanceMonitor: true,
    enableVerboseLogging: true
  }
}

/**
 * Get configuration based on environment
 */
export function getCacheSystemConfig(): CacheSystemConfig {
  const env = process.env.NODE_ENV
  const customEnv = process.env.NEXT_PUBLIC_APP_ENV
  
  switch (customEnv || env) {
    case 'development':
      return DEVELOPMENT_CONFIG
    case 'staging':
      return STAGING_CONFIG  
    case 'production':
      return PRODUCTION_CONFIG
    default:
      console.warn(`Unknown environment: ${env}. Using development config.`)
      return DEVELOPMENT_CONFIG
  }
}

/**
 * Dynamic configuration that adapts based on performance metrics
 */
export class AdaptiveCacheConfig {
  private baseConfig: CacheSystemConfig
  private lastOptimization: number = 0
  private readonly OPTIMIZATION_INTERVAL = 5 * 60 * 1000 // 5 minutes

  constructor(baseConfig?: CacheSystemConfig) {
    this.baseConfig = baseConfig || getCacheSystemConfig()
  }

  /**
   * Get current configuration, potentially optimized based on performance
   */
  getConfig(): CacheSystemConfig {
    if (!this.baseConfig.performance.autoTuning) {
      return this.baseConfig
    }

    const now = Date.now()
    if (now - this.lastOptimization < this.OPTIMIZATION_INTERVAL) {
      return this.baseConfig
    }

    // Get optimized settings from performance optimizer
    const optimized = performanceOptimizer.getOptimizedCacheConfig()
    this.lastOptimization = now

    return {
      ...this.baseConfig,
      cache: {
        ...this.baseConfig.cache,
        freshTTL: optimized.freshTTL,
        staleTTL: optimized.staleTTL,
        maxMemoryItems: optimized.maxMemoryItems
      },
      sync: {
        ...this.baseConfig.sync,
        syncInterval: optimized.syncInterval
      }
    }
  }

  /**
   * Update base configuration
   */
  updateConfig(updates: Partial<CacheSystemConfig>): void {
    this.baseConfig = {
      ...this.baseConfig,
      ...updates,
      cache: { ...this.baseConfig.cache, ...updates.cache },
      sync: { ...this.baseConfig.sync, ...updates.sync },
      performance: { ...this.baseConfig.performance, ...updates.performance },
      development: { ...this.baseConfig.development, ...updates.development }
    }
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.baseConfig = getCacheSystemConfig()
    this.lastOptimization = 0
  }

  /**
   * Get performance validation results
   */
  validatePerformance(): {
    passed: boolean
    results: Record<string, any>
    recommendations: string[]
  } {
    const validation = performanceOptimizer.validatePerformance()
    const metrics = performanceOptimizer.getMetrics()
    
    return {
      passed: validation.passed,
      results: validation.results,
      recommendations: metrics.recommendations
    }
  }
}

// Export singleton instance
export const adaptiveCacheConfig = new AdaptiveCacheConfig()

/**
 * Configuration validation utilities
 */
export function validateConfig(config: CacheSystemConfig): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate TTL values
  if (config.cache.freshTTL >= config.cache.staleTTL) {
    errors.push('freshTTL must be less than staleTTL')
  }

  if (config.cache.freshTTL < 1000) {
    warnings.push('freshTTL is very short (<1s), may cause excessive API calls')
  }

  if (config.cache.staleTTL > 60 * 60 * 1000) {
    warnings.push('staleTTL is very long (>1h), data may become very stale')
  }

  // Validate memory limits
  if (config.cache.maxMemoryItems < 10) {
    warnings.push('maxMemoryItems is very low (<10), may hurt performance')
  }

  if (config.cache.maxMemoryItems > 1000) {
    warnings.push('maxMemoryItems is very high (>1000), may use excessive memory')
  }

  // Validate sync settings
  if (config.sync.syncInterval < 5000) {
    warnings.push('syncInterval is very frequent (<5s), may cause server load')
  }

  if (config.sync.batchSize > 50) {
    warnings.push('batchSize is very large (>50), may cause long request times')
  }

  // Validate performance targets
  const targets = config.performance.targetMetrics
  if (targets.dashboardLoadTime < 50) {
    warnings.push('dashboardLoadTime target is very aggressive (<50ms)')
  }

  if (targets.cacheHitRate > 0.98) {
    warnings.push('cacheHitRate target is very high (>98%), may be unrealistic')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Environment detection utilities
 */
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    appEnv: process.env.NEXT_PUBLIC_APP_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isStaging: process.env.NEXT_PUBLIC_APP_ENV === 'staging',
    supportsServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    supportsPerformanceAPI: typeof performance !== 'undefined' && 'memory' in performance,
    isOnline: typeof navigator !== 'undefined' && navigator.onLine
  }
}