import { useFrame } from '@react-three/fiber'
import { useCallback, useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Windmill } from './Windmill'

type Props = {
  count?: number
  windSpeed: number
  windDirection: number
  speedFactors: number[]
}

const COLS = 10
const SPACING = 12
const DEG2RAD = Math.PI / 180
const YAW_LERP_SPEED = 1.2

export function getTurbinePosition(index: number): [number, number, number] {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return [(col - (COLS - 1) / 2) * SPACING, 0, (row - 2) * SPACING]
}

function shortestAngleDelta(current: number, target: number): number {
  const d = ((target - current) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI
  return d
}

export const WindFarm = ({ count = 10, windSpeed, windDirection, speedFactors }: Props) => {
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

  const setBladesRef = useCallback((index: number, group: Group | null) => {
    if (group) bladesMap.current.set(index, group)
    else bladesMap.current.delete(index)
  }, [])

  const setTurbineRef = useCallback((index: number, group: Group | null) => {
    if (group) turbineMap.current.set(index, group)
    else turbineMap.current.delete(index)
  }, [])

  const positions = useMemo<[number, number, number][]>(
    () => Array.from({ length: count }, (_, i) => getTurbinePosition(i)),
    [count],
  )

  const elapsed = useRef(0)

  useFrame((_, delta) => {
    elapsed.current += delta
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
          ref={(g) => setTurbineRef(index, g)}
          position={position}
        >
          <Windmill ref={(g) => setBladesRef(index, g)} />
        </group>
      ))}
    </group>
  )
}
