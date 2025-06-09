import { useState, useEffect } from 'react'
import { fetchUserStats } from '../api'

let cached = null
let inflight = null

export default function useUserStats() {
  const [stats, setStats] = useState(cached)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    if (cached) return

    if (!inflight) {
      inflight = fetchUserStats()
        .then(res => {
          cached = res.data
          setStats(cached)
        })
        .catch(() => {
          cached = null
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      inflight.finally(() => {
        setStats(cached)
        setLoading(false)
      })
    }
  }, [])

  return { stats, loading }
}
