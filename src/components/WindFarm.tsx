import { useFrame } from '@react-three/fiber'
import { useCallback, useMemo, useRef } from 'react'
import type { Group, Mesh } from 'three'
import { Windmill } from './Windmill'
import { GrassPatch, getDemoLandGroundYPosition } from './demoLand/GrassPatch'

type Props = {
  count?: number
  windSpeed: number
  windDirection: number
  speedFactors: number[]
  terrain: 'sea' | 'land'
}

const COLS = 10
const SPACING = 12
const DEG2RAD = Math.PI / 180
const YAW_LERP_SPEED = 1.2
const DEMO_LAND_WIDTH = 64
const LAND_MIN_DISTANCE = 11.5
const LAND_MIN_DISTANCE_FLOOR = 9.5
const LAND_MARGIN = 5.5

function mulberry32(seed: number) {
  let t = seed
  return () => {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function getLandPositions(count: number): [number, number, number][] {
  const half = DEMO_LAND_WIDTH / 2 - LAND_MARGIN
  const rand = mulberry32(1337 + count * 17)
  const positions: [number, number, number][] = []
  let minDistance = LAND_MIN_DISTANCE
  const maxAttemptsPerPass = Math.max(300, count * 220)

  while (positions.length < count && minDistance >= LAND_MIN_DISTANCE_FLOOR) {
    let attempts = 0
    while (positions.length < count && attempts < maxAttemptsPerPass) {
      attempts += 1
      const x = (rand() * 2 - 1) * half
      const z = (rand() * 2 - 1) * half

      let tooClose = false
      for (let i = 0; i < positions.length; i += 1) {
        const [px, , pz] = positions[i]
        const dx = x - px
        const dz = z - pz
        if (dx * dx + dz * dz < minDistance * minDistance) {
          tooClose = true
          break
        }
      }
      if (tooClose) continue

      positions.push([x, getDemoLandGroundYPosition(x, z, DEMO_LAND_WIDTH) + 0.05, z])
    }
    minDistance -= 0.6
  }

  if (positions.length < count) {
    // Last-resort: concentric rings with strict minimum spacing floor.
    const ringStep = LAND_MIN_DISTANCE_FLOOR * 1.08
    let ring = 0
    while (positions.length < count && ring < 20) {
      ring += 1
      const radius = Math.min(half, ring * ringStep)
      const circumference = Math.max(1, Math.floor((2 * Math.PI * radius) / LAND_MIN_DISTANCE_FLOOR))
      for (let i = 0; i < circumference && positions.length < count; i += 1) {
        const a = (i / circumference) * Math.PI * 2
        const x = Math.cos(a) * radius
        const z = Math.sin(a) * radius
        let tooClose = false
        for (let j = 0; j < positions.length; j += 1) {
          const [px, , pz] = positions[j]
          const dx = x - px
          const dz = z - pz
          if (dx * dx + dz * dz < LAND_MIN_DISTANCE_FLOOR * LAND_MIN_DISTANCE_FLOOR) {
            tooClose = true
            break
          }
        }
        if (!tooClose) {
          positions.push([x, getDemoLandGroundYPosition(x, z, DEMO_LAND_WIDTH) + 0.05, z])
        }
      }
    }
  }

  return positions
}

function getTurbinePositions(count: number, terrain: 'sea' | 'land'): [number, number, number][] {
  if (terrain === 'land') {
    return getLandPositions(count)
  }
  return Array.from({ length: count }, (_, i) => {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    return [(col - (COLS - 1) / 2) * SPACING, 0, (row - 2) * SPACING]
  })
}

export function getTurbinePosition(
  index: number,
  terrain: 'sea' | 'land' = 'sea',
  count = 10,
): [number, number, number] {
  return getTurbinePositions(count, terrain)[index] ?? [0, 0, 0]
}

function shortestAngleDelta(current: number, target: number): number {
  const d = ((target - current) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI
  return d
}

export const WindFarm = ({ count = 10, windSpeed, windDirection, speedFactors, terrain }: Props) => {
  const rotations = useRef<Float32Array<ArrayBufferLike>>(
    new Float32Array(count).map(() => Math.random() * Math.PI * 2),
  )
  const yawOffsets = useRef<Float32Array<ArrayBufferLike>>(
    new Float32Array(count).map(() => Math.random() * Math.PI * 2),
  )
  const yaws = useRef<Float32Array<ArrayBufferLike>>(
    new Float32Array(count).map((_, i) => yawOffsets.current[i]),
  )
  const bladesMap = useRef<Map<number, Group>>(new Map())
  const turbineMap = useRef<Map<number, Group>>(new Map())
  const seaSurfaceA = useRef<Mesh>(null)
  const seaSurfaceB = useRef<Mesh>(null)

  const setBladesRef = useCallback((index: number, group: Group | null) => {
    if (group) bladesMap.current.set(index, group)
    else bladesMap.current.delete(index)
  }, [])

  const setTurbineRef = useCallback((index: number, group: Group | null) => {
    if (group) turbineMap.current.set(index, group)
    else turbineMap.current.delete(index)
  }, [])

  const positions = useMemo<[number, number, number][]>(
    () => getTurbinePositions(count, terrain),
    [count, terrain],
  )

  const elapsed = useRef(0)
  const sceneTime = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
    sceneTime.current += delta
    if (elapsed.current < 0.033) return
    const frameDelta = elapsed.current
    elapsed.current = 0

    const baseDelta = frameDelta * Math.max(0.2, windSpeed * 0.2)
    const targetYaw = windDirection * DEG2RAD

    for (let i = 0; i < count; i += 1) {
      const factor = speedFactors[i] ?? 1
      if (factor > 0) {
        rotations.current[i] = (rotations.current[i] + baseDelta * factor) % (Math.PI * 2)
      }

      const turbineTargetYaw = targetYaw + yawOffsets.current[i]
      const angleDelta = shortestAngleDelta(yaws.current[i], turbineTargetYaw)
      yaws.current[i] += angleDelta * Math.min(1, YAW_LERP_SPEED * frameDelta)

      const turbine = turbineMap.current.get(i)
      if (turbine) {
        turbine.rotation.y = yaws.current[i]
      }

      const blades = bladesMap.current.get(i)
      if (blades) {
        blades.rotation.z = rotations.current[i]
      }
    }

    if (terrain === 'sea') {
      const t = sceneTime.current
      if (seaSurfaceA.current) {
        seaSurfaceA.current.position.y = -0.035 + Math.sin(t * 0.75) * 0.008
      }
      if (seaSurfaceB.current) {
        seaSurfaceB.current.position.y = -0.014 + Math.cos(t * 0.62) * 0.006
      }
    }
  })

  return (
    <group>
      {terrain === 'sea' ? (
        <>
          <mesh receiveShadow position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[260, 260]} />
            <meshStandardMaterial color="#0a2538" roughness={0.92} metalness={0.06} />
          </mesh>
          <mesh ref={seaSurfaceA} position={[0, -0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[260, 260, 24, 24]} />
            <meshStandardMaterial
              color="#1f5d88"
              transparent
              opacity={0.82}
              roughness={0.22}
              metalness={0.12}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={seaSurfaceB} position={[0, -0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
            <planeGeometry args={[220, 220, 14, 14]} />
            <meshStandardMaterial
              color="#5ea6cf"
              transparent
              opacity={0.18}
              roughness={0.3}
              metalness={0.08}
              depthWrite={false}
            />
          </mesh>
        </>
      ) : (
        <>
          <GrassPatch width={DEMO_LAND_WIDTH} instances={140000} />
        </>
      )}

      {positions.map((position, index) => (
        <group
          key={index}
          ref={(g) => setTurbineRef(index, g)}
          position={position}
        >
          <Windmill ref={(g) => setBladesRef(index, g)} />
        </group>
      ))}
    </group>
  )
}
