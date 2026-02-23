import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'

const UPDATE_INTERVAL = 1 / 2

type MemoryPerformance = Performance & {
  memory?: {
    usedJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

const formatMB = (bytes: number) => (bytes / 1048576).toFixed(1)

export type PerfStats = {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
  memory: string
}

let _listeners: Array<(stats: PerfStats) => void> = []

export const perfStore = {
  stats: {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    memory: 'N/A',
  } as PerfStats,
  subscribe(listener: (stats: PerfStats) => void) {
    _listeners.push(listener)
    return () => {
      _listeners = _listeners.filter(l => l !== listener)
    }
  },
  _notify() {
    for (const l of _listeners) l(this.stats)
  },
}

export const PerfMonitor = () => {
  const gl = useThree((s) => s.gl)
  const frames = useRef(0)
  const lastTime = useRef(performance.now())
  const accumulator = useRef(0)

  useFrame(() => {
    const now = performance.now()
    const delta = (now - lastTime.current) / 1000
    lastTime.current = now
    frames.current++
    accumulator.current += delta

    if (accumulator.current < UPDATE_INTERVAL) return

    const fps = frames.current / accumulator.current
    const frameTime = (accumulator.current / frames.current) * 1000

    frames.current = 0
    accumulator.current = 0

    const info = gl.info
    const mem = (performance as MemoryPerformance).memory

    perfStore.stats = {
      fps: Math.round(fps),
      frameTime: +frameTime.toFixed(1),
      drawCalls: info.render?.calls ?? 0,
      triangles: info.render?.triangles ?? 0,
      geometries: info.memory?.geometries ?? 0,
      textures: info.memory?.textures ?? 0,
      memory: mem ? `${formatMB(mem.usedJSHeapSize)} / ${formatMB(mem.jsHeapSizeLimit)} MB` : 'N/A',
    }

    perfStore._notify()
  })

  return null
}
