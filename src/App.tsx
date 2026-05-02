import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'
import { UIOverlay } from './components/UIOverlay'

function App() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', background: '#050505' }}>
      <Suspense fallback={<div style={{ color: 'white', position: 'absolute', top: '50%', left: '50%' }}>Loading Experience...</div>}>
        <Canvas shadows camera={{ position: [0, 0, 10], fov: 50 }}>
          <Experience />
        </Canvas>
      </Suspense>
      <UIOverlay />
    </div>
  )
}

export default App
