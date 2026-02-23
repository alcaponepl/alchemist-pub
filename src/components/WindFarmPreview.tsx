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
  const rotations = useRef<Float32Array>(
    new Float32Array(COUNT).map(() => Math.random() * Math.PI * 2),
  )
  const randomSpeeds = useRef<Float32Array>(
    new Float32Array(COUNT).map(() => 0.5 + Math.random()),
  )
  const randomYaws = useRef<Float32Array>(
    new Float32Array(COUNT).map(() => Math.random() * Math.PI * 2),
  )
  const bladesMap = useRef<Map<number, Group>>(new Map())
  const turbineMap = useRef<Map<number, Group>>(new Map())

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
    const baseStep = WIND_SPEED * delta * Math.max(0.2, WIND_SPEED * 0.2)
    for (let i = 0; i < COUNT; i += 1) {
      rotations.current[i] = (rotations.current[i] + baseStep * randomSpeeds.current[i]) % (Math.PI * 2)
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
        <meshLambertMaterial color="#39424e" />
      </mesh>
      {positions.map((position, index) => (
        <group
          key={index}
          position={position}
          rotation={[0, randomYaws.current[index], 0]}
          ref={(g: Group | null) => {
            if (g) turbineMap.current.set(index, g)
            else turbineMap.current.delete(index)
          }}
        >
          <Windmill
            ref={(group: Group | null) => {
              if (group) bladesMap.current.set(index, group)
              else bladesMap.current.delete(index)
            }}
          />
        </group>
      ))}
    </group>
  )
}

export const WindFarmPreview = () => (
  <Canvas
    dpr={1}
    camera={{ position: [40, 30, 50], fov: 45, near: 0.1, far: 200 }}
    gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
    style={{ width: '100%', height: '100%' }}
  >
    <color attach="background" args={['#0f1720']} />
    <fog attach="fog" args={['#0f1720', 50, 140]} />
    <ambientLight intensity={1.0} />
    <directionalLight position={[20, 30, 15]} intensity={1.0} />
    <Suspense fallback={null}>
      <WindFarmInner />
    </Suspense>
    <OrbitControls makeDefault enableZoom={false} autoRotate autoRotateSpeed={0.5} />
  </Canvas>
)
