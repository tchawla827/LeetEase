import { useState, useEffect } from 'react'
import { fetchUserStats } from '../api'

// Deduplicate concurrent fetches across components
let inflight = null

export default function useUserStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    if (!inflight) {
      inflight = fetchUserStats()
        .then(res => res.data)
        .catch(() => null)
        .finally(() => {
          inflight = null
        })
    }

    inflight.then(data => {
      if (isMounted) {
        setStats(data)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  return { stats, loading }
}
