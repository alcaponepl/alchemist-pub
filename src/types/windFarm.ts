export type TurbineStatus = 'online' | 'warning' | 'offline'

export type TurbineData = {
  id: number
  name: string
  power: number
  efficiency: number
  status: TurbineStatus
  speedFactor: number
  rpm: number
  temperature: number
  vibration: number
}

export type EnvironmentMetrics = {
  windSpeed: number
  windDirection: number
  turbulence: number
  humidity: number
  temperature: number
  airPressure: number
}

export type FarmSummary = {
  totalPowerMW: number
  capacityPercent: number
  optimalCount: number
  totalCount: number
  alertCount: number
}

export type Alert = {
  id: string
  turbineName: string
  message: string
  severity: 'warning' | 'critical'
  timestamp: number
}

export type EnergyHistory = number[]

export type WindFarmSnapshot = {
  turbines: TurbineData[]
  environment: EnvironmentMetrics
  summary: FarmSummary
  alerts: Alert[]
  energyHistory: EnergyHistory
  timestamp: number
}
