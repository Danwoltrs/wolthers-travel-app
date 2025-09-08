export function safeGet<T = any>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return null
    if (typeof raw !== 'string') return null
    if (raw === '[object Object]') return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function safeSet(key: string, value: any): void {
  if (typeof window === 'undefined') return
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value)
    window.localStorage.setItem(key, str)
  } catch {
    // ignore
  }
}

const KNOWN_KEYS = [
  'wolthers-sync-queue',
  'wolthers-optimized-sync-queue',
  'wolthers-optimized-sync-queue_metadata',
  'trip_cache',
  'user_profile_cache'
]

export function cleanStorageOnBoot(): void {
  if (typeof window === 'undefined') return
  for (const key of KNOWN_KEYS) {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) continue
      if (raw === '[object Object]' || typeof raw !== 'string') {
        window.localStorage.removeItem(key)
        continue
      }
      try {
        JSON.parse(raw)
      } catch {
        window.localStorage.removeItem(key)
      }
    } catch {
      // ignore individual key errors
    }
  }
}
