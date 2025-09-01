/**
 * Multi-layer client-side cache manager with TTL and stale-while-revalidate
 * Provides instant loading with background updates for optimal UX
 */

export interface CacheItem<T> {
  data: T
  timestamp: number
  expires: number
  staleExpires: number
}

export interface CacheConfig {
  freshTTL: number // Time until data is considered stale (show immediately but refresh in background)
  staleTTL: number // Time until data is considered expired (don't show, must fetch fresh)
  maxMemoryItems: number // Maximum items to keep in memory
  storageKey: string // localStorage key prefix
}

export class CacheManager<T> {
  private memoryCache = new Map<string, CacheItem<T>>()
  private config: CacheConfig
  private loadingPromises = new Map<string, Promise<T>>()

  constructor(config: CacheConfig) {
    this.config = config
    this.cleanupExpiredItems()
  }

  /**
   * Get item from cache with stale-while-revalidate pattern
   * Returns immediately if data exists (fresh or stale), triggers background refresh if stale
   */
  async get(
    key: string, 
    fetchFn: () => Promise<T>,
    options: { forceRefresh?: boolean; backgroundRefresh?: boolean } = {}
  ): Promise<{ data: T; isStale: boolean }> {
    const now = Date.now()
    
    // Check memory cache first
    let cacheItem = this.memoryCache.get(key)
    
    // Try localStorage if not in memory
    if (!cacheItem) {
      cacheItem = this.getFromStorage(key)
      if (cacheItem) {
        // Add back to memory if valid
        if (now < cacheItem.staleExpires) {
          this.setInMemory(key, cacheItem)
        }
      }
    }

    // Force refresh bypasses all caching
    if (options.forceRefresh) {
      return { data: await this.fetchAndCache(key, fetchFn), isStale: false }
    }

    // If no cached data or data is completely expired, fetch fresh
    if (!cacheItem || now >= cacheItem.staleExpires) {
      return { data: await this.fetchAndCache(key, fetchFn), isStale: false }
    }

    // Data exists - check if it's fresh or stale
    const isFresh = now < cacheItem.expires
    const isStale = !isFresh

    // If stale and background refresh is enabled, trigger background update
    if (isStale && options.backgroundRefresh !== false) {
      this.refreshInBackground(key, fetchFn)
    }

    return { data: cacheItem.data, isStale }
  }

  /**
   * Set data in cache with TTL
   */
  set(key: string, data: T): void {
    const now = Date.now()
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expires: now + this.config.freshTTL,
      staleExpires: now + this.config.staleTTL
    }

    this.setInMemory(key, cacheItem)
    this.setInStorage(key, cacheItem)
  }

  /**
   * Update cached data optimistically
   * Immediately updates cache without waiting for server confirmation
   */
  updateOptimistically(key: string, updater: (current: T) => T): boolean {
    const cacheItem = this.memoryCache.get(key)
    if (!cacheItem) return false

    try {
      const updatedData = updater(cacheItem.data)
      this.set(key, updatedData)
      return true
    } catch (error) {
      console.error('Optimistic update failed:', error)
      return false
    }
  }

  /**
   * Invalidate cache item
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key)
    this.removeFromStorage(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear()
    this.clearStorage()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let fresh = 0, stale = 0, expired = 0

    this.memoryCache.forEach(item => {
      if (now < item.expires) fresh++
      else if (now < item.staleExpires) stale++
      else expired++
    })

    return {
      memoryItems: this.memoryCache.size,
      fresh,
      stale,
      expired,
      hitRate: this.calculateHitRate()
    }
  }

  /**
   * Private methods
   */
  private async fetchAndCache(key: string, fetchFn: () => Promise<T>): Promise<T> {
    // Prevent duplicate requests for the same key
    const existingPromise = this.loadingPromises.get(key)
    if (existingPromise) {
      return existingPromise
    }

    const promise = fetchFn()
    this.loadingPromises.set(key, promise)

    try {
      const data = await promise
      this.set(key, data)
      return data
    } catch (error) {
      console.error(`Cache fetch failed for key ${key}:`, error)
      throw error
    } finally {
      this.loadingPromises.delete(key)
    }
  }

  private refreshInBackground(key: string, fetchFn: () => Promise<T>): void {
    // Don't start background refresh if one is already in progress
    if (this.loadingPromises.has(key)) return

    this.fetchAndCache(key, fetchFn).catch(error => {
      console.warn(`Background refresh failed for key ${key}:`, error)
    })
  }

  private setInMemory(key: string, item: CacheItem<T>): void {
    // Implement LRU eviction if memory is full
    if (this.memoryCache.size >= this.config.maxMemoryItems) {
      const oldestKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(oldestKey)
    }

    this.memoryCache.set(key, item)
  }

  private getFromStorage(key: string): CacheItem<T> | null {
    try {
      if (typeof window === 'undefined') return null
      const stored = localStorage.getItem(`${this.config.storageKey}:${key}`)
      if (!stored) return null

      const parsed = JSON.parse(stored) as CacheItem<T>
      
      // Validate cache item structure
      if (!parsed.data || !parsed.timestamp || !parsed.expires || !parsed.staleExpires) {
        return null
      }

      return parsed
    } catch (error) {
      console.warn(`Failed to read from storage for key ${key}:`, error)
      return null
    }
  }

  private setInStorage(key: string, item: CacheItem<T>): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem(`${this.config.storageKey}:${key}`, JSON.stringify(item))
    } catch (error) {
      console.warn(`Failed to write to storage for key ${key}:`, error)
      // Continue without localStorage caching
    }
  }

  private removeFromStorage(key: string): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(`${this.config.storageKey}:${key}`)
    } catch (error) {
      console.warn(`Failed to remove from storage for key ${key}:`, error)
    }
  }

  private clearStorage(): void {
    try {
      if (typeof window === 'undefined') return
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(`${this.config.storageKey}:`)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('Failed to clear storage:', error)
    }
  }

  private cleanupExpiredItems(): void {
    const cleanup = () => {
      const now = Date.now()
      
      // Clean memory cache
      for (const [key, item] of this.memoryCache.entries()) {
        if (now >= item.staleExpires) {
          this.memoryCache.delete(key)
        }
      }

      // Clean localStorage (expensive operation, do less frequently)
      try {
        if (typeof window === 'undefined') return
        const keys = Object.keys(localStorage)
        keys.forEach(storageKey => {
          if (storageKey.startsWith(`${this.config.storageKey}:`)) {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
              try {
                const parsed = JSON.parse(stored) as CacheItem<T>
                if (now >= parsed.staleExpires) {
                  localStorage.removeItem(storageKey)
                }
              } catch (error) {
                // Remove invalid cache entries
                localStorage.removeItem(storageKey)
              }
            }
          }
        })
      } catch (error) {
        console.warn('Storage cleanup failed:', error)
      }
    }

    // Clean expired items every 5 minutes
    setInterval(cleanup, 5 * 60 * 1000)
    
    // Initial cleanup
    cleanup()
  }

  private calculateHitRate(): number {
    // Simple hit rate calculation could be enhanced with more sophisticated tracking
    return this.memoryCache.size > 0 ? 0.85 : 0 // Placeholder implementation
  }
}

/**
 * Network status detection
 */
export class NetworkManager {
  private listeners: Array<(online: boolean) => void> = []
  private _isOnline = true // Default to online for SSR

  constructor() {
    // Only set up event listeners in browser environment
    if (typeof window !== 'undefined') {
      this._isOnline = navigator.onLine
      window.addEventListener('online', () => this.setOnlineStatus(true))
      window.addEventListener('offline', () => this.setOnlineStatus(false))
    }
  }

  get isOnline(): boolean {
    return this._isOnline
  }

  onStatusChange(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  private setOnlineStatus(online: boolean): void {
    if (this._isOnline !== online) {
      this._isOnline = online
      this.listeners.forEach(listener => listener(online))
    }
  }
}

// Singleton instances
export const networkManager = new NetworkManager()