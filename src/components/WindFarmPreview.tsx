import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Windmill } from './Windmill'

const COLS = 10
const SPACING = 12
const WIND_SPEED = 7
const COUNT = 10

const WindFarmInner = () => {
  const rotations = useRef<Float32Array>(new Float32Array(COUNT))
  const bladesMap = useRef<Map<number, Group>>(new Map())

  const positions = useMemo<[number, number, number][]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        return [(col - (COLS - 1) / 2) * SPACING, 0, (row - 2) * SPACING]
      }),
    [],
  )

  useFrame((_, delta) => {
    const step = WIND_SPEED * delta * Math.max(0.2, WIND_SPEED * 0.2)
    for (let i = 0; i < COUNT; i += 1) {
      rotations.current[i] = (rotations.current[i] + step) % (Math.PI * 2)
      const blades = bladesMap.current.get(i)
      if (blades) {
        blades.rotation.z = rotations.current[i]
      }
    }
  })

  return (
    <group>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#39424e" />
      </mesh>
      {positions.map((position, index) => (
        <Windmill
          key={index}
          ref={(group) => {
            if (group) bladesMap.current.set(index, group)
            else bladesMap.current.delete(index)
          }}
          position={position}
        />
      ))}
    </group>
  )
}

export const WindFarmPreview = () => (
  <Canvas
    dpr={1}
    camera={{ position: [40, 30, 50], fov: 45, near: 0.1, far: 500 }}
    gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
    style={{ width: '100%', height: '100%' }}
  >
    <color attach="background" args={['#0f1720']} />
    <fog attach="fog" args={['#0f1720', 60, 180]} />
    <ambientLight intensity={0.8} />
    <directionalLight position={[20, 30, 15]} intensity={1.2} />
    <hemisphereLight args={['#b1d8ff', '#39424e', 0.4]} />
    <Suspense fallback={null}>
      <WindFarmInner />
    </Suspense>
    <OrbitControls makeDefault enableZoom={false} autoRotate autoRotateSpeed={0.5} />
  </Canvas>
)
