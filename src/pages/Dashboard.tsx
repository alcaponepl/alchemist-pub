import { Canvas } from '@react-three/fiber'
import { Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wind, Settings, Bell, AlertTriangle, MessageCircle,
  ChevronRight, BarChart3
} from 'lucide-react'
import { DigitalTwinScene } from '../components/DigitalTwinScene'
import { useWasm } from '../hooks/useWasm'

const TURBINES = [
  { id: 1, name: 'turbine_01', power: '3.5 MW', efficiency: '96.2%', status: 'online' },
  { id: 2, name: 'turbine_02', power: '3.3 MW', efficiency: '91.8%', status: 'online' },
  { id: 3, name: 'turbine_03', power: '2.8 MW', efficiency: '87.1%', status: 'warning' },
  { id: 4, name: 'turbine_04', power: '3.4 MW', efficiency: '94.5%', status: 'online' },
  { id: 5, name: 'turbine_05', power: '3.1 MW', efficiency: '89.3%', status: 'online' },
  { id: 6, name: 'turbine_06', power: '0.0 MW', efficiency: '0%', status: 'offline' },
  { id: 7, name: 'turbine_07', power: '3.2 MW', efficiency: '92.1%', status: 'online' },
  { id: 8, name: 'turbine_08', power: '2.9 MW', efficiency: '88.4%', status: 'online' },
  { id: 9, name: 'turbine_09', power: '3.6 MW', efficiency: '97.0%', status: 'online' },
  { id: 10, name: 'turbine_10', power: '3.4 MW', efficiency: '93.8%', status: 'online' },
]

const ENERGY_BARS = [
  72, 68, 75, 80, 78, 65, 70, 82, 88, 85, 90, 87, 92, 78, 82, 76, 71, 68,
  74, 80, 85, 88, 91, 95, 78, 65, 72, 80, 84, 88, 90, 35, 86, 82, 78, 75,
  70, 68, 74, 80, 85, 90, 88, 84, 80, 76, 72, 70
]

const WIND_SPEED = 7

export const Dashboard = () => {
  const { bridge } = useWasm()
  const [showAlert, setShowAlert] = useState(true)

  const fallbackUpdate = useMemo(
    () => (currentRotations: Float32Array<ArrayBufferLike>, delta: number) => {
      const next = new Float32Array(currentRotations.length)
      const step = WIND_SPEED * delta
      for (let i = 0; i < currentRotations.length; i += 1) {
        next[i] = (currentRotations[i] + step) % (Math.PI * 2)
      }
      return next
    },
    [],
  )

  const updateRotations = (
    currentRotations: Float32Array<ArrayBufferLike>,
    delta: number,
  ) => {
    if (!bridge) return fallbackUpdate(currentRotations, delta)
    return bridge.update_turbines(currentRotations, WIND_SPEED, delta)
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="dashboard">
      {/* 3D VIEWPORT */}
      <div className="dashboard__viewport">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [40, 30, 50], fov: 45, near: 0.1, far: 500 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
        >
          <Suspense fallback={null}>
            <DigitalTwinScene windSpeed={WIND_SPEED} turbineCount={10} />
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

      {/* ALERT BANNER */}
      {showAlert && (
        <div className="dashboard__alert">
          <div className="dashboard__alert-left">
            <AlertTriangle size={14} className="dashboard__alert-icon" />
            <span className="dashboard__alert-text">[WARN] turbine_03 vibration anomaly detected</span>
          </div>
          <button className="dashboard__alert-dismiss" onClick={() => setShowAlert(false)}>[dismiss]</button>
        </div>
      )}

      {/* LEFT PANEL — Metrics */}
      <div className="dashboard__left">
        <span className="dashboard__left-title">// REAL_TIME_METRICS</span>

        <div className="metric-card">
          <span className="metric-card__label">// WIND_SPEED</span>
          <span className="metric-card__value">12.4</span>
          <span className="metric-card__unit">m/s</span>
          <div className="metric-card__bar"><div className="metric-card__bar-fill" style={{ width: '50%' }} /></div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// TURBULENCE</span>
          <span className="metric-card__value">0.08</span>
          <span className="metric-card__unit">TI index</span>
          <div className="metric-card__bar"><div className="metric-card__bar-fill" style={{ width: '33%', background: 'var(--amber-warning)' }} /></div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// HUMIDITY</span>
          <span className="metric-card__value">78</span>
          <span className="metric-card__unit">%RH</span>
          <div className="metric-card__bar"><div className="metric-card__bar-fill" style={{ width: '78%' }} /></div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// TEMPERATURE</span>
          <span className="metric-card__value">4.2</span>
          <span className="metric-card__unit">°C</span>
          <div className="metric-card__bar"><div className="metric-card__bar-fill" style={{ width: '45%' }} /></div>
        </div>

        <div className="metric-card">
          <span className="metric-card__label">// AIR_PRESSURE</span>
          <span className="metric-card__value">1013</span>
          <span className="metric-card__unit">hPa</span>
          <div className="metric-card__bar"><div className="metric-card__bar-fill" style={{ width: '85%' }} /></div>
        </div>
      </div>

      {/* RIGHT PANEL — Turbine Status */}
      <div className="dashboard__right">
        <div className="dashboard__right-header">
          <span className="dashboard__right-title">// TURBINE_STATUS</span>
          <span className="dashboard__right-count">11 / 12 optimal</span>
        </div>
        <div className="dashboard__right-list">
          {TURBINES.map(t => (
            <div key={t.id} className="turbine-row">
              <div className="turbine-row__icon"><Wind size={16} /></div>
              <div className="turbine-row__info">
                <span className="turbine-row__name">{t.name}</span>
                <span className="turbine-row__meta">{t.power} — {t.efficiency} eff</span>
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
            <span className="dashboard__bottom-value">24.8 MW</span>
            <span className="dashboard__bottom-unit">total output</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gray-400)' }}>Last 24h</span>
            <ChevronRight size={14} style={{ color: 'var(--gray-600)' }} />
          </div>
        </div>
        <div className="dashboard__bottom-body">
          {ENERGY_BARS.map((h, i) => (
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
          <span className="dashboard__hud-val">24.8</span>
          <span className="dashboard__hud-label">total MW</span>
        </div>
        <div className="dashboard__hud-divider" />
        <div className="dashboard__hud-stat">
          <span className="dashboard__hud-val">87%</span>
          <span className="dashboard__hud-label">capacity</span>
        </div>
        <div className="dashboard__hud-divider" />
        <div className="dashboard__hud-stat">
          <span className="dashboard__hud-val">11/12</span>
          <span className="dashboard__hud-label">optimal</span>
        </div>
        <div className="dashboard__hud-divider" />
        <div className="dashboard__hud-stat">
          <span className="dashboard__hud-val">1</span>
          <span className="dashboard__hud-label">alert</span>
        </div>
      </div>

      {/* AI BUBBLE */}
      <button className="dashboard__ai-bubble">
        <MessageCircle size={24} />
      </button>
    </div>
  )
}
