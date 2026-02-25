import { Canvas } from '@react-three/fiber'
import { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wind, Bell, AlertTriangle, MessageCircle,
  ChevronRight, BarChart3, ChevronDown,
  X, Eye, SlidersHorizontal, Zap, Wrench, Trash2
} from 'lucide-react'
import { DigitalTwinScene } from '../components/DigitalTwinScene'
import { perfStore, type PerfStats } from '../components/PerfMonitor'
import { useWindFarmData } from '../hooks/useWindFarmData'

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

export const Dashboard = () => {
  const farm = useWindFarmData()
  const navigate = useNavigate()
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

  const speedFactors = useMemo(
    () => farm?.turbines.map((t) => t.speedFactor) ?? Array(10).fill(0),
    [farm?.turbines]
  )

  const windSpeed = farm?.environment.windSpeed ?? 7
  const windDirection = farm?.environment.windDirection ?? 225

  const activeAlerts = useMemo(
    () => (farm?.alerts.filter((a) => !dismissedAlerts.has(a.id)) ?? []).slice(-5),
    [farm?.alerts, dismissedAlerts]
  )

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

  if (!farm) {
    return (
      <div className="dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', fontSize: 14 }}>
          INITIALIZING TELEMETRY...
        </span>
      </div>
    )
  }

  const { turbines, environment: env, summary, energyHistory } = farm

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
