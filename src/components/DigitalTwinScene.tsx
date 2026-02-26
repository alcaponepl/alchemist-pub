import { OrbitControls, Sky } from '@react-three/drei'
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
  sceneMode: 'sea' | 'land'
}

function CameraController({
  focusIndex,
  sceneMode,
  turbineCount,
}: {
  focusIndex: number | null
  sceneMode: 'sea' | 'land'
  turbineCount: number
}) {
  const { camera, controls } = useThree()
  const targetPos = useRef(new Vector3())
  const cameraPos = useRef(new Vector3())
  const animating = useRef(false)
  const prevIndex = useRef<number | null>(null)

  useEffect(() => {
    if (focusIndex === null || focusIndex === prevIndex.current) return
    prevIndex.current = focusIndex

    const [tx, , tz] = getTurbinePosition(focusIndex, sceneMode, turbineCount)
    targetPos.current.set(tx, 8, tz)
    cameraPos.current.set(tx + 18, 14, tz + 18)
    animating.current = true
  }, [focusIndex, sceneMode, turbineCount])

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

export const DigitalTwinScene = ({
  windSpeed,
  windDirection,
  turbineCount,
  speedFactors,
  focusTurbineIndex,
  sceneMode,
}: Props) => {
  const isSea = sceneMode === 'sea'

  return (
    <>
      <color attach="background" args={[isSea ? '#0c1a2a' : '#6dbbff']} />
      <fog attach="fog" args={[isSea ? '#10263a' : '#73c0ff', 80, 300]} />

      <hemisphereLight
        args={[isSea ? '#8fc3ff' : '#dff3ff', isSea ? '#1a2a3b' : '#6ea870', isSea ? 0.52 : 0.75]}
      />
      {!isSea && (
        <Sky
          distance={450000}
          sunPosition={[100, 28, 60]}
          turbidity={2.2}
          rayleigh={2.1}
          mieCoefficient={0.001}
          mieDirectionalG={0.68}
        />
      )}
      <ambientLight intensity={isSea ? 0.7 : 0.42} />
      <directionalLight position={isSea ? [16, 28, 18] : [10, 18, 10]} intensity={isSea ? 1.0 : 0.95} />
      {!isSea && <directionalLight position={[-20, 18, -14]} intensity={0.16} color="#b7e38f" />}

      <PerfMonitor />

      <WindFarm
        count={turbineCount}
        windSpeed={windSpeed}
        windDirection={windDirection}
        speedFactors={speedFactors}
        terrain={sceneMode}
      />
      <OrbitControls
        makeDefault
        minPolarAngle={0.15}
        maxPolarAngle={sceneMode === 'land' ? Math.PI * 0.48 : Math.PI * 0.495}
      />
      <CameraController focusIndex={focusTurbineIndex} sceneMode={sceneMode} turbineCount={turbineCount} />
    </>
  )
}
