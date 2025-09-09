// Distance Matrix Cache Service
// Caches Google Maps Distance Matrix API requests for 5-10 minutes to reduce quota usage

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface DistanceMatrixRequest {
  origins: string[]
  destinations: string[]
  mode?: string
  units?: string
}

class DistanceCache {
  private cache: Map<string, CacheEntry> = new Map()
  private defaultTTL = 7 * 60 * 1000 // 7 minutes in milliseconds
  private maxCacheSize = 1000 // Maximum number of cached entries

  // Generate a consistent cache key from request parameters
  private generateCacheKey(request: DistanceMatrixRequest): string {
    const { origins, destinations, mode = 'driving', units = 'metric' } = request
    
    // Sort origins and destinations to ensure consistent keys for equivalent requests
    const sortedOrigins = [...origins].sort()
    const sortedDestinations = [...destinations].sort()
    
    return `${sortedOrigins.join('|')}:${sortedDestinations.join('|')}:${mode}:${units}`
  }

  // Check if a cache entry is still valid
  private isValidEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  // Clean up expired entries
  private cleanupExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cached result if available and valid
  get(request: DistanceMatrixRequest): any | null {
    const key = this.generateCacheKey(request)
    const entry = this.cache.get(key)

    if (entry && this.isValidEntry(entry)) {
      console.log('🎯 [DistanceCache] Cache HIT for:', key.substring(0, 50) + '...')
      return entry.data
    }

    if (entry) {
      // Entry exists but is expired
      this.cache.delete(key)
      console.log('⏰ [DistanceCache] Cache EXPIRED for:', key.substring(0, 50) + '...')
    }

    console.log('❌ [DistanceCache] Cache MISS for:', key.substring(0, 50) + '...')
    return null
  }

  // Store result in cache
  set(request: DistanceMatrixRequest, data: any, customTTL?: number): void {
    // Clean up expired entries before adding new ones
    this.cleanupExpired()

    // If cache is getting too large, remove oldest entries
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKeys = Array.from(this.cache.keys()).slice(0, Math.floor(this.maxCacheSize * 0.2))
      oldestKeys.forEach(key => this.cache.delete(key))
      console.log(`🧹 [DistanceCache] Cleaned up ${oldestKeys.length} old entries`)
    }

    const key = this.generateCacheKey(request)
    const ttl = customTTL || this.defaultTTL
    
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    }

    this.cache.set(key, entry)
    console.log(`💾 [DistanceCache] Cached result for ${ttl / 60000} minutes:`, key.substring(0, 50) + '...')
  }

  // Get cache statistics
  getStats(): { size: number; hitRate: number; oldestEntry: number | null } {
    const now = Date.now()
    let oldestTimestamp = now
    let validEntries = 0

    for (const entry of this.cache.values()) {
      if (this.isValidEntry(entry)) {
        validEntries++
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp
        }
      }
    }

    return {
      size: validEntries,
      hitRate: 0, // Would need to track hits/misses to calculate this
      oldestEntry: validEntries > 0 ? Math.floor((now - oldestTimestamp) / 60000) : null
    }
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear()
    console.log('🗑️ [DistanceCache] Cache cleared')
  }

  // Clear expired entries manually
  cleanup(): void {
    const sizeBefore = this.cache.size
    this.cleanupExpired()
    const sizeAfter = this.cache.size
    console.log(`🧹 [DistanceCache] Cleanup removed ${sizeBefore - sizeAfter} expired entries`)
  }
}

// Create a singleton instance
const distanceCache = new DistanceCache()

// Export the singleton instance and types
export default distanceCache
export type { DistanceMatrixRequest, CacheEntry }

// Utility function to create cache-aware distance matrix requests
export async function cachedDistanceMatrixRequest(request: DistanceMatrixRequest): Promise<any> {
  // Check cache first
  const cachedResult = distanceCache.get(request)
  if (cachedResult) {
    return cachedResult
  }

  // Make API request if not cached
  try {
    const response = await fetch('/api/google-maps/distance-matrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Distance Matrix API request failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Cache the result with variable TTL based on distance
    // Longer distances get longer cache times (up to 10 minutes)
    // Shorter distances get shorter cache times (5 minutes minimum)
    const avgDistance = calculateAverageDistance(data)
    const cacheTTL = Math.max(5 * 60 * 1000, Math.min(10 * 60 * 1000, avgDistance / 10)) // 5-10 minutes
    
    distanceCache.set(request, data, cacheTTL)
    
    return data
  } catch (error) {
    console.error('❌ [DistanceCache] Failed to fetch distance matrix:', error)
    throw error
  }
}

// Helper function to calculate average distance from response
function calculateAverageDistance(data: any): number {
  if (!data.rows || data.rows.length === 0) return 50000 // Default 50km

  let totalDistance = 0
  let count = 0

  for (const row of data.rows) {
    for (const element of row.elements) {
      if (element.status === 'OK' && element.distance) {
        totalDistance += element.distance.value
        count++
      }
    }
  }

  return count > 0 ? totalDistance / count : 50000 // Default 50km if no valid distances
}

// Export cache statistics for monitoring
export function getCacheStats() {
  return distanceCache.getStats()
}

// Export cache management functions
export function clearCache() {
  distanceCache.clear()
}

export function cleanupCache() {
  distanceCache.cleanup()
}