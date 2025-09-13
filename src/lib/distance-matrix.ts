interface CacheEntry {
  expires: number
  distance: number
  duration: number
}

const cache = new Map<string, CacheEntry>()
const TTL = 5 * 60 * 1000 // 5 minutes

function cacheKey(origin: string, destination: string) {
  return `${origin}__${destination}`
}

export async function getDriveDuration(origin: string, destination: string) {
  const key = cacheKey(origin, destination)
  const now = Date.now()
  const cached = cache.get(key)
  if (cached && cached.expires > now) {
    console.log(`📋 [Distance Matrix Cache] Hit: ${origin} → ${destination} (${Math.round(cached.duration/60)}min)`)
    return { distance: cached.distance, duration: cached.duration }
  }

  try {
    console.log(`🗺️ [Distance Matrix Client] Calculating: ${origin} → ${destination}`)
    
    // Use the server-side API endpoint instead of direct Google Maps API call
    const response = await fetch('/api/locations/distance-matrix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination
      })
    })

    if (!response.ok) {
      console.warn(`Distance Matrix API request failed: ${response.status} ${response.statusText}`)
      return { distance: 0, duration: 0 }
    }

    const data = await response.json()
    
    // Handle API error responses with fallback data
    if (data.error) {
      console.warn(`Distance Matrix API error: ${data.error}`)
      return { distance: data.distance || 0, duration: data.duration || 0 }
    }

    // Cache successful results
    if (data.distance !== undefined && data.duration !== undefined) {
      cache.set(key, {
        distance: data.distance,
        duration: data.duration,
        expires: now + TTL
      })
      
      console.log(`✅ [Distance Matrix Client] Success: ${Math.round(data.duration/60)}min, ${Math.round(data.distance/1000)}km`)
      return { distance: data.distance, duration: data.duration }
    }

    console.warn('Distance Matrix API returned invalid data:', data)
    return { distance: 0, duration: 0 }

  } catch (error) {
    console.error('Distance Matrix client error:', error)
    return { distance: 0, duration: 0 }
  }
}
