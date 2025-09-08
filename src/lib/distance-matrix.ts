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
    return { distance: cached.distance, duration: cached.duration }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    console.warn('Google Maps API key not configured')
    return { distance: 0, duration: 0 }
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=driving&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) {
    console.warn('Distance Matrix request failed', res.status)
    return { distance: 0, duration: 0 }
  }
  const data = await res.json() as any
  if (data.rows && data.rows[0] && data.rows[0].elements && data.rows[0].elements[0] && data.rows[0].elements[0].status === 'OK') {
    const element = data.rows[0].elements[0]
    cache.set(key, {
      distance: element.distance.value,
      duration: element.duration.value,
      expires: now + TTL
    })
    return { distance: element.distance.value, duration: element.duration.value }
  }

  console.warn('Distance Matrix returned no result', data.status)
  return { distance: 0, duration: 0 }
}
