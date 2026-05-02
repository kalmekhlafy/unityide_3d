import { OrbitControls, Stars, Float } from '@react-three/drei'
import { VaultCore } from './VaultCore'
import { FloatingCode } from './FloatingCode'

export function Experience() {
  return (
    <>
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate 
        autoRotateSpeed={0.5}
      />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <VaultCore />
      </Float>
      
      <FloatingCode />

      {/* Ground Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
        <planeGeometry args={[100, 100, 50, 50]} />
        <meshStandardMaterial 
          color="#111" 
          wireframe 
          transparent 
          opacity={0.1}
        />
      </mesh>
    </>
  )
}
