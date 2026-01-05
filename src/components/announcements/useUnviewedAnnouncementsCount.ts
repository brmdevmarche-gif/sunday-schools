'use client'

import { useEffect, useState } from 'react'

export function useUnviewedAnnouncementsCount(refreshMs = 30000) {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    let alive = true
    let timer: any = null

    async function load() {
      try {
        const res = await fetch('/api/announcements/unviewed-count', {
          method: 'GET',
          cache: 'no-store',
        })
        if (!alive) return
        const json = await res.json()
        setCount(Number(json?.count) || 0)
      } catch {
        if (!alive) return
        setCount(0)
      }
    }

    load()
    if (refreshMs > 0) {
      timer = setInterval(load, refreshMs)
    }

    return () => {
      alive = false
      if (timer) clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs])

  return count
}


