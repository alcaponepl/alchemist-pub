import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wind, Bell, AlertTriangle, MessageCircle,
  ChevronRight, BarChart3, ChevronDown,
  X, Eye, SlidersHorizontal, Zap, Wrench, Trash2,
  Waves, Trees
} from 'lucide-react'
import { DigitalTwinScene } from '../components/DigitalTwinScene'
import { perfStore, type PerfStats } from '../components/PerfMonitor'
import { useWindFarmData } from '../hooks/useWindFarmData'
import type { Alert, TurbineData, TurbineStatus, WindFarmSnapshot } from '../types/windFarm'

const usePerfStats = () => {
  const [stats, setStats] = useState<PerfStats>(perfStore.stats)

  useEffect(() => {
    const unsub = perfStore.subscribe((s) => {
      setStats({ ...s })
    })
    return unsub
  }, [])

  return stats
}

const useDraggable = (initialX: number, initialY: number) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY })
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    setPos({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    })
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return { pos, isDragging: dragging, onPointerDown, onPointerMove, onPointerUp }
}

const metricBarPercent = (value: number, min: number, max: number) =>
  Math.round(((value - min) / (max - min)) * 100)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const deriveStatus = (power: number, efficiency: number, index: number, mode: 'sea' | 'land'): TurbineStatus => {
  if (mode === 'sea') {
    if (efficiency < 72 || power < 1.1 || index % 11 === 0) return 'warning'
    return 'online'
  }

  if (efficiency < 68 || power < 0.9) return 'offline'
  if (efficiency < 78 || index % 5 === 0) return 'warning'
  return 'online'
}

const buildSceneTurbines = (
  baseTurbines: TurbineData[],
  count: number,
  mode: 'sea' | 'land',
): TurbineData[] => {
  if (baseTurbines.length === 0) return []

  return Array.from({ length: count }, (_, index) => {
    const source = baseTurbines[index % baseTurbines.length]
    const phase = index * 0.57
    const powerMultiplier = mode === 'sea'
      ? 1.08 + Math.sin(phase) * 0.12
      : 0.78 + Math.cos(phase) * 0.16
    const efficiencyOffset = mode === 'sea'
      ? 3 + Math.sin(phase * 0.8) * 2
      : -7 + Math.cos(phase * 1.1) * 4

    const power = clamp(source.power * powerMultiplier, 0.4, 6.5)
    const efficiency = clamp(source.efficiency + efficiencyOffset, 58, 99)
    const speedFactor = clamp(source.speedFactor * (mode === 'sea' ? 1.08 : 0.82), 0.35, 1.7)
    const rpm = clamp(source.rpm * (mode === 'sea' ? 1.1 : 0.86), 4, 24)
    const temperature = source.temperature + (mode === 'sea' ? -2.4 : 3.1) + Math.sin(phase) * 1.4
    const vibration = clamp(source.vibration * (mode === 'sea' ? 0.92 : 1.24), 0.02, 0.42)
    const status = deriveStatus(power, efficiency, index, mode)
    const id = index + 1

    return {
      ...source,
      id,
      name: mode === 'sea' ? `SEA_TURBINE_${String(id).padStart(2, '0')}` : `LAND_TURBINE_${String(id).padStart(2, '0')}`,
      power,
      efficiency,
      speedFactor,
      rpm,
      temperature,
      vibration,
      status,
    }
  })
}

const buildSceneSnapshot = (base: WindFarmSnapshot, mode: 'sea' | 'land'): WindFarmSnapshot => {
  const count = mode === 'sea'
    ? Math.max(base.turbines.length + 4, 14)
    : Math.max(6, Math.floor(base.turbines.length * 0.55))

  const turbines = buildSceneTurbines(base.turbines, count, mode)
  const onlineCount = turbines.filter((t) => t.status === 'online').length
  const warningCount = turbines.filter((t) => t.status === 'warning').length
  const offlineCount = turbines.filter((t) => t.status === 'offline').length
  const totalPowerMW = Number(turbines.reduce((acc, t) => acc + t.power, 0).toFixed(1))

  const energyHistory = base.energyHistory.map((value, index) => {
    const wave = Math.sin(index * 0.42) * (mode === 'sea' ? 6 : 4)
    const shifted = mode === 'sea' ? value + 14 + wave : value - 16 + wave
    return clamp(Math.round(shifted), 8, 98)
  })

  const environment = {
    windSpeed: Number((base.environment.windSpeed + (mode === 'sea' ? 3.1 : -2.6)).toFixed(1)),
    windDirection: mode === 'sea'
      ? (base.environment.windDirection + 18) % 360
      : (base.environment.windDirection + 240) % 360,
    turbulence: Number(clamp(base.environment.turbulence + (mode === 'sea' ? 0.03 : -0.02), 0.02, 0.25).toFixed(2)),
    humidity: clamp(base.environment.humidity + (mode === 'sea' ? 10 : -18), 28, 96),
    temperature: Number((base.environment.temperature + (mode === 'sea' ? -1.4 : 4.8)).toFixed(1)),
    airPressure: Math.round(base.environment.airPressure + (mode === 'sea' ? -5 : 6)),
  }

  const alerts: Alert[] = turbines
    .filter((t) => t.status !== 'online')
    .slice(0, mode === 'sea' ? 6 : 4)
    .map((t, idx) => ({
      id: `${mode}-${base.timestamp}-${t.id}-${idx}`,
      turbineName: t.name,
      message: t.status === 'offline'
        ? 'offline due to safety lockout'
        : mode === 'sea'
          ? 'gust instability detected over sea sector'
          : 'terrain turbulence anomaly on inland field',
      severity: t.status === 'offline' ? 'critical' : 'warning',
      timestamp: base.timestamp - idx * 12_000,
    }))

  return {
    ...base,
    turbines,
    environment,
    energyHistory,
    alerts,
    summary: {
      totalPowerMW,
      capacityPercent: clamp(
        Math.round((totalPowerMW / (count * 5.5)) * 100),
        12,
        100,
      ),
      optimalCount: onlineCount,
      totalCount: count,
      alertCount: warningCount + offlineCount,
    },
  }
}

export const Dashboard = () => {
  const farm = useWindFarmData()
  const navigate = useNavigate()
  const [viewportView, setViewportView] = useState<'sea' | 'land'>('sea')
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [focusTurbineIndex, setFocusTurbineIndex] = useState<number | null>(null)
  const [contextMenuTurbine, setContextMenuTurbine] = useState<{ id: number; name: string } | null>(null)
  const [perfExpanded, setPerfExpanded] = useState(false)
  const perf = usePerfStats()
  const perfDrag = useDraggable(16, 604)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const fpsColor = perf.fps >= 55 ? 'var(--green-online)' : perf.fps >= 30 ? 'var(--amber-warning)' : 'var(--red-critical)'

  const scene = useMemo(
    () => (farm ? buildSceneSnapshot(farm, viewportView) : null),
    [farm, viewportView]
  )

  const speedFactors = useMemo(
    () => scene?.turbines.map((t) => t.speedFactor) ?? Array(10).fill(0),
    [scene?.turbines]
  )

  const windSpeed = scene?.environment.windSpeed ?? 7
  const windDirection = scene?.environment.windDirection ?? 225

  const activeAlerts = useMemo(
    () => (scene?.alerts.filter((a) => !dismissedAlerts.has(a.id)) ?? []).slice(-5),
    [scene?.alerts, dismissedAlerts]
  )

  useEffect(() => {
    setDismissedAlerts(new Set())
    setContextMenuTurbine(null)
    setFocusTurbineIndex(null)
  }, [viewportView])

  useEffect(() => {
    if (!contextMenuTurbine) return

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setContextMenuTurbine(null)
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [contextMenuTurbine])

  if (!scene) {
    return (
      <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', fontSize: 14 }}>
          INITIALIZING TELEMETRY...
        </span>
      </div>
    )
  }

  const { turbines, environment: env, summary, energyHistory } = scene

  return (
    <div className="dashboard">
      {/* 3D VIEWPORT */}
      <div className="dashboard__viewport">
        <Canvas
          dpr={1}
          camera={{ position: [40, 30, 50], fov: 45, near: 0.1, far: 200 }}
          gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <DigitalTwinScene
              windSpeed={windSpeed}
              windDirection={windDirection}
              turbineCount={turbines.length}
              speedFactors={speedFactors}
              focusTurbineIndex={focusTurbineIndex}
              sceneMode={viewportView}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* TOP BAR */}
      <div className="dashboard__topbar">
        <div className="dashboard__topbar-brand">
          <Link to="/" className="topbar__brand">
            <div className="topbar__brand-icon"><Wind size={18} /></div>
            <span className="topbar__brand-text">ALCHEMIST</span>
          </Link>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, border: '1px solid #00D4AA44', marginLeft: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4AA' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#00D4AA', fontWeight: 600, letterSpacing: 1 }}>ONLINE</span>
          </span>
        </div>

        <div className="dashboard__topbar-right">
          <Link to="/settings" className="dashboard__topbar-nav-link">Settings</Link>
          <button className="topbar__icon-btn"><Bell size={18} /></button>
          <span className="dashboard__topbar-time">{timeStr} — {dateStr}</span>
        </div>
      </div>

      {/* VIEWPORT MENU SWITCH */}
      <div className="dashboard__viewport-menu" role="tablist" aria-label="Viewport view mode">
        <button
          className={`dashboard__viewport-menu-btn ${viewportView === 'sea' ? 'dashboard__viewport-menu-btn--active' : ''}`}
          onClick={() => setViewportView('sea')}
          role="tab"
          aria-selected={viewportView === 'sea'}
          aria-label="Sea view"
          title="Sea view"
        >
          <Waves size={14} />
        </button>
        <button
          className={`dashboard__viewport-menu-btn ${viewportView === 'land' ? 'dashboard__viewport-menu-btn--active' : ''}`}
          onClick={() => setViewportView('land')}
          role="tab"
          aria-selected={viewportView === 'land'}
          aria-label="Land view"
          title="Land view"
        >
          <Trees size={14} />
        </button>
      </div>

      {/* ALERT BANNERS */}
      {activeAlerts.length > 0 && (
        <div className="dashboard__alerts-stack">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`dashboard__alert ${alert.severity === 'critical' ? 'dashboard__alert--critical' : ''}`}
            >
              <div className="dashboard__alert-left">
                <AlertTriangle size={14} className="dashboard__alert-icon" />
                <span className="dashboard__alert-text">
                  [{alert.severity === 'critical' ? 'CRIT' : 'WARN'}] {alert.turbineName} {alert.message}
                </span>
              </div>
              <button
                className="dashboard__alert-dismiss"
                onClick={() => setDismissedAlerts((prev) => new Set(prev).add(alert.id))}
              >
                [dismiss]
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SCENE PERFORMANCE PANEL */}
      <div
        className="scene-perf"
        style={{ left: perfDrag.pos.x, top: perfDrag.pos.y }}
        onPointerMove={perfDrag.onPointerMove}
        onPointerUp={perfDrag.onPointerUp}
      >
        <div
          className="scene-perf__header"
          onPointerDown={perfDrag.onPointerDown}
        >
          <span className="scene-perf__title">SCENE PERFORMANCE</span>
          <button className="scene-perf__toggle" onClick={() => setPerfExpanded(v => !v)}>
            <ChevronDown size={14} className={`scene-perf__chevron ${perfExpanded ? '' : 'scene-perf__chevron--collapsed'}`} />
          </button>
        </div>
        {perfExpanded && (
          <div className="scene-perf__body">
            <div className="scene-perf__row">
              <span className="scene-perf__label">FPS</span>
              <span className="scene-perf__value" style={{ color: fpsColor }}>{perf.fps}</span>
            </div>
            <div className="scene-perf__row">
              <span className="scene-perf__label">FRAME</span>
              <span className="scene-perf__value">{perf.frameTime} ms</span>
            </div>
            <div className="scene-perf__row">
              <span className="scene-perf__label">CALLS</span>
              <span className="scene-perf__value">{perf.drawCalls}</span>
            </div>
            <div className="scene-perf__row">
              <span className="scene-perf__label">TRIANGLES</span>
              <span className="scene-perf__value">{(perf.triangles / 1000).toFixed(1)}k</span>
            </div>
            <div className="scene-perf__row">
              <span className="scene-perf__label">GEOMETRIES</span>
              <span className="scene-perf__value">{perf.geometries}</span>
            </div>
            <div className="scene-perf__row">
              <span className="scene-perf__label">TEXTURES</span>
              <span className="scene-perf__value">{perf.textures}</span>
            </div>
            <div className="scene-perf__row">
              <span className="scene-perf__label">HEAP</span>
              <span className="scene-perf__value">{perf.memory}</span>
            </div>
          </div>
        )}
      </div>

      {/* LEFT PANEL — Metrics */}
      <div className="dashboard__left">
        <span className="dashboard__left-title">// REAL_TIME_METRICS</span>

        <div className="metric-card">
          <span className="metric-card__label">// WIND_SPEED</span>
          <span className="metric-card__value">{env.windSpeed.toFixed(1)}</span>
          <span className="metric-card__unit">m/s</span>
          <div className="metric-card__bar">
            <div className="metric-card__bar-fill" style={{ width: `${metricBarPercent(env.windSpeed, 0, 28)}%` }} />
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// TURBULENCE</span>
          <span className="metric-card__value">{env.turbulence.toFixed(2)}</span>
          <span className="metric-card__unit">TI index</span>
          <div className="metric-card__bar">
            <div
              className="metric-card__bar-fill"
              style={{
                width: `${metricBarPercent(env.turbulence, 0, 0.25)}%`,
                background: env.turbulence > 0.12 ? 'var(--amber-warning)' : undefined,
              }}
            />
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// HUMIDITY</span>
          <span className="metric-card__value">{Math.round(env.humidity)}</span>
          <span className="metric-card__unit">%RH</span>
          <div className="metric-card__bar">
            <div className="metric-card__bar-fill" style={{ width: `${Math.round(env.humidity)}%` }} />
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// TEMPERATURE</span>
          <span className="metric-card__value">{env.temperature.toFixed(1)}</span>
          <span className="metric-card__unit">°C</span>
          <div className="metric-card__bar">
            <div className="metric-card__bar-fill" style={{ width: `${metricBarPercent(env.temperature, -15, 40)}%` }} />
          </div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// AIR_PRESSURE</span>
          <span className="metric-card__value">{Math.round(env.airPressure)}</span>
          <span className="metric-card__unit">hPa</span>
          <div className="metric-card__bar">
            <div className="metric-card__bar-fill" style={{ width: `${metricBarPercent(env.airPressure, 980, 1050)}%` }} />
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Turbine Status */}
      <div className="dashboard__right">
        <div className="dashboard__right-header">
          <span className="dashboard__right-title">// TURBINE_STATUS</span>
          <span className="dashboard__right-count">
            {summary.optimalCount} / {summary.totalCount} optimal
          </span>
        </div>
        <div className="dashboard__right-list">
          {turbines.map(t => (
            <div
              key={t.id}
              className={`turbine-row ${focusTurbineIndex === t.id - 1 ? 'turbine-row--active' : ''}`}
              onClick={() => setFocusTurbineIndex(t.id - 1)}
              onContextMenu={(event) => {
                event.preventDefault()
                setFocusTurbineIndex(t.id - 1)
                setContextMenuTurbine({ id: t.id, name: t.name })
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="turbine-row__icon"><Wind size={16} /></div>
              <div className="turbine-row__info">
                <span className="turbine-row__name">{t.name}</span>
                <span className="turbine-row__meta">{t.power.toFixed(1)} MW — {t.efficiency.toFixed(1)}% eff</span>
              </div>
              <div className="turbine-row__status">
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: t.status === 'online' ? '#00D4AA22' : t.status === 'warning' ? '#FFAA0022' : '#FF3B3B22',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: t.status === 'online' ? '#00D4AA' : t.status === 'warning' ? '#FFAA00' : '#FF3B3B',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: t.status === 'online' ? '#00D4AA' : t.status === 'warning' ? '#FFAA00' : '#FF3B3B',
                  }} />
                  {t.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM PANEL — Energy Output */}
      <div className="dashboard__bottom">
        <div className="dashboard__bottom-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BarChart3 size={14} style={{ color: 'var(--cyan-primary)' }} />
            <span className="dashboard__bottom-title">ENERGY_OUTPUT</span>
            <span className="dashboard__bottom-value">{summary.totalPowerMW} MW</span>
            <span className="dashboard__bottom-unit">total output</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray-400)' }}>Last 24h</span>
            <ChevronRight size={14} style={{ color: 'var(--gray-600)' }} />
          </div>
        </div>
        <div className="dashboard__bottom-body">
          {energyHistory.map((h, i) => (
            <div
              key={i}
              className={`energy-bar ${h < 40 ? 'energy-bar--warning' : 'energy-bar--normal'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* CENTER HUD */}
      <div className="dashboard__hud">
        <div className="dashboard__hud-stat">
          <span className="dashboard__hud-val">{summary.totalPowerMW}</span>
          <span className="dashboard__hud-label">total MW</span>
        </div>
        <div className="dashboard__hud-divider" />
        <div className="dashboard__hud-stat">
          <span className="dashboard__hud-val">{summary.capacityPercent}%</span>
          <span className="dashboard__hud-label">capacity</span>
        </div>
        <div className="dashboard__hud-divider" />
        <div className="dashboard__hud-stat">
          <span className="dashboard__hud-val">{summary.optimalCount}/{summary.totalCount}</span>
          <span className="dashboard__hud-label">optimal</span>
        </div>
        <div className="dashboard__hud-divider" />
        <div className="dashboard__hud-stat">
          <span className="dashboard__hud-val">{summary.alertCount}</span>
          <span className="dashboard__hud-label">alert</span>
        </div>
      </div>

      {/* AI BUBBLE */}
      <button className="dashboard__ai-bubble">
        <MessageCircle size={24} />
      </button>

      {contextMenuTurbine && (
        <div className="dashboard-context-menu__overlay" onClick={() => setContextMenuTurbine(null)}>
          <div
            className="dashboard-context-menu"
            role="dialog"
            aria-modal="true"
            aria-label={`Actions for ${contextMenuTurbine.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dashboard-context-menu__header">
              <h3 className="dashboard-context-menu__title">Actions for {contextMenuTurbine.name}</h3>
              <button
                className="dashboard-context-menu__close"
                onClick={() => setContextMenuTurbine(null)}
                aria-label="Close actions menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="dashboard-context-menu__items">
              <button
                className="dashboard-context-menu__item"
                onClick={() => {
                  navigate(`/dashboard/turbine/${contextMenuTurbine.id}`)
                  setContextMenuTurbine(null)
                }}
              >
                <Eye size={18} className="dashboard-context-menu__item-icon" />
                <span className="dashboard-context-menu__item-copy">
                  <span className="dashboard-context-menu__item-label">Detailed View</span>
                  <span className="dashboard-context-menu__item-desc">View turbine telemetry details</span>
                </span>
                <ChevronRight size={16} className="dashboard-context-menu__item-arrow" />
              </button>

              <button className="dashboard-context-menu__item">
                <SlidersHorizontal size={18} className="dashboard-context-menu__item-icon" />
                <span className="dashboard-context-menu__item-copy">
                  <span className="dashboard-context-menu__item-label">Change Settings</span>
                  <span className="dashboard-context-menu__item-desc">Update turbine operating parameters</span>
                </span>
                <ChevronRight size={16} className="dashboard-context-menu__item-arrow" />
              </button>

              <button className="dashboard-context-menu__item">
                <Zap size={18} className="dashboard-context-menu__item-icon" />
                <span className="dashboard-context-menu__item-copy">
                  <span className="dashboard-context-menu__item-label">Toggle Power</span>
                  <span className="dashboard-context-menu__item-desc">Turn the unit on or off</span>
                </span>
                <ChevronRight size={16} className="dashboard-context-menu__item-arrow" />
              </button>

              <button className="dashboard-context-menu__item">
                <Wrench size={18} className="dashboard-context-menu__item-icon" />
                <span className="dashboard-context-menu__item-copy">
                  <span className="dashboard-context-menu__item-label">Diagnostics and Repair</span>
                  <span className="dashboard-context-menu__item-desc">Run full service diagnostics</span>
                </span>
                <ChevronRight size={16} className="dashboard-context-menu__item-arrow" />
              </button>

              <button className="dashboard-context-menu__item dashboard-context-menu__item--danger">
                <AlertTriangle size={18} className="dashboard-context-menu__item-icon" />
                <span className="dashboard-context-menu__item-copy">
                  <span className="dashboard-context-menu__item-label">Send Technical Alert</span>
                  <span className="dashboard-context-menu__item-desc">Notify the operations team</span>
                </span>
                <ChevronRight size={16} className="dashboard-context-menu__item-arrow" />
              </button>

              <button className="dashboard-context-menu__item dashboard-context-menu__item--danger">
                <Trash2 size={18} className="dashboard-context-menu__item-icon" />
                <span className="dashboard-context-menu__item-copy">
                  <span className="dashboard-context-menu__item-label">Shutdown Turbine</span>
                  <span className="dashboard-context-menu__item-desc">Immediate operational stop</span>
                </span>
                <ChevronRight size={16} className="dashboard-context-menu__item-arrow" />
              </button>
            </div>

            <div className="dashboard-context-menu__footer">
              <button className="dashboard-context-menu__cancel" onClick={() => setContextMenuTurbine(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
