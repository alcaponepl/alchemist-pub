import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useCallback } from 'react'

const SAMPLE_COUNT = 120
const UPDATE_INTERVAL = 1 / 4

type MemoryPerformance = Performance & {
  memory?: {
    usedJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

const createOverlay = () => {
  const container = document.createElement('div')
  container.id = 'perf-monitor'
  document.body.appendChild(container)
  return container
}

const formatMB = (bytes: number) => (bytes / 1048576).toFixed(1)

export const PerfMonitor = () => {
  const gl = useThree((s) => s.gl)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const frames = useRef(0)
  const lastTime = useRef(performance.now())
  const accumulator = useRef(0)
  const fpsHistory = useRef<number[]>(new Array(SAMPLE_COUNT).fill(0))
  const frameTimeHistory = useRef<number[]>(new Array(SAMPLE_COUNT).fill(0))
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctx2d = useRef<CanvasRenderingContext2D | null>(null)

  const statsRef = useRef({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    memory: '',
  })

  useEffect(() => {
    const container = createOverlay()
    containerRef.current = container

    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 40
    canvas.style.cssText = 'width:240px;height:40px;border-radius:4px;margin-top:4px;'
    canvasRef.current = canvas
    ctx2d.current = canvas.getContext('2d')

    container.appendChild(canvas)

    return () => {
      container.remove()
    }
  }, [])

  const drawGraph = useCallback(() => {
    const ctx = ctx2d.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    const w = canvas.width
    const h = canvas.height

    ctx.fillStyle = 'rgba(15,23,32,0.85)'
    ctx.fillRect(0, 0, w, h)

    const fpsArr = fpsHistory.current
    const ftArr = frameTimeHistory.current
    const maxFps = Math.max(...fpsArr, 60)

    const barW = w / SAMPLE_COUNT

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const fpsNorm = fpsArr[i] / maxFps
      const barH = fpsNorm * (h - 2)

      const hue = fpsArr[i] >= 55 ? 140 : fpsArr[i] >= 30 ? 50 : 0
      ctx.fillStyle = `hsla(${hue},70%,55%,0.7)`
      ctx.fillRect(i * barW, h - barH, barW - 0.5, barH)

      const ftNorm = Math.min(ftArr[i] / 33, 1)
      const ftBarH = ftNorm * (h - 2)
      ctx.fillStyle = 'rgba(100,180,255,0.3)'
      ctx.fillRect(i * barW, h - ftBarH, barW - 0.5, ftBarH)
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    const y60 = h - (60 / maxFps) * (h - 2)
    ctx.fillRect(0, y60, w, 1)
  }, [])

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

    fpsHistory.current.shift()
    fpsHistory.current.push(fps)
    frameTimeHistory.current.shift()
    frameTimeHistory.current.push(frameTime)

    const info = gl.info
    const mem = (performance as MemoryPerformance).memory

    statsRef.current = {
      fps: Math.round(fps),
      frameTime: +frameTime.toFixed(1),
      drawCalls: info.render?.calls ?? 0,
      triangles: info.render?.triangles ?? 0,
      geometries: info.memory?.geometries ?? 0,
      textures: info.memory?.textures ?? 0,
      memory: mem ? `${formatMB(mem.usedJSHeapSize)} / ${formatMB(mem.jsHeapSizeLimit)} MB` : 'N/A',
    }

    const s = statsRef.current
    const container = containerRef.current
    if (!container) return

    const fpsColor = s.fps >= 55 ? '#8deb8d' : s.fps >= 30 ? '#ebd98d' : '#eb8d8d'

    const html = `
      <div class="perf-row"><span class="perf-label">FPS</span><span class="perf-value" style="color:${fpsColor}">${s.fps}</span></div>
      <div class="perf-row"><span class="perf-label">Frame</span><span class="perf-value">${s.frameTime} ms</span></div>
      <div class="perf-row"><span class="perf-label">Calls</span><span class="perf-value">${s.drawCalls}</span></div>
      <div class="perf-row"><span class="perf-label">Triangles</span><span class="perf-value">${(s.triangles / 1000).toFixed(1)}k</span></div>
      <div class="perf-row"><span class="perf-label">Geometries</span><span class="perf-value">${s.geometries}</span></div>
      <div class="perf-row"><span class="perf-label">Textures</span><span class="perf-value">${s.textures}</span></div>
      <div class="perf-row"><span class="perf-label">Heap</span><span class="perf-value">${s.memory}</span></div>
    `

    const canvas = canvasRef.current
    if (canvas && canvas.parentNode === container) {
      container.removeChild(canvas)
    }
    container.innerHTML = html
    if (canvas) {
      container.appendChild(canvas)
    }

    drawGraph()
  })

  return null
}
