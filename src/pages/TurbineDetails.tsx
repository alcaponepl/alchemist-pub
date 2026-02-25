import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  CircleAlert,
  Cog,
  Gauge,
  Thermometer,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react'
import { Windmill } from '../components/Windmill'
import { useWindFarmData } from '../hooks/useWindFarmData'
import type { TurbineData, TurbineStatus } from '../types/windFarm'

const statusLabel: Record<TurbineStatus, string> = {
  online: 'Online',
  warning: 'Warning',
  offline: 'Offline',
}

function TurbinePreview3D({ speedFactor }: { speedFactor: number }) {
  const bladesRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (!bladesRef.current) return
    const spinSpeed = Math.max(0.35, speedFactor * 4.5)
    bladesRef.current.rotation.z += delta * spinSpeed
  })

  return (
    <>
      <color attach="background" args={['#0f1720']} />
      <fog attach="fog" args={['#0f1720', 14, 38]} />
      <ambientLight intensity={0.95} />
      <directionalLight position={[7, 12, 8]} intensity={1.1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshLambertMaterial color="#334155" />
      </mesh>
      <group position={[0, -0.95, 0]} scale={[0.69, 0.69, 0.69]}>
        <Windmill ref={bladesRef} />
      </group>
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        target={[0, 6.5, 0]}
        minDistance={16}
        maxDistance={28}
        minPolarAngle={0.75}
        maxPolarAngle={1.28}
      />
    </>
  )
}

function formatStatusClass(status: TurbineStatus) {
  if (status === 'online') return 'turbine-details__status--online'
  if (status === 'warning') return 'turbine-details__status--warning'
  return 'turbine-details__status--offline'
}

function getPartHealth(turbine: TurbineData, signal: number) {
  const bladeHealth = Math.max(42, Math.min(99, Math.round(96 - turbine.vibration * 130)))
  const gearboxHealth = Math.max(40, Math.min(99, Math.round(98 - Math.abs(100 - turbine.efficiency) * 2.8)))
  const generatorHealth = Math.max(35, Math.min(99, Math.round(99 - (turbine.temperature - 35) * 1.7)))

  return [
    {
      name: 'Blades',
      state: bladeHealth > 84 ? 'Optimal' : bladeHealth > 66 ? 'Monitor' : 'Service Required',
      life: `${Math.round(2500 + signal * 300)} h / 5000 h`,
      health: bladeHealth,
    },
    {
      name: 'Gearbox',
      state: gearboxHealth > 82 ? 'Stable' : gearboxHealth > 64 ? 'Warning' : 'Critical',
      life: `${Math.round(3600 + signal * 260)} h / 4200 h`,
      health: gearboxHealth,
    },
    {
      name: 'Generator',
      state: generatorHealth > 80 ? 'Stable' : generatorHealth > 62 ? 'Monitor' : 'Overheating',
      life: `${Math.round(1200 + signal * 420)} h / 6000 h`,
      health: generatorHealth,
    },
  ]
}

export const TurbineDetails = () => {
  const { turbineId } = useParams()
  const farm = useWindFarmData()

  const parsedId = Number(turbineId)
  if (!Number.isFinite(parsedId)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!farm) {
    return (
      <div className="turbine-details turbine-details--loading">
        <span className="turbine-details__loading-text">Loading telemetry...</span>
      </div>
    )
  }

  const turbine = farm.turbines.find((item) => item.id === parsedId)
  if (!turbine) {
    return <Navigate to="/dashboard" replace />
  }

  const signal = Math.sin(farm.timestamp / 3500)
  const localWind = Math.max(0, farm.environment.windSpeed + signal * 0.7)
  const yawAngle = ((farm.environment.windDirection % 360) + 360) % 360
  const pitchAngle = Math.max(0, Math.min(22, 7 + farm.environment.turbulence * 45 + signal * 2))
  const torqueNm = Math.max(0, turbine.power * 680 + signal * 40)
  const gridHz = 50 + Math.sin(farm.timestamp / 2200) * 0.12
  const parts = getPartHealth(turbine, signal)
  const recentAlerts = farm.alerts
    .filter((alert) => alert.turbineName === turbine.name)
    .slice(-4)
    .reverse()

  const mobileMetrics = [
    { icon: Wind, label: 'Wind Speed', value: `${localWind.toFixed(1)} m/s` },
    { icon: Zap, label: 'Power Output', value: `${turbine.power.toFixed(2)} MW` },
    { icon: Activity, label: 'Efficiency', value: `${turbine.efficiency.toFixed(1)}%` },
  ]

  return (
    <div className="turbine-details">
      <header className="turbine-details__header">
        <div className="turbine-details__head-info">
          <div className="turbine-details__title-wrap">
            <Wind size={40} className="turbine-details__title-icon" />
            <h1 className="turbine-details__title">Turbine {turbine.name}</h1>
          </div>
          <p className="turbine-details__subtitle">Location: West Wind Farm · ID: TRB-2401-{String(turbine.id).padStart(3, '0')}</p>
        </div>

        <span className={`turbine-details__status ${formatStatusClass(turbine.status)}`}>
          {statusLabel[turbine.status]}
        </span>

        <Link to="/dashboard" className="turbine-details__back-link">
          <ArrowLeft size={16} />
          Back
        </Link>
      </header>

      <main className="turbine-details__content">
        <section className="turbine-details__left-col">
          <article className="turbine-details__section">
            <h2 className="turbine-details__section-title">Current 3D View</h2>
            <div className="turbine-details__preview">
              <Canvas camera={{ position: [14, 12, 20], fov: 29 }}>
                <TurbinePreview3D speedFactor={turbine.speedFactor} />
              </Canvas>
            </div>
          </article>

          <article className="turbine-details__section">
            <h2 className="turbine-details__section-title">Performance Metrics</h2>
            <div className="turbine-details__metric-grid">
              <div className="turbine-details__metric-card">
                <span className="turbine-details__metric-label">// WIND_SPEED</span>
                <span className="turbine-details__metric-value">{localWind.toFixed(1)}</span>
                <span className="turbine-details__metric-unit">m/s</span>
              </div>
              <div className="turbine-details__metric-card">
                <span className="turbine-details__metric-label">// POWER_OUTPUT</span>
                <span className="turbine-details__metric-value">{turbine.power.toFixed(2)}</span>
                <span className="turbine-details__metric-unit">MW</span>
              </div>
              <div className="turbine-details__metric-card">
                <span className="turbine-details__metric-label">// EFFICIENCY</span>
                <span className="turbine-details__metric-value">{turbine.efficiency.toFixed(1)}</span>
                <span className="turbine-details__metric-unit">%</span>
              </div>
            </div>
          </article>

          <article className="turbine-details__section">
            <h2 className="turbine-details__section-title">Settings</h2>
            <div className="turbine-details__settings">
              <div className="turbine-details__setting-row">
                <div className="turbine-details__setting-label">
                  <Cog size={16} />
                  <span>Autopilot yaw</span>
                </div>
                <span className="turbine-details__setting-badge turbine-details__setting-badge--on">ON</span>
              </div>
              <div className="turbine-details__setting-row">
                <div className="turbine-details__setting-label">
                  <Wrench size={16} />
                  <span>Service Mode</span>
                </div>
                <span className="turbine-details__setting-badge turbine-details__setting-badge--off">OFF</span>
              </div>
              <div className="turbine-details__setting-row">
                <div className="turbine-details__setting-label">
                  <CircleAlert size={16} />
                  <span>AI Failure Prediction</span>
                </div>
                <span className="turbine-details__setting-badge turbine-details__setting-badge--on">ON</span>
              </div>
            </div>
          </article>
        </section>

        <section className="turbine-details__right-col">
          <article className="turbine-details__section">
            <h2 className="turbine-details__section-title">Technical Data</h2>
            <div className="turbine-details__tech-grid">
              <div className="turbine-details__tech-item">
                <span className="turbine-details__tech-key">Rotor RPM</span>
                <span className="turbine-details__tech-value">{turbine.rpm.toFixed(1)} rpm</span>
              </div>
              <div className="turbine-details__tech-item">
                <span className="turbine-details__tech-key">Torque</span>
                <span className="turbine-details__tech-value">{torqueNm.toFixed(0)} kNm</span>
              </div>
              <div className="turbine-details__tech-item">
                <span className="turbine-details__tech-key">Yaw Angle</span>
                <span className="turbine-details__tech-value">{yawAngle.toFixed(0)}°</span>
              </div>
              <div className="turbine-details__tech-item">
                <span className="turbine-details__tech-key">Pitch Angle</span>
                <span className="turbine-details__tech-value">{pitchAngle.toFixed(1)}°</span>
              </div>
              <div className="turbine-details__tech-item">
                <span className="turbine-details__tech-key">Bearing Temp.</span>
                <span className="turbine-details__tech-value">{turbine.temperature.toFixed(1)}°C</span>
              </div>
              <div className="turbine-details__tech-item">
                <span className="turbine-details__tech-key">Grid</span>
                <span className="turbine-details__tech-value">{gridHz.toFixed(2)} Hz</span>
              </div>
            </div>
          </article>

          <article className="turbine-details__section">
            <h2 className="turbine-details__section-title">Component Status</h2>
            <div className="turbine-details__parts">
              {parts.map((part) => (
                <div
                  className={`turbine-details__part-card ${part.health < 65 ? 'turbine-details__part-card--warn' : ''}`}
                  key={part.name}
                >
                  <div className="turbine-details__part-top">
                    <span className="turbine-details__part-name">{part.name}</span>
                    <span className="turbine-details__part-state">{part.state}</span>
                  </div>
                  <span className="turbine-details__part-life">Lifetime: {part.life}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="turbine-details__section">
            <h2 className="turbine-details__section-title">Turbine Alerts</h2>
            <div className="turbine-details__alerts">
              {recentAlerts.length === 0 ? (
                <div className="turbine-details__alert-item">No active alerts for this turbine.</div>
              ) : (
                recentAlerts.map((alert) => (
                  <div className="turbine-details__alert-item" key={alert.id}>
                    <span className="turbine-details__alert-dot" />
                    <span>{alert.message}</span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </main>

      <section className="turbine-details-mobile__metrics">
        {mobileMetrics.map(({ icon: Icon, label, value }) => (
          <div className="turbine-details-mobile__metric-item" key={label}>
            <Icon size={18} className="turbine-details-mobile__metric-icon" />
            <span className="turbine-details-mobile__metric-label">{label}</span>
            <span className="turbine-details-mobile__metric-value">{value}</span>
          </div>
        ))}
      </section>

      <section className="turbine-details-mobile__technical">
        <div className="turbine-details-mobile__tech-item">
          <Gauge size={16} />
          <span>RPM: {turbine.rpm.toFixed(1)}</span>
        </div>
        <div className="turbine-details-mobile__tech-item">
          <Thermometer size={16} />
          <span>Temp: {turbine.temperature.toFixed(1)}°C</span>
        </div>
      </section>
    </div>
  )
}
