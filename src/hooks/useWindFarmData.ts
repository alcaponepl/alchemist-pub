import { useState, useEffect, useRef } from 'react'
import { windFarmSimulator } from '../services/windFarmSimulator'
import type { WindFarmSnapshot } from '../types/windFarm'

export function useWindFarmData(): WindFarmSnapshot | null {
  const [snapshot, setSnapshot] = useState<WindFarmSnapshot | null>(null)
  const latestRef = useRef<WindFarmSnapshot | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    let mounted = true

    const unsub = windFarmSimulator.subscribe((s) => {
      latestRef.current = s
    })

    const loop = () => {
      if (!mounted) return
      if (latestRef.current) {
        setSnapshot(latestRef.current)
        latestRef.current = null
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      mounted = false
      unsub()
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return snapshot
}
