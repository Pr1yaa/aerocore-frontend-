/**
 * useFlights.ts
 * ─────────────
 * Data-aware hook that fetches the flight list and returns
 * loading / error / data states. Centralises the data concern
 * so FlightSidebar stays purely presentational.
 */

import { useState, useEffect } from 'react'
import { fetchFlights } from '@/lib/data-access'
import type { Flight } from '@/types'

export interface UseFlightsResult {
  flights: Flight[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFlights(): UseFlightsResult {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchFlights()
      .then((data) => {
        if (!cancelled) {
          setFlights(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load flights.')
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [tick])

  return {
    flights,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  }
}
