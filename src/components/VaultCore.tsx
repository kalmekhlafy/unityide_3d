import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Octahedron } from '@react-three/drei'
import * as THREE from 'three'

export function VaultCore() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const innerRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    meshRef.current.rotation.y = time * 0.5
    meshRef.current.rotation.x = time * 0.3
    innerRef.current.rotation.y = -time * 0.8
  })

  return (
    <group>
      {/* Outer Shield */}
      <Octahedron ref={meshRef} args={[1, 0]} scale={2}>
        <meshStandardMaterial
          color="#00f2ff"
          wireframe
          transparent
          opacity={0.3}
        />
      </Octahedron>

      {/* Inner Core */}
      <Sphere ref={innerRef} args={[0.6, 32, 32]}>
        <meshStandardMaterial
          color="#7000ff"
          emissive="#7000ff"
          emissiveIntensity={2}
          roughness={0.1}
        />
      </Sphere>

      {/* Glow */}
      <pointLight position={[0, 0, 0]} color="#7000ff" intensity={5} distance={10} />
      <pointLight position={[2, 2, 2]} color="#00f2ff" intensity={2} distance={10} />
    </group>
  )
}
