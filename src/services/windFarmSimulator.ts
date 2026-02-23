import type {
  TurbineData,
  TurbineStatus,
  EnvironmentMetrics,
  FarmSummary,
  Alert,
  WindFarmSnapshot,
} from '../types/windFarm'

const TURBINE_COUNT = 10
const MAX_POWER_MW = 3.8
const RATED_WIND_SPEED = 12
const CUT_IN_WIND = 3.5
const CUT_OUT_WIND = 25
const ENERGY_HISTORY_SIZE = 48
const TICK_MS = 1000

type Listener = (snapshot: WindFarmSnapshot) => void

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const rand = (min: number, max: number) => Math.random() * (max - min) + min
const gaussianNoise = () => {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

const TURBINE_CONFIGS = Array.from({ length: TURBINE_COUNT }, (_, i) => ({
  id: i + 1,
  name: `turbine_${String(i + 1).padStart(2, '0')}`,
  efficiencyBase: rand(0.88, 0.98),
  noisePhase: rand(0, Math.PI * 2),
  degradation: i === 5 ? 0.6 : rand(0.95, 1.0),
}))

function computePowerCurve(windSpeed: number): number {
  if (windSpeed < CUT_IN_WIND || windSpeed > CUT_OUT_WIND) return 0
  if (windSpeed >= RATED_WIND_SPEED) return 1.0
  const x = (windSpeed - CUT_IN_WIND) / (RATED_WIND_SPEED - CUT_IN_WIND)
  return x * x * x
}

class WindFarmSimulator {
  private listeners: Listener[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private tick = 0

  private env: EnvironmentMetrics = {
    windSpeed: 8,
    windDirection: 225,
    turbulence: 0.06,
    humidity: 72,
    temperature: 6,
    airPressure: 1013,
  }

  private turbineStates: {
    status: TurbineStatus
    faultTimer: number
    vibration: number
    localTemp: number
  }[] = TURBINE_CONFIGS.map((cfg) => ({
    status: cfg.degradation < 0.7 ? 'offline' as const : 'online' as const,
    faultTimer: 0,
    vibration: rand(0.02, 0.06),
    localTemp: rand(35, 55),
  }))

  private energyHistory: number[] = Array.from(
    { length: ENERGY_HISTORY_SIZE },
    () => rand(60, 95)
  )

  private alerts: Alert[] = []
  private alertIdCounter = 0

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener)
    if (this.listeners.length === 1) this.start()
    listener(this.buildSnapshot())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
      if (this.listeners.length === 0) this.stop()
    }
  }

  private start() {
    if (this.timer) return
    this.timer = setInterval(() => this.step(), TICK_MS)
  }

  private stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private step() {
    this.tick++
    const t = this.tick * (TICK_MS / 1000)

    this.updateEnvironment(t)
    this.updateTurbines()
    this.updateEnergyHistory()
    this.pruneAlerts()

    const snapshot = this.buildSnapshot()
    for (const l of this.listeners) l(snapshot)
  }

  private updateEnvironment(t: number) {
    const baseWind = 8 + 4 * Math.sin(t * 0.02) + 2 * Math.sin(t * 0.07)
    this.env.windSpeed = clamp(baseWind + gaussianNoise() * 0.8, 0, 28)

    this.env.windDirection = (225 + 30 * Math.sin(t * 0.005) + gaussianNoise() * 3) % 360

    const turbBase = 0.06 + 0.04 * Math.sin(t * 0.03)
    this.env.turbulence = clamp(turbBase + gaussianNoise() * 0.015, 0.01, 0.25)

    this.env.humidity = clamp(
      72 + 8 * Math.sin(t * 0.01) + gaussianNoise() * 1.5,
      30, 100
    )

    this.env.temperature = clamp(
      6 + 5 * Math.sin(t * 0.008) + gaussianNoise() * 0.3,
      -15, 40
    )

    this.env.airPressure = clamp(
      1013 + 8 * Math.sin(t * 0.006) + gaussianNoise() * 0.5,
      980, 1050
    )
  }

  private updateTurbines() {
    const RANDOM_FAULT_MESSAGES: Array<{ msg: string; severity: 'warning' | 'critical'; goOffline: boolean }> = [
      { msg: 'vibration anomaly detected', severity: 'warning', goOffline: false },
      { msg: 'bearing temperature spike', severity: 'warning', goOffline: false },
      { msg: 'gearbox oil pressure low', severity: 'warning', goOffline: false },
      { msg: 'yaw misalignment detected', severity: 'warning', goOffline: false },
      { msg: 'pitch control lag – blade angle drift', severity: 'warning', goOffline: false },
      { msg: 'generator winding over-temperature', severity: 'critical', goOffline: true },
      { msg: 'hydraulic system failure', severity: 'critical', goOffline: true },
      { msg: 'grid frequency deviation – emergency stop', severity: 'critical', goOffline: true },
      { msg: 'rotor speed exceeded safe limit', severity: 'critical', goOffline: true },
      { msg: 'communication link lost', severity: 'warning', goOffline: false },
    ]

    for (let i = 0; i < TURBINE_COUNT; i++) {
      const cfg = TURBINE_CONFIGS[i]
      const state = this.turbineStates[i]

      if (state.status === 'offline') {
        state.faultTimer--
        if (state.faultTimer <= 0) {
          state.status = 'online'
          state.vibration = rand(0.02, 0.06)
          state.localTemp = rand(35, 55)
          this.addAlert(cfg.name, 'back online – maintenance complete', 'warning')
        }
        continue
      }

      state.vibration = clamp(
        state.vibration + gaussianNoise() * 0.008,
        0.01, 0.5
      )
      state.localTemp = clamp(
        state.localTemp + gaussianNoise() * 1.2,
        30, 95
      )

      const roll = Math.random()
      if (roll < 0.03 && state.status === 'online') {
        const fault = RANDOM_FAULT_MESSAGES[Math.floor(Math.random() * RANDOM_FAULT_MESSAGES.length)]
        if (fault.goOffline) {
          state.status = 'offline'
          state.faultTimer = Math.round(rand(8, 25))
          this.addAlert(cfg.name, fault.msg, 'critical')
        } else {
          state.status = 'warning'
          this.addAlert(cfg.name, fault.msg, 'warning')
        }
      } else if (roll < 0.06 && state.status === 'warning') {
        if (Math.random() < 0.4) {
          state.status = 'offline'
          state.faultTimer = Math.round(rand(10, 30))
          const fault = RANDOM_FAULT_MESSAGES.filter(f => f.goOffline)[Math.floor(Math.random() * 4)]
          this.addAlert(cfg.name, fault.msg, 'critical')
        } else {
          state.status = 'online'
        }
      } else if (state.status === 'warning' && Math.random() < 0.08) {
        state.status = 'online'
      }

      if (state.vibration > 0.2 && state.status === 'online') {
        state.status = 'warning'
        this.addAlert(cfg.name, 'vibration anomaly detected', 'warning')
      }
      if (state.localTemp > 82 && state.status !== 'offline') {
        state.status = 'warning'
        this.addAlert(cfg.name, `bearing temperature ${state.localTemp.toFixed(0)}°C`, 'warning')
      }
      if (state.vibration > 0.38 || state.localTemp > 90) {
        state.status = 'offline'
        state.faultTimer = Math.round(rand(10, 30))
        this.addAlert(cfg.name, 'emergency shutdown – sensor threshold exceeded', 'critical')
      }

      if (this.env.windSpeed > CUT_OUT_WIND && state.status === 'online') {
        state.status = 'offline'
        state.faultTimer = Math.round(rand(5, 15))
        this.addAlert(cfg.name, 'cut-out – wind speed exceeded limit', 'critical')
      }
    }
  }

  private updateEnergyHistory() {
    if (this.tick % 5 !== 0) return
    const snapshot = this.buildTurbineArray()
    const totalMW = snapshot.reduce((sum, tb) => sum + tb.power, 0)
    const pct = clamp((totalMW / (TURBINE_COUNT * MAX_POWER_MW)) * 100, 0, 100)
    this.energyHistory.push(pct)
    if (this.energyHistory.length > ENERGY_HISTORY_SIZE) {
      this.energyHistory.shift()
    }
  }

  private addAlert(turbineName: string, message: string, severity: 'warning' | 'critical') {
    const isDuplicate = this.alerts.some(
      (a) => a.turbineName === turbineName && a.message === message && Date.now() - a.timestamp < 5_000
    )
    if (isDuplicate) return

    this.alerts.push({
      id: `alert_${++this.alertIdCounter}`,
      turbineName,
      message,
      severity,
      timestamp: Date.now(),
    })
    if (this.alerts.length > 30) this.alerts.shift()
  }

  private pruneAlerts() {
    const cutoff = Date.now() - 120_000
    this.alerts = this.alerts.filter((a) => a.timestamp > cutoff)
  }

  private buildTurbineArray(): TurbineData[] {
    const t = this.tick * (TICK_MS / 1000)
    return TURBINE_CONFIGS.map((cfg, i) => {
      const state = this.turbineStates[i]

      if (state.status === 'offline') {
        return {
          id: cfg.id,
          name: cfg.name,
          power: 0,
          efficiency: 0,
          status: 'offline',
          speedFactor: 0,
          rpm: 0,
          temperature: state.localTemp,
          vibration: state.vibration,
        }
      }

      const localWind = clamp(
        this.env.windSpeed + Math.sin(t * 0.1 + cfg.noisePhase) * 0.5 + gaussianNoise() * 0.3,
        0, 30
      )
      const powerFraction = computePowerCurve(localWind) * cfg.degradation
      const efficiency = cfg.efficiencyBase * cfg.degradation * (1 - this.env.turbulence * 0.5)
      const power = MAX_POWER_MW * powerFraction * efficiency
      const speedFactor = clamp(powerFraction * 1.2, 0, 1.2)
      const rpm = speedFactor * 15

      return {
        id: cfg.id,
        name: cfg.name,
        power: +power.toFixed(2),
        efficiency: +clamp(efficiency * 100, 0, 100).toFixed(1),
        status: state.status,
        speedFactor: +speedFactor.toFixed(3),
        rpm: +rpm.toFixed(1),
        temperature: +state.localTemp.toFixed(1),
        vibration: +state.vibration.toFixed(3),
      }
    })
  }

  private buildSnapshot(): WindFarmSnapshot {
    const turbines = this.buildTurbineArray()
    const onlineCount = turbines.filter((t) => t.status === 'online').length
    const totalPower = turbines.reduce((s, t) => s + t.power, 0)
    const maxPossible = TURBINE_COUNT * MAX_POWER_MW

    const summary: FarmSummary = {
      totalPowerMW: +totalPower.toFixed(1),
      capacityPercent: +clamp((totalPower / maxPossible) * 100, 0, 100).toFixed(0),
      optimalCount: onlineCount,
      totalCount: TURBINE_COUNT,
      alertCount: this.alerts.filter((a) => a.timestamp > Date.now() - 30_000).length,
    }

    return {
      turbines,
      environment: { ...this.env },
      summary,
      alerts: [...this.alerts],
      energyHistory: [...this.energyHistory],
      timestamp: Date.now(),
    }
  }
}

export const windFarmSimulator = new WindFarmSimulator()
