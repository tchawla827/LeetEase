import { useState, useEffect } from 'react'
import { fetchUserStats } from '../api'

export default function useUserStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetchUserStats()
      .then(res => {
        if (!cancelled) {
          setStats(res.data)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { stats, loading }
}
