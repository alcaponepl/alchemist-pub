import { forwardRef } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { ThreeElements } from '@react-three/fiber'

type GLTFNodes = {
  Windturbine_Support: Mesh
  Windturbine_Blades: Mesh
}

type GLTFMaterials = {
  Windmill: MeshStandardMaterial
}

const MODEL_PATH = '/models/Windmill.glb'

export const Windmill = forwardRef<Group, ThreeElements['group']>((props, bladesRef) => {
  const { nodes, materials } = useGLTF(MODEL_PATH) as unknown as {
    nodes: GLTFNodes
    materials: GLTFMaterials
  }

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.Windturbine_Support.geometry}
        material={materials.Windmill}
        scale={[0.401, 0.401, 0.472]}
      />
      <group ref={bladesRef} position={[0, 13.162, 0.564]}>
        <mesh
          geometry={nodes.Windturbine_Blades.geometry}
          material={materials.Windmill}
          scale={[0.401, 0.401, 0.472]}
        />
      </group>
    </group>
  )
})

Windmill.displayName = 'Windmill'

useGLTF.preload(MODEL_PATH)
