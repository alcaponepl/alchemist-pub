import { OrbitControls } from '@react-three/drei'
import { useMemo } from 'react'
import { WindFarm } from './WindFarm'
import { PerfMonitor } from './PerfMonitor'
import { useWasm } from '../hooks/useWasm'

type Props = {
  windSpeed: number
  turbineCount: number
}

export const DigitalTwinScene = ({ windSpeed, turbineCount }: Props) => {
  const { bridge } = useWasm()

  const fallbackUpdate = useMemo(
    () => (currentRotations: Float32Array<ArrayBufferLike>, delta: number) => {
      const next = new Float32Array(currentRotations.length)
      const step = windSpeed * delta
      for (let i = 0; i < currentRotations.length; i += 1) {
        next[i] = (currentRotations[i] + step) % (Math.PI * 2)
      }
      return next
    },
    [windSpeed],
  )

  const updateRotations = (
    currentRotations: Float32Array<ArrayBufferLike>,
    delta: number,
  ) => {
    if (!bridge) {
      return fallbackUpdate(currentRotations, delta)
    }

    return bridge.update_turbines(currentRotations, windSpeed, delta)
  }

  return (
    <>
      <color attach="background" args={['#0f1720']} />
      <fog attach="fog" args={['#0f1720', 60, 180]} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[20, 30, 15]} intensity={1.2} />
      <hemisphereLight args={['#b1d8ff', '#39424e', 0.4]} />

      <PerfMonitor />

      <WindFarm
        count={turbineCount}
        windSpeed={windSpeed}
        updateRotations={updateRotations}
      />
      <OrbitControls makeDefault />
    </>
  )
}
