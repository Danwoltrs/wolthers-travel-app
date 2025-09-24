import { useState, useEffect, useCallback } from 'react'

interface NoteCounts {
  [tripId: string]: number
}

interface UseTripNoteCountsResult {
  noteCounts: NoteCounts
  loading: boolean
  error: string | null
  refreshNoteCounts: () => Promise<void>
  updateNoteCount: (tripId: string, count: number) => void
}

export function useTripNoteCounts(tripIds: string[]): UseTripNoteCountsResult {
  const [noteCounts, setNoteCounts] = useState<NoteCounts>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNoteCounts = useCallback(async () => {
    if (tripIds.length === 0) {
      setNoteCounts({})
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/trips/notes-summary?trip_ids=${tripIds.join(',')}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch note counts: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setNoteCounts(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch note counts')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching trip note counts:', err)
      
      // Set all counts to 0 as fallback
      const fallbackCounts: NoteCounts = {}
      tripIds.forEach(id => {
        fallbackCounts[id] = 0
      })
      setNoteCounts(fallbackCounts)
    } finally {
      setLoading(false)
    }
  }, [tripIds])

  const refreshNoteCounts = useCallback(async () => {
    await fetchNoteCounts()
  }, [fetchNoteCounts])

  const updateNoteCount = useCallback((tripId: string, count: number) => {
    setNoteCounts(prev => ({
      ...prev,
      [tripId]: count
    }))
  }, [])

  // Fetch note counts when trip IDs change
  useEffect(() => {
    fetchNoteCounts()
  }, [fetchNoteCounts])

  return {
    noteCounts,
    loading,
    error,
    refreshNoteCounts,
    updateNoteCount
  }
}

// Hook for getting note count for a single trip
export function useSingleTripNoteCount(tripId: string) {
  const [noteCount, setNoteCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNoteCount = useCallback(async () => {
    if (!tripId) {
      setNoteCount(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/trips/notes-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ tripId })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch note count: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setNoteCount(result.notesCount || 0)
      } else {
        throw new Error(result.error || 'Failed to fetch note count')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Error fetching single trip note count:', err)
      setNoteCount(0) // Fallback to 0
    } finally {
      setLoading(false)
    }
  }, [tripId])

  const refreshNoteCount = useCallback(async () => {
    await fetchNoteCount()
  }, [fetchNoteCount])

  const updateNoteCount = useCallback((count: number) => {
    setNoteCount(count)
  }, [])

  // Fetch note count when trip ID changes
  useEffect(() => {
    fetchNoteCount()
  }, [fetchNoteCount])

  return {
    noteCount,
    loading,
    error,
    refreshNoteCount,
    updateNoteCount
  }
}