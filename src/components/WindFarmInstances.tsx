import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { InstancedMesh, Object3D } from 'three'

type Props = {
  count?: number
  windSpeed: number
  updateRotations: (
    currentRotations: Float32Array<ArrayBufferLike>,
    delta: number,
  ) => Float32Array<ArrayBufferLike>
}

export const WindFarmInstances = ({ count = 50, windSpeed, updateRotations }: Props) => {
  const instancedRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const rotations = useRef<Float32Array<ArrayBufferLike>>(new Float32Array(count))

  const positions = useMemo<[number, number, number][]>(() => {
    const cols = 10
    const spacing = 4

    return Array.from({ length: count }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      return [(col - (cols - 1) / 2) * spacing, 0, (row - 2) * spacing]
    })
  }, [count])

  useFrame((_, delta) => {
    const mesh = instancedRef.current
    if (!mesh) {
      return
    }

    rotations.current = updateRotations(rotations.current, delta * Math.max(0.2, windSpeed * 0.2))

    for (let i = 0; i < count; i += 1) {
      const [x, y, z] = positions[i]

      dummy.position.set(x, y + 0.8, z)
      dummy.rotation.set(0, rotations.current[i], 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh receiveShadow position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#39424e" />
      </mesh>

      <Instances ref={instancedRef} limit={count} range={count} frames={1} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.8, 2.5, 12]} />
        <meshStandardMaterial color="#bfc9d6" roughness={0.35} metalness={0.2} />
        {positions.map((position, index) => (
          <Instance key={index} position={position} />
        ))}
      </Instances>
    </group>
  )
}
