import { Canvas } from '@react-three/fiber'
import { Experience } from './components/Experience'
import { UIOverlay } from './components/UIOverlay'

function App() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas shadows>
        <Experience />
      </Canvas>
      <UIOverlay />
    </div>
  )
}

export default App
