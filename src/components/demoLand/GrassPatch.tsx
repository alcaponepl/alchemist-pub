import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { createNoise2D } from 'simplex-noise'
import {
  CircleGeometry,
  DoubleSide,
  PlaneGeometry,
  RawShaderMaterial,
  Vector3,
  Vector4,
} from 'three'
import { fragmentSource, getVertexSource } from './grassShaders'

function mulberry32(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const simplexNoise2D = createNoise2D(mulberry32(1337))

type GrassBladeOptions = {
  width: number
  height: number
  joints: number
}

type Props = {
  bladeOptions?: GrassBladeOptions
  width?: number
  instances?: number
}

const defaultBladeOptions: GrassBladeOptions = {
  width: 0.12,
  height: 1,
  joints: 5,
}

type AttributeData = {
  offsets: number[]
  orientations: number[]
  stretches: number[]
  halfRootAngleSin: number[]
  halfRootAngleCos: number[]
}

function multiplyQuaternions(q1: Vector4, q2: Vector4): Vector4 {
  const x = q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x
  const y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y
  const z = q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z
  const w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w
  return new Vector4(x, y, z, w)
}

export function getDemoLandYPosition(x: number, z: number): number {
  let y = 2 * simplexNoise2D(x / 50, z / 50)
  y += 4 * simplexNoise2D(x / 100, z / 100)
  y += 0.2 * simplexNoise2D(x / 10, z / 10)
  return y
}

export function getDemoLandGroundYPosition(x: number, z: number, _width = 64): number {
  return getDemoLandYPosition(x, z)
}

function getAttributeData(instances: number, width: number): AttributeData {
  const offsets: number[] = []
  const orientations: number[] = []
  const stretches: number[] = []
  const halfRootAngleSin: number[] = []
  const halfRootAngleCos: number[] = []

  const q0 = new Vector4()
  const q1 = new Vector4()

  const tiltMin = -0.25
  const tiltMax = 0.25

  const radius = width * 0.48
  const cellSize = Math.sqrt((Math.PI * radius * radius) / instances)
  const gridHalf = Math.ceil(radius / cellSize)
  const jitter = cellSize * 0.45
  const rand = mulberry32((instances * 1009) ^ ((Math.round(width * 100) * 9176) >>> 0) ^ 0x9e3779b9)

  let count = 0
  for (let row = -gridHalf; row <= gridHalf; row++) {
    for (let col = -gridHalf; col <= gridHalf; col++) {
      const cx = col * cellSize + (rand() - 0.5) * 2 * jitter
      const cz = row * cellSize + (rand() - 0.5) * 2 * jitter
      if (cx * cx + cz * cz > radius * radius) continue

      const offsetY = getDemoLandGroundYPosition(cx, cz, width)
      offsets.push(cx, offsetY, cz)

      let angle = Math.PI - rand() * (2 * Math.PI)
      halfRootAngleSin.push(Math.sin(0.5 * angle))
      halfRootAngleCos.push(Math.cos(0.5 * angle))

      let rotationAxis = new Vector3(0, 1, 0)
      let x = rotationAxis.x * Math.sin(angle / 2)
      let y = rotationAxis.y * Math.sin(angle / 2)
      let z = rotationAxis.z * Math.sin(angle / 2)
      let w = Math.cos(angle / 2)
      q0.set(x, y, z, w).normalize()

      angle = rand() * (tiltMax - tiltMin) + tiltMin
      rotationAxis = new Vector3(1, 0, 0)
      x = rotationAxis.x * Math.sin(angle / 2)
      y = rotationAxis.y * Math.sin(angle / 2)
      z = rotationAxis.z * Math.sin(angle / 2)
      w = Math.cos(angle / 2)
      q1.set(x, y, z, w).normalize()
      const qAfterX = multiplyQuaternions(q0, q1)

      angle = rand() * (tiltMax - tiltMin) + tiltMin
      rotationAxis = new Vector3(0, 0, 1)
      x = rotationAxis.x * Math.sin(angle / 2)
      y = rotationAxis.y * Math.sin(angle / 2)
      z = rotationAxis.z * Math.sin(angle / 2)
      w = Math.cos(angle / 2)
      q1.set(x, y, z, w).normalize()
      const qFinal = multiplyQuaternions(qAfterX, q1)

      orientations.push(qFinal.x, qFinal.y, qFinal.z, qFinal.w)
      // Keep a floor on blade height to avoid local "bald patches".
      stretches.push(count < instances / 3 ? 0.65 + rand() * 1.35 : 0.45 + rand() * 0.9)
      count++
    }
  }

  return { offsets, orientations, stretches, halfRootAngleCos, halfRootAngleSin }
}

export const GrassPatch = ({
  bladeOptions = defaultBladeOptions,
  width = 100,
  instances = 50000,
}: Props) => {
  const materialRef = useRef<RawShaderMaterial>(null)

  const attributeData = useMemo(() => getAttributeData(instances, width), [instances, width])

  const baseGeometry = useMemo(() => {
    const geo = new PlaneGeometry(
      bladeOptions.width,
      bladeOptions.height,
      1,
      bladeOptions.joints,
    )
    geo.translate(0, bladeOptions.height / 2, 0)
    return geo
  }, [bladeOptions.height, bladeOptions.joints, bladeOptions.width])

  const grassRadius = width * 0.48

  const groundGeo = useMemo(() => {
    const segments = 192
    const geometry = new CircleGeometry(grassRadius, segments)
    geometry.rotateX(-Math.PI / 2)

    const positions = geometry.attributes.position
    const sampleStep = 0.45
    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      let minY = getDemoLandGroundYPosition(x, z, width)
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const sy = getDemoLandGroundYPosition(x + dx * sampleStep, z + dz * sampleStep, width)
          if (sy < minY) minY = sy
        }
      }
      // Keep ground under the grass canopy in every local neighborhood.
      positions.setY(i, minY - 0.16)
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
    return geometry
  }, [width, grassRadius])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime / 4
    }
  })

  return (
    <group>
      <mesh frustumCulled={false}>
        <instancedBufferGeometry
          index={baseGeometry.index}
          attributes-position={baseGeometry.attributes.position}
          attributes-uv={baseGeometry.attributes.uv}
        >
          <instancedBufferAttribute
            attach="attributes-offset"
            args={[new Float32Array(attributeData.offsets), 3]}
          />
          <instancedBufferAttribute
            attach="attributes-orientation"
            args={[new Float32Array(attributeData.orientations), 4]}
          />
          <instancedBufferAttribute
            attach="attributes-stretch"
            args={[new Float32Array(attributeData.stretches), 1]}
          />
          <instancedBufferAttribute
            attach="attributes-halfRootAngleSin"
            args={[new Float32Array(attributeData.halfRootAngleSin), 1]}
          />
          <instancedBufferAttribute
            attach="attributes-halfRootAngleCos"
            args={[new Float32Array(attributeData.halfRootAngleCos), 1]}
          />
        </instancedBufferGeometry>
        <rawShaderMaterial
          ref={materialRef}
          uniforms={{
            time: { value: 0 },
          }}
          vertexShader={getVertexSource(bladeOptions.height)}
          fragmentShader={fragmentSource}
          side={DoubleSide}
          transparent
          depthTest
        />
      </mesh>

      <mesh geometry={groundGeo} renderOrder={-1} receiveShadow>
        <meshStandardMaterial
          color="#1a6e10"
          roughness={1}
          metalness={0}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}
