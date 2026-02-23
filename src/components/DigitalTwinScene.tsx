import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { WindFarm, getTurbinePosition } from './WindFarm'
import { PerfMonitor } from './PerfMonitor'

type Props = {
  windSpeed: number
  windDirection: number
  turbineCount: number
  speedFactors: number[]
  focusTurbineIndex: number | null
}

function CameraController({ focusIndex }: { focusIndex: number | null }) {
  const { camera, controls } = useThree()
  const targetPos = useRef(new Vector3())
  const cameraPos = useRef(new Vector3())
  const animating = useRef(false)
  const prevIndex = useRef<number | null>(null)

  useEffect(() => {
    if (focusIndex === null || focusIndex === prevIndex.current) return
    prevIndex.current = focusIndex

    const [tx, , tz] = getTurbinePosition(focusIndex)
    targetPos.current.set(tx, 8, tz)
    cameraPos.current.set(tx + 18, 14, tz + 18)
    animating.current = true
  }, [focusIndex])

  useFrame(() => {
    if (!animating.current || !controls) return
    const orbit = controls as any
    orbit.target.lerp(targetPos.current, 0.04)
    camera.position.lerp(cameraPos.current, 0.04)
    orbit.update()

    if (camera.position.distanceTo(cameraPos.current) < 0.2) {
      animating.current = false
    }
  })

  return null
}

export const DigitalTwinScene = ({ windSpeed, windDirection, turbineCount, speedFactors, focusTurbineIndex }: Props) => {
  return (
    <>
      <color attach="background" args={['#0f1720']} />
      <fog attach="fog" args={['#0f1720', 50, 140]} />

      <ambientLight intensity={1.0} />
      <directionalLight position={[20, 30, 15]} intensity={1.0} />

      <PerfMonitor />

      <WindFarm
        count={turbineCount}
        windSpeed={windSpeed}
        windDirection={windDirection}
        speedFactors={speedFactors}
      />
      <OrbitControls makeDefault />
      <CameraController focusIndex={focusTurbineIndex} />
    </>
  )
}
