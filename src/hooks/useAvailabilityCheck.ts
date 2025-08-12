import { useState, useCallback } from 'react'

interface AvailabilityCheckParams {
  type: 'staff' | 'vehicle'
  id: string
  startDate: string
  endDate: string
  excludeTripId?: string
}

interface AvailabilityResult {
  available: boolean
  conflicts: Array<{
    tripId: string
    title: string
    startDate: string
    endDate: string
  }>
}

interface AvailabilityState {
  loading: boolean
  error: string | null
  result: AvailabilityResult | null
}

export function useAvailabilityCheck() {
  const [state, setState] = useState<AvailabilityState>({
    loading: false,
    error: null,
    result: null
  })

  const checkAvailability = useCallback(async (params: AvailabilityCheckParams): Promise<AvailabilityResult | null> => {
    setState({ loading: true, error: null, result: null })

    try {
      const response = await fetch('/api/validation/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      const result: AvailabilityResult = {
        available: data.available,
        conflicts: data.conflicts || []
      }

      setState({ loading: false, error: null, result })
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check availability'
      setState({ loading: false, error: errorMessage, result: null })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, result: null })
  }, [])

  return {
    checkAvailability,
    reset,
    loading: state.loading,
    error: state.error,
    result: state.result
  }
}

// Helper hook for bulk availability checking
export function useBulkAvailabilityCheck() {
  const [results, setResults] = useState<Map<string, AvailabilityResult>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkMultiple = useCallback(async (
    items: Array<AvailabilityCheckParams>
  ): Promise<Map<string, AvailabilityResult>> => {
    setLoading(true)
    setError(null)
    const newResults = new Map<string, AvailabilityResult>()

    try {
      // Check all items in parallel
      const promises = items.map(async (item) => {
        const response = await fetch('/api/validation/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(item)
        })

        if (!response.ok) {
          throw new Error(`Failed to check ${item.type} ${item.id}`)
        }

        const data = await response.json()
        return {
          key: `${item.type}-${item.id}`,
          result: {
            available: data.available,
            conflicts: data.conflicts || []
          }
        }
      })

      const results = await Promise.all(promises)
      
      results.forEach(({ key, result }) => {
        newResults.set(key, result)
      })

      setResults(newResults)
      setLoading(false)
      return newResults

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check availability'
      setError(errorMessage)
      setLoading(false)
      return newResults
    }
  }, [])

  const getResult = useCallback((type: 'staff' | 'vehicle', id: string): AvailabilityResult | null => {
    return results.get(`${type}-${id}`) || null
  }, [results])

  const reset = useCallback(() => {
    setResults(new Map())
    setLoading(false)
    setError(null)
  }, [])

  return {
    checkMultiple,
    getResult,
    reset,
    loading,
    error,
    hasResults: results.size > 0
  }
}