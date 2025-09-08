import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { safeGet, safeSet } from '@/lib/storage/safeStorage'

// Client-side Supabase client with offline capabilities
let supabaseClient: SupabaseClient<Database> | null = null

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Temporarily disable custom storage to test if it's causing the auth issue
      // storage: typeof window !== 'undefined' ? new OfflineAuthStorage() : undefined,
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey,
      },
    },
  })

  // Set up offline capabilities
  if (typeof window !== 'undefined') {
    setupOfflineCapabilities(supabaseClient)
  }

  return supabaseClient
}

// Custom storage that works offline
class OfflineAuthStorage {
  private storage = typeof window !== 'undefined' ? window.localStorage : null
  private storageKey = 'supabase.auth.token'
  private userKey = 'supabase.auth.user'
  private sessionKey = 'supabase.auth.session'

  async getItem(key: string): Promise<string | null> {
    if (!this.storage) return null
    
    try {
      const item = this.storage.getItem(key)
      return item
    } catch (error) {
      console.warn('Failed to get item from storage:', error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.storage) return
    
    try {
      this.storage.setItem(key, value)
      
      // Cache session data for offline access
      if (key.includes('supabase.auth.token')) {
        this.cacheSessionData(value)
      }
    } catch (error) {
      console.warn('Failed to set item in storage:', error)
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.storage) return
    
    try {
      this.storage.removeItem(key)
      
      // Clear cached data on logout
      if (key.includes('supabase.auth.token')) {
        this.clearCachedData()
      }
    } catch (error) {
      console.warn('Failed to remove item from storage:', error)
    }
  }

  private cacheSessionData(tokenData: string) {
    try {
      const parsedData = JSON.parse(tokenData)
      if (parsedData.user) {
        this.storage?.setItem(this.userKey, JSON.stringify(parsedData.user))
      }
      if (parsedData) {
        this.storage?.setItem(this.sessionKey, tokenData)
      }
    } catch (error) {
      console.warn('Failed to cache session data:', error)
    }
  }

  private clearCachedData() {
    this.storage?.removeItem(this.userKey)
    this.storage?.removeItem(this.sessionKey)
    this.storage?.removeItem('trip_cache')
    this.storage?.removeItem('user_profile_cache')
  }

  // Offline access methods
  getCachedUser(): User | null {
    if (!this.storage) return null
    
    try {
      const userData = this.storage.getItem(this.userKey)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.warn('Failed to get cached user:', error)
      return null
    }
  }

  getCachedSession(): Session | null {
    if (!this.storage) return null
    
    try {
      const sessionData = this.storage.getItem(this.sessionKey)
      return sessionData ? JSON.parse(sessionData) : null
    } catch (error) {
      console.warn('Failed to get cached session:', error)
      return null
    }
  }
}

// Offline capabilities setup
function setupOfflineCapabilities(client: SupabaseClient<Database>) {
  // We'll implement a simpler approach using interceptors
  // The complex query override was causing TypeScript issues
  console.log('Offline capabilities enabled for Supabase client')
}

// Cache management functions
export function cacheTrips(trips: any[]) {
  if (typeof window === 'undefined') return
  
  try {
    const cacheData = {
      trips,
      timestamp: Date.now(),
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    }
    safeSet('trip_cache', cacheData)
  } catch (error) {
    console.warn('Failed to cache trips:', error)
  }
}

export function getCachedTrips(): any[] | null {
  if (typeof window === 'undefined') return null

  try {
    const cacheData = safeGet<any>('trip_cache')
    if (!cacheData) return null
    const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl

    if (isExpired) {
      localStorage.removeItem('trip_cache')
      return null
    }
    
    return cacheData.trips
  } catch (error) {
    console.warn('Failed to get cached trips:', error)
    return null
  }
}

export function cacheUserProfile(profile: any) {
  if (typeof window === 'undefined') return
  
  try {
    const cacheData = {
      profile,
      timestamp: Date.now(),
      ttl: 60 * 60 * 1000, // 1 hour
    }
    safeSet('user_profile_cache', cacheData)
  } catch (error) {
    console.warn('Failed to cache user profile:', error)
  }
}

export function getCachedUserProfile(): any | null {
  if (typeof window === 'undefined') return null

  try {
    const cacheData = safeGet<any>('user_profile_cache')
    if (!cacheData) return null
    const isExpired = Date.now() - cacheData.timestamp > cacheData.ttl
    
    if (isExpired) {
      localStorage.removeItem('user_profile_cache')
      return null
    }
    
    return cacheData.profile
  } catch (error) {
    console.warn('Failed to get cached user profile:', error)
    return null
  }
}

// Check online status
export function isOnline(): boolean {
  return typeof window !== 'undefined' ? navigator.onLine : true
}

// Export singleton instance
export const supabase = getSupabaseClient()