import { useFrame } from '@react-three/fiber'
import { useCallback, useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Windmill } from './Windmill'

type Props = {
  count?: number
  windSpeed: number
  updateRotations: (
    currentRotations: Float32Array<ArrayBufferLike>,
    delta: number,
  ) => Float32Array<ArrayBufferLike>
}

const COLS = 10
const SPACING = 12

export const WindFarm = ({ count = 10, windSpeed, updateRotations }: Props) => {
  const rotations = useRef<Float32Array<ArrayBufferLike>>(new Float32Array(count))
  const bladesMap = useRef<Map<number, Group>>(new Map())

  const setBladesRef = useCallback((index: number, group: Group | null) => {
    if (group) {
      bladesMap.current.set(index, group)
    } else {
      bladesMap.current.delete(index)
    }
  }, [])

  const positions = useMemo<[number, number, number][]>(
    () =>
      Array.from({ length: count }, (_, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        return [(col - (COLS - 1) / 2) * SPACING, 0, (row - 2) * SPACING]
      }),
    [count],
  )

  useFrame((_, delta) => {
    const scaledDelta = delta * Math.max(0.2, windSpeed * 0.2)
    rotations.current = updateRotations(rotations.current, scaledDelta)

    for (let i = 0; i < count; i += 1) {
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
          ref={(group) => setBladesRef(index, group)}
          position={position}
        />
      ))}
    </group>
  )
}
