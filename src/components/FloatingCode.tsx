import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

const SNIPPETS = [
  "encrypt($data, 'AES-256-GCM')",
  "VaultService::isolate($teamIds)",
  "UnityIDE -> Secure Vault",
  "Team Alpha -> UserController",
  "Ship to Production -> One Click"
]

export function FloatingCode() {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
  })

  return (
    <group ref={groupRef}>
      {SNIPPETS.map((text, i) => (
        <group
          key={i}
          position={[
            Math.sin((i / SNIPPETS.length) * Math.PI * 2) * 5,
            Math.cos(i * 2) * 2,
            Math.cos((i / SNIPPETS.length) * Math.PI * 2) * 5
          ]}
        >
          <Html transform occlude>
            <div style={{
              background: 'rgba(0, 242, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '10px 20px',
              border: '1px solid rgba(0, 242, 255, 0.3)',
              borderRadius: '8px',
              color: '#00f2ff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              {text}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
